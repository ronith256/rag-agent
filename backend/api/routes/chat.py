# File: app/api/routes/chat.py
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
from datetime import datetime
import time
import asyncio
from motor.motor_asyncio import AsyncIOMotorDatabase
from core.models import ChatRequest, RAGAgent, RAGConfig
from services.rag_service import RAGService
from services.llm_service import LLMService
from services.embeddings_service import EmbeddingsService
from ..dependencies import get_db, get_llm_service, get_embeddings_service, get_rag_service
from langchain_core.messages import AIMessage, HumanMessage

router = APIRouter()

@router.post("/agents/{agent_id}/chat")
async def chat(
    agent_id: str,
    request: ChatRequest,
    background_tasks: BackgroundTasks,
    db: AsyncIOMotorDatabase = Depends(get_db),
    llm_service: LLMService = Depends(get_llm_service)
):
    start_time = time.time()
    agent = await db.agents.find_one({"id": agent_id})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    try:
        # Initialize services with agent configuration
        rag_config = RAGConfig(**agent["config"])
        embeddings_service = get_embeddings_service(rag_config.advancedEmbeddingsConfig)
        rag_service = get_rag_service(llm_service, embeddings_service)
        rag_chain = rag_service.get_chain(rag_config)

        chat_history = [
            HumanMessage(content=msg.content) if msg.role == "user" 
            else AIMessage(content=msg.content)
            for msg in request.messages[:-1]
        ]
        
        metrics_queue = asyncio.Queue()
        
        async def generate_response():
            try:
                is_first_token = True
                async for chunk in rag_chain.astream({
                    "input": request.messages[-1].content,
                    "chat_history": chat_history
                }):
                    if is_first_token:
                        await metrics_queue.put(time.time())
                        is_first_token = False
                    if isinstance(chunk, dict):
                        answer = chunk.get("answer", "")
                    else:
                        answer = str(chunk)
                    yield answer
                
                await metrics_queue.put(None)
            except Exception as e:
                await metrics_queue.put(None)
                raise e

        async def update_metrics():
            try:
                first_token_time = await metrics_queue.get()
                if first_token_time is not None:
                    await metrics_queue.get()
                    end_time = time.time()
                    
                    current_date = datetime.utcnow().replace(
                        hour=0, minute=0, second=0, microsecond=0
                    )
                    
                    first_token_latency = first_token_time - start_time
                    total_response_time = end_time - start_time

                    current_metrics = await db.metrics.find_one({
                        "agent_id": agent_id,
                        "date": current_date
                    })

                    if current_metrics:
                        current_calls = current_metrics.get("calls", 0)
                        current_ftl_avg = current_metrics.get("first_token_latency", 0)
                        current_trt_avg = current_metrics.get("total_response_time", 0)
                        
                        new_calls = current_calls + 1
                        new_ftl_avg = ((current_ftl_avg * current_calls) + first_token_latency) / new_calls
                        new_trt_avg = ((current_trt_avg * current_calls) + total_response_time) / new_calls

                        await db.metrics.update_one(
                            {
                                "agent_id": agent_id,
                                "date": current_date
                            },
                            {
                                "$set": {
                                    "calls": new_calls,
                                    "first_token_latency": new_ftl_avg,
                                    "total_response_time": new_trt_avg
                                }
                            }
                        )
                    else:
                        await db.metrics.insert_one({
                            "agent_id": agent_id,
                            "date": current_date,
                            "calls": 1,
                            "first_token_latency": first_token_latency,
                            "total_response_time": total_response_time
                        })
                else:
                    current_date = datetime.utcnow().replace(
                        hour=0, minute=0, second=0, microsecond=0
                    )
                    await db.metrics.update_one(
                        {
                            "agent_id": agent_id,
                            "date": current_date
                        },
                        {
                            "$inc": {"calls": 1}
                        },
                        upsert=True
                    )
            except Exception as e:
                print(f"Error updating metrics: {str(e)}")

        background_tasks.add_task(update_metrics)
        return StreamingResponse(generate_response(), media_type="text/plain")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))