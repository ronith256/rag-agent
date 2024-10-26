from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, BackgroundTasks
from typing import List
import uuid
import os
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from core.models import RAGAgent, RAGConfig
from services.document_service import DocumentService
from services.storage_service import StorageService
from services.embeddings_service import EmbeddingsService
from ..dependencies import get_db, get_document_service, get_embeddings_service, get_storage_service
from config.settings import settings
import aiofiles
import asyncio

router = APIRouter()

@router.post("/{agent_id}/documents")
async def add_document(
    agent_id: str,
    file: UploadFile,
    db: AsyncIOMotorDatabase = Depends(get_db),
    embeddings_service: EmbeddingsService = Depends(get_embeddings_service)
):
    agent = await db.agents.find_one({"id": agent_id})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = settings.UPLOAD_DIR / unique_filename

    # Ensure upload directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    # Save file using aiofiles
    async with aiofiles.open(file_path, "wb") as buffer:
        content = await file.read()
        await buffer.write(content)

    job_id = str(uuid.uuid4())
    await db.jobs.insert_one({
        "_id": job_id,
        "agent_id": agent_id,
        "status": "processing",
        "progress": 0.0,
        "created_at": datetime.utcnow()
    })

    storage_service = get_storage_service()
    document_service = get_document_service(embeddings_service, storage_service)
    
    try:
        await document_service.process_document(
            file_path,
            agent["config"]["collection"],
            file_extension.lstrip('.')
        )
        
        # Clean up the temporary file
        os.remove(file_path)
        
        await db.jobs.update_one(
            {"_id": job_id},
            {"$set": {"status": "completed", "progress": 1.0}}
        )
    except Exception as e:
        # Clean up the temporary file even if processing failed
        if os.path.exists(file_path):
            os.remove(file_path)
            
        await db.jobs.update_one(
            {"_id": job_id},
            {"$set": {"status": "failed", "error": str(e)}}
        )
        raise HTTPException(status_code=500, detail=str(e))
    
    return {"job_id": job_id}

@router.post("/{agent_id}/documents/bulk")
async def bulk_add_documents(
    agent_id: str,
    files: List[UploadFile],
    background_tasks: BackgroundTasks,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    agent = await db.agents.find_one({"id": agent_id})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Ensure upload directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    job_id = str(uuid.uuid4())
    await db.jobs.insert_one({
        "_id": job_id,
        "agent_id": agent_id,
        "status": "processing",
        "progress": 0.0,
        "created_at": datetime.utcnow(),
        "total_files": len(files),
        "processed_files": 0,
        "errors": []
    })

    # Save all files first and store their paths
    file_paths = []
    for file in files:
        try:
            file_extension = os.path.splitext(file.filename)[1]
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            file_path = settings.UPLOAD_DIR / unique_filename
            
            # Save using aiofiles
            content = await file.read()  # Read the file content first
            async with aiofiles.open(file_path, "wb") as buffer:
                await buffer.write(content)
            
            file_paths.append({
                "path": file_path,
                "extension": file_extension.lstrip('.'),
                "original_name": file.filename
            })
        except Exception as e:
            # If there's an error saving a file, log it but continue with others
            error_message = f"Error saving {file.filename}: {str(e)}"
            await db.jobs.update_one(
                {"_id": job_id},
                {"$push": {"errors": error_message}}
            )

    # Initialize services with agent configuration
    rag_config = RAGConfig(**agent["config"])
    embeddings_service = get_embeddings_service(rag_config.advancedEmbeddingsConfig)
    storage_service = get_storage_service(rag_config.s3_config)
    document_service = get_document_service(embeddings_service, storage_service)

    async def process_files():
        try:
            for file_info in file_paths:
                try:
                    await document_service.process_document(
                        file_info["path"],
                        agent["config"]["collection"],
                        file_info["extension"]
                    )

                    # Clean up the temporary file
                    if os.path.exists(file_info["path"]):
                        os.remove(file_info["path"])

                    # Update progress
                    await db.jobs.update_one(
                        {"_id": job_id},
                        {
                            "$inc": {"processed_files": 1},
                            "$set": {"progress": (await db.jobs.find_one({"_id": job_id}))["processed_files"] / len(files)}
                        }
                    )

                except Exception as e:
                    error_message = f"Error processing {file_info['original_name']}: {str(e)}"
                    await db.jobs.update_one(
                        {"_id": job_id},
                        {"$push": {"errors": error_message}}
                    )
                    # Clean up the temporary file if it exists
                    if os.path.exists(file_info["path"]):
                        os.remove(file_info["path"])

            # Update final status
            job = await db.jobs.find_one({"_id": job_id})
            final_status = "completed" if job["processed_files"] == len(files) else "completed_with_errors"
            
            await db.jobs.update_one(
                {"_id": job_id},
                {"$set": {"status": final_status}}
            )

        except Exception as e:
            # Clean up any remaining temporary files
            for file_info in file_paths:
                if os.path.exists(file_info["path"]):
                    os.remove(file_info["path"])
                    
            await db.jobs.update_one(
                {"_id": job_id},
                {"$set": {"status": "failed", "error": str(e)}}
            )

    # Start processing files in the background
    background_tasks.add_task(process_files)
    
    return {"job_id": job_id}

@router.get("/jobs/{job_id}")
async def get_job_status(
    job_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    job = await db.jobs.find_one({"_id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if "total_files" in job:
        job["progress"] = job.get("processed_files", 0) / job["total_files"]
    
    return job