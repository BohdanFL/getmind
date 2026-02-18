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

app = FastAPI(title="GetMind API", description="AI-driven Socratic Tuturing Platform")

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
    return {"message": "Welcome to GetMind API"}

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
        
        # Create in-memory vector store for this session
        vector_store = rag_manager.create_vector_store(chunks)
        
        if vector_store:
            sessions[file_id] = vector_store
            return {"file_id": file_id, "message": "File uploaded and processed"}
        else:
             raise HTTPException(status_code=500, detail="Failed to create vector store from PDF")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        # Get context from RAG
        # If we have real Pinecone, we query it. 
        # For now, we search the in-memory FAISS store
        print("Request on /chat")
        context_docs = []
        if request.file_id is not None and request.file_id in sessions:
            current_file_id: str = request.file_id
            vector_store = sessions[current_file_id]
        elif "default" in sessions:
            # Fallback to default session if available
            vector_store = sessions["default"]
        else:
            vector_store = None
            
        if vector_store:
            # Retrieve top 5 relevant chunks
            context_docs = vector_store.similarity_search(request.message, k=5)
        
        reply = await tutor.get_response(
            chat_history=[], # Should parse from request.history
            context_docs=context_docs,
            user_query=request.message
        )
        return {"reply": reply}
    except Exception as e:
        print(f"Error in chat: {e}")
        return {"reply": "Вибач, я не зміг обробити твоє запитання. Перевір API ключі."}

@app.on_event("startup")
async def startup_event():
    # Check for existing PDF in uploads to pre-load
    upload_dir = "uploads"
    cache_dir = "vector_store_cache"
    file_id = "default"

    # Try loading from cache first
    if os.path.exists(cache_dir):
        print("Found cached vector store. Loading...")
        vector_store = rag_manager.load_index(cache_dir)
        if vector_store:
            sessions[file_id] = vector_store
            print(f"SUCCESS: Successfully loaded cached vector store into session '{file_id}'")
            return

    # If no cache, process existing PDF
    if os.path.exists(upload_dir):
        files = [f for f in os.listdir(upload_dir) if f.endswith(".pdf")]
        if files:
            # Load the first found PDF
            file_path = os.path.join(upload_dir, files[0])
            print(f"Loading default PDF: {files[0]}")
            
            try:
                chunks = rag_manager.process_pdf(file_path)
                vector_store = rag_manager.create_vector_store(chunks)
                if vector_store:
                    sessions[file_id] = vector_store
                    print(f"SUCCESS: Successfully loaded default PDF into session '{file_id}'")
                    
                    # Save to cache
                    rag_manager.save_index(vector_store, cache_dir)
                else:
                    print("ERROR: Failed to create vector store for default PDF")
            except Exception as e:
                print(f"ERROR: Error loading default PDF: {e}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
