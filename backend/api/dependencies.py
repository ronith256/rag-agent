# File: app/api/dependencies.py
from motor.motor_asyncio import AsyncIOMotorClient
from config.settings import settings
from services.llm_service import LLMService
from services.embeddings_service import EmbeddingsService
from services.rag_service import RAGService
from services.document_service import DocumentService
from services.storage_service import StorageService

async def get_db():
    client = AsyncIOMotorClient(settings.MONGO_URI)
    return client[settings.DB_NAME]

def get_llm_service():
    return LLMService(settings.get_models_config())

def get_embeddings_service(embeddings_config=None):
    return EmbeddingsService(embeddings_config)

def get_storage_service(s3_config=None):
    return StorageService(s3_config)

def get_rag_service(
    llm_service: LLMService,
    embeddings_service: EmbeddingsService
):
    return RAGService(llm_service, embeddings_service)

def get_document_service(
    embeddings_service: EmbeddingsService,
    storage_service: StorageService
):
    return DocumentService(embeddings_service, storage_service)
