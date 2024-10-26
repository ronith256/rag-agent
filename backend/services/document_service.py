# File: app/services/document_service.py
from pathlib import Path
from typing import BinaryIO
from langchain_community.document_loaders import PyPDFLoader, UnstructuredWordDocumentLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from .embeddings_service import EmbeddingsService
from .storage_service import StorageService

class DocumentService:
    def __init__(
        self,
        embeddings_service: EmbeddingsService,
        storage_service: StorageService
    ):
        self.embeddings_service = embeddings_service
        self.storage_service = storage_service

    async def process_document(
        self,
        file_path: Path,
        collection_name: str,
        file_type: str
    ):
        try:
            if file_type == 'pdf':
                loader = PyPDFLoader(str(file_path))
            elif file_type in ['docx', 'doc']:
                loader = UnstructuredWordDocumentLoader(str(file_path))
            else:
                raise ValueError("Unsupported file type")

            docs = loader.load()
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200
            )
            splits = text_splitter.split_documents(docs)
            
            vector_store = self.embeddings_service.get_vector_store(collection_name)
            vector_store.add_documents(splits)
            
            return True
        except Exception as e:
            raise Exception(f"Error processing document: {str(e)}")

    async def process_s3_document(
        self,
        file_key: str,
        collection_name: str,
        file_type: str
    ):
        try:
            file_content = await self.storage_service.download_from_s3(file_key)
            # Process the file content similarly to local files
            # Implementation depends on how you want to handle S3 files
            return True
        except Exception as e:
            raise Exception(f"Error processing S3 document: {str(e)}")
