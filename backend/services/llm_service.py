# File: app/services/llm_service.py
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from core.models import LLMConfig, RAGConfig
import os

class LLMService:
    def __init__(self, models_config: dict):
        self.models_config = models_config

    def get_llm(self, config: RAGConfig):
        if config.advancedLLMConfig:
            print(config.advancedLLMConfig.api_key)
            return self._get_llm_advanced(config.advancedLLMConfig)
        
        model_name = config.llm
        model_config = self.models_config.get(model_name)
        
        if not model_config:
            raise ValueError(f"Model {model_name} not found in configuration")
        
        if model_config["api_type"] == "OpenAI":
            return ChatOpenAI(
                model=model_name,
                base_url=model_config.get("base_url"),
                api_key=os.getenv(model_config["api_key_env"]),
                temperature=model_config.get("temperature", 0.7)
            )
        elif model_config["api_type"] == "Gemini":
            return ChatGoogleGenerativeAI(
                model=model_name,
                api_key=os.getenv(model_config["api_key_env"])
            )
        else:
            raise ValueError(f"Unsupported API type: {model_config['api_type']}")

    def _get_llm_advanced(self, config: LLMConfig):
        return ChatOpenAI(
            model=config.model,
            base_url=config.base_url,
            api_key=config.api_key,
            temperature=config.temperature
        )