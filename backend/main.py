from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
from langchain.messages import HumanMessage, AIMessage
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
sessions = {}
processing_status: Dict[str, dict] = {}

class ChatRequest(BaseModel):
    message: str
    history: List[dict]
    file_id: Optional[str] = None

@app.get("/")
async def root():
    return {"message": "Welcome to GetMind API"}

async def process_pdf_task(file_id: str, file_path: str):
    try:
        processing_status[file_id] = {"status": "loading", "progress": 10, "message": "Завантаження та аналіз PDF..."}
        
        chunks = rag_manager.process_pdf(file_path)
        processing_status[file_id] = {"status": "chunking", "progress": 25, "message": "Розбиття тексту на блоки..."}
        
        def update_progress(current, total):
            percent = 30 + int((current / total) * 65) # Scale from 30% to 95%
            processing_status[file_id] = {
                "status": "vectorizing", 
                "progress": percent, 
                "message": f"Створення семантичного індексу... ({current}/{total})"
            }

        vector_store = rag_manager.create_vector_store_incremental(chunks, progress_callback=update_progress)
        
        if vector_store:
            sessions[file_id] = vector_store
            processing_status[file_id] = {"status": "completed", "progress": 100, "message": "Готово!"}
        else:
            processing_status[file_id] = {"status": "error", "progress": 0, "message": "Помилка створення векторної бази"}
            
    except Exception as e:
        print(f"Error processing PDF task: {e}")
        processing_status[file_id] = {"status": "error", "progress": 0, "message": f"Помилка: {str(e)}"}

@app.post("/upload")
async def upload_file(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    file_id = str(uuid.uuid4())
    upload_dir = "uploads"
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
        
    file_path = os.path.join(upload_dir, f"{file_id}.pdf")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Initialize status and start background task
    processing_status[file_id] = {"status": "started", "progress": 0, "message": "Файл отримано..."}
    background_tasks.add_task(process_pdf_task, file_id, file_path)
    
    return {"file_id": file_id, "message": "Processing started"}

@app.get("/upload/status/{file_id}")
async def get_upload_status(file_id: str):
    if file_id not in processing_status:
        # Check if it was already processed and exists in sessions
        if file_id in sessions:
            return {"status": "completed", "progress": 100, "message": "Готово!"}
        raise HTTPException(status_code=404, detail="Processing status not found")
    return processing_status[file_id]

@app.get("/pdf/{file_id}")
async def get_pdf(file_id: str):
    file_path = os.path.join("uploads", f"{file_id}.pdf")
    if not os.path.exists(file_path):
        # Check if it's the "default" session, might map to actual file
        if file_id == "default":
            upload_dir = "uploads"
            if os.path.exists(upload_dir):
                files = [f for f in os.listdir(upload_dir) if f.endswith(".pdf")]
                if files:
                    file_path = os.path.join(upload_dir, files[0])
                else:
                    raise HTTPException(status_code=404, detail="Default PDF not found")
            else:
                 raise HTTPException(status_code=404, detail="Uploads directory not found")
        else:
            raise HTTPException(status_code=404, detail="File not found")
            
    return StreamingResponse(open(file_path, "rb"), media_type="application/pdf")



@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        context_docs = []
        if request.file_id is not None and request.file_id in sessions:
            current_file_id: str = request.file_id
            vector_store = sessions[current_file_id]
        elif "default" in sessions:
            vector_store = sessions["default"]
        else:
            vector_store = None
            
        if vector_store:
            context_docs = vector_store.similarity_search(request.message, k=5)
        
        # Convert request history to LangChain message objects
        langchain_history = []
        for msg in request.history:
            if msg["role"] == "user":
                langchain_history.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                langchain_history.append(AIMessage(content=msg["content"]))

        return StreamingResponse(
            tutor.get_streaming_response(
                chat_history=langchain_history,
                context_docs=context_docs,
                user_query=request.message
            ),
            media_type="text/plain",
            headers={
                "X-Content-Type-Options": "nosniff",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        )
    except Exception as e:
        print(f"Error in chat: {e}")
        return {"reply": "Вибач, я не зміг обробити твоє запитання."}

@app.on_event("startup")
async def startup_event():
    upload_dir = "uploads"
    cache_dir = "vector_store_cache"
    file_id = "default"

    if os.path.exists(cache_dir):
        # Only mark as completed if we actually have a PDF to show
        pdf_exists = False
        if os.path.exists(upload_dir):
            files = [f for f in os.listdir(upload_dir) if f.endswith(".pdf")]
            if files:
                pdf_exists = True
        
        if pdf_exists:
            print("Found cached vector store and PDF. Loading...")
            vector_store = rag_manager.load_index(cache_dir)
            if vector_store:
                sessions[file_id] = vector_store
                processing_status[file_id] = {"status": "completed", "progress": 100, "message": "Готово (Cache)!"}
                print(f"SUCCESS: Successfully loaded cached vector store into session '{file_id}'")
                return
        else:
            print("Cache found but PDF missing. Skipping auto-load.")

    if os.path.exists(upload_dir):
        files = [f for f in os.listdir(upload_dir) if f.endswith(".pdf")]
        if files:
            file_path = os.path.join(upload_dir, files[0])
            print(f"Loading default PDF: {files[0]}")
            
            try:
                chunks = rag_manager.process_pdf(file_path)
                vector_store = rag_manager.create_vector_store_incremental(chunks)
                if vector_store:
                    sessions[file_id] = vector_store
                    processing_status[file_id] = {"status": "completed", "progress": 100, "message": "Готово (Default PDF)!"}
                    print(f"SUCCESS: Successfully loaded default PDF into session '{file_id}'")
                    rag_manager.save_index(vector_store, cache_dir)
                else:
                    print("ERROR: Failed to create vector store for default PDF")
            except Exception as e:
                print(f"ERROR: Error loading default PDF: {e}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
