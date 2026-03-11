# Group 8

## Backend

### Setup

1. Go to backend folder:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
```

3. Activate virtual environment:
- Mac/Linux: `source venv/bin/activate`
- Windows: `venv\\Scripts\\activate`

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Run the API server:
```bash
python app.py
```

Backend runs on `http://localhost:5001`.

## Frontend

### Setup

1. Open a new terminal and go to frontend folder:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create env file from example:
```bash
cp .env.example .env
```

4. Ensure API base URL points to backend:
```env
VITE_API_BASE_URL=http://localhost:5001
```

5. Run the frontend:
```bash
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Startup Order

1. Start backend first (`python app.py`).
2. Start frontend second (`npm run dev`).

## Auth / API Notes

- Most backend routes are protected and require:
```http
Authorization: Bearer <idToken>
```
- Public routes include auth signup/login/refresh plus health/info routes.
- Frontend now uses backend auth endpoints (`/api/auth/*`) and automatically retries once after token refresh on 401 responses.
