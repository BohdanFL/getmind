import os
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_ollama import OllamaEmbeddings
from langchain_community.vectorstores import FAISS
from dotenv import load_dotenv

load_dotenv()

class RAGManager:
    def __init__(self):
        self.embeddings = OllamaEmbeddings(
            model=os.getenv("OLLAMA_EMBEDDING_MODEL", "embeddinggemma"),
            base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        )
        # In a real app, this would point to a persistent Pinecone/Chroma index
        self.vector_store = None
        
    def process_pdf(self, file_path: str):
        loader = PyPDFLoader(file_path)
        documents = loader.load()
        
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200, # Increased overlap for better context continuity
            separators=["\n\n", "\n", ".", " ", ""]
        )
        chunks = text_splitter.split_documents(documents)
        return chunks

    def create_vector_store(self, chunks):
        """Creates an in-memory vector store for the session."""
        try:
            vector_store = FAISS.from_documents(chunks, self.embeddings)
            return vector_store
        except Exception as e:
            print(f"Error creating vector store: {e}")
            return None

    def query(self, vector_store, query_text: str, k: int = 5):
        if not vector_store:
            return []
        
        # Determine k based on query length/complexity if needed
        # For now, retrieve top 5 relevant chunks
        docs = vector_store.similarity_search(query_text, k=k)
        return docs

    def save_index(self, vector_store, path: str):
        """Saves the vector store to disk."""
        try:
            vector_store.save_local(path)
            print(f"✅ Vector store saved to {path}")
            return True
        except Exception as e:
            print(f"❌ Error saving vector store: {e}")
            return False

    def load_index(self, path: str):
        """Loads the vector store from disk."""
        try:
            vector_store = FAISS.load_local(
                path, 
                self.embeddings, 
                allow_dangerous_deserialization=True # Safe for local dev
            )
            print(f"✅ Vector store loaded from {path}")
            return vector_store
        except Exception as e:
            print(f"❌ Error loading vector store: {e}")
            return None
