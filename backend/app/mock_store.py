"""
In-memory mock store — replaces the database for local development.
All data lives in module-level dicts and is reset on server restart.
"""
import uuid
from datetime import datetime, timezone

# ── helpers ───────────────────────────────────────────────────────────────────

def _now():
    return datetime.now(timezone.utc)

def _dt(year, month, day, hour=0, minute=0):
    return datetime(year, month, day, hour, minute, tzinfo=timezone.utc)


# ── seed IDs ─────────────────────────────────────────────────────────────────

LOC1 = uuid.UUID("11111111-0000-0000-0000-000000000001")
LOC2 = uuid.UUID("11111111-0000-0000-0000-000000000002")
LOC3 = uuid.UUID("11111111-0000-0000-0000-000000000003")

KW1 = uuid.UUID("22222222-0000-0000-0000-000000000001")
KW2 = uuid.UUID("22222222-0000-0000-0000-000000000002")
KW3 = uuid.UUID("22222222-0000-0000-0000-000000000003")
KW4 = uuid.UUID("22222222-0000-0000-0000-000000000004")

REC1 = uuid.UUID("33333333-0000-0000-0000-000000000001")
REC2 = uuid.UUID("33333333-0000-0000-0000-000000000002")

POST1 = uuid.UUID("44444444-0000-0000-0000-000000000001")
POST2 = uuid.UUID("44444444-0000-0000-0000-000000000002")
POST3 = uuid.UUID("44444444-0000-0000-0000-000000000003")
POST4 = uuid.UUID("44444444-0000-0000-0000-000000000004")
POST5 = uuid.UUID("44444444-0000-0000-0000-000000000005")
POST6 = uuid.UUID("44444444-0000-0000-0000-000000000006")
POST7 = uuid.UUID("44444444-0000-0000-0000-000000000007")
POST8 = uuid.UUID("44444444-0000-0000-0000-000000000008")

ALERT1 = uuid.UUID("55555555-0000-0000-0000-000000000001")
ALERT2 = uuid.UUID("55555555-0000-0000-0000-000000000002")
ALERT3 = uuid.UUID("55555555-0000-0000-0000-000000000003")
ALERT4 = uuid.UUID("55555555-0000-0000-0000-000000000004")
ALERT5 = uuid.UUID("55555555-0000-0000-0000-000000000005")

LOG1 = uuid.UUID("66666666-0000-0000-0000-000000000001")
LOG2 = uuid.UUID("66666666-0000-0000-0000-000000000002")
LOG3 = uuid.UUID("66666666-0000-0000-0000-000000000003")
LOG4 = uuid.UUID("66666666-0000-0000-0000-000000000004")
LOG5 = uuid.UUID("66666666-0000-0000-0000-000000000005")
LOG6 = uuid.UUID("66666666-0000-0000-0000-000000000006")


# ── seed data ─────────────────────────────────────────────────────────────────

locations: dict[uuid.UUID, dict] = {
    LOC1: {
        "id": LOC1, "name": "Downtown SF", "latitude": 37.7749,
        "longitude": -122.4194, "radius_km": 3.0, "is_active": True,
        "created_at": _dt(2026, 1, 10),
    },
    LOC2: {
        "id": LOC2, "name": "Mission District", "latitude": 37.7599,
        "longitude": -122.4148, "radius_km": 2.5, "is_active": True,
        "created_at": _dt(2026, 1, 12),
    },
    LOC3: {
        "id": LOC3, "name": "Castro", "latitude": 37.7609,
        "longitude": -122.4350, "radius_km": 2.0, "is_active": False,
        "created_at": _dt(2026, 1, 15),
    },
}

keywords: dict[uuid.UUID, dict] = {
    KW1: {"id": KW1, "phrase": "break-in",     "is_active": True,  "created_at": _dt(2026, 1, 10)},
    KW2: {"id": KW2, "phrase": "package theft", "is_active": True,  "created_at": _dt(2026, 1, 11)},
    KW3: {"id": KW3, "phrase": "car vandalism", "is_active": True,  "created_at": _dt(2026, 1, 12)},
    KW4: {"id": KW4, "phrase": "noise complaint","is_active": False, "created_at": _dt(2026, 1, 13)},
}

recipients: dict[uuid.UUID, dict] = {
    REC1: {
        "id": REC1, "email": "alice@example.com", "name": "Alice",
        "is_active": True, "created_at": _dt(2026, 1, 10),
    },
    REC2: {
        "id": REC2, "email": "bob@example.com", "name": "Bob",
        "is_active": True, "created_at": _dt(2026, 1, 14),
    },
}

posts: dict[uuid.UUID, dict] = {
    POST1: {
        "id": POST1, "source": "nextdoor", "external_id": "nd-10001",
        "location_id": LOC1,
        "content": "Heads up neighbors — there was a break-in on Oak St last night. Stay safe!",
        "author_name": "Jane D.", "neighborhood": "Downtown SF",
        "source_url": "https://nextdoor.com/p/10001",
        "posted_at": _dt(2026, 3, 14, 9, 15), "first_seen_at": _dt(2026, 3, 14, 9, 20),
    },
    POST2: {
        "id": POST2, "source": "nextdoor", "external_id": "nd-10002",
        "location_id": LOC2,
        "content": "My package was stolen off my porch this morning around 8am. Anyone else?",
        "author_name": "Carlos M.", "neighborhood": "Mission District",
        "source_url": "https://nextdoor.com/p/10002",
        "posted_at": _dt(2026, 3, 14, 11, 0), "first_seen_at": _dt(2026, 3, 14, 11, 5),
    },
    POST3: {
        "id": POST3, "source": "nextdoor", "external_id": "nd-10003",
        "location_id": LOC1,
        "content": "Car vandalism near the park — windows smashed on three cars overnight.",
        "author_name": "Sam T.", "neighborhood": "Downtown SF",
        "source_url": "https://nextdoor.com/p/10003",
        "posted_at": _dt(2026, 3, 14, 14, 30), "first_seen_at": _dt(2026, 3, 14, 14, 35),
    },
    POST4: {
        "id": POST4, "source": "nextdoor", "external_id": "nd-10004",
        "location_id": LOC2,
        "content": "Lost dog — brown lab named Max, last seen near Valencia St.",
        "author_name": "Priya K.", "neighborhood": "Mission District",
        "source_url": "https://nextdoor.com/p/10004",
        "posted_at": _dt(2026, 3, 15, 8, 0), "first_seen_at": _dt(2026, 3, 15, 8, 5),
    },
    POST5: {
        "id": POST5, "source": "nextdoor", "external_id": "nd-10005",
        "location_id": LOC1,
        "content": "Another package theft reported on Market St — police case opened.",
        "author_name": "Tom H.", "neighborhood": "Downtown SF",
        "source_url": "https://nextdoor.com/p/10005",
        "posted_at": _dt(2026, 3, 15, 10, 45), "first_seen_at": _dt(2026, 3, 15, 10, 50),
    },
    POST6: {
        "id": POST6, "source": "nextdoor", "external_id": "nd-10006",
        "location_id": LOC3,
        "content": "Noise complaint filed against the venue on 18th — third time this month.",
        "author_name": "Linda F.", "neighborhood": "Castro",
        "source_url": "https://nextdoor.com/p/10006",
        "posted_at": _dt(2026, 3, 15, 20, 0), "first_seen_at": _dt(2026, 3, 15, 20, 5),
    },
    POST7: {
        "id": POST7, "source": "nextdoor", "external_id": "nd-10007",
        "location_id": LOC1,
        "content": "Break-in at the corner store on 5th Ave — happened around 2am.",
        "author_name": "Wei Z.", "neighborhood": "Downtown SF",
        "source_url": "https://nextdoor.com/p/10007",
        "posted_at": _dt(2026, 3, 16, 7, 0), "first_seen_at": _dt(2026, 3, 16, 7, 5),
    },
    POST8: {
        "id": POST8, "source": "nextdoor", "external_id": "nd-10008",
        "location_id": LOC2,
        "content": "Community garden cleanup this Saturday — all welcome!",
        "author_name": "Rosa B.", "neighborhood": "Mission District",
        "source_url": "https://nextdoor.com/p/10008",
        "posted_at": _dt(2026, 3, 16, 9, 30), "first_seen_at": _dt(2026, 3, 16, 9, 35),
    },
}

notification_logs: dict[uuid.UUID, dict] = {
    LOG1: {"id": LOG1, "alert_id": ALERT1, "recipient_id": REC1, "sent_at": _dt(2026, 3, 14, 9, 21),  "status": "sent",   "error_message": None, "attempt_count": 1},
    LOG2: {"id": LOG2, "alert_id": ALERT1, "recipient_id": REC2, "sent_at": _dt(2026, 3, 14, 9, 21),  "status": "sent",   "error_message": None, "attempt_count": 1},
    LOG3: {"id": LOG3, "alert_id": ALERT2, "recipient_id": REC1, "sent_at": _dt(2026, 3, 14, 11, 6),  "status": "sent",   "error_message": None, "attempt_count": 1},
    LOG4: {"id": LOG4, "alert_id": ALERT3, "recipient_id": REC1, "sent_at": None,                      "status": "failed", "error_message": "SMTP connection timeout", "attempt_count": 3},
    LOG5: {"id": LOG5, "alert_id": ALERT4, "recipient_id": REC1, "sent_at": _dt(2026, 3, 15, 10, 51), "status": "sent",   "error_message": None, "attempt_count": 1},
    LOG6: {"id": LOG6, "alert_id": ALERT5, "recipient_id": REC2, "sent_at": _dt(2026, 3, 16, 7, 6),   "status": "sent",   "error_message": None, "attempt_count": 1},
}

alerts: dict[uuid.UUID, dict] = {
    ALERT1: {
        "id": ALERT1, "post_id": POST1, "matched_keyword": "break-in",
        "triggered_at": _dt(2026, 3, 14, 9, 20),
        "post": posts[POST1],
        "notification_logs": [notification_logs[LOG1], notification_logs[LOG2]],
    },
    ALERT2: {
        "id": ALERT2, "post_id": POST2, "matched_keyword": "package theft",
        "triggered_at": _dt(2026, 3, 14, 11, 5),
        "post": posts[POST2],
        "notification_logs": [notification_logs[LOG3]],
    },
    ALERT3: {
        "id": ALERT3, "post_id": POST3, "matched_keyword": "car vandalism",
        "triggered_at": _dt(2026, 3, 14, 14, 35),
        "post": posts[POST3],
        "notification_logs": [notification_logs[LOG4]],
    },
    ALERT4: {
        "id": ALERT4, "post_id": POST5, "matched_keyword": "package theft",
        "triggered_at": _dt(2026, 3, 15, 10, 50),
        "post": posts[POST5],
        "notification_logs": [notification_logs[LOG5]],
    },
    ALERT5: {
        "id": ALERT5, "post_id": POST7, "matched_keyword": "break-in",
        "triggered_at": _dt(2026, 3, 16, 7, 5),
        "post": posts[POST7],
        "notification_logs": [notification_logs[LOG6]],
    },
}
