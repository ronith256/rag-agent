# File: app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import agents, chat, documents, metrics, users, evaluation
from config.firebase import initialize_firebase
import os
from dotenv import load_dotenv

# Initialize Firebase Admin SDK
load_dotenv('.backend.env')
initialize_firebase()

app = FastAPI(
    title="RAG Chat API",
    description="Enhanced RAG API with agent management and metrics tracking",
    version="2.0.0",
    docs_url="/",
)

url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
print(f'link: {url}')

app.add_middleware(
    CORSMiddleware,
    allow_origins=[url, "http://localhost:5173", "https://ragui.duckgpt.tech", "http://172.18.0.4:3000/"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agents.router, prefix="/api/agents", tags=["agents"])
app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(documents.router, prefix="/api/agents", tags=["documents"])
app.include_router(metrics.router, prefix="/api/metrics", tags=["metrics"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(evaluation.router, prefix="/api/agents", tags=["evaluation"])

if __name__ == "__main__":
    import uvicorn
    host = os.environ.get('HOST', '0.0.0.0')
    port = os.environ.get('PORT', 5984)
    uvicorn.run(app, host="0.0.0.0", port=port)