# File: app/core/models.py
from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional, Dict, Any
import uuid

class S3Config(BaseModel):
    bucket_name: str
    region_name: str
    aws_access_key: str
    aws_secret_key: str

class EmbeddingsConfig(BaseModel):
    model: str
    base_url: Optional[str]
    api_key: Optional[str]
    embedding_type: str
    huggingface_model: Optional[str]

class SQLConfig(BaseModel):
    url: str
    username: str
    password: str
    db_name: str

class LLMConfig(BaseModel):
    model: str
    base_url: Optional[str] = None
    api_key: str
    temperature: Optional[float] = None
    api_type: str

class RAGConfig(BaseModel):
    llm: str
    embeddings_model: str
    collection: str
    system_prompt: Optional[str] = None
    contextualization_prompt: Optional[str] = None
    temperature: Optional[float] = None
    advancedLLMConfig: Optional[LLMConfig] = None
    advancedEmbeddingsConfig: Optional[EmbeddingsConfig] = None
    sql_config: Optional[SQLConfig] = None 
    s3_config: Optional[S3Config] = None

class Message(BaseModel):
    role: str
    content: str

class RAGAgent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    config: RAGConfig
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ChatRequest(BaseModel):
    agent_id: str
    messages: List[Message]

class JobStatus(BaseModel):
    id: str
    status: str
    progress: float
    error: Optional[str] = None

class UsageMetrics(BaseModel):
    agent_id: str
    date: datetime
    calls: int = 0
    first_token_latency: Optional[float] = 0.0
    total_response_time: Optional[float] = 0.0