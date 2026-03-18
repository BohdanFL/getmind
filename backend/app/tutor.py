import os
from google import genai
from google.genai import types
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
4. Reference the provided source material directly (quote text or mention page numbers if available).
5. If the student is stuck, provide a small hint rather than the full solution.

Response language: Ukrainian (unless asked otherwise). Stay encouraging and patient.
"""

class SocraticTutor:
    def __init__(self):
        # Gemini 3.1 Flash-Lite: Best price/performance ratio for chat
        self.model_id = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")
        
        # Native GenAI Client
        api_key = os.getenv("GOOGLE_API_KEY")
        self.client = genai.Client(api_key=api_key)
        self.system_instruction = SOCRATIC_SYSTEM_PROMPT

    # Note: async generator for FastAPI StreamingResponse
    async def get_streaming_response(self, chat_history, file_name, user_query):
        print("Streaming response natively from Gemini")
        
        # 1. Format Chat History into a single string to maintain context
        # (Alternatively, could construct types.Content objects for robust role playing, 
        # but string formatting works perfectly for simple RAG context keeping)
        history_text = ""
        if chat_history:
            for msg in chat_history:
                role = "Студент" if msg["role"] == "user" else "Тютор"
                history_text += f"**{role}**: {msg['content']}\n\n"
                
        prompt = ""
        if history_text:
            prompt += f"--- Історія переписки ---\n{history_text}\n"
        prompt += f"--- Запитання студента ---\n{user_query}"
        
        try:
            request_contents = []
            
            # 2. Add the uploaded PDF file via the explicit file object
            if file_name:
                try:
                    print(f"Retrieving native file object: {file_name}")
                    # Fetching the file object lets Gemini know exactly what cached PDF to use natively
                    file_obj = self.client.files.get(name=file_name)
                    request_contents.append(file_obj)
                except Exception as e:
                    print(f"Error retrieving file from Google GenAI: {e}")
            
            # 3. Add the prompt
            request_contents.append(prompt)
            
            # 4. Stream response
            response_stream = await self.client.aio.models.generate_content_stream(
                model=self.model_id,
                contents=request_contents,
                config=types.GenerateContentConfig(
                    system_instruction=self.system_instruction,
                    temperature=0.7
                )
            )
            
            async for chunk in response_stream:
                if chunk.text:
                    yield chunk.text
                    
        except Exception as e:
            print(f"Native SDK Generation Error: {e}")
            yield "Вибач, я не зміг обробити твоє запитання. Перевір підключення до API Google."
