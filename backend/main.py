from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import shutil
import os
import uuid

# Import our custom modules
from app.rag import RAGManager
from app.tutor import SocraticTutor

app = FastAPI(title="CogniFlow API", description="AI-driven Socratic Tuturing Platform")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rag_manager = RAGManager()
tutor = SocraticTutor()

# In-memory storage for simplicity in MVP
# In real app, use Database
sessions = {}

class ChatRequest(BaseModel):
    message: str
    history: List[dict]
    file_id: Optional[str] = None

@app.get("/")
async def root():
    return {"message": "Welcome to CogniFlow API"}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    file_id = str(uuid.uuid4())
    upload_dir = "uploads"
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
        
    file_path = os.path.join(upload_dir, f"{file_id}.pdf")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Process PDF and index it (This would be async in production)
    try:
        chunks = rag_manager.process_pdf(file_path)
        # rag_manager.upload_to_vector_db(chunks) # Requires Pinecone API Key
        # For now, we'll store chunks in memory for this session
        sessions[file_id] = chunks
        return {"file_id": file_id, "message": "File uploaded and processed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        # Get context from RAG
        # If we have real Pinecone, we query it. 
        # For now, use dummy context or in-memory chunks if available
        context_docs = []
        if request.file_id and request.file_id in sessions:
            # Simple keyword search placeholder or just take top chunks
            context_docs = sessions[request.file_id][:3] 
        
        reply = await tutor.get_response(
            chat_history=[], # Should parse from request.history
            context_docs=context_docs,
            user_query=request.message
        )
        return {"reply": reply}
    except Exception as e:
        print(f"Error in chat: {e}")
        return {"reply": "Вибач, я не зміг обробити твоє запитання. Перевір API ключі."}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
