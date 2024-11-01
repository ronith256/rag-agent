# 🤖 RAG Agent Platform

An enterprise-grade RAG (Retrieval Augmented Generation) chat platform with advanced agent management, analytics, and evaluation capabilities.

## ✨ Features

- 🎯 Multi-model support (GPT-4, GPT-3.5, Gemini Pro, BYOM)
- 📊 Real-time analytics and metrics tracking
- 📝 Document processing and management
- 🔄 Agent configuration and customization
- 📈 Performance evaluation 
- 👥 User management and agent sharing
- 🔒 Firebase authentication
- 🎨 Modern UI with Tailwind CSS
- 📱 Responsive design
- 🚀 Real-time streaming responses

## 🛠️ Tech Stack

### Backend
- FastAPI
- MongoDB
- Motor (async MongoDB driver)
- LangChain
- Firebase Admin SDK
- Boto3 (AWS S3)

### Frontend
- React
- TypeScript
- Tailwind CSS
- Firebase Auth
- Recharts
- Lucide Icons
- shadcn/ui components

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- Python (3.11+)
- Docker and Docker Compose
- MongoDB
- Firebase account
- API keys for LLM services

### Environment Setup

1. **Backend Environment**
   Copy `.backend.env.example` to `.env` and fill in:
   ```env
   LLAMA_API_KEY=your_llama_api_key
   GEMINI_API_KEY=your_gemini_api_key
   EMBEDDINGS_API_KEY=your_embeddings_api_key
   LANGCHAIN_TRACING_V2=true
   LANGCHAIN_ENDPOINT="your_langchain_endpoint"
   LANGCHAIN_API_KEY="your_langchain_api_key"
   LANGCHAIN_PROJECT="your_project_name"
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_PRIVATE_KEY_ID=your_private_key_id
   FIREBASE_PRIVATE_KEY="your_private_key"
   FIREBASE_CLIENT_EMAIL=your_client_email
   FIREBASE_CLIENT_ID=your_client_id
   FIREBASE_CLIENT_X509_CERT_URL=your_cert_url
   FRONTEND_URL="url of the frontend server"
   ```

2. **Frontend Environment**
   Copy `.frontend.env.example` to `.frontend.env` and fill in:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_ADMIN_EMAIL=ronith@getqest.com
   # VITE_API_URL=http://backend:5984
   VITE_BACKEND_BASE_URL=your backend url
   PORT=port to start frontend
   ```

### Installation

#### Using Docker (Recommended)

1. Build and start the containers:
   ```bash
   docker-compose up --build
   ```

The application will be available at:
- Frontend: http://localhost:3349
- Backend: http://localhost:5984
- MongoDB: localhost:27017

#### Manual Setup

1. **Backend Setup**
   ```bash
   # Create and activate virtual environment
   python -m venv venv
   source venv/bin/activate  # Unix
   .\venv\Scripts\activate   # Windows

   # Install dependencies
   pip install -r requirements.txt

   # Start the backend server
   cd backend
   uvicorn app.main:app --host 0.0.0.0 --port 5984 --reload
   ```

2. **Frontend Setup**
   ```bash
   # Install dependencies
   npm install

   # Start development server
   npm run dev
   ```

## 📁 Project Structure

```
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   └── dependencies.py
│   │   ├── config/
│   │   ├── core/
│   │   └── services/
│   └── main.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── types/
│   └── App.tsx
├── docker-compose.yml
├── backend.Dockerfile
└── frontend.Dockerfile
```

## 🔧 Configuration

### MongoDB Setup
The application uses MongoDB for data storage. Collections:
- `agents`: Stores agent configurations
- `metrics`: Stores usage metrics
- `evaluations`: Stores evaluation results
- `jobs`: Stores processing job status

### Firebase Setup
1. Create a Firebase project
2. Enable Authentication with Google provider
3. Create a service account and download credentials
4. Update environment variables with Firebase configuration

### Agent Configuration
Agents can be configured with:
- Custom LLM settings
- Embeddings configurations
- SQL database connections
- S3 storage settings

## 🚀 Usage

1. **Authentication**
   - Log in using Google authentication
   - Admin users have access to user management

2. **Creating an Agent**
   - Click "Create Agent" in sidebar
   - Configure basic settings
   - Set up advanced options if needed
   - Upload training documents

3. **Using Agents**
   - Select an agent from the list
   - Upload documents for context
   - Start chatting with the agent
   - View API integration details

4. **Analytics**
   - View usage metrics
   - Monitor response times
   - Track agent performance

5. **Evaluations**
   - Upload evaluation datasets
   - Run performance tests
   - View detailed results

## 🔍 Monitoring

### Metrics Available
- Daily usage counts
- First token latency
- Total response time
- Evaluation scores
- Document processing status

### Logs
- Application logs in Docker containers
- MongoDB query logs
- Firebase authentication logs

## 🛠️ Development

### Adding New Features
1. Create feature branch
2. Implement backend endpoints
3. Add frontend components
4. Update types and documentation
5. Test thoroughly
6. Create pull request

### Code Style
- Backend: PEP 8
- Frontend: ESLint configuration
- Use TypeScript for type safety
- Follow component structure

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection**
   ```bash
   # Check MongoDB status
   docker-compose ps mongodb
   # View MongoDB logs
   docker-compose logs mongodb
   ```

2. **Firebase Authentication**
   - Verify environment variables
   - Check Firebase console for errors
   - Confirm API keys and permissions

3. **Document Processing**
   - Check upload directory permissions
   - Verify file formats
   - Monitor job status in database

4. **Agent Response Issues**
   - Verify LLM API keys
   - Check model availability
   - Monitor response timeouts
