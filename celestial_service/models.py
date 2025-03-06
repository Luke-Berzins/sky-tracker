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

class Weather(BaseModel):
    temperature: float  # in Celsius
    condition: str  # e.g., "Clear", "Cloudy", "Rain"
    humidity: float  # percentage
    wind_speed: float  # in m/s
    cloud_cover: float  # percentage
    visibility: float  # in km
    observation_time: str  # ISO format time string
    is_good_for_observation: bool  # Whether conditions are good for sky observation
    sunrise_time: Optional[str] = None  # ISO format time string for sunrise
    time_to_leave: Optional[str] = None  # ISO format time string for when to leave (30 min before sunrise)