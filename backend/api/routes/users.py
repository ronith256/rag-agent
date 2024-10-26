# File: app/api/routes/users.py
from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List
import firebase_admin
from firebase_admin import auth
from ..dependencies import get_db
import uuid

router = APIRouter()

@router.get("")
async def get_users(db: AsyncIOMotorDatabase = Depends(get_db)):
    try:
        # List all users from Firebase
        users = auth.list_users().iterate_all()
        return [{"uid": user.uid, "email": user.email} for user in users]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/share-agent")
async def share_agent(
    agent_id: str,
    target_user_ids: List[str],
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    try:
        # Get the original agent
        agent = await db.agents.find_one({"id": agent_id})
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")

        # Create copies of the agent for each target user
        shared_agents = []
        for user_id in target_user_ids:
            new_agent = {
                **agent,
                "id": str(uuid.uuid4()),
                "user_id": user_id
            }
            await db.agents.insert_one(new_agent)
            shared_agents.append(new_agent)

        return shared_agents
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))