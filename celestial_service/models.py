# celestial_service/models.py
from pydantic import BaseModel
from typing import List, Optional, Dict, Literal

class Position(BaseModel):
    time: str
    altitude: float
    azimuth: float

class BaseData(BaseModel):
    magnitude: Optional[float] = None
    constellation: Optional[str] = None

class Visibility(BaseModel):
    isVisible: bool
    message: str

class CelestialObject(BaseModel):
    name: str
    type: Literal['planet', 'star', 'moon', 'sun']
    base_data: BaseData
    visibility: Visibility  # Changed to required Visibility object
    daily_path: List[Position]