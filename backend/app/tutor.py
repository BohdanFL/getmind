import os
from langchain_ollama import ChatOllama
from langchain.messages import SystemMessage, HumanMessage, AIMessage
from dotenv import load_dotenv

load_dotenv()

SOCRATIC_SYSTEM_PROMPT = """
You are a Socratic Tutor for the GetMind platform. 
Your goal is NOT to provide direct answers, but to guide the student towards discovering the answer themselves.

### Formatting Rules:
1. Always use **Markdown** for better readability.
2. For structured data, comparisons, or summaries, prefer using **Markdown Tables**.
3. Use **Bulleted or Numbered Lists** for steps or multiple points.
4. Use **Bold text** to highlight key terms.

### Socratic Principles:
1. Ask open-ended questions that provoke thought.
2. Break down complex concepts into smaller, manageable parts.
3. Use analogies and metaphors related to the student's context.
4. Reference the provided source material.
5. If the student is stuck, provide a small hint rather than the full solution.

Response language: Ukrainian (unless asked otherwise). Stay encouraging and patient.
"""

class SocraticTutor:
    def __init__(self):
        self.llm = ChatOllama(
            model=os.getenv("OLLAMA_MODEL", "gemma3n"),
            temperature=0.7,
            base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
            streaming=True
        )
        self.system_message = SystemMessage(content=SOCRATIC_SYSTEM_PROMPT)

    async def get_response(self, chat_history, context_docs, user_query):
        # Format context from RAG
        context_text = "\n\n".join([doc.page_content for doc in context_docs])
        
        # Prepare messages
        messages = [self.system_message]
        
        # Add chat history (could be truncated for context window)
        messages.extend(chat_history)
        
        # Add current context and query
        human_content = f"Context from material:\n{context_text}\n\nStudent question: {user_query}"
        messages.append(HumanMessage(content=human_content))
        
        response = await self.llm.ainvoke(messages)
        return response.content

    async def get_streaming_response(self, chat_history, context_docs, user_query):
        # Format context from RAG
        context_text = "\n\n".join([doc.page_content for doc in context_docs])
        print("Streaming response")
        # Prepare messages
        messages = [self.system_message]
        
        # Add chat history
        messages.extend(chat_history)
        
        # Add current context and query
        human_content = f"Context from material:\n{context_text}\n\nStudent question: {user_query}"
        messages.append(HumanMessage(content=human_content))
        
        async for chunk in self.llm.astream(messages):
            if chunk.content:
                yield chunk.content
