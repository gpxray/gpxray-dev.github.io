import azure.functions as func
import json


def itra_score_to_paces(score: int) -> dict:
    """
    Convert ITRA score to pace preset using continuous interpolation.
    
    ITRA ranges mapped to runner levels:
    < 300: Very beginner (slower than beginner preset)
    300-450: Beginner to Intermediate
    450-600: Intermediate to Advanced
    600-750: Advanced to Elite
    > 750: Elite to Pro
    
    This is protected business logic - not exposed in frontend.
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
        'downhillPace': round(flat_pace * downhill_ratio, 2)
    }


def main(req: func.HttpRequest) -> func.HttpResponse:
    """Azure Function entry point for ITRA pace conversion."""
    
    # CORS headers
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    }
    
    # Handle preflight
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
        
        result = itra_score_to_paces(score)
        result['itraScore'] = score
        
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
