# KGK Report - سیستم گزارش کار روزانه

Daily work reporting system for Kajika company. Built with FastAPI + React + PostgreSQL.

## Quick Start (Docker)

```bash
git clone https://github.com/maznaveh-commits/kgkreport.git
cd kgkreport
docker compose up -d
```

Open `http://your-server-ip` in a browser.

**Default login:**
- Username: `superadmin`
- Password: `Admin@2024`

> Change this password immediately after first login.

## Without Docker

### Prerequisites
- Python 3.12+
- Node.js 18+
- PostgreSQL 16+

### Database Setup

```bash
# Create database and tables
psql -U postgres -f postgres/init.sql
```

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure environment (edit .env with your database credentials)
cp .env.example .env  # if available, or edit .env directly

uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The dev server runs on `http://localhost:5173`.

## Project Structure

```
kgkreport/
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── api/       # API endpoints
│   │   ├── core/      # Config, security, database
│   │   ├── models/    # SQLAlchemy models
│   │   ├── schemas/   # Pydantic schemas
│   │   └── main.py    # App entry point
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/          # React + Vite + Tailwind
│   ├── src/
│   │   ├── pages/     # Page components
│   │   ├── components/# Reusable components
│   │   └── utils/     # Shared utilities
│   ├── Dockerfile
│   └── package.json
├── nginx/             # Nginx reverse proxy config
├── postgres/          # Database init scripts
└── docker-compose.yml
```

## Roles

| Role | Access |
|------|--------|
| `superadmin` | Full system access, manage users/departments/relations |
| `company_manager` | View all manager reports, company-wide dashboard |
| `manager` | View team reports, approve submitted reports, assign tasks |
| `staff` | Submit daily reports, view own reports |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login and get JWT token |
| GET | `/users/` | List all users (superadmin) |
| GET | `/departments/` | List departments |
| GET | `/reports/my` | Get own reports |
| POST | `/reports/` | Create daily report |
| PATCH | `/reports/{id}/submit` | Submit report for approval |
| PATCH | `/reports/{id}/approve` | Approve report (manager) |
| GET | `/reports/team` | Get team reports (manager) |
| GET | `/company/unified-report` | Company-wide report (company_manager) |
| GET | `/health` | Health check (includes DB status) |

## Configuration

Environment variables (in `backend/.env`):

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://...` | PostgreSQL connection string |
| `SECRET_KEY` | (generated) | JWT signing key |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Allowed CORS origins |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `480` | Token expiry (8 hours) |

## License

Private - Kajika Company
