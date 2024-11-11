# celestial_service/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from typing import Dict
import json
from calculator import CelestialCalculator
from models import CelestialObject, Position
import ephem
import numpy as np
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

calculator = CelestialCalculator()

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "time": datetime.now().isoformat()}

@app.get("/daily_positions")
async def get_daily_positions() -> Dict[str, CelestialObject]:
    try:
        logger.info("Calculating daily positions")
        
        # Calculate positions for all objects
        planets = calculator.get_planets_data()
        logger.info(f"Calculated positions for {len(planets)} planets")
        
        moon = calculator.get_moon_data()
        logger.info("Calculated moon position")
        
        sun = calculator.get_sun_data()
        logger.info("Calculated sun position")
        
        # Combine all data
        all_objects = {obj.name: obj for obj in planets}
        all_objects["Moon"] = moon
        all_objects["Sun"] = sun
        
        logger.info(f"Returning data for {len(all_objects)} celestial objects")
        return all_objects
    except Exception as e:
        logger.error(f"Error in get_daily_positions: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/realtime-positions")
async def get_realtime_positions() -> Dict[str, Position]:
    try:
        logger.info("Calculating realtime positions")
        
        calculator.observer.date = datetime.now()
        moon = ephem.Moon()
        moon.compute(calculator.observer)
        
        position = Position(
            time=datetime.now().isoformat(),
            altitude=float(moon.alt) * 180/np.pi,
            azimuth=float(moon.az) * 180/np.pi
        )
        
        logger.info(f"Moon position calculated: alt={position.altitude}, az={position.azimuth}")
        return {"Moon": position}
    except Exception as e:
        logger.error(f"Error in get_realtime_positions: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting FastAPI server")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")