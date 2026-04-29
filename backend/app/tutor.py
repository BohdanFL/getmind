import os
import time
import asyncio
from google import genai
from google.genai import types
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import List, Optional, Type, Any
import traceback

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

### Spatial Grounding (Visual References):
When referring to specific text, sections, or diagrams in the PDF, please provide a visual highlight.
1. Use `[[HL_TEXT:page,"фраза"]]` for precise word-level highlighting of specific sentences or phrases. This is the preferred method for text.
2. Use `[[HL:page,ymin,xmin,ymax,xmax]]` for general area highlighting (e.g., highlighting a diagram, a table, or a large section). Coordinates are normalized to 1000.
Example: "Зверни увагу на це речення: [[HL_TEXT:1,"Кінець і початок речення конкретно"]]. Також глянь на графік поряд: [[HL:1,150,100,250,900]]..."

### Navigation:
To navigate the student to a specific page without highlighting, use `[[PAGE:num]]`.

Response language: Ukrainian (unless asked otherwise). Stay encouraging and patient.
"""

class SocraticTutor:
    def __init__(self):
        # Gemini 3.1 Flash-Lite: Best price/performance ratio for chat
        self.model_id = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite-preview")
        
        api_key = os.getenv("GOOGLE_API_KEY")
        self.client = genai.Client(
            api_key=api_key,
            http_options={'timeout': 600000.0}
        )
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

    async def get_streaming_response(self, chat_history, file_name, user_query):
        print("Streaming response natively from Gemini")
        
        history_text = ""
        if chat_history:
            for msg in chat_history:
                if not msg or "role" not in msg or "content" not in msg:
                    continue
                role = "Student" if msg["role"] == "user" else "Tutor"
                history_text += f"**{role}**: {msg['content']}\n\n"
                
        prompt = ""
        if history_text:
            prompt += f"--- Chat History ---\n{history_text}\n"
        prompt += f"--- Student's Question ---\n{user_query}"
        
        try:
            request_contents = []
            
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
            
            request_contents.append(prompt)

            
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

                    if last_usage:
                        from .analytics import analytics
                        await analytics.log_usage_async(
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
                    action, message = self._classify_error(e, tokens_yielded, attempt, max_retries)

                    print(traceback.format_exc())
                    if message:
                        yield message
                    if action == "stop":
                        return
                    if action == "retry":
                        await asyncio.sleep(1)
                        continue
                    break # action == "fail" or unknown
                    
        except Exception as e:
            print(f"Native SDK Generation Error: {e}")
            yield "Вибач, я не зміг обробити твоє запитання. Перевір підключення до API Google."

    def _classify_error(self, error: Exception, tokens_yielded: int, attempt: int, max_retries: int) -> tuple[str, str | None]:
        """
        Categorizes an error and determines the appropriate action for the streaming loop.
        Returns: (action, user_message)
        Actions: 'retry', 'stop', 'fail'
        """
        err_msg = str(error)
        print(f"Generation Error (attempt {attempt + 1}): {err_msg}")

        # Stream interrupted after generating some text
        if tokens_yielded > 0:
            return "stop", "\n\n[Зв'язок перервано під час генерації.]"

        # Quota Issues (429)
        if "429" in err_msg or "RESOURCE_EXHAUSTED" in err_msg:
            delay = self._parse_quota_error(err_msg)
            msg = f"\n\n**Ліміт запитів вичерпано.** \nБудь ласка, зачекай **{delay}** перед наступним запитанням."
            return "stop", msg

        # Connection Issues - eligible for retry
        is_connection = any(msg in err_msg.lower() for msg in ["connection", "timeout", "transfer", "reset"])
        if is_connection and attempt < max_retries - 1:
            return "retry", None

        return "fail", "Вибач, я не зміг обробити твоє запитання. Спробуй, будь ласка, ще раз через хвилину."

    async def get_structured_response(self, prompt: str, response_schema: type[BaseModel]) -> BaseModel:
        """
        Generates a non-streaming structured response matching the provided Pydantic schema.
        """
        print(f"Generating structured response using schema: {response_schema.__name__}")
        try:
            response = await self.client.aio.models.generate_content(
                model=self.model_id,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=self.system_instruction,
                    response_mime_type="application/json",
                    response_json_schema=response_schema.model_json_schema(),
                    temperature=0.7
                )
            )
            
            # Note: Analytics logging could be added here similar to get_streaming_response
            return response_schema.model_validate_json(response.text)
            
        except Exception as e:
            print(f"Structured Generation Error: {e}")
            raise e

    async def get_streaming_structured_response(self, prompt: str, response_schema: type[BaseModel]):
        """
        Generates a streaming structured response. 
        Yields partial JSON strings that eventually form a valid JSON object matching the schema.
        """
        print(f"Streaming structured response using schema: {response_schema.__name__}")
        try:
            response_stream = await self.client.aio.models.generate_content_stream(
                model=self.model_id,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=self.system_instruction,
                    response_mime_type="application/json",
                    response_json_schema=response_schema.model_json_schema(),
                    temperature=0.7
                )
            )
            
            async for chunk in response_stream:
                if chunk.text:
                    yield chunk.text
                    
        except Exception as e:
            print(f"Streaming Structured Generation Error: {e}")
            raise e
