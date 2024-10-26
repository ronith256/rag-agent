# File: app/services/rag_service.py
from langchain.chains import create_history_aware_retriever, create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from core.models import RAGConfig
from .llm_service import LLMService
from .embeddings_service import EmbeddingsService

class RAGService:
    def __init__(
        self,
        llm_service: LLMService,
        embeddings_service: EmbeddingsService
    ):
        self.llm_service = llm_service
        self.embeddings_service = embeddings_service
        self.DEFAULT_SYSTEM_PROMPT = ("You are an assistant for question-answering tasks. "
    "Use the following pieces of retrieved context to answer "
    "the question. If you don't know the answer, say that you "
    "don't know. You should use the context and retrieved information to give the best answer in Human Like fashion."
    "\n\n"
    "{context}")

    def get_rag_chain(self, config: RAGConfig):
        llm = self.llm_service.get_llm(config)
        vector_store = self.embeddings_service.get_vector_store(config.collection)
        retriever = vector_store.as_retriever()

        contextualize_q_system_prompt = (
            "Given a chat history and the latest user question "
            "which might reference context in the chat history, "
            "formulate a standalone question which can be understood "
            "without the chat history. Do NOT answer the question, "
            "just reformulate it if needed and otherwise return it as is."
        )

        if config.contextualization_prompt:
            contextualize_q_system_prompt = config.contextualization_prompt

        contextualize_q_prompt = ChatPromptTemplate.from_messages([
            ("system", contextualize_q_system_prompt),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ])

        history_aware_retriever = create_history_aware_retriever(
            llm, retriever, contextualize_q_prompt
        )

        qa_prompt = ChatPromptTemplate.from_messages([
            ("system", config.system_prompt or self.DEFAULT_SYSTEM_PROMPT),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ])

        question_answer_chain = create_stuff_documents_chain(llm, qa_prompt)
        return create_retrieval_chain(history_aware_retriever, question_answer_chain)
