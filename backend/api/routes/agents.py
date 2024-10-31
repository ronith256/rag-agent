# File: app/api/routes/agents.py
from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List
from core.models import RAGAgent
from ..dependencies import get_db
from config.settings import Settings
import json

router = APIRouter()

settings = Settings()
MODELS_CONFIG = settings.get_models_config()

@router.post("", response_model=RAGAgent)
async def create_agent(
    agent: RAGAgent,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    agent_dict = agent.model_dump()
    print(agent_dict)
    await db.agents.insert_one(agent_dict)
    return agent

@router.get("/user/{user_id}", response_model=List[RAGAgent])
async def get_user_agents(
    user_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    agents = await db.agents.find({"user_id": user_id}).to_list(None)
    return [RAGAgent(**agent) for agent in agents]

@router.patch("/{agent_id}", response_model=RAGAgent)
async def update_agent(
    agent_id: str,
    agent_update: RAGAgent,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    existing_agent = await db.agents.find_one({"id": agent_id})
    if not existing_agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    update_data = {
        k: v for k, v in agent_update.model_dump(exclude_unset=True).items()
        if v is not None
    }
    update_data.pop("id", None)
    
    result = await db.agents.update_one(
        {"id": agent_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Update failed")
    
    updated_agent = await db.agents.find_one({"id": agent_id})
    return RAGAgent(**updated_agent)

@router.delete("/{agent_id}")
async def delete_agent(
    agent_id: str,
    user_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    # Verify agent exists and belongs to user
    existing_agent = await db.agents.find_one({"id": agent_id, "user_id": user_id})
    if not existing_agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Delete the agent
    result = await db.agents.delete_one({"id": agent_id, "user_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=400, detail="Delete failed")
    
    # Also delete related data
    await db.metrics.delete_many({"agent_id": agent_id})
    await db.evaluations.delete_many({"agent_id": agent_id})
    
    return {"message": "Agent deleted successfully"}

@router.get("/models")
async def get_models(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Returns available models as a dictionary with model IDs as keys and display names as values"""
    default_models = {
        "gpt-4": "GPT-4",
        "gpt-3.5-turbo": "GPT-3.5 Turbo",
        "gemini-pro": "Gemini Pro",
        "text-embedding-ada-002": "Ada 002 Embeddings"
    }

    try:
        return {
            model_id: config.get("name", default_models.get(model_id, model_id))
            for model_id, config in MODELS_CONFIG.items()
        }
    except Exception:
        # Fallback to default models if there's any error
        return default_models