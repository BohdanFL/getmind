import os
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from dotenv import load_dotenv

load_dotenv()

class RAGManager:
    def __init__(self):
        self.embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
        self.index_name = os.getenv("PINECONE_INDEX_NAME", "cogniflow")
        
    def process_pdf(self, file_path: str):
        loader = PyPDFLoader(file_path)
        documents = loader.load()
        
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=100,
            separators=["\n\n", "\n", ".", " ", ""]
        )
        chunks = text_splitter.split_documents(documents)
        return chunks

    def upload_to_vector_db(self, documents):
        # Implementation for Pinecone upload
        # Note: Requires PINECONE_API_KEY in environment
        vectorstore = PineconeVectorStore.from_documents(
            documents, 
            self.embeddings, 
            index_name=self.index_name
        )
        return vectorstore

    def query(self, query_text: str, k: int = 3):
        vectorstore = PineconeVectorStore.from_existing_index(
            index_name=self.index_name,
            embedding=self.embeddings
        )
        return vectorstore.similarity_search(query_text, k=k)
