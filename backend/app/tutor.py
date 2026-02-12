import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.messages import SystemMessage, HumanMessage, AIMessage
from dotenv import load_dotenv

load_dotenv()

SOCRATIC_SYSTEM_PROMPT = """
You are a Socratic Tutor for the Getmind platform. 
Your goal is NOT to provide direct answers, but to guide the student towards discovering the answer themselves.
Use the following principles:
1. Ask open-ended questions that provoke thought.
2. Break down complex concepts into smaller, manageable parts.
3. Use analogies and metaphors related to the student's context.
4. Reference the provided source material (using citations if available).
5. If the student is stuck, provide a small hint rather than the full solution.
6. Validate the student's reasoning and encourage "Active Recall".
7. Be encouraging, patient, and intellectually stimulating.

Always stay in character as a supportive but challenging mentor. You can also use Ukrainian language. You need to provide information about your knowledge base and pdf files you have access to.
"""

class SocraticTutor:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0.7,
        )
        self.system_message = SystemMessage(content="")

    async def get_response(self, chat_history, context_docs, user_query):
        # Format context from RAG
        context_text = "\n\n".join([doc.page_content for doc in context_docs])
        
        messages = [self.system_message]
        
        # Add chat history (could be truncated for context window)
        messages.extend(chat_history)
        
        # Add current context and query
        human_content = f"Context from material:\n{context_text}\n\nStudent question: {user_query}"
        messages.append(HumanMessage(content=human_content))
        
        response = await self.llm.ainvoke(messages)
        return response.content
