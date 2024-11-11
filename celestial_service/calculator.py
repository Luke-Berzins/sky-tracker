# celestial_service/calculator.py
import ephem
from datetime import datetime, timedelta
import numpy as np
from typing import List
from models import Position, CelestialObject, BaseData, Visibility

class CelestialCalculator:
    def __init__(self, lat: float = 43.397221, lon: float = -80.311386):
        self.observer = ephem.Observer()
        self.observer.lat = str(lat)
        self.observer.lon = str(lon)
        self.observer.elevation = 0
        
    def is_visible(self, body: ephem.Body) -> Visibility:
        """Determine if a celestial body is visible and return visibility info"""
        altitude_deg = float(body.alt) * 180/np.pi
        is_visible = altitude_deg > 0  # Basic visibility check - above horizon
        
        message = (
            f"Visible at {altitude_deg:.1f}° altitude"
            if is_visible
            else "Below horizon"
        )
        
        return Visibility(
            isVisible=is_visible,
            message=message
        )

    def calculate_daily_path(self, body: ephem.Body, date: datetime) -> List[Position]:
        positions = []
        
        # Calculate 24 hours worth of positions at 15-minute intervals
        for minutes in range(0, 24 * 60, 15):
            time = date + timedelta(minutes=minutes)
            self.observer.date = time
            
            try:
                body.compute(self.observer)
                positions.append(Position(
                    time=time.isoformat(),
                    altitude=float(body.alt) * 180/np.pi,
                    azimuth=float(body.az) * 180/np.pi
                ))
            except (ephem.AlwaysUpError, ephem.NeverUpError):
                continue
                
        return positions

    def get_planets_data(self) -> List[CelestialObject]:
        planets = []
        planet_bodies = [
            (ephem.Mercury(), "Mercury"),
            (ephem.Venus(), "Venus"),
            (ephem.Mars(), "Mars"),
            (ephem.Jupiter(), "Jupiter"),
            (ephem.Saturn(), "Saturn"),
            (ephem.Uranus(), "Uranus"),
            (ephem.Neptune(), "Neptune")
        ]
        
        for body, name in planet_bodies:
            try:
                self.observer.date = datetime.now()
                body.compute(self.observer)
                
                planets.append(CelestialObject(
                    name=name,
                    type="planet",
                    base_data=BaseData(
                        magnitude=float(body.mag),
                        constellation=ephem.constellation(body)[1]
                    ),
                    visibility=self.is_visible(body),
                    daily_path=self.calculate_daily_path(body, datetime.now())
                ))
            except Exception as e:
                print(f"Error calculating data for {name}: {str(e)}")
                continue
            
        return planets

    def get_moon_data(self) -> CelestialObject:
        moon = ephem.Moon()
        self.observer.date = datetime.now()
        moon.compute(self.observer)
        
        return CelestialObject(
            name="Moon",
            type="moon",
            base_data=BaseData(
                magnitude=float(moon.mag),
                constellation=ephem.constellation(moon)[1]
            ),
            visibility=self.is_visible(moon),
            daily_path=self.calculate_daily_path(moon, datetime.now())
        )

    def get_sun_data(self) -> CelestialObject:
        sun = ephem.Sun()
        self.observer.date = datetime.now()
        sun.compute(self.observer)
        
        return CelestialObject(
            name="Sun",
            type="sun",
            base_data=BaseData(),
            visibility=self.is_visible(sun),
            daily_path=self.calculate_daily_path(sun, datetime.now())
        )