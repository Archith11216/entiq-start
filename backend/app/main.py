from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base, SessionLocal
from .seed import seed_database
from .auth_api_key import verify_api_key
from .routers import (
    auth,
    cases,
    alerts,
    dashboard,
    invitations,
    clients,
    engagements,
    activity,
    templates,
    billing,
    services,
    workflows,
    api_keys,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Ensure all database tables exist
    Base.metadata.create_all(bind=engine)

    # 2. Seed initial data if empty
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="High-level Python backend for Entiq Start practice management.",
    openapi_url=f"{settings.API_PREFIX}/openapi.json",
    docs_url=f"{settings.API_PREFIX}/docs",
    redoc_url=f"{settings.API_PREFIX}/redoc",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(cases.router, prefix=settings.API_PREFIX, dependencies=[Depends(verify_api_key)])
app.include_router(alerts.router, prefix=settings.API_PREFIX, dependencies=[Depends(verify_api_key)])
app.include_router(dashboard.router, prefix=settings.API_PREFIX, dependencies=[Depends(verify_api_key)])
app.include_router(invitations.router, prefix=settings.API_PREFIX, dependencies=[Depends(verify_api_key)])
app.include_router(clients.router, prefix=settings.API_PREFIX, dependencies=[Depends(verify_api_key)])
app.include_router(engagements.router, prefix=settings.API_PREFIX, dependencies=[Depends(verify_api_key)])
app.include_router(activity.router, prefix=settings.API_PREFIX, dependencies=[Depends(verify_api_key)])
app.include_router(templates.router, prefix=settings.API_PREFIX, dependencies=[Depends(verify_api_key)])
app.include_router(billing.router, prefix=settings.API_PREFIX, dependencies=[Depends(verify_api_key)])
app.include_router(services.router, prefix=settings.API_PREFIX, dependencies=[Depends(verify_api_key)])
app.include_router(workflows.router, prefix=settings.API_PREFIX, dependencies=[Depends(verify_api_key)])
app.include_router(api_keys.router, prefix=settings.API_PREFIX, dependencies=[Depends(verify_api_key)])

@app.get("/")
def root():
    return {
        "message": "Entiq Start Backend API is running.",
        "docs": f"{settings.API_PREFIX}/docs",
        "apiPrefix": settings.API_PREFIX
    }

@app.get("/health")
@app.get(f"{settings.API_PREFIX}/health")
def health_check():
    return {"status": "healthy"}
