import azure.functions as func
import json
import math

# Grade threshold - below this is considered flat
GRADE_THRESHOLD = 2.0

# Runner level presets (protected backend logic)
RUNNER_LEVELS = {
    'beginner': {
        'name': 'Beginner',
        'flatPace': 8.0,      # 8:00/km
        'uphillRatio': 1.5,   # 12:00/km
        'downhillRatio': 0.9, # 7:12/km
        'dft': 6000
    },
    'intermediate': {
        'name': 'Intermediate',
        'flatPace': 6.5,      # 6:30/km
        'uphillRatio': 1.4,   # 9:06/km
        'downhillRatio': 0.85,
        'dft': 9000
    },
    'advanced': {
        'name': 'Advanced',
        'flatPace': 5.5,      # 5:30/km
        'uphillRatio': 1.3,
        'downhillRatio': 0.82,
        'dft': 12000
    },
    'elite': {
        'name': 'Elite',
        'flatPace': 4.5,      # 4:30/km
        'uphillRatio': 1.25,
        'downhillRatio': 0.8,
        'dft': 15000
    }
}

# Surface type multipliers
SURFACE_TYPES = {
    'road': {'flat': 1.0, 'uphill': 1.0, 'downhill': 1.0},
    'trail': {'flat': 1.05, 'uphill': 1.08, 'downhill': 1.10},
    'technical': {'flat': 1.12, 'uphill': 1.15, 'downhill': 1.30},
    'rocky': {'flat': 1.15, 'uphill': 1.18, 'downhill': 1.40},
    'sand': {'flat': 1.25, 'uphill': 1.30, 'downhill': 1.15}
}


def get_gradient_pace_multiplier(grade_percent: float, flat_pace: float, 
                                  uphill_pace: float, downhill_pace: float) -> float:
    """
    Empirical multipliers based on 86 km-splits across varied terrain.
    Returns a multiplier relative to flat pace.
    """
    # Calculate runner's efficiency factors (relative to intermediate baseline)
    uphill_ratio = uphill_pace / flat_pace if flat_pace > 0 else 1.4
    downhill_ratio = downhill_pace / flat_pace if flat_pace > 0 else 0.85
    uphill_efficiency = uphill_ratio / 1.4      # >1 = slower than baseline
    downhill_efficiency = downhill_ratio / 0.85  # >1 = slower than baseline
    
    # Grade is positive for uphill, negative for downhill
    if abs(grade_percent) < GRADE_THRESHOLD:
        return 1.0
    
    if grade_percent > 0:
        # Uphill: empirical multipliers from real workout data
        if grade_percent <= 5:
            # 2-5%: 1.0 to 1.2 (gentle uphill)
            t = (grade_percent - GRADE_THRESHOLD) / (5 - GRADE_THRESHOLD)
            base_multiplier = 1.0 + t * 0.2
        elif grade_percent <= 8:
            # 5-8%: 1.2 to 1.65 (moderate uphill)
            t = (grade_percent - 5) / 3
            base_multiplier = 1.2 + t * 0.45
        elif grade_percent <= 12:
            # 8-12%: 1.65 to 1.8 (steep uphill)
            t = (grade_percent - 8) / 4
            base_multiplier = 1.65 + t * 0.15
        elif grade_percent <= 15:
            # 12-15%: 1.8 to 2.2 (very steep)
            t = (grade_percent - 12) / 3
            base_multiplier = 1.8 + t * 0.4
        else:
            # >15%: 2.2+ hiking territory
            base_multiplier = 2.2 + (grade_percent - 15) * 0.05
        
        return base_multiplier * uphill_efficiency
    
    else:
        # Downhill
        abs_grade = abs(grade_percent)
        
        if abs_grade <= 5:
            # -2 to -5%: 0.95 to 0.90 (easy descent, faster)
            t = (abs_grade - GRADE_THRESHOLD) / (5 - GRADE_THRESHOLD)
            base_multiplier = 0.95 - t * 0.05
        elif abs_grade <= 10:
            # -5 to -10%: 0.90 to 0.85 (moderate descent)
            t = (abs_grade - 5) / 5
            base_multiplier = 0.90 - t * 0.05
        elif abs_grade <= 15:
            # -10 to -15%: 0.85 to 0.88 (steep, slight technical slowdown)
            t = (abs_grade - 10) / 5
            base_multiplier = 0.85 + t * 0.03
        else:
            # <-15%: technical terrain requires braking
            base_multiplier = 0.88 + (abs_grade - 15) * 0.03
        
        return base_multiplier * downhill_efficiency


def get_fatigue_multiplier(distance_km: float) -> float:
    """Ultra-distance fatigue multiplier - core protected algorithm"""
    if distance_km <= 21:
        return 1.0
    elif distance_km <= 42:
        return 1.05
    elif distance_km <= 50:
        return 1.12
    elif distance_km <= 65:
        return 1.18
    elif distance_km <= 80:
        return 1.25
    elif distance_km <= 100:
        return 1.32
    elif distance_km <= 130:
        return 1.40
    else:
        return 1.50


def calculate_segment_time(segment: dict, paces: dict, apply_surface: bool) -> dict:
    """Calculate time for a single segment using gradient-based pacing"""
    terrain = segment.get('terrainType', 'flat')
    distance = segment.get('distance', 0)
    surface = segment.get('surfaceType', 'trail')
    grade = segment.get('grade', 0)
    
    # Use gradient-based pace multiplier for realistic pacing
    gradient_mult = get_gradient_pace_multiplier(
        grade, paces['flat'], paces['uphill'], paces['downhill']
    )
    pace = paces['flat'] * gradient_mult
    
    # Apply surface multiplier
    if apply_surface and surface in SURFACE_TYPES:
        pace *= SURFACE_TYPES[surface].get(terrain, 1.0)
    
    time = distance * pace
    
    return {
        'terrain': terrain,
        'distance': distance,
        'time': time,
        'pace': pace,
        'grade': grade
    }


def calculate_total_time_for_paces(segments: list, paces: dict, apply_surface: bool, 
                                   fatigue: float, stop_time: float) -> float:
    """Helper function to calculate total time for given paces"""
    running_time = 0
    for segment in segments:
        result = calculate_segment_time(segment, paces, apply_surface)
        running_time += result['time']
    
    # Apply fatigue and add stop times
    return running_time * fatigue + stop_time


def find_flat_pace_for_target_time(segments: list, target_time: float, 
                                   uphill_ratio: float, downhill_ratio: float,
                                   apply_surface: bool, fatigue: float, 
                                   stop_time: float) -> float:
    """
    Binary search to find the flat pace that achieves the target time.
    Returns flat_pace in min/km.
    """
    # Search bounds: 3:00/km (very fast) to 15:00/km (very slow)
    min_pace = 3.0
    max_pace = 15.0
    tolerance = 0.1  # Within 0.1 minutes accuracy
    
    # Binary search for the right pace
    for _ in range(50):  # Max iterations to prevent infinite loop
        mid_pace = (min_pace + max_pace) / 2
        paces = {
            'flat': mid_pace,
            'uphill': mid_pace * uphill_ratio,
            'downhill': mid_pace * downhill_ratio
        }
        
        estimated_time = calculate_total_time_for_paces(
            segments, paces, apply_surface, fatigue, stop_time
        )
        
        if abs(estimated_time - target_time) < tolerance:
            return mid_pace
        
        # If estimated time is too long, need faster pace (lower number)
        if estimated_time > target_time:
            max_pace = mid_pace
        else:
            min_pace = mid_pace
    
    # Return best found pace
    return (min_pace + max_pace) / 2


def calculate_km_splits(segments: list, paces: dict, apply_surface: bool, 
                        fatigue: float, aid_stations: list, start_minutes: int,
                        total_distance: float) -> list:
    """Calculate per-km split times with gradient-based pacing"""
    km_splits = []
    total_kms = int(math.ceil(total_distance))
    
    cumulative_time = 0
    processed_stops = set()
    
    for km in range(1, total_kms + 1):
        km_start = km - 1
        km_end = min(km, total_distance)
        
        # Calculate time for this km
        km_time = 0
        km_elevation = 0
        dominant_terrain = {'flat': 0, 'uphill': 0, 'downhill': 0}
        dominant_surface = 'trail'
        max_surface_dist = 0
        
        for segment in segments:
            seg_start = segment.get('startDistance', 0)
            seg_end = segment.get('endDistance', 0)
            
            # Check for overlap with this km
            if seg_end > km_start and seg_start < km_end:
                overlap_start = max(seg_start, km_start)
                overlap_end = min(seg_end, km_end)
                overlap_dist = overlap_end - overlap_start
                
                if overlap_dist > 0:
                    # Calculate time for this segment portion
                    result = calculate_segment_time(segment, paces, apply_surface)
                    segment_pace = result['pace']
                    km_time += overlap_dist * segment_pace
                    
                    # Track terrain
                    terrain = segment.get('terrainType', 'flat')
                    dominant_terrain[terrain] += overlap_dist
                    
                    # Track surface
                    surface = segment.get('surfaceType', 'trail')
                    if overlap_dist > max_surface_dist:
                        max_surface_dist = overlap_dist
                        dominant_surface = surface
                    
                    # Track elevation
                    if segment.get('elevationChange'):
                        ratio = overlap_dist / segment.get('distance', 1)
                        km_elevation += segment['elevationChange'] * ratio
        
        # Apply fatigue
        km_time *= fatigue
        
        # Determine dominant terrain
        terrain = max(dominant_terrain, key=dominant_terrain.get)
        
        # Add any AID station stops in this km
        km_stop_time = 0
        for station in aid_stations:
            station_km = station.get('km', 0)
            if km_start < station_km <= km_end and station_km not in processed_stops:
                km_stop_time += station.get('stopMin', 0)
                processed_stops.add(station_km)
        
        # Update cumulative time (running time only, stops added separately)
        cumulative_time += km_time
        cumulative_with_stops = cumulative_time + sum(
            s.get('stopMin', 0) for s in aid_stations 
            if s.get('km', 0) <= km_end
        )
        
        # Calculate clock time
        clock_minutes = start_minutes + cumulative_with_stops
        clock_hours = int(clock_minutes // 60) % 24
        clock_mins = int(clock_minutes % 60)
        
        # Calculate pace for display
        km_distance = km_end - km_start
        pace = km_time / km_distance if km_distance > 0 else 0
        
        km_splits.append({
            'km': km,
            'splitMinutes': km_time,
            'cumulativeMinutes': cumulative_with_stops,
            'pace': pace,
            'elevation': round(km_elevation),
            'terrain': terrain,
            'surface': dominant_surface,
            'clockTime': f"{clock_hours:02d}:{clock_mins:02d}"
        })
    
    return km_splits


def calculate_race_plan(data: dict) -> dict:
    """Main calculation function - protected business logic"""
    segments = data.get('segments', [])
    runner_level = data.get('runnerLevel', 'intermediate')
    aid_stations = data.get('aidStations', [])
    apply_surface = data.get('applySurface', False)
    start_time = data.get('startTime', '09:00')
    total_distance = data.get('totalDistance', 0)
    mode = data.get('mode', 'preset')  # 'preset', 'manual', 'target', 'itra'
    manual_paces = data.get('manualPaces', None)  # For manual mode
    target_time = data.get('targetTime', None)  # For target mode
    itra_score = data.get('itraScore', None)  # For ITRA mode
    
    # Get runner preset
    preset = RUNNER_LEVELS.get(runner_level, RUNNER_LEVELS['intermediate'])
    
    # Get user-specified ratios (terrain style sliders) or fall back to preset
    uphill_ratio = float(data.get('uphillRatio', preset['uphillRatio']))
    downhill_ratio = float(data.get('downhillRatio', preset['downhillRatio']))
    
    # Calculate paces based on mode
    if mode == 'manual' and manual_paces:
        flat_pace = manual_paces.get('flat', preset['flatPace'])
        uphill_pace = manual_paces.get('uphill', flat_pace * uphill_ratio)
        downhill_pace = manual_paces.get('downhill', flat_pace * downhill_ratio)
    elif mode == 'target' and target_time:
        # Get fatigue and stop times first (needed for reverse calculation)
        fatigue = get_fatigue_multiplier(total_distance)
        total_stop_time = sum(s.get('stopMin', 0) for s in aid_stations)
        
        # Find flat pace that achieves target time
        flat_pace = find_flat_pace_for_target_time(
            segments, target_time, uphill_ratio, downhill_ratio,
            apply_surface, fatigue, total_stop_time
        )
        uphill_pace = flat_pace * uphill_ratio
        downhill_pace = flat_pace * downhill_ratio
    elif mode == 'itra' and itra_score:
        # ITRA-based pace calculation (will be implemented)
        flat_pace = preset['flatPace']
        uphill_pace = flat_pace * uphill_ratio
        downhill_pace = flat_pace * downhill_ratio
    else:
        # Default: Use runner level flat pace with user's terrain style ratios
        flat_pace = preset['flatPace']
        uphill_pace = flat_pace * uphill_ratio
        downhill_pace = flat_pace * downhill_ratio
    
    paces = {
        'flat': flat_pace,
        'uphill': uphill_pace,
        'downhill': downhill_pace
    }
    
    # Get fatigue multiplier
    fatigue = get_fatigue_multiplier(total_distance)
    
    # Calculate distances and times by terrain type
    flat_distance = 0
    uphill_distance = 0
    downhill_distance = 0
    flat_time = 0
    uphill_time = 0
    downhill_time = 0
    
    for segment in segments:
        result = calculate_segment_time(segment, paces, apply_surface)
        terrain = result['terrain']
        distance = result['distance']
        time = result['time']
        
        if terrain == 'flat':
            flat_distance += distance
            flat_time += time
        elif terrain == 'uphill':
            uphill_distance += distance
            uphill_time += time
        elif terrain == 'downhill':
            downhill_distance += distance
            downhill_time += time
    
    # Calculate running time (before fatigue)
    running_time = flat_time + uphill_time + downhill_time
    
    # Apply fatigue multiplier to total running time
    adjusted_running_time = running_time * fatigue
    
    # Add AID station stop times
    total_stop_time = sum(s.get('stopMin', 0) for s in aid_stations)
    total_time = adjusted_running_time + total_stop_time
    
    # Calculate checkpoint times
    checkpoints = []
    cumulative_time = 0
    cumulative_stop_time = 0
    
    for station in sorted(aid_stations, key=lambda s: s.get('km', 0)):
        station_km = station.get('km', 0)
        time_to_station = 0
        
        for segment in segments:
            seg_start = segment.get('startDistance', 0)
            seg_end = segment.get('endDistance', 0)
            
            if seg_end <= station_km:
                # Full segment before checkpoint
                result = calculate_segment_time(segment, paces, apply_surface)
                time_to_station += result['time']
            elif seg_start < station_km:
                # Partial segment
                result = calculate_segment_time(segment, paces, apply_surface)
                partial_ratio = (station_km - seg_start) / segment.get('distance', 1)
                time_to_station += result['time'] * partial_ratio
                break
        
        # Apply fatigue to running time to this point
        time_to_station *= fatigue
        
        # Add previous stop times
        for prev_station in aid_stations:
            if prev_station.get('km', 0) < station_km:
                time_to_station += prev_station.get('stopMin', 0)
        
        checkpoints.append({
            'name': station.get('name', 'VP'),
            'km': station_km,
            'timeMinutes': time_to_station,
            'stopMin': station.get('stopMin', 0)
        })
    
    # Parse start time and calculate finish
    try:
        start_parts = start_time.split(':')
        start_minutes = int(start_parts[0]) * 60 + int(start_parts[1])
    except:
        start_minutes = 9 * 60  # Default to 09:00
    
    finish_minutes = start_minutes + total_time
    finish_hours = int(finish_minutes // 60) % 24
    finish_mins = int(finish_minutes % 60)
    
    # Format total time as HH:MM:SS
    total_hours = int(total_time // 60)
    total_mins = int(total_time % 60)
    total_secs = int((total_time % 1) * 60)
    
    # Calculate km splits
    km_splits = calculate_km_splits(
        segments, paces, apply_surface, fatigue, 
        aid_stations, start_minutes, total_distance
    )
    
    return {
        'totalTimeMinutes': total_time,
        'totalTimeFormatted': f"{total_hours}:{total_mins:02d}:{total_secs:02d}",
        'finishClockTime': f"{finish_hours:02d}:{finish_mins:02d}",
        'fatigueMultiplier': fatigue,
        'paces': {
            'flat': flat_pace,
            'uphill': uphill_pace,
            'downhill': downhill_pace
        },
        'terrain': {
            'flatDistance': flat_distance,
            'uphillDistance': uphill_distance,
            'downhillDistance': downhill_distance,
            'flatTime': flat_time * fatigue,
            'uphillTime': uphill_time * fatigue,
            'downhillTime': downhill_time * fatigue
        },
        'checkpoints': checkpoints,
        'stopTimeMinutes': total_stop_time,
        'runnerLevel': runner_level,
        'preset': preset,
        'kmSplits': km_splits
    }


def main(req: func.HttpRequest) -> func.HttpResponse:
    """Azure Function entry point"""
    
    # CORS headers
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    }
    
    # Handle preflight
    if req.method == 'OPTIONS':
        return func.HttpResponse('', status_code=200, headers=headers)
    
    try:
        data = req.get_json()
        result = calculate_race_plan(data)
        
        return func.HttpResponse(
            json.dumps(result),
            status_code=200,
            headers=headers
        )
    except Exception as e:
        return func.HttpResponse(
            json.dumps({'error': str(e)}),
            status_code=500,
            headers=headers
        )
