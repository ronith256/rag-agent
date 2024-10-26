from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, UploadFile
from fastapi.responses import StreamingResponse
from datetime import datetime
import time
import asyncio
import json
import uuid
import numpy as np
from motor.motor_asyncio import AsyncIOMotorDatabase
from core.models import ChatRequest, RAGAgent, RAGConfig
from services.rag_service import RAGService
from services.llm_service import LLMService
from services.embeddings_service import EmbeddingsService
from ..dependencies import get_db, get_llm_service, get_embeddings_service, get_rag_service
from langchain_core.messages import AIMessage, HumanMessage

router = APIRouter()

def cosine_similarity(embedding1, embedding2):
    return np.dot(embedding1, embedding2) / (np.linalg.norm(embedding1) * np.linalg.norm(embedding2))

@router.post("/{agent_id}/evaluate")
async def evaluate(
    agent_id: str,
    evaluation_set: UploadFile,
    background_tasks: BackgroundTasks,
    db: AsyncIOMotorDatabase = Depends(get_db),
    llm_service: LLMService = Depends(get_llm_service)
):
    agent = await db.agents.find_one({"id": agent_id})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Read and validate evaluation set
    try:
        content = await evaluation_set.read()
        eval_data = json.loads(content)
        if not isinstance(eval_data, list) or not all(isinstance(item, dict) and "question" in item and "answer" in item for item in eval_data):
            raise ValueError("Invalid evaluation set format")
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    job_id = str(uuid.uuid4())
    await db.evaluation_jobs.insert_one({
        "_id": job_id,
        "agent_id": agent_id,
        "status": "processing",
        "progress": 0.0,
        "total_questions": len(eval_data),
        "processed_questions": 0,
        "created_at": datetime.utcnow()
    })

    async def process_evaluation():
        try:
            # Initialize services
            rag_config = RAGConfig(**agent["config"])
            embeddings_service = get_embeddings_service(rag_config.advancedEmbeddingsConfig)
            rag_service = get_rag_service(llm_service, embeddings_service)
            rag_chain = rag_service.get_rag_chain(rag_config)
            embeddings = embeddings_service.get_embeddings()

            evaluation_results = []
            total_questions = len(eval_data)

            for idx, qa_pair in enumerate(eval_data):
                try:
                    # Generate RAG response
                    response = await rag_chain.ainvoke({
                        "input": qa_pair["question"],
                        "chat_history": []
                    })
                    generated_answer = response.get("answer", "")

                    # Generate embeddings for both answers
                    original_embedding = embeddings.embed_query(qa_pair["answer"])
                    generated_embedding = embeddings.embed_query(generated_answer)

                    # Calculate similarity score
                    similarity_score = cosine_similarity(original_embedding, generated_embedding)

                    # Store result
                    result = {
                        "question": qa_pair["question"],
                        "original_answer": qa_pair["answer"],
                        "generated_answer": generated_answer,
                        "similarity_score": float(similarity_score)  # Convert numpy float to Python float
                    }
                    evaluation_results.append(result)

                    # Update progress
                    await db.evaluation_jobs.update_one(
                        {"_id": job_id},
                        {
                            "$inc": {"processed_questions": 1},
                            "$set": {"progress": (idx + 1) / total_questions}
                        }
                    )

                except Exception as e:
                    # Log error but continue with other questions
                    print(f"Error processing question {idx + 1}: {str(e)}")
                    await db.evaluation_jobs.update_one(
                        {"_id": job_id},
                        {"$push": {"errors": f"Error on question {idx + 1}: {str(e)}"}}
                    )

            # Calculate aggregate metrics
            similarity_scores = [result["similarity_score"] for result in evaluation_results]
            aggregate_metrics = {
                "mean_similarity": float(np.mean(similarity_scores)),
                "median_similarity": float(np.median(similarity_scores)),
                "min_similarity": float(np.min(similarity_scores)),
                "max_similarity": float(np.max(similarity_scores)),
                "std_similarity": float(np.std(similarity_scores))
            }

            # Store final results
            await db.evaluations.insert_one({
                "agent_id": agent_id,
                "job_id": job_id,
                "timestamp": datetime.utcnow(),
                "results": evaluation_results,
                "aggregate_metrics": aggregate_metrics,
                "status": "completed"
            })

            # Update job status to completed
            await db.evaluation_jobs.update_one(
                {"_id": job_id},
                {
                    "$set": {
                        "status": "completed",
                        "progress": 1.0,
                        "completion_time": datetime.utcnow()
                    }
                }
            )

        except Exception as e:
            # Update job status to failed
            await db.evaluation_jobs.update_one(
                {"_id": job_id},
                {
                    "$set": {
                        "status": "failed",
                        "error": str(e),
                        "completion_time": datetime.utcnow()
                    }
                }
            )

            await db.evaluations.insert_one({
                "agent_id": agent_id,
                "job_id": job_id,
                "timestamp": datetime.utcnow(),
                "results": evaluation_results,
                "aggregate_metrics": aggregate_metrics,
                "status": "failed",
                "error": str(e)
            })

    # Start processing in background
    background_tasks.add_task(process_evaluation)
    return {"job_id": job_id}

@router.get("/evaluation-jobs/{job_id}")
async def get_evaluation_status(
    job_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    job = await db.evaluation_jobs.find_one({"_id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Evaluation job not found")
    return job

@router.get("/{agent_id}/evaluations")
async def get_agent_evaluations(
    agent_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    evaluations = await db.evaluations.find({"agent_id": agent_id}, {'_id': False}).sort("timestamp", -1).to_list(None)
    if not evaluations:
        return []
    return evaluations