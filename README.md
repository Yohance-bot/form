# Happiest Minds COE — Skill Profiling Tool

A full-stack web application for collecting and managing Data & AI COE member profiles.

## Features

- **Profile Form** — 4-section form covering personal info, skills, certifications, and project history
- **Skills Search** — Searchable, autocomplete skill picker with 80+ pre-loaded skills; custom skills supported
- **Admin Dashboard** — Secure JWT-authenticated admin panel with search, view, and delete
- **Export** — Download all profiles as CSV or Excel (.xlsx) with one click
- **Upsert** — Re-submitting with the same HM ID updates the existing profile

---

## Project Structure

```
happiest-minds-profiler/
├── backend/           # Flask API (Python)
│   ├── app.py
│   ├── requirements.txt
│   ├── Procfile
│   └── .env.example
└── frontend/          # React + Vite + Tailwind
    ├── src/
    │   ├── App.jsx    # Employee profile form
    │   ├── Admin.jsx  # Admin dashboard
    │   └── main.jsx
    ├── package.json
    └── .env.example
```

---

## Local Development

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env — set SECRET_KEY and ADMIN_PASSWORD
python app.py
# API runs on http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# For local dev, VITE_API_URL can be left empty (Vite proxies /api to :5000)
npm run dev
# App runs on http://localhost:5173
# Admin dashboard: http://localhost:5173/admin
```

---

## Deployment

### Option A: Render (Recommended — Free Tier Available)

#### Backend (Web Service)

1. Push repo to GitHub
2. In Render dashboard → **New Web Service** → Connect repo
3. **Root Directory**: `backend`
4. **Build Command**: `pip install -r requirements.txt`
5. **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --preload`
6. **Environment Variables** (set in Render dashboard):
   - `SECRET_KEY` → a long random string (use `python -c "import secrets; print(secrets.token_hex(32))"`)
   - `ADMIN_PASSWORD` → your secure admin password
   - `DATABASE_URL` → (optional) add a Render PostgreSQL database and paste its URL here
   - `CORS_ORIGIN` → your frontend URL (e.g. `https://hm-profiler.onrender.com`)

#### Frontend (Static Site)

1. In Render → **New Static Site** → Connect repo
2. **Root Directory**: `frontend`
3. **Build Command**: `npm install && npm run build`
4. **Publish Directory**: `dist`
5. **Environment Variables**:
   - `VITE_API_URL` → your backend URL (e.g. `https://hm-profiler-api.onrender.com`)

---

### Option B: Azure

#### Backend — Azure App Service

```bash
cd backend
# Create resource group and app service plan
az group create --name hm-profiler-rg --location eastus
az appservice plan create --name hm-plan --resource-group hm-profiler-rg --sku B1 --is-linux
az webapp create --name hm-profiler-api --resource-group hm-profiler-rg \
  --plan hm-plan --runtime "PYTHON:3.11"

# Set environment variables
az webapp config appsettings set --name hm-profiler-api --resource-group hm-profiler-rg \
  --settings SECRET_KEY="your-secret" ADMIN_PASSWORD="your-password" \
  SCM_DO_BUILD_DURING_DEPLOYMENT=true

# Deploy
az webapp up --name hm-profiler-api --resource-group hm-profiler-rg
```

For a production database, add Azure Database for PostgreSQL and set `DATABASE_URL`.

#### Frontend — Azure Static Web Apps

1. In Azure Portal → Create **Static Web App**
2. Connect GitHub repo
3. Set build details:
   - App location: `frontend`
   - Build command: `npm run build`
   - Output location: `dist`
4. Add environment variable `VITE_API_URL` pointing to your API

---

## Security Checklist

Before going live:

- [ ] Change `SECRET_KEY` to a long random string
- [ ] Change `ADMIN_PASSWORD` from the default
- [ ] Set `CORS_ORIGIN` to your exact frontend domain (not `*`)
- [ ] Use PostgreSQL (not SQLite) in production
- [ ] Enable HTTPS (automatic on Render and Azure Static Web Apps)
- [ ] Rotate admin password periodically

---

## Default Admin Credentials

- **Username**: `admin`
- **Password**: set via `ADMIN_PASSWORD` env var (default: `admin123`)

**Change the password before deploying!**

---

## Admin URLs

- Form: `https://your-domain.com/`
- Admin: `https://your-domain.com/admin`

---

## Adding More Skills

Edit the `SKILLS_LIST` array in `backend/app.py` to add domain-specific skills from your skill framework Excel file.
