import os
import time
import asyncio
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
        self.model_id = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite-preview")
        
        # Native GenAI Client
        api_key = os.getenv("GOOGLE_API_KEY")
        self.client = genai.Client(api_key=api_key)
        self.system_instruction = SOCRATIC_SYSTEM_PROMPT

    def _parse_quota_error(self, error_msg: str) -> str:
        """
        Parses the Google GenAI 429 error message to extract retry delay.
        Supports both raw JSON and Python-style stringified dictionaries.
        """
        import json
        import re
        import ast
        
        try:
            # 1. Try to see if it's a Python-style dict representation (using single quotes)
            # The SDK often returns: 429 Too Many Requests. {'message': '...', 'status': '...'}
            dict_match = re.search(r'\{.*\}', error_msg, re.DOTALL)
            if dict_match:
                content = dict_match.group(0)
                try:
                    # Try parsing as a Python literal first
                    error_dict = ast.literal_eval(content)
                    if isinstance(error_dict, dict) and 'message' in error_dict:
                        # The 'message' field often contains the actual JSON string from Google
                        json_str = error_dict['message']
                        error_data = json.loads(json_str)
                    else:
                        # Maybe the whole match is the JSON
                        error_data = json.loads(content.replace("'", '"')) # Risky but fallback
                except:
                    # Try raw JSON parsing
                    error_data = json.loads(content)
                
                # 2. Extract retryDelay from the parsed structure
                if 'error' in error_data:
                    details = error_data['error'].get('details', [])
                    for detail in details:
                        if detail.get('@type') == 'type.googleapis.com/google.rpc.RetryInfo':
                            return detail.get('retryDelay', '60s')
                    
                    # Check for delay in the message text itself
                    msg = error_data['error'].get('message', '')
                    delay_match = re.search(r'retry in ([\d\.]+s)', msg)
                    if delay_match:
                        return delay_match.group(1)

        except Exception as e:
            print(f"Error parsing quota error: {e}")
        
        # 3. Final fallback: search for anything looking like "Xs" or "X.Xs" in the raw string
        delay_match = re.search(r'retry in ([\d\.]+s)', error_msg)
        if delay_match:
            return delay_match.group(1)
            
        return "60s"

    # Note: async generator for FastAPI StreamingResponse
    async def get_streaming_response(self, chat_history, file_name, user_query):
        print("Streaming response natively from Gemini")
        
        # 1. Format Chat History into a single string to maintain context
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

                    if file_obj.state.name == "FAILED":
                        yield "Помилка: файл не вдалося обробити на стороні Google."
                        return

                    request_contents.append(file_obj)
                except Exception as e:
                    print(f"Error retrieving file from Google GenAI: {e}")
            
            # 3. Add the prompt
            request_contents.append(prompt)

            
            # 4. Stream response with retry logic
            max_retries = 3
            tokens_yielded = 0

            for attempt in range(max_retries):
                try:
                    start_time = time.time()
                    response_stream = await self.client.aio.models.generate_content_stream(
                        model=self.model_id,
                        contents=request_contents,
                        config=types.GenerateContentConfig(
                            system_instruction=self.system_instruction,
                            temperature=0.7
                        )
                    )
                    
                    last_usage = None
                    finish_reason = None

                    async for chunk in response_stream:
                        # Capture usage metadata
                        if chunk.usage_metadata:
                            last_usage = chunk.usage_metadata
                        
                        # Capture finish reason
                        if chunk.candidates and chunk.candidates[0].finish_reason:
                            finish_reason = str(chunk.candidates[0].finish_reason)

                        if chunk.text:
                            tokens_yielded += 1
                            yield chunk.text

                    # If we reached here, the stream finished successfully
                    end_time = time.time()
                    latency_ms = int((end_time - start_time) * 1000)

                    # 5. Log usage after success
                    if last_usage:
                        from .analytics import analytics
                        analytics.log_usage(
                            operation_type="chat_completion",
                            model_id=self.model_id,
                            input_tokens=last_usage.prompt_token_count,
                            output_tokens=last_usage.candidates_token_count,
                            cached_tokens=getattr(last_usage, 'cached_content_token_count', 0),
                            latency_ms=latency_ms,
                            finish_reason=finish_reason,
                            extra_metadata={
                                "user_query_len": len(user_query),
                                "file_context": file_name,
                                "attempts": attempt + 1
                            }
                        )
                    return # Exit the method on success

                except Exception as e:
                    err_msg = str(e)
                    is_quota_error = "429" in err_msg or "RESOURCE_EXHAUSTED" in err_msg
                    is_connection_error = any(msg in err_msg.lower() for msg in ["connection", "timeout", "transfer", "reset"])
                    print(f"Error: {err_msg}")
                    # if tokens_yielded > 0:
                    #     print(f"Stream interrupted after {tokens_yielded} tokens: {err_msg}")
                    #     yield "\n\n[Зв'язок перервано під час генерації.]"
                    #     return
                    
                    if is_quota_error:
                        delay = self._parse_quota_error(err_msg)
                        yield f"\n\n**Ліміт запитів вичерпано.** \nБудь ласка, зачекай **{delay}** перед наступним запитанням."
                        return # Stop trying for 429 errors

                    if attempt < max_retries - 1 and is_connection_error:
                        print(f"Stream attempt {attempt + 1} failed: {err_msg}. Retrying in 1s...")
                        await asyncio.sleep(1) # Small delay before retry
                        continue
                    else:
                        print(f"Native SDK Generation Error: {err_msg}")
                        yield "Вибач, я не зміг обробити твоє запитання. Спробуй, будь ласка, ще раз через хвилину."
                        break
                    
        except Exception as e:
            print(f"Native SDK Generation Error: {e}")
            yield "Вибач, я не зміг обробити твоє запитання. Перевір підключення до API Google."
