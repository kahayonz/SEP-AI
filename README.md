# SEP-AI Project Structure

## frontend/
All static files for the web UI (HTML, CSS, JS, images).

- `index.html`, `login.html`, `signup.html`, etc.
- `styles/` for CSS files

## backend/
All backend code (FastAPI, requirements, .env, etc.)

- `main.py`
- `.env`
- `requirements.txt`
- `pyproject.toml`
- `.gitignore`

---

**How to run:**

- Start backend:  
  ```
  cd backend
  uvicorn main:app --reload
  ```
- Open `frontend/index.html` in your browser (or serve via a static server).
