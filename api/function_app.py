"""
Azure Function - GPXray Calculate API (v2 Programming Model)
For Azure Functions Flex Consumption Plan

Protected Business Logic:
- ITRA score calculations
- Target time reverse engineering
- DDL (Dynamic Descent Load) model
- Fatigue multipliers
- Surface type adjustments
- Access code validation
"""
import azure.functions as func
import json
import logging
import math
import hashlib
import time
import os
from datetime import datetime, timedelta
from openai import AzureOpenAI

# Weather caching - try to import Table Storage, fall back to memory-only
try:
    from azure.data.tables import TableServiceClient, TableClient
    TABLE_STORAGE_AVAILABLE = True
except ImportError:
    TABLE_STORAGE_AVAILABLE = False
    logging.warning("azure-data-tables not available, using memory-only cache")

# In-memory weather cache (survives within function instance)
WEATHER_CACHE = {}
WEATHER_CACHE_TTL = 6 * 60 * 60  # 6 hours in seconds

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

# Runner level presets (protected backend logic)
RUNNER_LEVELS = {
    'beginner': {
        'name': 'Beginner',
        'flatPace': 8.0,
        'uphillRatio': 1.5,
        'downhillRatio': 0.9,
        'dft': 6000
    },
    'intermediate': {
        'name': 'Intermediate',
        'flatPace': 6.5,
        'uphillRatio': 1.4,
        'downhillRatio': 0.85,
        'dft': 9000
    },
    'advanced': {
        'name': 'Advanced',
        'flatPace': 5.5,
        'uphillRatio': 1.3,
        'downhillRatio': 0.82,
        'dft': 12000
    },
    'elite': {
        'name': 'Elite',
        'flatPace': 4.5,
        'uphillRatio': 1.25,
        'downhillRatio': 0.8,
        'dft': 15000
    }
}

# Surface type multipliers
SURFACE_TYPES = {
    'road': {'flat': 1.0, 'uphill': 1.0, 'downhill': 1.0},
    'trail': {'flat': 1.05, 'uphill': 1.08, 'downhill': 1.10},
    'technical': {'flat': 1.12, 'uphill': 1.15, 'downhill': 1.20},
    'rocky': {'flat': 1.15, 'uphill': 1.18, 'downhill': 1.25},
    'sand': {'flat': 1.25, 'uphill': 1.30, 'downhill': 1.15}
}

# Grade threshold for terrain classification (percentage)
GRADE_THRESHOLD = 2.0


def get_gradient_pace_multiplier(grade_percent: float, uphill_ratio: float, downhill_ratio: float) -> float:
    """
    Gradient-based pace scaling - Protected Algorithm
    
    More accurate than binary uphill/downhill classification.
    Returns a multiplier relative to flat pace.
    
    Research basis:
    - ~6% slower per 1% uphill grade
    - ~3% faster per 1% downhill (up to moderate steepness)
    - Very steep descents are slower (technical, braking)
    """
    if abs(grade_percent) < GRADE_THRESHOLD:
        # Flat terrain
        return 1.0
    
    if grade_percent > 0:
        # Uphill: continuous scaling based on grade
        # At threshold (2%): use flat pace
        # At ~15%: use full uphill pace (typical uphillRatio)
        # Above 15%: even slower (hiking territory)
        if grade_percent <= 15:
            t = (grade_percent - GRADE_THRESHOLD) / (15 - GRADE_THRESHOLD)
            return 1.0 + t * (uphill_ratio - 1.0)
        else:
            # Very steep: add extra penalty (~3% per additional 1% grade)
            extra_grade = grade_percent - 15
            return uphill_ratio + (extra_grade * 0.03)
    else:
        # Downhill: more complex - faster for gentle, slower for very steep
        abs_grade = abs(grade_percent)
        
        if abs_grade <= 10:
            # Gentle to moderate downhill: interpolate to faster pace
            t = (abs_grade - GRADE_THRESHOLD) / (10 - GRADE_THRESHOLD)
            return 1.0 - t * (1.0 - downhill_ratio)
        elif abs_grade <= 20:
            # Steep downhill: starts getting slower (technical, braking)
            t = (abs_grade - 10) / 10
            return downhill_ratio + t * (1.0 - downhill_ratio)
        else:
            # Very steep: slower than flat (careful descent)
            extra_grade = abs_grade - 20
            return 1.0 + (extra_grade * 0.02)


# ============================================================================
# PROTECTED ALGORITHMS - Core IP
# ============================================================================

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


def calculate_effort_points(distance_km: float, elevation_m: float) -> float:
    """
    ITRA Effort Points Formula - Protected
    Standard: distance + (elevation / 100)
    """
    return distance_km + (elevation_m / 100)


def calculate_itra_from_race(distance_km: float, elevation_m: float, time_minutes: float) -> int:
    """
    Estimate ITRA score from past race performance - Protected Algorithm
    
    Calibration points:
    - 550 score ≈ 5.5 min/effort point
    - 700 score ≈ 4.3 min/effort point  
    - 800 score ≈ 3.7 min/effort point
    
    Formula: Score ≈ 3000 / minutesPerPoint
    """
    if distance_km <= 0 or time_minutes <= 0:
        return 550  # Default
    
    effort_points = calculate_effort_points(distance_km, elevation_m)
    minutes_per_point = time_minutes / effort_points
    
    # Core formula - protected
    estimated_score = round(3000 / minutes_per_point)
    
    # Clamp to realistic range
    return max(350, min(950, estimated_score))


def itra_score_to_base_paces(score: int) -> dict:
    """
    Convert ITRA score to base pace preset - Protected Algorithm
    
    Returns flat pace and ratios for uphill/downhill without route-specific adjustments.
    Used for UI display before route calculation.
    
    ITRA ranges mapped to runner levels:
    < 300: Very beginner (slower than beginner preset)
    300-450: Beginner to Intermediate
    450-600: Intermediate to Advanced
    600-750: Advanced to Elite
    > 750: Elite to Pro
    """
    if score < 300:
        # Very beginner - slower than preset
        flat_pace = 8.5 - (score / 300) * 1.0  # 8.5 → 7.5
        uphill_ratio = 1.6 - (score / 300) * 0.1
        downhill_ratio = 0.95 - (score / 300) * 0.05
    elif score < 450:
        # Beginner to Intermediate
        t = (score - 300) / 150
        flat_pace = 7.5 - t * 1.0  # 7.5 → 6.5
        uphill_ratio = 1.5 - t * 0.1
        downhill_ratio = 0.9 - t * 0.05
    elif score < 600:
        # Intermediate to Advanced
        t = (score - 450) / 150
        flat_pace = 6.5 - t * 1.0  # 6.5 → 5.5
        uphill_ratio = 1.4 - t * 0.1
        downhill_ratio = 0.85 - t * 0.05
    elif score < 750:
        # Advanced to Elite
        t = (score - 600) / 150
        flat_pace = 5.5 - t * 1.0  # 5.5 → 4.5
        uphill_ratio = 1.3 - t * 0.05
        downhill_ratio = 0.8 - t * 0.05
    else:
        # Elite to Pro (cap at 3.5 min/km flat)
        t = min((score - 750) / 250, 1)
        flat_pace = 4.5 - t * 1.0  # 4.5 → 3.5
        uphill_ratio = 1.25 - t * 0.05
        downhill_ratio = 0.75 - t * 0.05
    
    return {
        'flatPace': round(flat_pace, 2),
        'uphillRatio': round(uphill_ratio, 3),
        'downhillRatio': round(downhill_ratio, 3),
        'uphillPace': round(flat_pace * uphill_ratio, 2),
        'downhillPace': round(flat_pace * downhill_ratio, 2),
        'itraScore': score
    }


def calculate_paces_from_itra(
    itra_score: int,
    segments: list,
    total_distance: float,
    elevation_gain: float,
    uphill_ratio: float = 1.3,
    downhill_ratio: float = 0.85
) -> dict:
    """
    Convert ITRA score to terrain-specific paces - Protected Algorithm
    
    Core formula: minutesPerPoint = 3000 / itraScore
    """
    effort_points = calculate_effort_points(total_distance, elevation_gain)
    
    # Core ITRA to time conversion - protected
    minutes_per_point = 3000 / itra_score
    total_running_minutes = effort_points * minutes_per_point
    
    # Calculate terrain breakdown
    flat_dist = sum(s.get('distance', 0) for s in segments if s.get('terrainType') == 'flat')
    uphill_dist = sum(s.get('distance', 0) for s in segments if s.get('terrainType') == 'uphill')
    downhill_dist = sum(s.get('distance', 0) for s in segments if s.get('terrainType') == 'downhill')
    
    # Calculate weighted distance
    weighted_distance = flat_dist + (uphill_dist * uphill_ratio) + (downhill_dist * downhill_ratio)
    
    if weighted_distance <= 0:
        weighted_distance = total_distance
    
    # Calculate flat pace that achieves target time
    flat_pace = total_running_minutes / weighted_distance
    
    return {
        'flat': flat_pace,
        'uphill': flat_pace * uphill_ratio,
        'downhill': flat_pace * downhill_ratio,
        'estimatedTime': total_running_minutes
    }


def calculate_paces_from_target(
    target_time_minutes: float,
    segments: list,
    total_distance: float,
    aid_stations: list,
    uphill_ratio: float = 1.2,
    downhill_ratio: float = 0.9,
    apply_surface: bool = False
) -> dict:
    """
    Reverse-calculate paces from target finish time - Protected Algorithm
    
    Works backwards through:
    1. Subtract stop times
    2. Divide by fatigue multiplier
    3. Account for surface factors
    4. Solve for base flat pace
    """
    # Subtract AID station stop times
    total_stop_time = sum(s.get('stopMin', 0) for s in aid_stations)
    running_time_target = target_time_minutes - total_stop_time
    
    # Get fatigue multiplier
    fatigue_multiplier = get_fatigue_multiplier(total_distance)
    
    # Calculate gradient-weighted distance (using continuous gradient scaling)
    gradient_weighted_distance = 0.0
    for segment in segments:
        grade = segment.get('grade', 0)
        distance = segment.get('distance', 0)
        gradient_mult = get_gradient_pace_multiplier(grade, uphill_ratio, downhill_ratio)
        gradient_weighted_distance += distance * gradient_mult
    
    # Fallback if no segments
    if gradient_weighted_distance <= 0:
        flat_dist = sum(s.get('distance', 0) for s in segments if s.get('terrainType') == 'flat')
        uphill_dist = sum(s.get('distance', 0) for s in segments if s.get('terrainType') == 'uphill')
        downhill_dist = sum(s.get('distance', 0) for s in segments if s.get('terrainType') == 'downhill')
        gradient_weighted_distance = flat_dist + (uphill_dist * uphill_ratio) + (downhill_dist * downhill_ratio)
    
    if gradient_weighted_distance <= 0:
        gradient_weighted_distance = total_distance
    
    # Calculate weighted surface factor if enabled
    weighted_surface_factor = 1.0
    if apply_surface and segments:
        total_weighted_time = 0
        total_base_time = 0
        
        for segment in segments:
            grade = segment.get('grade', 0)
            gradient_mult = get_gradient_pace_multiplier(grade, uphill_ratio, downhill_ratio)
            terrain = segment.get('terrainType', 'flat')
            
            surface = segment.get('surfaceType', 'trail')
            surface_multiplier = SURFACE_TYPES.get(surface, {}).get(terrain, 1.0)
            
            base_time = segment.get('distance', 0) * gradient_mult
            total_base_time += base_time
            total_weighted_time += base_time * surface_multiplier
        
        if total_base_time > 0:
            weighted_surface_factor = total_weighted_time / total_base_time
    
    # Work backwards: divide by fatigue and surface factors
    pure_running_time = running_time_target / fatigue_multiplier / weighted_surface_factor
    
    # Solve for flat pace
    weighted_distance = gradient_weighted_distance
    
    if weighted_distance <= 0:
        weighted_distance = total_distance
    
    flat_pace = pure_running_time / weighted_distance
    
    return {
        'flat': flat_pace,
        'uphill': flat_pace * uphill_ratio,
        'downhill': flat_pace * downhill_ratio,
        'fatigueMultiplier': fatigue_multiplier,
        'surfaceFactor': weighted_surface_factor
    }


def calculate_ddl(segments: list, runner_level: str = 'intermediate') -> dict:
    """
    Dynamic Descent Load (DDL) - Protected Algorithm
    
    Models cumulative muscular stress from downhill running.
    
    Formula: DDL = Σ(elevationDrop × slopeWeight × surfaceWeight × fatigueWeight)
    
    Where:
    - slopeWeight = 1 + (gradePercent / 20)^1.4
    - surfaceWeight = surface multiplier for downhill
    - fatigueWeight = 1 + (cumulativeDDL / 3000) * 0.15
    
    Returns pace loss prediction based on DDL vs runner's DFT threshold.
    """
    preset = RUNNER_LEVELS.get(runner_level, RUNNER_LEVELS['intermediate'])
    runner_dft = preset.get('dft', 9000)
    base_downhill_pace = preset['flatPace'] * preset['downhillRatio']
    
    ddl_total = 0
    cumulative_ddl = 0
    fatigue_onset_km = None
    fatigue_threshold = 3000  # DDL threshold where fatigue compounds
    
    for segment in segments:
        if segment.get('terrainType') == 'downhill':
            elevation_change = segment.get('elevationChange', 0)
            if elevation_change < 0:
                grade_percent = abs(segment.get('grade', 0))
                elevation_drop = abs(elevation_change)
                
                # Slope weight: steeper = more braking force
                slope_weight = 1 + math.pow(grade_percent / 20, 1.4)
                
                # Surface weight
                surface = segment.get('surfaceType', 'trail')
                surface_weight = SURFACE_TYPES.get(surface, {}).get('downhill', 1.0)
                
                # Fatigue weight: accumulated damage compounds
                fatigue_weight = 1 + (cumulative_ddl / fatigue_threshold) * 0.15
                
                # Calculate segment DDL
                segment_ddl = elevation_drop * slope_weight * surface_weight * fatigue_weight
                ddl_total += segment_ddl
                cumulative_ddl += segment_ddl
                
                # Check fatigue onset (ratio >= 0.8)
                fatigue_ratio = cumulative_ddl / runner_dft
                if fatigue_ratio >= 0.8 and fatigue_onset_km is None:
                    fatigue_onset_km = segment.get('startDistance', 0)
    
    # Calculate pace loss using quadratic formula
    final_fatigue_ratio = ddl_total / runner_dft
    pace_loss_factor = 1 + math.pow(max(0, final_fatigue_ratio - 0.8), 2)
    
    base_pace_sec = base_downhill_pace * 60  # seconds/km
    adjusted_pace_sec = base_pace_sec * pace_loss_factor
    pace_loss_sec = round(adjusted_pace_sec - base_pace_sec)
    
    # Calculate range (±30% uncertainty)
    pace_loss_min = round(pace_loss_sec * 0.7)
    pace_loss_max = round(pace_loss_sec * 1.3)
    
    return {
        'ddlTotal': round(ddl_total),
        'fatigueRatio': round(final_fatigue_ratio, 2),
        'fatigueOnsetKm': fatigue_onset_km,
        'paceLossSeconds': pace_loss_sec,
        'paceLossRange': {'min': pace_loss_min, 'max': pace_loss_max},
        'runnerDFT': runner_dft
    }


# ============================================================================
# MAIN CALCULATION ENGINE
# ============================================================================

def calculate_segment_time(segment: dict, paces: dict, apply_surface: bool) -> dict:
    """Calculate time for a single segment"""
    terrain = segment.get('terrainType', 'flat')
    distance = segment.get('distance', 0)
    surface = segment.get('surfaceType', 'trail')
    
    if terrain == 'uphill':
        pace = paces['uphill']
    elif terrain == 'downhill':
        pace = paces['downhill']
    else:
        pace = paces['flat']
    
    if apply_surface and surface in SURFACE_TYPES:
        pace *= SURFACE_TYPES[surface].get(terrain, 1.0)
    
    return {
        'terrain': terrain,
        'distance': distance,
        'time': distance * pace
    }


def calculate_race_plan(data: dict) -> dict:
    """Main calculation function - routes to appropriate algorithm based on mode"""
    segments = data.get('segments', [])
    runner_level = data.get('runnerLevel', 'intermediate')
    aid_stations = data.get('aidStations', [])
    apply_surface = data.get('applySurface', False)
    start_time = data.get('startTime', '09:00')
    total_distance = data.get('totalDistance', 0)
    elevation_gain = data.get('elevationGain', 0)
    mode = data.get('mode', 'preset')
    
    preset = RUNNER_LEVELS.get(runner_level, RUNNER_LEVELS['intermediate'])
    
    # Determine paces based on mode
    if mode == 'manual':
        manual_paces = data.get('manualPaces', {})
        paces = {
            'flat': manual_paces.get('flat', preset['flatPace']),
            'uphill': manual_paces.get('uphill', preset['flatPace'] * preset['uphillRatio']),
            'downhill': manual_paces.get('downhill', preset['flatPace'] * preset['downhillRatio'])
        }
    elif mode == 'itra':
        itra_score = data.get('itraScore', 550)
        uphill_ratio = data.get('uphillRatio', preset['uphillRatio'])
        downhill_ratio = data.get('downhillRatio', preset['downhillRatio'])
        
        itra_result = calculate_paces_from_itra(
            itra_score, segments, total_distance, elevation_gain,
            uphill_ratio, downhill_ratio
        )
        paces = {
            'flat': itra_result['flat'],
            'uphill': itra_result['uphill'],
            'downhill': itra_result['downhill']
        }
    elif mode == 'target':
        target_time = data.get('targetTime', 300)  # minutes
        uphill_ratio = data.get('uphillRatio', 1.2)
        downhill_ratio = data.get('downhillRatio', 0.9)
        
        target_result = calculate_paces_from_target(
            target_time, segments, total_distance, aid_stations,
            uphill_ratio, downhill_ratio, apply_surface
        )
        paces = {
            'flat': target_result['flat'],
            'uphill': target_result['uphill'],
            'downhill': target_result['downhill']
        }
    else:
        # Default: use runner level preset
        paces = {
            'flat': preset['flatPace'],
            'uphill': preset['flatPace'] * preset['uphillRatio'],
            'downhill': preset['flatPace'] * preset['downhillRatio']
        }
    
    fatigue = get_fatigue_multiplier(total_distance)
    
    # Calculate terrain breakdown
    flat_distance = uphill_distance = downhill_distance = 0
    flat_time = uphill_time = downhill_time = 0
    
    for segment in segments:
        result = calculate_segment_time(segment, paces, apply_surface)
        terrain = result['terrain']
        
        if terrain == 'flat':
            flat_distance += result['distance']
            flat_time += result['time']
        elif terrain == 'uphill':
            uphill_distance += result['distance']
            uphill_time += result['time']
        elif terrain == 'downhill':
            downhill_distance += result['distance']
            downhill_time += result['time']
    
    running_time = flat_time + uphill_time + downhill_time
    adjusted_running_time = running_time * fatigue
    
    total_stop_time = sum(s.get('stopMin', 0) for s in aid_stations)
    total_time = adjusted_running_time + total_stop_time
    
    # Calculate DDL
    ddl_result = calculate_ddl(segments, runner_level)
    
    # Calculate checkpoints
    checkpoints = []
    for station in sorted(aid_stations, key=lambda s: s.get('km', 0)):
        station_km = station.get('km', 0)
        time_to_station = 0
        
        for segment in segments:
            seg_start = segment.get('startDistance', 0)
            seg_end = segment.get('endDistance', 0)
            
            if seg_end <= station_km:
                result = calculate_segment_time(segment, paces, apply_surface)
                time_to_station += result['time']
            elif seg_start < station_km:
                result = calculate_segment_time(segment, paces, apply_surface)
                partial_ratio = (station_km - seg_start) / segment.get('distance', 1)
                time_to_station += result['time'] * partial_ratio
                break
        
        time_to_station *= fatigue
        
        for prev_station in aid_stations:
            if prev_station.get('km', 0) < station_km:
                time_to_station += prev_station.get('stopMin', 0)
        
        checkpoints.append({
            'name': station.get('name', 'VP'),
            'km': station_km,
            'timeMinutes': time_to_station,
            'stopMin': station.get('stopMin', 0)
        })
    
    # Format times
    try:
        start_parts = start_time.split(':')
        start_minutes = int(start_parts[0]) * 60 + int(start_parts[1])
    except:
        start_minutes = 9 * 60
    
    finish_minutes = start_minutes + total_time
    finish_hours = int(finish_minutes // 60) % 24
    finish_mins = int(finish_minutes % 60)
    
    total_hours = int(total_time // 60)
    total_mins = int(total_time % 60)
    total_secs = int((total_time % 1) * 60)
    
    return {
        'totalTimeMinutes': total_time,
        'totalTimeFormatted': f"{total_hours}:{total_mins:02d}:{total_secs:02d}",
        'finishClockTime': f"{finish_hours:02d}:{finish_mins:02d}",
        'fatigueMultiplier': fatigue,
        'paces': paces,
        'terrain': {
            'flatDistance': flat_distance,
            'uphillDistance': uphill_distance,
            'downhillDistance': downhill_distance,
            'flatTime': flat_time * fatigue,
            'uphillTime': uphill_time * fatigue,
            'downhillTime': downhill_time * fatigue
        },
        'ddl': ddl_result,
        'checkpoints': checkpoints,
        'stopTimeMinutes': total_stop_time,
        'runnerLevel': runner_level,
        'preset': preset
    }


# ============================================================================
# HTTP ENDPOINTS
# ============================================================================

def get_cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    }


@app.route(route="calculate", methods=["POST", "OPTIONS"])
def calculate(req: func.HttpRequest) -> func.HttpResponse:
    """Main race plan calculation endpoint"""
    logging.info('Calculate API called')
    headers = get_cors_headers()
    
    if req.method == 'OPTIONS':
        return func.HttpResponse('', status_code=200, headers=headers)
    
    try:
        data = req.get_json()
        result = calculate_race_plan(data)
        return func.HttpResponse(json.dumps(result), status_code=200, headers=headers)
    except Exception as e:
        logging.error(f'Calculation error: {str(e)}')
        return func.HttpResponse(json.dumps({'error': str(e)}), status_code=500, headers=headers)


@app.route(route="itra", methods=["POST", "OPTIONS"])
def itra_endpoint(req: func.HttpRequest) -> func.HttpResponse:
    """ITRA score estimation from past race"""
    logging.info('ITRA API called')
    headers = get_cors_headers()
    
    if req.method == 'OPTIONS':
        return func.HttpResponse('', status_code=200, headers=headers)
    
    try:
        data = req.get_json()
        distance = data.get('distance', 0)
        elevation = data.get('elevation', 0)
        time_minutes = data.get('timeMinutes', 0)
        
        estimated_score = calculate_itra_from_race(distance, elevation, time_minutes)
        effort_points = calculate_effort_points(distance, elevation)
        
        # Determine level
        if estimated_score >= 800:
            level = 'Elite'
        elif estimated_score >= 700:
            level = 'Competitive'
        elif estimated_score >= 600:
            level = 'Advanced'
        elif estimated_score >= 500:
            level = 'Intermediate'
        else:
            level = 'Beginner'
        
        return func.HttpResponse(json.dumps({
            'score': estimated_score,
            'level': level,
            'effortPoints': round(effort_points, 1)
        }), status_code=200, headers=headers)
    except Exception as e:
        logging.error(f'ITRA error: {str(e)}')
        return func.HttpResponse(json.dumps({'error': str(e)}), status_code=500, headers=headers)


@app.route(route="itra-paces", methods=["GET", "OPTIONS"])
def itra_paces_endpoint(req: func.HttpRequest) -> func.HttpResponse:
    """Convert ITRA score to base paces - Protected Algorithm"""
    logging.info('ITRA Paces API called')
    headers = get_cors_headers()
    
    if req.method == 'OPTIONS':
        return func.HttpResponse('', status_code=200, headers=headers)
    
    try:
        # Get score from query parameter
        score_param = req.params.get('score')
        
        if not score_param:
            return func.HttpResponse(
                json.dumps({'error': 'Missing score parameter'}),
                status_code=400,
                headers=headers
            )
        
        try:
            score = int(score_param)
        except ValueError:
            return func.HttpResponse(
                json.dumps({'error': 'Invalid score - must be an integer'}),
                status_code=400,
                headers=headers
            )
        
        # Validate range
        if score < 0 or score > 1000:
            return func.HttpResponse(
                json.dumps({'error': 'Score must be between 0 and 1000'}),
                status_code=400,
                headers=headers
            )
        
        result = itra_score_to_base_paces(score)
        return func.HttpResponse(json.dumps(result), status_code=200, headers=headers)
    except Exception as e:
        logging.error(f'ITRA Paces error: {str(e)}')
        return func.HttpResponse(json.dumps({'error': str(e)}), status_code=500, headers=headers)


@app.route(route="ddl", methods=["POST", "OPTIONS"])
def ddl_endpoint(req: func.HttpRequest) -> func.HttpResponse:
    """DDL (Dynamic Descent Load) calculation endpoint"""
    logging.info('DDL API called')
    headers = get_cors_headers()
    
    if req.method == 'OPTIONS':
        return func.HttpResponse('', status_code=200, headers=headers)
    
    try:
        data = req.get_json()
        segments = data.get('segments', [])
        runner_level = data.get('runnerLevel', 'intermediate')
        
        result = calculate_ddl(segments, runner_level)
        return func.HttpResponse(json.dumps(result), status_code=200, headers=headers)
    except Exception as e:
        logging.error(f'DDL error: {str(e)}')
        return func.HttpResponse(json.dumps({'error': str(e)}), status_code=500, headers=headers)


# ============================================================================
# WEATHER API - Cached Open-Meteo Proxy
# ============================================================================

def get_weather_table_client():
    """Get Azure Table Storage client for weather cache"""
    if not TABLE_STORAGE_AVAILABLE:
        return None
    
    connection_string = os.environ.get('AzureWebJobsStorage')
    if not connection_string:
        return None
    
    try:
        table_service = TableServiceClient.from_connection_string(connection_string)
        # Create table if it doesn't exist
        try:
            table_service.create_table("weathercache")
        except Exception:
            pass  # Table already exists
        return table_service.get_table_client("weathercache")
    except Exception as e:
        logging.warning(f"Could not connect to Table Storage: {e}")
        return None


def get_cached_weather(lat: float, lon: float, date: str):
    """Check cache for weather data (memory first, then Table Storage)"""
    cache_key = f"{lat:.2f}_{lon:.2f}_{date}"
    current_time = time.time()
    
    # Check in-memory cache first
    if cache_key in WEATHER_CACHE:
        cached = WEATHER_CACHE[cache_key]
        if current_time - cached['timestamp'] < WEATHER_CACHE_TTL:
            logging.info(f"Weather cache HIT (memory): {cache_key}")
            return cached['data']
        else:
            del WEATHER_CACHE[cache_key]  # Expired
    
    # Check Table Storage
    table_client = get_weather_table_client()
    if table_client:
        try:
            # PartitionKey is date, RowKey is lat_lon
            entity = table_client.get_entity(partition_key=date, row_key=f"{lat:.2f}_{lon:.2f}")
            cached_time = float(entity.get('CachedAt', 0))
            if current_time - cached_time < WEATHER_CACHE_TTL:
                data = json.loads(entity.get('WeatherData', '{}'))
                # Store in memory for faster subsequent access
                WEATHER_CACHE[cache_key] = {'data': data, 'timestamp': cached_time}
                logging.info(f"Weather cache HIT (table): {cache_key}")
                return data
        except Exception:
            pass  # Entity not found or error
    
    logging.info(f"Weather cache MISS: {cache_key}")
    return None


def set_cached_weather(lat: float, lon: float, date: str, data: dict):
    """Store weather data in cache (memory and Table Storage)"""
    cache_key = f"{lat:.2f}_{lon:.2f}_{date}"
    current_time = time.time()
    
    # Store in memory
    WEATHER_CACHE[cache_key] = {'data': data, 'timestamp': current_time}
    
    # Store in Table Storage for persistence
    table_client = get_weather_table_client()
    if table_client:
        try:
            entity = {
                'PartitionKey': date,
                'RowKey': f"{lat:.2f}_{lon:.2f}",
                'WeatherData': json.dumps(data),
                'CachedAt': str(current_time),
                'Latitude': str(lat),
                'Longitude': str(lon)
            }
            table_client.upsert_entity(entity)
            logging.info(f"Weather cached to table: {cache_key}")
        except Exception as e:
            logging.warning(f"Failed to cache weather to table: {e}")


@app.route(route="weather", methods=["GET", "OPTIONS"])
def weather_endpoint(req: func.HttpRequest) -> func.HttpResponse:
    """
    Weather API proxy with caching.
    Fetches from Open-Meteo and caches results for 6 hours.
    
    Query params:
    - lat: latitude (required)
    - lon: longitude (required)  
    - date: forecast date YYYY-MM-DD (required)
    """
    headers = get_cors_headers()
    
    if req.method == 'OPTIONS':
        return func.HttpResponse('', status_code=200, headers=headers)
    
    try:
        lat = req.params.get('lat')
        lon = req.params.get('lon')
        date = req.params.get('date')
        
        if not all([lat, lon, date]):
            return func.HttpResponse(
                json.dumps({'error': 'Missing required parameters: lat, lon, date'}),
                status_code=400, headers=headers
            )
        
        lat = float(lat)
        lon = float(lon)
        
        # Validate date format
        try:
            datetime.strptime(date, '%Y-%m-%d')
        except ValueError:
            return func.HttpResponse(
                json.dumps({'error': 'Invalid date format. Use YYYY-MM-DD'}),
                status_code=400, headers=headers
            )
        
        # Check cache first
        cached_data = get_cached_weather(lat, lon, date)
        if cached_data:
            return func.HttpResponse(
                json.dumps({'data': cached_data, 'cached': True}),
                status_code=200, headers=headers
            )
        
        # Fetch from Open-Meteo
        import urllib.request
        import urllib.error
        
        # Build Open-Meteo URL for daily forecast (same format as frontend expects)
        url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={lat}&longitude={lon}"
            f"&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode,windspeed_10m_max"
            f"&timezone=auto"
        )
        
        logging.info(f"Fetching weather from Open-Meteo: lat={lat}, lon={lon}, date={date}")
        
        request = urllib.request.Request(url, headers={'User-Agent': 'GPXray/1.0'})
        with urllib.request.urlopen(request, timeout=10) as response:
            weather_data = json.loads(response.read().decode('utf-8'))
        
        # Cache the result
        set_cached_weather(lat, lon, date, weather_data)
        
        return func.HttpResponse(
            json.dumps({'data': weather_data, 'cached': False}),
            status_code=200, headers=headers
        )
        
    except urllib.error.URLError as e:
        logging.error(f"Weather API fetch error: {e}")
        return func.HttpResponse(
            json.dumps({'error': 'Failed to fetch weather data'}),
            status_code=502, headers=headers
        )
    except Exception as e:
        logging.error(f"Weather endpoint error: {e}")
        return func.HttpResponse(
            json.dumps({'error': str(e)}),
            status_code=500, headers=headers
        )


# Configured race coordinates for weather pre-warming
RACE_WEATHER_CONFIGS = [
    # RET - Rureifel Trail 2026
    {'name': 'RET', 'lat': 50.68, 'lon': 6.48, 'date': '2026-04-18'},
    # Add more races here as needed
]


@app.timer_trigger(schedule="0 0 */6 * * *", arg_name="timer", run_on_startup=False)
def weather_prewarm(timer: func.TimerRequest) -> None:
    """
    Pre-warm weather cache for configured races.
    Runs every 6 hours to keep cache fresh before users hit the API.
    """
    import urllib.request
    import urllib.error
    
    logging.info("Weather pre-warm started")
    
    today = datetime.now().date()
    warmed_count = 0
    
    for race in RACE_WEATHER_CONFIGS:
        race_date = datetime.strptime(race['date'], '%Y-%m-%d').date()
        days_until_race = (race_date - today).days
        
        # Only pre-warm if race is within 16-day forecast window
        if 0 <= days_until_race <= 16:
            lat, lon, date = race['lat'], race['lon'], race['date']
            
            # Check if already cached
            cached = get_cached_weather(lat, lon, date)
            if cached:
                logging.info(f"Weather already cached for {race['name']} on {date}")
                continue
            
            try:
                url = (
                    f"https://api.open-meteo.com/v1/forecast?"
                    f"latitude={lat}&longitude={lon}"
                    f"&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode,windspeed_10m_max"
                    f"&timezone=auto"
                )
                
                request = urllib.request.Request(url, headers={'User-Agent': 'GPXray/1.0'})
                with urllib.request.urlopen(request, timeout=10) as response:
                    weather_data = json.loads(response.read().decode('utf-8'))
                
                set_cached_weather(lat, lon, date, weather_data)
                warmed_count += 1
                logging.info(f"Pre-warmed weather for {race['name']} on {date}")
                
            except Exception as e:
                logging.error(f"Failed to pre-warm weather for {race['name']}: {e}")
    
    logging.info(f"Weather pre-warm completed: {warmed_count} new, {len(RACE_WEATHER_CONFIGS)} total configs")


# ============================================================================
# ACCESS CODE VALIDATION - Protected
# ============================================================================

# Valid access codes (SHA-256 hashed) - codes are hidden server-side
# To add a new code: hashlib.sha256("NEWCODE".encode()).hexdigest()

VALID_ACCESS_HASHES = {
    'ff8f3de662499065ac43246d1fef1091714708a150362cd26a5ca6d46c85e517',  # GPXRAYDANIEL
    '4aac120e578508cd3ce77a6e6f1f1a1538678128557bd2ba1918ba672422b313',  # GPXRAYBENE
}

# Simple in-memory rate limiting (resets on function cold start)
_rate_limit_cache = {}
RATE_LIMIT_ATTEMPTS = 10
RATE_LIMIT_WINDOW = 300  # 5 minutes


def check_rate_limit(client_ip: str) -> bool:
    """Check if client is rate limited. Returns True if allowed."""
    now = time.time()
    
    if client_ip not in _rate_limit_cache:
        _rate_limit_cache[client_ip] = {'count': 0, 'window_start': now}
    
    cache = _rate_limit_cache[client_ip]
    
    # Reset window if expired
    if now - cache['window_start'] > RATE_LIMIT_WINDOW:
        cache['count'] = 0
        cache['window_start'] = now
    
    # Check limit
    if cache['count'] >= RATE_LIMIT_ATTEMPTS:
        return False
    
    cache['count'] += 1
    return True


def validate_access_code(code: str) -> dict:
    """Validate an access code against stored hashes"""
    if not code or len(code) < 3:
        return {'valid': False, 'reason': 'invalid_format'}
    
    # Normalize and hash
    normalized = code.strip().upper()
    code_hash = hashlib.sha256(normalized.encode()).hexdigest()
    
    if code_hash in VALID_ACCESS_HASHES:
        return {'valid': True, 'code': normalized}
    
    return {'valid': False, 'reason': 'invalid_code'}


# ============================================================================
# AI STATEMENT GENERATION
# ============================================================================

# Cache for AI-generated statements (race_id + time_category + lang -> statement)
_ai_statement_cache = {}

def get_ai_client():
    """Get Azure OpenAI client"""
    endpoint = os.environ.get('AZURE_OPENAI_ENDPOINT')
    key = os.environ.get('AZURE_OPENAI_KEY')
    
    if not endpoint or not key:
        return None
    
    return AzureOpenAI(
        azure_endpoint=endpoint,
        api_key=key,
        api_version="2024-10-21"
    )

def generate_ai_statement(race_name: str, location: str, finish_hour: int, 
                          is_next_day: bool, total_hours: float, lang: str = 'en') -> str:
    """Generate a witty statement using Azure OpenAI"""
    
    # Determine time category
    if is_next_day or total_hours >= 24:
        time_cat = "next_day"
        time_desc = "finishing the next day after a 24+ hour race"
    elif finish_hour < 7:
        time_cat = "early_morning"
        time_desc = "finishing very early morning (before 7am)"
    elif finish_hour < 11:
        time_cat = "morning"
        time_desc = "finishing mid-morning (7-11am)"
    elif finish_hour < 14:
        time_cat = "midday"
        time_desc = "finishing around lunchtime (11am-2pm)"
    elif finish_hour < 18:
        time_cat = "afternoon"
        time_desc = "finishing in the afternoon (2-6pm)"
    elif finish_hour < 21:
        time_cat = "evening"
        time_desc = "finishing in the evening (6-9pm)"
    else:
        time_cat = "night"
        time_desc = "finishing late at night (9pm-midnight)"
    
    # Check cache
    cache_key = f"{race_name}_{time_cat}_{lang}"
    if cache_key in _ai_statement_cache:
        return _ai_statement_cache[cache_key]
    
    client = get_ai_client()
    if not client:
        return None
    
    deployment = os.environ.get('AZURE_OPENAI_DEPLOYMENT', 'gpt-4-1-mini')
    
    # Language-specific prompts - PUNCHY and FUNNY like backup statements
    if lang == 'de':
        system_prompt = """Generiere einen WITZIGEN Trail-Running-Spruch für Instagram.

REGELN:
1. NUR DEUTSCH! Keine englischen Wörter!
2. MAX 12 Wörter gesamt (2 kurze Zeilen)
3. Muss LUSTIG sein - über Essen, Bier, Couch, Schlaf
4. Locker wie mit Freunden reden
5. Kann OPTIONAL lokales Essen/Bier erwähnen (Weißwurst, Kölsch, etc.)

PERFEKTE BEISPIELE:
- "Zurück zur Happy Hour. 🍺<br>Erste Runde geht auf mich."
- "Ab aufs Sofa. 🛋️<br>Hab's mir verdient."
- "Abendessen? Vielleicht. 🤷<br>Wartet nicht auf mich."
- "Bier kalt stellen. 🍻<br>Bin gegen Mitternacht da."
- "Erst laufen, dann Kuchen. 🍰<br>Prioritäten."

VERBOTEN:
- Englische Wörter (KEIN "Finish", "Trail", "Run", etc.)
- Poetisch oder inspirierend
- Länger als 12 Wörter

Format: Zeile1<br>Zeile2 + EIN Emoji
Familienfreundlich!"""
    else:
        system_prompt = """Generate a FUNNY trail running statement for Instagram.

RULES:
1. ENGLISH ONLY! No other languages!
2. MAX 12 words total (2 short lines)
3. Must be FUNNY - about food, beer, couch, sleep
4. Casual like talking to friends
5. Can OPTIONALLY mention local food/drinks (pretzels, fondue, etc.)

PERFECT EXAMPLES:
- "Back for happy hour. 🍺<br>First round's on me."
- "Straight to the couch. 🛋️<br>Earned it."
- "Dinner? Maybe. 🤷<br>Don't wait up."
- "Chill the beer. 🍻<br>Be there by midnight."
- "First run, then cake. 🍰<br>Priorities."

FORBIDDEN:
- Poetic or inspirational
- Longer than 12 words
- Trying too hard to be clever

Format: Line1<br>Line2 + ONE emoji
Family-friendly!"""
    
    user_prompt = f"""Race: {race_name}
Location: {location}
Finish: {time_desc}

Generate ONE short punchy statement (max 15 words, 2 lines)."""

    try:
        response = client.chat.completions.create(
            model=deployment,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=60,
            temperature=0.7
        )
        
        statement = response.choices[0].message.content.strip()
        
        # Basic content safety check (additional layer beyond Azure's filters)
        blocked_words = ['sex', 'naked', 'nude', 'kill', 'murder', 'blood', 'porn', 'fuck', 'shit', 'ass', 'dick', 'cock']
        statement_lower = statement.lower()
        if any(word in statement_lower for word in blocked_words):
            logging.warning(f"AI statement blocked for inappropriate content: {statement[:50]}...")
            return None
        
        # Cache the result
        _ai_statement_cache[cache_key] = statement
        
        return statement
    except Exception as e:
        logging.error(f"AI generation error: {e}")
        return None


@app.route(route="ai/statement", methods=["POST"])
def generate_statement(req: func.HttpRequest) -> func.HttpResponse:
    """Generate AI-powered witty statement for story card"""
    
    # CORS headers
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    }
    
    if req.method == 'OPTIONS':
        return func.HttpResponse('', status_code=204, headers=headers)
    
    try:
        data = req.get_json()
        
        race_name = data.get('raceName', 'Trail Race')
        location = data.get('location', 'Mountains')
        finish_hour = data.get('finishHour', 12)
        is_next_day = data.get('isNextDay', False)
        total_hours = data.get('totalHours', 6)
        lang = data.get('lang', 'en')
        
        statement = generate_ai_statement(
            race_name, location, finish_hour, is_next_day, total_hours, lang
        )
        
        if statement:
            return func.HttpResponse(
                json.dumps({'statement': statement, 'source': 'ai'}),
                status_code=200,
                headers=headers
            )
        else:
            return func.HttpResponse(
                json.dumps({'error': 'AI generation failed', 'source': 'fallback'}),
                status_code=200,
                headers=headers
            )
            
    except Exception as e:
        logging.error(f"Statement generation error: {e}")
        return func.HttpResponse(
            json.dumps({'error': str(e)}),
            status_code=500,
            headers=headers
        )


@app.route(route="validate-code", methods=["POST", "OPTIONS"])
def validate_code_endpoint(req: func.HttpRequest) -> func.HttpResponse:
    """Validate early access code - protected server-side"""
    logging.info('Validate code API called')
    headers = get_cors_headers()
    
    if req.method == 'OPTIONS':
        return func.HttpResponse('', status_code=200, headers=headers)
    
    try:
        # Get client IP for rate limiting
        client_ip = req.headers.get('X-Forwarded-For', req.headers.get('X-Real-IP', 'unknown'))
        if ',' in client_ip:
            client_ip = client_ip.split(',')[0].strip()
        
        # Check rate limit
        if not check_rate_limit(client_ip):
            logging.warning(f'Rate limit exceeded for {client_ip}')
            return func.HttpResponse(
                json.dumps({'valid': False, 'reason': 'rate_limited'}),
                status_code=429,
                headers=headers
            )
        
        data = req.get_json()
        code = data.get('code', '')
        
        result = validate_access_code(code)
        
        if result['valid']:
            logging.info(f'Valid access code used: {result["code"][:3]}***')
        
        return func.HttpResponse(json.dumps(result), status_code=200, headers=headers)
    except Exception as e:
        logging.error(f'Validate code error: {str(e)}')
        return func.HttpResponse(
            json.dumps({'valid': False, 'reason': 'error'}),
            status_code=500,
            headers=headers
        )
