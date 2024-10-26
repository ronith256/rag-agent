# File: app/services/embeddings_service.py
from langchain_openai import OpenAIEmbeddings
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from core.models import EmbeddingsConfig
from typing import Optional
import os

class EmbeddingsService:
    def __init__(self, config: Optional[EmbeddingsConfig] = None):
        self.config = config

    def get_embeddings(self):
        if not self.config:
            return OpenAIEmbeddings(
                base_url='https://api.xty.app/v1',
                api_key=os.getenv("EMBEDDINGS_API_KEY")
            )
        print(self.config)

        if self.config.embedding_type.lower() == 'huggingface':
            return HuggingFaceEmbeddings(model_name=self.config.huggingface_model)
        
        return OpenAIEmbeddings(
            model=self.config.model,
            base_url=self.config.base_url,
            api_key=self.config.api_key
        )

    def get_vector_store(self, collection_name: str):
        embeddings = self.get_embeddings()
        return Chroma(collection_name, embedding_function=embeddings, persist_directory='./db')
