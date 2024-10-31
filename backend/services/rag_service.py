# File: app/services/rag_service.py
from langchain.chains import create_history_aware_retriever, create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder, PromptTemplate
from core.models import RAGConfig
from .llm_service import LLMService
from .embeddings_service import EmbeddingsService
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableLambda, RunnableParallel
from langchain_community.tools.sql_database.tool import QuerySQLDataBaseTool
from langchain_community.utilities import SQLDatabase
from operator import itemgetter
from langchain_core.output_parsers import JsonOutputParser

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
        self.DEFAULT_CONTEXTUALIZATION_PROMPT = (
            "Given a chat history and the latest user question "
            "which might reference context in the chat history, "
            "formulate a standalone question which can be understood "
            "without the chat history. Do NOT answer the question, "
            "just reformulate it if needed and otherwise return it as is."
        )
    
    def get_chain(self, config: RAGConfig, chain_type=None):
        if chain_type:
            if chain_type == 'RAG ONLY':
                return self.get_rag_chain(config)
            elif chain_type == 'SQL ONLY':
                return self.get_sql_chain(config)
            elif chain_type == 'RAG + SQL':
                return self.get_sql_rag_chain(config)
        else:
            if config.sql_config:
                return self.get_sql_rag_chain(config)
            else:
                return self.get_rag_chain(config)


    def get_rag_chain(self, config: RAGConfig):
        llm = self.llm_service.get_llm(config)
        vector_store = self.embeddings_service.get_vector_store(config.collection)
        retriever = vector_store.as_retriever()
        contextualize_q_system_prompt = self.DEFAULT_CONTEXTUALIZATION_PROMPT
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

    def get_sql_chain(self, config: RAGConfig):
        sql_config = config.sql_config
        if not sql_config:
            return 
        llm = self.llm_service.get_llm(config)
        sql_uri = f'postgresql://{sql_config.username}:{sql_config.password}@{sql_config.url}/{sql_config.db_name}'
        sql_db = SQLDatabase.from_uri(sql_uri)
        execute_query = QuerySQLDataBaseTool(db=sql_db)
        
        sql_prompt = PromptTemplate(
            input_variables=['input', 'table_info', 'chat_history'],
            template=(
                "Create a PostgreSQL query for this question." 
                "You can use the chat history for reference to aid you in creating a relevant sql query."
                "If the question does not need information from the database say just $$NOT REQUIRED$$" 
                "Use only needed columns and qualified names (table_name.column_name).\n"
                "Give only the SQL Statement, do not format using markdown.\n"
                "Reference columns using their fully qualified IDs like table_name.column_name.\n\n"
                "Example: SELECT employees.EmployeeName FROM employeesTable\n\n"
                "Question: {input}\n\n"
                "Available tables:\n{table_info}\n\n"
                "Chat History: {chat_history}"
            )
        )

        def get_table_info(db: SQLDatabase):
            return db.run(
                '''
                SELECT
                    table_name || ': [' || string_agg(column_name, ', ') || ']' AS table_columns
                FROM
                    information_schema.columns
                WHERE
                    table_schema = 'public'  
                GROUP BY
                    table_name
                ORDER BY
                    table_name;
                '''
            )
        
        def process_sql_input(inputs):
            return {
                "input": inputs["input"],
                "chat_history": inputs.get("chat_history", []),
                "table_info": get_table_info(sql_db)
            }

        # Create two parallel chains
        sql_generation_chain = (
            RunnableLambda(process_sql_input)
            | sql_prompt
            | llm
            | StrOutputParser()
        )
        
        execution_chain = sql_generation_chain | execute_query
        
        # Combine them using RunnableParallel
        chain = RunnableParallel(
            sql_query=sql_generation_chain,
            query_results=execution_chain
        )
        
        return chain

    def get_sql_rag_chain(self, config: RAGConfig):
        sql_config = config.sql_config
        if not sql_config:
            return 
        llm = self.llm_service.get_llm(config)
        sql_chain = self.get_sql_chain(config)
        vector_store = self.embeddings_service.get_vector_store(config.collection)
        retriever = vector_store.as_retriever()
        
        contextualize_q_system_prompt = self.DEFAULT_CONTEXTUALIZATION_PROMPT
        if config.contextualization_prompt:
            contextualize_q_system_prompt = config.contextualization_prompt

        contextualize_q_prompt = ChatPromptTemplate.from_messages([
            ("system", contextualize_q_system_prompt),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ])
        
        retriever_chain = create_history_aware_retriever(llm, retriever, contextualize_q_prompt)
        
        qa_prompt = ChatPromptTemplate.from_messages([
            ("system", config.system_prompt or f'''
            You are an assistant for question-answering tasks."
            You should use the context and retrieved information to give the best answer in Human Like fashion.
            Answer the given question with the help of the SQL Results and the retrieved Documents. 
            The documents may help you to answer the questions. 
            But this is not always required. For questions which do not require the context or SQL Result to answer, you can answer the question normally. 
            Do not tell the user you're using SQL or Retrieved Documents. Make it seem like you're talking from your own information.
            '''),
            MessagesPlaceholder("chat_history"),
            ("human", "Question: {input}\nSQL Query: {sql_query}\nSQL Result: {sql_result}\nRetrieved Documents: {context}"),
        ])
        
        def combine_inputs(inputs):
            results = sql_chain.invoke(inputs)
            sql_query = results['sql_query']
            sql_result = results['query_results']
            return {
                "sql_query": sql_query,
                "sql_result": sql_result if '$$NOT REQUIRED$$' not in sql_result else 'The question does not require data from the database',
                "context": inputs["context"],
                "input": inputs["input"],
                "chat_history": inputs.get("chat_history", [])
            }
        
        chain = (
            {"context" : retriever_chain, "input": itemgetter("input"), "chat_history": itemgetter("chat_history")}
            | RunnableLambda(combine_inputs)
            | create_stuff_documents_chain(llm, qa_prompt)
        )

        return chain

