import os
import sys
from langchain_core.documents import Document
from dotenv import load_dotenv

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from app.rag import RAGManager
except ImportError as e:
    print(f"❌ Import Error: {e}")
    sys.exit(1)

load_dotenv()

def test_rag_search():
    print("🔍 Testing RAG with FAISS (In-Memory)...\n")
    
    rag = RAGManager()
    
    # Create dummy documents
    print("Generation dummy documents...")
    docs = [
        Document(page_content="The capital of France is Paris.", metadata={"id": 1}),
        Document(page_content="The capital of Germany is Berlin.", metadata={"id": 2}),
        Document(page_content="The capital of Italy is Rome.", metadata={"id": 3}),
        Document(page_content="Photosynthesis is the process by which green plants create food.", metadata={"id": 4}),
        Document(page_content="Mitochondria is the powerhouse of the cell.", metadata={"id": 5}),
    ]
    
    # Create vector store
    print("Creating vector store...")
    try:
        vector_store = rag.create_vector_store(docs)
        if not vector_store:
            print("❌ Failed to create vector store")
            return
        print("✅ Vector store created.")
    except Exception as e:
        print(f"❌ Error creating vector store: {e}")
        return

    # Test Query 1
    query1 = "What is the capital of France?"
    print(f"\nQuery: '{query1}'")
    results1 = vector_store.similarity_search(query1, k=1)
    if results1 and "Paris" in results1[0].page_content:
        print(f"✅ Found: {results1[0].page_content}")
    else:
        print(f"❌ Failed. Top result: {results1[0].page_content if results1 else 'None'}")

    # Test Query 2
    query2 = "Explain how plants make food"
    print(f"\nQuery: '{query2}'")
    results2 = vector_store.similarity_search(query2, k=1)
    if results2 and "Photosynthesis" in results2[0].page_content:
        print(f"✅ Found: {results2[0].page_content}")
    else:
        print(f"❌ Failed. Top result: {results2[0].page_content if results2 else 'None'}")

if __name__ == "__main__":
    test_rag_search()
