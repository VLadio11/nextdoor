from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class RawPost:
    """Normalized post representation from any source."""

    external_id: str
    source: str
    content: str
    author_name: str | None = None
    posted_at: datetime | None = None
    neighborhood: str | None = None
    source_url: str | None = None
    raw_payload: dict = field(default_factory=dict)


class BaseSource(ABC):
    """Abstract base for all post ingestion sources.

    Extend this class to add support for new platforms beyond Nextdoor.
    """

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
    ) -> list[RawPost]:
        """Fetch posts matching the given location and keywords."""
        ...
