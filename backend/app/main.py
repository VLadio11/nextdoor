from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.logging_config import configure_logging, get_logger
from app.routers import alerts, keywords, locations, posts, recipients, system
from app.scheduler import start_scheduler, stop_scheduler

configure_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("app_startup", environment=settings.environment, sim_mode=settings.sim_mode)
    start_scheduler()
    yield
    stop_scheduler()
    logger.info("app_shutdown")


app = FastAPI(
    title="Nextdoor Monitor",
    description="Monitors Nextdoor posts for keyword matches and sends email alerts.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api"

app.include_router(locations.router, prefix=API_PREFIX)
app.include_router(keywords.router, prefix=API_PREFIX)
app.include_router(recipients.router, prefix=API_PREFIX)
app.include_router(posts.router, prefix=API_PREFIX)
app.include_router(alerts.router, prefix=API_PREFIX)
app.include_router(system.router, prefix=API_PREFIX)


@app.get("/health")
async def health():
    return {"status": "ok"}
