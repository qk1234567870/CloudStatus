from dataclasses import dataclass, asdict
from typing import Optional, List

@dataclass
class Event:
    title: str
    status: str
    start: Optional[str] = None
    end: Optional[str] = None
    url: str = ""
    timestamp: int = 0

    def to_dict(self):
        return asdict(self)

@dataclass
class ServiceResult:
    id: str
    name: str
    desc: str
    category: str
    page: str
    state: str
    source: str
    events: List[Event]
    fallback_page: str = ""

    def to_dict(self):
        data = asdict(self)
        data["events"] = [e.to_dict() for e in self.events]
        return data
