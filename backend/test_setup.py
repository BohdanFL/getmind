import os
import sys
from dotenv import load_dotenv

# Add current directory to path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from app.rag import RAGManager
    from app.tutor import SocraticTutor
except ImportError as e:
    print(f"❌ Import Error: {e}")
    sys.exit(1)

load_dotenv()

def test_initialization():
    print("🔍 Testing backend configuration...\n")
    
    # Check API Keys
    google_key = os.getenv("GOOGLE_API_KEY")
    if not google_key:
        print("❌ GOOGLE_API_KEY not found in .env")
        print("   -> Please add GOOGLE_API_KEY=your_key_here to backend/.env")
    else:
        print(f"✅ GOOGLE_API_KEY found: {google_key[:5]}...{google_key[-4:]}")

    print("-" * 30)

    # Test Tutor
    print("Testing SocraticTutor initialization (Gemini 2.5 Flash)...")
    try:
        tutor = SocraticTutor()
        print("✅ SocraticTutor initialized successfully.")
    except Exception as e:
        print(f"❌ Failed to initialize SocraticTutor: {e}")

    print("-" * 30)

    # Test RAG
    print("Testing RAGManager initialization...")
    try:
        rag = RAGManager()
        print("✅ RAGManager initialized successfully.")
    except Exception as e:
        print(f"❌ Failed to initialize RAGManager: {e}")

if __name__ == "__main__":
    test_initialization()
