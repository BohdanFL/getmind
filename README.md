# 🧠 GetMind: AI-Driven Cognitive Ecosystem

**GetMind** is a state-of-the-art Socratic tutoring platform designed for deep research and long-term knowledge retention. By leveraging Retrieval-Augmented Generation (RAG) and Socratic methodology, it transforms static documents into interactive learning journeys.

![Status](https://img.shields.io/badge/Status-Development-orange)
![Tech Stack](https://img.shields.io/badge/Stack-FastAPI%20%7C%20React%20%7C%20TypeScript-blue)

## 🚀 Key Features

- **Socratic Tutor**: Instead of giving raw answers, the AI guides you through complex topics using structured questioning.
- **Advanced RAG Pipeline**: Intelligent document indexing using PDF processing and vector search (FAISS/Pinecone).
- **Interactive PDF Cockpit**: Upload documents and interact with them in real-time within a modern, responsive interface.
- **Multi-Model Support**: Integrated with Google Gemini 2.0 and local Ollama models (Gemma 3).

## 🏗️ Technical Architecture & Build Process

### Tech Stack
- **Backend**: FastAPI (Python), LangChain, FAISS / Pinecone.
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS.
- **AI Models**: Gemini 2.5 Flash, Ollama (Gemma 3).

## 🛠️ Project Structure

- `backend/`: FastAPI server handling RAG logic and Socratic dialogue management.
- `frontend/`: React application with a high-performance interactive UI.

## 🚦 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- [Ollama](https://ollama.ai/) (Optional, for local models)

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env  # Configure your API keys
python main.py
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📅 Roadmap
- [x] Core RAG pipeline integration.
- [x] Socratic dialogue engine.
- [ ] Real-time PDF viewer with annotation.
- [ ] Knowledge graph visualization.
- [ ] Multi-document synthesis mode.

---
*Created with focus on cognitive science and AI excellence.*

