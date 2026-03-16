from fastapi import FastAPI

from app.routers import alerts, keywords, locations, posts, recipients, system

app = FastAPI(
    title="Nextdoor Monitor",
    description="Monitors Nextdoor posts for keyword matches and sends email alerts.",
    version="1.0.0",
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
