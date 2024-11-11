# celestial_service/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
from calculator import CelestialCalculator

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

@app.get("/")
async def root():
    return {"status": "ok"}

@app.get("/celestial-data")
async def get_all_celestial_data():
    try:
        calculator = CelestialCalculator()
        data = calculator.get_all_data()
        return data
    except Exception as e:
        logger.error(f"Error getting celestial data: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stars")
async def get_stars():
    try:
        calculator = CelestialCalculator()
        stars = calculator.get_star_data()
        constellations = calculator.get_constellation_data()
        return {"stars": stars, "constellations": constellations}
    except Exception as e:
        logger.error(f"Error calculating star positions: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/daily_positions")
async def get_daily_positions():
    try:
        calculator = CelestialCalculator()
        planets = calculator.get_planets_data()
        moon = calculator.get_moon_data()
        sun = calculator.get_sun_data()
        return {
            "planets": planets,
            "moon": moon,
            "sun": sun
        }
    except Exception as e:
        logger.error(f"Error getting daily positions: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)