from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from typing import Dict, List
import json
import requests
from calculator import CelestialCalculator
from models import CelestialObject, Position, Visibility, Weather
import ephem
import numpy as np
import logging
from typing import Optional

# Configure logging with more detail
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
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

SUPPORTED_PLANETS = [
    "Mercury", "Venus", "Mars", "Jupiter", 
    "Saturn", "Uranus", "Neptune"
]

# Default location (Cambridge)
DEFAULT_LAT = 43.397221
DEFAULT_LONG = -80.311386

# Weather API parameters - (OpenWeatherMap API)
WEATHER_MOCK_ENABLED = True  # Set to False when using real API
OPENWEATHERMAP_API_KEY = ""  # Add your API key here

def get_planet_body(planet_name: str) -> ephem.Planet:
    """Helper function to get the appropriate ephem Planet object"""
    logger.debug(f"Creating ephem body for planet: {planet_name}")
    planet_classes = {
        "Mercury": ephem.Mercury,
        "Venus": ephem.Venus,
        "Mars": ephem.Mars,
        "Jupiter": ephem.Jupiter,
        "Saturn": ephem.Saturn,
        "Uranus": ephem.Uranus,
        "Neptune": ephem.Neptune
    }
    
    planet_class = planet_classes.get(planet_name)
    if not planet_class:
        logger.error(f"Unknown planet requested: {planet_name}")
        raise ValueError(f"Unknown planet: {planet_name}")
    
    return planet_class()

async def get_planet_data(planet_name: str) -> CelestialObject:
    """Calculate detailed data for a specific planet"""
    logger.info(f"Calculating detailed data for planet: {planet_name}")
    
    try:
        # Create planet object and set current time
        planet = get_planet_body(planet_name)
        current_time = datetime.now()
        calculator.observer.date = current_time
        
        # Compute current position
        planet.compute(calculator.observer)
        
        # Calculate daily path (positions throughout the day)
        daily_path: List[Position] = []
        start_time = current_time.replace(hour=0, minute=0, second=0, microsecond=0)
        
        for hour in range(24):
            time = start_time + timedelta(hours=hour)
            calculator.observer.date = time
            planet.compute(calculator.observer)
            
            position = Position(
                time=time.isoformat(),
                altitude=float(planet.alt) * 180/np.pi,
                azimuth=float(planet.az) * 180/np.pi
            )
            daily_path.append(position)
        
        # Calculate visibility information
        calculator.observer.date = current_time
        planet.compute(calculator.observer)
        
        # Get next rise and set times
        try:
            next_rise = ephem.Date(calculator.observer.next_rising(planet)).datetime()
            next_set = ephem.Date(calculator.observer.next_setting(planet)).datetime()
        except ephem.CircumpolarError:
            next_rise = None
            next_set = None
        
        # Determine current visibility
        current_alt = float(planet.alt) * 180/np.pi
        is_visible = current_alt > 0
        
        visibility_message = []
        if is_visible:
            visibility_message.append(f"Currently visible at {current_alt:.1f}° above horizon")
        else:
            visibility_message.append("Currently below horizon")
        
        if next_rise:
            visibility_message.append(f"Next rise: {next_rise.strftime('%H:%M')}")
        if next_set:
            visibility_message.append(f"Next set: {next_set.strftime('%H:%M')}")
        
        visibility = Visibility(
            isVisible=is_visible,
            message="\n".join(visibility_message)
        )
        
        # Get additional base data
        base_data = {
            "constellation": ephem.constellation(planet)[1],
            "magnitude": float(planet.mag),
            "phase": float(planet.phase) if hasattr(planet, 'phase') else None
        }
        
        logger.info(f"Successfully calculated data for {planet_name}")
        return CelestialObject(
            name=planet_name,
            type="planet",
            daily_path=daily_path,
            visibility=visibility,
            base_data=base_data
        )
        
    except Exception as e:
        logger.error(f"Error calculating planet data for {planet_name}: {str(e)}", exc_info=True)
        raise

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

@app.get("/daily_positions")
async def get_daily_positions() -> Dict[str, CelestialObject]:
    """Get daily positions for all planets"""
    logger.info("Calculating daily positions for all planets")
    try:
        result = {}
        for planet_name in SUPPORTED_PLANETS:
            planet_data = await get_planet_data(planet_name)
            result[planet_name] = planet_data
        
        # Add moon data
        calculator.observer.date = datetime.now()
        moon = ephem.Moon()
        moon.compute(calculator.observer)
        
        daily_path = []
        start_time = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        for hour in range(24):
            time = start_time + timedelta(hours=hour)
            calculator.observer.date = time
            moon.compute(calculator.observer)
            
            position = Position(
                time=time.isoformat(),
                altitude=float(moon.alt) * 180/np.pi,
                azimuth=float(moon.az) * 180/np.pi
            )
            daily_path.append(position)
        
        result["Moon"] = CelestialObject(
            name="Moon",
            type="moon",
            daily_path=daily_path,
            visibility=Visibility(
                isVisible=float(moon.alt) > 0,
                message="Moon visibility information"
            ),
            base_data={"phase": float(moon.phase)}
        )
        
        return result
    except Exception as e:
        logger.error(f"Error in get_daily_positions: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/combined-positions")
async def get_combined_positions():
    """Get combined daily and realtime positions in a single request"""
    try:
        logger.info("Fetching combined positions")
        
        # Get current time for performance comparison
        start_time = datetime.now()
        
        # Get daily positions directly
        result = {}
        for planet_name in SUPPORTED_PLANETS:
            planet_data = await get_planet_data(planet_name)
            result[planet_name] = planet_data
        
        # Add moon data
        calculator.observer.date = datetime.now()
        moon = ephem.Moon()
        moon.compute(calculator.observer)
        
        daily_path = []
        start_time_day = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        for hour in range(24):
            time = start_time_day + timedelta(hours=hour)
            calculator.observer.date = time
            moon.compute(calculator.observer)
            
            position = Position(
                time=time.isoformat(),
                altitude=float(moon.alt) * 180/np.pi,
                azimuth=float(moon.az) * 180/np.pi
            )
            daily_path.append(position)
        
        result["Moon"] = CelestialObject(
            name="Moon",
            type="moon",
            daily_path=daily_path,
            visibility=Visibility(
                isVisible=float(moon.alt) > 0,
                message="Moon visibility information"
            ),
            base_data={"phase": float(moon.phase)}
        )
        
        daily_positions = result
        
        # Get realtime positions
        realtime_positions = await get_realtime_positions()
        
        # Merge realtime data into daily data
        current_time = datetime.now()
        for obj_name, position in realtime_positions.items():
            if obj_name in daily_positions:
                # Find the appropriate index in the daily path using binary search
                obj_data = daily_positions[obj_name]
                daily_path = obj_data.daily_path
                
                # Only process if there's a daily path
                if daily_path:
                    # Binary search implementation
                    low, high = 0, len(daily_path) - 1
                    current_idx = -1
                    
                    while low <= high and current_idx == -1:
                        mid = (low + high) // 2
                        mid_time = datetime.fromisoformat(daily_path[mid].time)
                        
                        if mid_time < current_time:
                            if mid == len(daily_path) - 1 or datetime.fromisoformat(daily_path[mid + 1].time) > current_time:
                                current_idx = mid
                            else:
                                low = mid + 1
                        else:
                            high = mid - 1
                    
                    # Update the position if found
                    if current_idx != -1 and current_idx < len(daily_path):
                        daily_positions[obj_name].daily_path[current_idx] = position
        
        # Log performance
        processing_time = (datetime.now() - start_time).total_seconds()
        logger.info(f"Combined positions processed in {processing_time:.3f} seconds")
        
        return daily_positions
    except Exception as e:
        logger.error(f"Error in get_combined_positions: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/planets")
async def list_planets():
    """Get list of all supported planets"""
    logger.info("Returning list of supported planets")
    return {"planets": SUPPORTED_PLANETS}

@app.get("/planet/{planet_name}")
async def get_planet(planet_name: str) -> CelestialObject:
    """Get detailed data for a specific planet"""
    try:
        # Normalize planet name to match our supported list
        normalized_name = planet_name.title()
        logger.info(f"Received request for planet: {planet_name} (normalized: {normalized_name})")
        
        if normalized_name not in SUPPORTED_PLANETS:
            logger.warning(f"Unsupported planet requested: {planet_name}")
            raise HTTPException(
                status_code=404, 
                detail=f"Planet {planet_name} not found. Supported planets: {', '.join(SUPPORTED_PLANETS)}"
            )
            
        return await get_planet_data(normalized_name)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing request for {planet_name}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/weather")
async def get_weather(lat: float = DEFAULT_LAT, lon: float = DEFAULT_LONG) -> Weather:
    """Get current weather conditions for astronomical observations"""
    try:
        logger.info(f"Fetching weather data for coordinates: {lat}, {lon}")
        
        # Calculate sunrise and sunset times using ephem
        obs = ephem.Observer()
        obs.lat = str(lat)
        obs.lon = str(lon)
        
        # Calculate today's sunrise
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        obs.date = today
        sun = ephem.Sun()
        
        # Calculate sunrise and time to leave (30 minutes before sunrise)
        next_sunrise = obs.next_rising(sun).datetime()
        time_to_leave = next_sunrise - timedelta(minutes=30)
        
        if WEATHER_MOCK_ENABLED:
            # Mock data since we don't have a real API key
            # In a real app, we would call the OpenWeatherMap API like:
            # response = requests.get(f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API_KEY}&units=metric")
            
            # Get current time
            current_time = datetime.now()
            
            # Generate realistic mock weather based on time of day and randomness
            hour = current_time.hour
            is_night = hour >= 18 or hour <= 6
            
            # Generate some randomness for the weather conditions
            import random
            rand_factor = random.random()
            
            # Conditions are better at night for observations
            if is_night:
                cloud_cover = random.randint(0, 40)  # Less clouds at night in our simulation
                condition = "Clear" if cloud_cover < 20 else "Partly Cloudy"
                temperature = 10 + (rand_factor * 10)  # 10-20 degrees at night
            else:
                cloud_cover = random.randint(20, 80)  # More clouds during the day
                if cloud_cover < 30:
                    condition = "Clear"
                elif cloud_cover < 60:
                    condition = "Partly Cloudy"
                else:
                    condition = "Cloudy"
                temperature = 15 + (rand_factor * 15)  # 15-30 degrees during the day
            
            # Wind affects observation quality
            wind_speed = random.randint(0, 25) / 3.6  # Convert km/h to m/s
            
            # Humidity
            humidity = random.randint(40, 90)
            
            # Atmospheric visibility (good for observation)
            visibility = 5 + (rand_factor * 15)  # 5-20 km
            
            # Determine if conditions are good for observation
            is_good_for_observation = (
                is_night and 
                cloud_cover < 30 and 
                wind_speed < 5 and 
                visibility > 10
            )
            
            weather_data = Weather(
                temperature=round(temperature, 1),
                condition=condition,
                humidity=humidity,
                wind_speed=round(wind_speed, 1),
                cloud_cover=cloud_cover,
                visibility=round(visibility, 1),
                observation_time=current_time.isoformat(),
                is_good_for_observation=is_good_for_observation,
                sunrise_time=next_sunrise.isoformat(),
                time_to_leave=time_to_leave.isoformat()
            )
            
            logger.info(f"Weather conditions: {condition}, Cloud cover: {cloud_cover}%, Good for observation: {is_good_for_observation}")
            return weather_data
        else:
            # Use the real OpenWeatherMap API
            if not OPENWEATHERMAP_API_KEY:
                raise ValueError("OpenWeatherMap API key not configured. Please add your API key to OPENWEATHERMAP_API_KEY.")
                
            # Make request to OpenWeatherMap API
            response = requests.get(
                f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={OPENWEATHERMAP_API_KEY}&units=metric"
            )
            
            if response.status_code != 200:
                logger.error(f"OpenWeatherMap API error: {response.status_code} - {response.text}")
                raise HTTPException(status_code=502, detail=f"Weather API error: {response.status_code}")
                
            data = response.json()
            
            # Extract data from OpenWeatherMap response
            weather_condition = data['weather'][0]['main']
            weather_description = data['weather'][0]['description']
            temp = data['main']['temp']
            humidity = data['main']['humidity']
            
            # Wind speed comes in m/s by default with units=metric
            wind_speed = data['wind']['speed']
            
            # Cloud cover percentage
            cloud_cover = data.get('clouds', {}).get('all', 0)
            
            # Visibility in km (comes in meters from API)
            visibility = data.get('visibility', 0) / 1000
            
            # Current time
            current_time = datetime.now()
            
            # Determine if conditions are good for observation
            # Good conditions: Clear sky at night, low wind, good visibility
            is_night = current_time.hour >= 18 or current_time.hour <= 6
            is_clear = weather_condition.lower() in ['clear', 'few clouds']
            is_calm = wind_speed < 5.0
            is_visible = visibility > 8.0
            
            is_good_for_observation = is_night and is_clear and is_calm and is_visible
            
            # Create weather data object
            weather_data = Weather(
                temperature=temp,
                condition=weather_condition,
                humidity=humidity,
                wind_speed=wind_speed,
                cloud_cover=cloud_cover,
                visibility=visibility,
                observation_time=current_time.isoformat(),
                is_good_for_observation=is_good_for_observation,
                sunrise_time=next_sunrise.isoformat(),
                time_to_leave=time_to_leave.isoformat()
            )
            
            logger.info(f"Weather from API: {weather_condition}, Cloud cover: {cloud_cover}%, Good for observation: {is_good_for_observation}")
            return weather_data
            
    except Exception as e:
        logger.error(f"Error fetching weather data: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error fetching weather data: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting FastAPI server")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")