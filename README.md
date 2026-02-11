# CogniFlow

AI-driven ecosystem for deep research and long-term knowledge retention.

## Project Structure

- `backend/`: FastAPI server for RAG and Socratic Tutor.
- `frontend/`: Next.js application for the study cockpit.
- `project_description/`: Project documentation and theory.

## Setup

### Backend

1. Navigate to `backend/`
2. Create a virtual environment: `python -m venv venv`
3. Activate: `source venv/bin/activate` (or `venv\Scripts\activate` on Windows)
4. Install dependencies: `pip install -r requirements.txt`
5. Set up `.env` with API keys.
6. Run: `python main.py`

### Frontend

1. Navigate to `frontend/`
2. Install dependencies: `npm install`
3. Run: `npm run dev`

## Phase 1 Progress

- [x] Backend structure and modules (RAG, Tutor).
- [/] Frontend initialization (Next.js).
- [ ] Basic RAG pipeline integration.
- [ ] Simple Socratic chat interface.
