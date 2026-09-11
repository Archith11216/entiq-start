# Entiq Start Backend (FastAPI)

Production-grade, high-level Python backend for **Entiq Start** practice management.

## Tech Stack
- **Framework**: FastAPI (async Python web framework)
- **Server**: Uvicorn with ASGI
- **Database & ORM**: SQLite (`entiq.db`) + SQLAlchemy 2.0 ORM
- **Schemas**: Pydantic v2 with automatic camelCase aliases matching TypeScript contracts
- **Authentication**: JWT (JSON Web Tokens) with passlib / bcrypt
- **Testing**: Pytest + FastAPI TestClient

---

## Quick Start

### 1. Install Dependencies
```bash
pip install -r backend/requirements.txt
```

### 2. Run the Backend
```bash
python backend/run.py
```
Or via npm:
```bash
npm run backend
```

The server starts at:
- **API Base**: `http://localhost:8000/api/v1`
- **Interactive Swagger UI**: `http://localhost:8000/api/v1/docs`
- **ReDoc Documentation**: `http://localhost:8000/api/v1/redoc`

---

## Default Credentials
On first launch, the database automatically initializes and seeds:
- **Email**: `j.okafor@growadvisory.com.au`
- **Password**: `password123`
- **Role**: Partner (Grow Advisory Group)

---

## API Endpoints Summary

### Authentication (`/api/v1/auth`)
- `POST /auth/login`: Authenticate and receive access + refresh JWT tokens
- `POST /auth/refresh`: Refresh expired access token
- `POST /auth/logout`: Sign out
- `GET /auth/me`: Current user profile (Bearer token)

### Cases (`/api/v1/cases`)
- `GET /cases`: Paginated list of onboarding cases (filters: `status`, `search`, `page`, `pageSize`)
- `GET /cases/{id}`: Case details
- `PATCH /cases/{id}/status`: Update status (auto-provisions active engagement when set to `Accepted`)
- `POST /cases`: Create new case

### Alerts (`/api/v1/alerts`)
- `GET /alerts`: Active review alerts (identity, compliance, commercial, etc.)
- `POST /alerts/{id}/dismiss`: Dismiss an alert

### Dashboard (`/api/v1/dashboard`)
- `GET /dashboard/stats`: Real-time aggregated statistics (active cases, overdue, accepted, exceptions, conversion funnel, weekly completion trend)

### Invitations (`/api/v1/invitations`)
- `GET /invitations`: Paginated invitations list
- `GET /invitations/stats`: Invitation metrics (sent this month, opened, started, expiring soon)
- `POST /invitations`: Create new invitation (auto-provisions `Invited` case)
- `POST /invitations/{id}/resend`: Resend invitation
- `POST /invitations/{id}/cancel`: Cancel invitation

### Clients / Entities (`/api/v1/clients`)
- `GET /clients`: Paginated client entities (Company, Individual, Trust, SMSF, etc.)
- `POST /clients`: Create client entity

### Engagements (`/api/v1/engagements`)
- `GET /engagements`: Client engagements list (active, renewal due, etc.)
- `POST /engagements`: Create engagement
- `PATCH /engagements/{id}/status`: Update engagement status

### Activity Audit Log (`/api/v1/activity`)
- `GET /activity`: Filterable audit log events
- `POST /activity`: Log practice event

### Templates (`/api/v1/templates`)
- `GET /templates`: Engagement & questionnaire templates

---

## Running Tests
```bash
python -m pytest backend/tests/test_api.py -v
```
