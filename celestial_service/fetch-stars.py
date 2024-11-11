# celestial_service/data/fetch_stars.py
from skyfield.api import load, Star
from skyfield.data import hipparcos
import pandas as pd

def load_bright_stars():
    # Load the Hipparcos catalog
    with load.open(hipparcos.URL) as f:
        df = hipparcos.load_dataframe(f)
    
    # Filter for bright stars (magnitude < 4.5)
    bright_stars = df[df['magnitude'] <= 4.5].copy()
    
    # Add constellation data
    constellation_map = {
        'UMa': 'Ursa Major',
        'Ori': 'Orion',
        'Cas': 'Cassiopeia',
        'Lyr': 'Lyra',
        'Cyg': 'Cygnus',
        'Aql': 'Aquila',
        'CMa': 'Canis Major',
        'Boo': 'Boötes',
        'Aur': 'Auriga',
        'Tau': 'Taurus',
        # Add more constellations as needed
    }
    
    # Save to CSV for quick loading
    bright_stars.to_csv('data/bright_stars.csv', index=False)
    return bright_stars

# celestial_service/calculator.py
from skyfield.api import load, wgs84
import pandas as pd
import numpy as np
from datetime import datetime
import os

class CelestialCalculator:
    def __init__(self, lat: float = 43.397221, lon: float = -80.311386):
        self.observer = wgs84.latlon(lat, lon)
        self.ts = load.timescale()
        
        # Load star data
        self.stars_df = self._load_stars()
        
        # Load ephemeris for planets
        self.eph = load('de421.bsp')
        self.earth = self.eph['earth']
        self.sun = self.eph['sun']
        self.moon = self.eph['moon']
        
    def _load_stars(self):
        star_file = 'data/bright_stars.csv'
        if not os.path.exists(star_file):
            return load_bright_stars()
        return pd.read_csv(star_file)
    
    def get_star_positions(self):
        """Calculate positions of bright stars"""
        t = self.ts.now()
        observer_loc = self.earth + self.observer
        
        star_data = []
        for _, star in self.stars_df.iterrows():
            s = Star(
                ra_hours=float(star.ra_hours),
                dec_degrees=float(star.dec_degrees),
                ra_mas_per_year=float(star.ra_mas_per_year),
                dec_mas_per_year=float(star.dec_mas_per_year),
                parallax_mas=float(star.parallax_mas),
            )
            
            # Calculate star's position
            apparent = observer_loc.at(t).observe(s).apparent()
            alt, az, _ = apparent.altaz()
            
            # Only include if above horizon
            if alt.degrees > 0:
                star_data.append({
                    'name': star.get('proper_name', f'HIP {star.hip}'),
                    'type': 'star',
                    'magnitude': float(star.magnitude),
                    'constellation': star.get('constellation', 'Unknown'),
                    'visibility': {
                        'isVisible': True,
                        'message': f'Visible at {alt.degrees:.1f}° altitude'
                    },
                    'position': {
                        'altitude': float(alt.degrees),
                        'azimuth': float(az.degrees)
                    },
                    'daily_path': self._calculate_star_daily_path(s)
                })
        
        return star_data
    
    def _calculate_star_daily_path(self, star):
        """Calculate star positions throughout the day"""
        path = []
        t = self.ts.now()
        observer_loc = self.earth + self.observer
        
        # Calculate positions every hour
        for hour in range(24):
            time = t + hour/24.0  # Add hours
            apparent = observer_loc.at(time).observe(star).apparent()
            alt, az, _ = apparent.altaz()
            
            path.append({
                'time': (datetime.now().replace(hour=hour, minute=0, second=0, microsecond=0)).isoformat(),
                'altitude': float(alt.degrees),
                'azimuth': float(az.degrees)
            })
        
        return path

    def get_constellation_lines(self):
        """Define constellation lines for major constellations"""
        constellations = {
            'Ursa Major': [
                ('Dubhe', 'Merak'),
                ('Merak', 'Phecda'),
                ('Phecda', 'Megrez'),
                ('Megrez', 'Alioth'),
                ('Alioth', 'Mizar'),
                ('Mizar', 'Alkaid'),
            ],
            'Orion': [
                ('Betelgeuse', 'Bellatrix'),
                ('Bellatrix', 'Rigel'),
                ('Betelgeuse', 'Rigel'),
                ('Alnitak', 'Alnilam'),
                ('Alnilam', 'Mintaka'),
            ],
            # Add more constellations as needed
        }
        
        visible_lines = {}
        t = self.ts.now()
        observer_loc = self.earth + self.observer
        
        for const_name, lines in constellations.items():
            const_lines = []
            for star1_name, star2_name in lines:
                # Get stars from dataframe
                star1 = self.stars_df[self.stars_df['proper_name'] == star1_name]
                star2 = self.stars_df[self.stars_df['proper_name'] == star2_name]
                
                if not star1.empty and not star2.empty:
                    # Calculate positions
                    s1 = Star(ra_hours=float(star1.ra_hours), dec_degrees=float(star1.dec_degrees))
                    s2 = Star(ra_hours=float(star2.ra_hours), dec_degrees=float(star2.dec_degrees))
                    
                    pos1 = observer_loc.at(t).observe(s1).apparent().altaz()
                    pos2 = observer_loc.at(t).observe(s2).apparent().altaz()
                    
                    # Only include if both stars are above horizon
                    if pos1[0].degrees > 0 and pos2[0].degrees > 0:
                        const_lines.append({
                            'star1': {'name': star1_name, 'alt': float(pos1[0].degrees), 'az': float(pos1[1].degrees)},
                            'star2': {'name': star2_name, 'alt': float(pos2[0].degrees), 'az': float(pos2[1].degrees)}
                        })
            
            if const_lines:  # Only include constellation if it has visible lines
                visible_lines[const_name] = const_lines
        
        return visible_lines
