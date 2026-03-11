# Nextdoor Monitor

A production-ready monitoring and alerting app that watches Nextdoor for posts matching your keywords in specified locations and sends immediate email notifications when a match is found.

---

## Feasibility & Compliance

| Method | Status |
|---|---|
| **Official Nextdoor Search API** | ✅ Exists — requires approval |
| Web scraping | ❌ Violates ToS |
| Unofficial API endpoints | ❌ Violates ToS |

**This app is built exclusively against Nextdoor's official Search API** (`developer.nextdoor.com`).

### Getting API Access

1. Visit [developer.nextdoor.com](https://developer.nextdoor.com)
2. Contact **partnerships@nextdoor.com** to request Search API access
3. Once approved, set `NEXTDOOR_API_KEY` and `NEXTDOOR_API_SECRET` in your `.env` and set `SIM_MODE=false`

**While waiting for approval:** Set `SIM_MODE=true` (the default). The app generates realistic fake posts so the entire pipeline — polling, keyword matching, deduplication, email alerts — works immediately without any API credentials.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Docker Compose                                      │
│                                                      │
│  ┌──────────┐   ┌────────────────────────────────┐  │
│  │ postgres │   │  backend (FastAPI + APScheduler)│  │
│  │  :5432   │◄──│  :8000                          │  │
│  └──────────┘   │  ┌──────────────────────────┐  │  │
│                 │  │  PollOrchestrator (job)   │  │  │
│  ┌──────────┐   │  │  NextdoorSource (or sim)  │  │  │
│  │ frontend │   │  │  KeywordMatcher           │  │  │
│  │ (nginx)  │   │  │  PostDeduplicator         │  │  │
│  │  :80     │──►│  │  AlertNotifier (SMTP)     │  │  │
│  └──────────┘   │  └──────────────────────────┘  │  │
│                 └────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Backend modules:**

| Module | Responsibility |
|---|---|
| `services/sources/base.py` | Abstract `BaseSource` — extend to add new platforms |
| `services/sources/nextdoor.py` | Official Nextdoor API client (real + sim mode) |
| `services/sources/simulator.py` | Simulated post generator for dev |
| `services/matcher.py` | Case-insensitive keyword matching |
| `services/deduplicator.py` | Prevents duplicate alerts via DB unique constraint |
| `services/notifier.py` | Async SMTP email dispatch with retry |
| `services/email_renderer.py` | HTML + plain-text email templates |
| `services/poller.py` | Main polling orchestration loop |
| `scheduler.py` | APScheduler setup (runs inside FastAPI process) |
| `routers/` | FastAPI REST endpoints |

---

## Requirements

- Docker + Docker Compose ≥ 2.x
  _OR_ Python 3.12 + PostgreSQL 15 + Node 20 for local dev without Docker

---

## Quick Start (Docker)

```bash
# 1. Clone
git clone <repo-url>
cd nextdoor

# 2. Configure
cp .env.example .env
# Edit .env — at minimum set SMTP_* values for email delivery.
# Leave SIM_MODE=true to skip Nextdoor API credentials for now.

# 3. Start
docker compose up --build

# 4. Open admin UI
open http://localhost
# or: http://localhost:80

# 5. Open API docs
open http://localhost:8000/docs
```

The backend auto-runs Alembic migrations on startup.

---

## Local Development (without Docker)

### Backend

```bash
cd backend

# Create and activate virtualenv
python -m venv .venv
source .venv/bin/activate     # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp ../.env.example .env
# Edit .env — set DATABASE_URL to point to your local Postgres

# Run migrations
alembic upgrade head

# Start the API server (hot-reload)
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Visit http://localhost:5173
```

### PostgreSQL (local)

```bash
# Create database
createuser -P nextdoor       # password: nextdoor
createdb -O nextdoor nextdoor
```

---

## Development Mode with Docker

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

This mounts source directories for hot-reload and uses `SIM_MODE=true` by default.

---

## Configuration

All configuration is via environment variables. See `.env.example` for the full list.

### Key Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://...` | PostgreSQL connection string |
| `SIM_MODE` | `true` | Use simulated posts (no API key needed) |
| `NEXTDOOR_API_KEY` | — | Nextdoor OAuth client ID |
| `NEXTDOOR_API_SECRET` | — | Nextdoor OAuth client secret |
| `SMTP_HOST` | `smtp.gmail.com` | SMTP server host |
| `SMTP_PORT` | `587` | SMTP server port |
| `SMTP_USER` | — | SMTP username |
| `SMTP_PASSWORD` | — | SMTP password / app password |
| `SMTP_FROM` | — | From address for alert emails |
| `POLL_INTERVAL_SECONDS` | `300` | How often to poll (seconds) |
| `NEXTDOOR_REQUESTS_PER_MINUTE` | `10` | Rate limit for API calls |
| `ENVIRONMENT` | `development` | `development` or `production` |
| `LOG_LEVEL` | `INFO` | `DEBUG`, `INFO`, `WARNING`, `ERROR` |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Comma-separated allowed origins |

---

## API Reference

Base URL: `http://localhost:8000`

Interactive docs: `http://localhost:8000/docs`

### Locations
| Method | Path | Description |
|---|---|---|
| GET | `/api/locations/` | List all locations |
| POST | `/api/locations/` | Create location |
| GET | `/api/locations/{id}` | Get location |
| PUT | `/api/locations/{id}` | Update location |
| DELETE | `/api/locations/{id}` | Delete location |

### Keywords
| Method | Path | Description |
|---|---|---|
| GET | `/api/keywords/` | List all keywords |
| POST | `/api/keywords/` | Create keyword |
| PUT | `/api/keywords/{id}` | Update keyword |
| DELETE | `/api/keywords/{id}` | Delete keyword |

### Recipients
| Method | Path | Description |
|---|---|---|
| GET | `/api/recipients/` | List all recipients |
| POST | `/api/recipients/` | Create recipient |
| PUT | `/api/recipients/{id}` | Update recipient |
| DELETE | `/api/recipients/{id}` | Delete recipient |

### Alerts (read-only)
| Method | Path | Description |
|---|---|---|
| GET | `/api/alerts/` | List alerts (supports `?limit&offset&start_date&end_date`) |
| GET | `/api/alerts/{id}` | Get alert with notification logs |

### Posts (read-only)
| Method | Path | Description |
|---|---|---|
| GET | `/api/posts/` | List discovered posts (`?limit&offset&location_id`) |

### System
| Method | Path | Description |
|---|---|---|
| GET | `/api/system/status` | Scheduler status, sim mode, last run result |
| POST | `/api/system/poll-now` | Trigger immediate poll (async, 202) |
| GET | `/health` | Health check |

---

## Database Schema

```
locations          — monitored geographic areas
keywords           — phrases to match
recipients         — email alert targets
discovered_posts   — normalized posts from Nextdoor (or simulator)
alerts             — one record per (post, keyword) match
notification_logs  — one record per (alert, recipient) send attempt
```

Deduplication is enforced by DB unique constraints:
- `discovered_posts(source, external_id)` — never processes the same post twice
- `alerts(post_id, matched_keyword)` — never sends the same alert twice

---

## Deploying to a VPS / Cloud

```bash
# On the server:
git clone <repo-url>
cd nextdoor

cp .env.example .env
# Edit .env — set SIM_MODE=false, NEXTDOOR_API_KEY, SMTP_*, CORS_ORIGINS

docker compose up -d --build

# Check logs
docker compose logs -f backend
```

For HTTPS, put an nginx reverse proxy or Caddy in front of the `frontend` container (port 80).

### Environment checklist before going live
- [ ] `SIM_MODE=false`
- [ ] `NEXTDOOR_API_KEY` and `NEXTDOOR_API_SECRET` set
- [ ] `SMTP_*` configured and tested
- [ ] `ENVIRONMENT=production`
- [ ] `CORS_ORIGINS` set to your actual domain
- [ ] Database volume backed up regularly

---

## Extending to Other Sources

To add a new platform (e.g. Craigslist, Facebook Groups):

1. Create `backend/app/services/sources/craigslist.py` implementing `BaseSource`
2. Add it to `PollOrchestrator` in `services/poller.py`

The `BaseSource` protocol:

```python
class BaseSource(ABC):
    @property
    @abstractmethod
    def source_name(self) -> str: ...

    @abstractmethod
    async def fetch_posts(
        self,
        latitude: float,
        longitude: float,
        radius_km: float,
        keywords: list[str],
    ) -> list[RawPost]: ...
```

---

## Tradeoffs & Limitations

| Limitation | Detail |
|---|---|
| **API approval required** | Nextdoor Search API needs formal approval. Simulation mode bridges the gap. |
| **Polling only** | Nextdoor provides no webhooks. New posts appear after the next poll cycle. |
| **30-day post window** | Nextdoor's Search API only returns posts from the last 30 days. |
| **No auth on admin UI** | The admin UI has no login. Deploy behind a VPN or add HTTP Basic Auth at the nginx layer. |
| **Single process scheduler** | APScheduler runs in-process. For multi-worker deployments, use APScheduler's database job store or an external task queue. |
