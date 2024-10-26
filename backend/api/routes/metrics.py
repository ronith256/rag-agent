# File: app/api/routes/metrics.py
from fastapi import APIRouter, Depends
from datetime import datetime
from typing import List
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import json_util
import json
from ..dependencies import get_db

router = APIRouter()

class JSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, bytes):
            return str(obj)
        return json_util.default(obj)

@router.get("/agent/{agent_id}")
async def get_agent_metrics(
    agent_id: str,
    start_date: datetime,
    end_date: datetime,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    metrics = await db.metrics.find({
        "agent_id": agent_id,
        "date": {
            "$gte": start_date,
            "$lte": end_date
        }
    }).to_list(None)
    
    return json.loads(json.dumps(metrics, cls=JSONEncoder))
