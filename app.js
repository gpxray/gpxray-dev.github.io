// Global state
let gpxData = null;
let map = null;
let routeLayers = [];
let elevationChart = null;
let gradientChart = null;
let segments = []; // Stores segment data with terrain type
let currentMode = 'manual'; // 'manual', 'target', or 'itra'
let aidStations = []; // Stores AID station data
let useMetric = true; // true = km, false = miles
let surfaceData = []; // Stores surface data from OSM
let surfaceEnabled = true; // Whether to use surface multipliers
let currentRouteName = ''; // Name of current loaded route
let currentRaceLocation = ''; // Location of current race for AI statements
let sunTimes = null; // Sunrise/sunset times for race day
let isDemoMode = false; // Whether demo is currently loaded
let isSurfaceLoading = false; // Whether surface data is being fetched
let lastCalculatedPaces = null; // Store last calculated paces for re-rendering
let lastCachedDDL = null; // Store DDL from API - formulas protected on server
let lastCachedCheckpoints = null; // Store checkpoints from API
let hoverMarker = null; // Marker for hover position on map (profile sync)
let lastCachedFatigue = 1.0; // Store fatigue multiplier from API
let lastCachedKmSplits = null; // Store km splits from API (gradient-based)
let preStoredSurfaceData = null; // Pre-computed surface data from race config
let raceWeatherData = null; // Weather data for race day (for weather adjustment)
let currentStatementIndex = 0; // Current index for statement reroll
let currentStatementCategory = null; // Current statement time category

// Environment detection
const IS_DEV = window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.hostname.includes('gpxray-dev') ||
               window.location.pathname.includes('gpxray-dev');

// API Configuration (auto-detects environment)
const API_CONFIG = {
    calculateEndpoint: IS_DEV 
        ? 'https://gpxray-dev.azurewebsites.net/api/calculate'
        : 'https://api.gpxray.run/api/calculate',
    aiStatementEndpoint: IS_DEV
        ? 'https://gpxray-dev.azurewebsites.net/api/ai/statement'
        : 'https://api.gpxray.run/api/ai/statement',
    itraPacesEndpoint: IS_DEV
        ? 'https://gpxray-dev.azurewebsites.net/api/itra-paces'
        : 'https://api.gpxray.run/api/itra-paces',
    weatherEndpoint: IS_DEV
        ? 'https://gpxray-dev.azurewebsites.net/api/weather'
        : 'https://api.gpxray.run/api/weather',
    useBackend: true,
    timeout: 15000
};

// Setup dev environment indicator
function setupDevIndicator() {
    if (!IS_DEV) return;
    
    // Update page title
    document.title = 'DEV | GPXray - Know your race before it starts';
    
    // Add DEV badge to logo
    const logoText = document.querySelector('.logo-text');
    if (logoText && !logoText.querySelector('.dev-badge')) {
        const devBadge = document.createElement('span');
        devBadge.className = 'dev-badge';
        devBadge.textContent = 'DEV';
        logoText.appendChild(devBadge);
    }
}

// Helper to resolve GPX URLs (uses blob storage if available)
function resolveGpxUrl(gpxPath) {
    // If GPX_STORAGE_URL is defined (in races-config.js), use it for races/ paths
    if (typeof GPX_STORAGE_URL !== 'undefined' && gpxPath.startsWith('races/')) {
        const filename = gpxPath.replace('races/', '');
        return `${GPX_STORAGE_URL}/${filename}`;
    }
    // Fallback to local path
    return new URL(gpxPath, window.location.origin + '/').href;
}

// Constants
const GRADE_THRESHOLD = 2; // percentage grade to determine uphill/downhill
const HISTORY_KEY = 'gpxray_history'; // localStorage key for history
const KM_TO_MILES = 0.621371;
const MILES_TO_KM = 1.60934;

// Gradient-based pace scaling (data-driven from 4 real trail workouts)
// Empirical multipliers based on 86 km-splits across varied terrain
// Runner level scales the base multiplier (elite handles steep better than beginner)
function getGradientPaceMultiplier(gradePercent, flatPace, uphillPace, downhillPace) {
    // Calculate runner's efficiency factors (relative to intermediate baseline)
    // Intermediate baseline: uphillRatio=1.4, downhillRatio=0.85
    const uphillRatio = uphillPace / flatPace;
    const downhillRatio = downhillPace / flatPace;
    const uphillEfficiency = uphillRatio / 1.4;     // >1 = slower than baseline, <1 = faster
    const downhillEfficiency = downhillRatio / 0.85; // >1 = slower than baseline, <1 = faster
    
    // Grade is positive for uphill, negative for downhill
    if (Math.abs(gradePercent) < GRADE_THRESHOLD) {
        return 1.0;
    }
    
    if (gradePercent > 0) {
        // Uphill: empirical multipliers from real workout data
        let baseMultiplier;
        if (gradePercent <= 5) {
            // 2-5%: 1.0 to 1.2 (gentle uphill)
            const t = (gradePercent - GRADE_THRESHOLD) / (5 - GRADE_THRESHOLD);
            baseMultiplier = 1.0 + t * 0.2;
        } else if (gradePercent <= 8) {
            // 5-8%: 1.2 to 1.65 (moderate uphill)
            const t = (gradePercent - 5) / 3;
            baseMultiplier = 1.2 + t * 0.45;
        } else if (gradePercent <= 12) {
            // 8-12%: 1.65 to 1.8 (steep uphill)
            const t = (gradePercent - 8) / 4;
            baseMultiplier = 1.65 + t * 0.15;
        } else if (gradePercent <= 15) {
            // 12-15%: 1.8 to 2.2 (very steep)
            const t = (gradePercent - 12) / 3;
            baseMultiplier = 1.8 + t * 0.4;
        } else {
            // >15%: 2.2+ hiking territory, extra 5% per grade point
            baseMultiplier = 2.2 + (gradePercent - 15) * 0.05;
        }
        
        // Scale by runner efficiency (beginner=slower, elite=faster)
        return baseMultiplier * uphillEfficiency;
        
    } else {
        // Downhill: empirical data shows steep descents are SLOWER (technical terrain!)
        const absGrade = Math.abs(gradePercent);
        let baseMultiplier;
        
        if (absGrade <= 5) {
            // -2 to -5%: 0.95 to 0.90 (easy descent, faster)
            const t = (absGrade - GRADE_THRESHOLD) / (5 - GRADE_THRESHOLD);
            baseMultiplier = 0.95 - t * 0.05;
        } else if (absGrade <= 10) {
            // -5 to -10%: 0.90 to 0.85 (moderate descent, still faster)
            const t = (absGrade - 5) / 5;
            baseMultiplier = 0.90 - t * 0.05;
        } else if (absGrade <= 15) {
            // -10 to -15%: 0.85 to 0.88 (steep descent, slight technical slowdown)
            const t = (absGrade - 10) / 5;
            baseMultiplier = 0.85 + t * 0.03;
        } else {
            // <-15%: technical terrain requires braking
            // 0.88 at -15%, then +3% per grade point
            baseMultiplier = 0.88 + (absGrade - 15) * 0.03;
        }
        
        // Scale by runner efficiency (adjust via downhillRatio in UI)
        return baseMultiplier * downhillEfficiency;
    }
}

// Toast notification helper
function showToast(message, type = 'success') {
    // Remove any existing toast
    const existingToast = document.querySelector('.gpxray-toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `gpxray-toast gpxray-toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });
    
    // Auto-remove after 2.5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// Night pace penalty - running at night is slower due to reduced visibility
// Returns multiplier (e.g., 1.08 = 8% slower)
const NIGHT_PACE_PENALTY = 0.08; // 8% slower at night
const TWILIGHT_BUFFER = 45; // 45 minutes of civil twilight before sunrise / after sunset (no headlamp needed)

function getNightPaceMultiplier(clockMinutes, surfaceType = 'trail') {
    // Check if we have sun times
    if (!sunTimes || sunTimes.polarNight || sunTimes.midnightSun) {
        return 1.0;
    }
    
    // Night includes twilight: before (sunrise - buffer) or after (sunset + buffer)
    // Civil twilight is when headlamp is typically needed
    const effectiveSunrise = sunTimes.sunrise - TWILIGHT_BUFFER;
    const effectiveSunset = sunTimes.sunset + TWILIGHT_BUFFER;
    const isNight = clockMinutes < effectiveSunrise || clockMinutes > effectiveSunset;
    
    if (!isNight) {
        return 1.0;
    }
    
    // More penalty on technical terrain (harder to see obstacles)
    let penalty = NIGHT_PACE_PENALTY;
    if (surfaceType === 'technical' || surfaceType === 'rocky') {
        penalty = 0.12; // 12% slower on technical terrain at night
    } else if (surfaceType === 'road') {
        penalty = 0.05; // Only 5% slower on road at night
    }
    
    return 1.0 + penalty;
}

// Runner level presets - display names only (calculations are server-side)
// Runner level presets - display defaults for UI (core calculations are server-side)
const RUNNER_LEVELS = {
    beginner: { name: 'Beginner', flatPace: 7.5, uphillRatio: 1.5, downhillRatio: 0.9 },
    intermediate: { name: 'Intermediate', flatPace: 6.5, uphillRatio: 1.4, downhillRatio: 0.85 },
    advanced: { name: 'Advanced', flatPace: 5.5, uphillRatio: 1.3, downhillRatio: 0.8 },
    elite: { name: 'Elite', flatPace: 4.5, uphillRatio: 1.25, downhillRatio: 0.75 }
};

// ITRA score state
let activeItraScore = null;
let cachedItraPaces = null; // Cache API response to avoid repeated calls

// Fetch ITRA paces from API (protected business logic)
async function fetchItraPaces(score) {
    // Return cached result if same score
    if (cachedItraPaces && cachedItraPaces.itraScore === score) {
        return cachedItraPaces;
    }
    
    try {
        const response = await fetch(`${API_CONFIG.itraPacesEndpoint}?score=${score}`);
        if (!response.ok) {
            throw new Error(`ITRA API error: ${response.status}`);
        }
        cachedItraPaces = await response.json();
        return cachedItraPaces;
    } catch (error) {
        console.error('Failed to fetch ITRA paces:', error);
        // Fallback to intermediate preset on error
        return {
            flatPace: 6.5,
            uphillRatio: 1.4,
            downhillRatio: 0.85,
            itraScore: score
        };
    }
}

// Surface type display properties (calculations are server-side)
const SURFACE_TYPES = {
    road: { name: 'Road', color: '#4CAF50' },
    trail: { name: 'Trail', color: '#FF9800' },
    technical: { name: 'Technical', color: '#9C27B0' },
    unknown: { name: 'Unknown', color: '#9E9E9E' }
};

// Placeholder - actual calculation done server-side
function getFatigueMultiplier(distanceKm) {
    // Returns placeholder value - real fatigue applied by API
    return 1.0;
}

// Helper to get translated surface name
function getSurfaceName(surfaceType) {
    if (typeof t === 'function') {
        return t('surface.' + surfaceType) || SURFACE_TYPES[surfaceType]?.name || surfaceType;
    }
    return SURFACE_TYPES[surfaceType]?.name || surfaceType;
}

// Helper to get translated terrain name
function getTerrainName(terrain) {
    if (typeof t === 'function') {
        return t('terrain.' + terrain) || terrain;
    }
    return terrain.charAt(0).toUpperCase() + terrain.slice(1);
}

// OSM surface tag to category mapping
const OSM_SURFACE_MAP = {
    // Road surfaces
    'asphalt': 'road', 'concrete': 'road', 'paved': 'road', 'concrete:plates': 'road',
    'concrete:lanes': 'road', 'paving_stones': 'road', 'sett': 'road', 'cobblestone': 'road',
    // Trail surfaces
    'compacted': 'trail', 'fine_gravel': 'trail', 'gravel': 'trail', 'dirt': 'trail',
    'earth': 'trail', 'ground': 'trail', 'grass': 'trail', 'unpaved': 'trail',
    'sand': 'trail', 'woodchips': 'trail', 'mud': 'trail',
    // Technical surfaces
    'rock': 'technical', 'rocks': 'technical', 'pebblestone': 'technical', 'stepping_stones': 'technical',
    'stone': 'technical', 'boulders': 'technical'
};

// OSM highway type fallback mapping (when no surface tag)
const OSM_HIGHWAY_MAP = {
    'motorway': 'road', 'trunk': 'road', 'primary': 'road', 'secondary': 'road',
    'tertiary': 'road', 'residential': 'road', 'service': 'road', 'unclassified': 'road',
    'path': 'trail', 'footway': 'trail', 'cycleway': 'trail', 'bridleway': 'trail',
    'track': 'trail', 'steps': 'technical'
};

// DOM Elements
const dropZone = document.getElementById('dropZone');
const gpxInput = document.getElementById('gpxInput');
const browseBtn = document.getElementById('browseBtn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Initialize internationalization first
    if (typeof initI18n === 'function') {
        initI18n();
    }
    setupLanguageSelector();
    
    setupDragAndDrop();
    setupFileInput();
    setupPaceCalculation();
    setupModeSelector();
    setupAidStations();
    setupExport();
    setupUnitToggle();
    setupSaveLoad();
    setupPrintRaceCard();
    setupChartSelector();
    setupHistory();
    setupFeedback();
    setupDemo();
    setupSunTimes();
    setupRaceBrowser();
    setupFooter();
    setupDDLExplainer();
    setupCookieConsent();
    setupEarlyAccess();
    updateEarlyAccessUI();
    setupRunnerLevel();
    setupItraScore();
    setupAdvancedOptions();
    setupDatePresets();
    setupPaceInfoTooltip();
    setupFeaturePillTooltips();
    setupChangeRouteButton();
    setupHeroAidStations();
    setupTargetTimeInput();
    setupHeroSurfaceToggle();
    setupTerrainSliders();
    
    // Set up dev indicator (only on dev site)
    setupDevIndicator();
    
    // Check for race landing page mode
    initRaceMode();
});

// Hero Surface Toggle - syncs with the original surfaceEnabled checkbox
function setupHeroSurfaceToggle() {
    const heroToggle = document.getElementById('heroSurfaceEnabled');
    const originalToggle = document.getElementById('surfaceEnabled');
    
    if (!heroToggle) return;
    
    // Sync initial state
    if (originalToggle) {
        heroToggle.checked = originalToggle.checked;
    }
    
    // When hero toggle changes, sync to original and recalculate
    heroToggle.addEventListener('change', () => {
        surfaceEnabled = heroToggle.checked;
        
        // Sync to original toggle if it exists
        if (originalToggle) {
            originalToggle.checked = heroToggle.checked;
        }
        
        // Recalculate if we have data
        if (gpxData && segments.length > 0) {
            calculateRacePlan();
        }
    });
    
    // When original toggle changes, sync to hero
    if (originalToggle) {
        originalToggle.addEventListener('change', () => {
            heroToggle.checked = originalToggle.checked;
        });
    }
}

// Terrain Style Sliders - self-assessment for uphill/downhill ability
function setupTerrainSliders() {
    const uphillRatio = document.getElementById('uphillRatio');
    const downhillRatio = document.getElementById('downhillRatio');
    
    // Uphill labels
    const getUphillLabel = (value) => {
        const v = parseFloat(value);
        if (v <= 1.25) return '💪 Strong climber (+25%)';
        if (v <= 1.35) return '🏃 Good climber (+35%)';
        if (v <= 1.45) return '⚡ Balanced (+40%)';
        if (v <= 1.55) return '🥾 Prefers flat (+50%)';
        return '😓 Struggles uphill (+60%)';
    };
    
    // Downhill labels
    const getDownhillLabel = (value) => {
        const v = parseFloat(value);
        if (v <= 0.82) return '🏃 Aggressive (-20%)';
        if (v <= 0.87) return '⚡ Good descender (-15%)';
        if (v <= 0.91) return '🚶 Balanced (-10%)';
        return '🛡️ Cautious (-5%)';
    };
    
    // Setup a pair of sliders (original or hero)
    const setupSliderPair = (uphillSliderId, downhillSliderId, uphillHintId, downhillHintId) => {
        const uphillSlider = document.getElementById(uphillSliderId);
        const downhillSlider = document.getElementById(downhillSliderId);
        const uphillHint = document.getElementById(uphillHintId);
        const downhillHint = document.getElementById(downhillHintId);
        
        if (!uphillSlider || !downhillSlider) return;
        
        // Sync uphill slider to hidden ratio input
        uphillSlider.addEventListener('input', () => {
            // Slider goes left (1.2) to right (1.6)
            // Higher values = struggles more, so left is strong, right is struggles
            const value = parseFloat(uphillSlider.value);
            if (uphillRatio) uphillRatio.value = value.toFixed(2);
            if (uphillHint) uphillHint.textContent = getUphillLabel(value);
            // Sync other slider if exists
            syncOtherSlider('heroUphillSlider', 'uphillSlider', uphillSliderId, value);
        });
        
        // Sync downhill slider to hidden ratio input
        downhillSlider.addEventListener('input', () => {
            // Slider goes left (0.80) to right (0.95)
            // Lower values = faster downhill (aggressive), so left is aggressive
            const value = parseFloat(downhillSlider.value);
            if (downhillRatio) downhillRatio.value = value.toFixed(2);
            if (downhillHint) downhillHint.textContent = getDownhillLabel(value);
            // Sync other slider if exists
            syncOtherSlider('heroDownhillSlider', 'downhillSlider', downhillSliderId, value);
        });
        
        // Initialize
        const initUphill = parseFloat(uphillRatio?.value) || 1.4;
        uphillSlider.value = initUphill;
        if (uphillHint) uphillHint.textContent = getUphillLabel(initUphill);
        
        const initDownhill = parseFloat(downhillRatio?.value) || 0.85;
        downhillSlider.value = initDownhill;
        if (downhillHint) downhillHint.textContent = getDownhillLabel(initDownhill);
    };
    
    // Helper to sync between hero and original sliders
    const syncOtherSlider = (id1, id2, currentId, value) => {
        const otherId = currentId === id1 ? id2 : id1;
        const otherSlider = document.getElementById(otherId);
        if (otherSlider && otherSlider.value !== value.toString()) {
            otherSlider.value = value;
        }
    };
    
    // Setup original sliders (in target mode)
    setupSliderPair('uphillSlider', 'downhillSlider', 'uphillHint', 'downhillHint');
    
    // Setup hero sliders
    setupSliderPair('heroUphillSlider', 'heroDownhillSlider', 'heroUphillHint', 'heroDownhillHint');
    
    // Setup hero terrain toggle
    const terrainToggle = document.getElementById('heroTerrainToggle');
    const terrainContent = document.getElementById('heroTerrainContent');
    
    if (terrainToggle && terrainContent) {
        terrainToggle.addEventListener('click', () => {
            const isExpanded = terrainContent.style.display !== 'none';
            terrainContent.style.display = isExpanded ? 'none' : 'block';
            terrainToggle.classList.toggle('expanded', !isExpanded);
        });
    }
}

// Target Time Input styling
function setupTargetTimeInput() {
    // Setup for both main page and race page target time inputs
    const setupInput = (inputId) => {
        const targetInput = document.getElementById(inputId);
        if (!targetInput) return;
        
        const updateStyle = () => {
            const raceLevelButtons = document.getElementById('raceLevelButtons');
            const mainLevelButtons = document.getElementById('mainLevelButtons');
            
            if (targetInput.value && targetInput.value.match(/^\d{1,2}:\d{2}$/)) {
                targetInput.classList.add('has-value');
                
                // Clear ITRA when Target Time is entered (mutually exclusive)
                if (activeItraScore !== null) {
                    clearItraOverride();
                }
                
                // Dim runner level buttons (Target Time overrides level)
                if (raceLevelButtons) raceLevelButtons.classList.add('target-override');
                if (mainLevelButtons) mainLevelButtons.classList.add('target-override');
            } else {
                targetInput.classList.remove('has-value');
                
                // Re-enable runner level buttons if no target time
                if (raceLevelButtons) raceLevelButtons.classList.remove('target-override');
                if (mainLevelButtons) mainLevelButtons.classList.remove('target-override');
            }
        };
        
        targetInput.addEventListener('input', updateStyle);
        targetInput.addEventListener('change', updateStyle);
        targetInput.addEventListener('blur', updateStyle);
        
        // Initial check
        updateStyle();
    };
    
    setupInput('heroTargetTime');
    setupInput('raceTargetTime');
    
    // Setup smart time text input parser
    const smartTimeInput = document.getElementById('targetTimeText');
    if (smartTimeInput) {
        smartTimeInput.addEventListener('input', parseSmartTimeInput);
        smartTimeInput.addEventListener('change', parseSmartTimeInput);
        smartTimeInput.addEventListener('blur', parseSmartTimeInput);
    }
}

// Parse smart time input like "2:57", "2h57", "2h57m", "177" (minutes)
function parseSmartTimeInput(e) {
    const input = e.target.value.trim();
    if (!input) return;
    
    const hoursField = document.getElementById('targetHours');
    const minutesField = document.getElementById('targetMinutes');
    const secondsField = document.getElementById('targetSeconds');
    
    if (!hoursField || !minutesField) return;
    
    let hours = 0, minutes = 0, seconds = 0;
    
    // Try different formats
    // Format: "2:57" or "2:57:30"
    const colonMatch = input.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
    if (colonMatch) {
        hours = parseInt(colonMatch[1]) || 0;
        minutes = parseInt(colonMatch[2]) || 0;
        seconds = parseInt(colonMatch[3]) || 0;
    }
    // Format: "2h57" or "2h57m" or "2h 57m" or "2h57m30s"
    else if (input.match(/h/i)) {
        const hMatch = input.match(/(\d+)\s*h/i);
        const mMatch = input.match(/(\d+)\s*m/i);
        const sMatch = input.match(/(\d+)\s*s/i);
        hours = hMatch ? parseInt(hMatch[1]) : 0;
        minutes = mMatch ? parseInt(mMatch[1]) : 0;
        seconds = sMatch ? parseInt(sMatch[1]) : 0;
    }
    // Format: just minutes like "177"
    else if (input.match(/^\d+$/)) {
        const totalMinutes = parseInt(input);
        if (totalMinutes > 60) {
            hours = Math.floor(totalMinutes / 60);
            minutes = totalMinutes % 60;
        } else {
            minutes = totalMinutes;
        }
    }
    
    // Update the fields
    if (hours || minutes || seconds) {
        hoursField.value = hours;
        minutesField.value = minutes;
        if (secondsField) secondsField.value = seconds;
        
        // Visual feedback
        e.target.style.borderColor = '#00d4ff';
        setTimeout(() => {
            e.target.style.borderColor = '';
        }, 500);
    }
}

// Feature Pill Tooltips
function setupFeaturePillTooltips() {
    // Create a single tooltip container in the body
    let tooltipEl = document.createElement('div');
    tooltipEl.id = 'pillTooltipContainer';
    tooltipEl.className = 'feature-pill-tooltip';
    tooltipEl.style.display = 'none';
    document.body.appendChild(tooltipEl);
    
    let activePill = null;
    
    function hideTooltip() {
        tooltipEl.style.display = 'none';
        activePill = null;
    }
    
    function showTooltip(pill) {
        const tooltipKey = pill.dataset.tooltip;
        
        // If same pill, toggle off
        if (activePill === pill) {
            hideTooltip();
            return;
        }
        
        // Get translation text
        const text = t(tooltipKey);
        
        // Set content and show
        tooltipEl.textContent = text;
        tooltipEl.style.display = 'block';
        
        // Position below the pill
        const rect = pill.getBoundingClientRect();
        const tooltipRect = tooltipEl.getBoundingClientRect();
        
        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        let top = rect.bottom + 10 + window.scrollY;
        
        // Keep within viewport
        if (left < 10) left = 10;
        if (left + tooltipRect.width > window.innerWidth - 10) {
            left = window.innerWidth - tooltipRect.width - 10;
        }
        
        tooltipEl.style.position = 'absolute';
        tooltipEl.style.left = left + 'px';
        tooltipEl.style.top = top + 'px';
        tooltipEl.style.transform = 'none';
        
        activePill = pill;
    }
    
    // Add click handlers to all feature pills with data-tooltip
    document.querySelectorAll('.feature-pill[data-tooltip]').forEach(pill => {
        pill.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showTooltip(pill);
        });
    });
    
    // Close tooltip when clicking elsewhere
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.feature-pill') && !e.target.closest('#pillTooltipContainer')) {
            hideTooltip();
        }
    });
}

// Language Selector (Toggle Buttons)
function setupLanguageSelector() {
    const langToggle = document.getElementById('langToggle');
    if (!langToggle) return;
    
    const langBtns = langToggle.querySelectorAll('.lang-btn');
    const currentLang = typeof getLang === 'function' ? getLang() : 'en';
    
    // Set initial active state
    langBtns.forEach(btn => {
        if (btn.dataset.lang === currentLang) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
        
        btn.addEventListener('click', () => {
            const lang = btn.dataset.lang;
            
            // Update active state
            langBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Set language
            if (typeof setLanguage === 'function') {
                setLanguage(lang);
            }
        });
    });
}

// Runner Level Selector
function setupRunnerLevel() {
    const heroLevelSelect = document.getElementById('runnerLevel');
    const raceLevelButtons = document.getElementById('raceLevelButtons');
    const mainLevelButtons = document.getElementById('mainLevelButtons');
    
    const handleLevelChange = (level) => {
        // Update hero select (used by applyRunnerLevelPaces)
        if (heroLevelSelect) {
            heroLevelSelect.value = level;
        }
        
        // Update button selection (race page)
        if (raceLevelButtons) {
            raceLevelButtons.querySelectorAll('.race-level-btn').forEach(btn => {
                btn.classList.toggle('selected', btn.dataset.level === level);
            });
        }
        
        // Update button selection (main page)
        if (mainLevelButtons) {
            mainLevelButtons.querySelectorAll('.race-level-btn').forEach(btn => {
                btn.classList.toggle('selected', btn.dataset.level === level);
            });
        }
        
        if (!gpxData || segments.length === 0) return;
        
        // Apply new paces and recalculate (only if not waiting for Calculate button)
        applyRunnerLevelPaces();
        
        // Only auto-calculate on race pages, not on main page with Calculate button
        const heroCalculateBtn = document.getElementById('heroCalculateBtn');
        if (!heroCalculateBtn) {
            calculateRacePlan();
            fetchGpxWeather(); // Re-fetch weather after recalculating
        }
    };
    
    // Hero select (hidden, for compatibility)
    if (heroLevelSelect) {
        heroLevelSelect.addEventListener('change', () => {
            handleLevelChange(heroLevelSelect.value);
        });
    }
    
    // Race level buttons (for race pages)
    if (raceLevelButtons) {
        raceLevelButtons.addEventListener('click', (e) => {
            const btn = e.target.closest('.race-level-btn');
            if (btn) {
                // Clear ITRA override when manually selecting level
                clearItraOverride();
                handleLevelChange(btn.dataset.level);
            }
        });
    }
    
    // Main page level buttons
    if (mainLevelButtons) {
        mainLevelButtons.addEventListener('click', (e) => {
            const btn = e.target.closest('.race-level-btn');
            if (btn) {
                // Clear ITRA override when manually selecting level
                clearItraOverride();
                handleLevelChange(btn.dataset.level);
            }
        });
    }
}

// Advanced Options Card Toggle
function setupAdvancedOptions() {
    // Setup for race page
    const toggle = document.getElementById('advancedOptionsToggle');
    const card = toggle?.closest('.advanced-options-card');
    
    if (toggle && card) {
        toggle.addEventListener('click', () => {
            card.classList.toggle('expanded');
        });
    }
    
    // Setup for main page
    const mainToggle = document.getElementById('mainAdvancedOptionsToggle');
    const mainCard = mainToggle?.closest('.advanced-options-card');
    
    if (mainToggle && mainCard) {
        mainToggle.addEventListener('click', () => {
            mainCard.classList.toggle('expanded');
        });
    }
}

// ITRA Score Optional Input
function setupItraScore() {
    // Setup for race page elements
    setupItraForElements({
        input: document.getElementById('itraScoreInput'),
        levelButtons: document.getElementById('raceLevelButtons'),
        infoToggle: document.getElementById('itraInfoToggle'),
        infoBox: document.getElementById('itraInfoBox')
    });
    
    // Setup for main page elements
    setupItraForElements({
        input: document.getElementById('mainItraScoreInput'),
        levelButtons: document.getElementById('mainLevelButtons'),
        infoToggle: document.getElementById('mainItraInfoToggle'),
        infoBox: document.getElementById('mainItraInfoBox')
    });
}

function setupItraForElements(els) {
    const { input: itraInput, levelButtons, infoToggle: itraInfoToggle, infoBox: itraInfoBox } = els;
    
    // Toggle info box visibility
    if (itraInfoToggle && itraInfoBox) {
        itraInfoToggle.addEventListener('click', () => {
            itraInfoBox.classList.toggle('visible');
            itraInfoToggle.classList.toggle('active');
        });
    }
    
    if (!itraInput) return;
    
    const applyItraScore = () => {
        const score = parseInt(itraInput.value);
        if (itraInput.value === '' || itraInput.value === null) {
            // Clear ITRA if empty
            if (activeItraScore !== null) {
                clearItraOverride();
            }
            return;
        }
        
        if (isNaN(score) || score < 200 || score > 1000) {
            itraInput.classList.add('error');
            setTimeout(() => itraInput.classList.remove('error'), 500);
            return;
        }
        
        activeItraScore = score;
        itraInput.classList.add('has-value');
        
        // Clear Target Time when ITRA is entered (mutually exclusive)
        const raceTargetTime = document.getElementById('raceTargetTime');
        const heroTargetTime = document.getElementById('heroTargetTime');
        [raceTargetTime, heroTargetTime].forEach(inp => {
            if (inp && inp.value) {
                inp.value = '';
                inp.classList.remove('has-value');
            }
        });
        
        // Dim runner level buttons (and remove target-override if present)
        const raceLevelButtons = document.getElementById('raceLevelButtons');
        const mainLevelButtons = document.getElementById('mainLevelButtons');
        [raceLevelButtons, mainLevelButtons].forEach(btns => {
            if (btns) {
                btns.classList.add('itra-override');
                btns.classList.remove('target-override');
            }
        });
        
        // Sync other ITRA input
        const otherInput = itraInput.id === 'itraScoreInput' 
            ? document.getElementById('mainItraScoreInput')
            : document.getElementById('itraScoreInput');
        if (otherInput && otherInput.value !== itraInput.value) {
            otherInput.value = itraInput.value;
            otherInput.classList.add('has-value');
        }
        
        // Apply and recalculate (only auto-calc on race pages)
        if (gpxData && segments.length > 0) {
            applyRunnerLevelPaces();
            const heroCalculateBtn = document.getElementById('heroCalculateBtn');
            if (!heroCalculateBtn) {
                calculateRacePlan();
                fetchGpxWeather(); // Re-fetch weather after recalculating
            }
        }
    };
    
    // Auto-apply on blur
    itraInput.addEventListener('blur', applyItraScore);
    
    // Enter key to apply
    itraInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            itraInput.blur(); // Triggers blur handler
        }
    });
}

function clearItraOverride() {
    activeItraScore = null;
    cachedItraPaces = null; // Clear API cache
    
    // Clear race page elements
    const itraInput = document.getElementById('itraScoreInput');
    const raceLevelButtons = document.getElementById('raceLevelButtons');
    
    // Clear main page elements
    const mainItraInput = document.getElementById('mainItraScoreInput');
    const mainLevelButtons = document.getElementById('mainLevelButtons');
    
    // Reset inputs
    [itraInput, mainItraInput].forEach(inp => {
        if (inp) {
            inp.value = '';
            inp.classList.remove('has-value');
        }
    });
    
    // Re-enable level buttons
    [raceLevelButtons, mainLevelButtons].forEach(container => {
        if (container) container.classList.remove('itra-override');
    });
}

// Initialize 24h Time Picker
function initTimePicker24h(pickerId, displayId, hoursId, minutesId, hiddenInputId, dropdownId) {
    const picker = document.getElementById(pickerId);
    const display = document.getElementById(displayId);
    const hoursSelect = document.getElementById(hoursId);
    const minutesSelect = document.getElementById(minutesId);
    const hiddenInput = document.getElementById(hiddenInputId);
    const dropdown = document.getElementById(dropdownId);
    
    if (!picker || !display || !hoursSelect || !minutesSelect) return;
    
    // Populate hours (00-23)
    for (let h = 0; h < 24; h++) {
        const opt = document.createElement('option');
        opt.value = h.toString().padStart(2, '0');
        opt.textContent = h.toString().padStart(2, '0');
        hoursSelect.appendChild(opt);
    }
    
    // Populate minutes (00-59, step 5)
    for (let m = 0; m < 60; m += 5) {
        const opt = document.createElement('option');
        opt.value = m.toString().padStart(2, '0');
        opt.textContent = m.toString().padStart(2, '0');
        minutesSelect.appendChild(opt);
    }
    
    // Set initial value
    const initialTime = hiddenInput?.value || '06:00';
    const [initH, initM] = initialTime.split(':');
    hoursSelect.value = initH;
    // Round to nearest 5 minutes
    const roundedM = Math.round(parseInt(initM) / 5) * 5;
    minutesSelect.value = roundedM.toString().padStart(2, '0');
    
    // Toggle dropdown
    display.addEventListener('click', (e) => {
        e.stopPropagation();
        // Close other dropdowns first
        document.querySelectorAll('.time-picker-dropdown.show').forEach(d => {
            if (d !== dropdown) d.classList.remove('show');
        });
        dropdown.classList.toggle('show');
    });
    
    // Update on select change
    const updateTime = () => {
        const time = `${hoursSelect.value}:${minutesSelect.value}`;
        display.textContent = time;
        if (hiddenInput) hiddenInput.value = time;
        // Dispatch change event for compatibility
        hiddenInput?.dispatchEvent(new Event('change', { bubbles: true }));
    };
    
    hoursSelect.addEventListener('change', updateTime);
    minutesSelect.addEventListener('change', updateTime);
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!picker.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
    
    // Return update function for external use
    return {
        setValue: (time) => {
            const [h, m] = time.split(':');
            hoursSelect.value = h.padStart(2, '0');
            const roundedM = Math.round(parseInt(m) / 5) * 5;
            minutesSelect.value = roundedM.toString().padStart(2, '0');
            display.textContent = `${hoursSelect.value}:${minutesSelect.value}`;
            if (hiddenInput) hiddenInput.value = `${hoursSelect.value}:${minutesSelect.value}`;
        }
    };
}

// Store time picker instances
let heroTimePicker24h = null;
let mainTimePicker24h = null;

// Date Presets for Race Strategy Box
function setupDatePresets() {
    // Initialize 24h time pickers
    heroTimePicker24h = initTimePicker24h('heroTimePicker', 'heroTimeDisplay', 'heroTimeHours', 'heroTimeMinutes', 'heroRaceTime', 'heroTimeDropdown');
    mainTimePicker24h = initTimePicker24h('mainTimePicker', 'mainTimeDisplay', 'mainTimeHours', 'mainTimeMinutes', 'raceStartTime', 'mainTimeDropdown');
    
    const presetBtns = document.querySelectorAll('.race-date-preset');
    const dateInput = document.getElementById('heroRaceDate');
    const timeInput = document.getElementById('heroRaceTime');
    const calculateBtn = document.getElementById('heroCalculateBtn');
    
    if (!presetBtns.length || !dateInput) return;
    
    // Set today as default date
    const today = new Date();
    dateInput.value = formatDateForInput(today);
    dateInput.min = formatDateForInput(today);
    
    // Preset button handlers
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = btn.dataset.preset;
            setDateFromPreset(preset, dateInput, timeInput);
            
            // Update selected state
            presetBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });
    
    // Manual date/time change clears preset selection
    dateInput.addEventListener('change', () => {
        presetBtns.forEach(b => b.classList.remove('selected'));
        // Select "Custom" if manually changed
        const customBtn = document.querySelector('.race-date-preset[data-preset="custom"]');
        if (customBtn) customBtn.classList.add('selected');
    });
    
    timeInput.addEventListener('change', () => {
        presetBtns.forEach(b => b.classList.remove('selected'));
        const customBtn = document.querySelector('.race-date-preset[data-preset="custom"]');
        if (customBtn) customBtn.classList.add('selected');
    });
    
    // Calculate button handler
    if (calculateBtn) {
        calculateBtn.addEventListener('click', () => {
            // Sync hero date/time to the hidden paceSection inputs
            const mainDateInput = document.getElementById('raceStartDate');
            const mainTimeInput = document.getElementById('raceStartTime');
            if (mainDateInput) mainDateInput.value = dateInput.value;
            if (mainTimeInput) mainTimeInput.value = timeInput.value;
            
            // Handle target time from hero input
            const heroTargetTime = document.getElementById('heroTargetTime');
            if (heroTargetTime && heroTargetTime.value) {
                const targetValue = heroTargetTime.value;
                const match = targetValue.match(/^(\d{1,2}):(\d{2})$/);
                if (match) {
                    const hours = parseInt(match[1]);
                    const minutes = parseInt(match[2]);
                    
                    // Sync to target time mode inputs
                    const targetHoursInput = document.getElementById('targetHours');
                    const targetMinutesInput = document.getElementById('targetMinutes');
                    if (targetHoursInput) targetHoursInput.value = hours;
                    if (targetMinutesInput) targetMinutesInput.value = minutes;
                    
                    // IMPORTANT: Set the actual mode to 'target'
                    currentMode = 'target';
                    
                    // Activate target time mode UI
                    const targetBtn = document.getElementById('targetModeBtn');
                    const manualBtn = document.getElementById('manualModeBtn');
                    const targetMode = document.getElementById('targetMode');
                    const manualMode = document.getElementById('manualMode');
                    if (targetBtn) targetBtn.classList.add('active');
                    if (manualBtn) manualBtn.classList.remove('active');
                    if (targetMode) targetMode.style.display = 'block';
                    if (manualMode) manualMode.style.display = 'none';
                    
                    console.log('Target time mode activated:', hours, ':', minutes);
                }
            } else {
                // No target time - use runner level / manual mode
                currentMode = 'manual';
                
                // Switch UI back to manual mode
                const targetBtn = document.getElementById('targetModeBtn');
                const manualBtn = document.getElementById('manualModeBtn');
                const targetMode = document.getElementById('targetMode');
                const manualMode = document.getElementById('manualMode');
                if (targetBtn) targetBtn.classList.remove('active');
                if (manualBtn) manualBtn.classList.add('active');
                if (targetMode) targetMode.style.display = 'none';
                if (manualMode) manualMode.style.display = 'block';
                
                console.log('Manual mode (runner level) activated');
            }
            
            // Trigger calculation
            if (gpxData && segments.length > 0) {
                // Show loading state
                const strategyBox = document.getElementById('heroRunnerLevel');
                calculateBtn.disabled = true;
                calculateBtn.innerHTML = '⏳ <span data-i18n="race.calculating">Creating...</span>';
                calculateBtn.classList.add('loading');
                if (strategyBox) strategyBox.classList.add('loading');
                
                // Use setTimeout to allow UI to update before heavy calculation
                setTimeout(async () => {
                    // Show all sections that were hidden until Calculate
                    showAllSections();
                    
                    try {
                        // Wait for calculation to complete before fetching weather
                        await calculateRacePlan();
                        
                        // Fetch weather for GPX upload (if date is within 16 days)
                        await fetchGpxWeather();
                    } catch (error) {
                        console.log('Calculation or weather fetch failed:', error);
                    }
                    
                    // Recalculate sun times with synced date, then update hero display
                    updateSunTimesDisplay();
                    updateHeroSunTimes();
                    
                    // Hide strategy box and show edit button
                    if (strategyBox) {
                        strategyBox.style.display = 'none';
                        strategyBox.classList.remove('loading');
                    }
                    const editBtn = document.getElementById('editStrategyBtn');
                    if (editBtn) editBtn.style.display = 'inline-flex';
                    
                    // Reset button state
                    calculateBtn.disabled = false;
                    calculateBtn.innerHTML = '🚀 <span data-i18n="race.calculate">Create Strategy</span>';
                    calculateBtn.classList.remove('loading');
                    
                    // Hide the paceSection (redundant now)
                    const paceSection = document.getElementById('paceSection');
                    if (paceSection) paceSection.style.display = 'none';
                    
                    // Scroll to results (statsSection shows finish time at top)
                    setTimeout(() => {
                        const statsSection = document.getElementById('statsSection');
                        if (statsSection) {
                            statsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }, 300);
                }, 50);
            }
        });
    }
    
    // Edit Strategy button handler
    const editStrategyBtn = document.getElementById('editStrategyBtn');
    if (editStrategyBtn) {
        editStrategyBtn.addEventListener('click', () => {
            // Check if we're on a race page by URL (not by element existence)
            const isRacePage = typeof detectRaceMode === 'function' && detectRaceMode();
            if (isRacePage) {
                // Race page: show race strategy box
                const raceStep2 = document.getElementById('raceStep2');
                if (raceStep2) {
                    raceStep2.style.display = 'block';
                    editStrategyBtn.style.display = 'none';
                    raceStep2.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            } else {
                // Main page: show hero strategy box
                const strategyBox = document.getElementById('heroRunnerLevel');
                if (strategyBox) {
                    strategyBox.style.display = 'block';
                    editStrategyBtn.style.display = 'none';
                    strategyBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });
    }
}

function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function setDateFromPreset(preset, dateInput, timeInput) {
    const now = new Date();
    let targetDate = new Date(now);
    let targetTime = '06:00';
    
    switch (preset) {
        case '2h':
            // 2 hours from now
            targetDate.setHours(targetDate.getHours() + 2);
            targetTime = `${String(targetDate.getHours()).padStart(2, '0')}:${String(targetDate.getMinutes()).padStart(2, '0')}`;
            break;
        case 'tomorrow':
            // Tomorrow morning
            targetDate.setDate(targetDate.getDate() + 1);
            targetTime = '06:00';
            break;
        case 'weekend':
            // Next Saturday or Sunday (whichever is closer)
            const dayOfWeek = targetDate.getDay();
            if (dayOfWeek === 0) {
                // It's Sunday, use today
                targetTime = '07:00';
            } else if (dayOfWeek === 6) {
                // It's Saturday, use today
                targetTime = '07:00';
            } else {
                // Find next Saturday
                const daysUntilSaturday = 6 - dayOfWeek;
                targetDate.setDate(targetDate.getDate() + daysUntilSaturday);
                targetTime = '07:00';
            }
            break;
        case 'custom':
            // Keep current values, just ensure date picker is focused
            dateInput.focus();
            return;
    }
    
    dateInput.value = formatDateForInput(targetDate);
    timeInput.value = targetTime;
    
    // Update 24h time picker display if available
    if (heroTimePicker24h && timeInput.id === 'heroRaceTime') {
        heroTimePicker24h.setValue(targetTime);
    }
}

// Fetch weather for custom GPX uploads
async function fetchGpxWeather() {
    console.log('=== fetchGpxWeather CALLED ===');
    if (!gpxData || !gpxData.points || gpxData.points.length === 0) {
        console.log('fetchGpxWeather: No GPX data');
        return;
    }
    
    const dateInput = document.getElementById('heroRaceDate') || document.getElementById('raceStartDate');
    if (!dateInput || !dateInput.value) {
        console.log('fetchGpxWeather: No date input', dateInput?.id);
        return;
    }
    
    console.log('fetchGpxWeather: Date is', dateInput.value);
    
    // Get coordinates from first GPX point
    const firstPoint = gpxData.points[0];
    const lat = firstPoint.lat;
    const lon = firstPoint.lon;
    
    const raceDate = new Date(dateInput.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    const daysUntilRace = Math.ceil((raceDate - today) / (1000 * 60 * 60 * 24));
    
    // Only fetch if within 16 days (Open-Meteo limit)
    if (daysUntilRace < 0 || daysUntilRace > 16) {
        console.log('Weather forecast not available for this date range, days until race:', daysUntilRace);
        showWeatherUnavailable(daysUntilRace);
        return;
    }
    
    try {
        // Check client-side cache first
        let data = getClientWeatherCache(lat, lon, dateInput.value);
        
        if (!data) {
            // Fetch from our cached weather API
            const url = `${API_CONFIG.weatherEndpoint}?lat=${lat}&lon=${lon}&date=${dateInput.value}`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('Weather API error');
            
            const result = await response.json();
            data = result.data; // Our API wraps the Open-Meteo response
            
            // Cache on client side
            setClientWeatherCache(lat, lon, dateInput.value, data);
            
            if (result.cached) {
                console.log('Weather data served from server cache');
            }
        }
        
        // Find race day in forecast - dateInput.value is already YYYY-MM-DD format from input type="date"
        const raceDateStr = dateInput.value;
        let dayIndex = data.daily.time.indexOf(raceDateStr);
        
        if (dayIndex === -1) {
            console.log('Weather: Race date not found in forecast');
            showWeatherUnavailable(daysUntilRace);
            return;
        }
        
        const tempMax = Math.round(data.daily.temperature_2m_max[dayIndex]);
        const tempMin = Math.round(data.daily.temperature_2m_min[dayIndex]);
        const rainChance = data.daily.precipitation_probability_max[dayIndex];
        const weatherCode = data.daily.weathercode[dayIndex];
        const windSpeed = Math.round(data.daily.windspeed_10m_max[dayIndex]);
        
        // Store weather data for pace adjustment
        raceWeatherData = {
            tempMax,
            tempMin,
            tempAvg: Math.round((tempMax + tempMin) / 2),
            rainChance,
            weatherCode,
            windSpeed,
            isHot: tempMax >= 25,
            isRainy: rainChance > 50,
            adjustment: calculateWeatherAdjustment(tempMax, tempMin, rainChance, windSpeed, weatherCode)
        };
        
        // Show weather widget in results area
        showGpxWeatherWidget(raceWeatherData, weatherCode, dateInput.value);
        
        console.log('GPX Weather fetched:', raceWeatherData);
        
    } catch (error) {
        console.error('Error fetching GPX weather:', error);
    }
}

function showGpxWeatherWidget(weather, weatherCode, dateStr) {
    const weatherIcon = getWeatherIcon(weatherCode);
    const weatherDesc = getWeatherDescription(weatherCode);
    
    // Calculate adjustment info
    const adjustment = getWeatherAdjustedTime(100); // Get percentage
    
    // Update hero weather widget (main page)
    const heroWidget = document.getElementById('heroWeatherWidget');
    
    console.log('showGpxWeatherWidget: heroWidget exists?', !!heroWidget);
    
    if (heroWidget) {
        console.log('Calling updateHeroWeatherWidget with:', weather, weatherCode);
        updateHeroWeatherWidget(weather, weatherCode, adjustment);
        return; // Hero widget is enough on main page
    }
    
    // Fallback: create/update dynamic widget for other pages
    let widget = document.getElementById('gpxWeatherWidget');
    
    if (!widget) {
        widget = document.createElement('div');
        widget.id = 'gpxWeatherWidget';
        widget.className = 'race-weather-widget gpx-weather';
        
        const heroStats = document.querySelector('.hero-stats');
        if (heroStats) {
            heroStats.after(widget);
        }
    }
    
    const raceDate = new Date(dateStr);
    const formattedDate = raceDate.toLocaleDateString(currentLang === 'de' ? 'de-DE' : 'en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
    });
    
    let adjustmentText = '';
    if (adjustment && adjustment.penalty > 0) {
        adjustmentText = `<div class="weather-adjustment">⚠️ ${adjustment.description}</div>`;
    }
    
    widget.innerHTML = `
        <h3>🌤️ ${typeof t === 'function' ? t('weather.forecast') : 'Weather Forecast'}</h3>
        <div class="weather-content">
            <div class="weather-forecast">
                <div class="weather-date">${formattedDate}</div>
                <div class="weather-main">
                    <span class="weather-icon">${weatherIcon}</span>
                    <span class="weather-temp">${weather.tempMin}° - ${weather.tempMax}°C</span>
                </div>
                <div class="weather-details">
                    <span class="weather-desc">${weatherDesc}</span>
                    <span class="weather-rain">💧 ${weather.rainChance}%</span>
                    <span class="weather-wind">💨 ${weather.windSpeed} km/h</span>
                </div>
                ${adjustmentText}
            </div>
        </div>
    `;
    
    widget.style.display = 'block';
}

// Show weather unavailable message
function showWeatherUnavailable(daysUntilRace) {
    const heroWidget = document.getElementById('heroWeatherWidget');
    if (!heroWidget) {
        console.log('heroWeatherWidget not found');
        return;
    }
    
    const lang = typeof getLang === 'function' ? getLang() : 'en';
    const iconEl = document.getElementById('heroWeatherIcon');
    const tempEl = document.getElementById('heroWeatherTemp');
    const descEl = document.getElementById('heroWeatherDesc');
    const detailsEl = heroWidget.querySelector('.hero-weather-details');
    const tipContainer = document.getElementById('heroWeatherTip');
    const adjContainer = document.getElementById('heroWeatherAdjustment');
    const titleEl = heroWidget.querySelector('.hero-weather-title');
    
    if (iconEl) iconEl.textContent = '📅';
    if (tempEl) tempEl.textContent = '';
    
    let message;
    if (daysUntilRace < 0) {
        message = lang === 'de' ? 'Datum in der Vergangenheit' : 'Date is in the past';
    } else {
        message = lang === 'de' ? `Vorhersage verfügbar in ${daysUntilRace - 16} Tagen` : `Forecast available in ${daysUntilRace - 16} days`;
    }
    
    if (descEl) descEl.textContent = message;
    if (titleEl) titleEl.textContent = lang === 'de' ? 'Wettervorhersage' : 'Weather Forecast';
    
    if (detailsEl) detailsEl.style.display = 'none';
    if (tipContainer) tipContainer.style.display = 'none';
    if (adjContainer) adjContainer.style.display = 'none';
    
    heroWidget.style.display = 'flex';
    console.log('Weather unavailable shown, days:', daysUntilRace);
}

// Update hero weather widget (in results section)
function updateHeroWeatherWidget(weather, weatherCode, adjustment) {
    console.log('=== updateHeroWeatherWidget CALLED ===', weather);
    const heroWidget = document.getElementById('heroWeatherWidget');
    if (!heroWidget) {
        console.log('heroWeatherWidget element NOT found');
        return;
    }
    console.log('heroWeatherWidget element found');
    
    heroWidget.style.display = 'flex';
    
    const weatherIcon = getWeatherIcon(weatherCode);
    const weatherDesc = getWeatherDescription(weatherCode);
    
    // Update elements
    const iconEl = document.getElementById('heroWeatherIcon');
    const tempEl = document.getElementById('heroWeatherTemp');
    const descEl = document.getElementById('heroWeatherDesc');
    const rainEl = document.getElementById('heroWeatherRain');
    const windEl = document.getElementById('heroWeatherWind');
    const detailsEl = heroWidget.querySelector('.hero-weather-details');
    const adjContainer = document.getElementById('heroWeatherAdjustment');
    const adjTextEl = document.getElementById('heroWeatherAdjText');
    const tipContainer = document.getElementById('heroWeatherTip');
    const tipIconEl = document.getElementById('heroWeatherTipIcon');
    const tipTextEl = document.getElementById('heroWeatherTipText');
    
    if (iconEl) iconEl.textContent = weatherIcon;
    if (tempEl) tempEl.textContent = `${weather.tempMin}° - ${weather.tempMax}°C`;
    if (descEl) descEl.textContent = weatherDesc;
    if (rainEl) rainEl.textContent = weather.rainChance;
    if (windEl) windEl.textContent = weather.windSpeed;
    if (detailsEl) detailsEl.style.display = 'flex'; // Re-show if was hidden
    
    // Show weather tip based on conditions
    if (tipContainer && tipIconEl && tipTextEl) {
        const tip = getWeatherTip(weather, weatherCode);
        if (tip) {
            tipIconEl.textContent = tip.icon;
            tipTextEl.textContent = tip.text;
            tipContainer.style.display = 'flex';
        } else {
            tipContainer.style.display = 'none';
        }
    }
    
    // Show adjustment if applicable
    if (adjContainer && adjTextEl && adjustment && adjustment.addedMinutes > 0) {
        adjTextEl.textContent = `+${adjustment.addedMinutes} min`;
        adjContainer.style.display = 'flex';
    } else if (adjContainer) {
        adjContainer.style.display = 'none';
    }
    
}

// Get weather tip based on conditions
function getWeatherTip(weather, weatherCode) {
    const lang = typeof getLang === 'function' ? getLang() : 'en';
    const code = Number(weatherCode);
    
    console.log('getWeatherTip called with:', { 
        rainChance: weather.rainChance, 
        tempMax: weather.tempMax, 
        tempMin: weather.tempMin,
        windSpeed: weather.windSpeed,
        code 
    });
    
    // Check for rain/drizzle (codes 51-67, 80-82: rain/drizzle, 95-99: thunderstorm)
    const isRainy = (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95;
    // Check for snow (codes 71-77, 85-86: snow)
    const isSnowy = (code >= 71 && code <= 77) || (code >= 85 && code <= 86);
    
    console.log('Weather checks:', { isRainy, isSnowy, rainCheck: weather.rainChance >= 40 });
    
    // Rain tip: only if significant rain chance (≥40%) or heavy rain with ≥30% chance
    if (weather.rainChance >= 40 || (isRainy && weather.rainChance >= 30)) {
        return {
            icon: '🧥',
            text: lang === 'de' ? 'Regenjacke nicht vergessen!' : "Don't forget your rain jacket!"
        };
    }
    
    if (isSnowy) {
        return {
            icon: '🧤',
            text: lang === 'de' ? 'Handschuhe einpacken – es wird kalt!' : 'Pack gloves – it\'ll be cold!'
        };
    }
    
    // Hot weather (above 25°C)
    if (weather.tempMax >= 25) {
        return {
            icon: '💧',
            text: lang === 'de' ? 'Trinke extra viel Wasser!' : 'Drink extra water!'
        };
    }
    
    // Cold weather (below 5°C)
    if (weather.tempMin <= 5) {
        return {
            icon: '🧥',
            text: lang === 'de' ? 'Extra Schicht einpacken!' : 'Pack an extra layer!'
        };
    }
    
    // Windy conditions (above 30 km/h)
    if (weather.windSpeed >= 30) {
        return {
            icon: '💨',
            text: lang === 'de' ? 'Windjacke mitnehmen!' : 'Bring a wind jacket!'
        };
    }
    
    // Perfect conditions
    if (weather.tempMax >= 10 && weather.tempMax <= 20 && weather.rainChance < 20) {
        return {
            icon: '✨',
            text: lang === 'de' ? 'Perfektes Laufwetter!' : 'Perfect running weather!'
        };
    }
    
    return null;
}

// Pace Info Tooltip
function setupPaceInfoTooltip() {
    const infoIcon = document.getElementById('paceInfoIcon');
    const tooltip = document.getElementById('paceInfoTooltip');
    
    if (!infoIcon || !tooltip) return;
    
    infoIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        updatePaceInfoContent();
        tooltip.classList.toggle('visible');
    });
    
    // Close on click outside
    document.addEventListener('click', (e) => {
        if (!tooltip.contains(e.target) && e.target !== infoIcon) {
            tooltip.classList.remove('visible');
        }
    });
}

function updatePaceInfoContent() {
    const content = document.getElementById('paceInfoContent');
    if (!content) return;
    
    // Format pace as MM:SS
    const formatPace = (pace) => {
        const mins = Math.floor(pace);
        const secs = Math.round((pace - mins) * 60);
        return `${mins}:${secs.toString().padStart(2, '0')}/km`;
    };
    
    // Determine the calculation basis and paces based on mode
    let basisLabel = '';
    let basisValue = '';
    let flatPace, uphillPace, downhillPace;
    
    // Translation helpers
    const labelRunnerLevel = typeof t === 'function' ? t('paceInfo.runnerLevel') : 'Runner Level';
    const labelFlatPace = typeof t === 'function' ? t('paceInfo.flatPace') : 'Flat Pace';
    const labelUphillPace = typeof t === 'function' ? t('paceInfo.uphillPace') : 'Uphill Pace';
    const labelDownhillPace = typeof t === 'function' ? t('paceInfo.downhillPace') : 'Downhill Pace';
    const labelFatigueFactor = typeof t === 'function' ? t('paceInfo.fatigueFactor') : 'Fatigue Factor';
    const labelSurfaceFactors = typeof t === 'function' ? t('paceInfo.surfaceFactors') : 'Surface Factors';
    const labelEnabled = typeof t === 'function' ? t('paceInfo.enabled') : 'Enabled';
    const labelItraScore = typeof t === 'function' ? t('paceInfo.itraScore') : 'ITRA Score';
    const labelTargetTime = typeof t === 'function' ? t('paceInfo.targetTime') : 'Target Time';
    
    // Check ITRA first (activeItraScore indicates ITRA is being used)
    if (activeItraScore) {
        // ITRA mode - show score and calculated paces
        basisLabel = labelItraScore;
        basisValue = activeItraScore.toString();
        
        // Use calculated paces if available
        if (lastCalculatedPaces) {
            flatPace = lastCalculatedPaces.flat;
            uphillPace = lastCalculatedPaces.uphill;
            downhillPace = lastCalculatedPaces.downhill;
        } else {
            // Fallback to intermediate
            const preset = RUNNER_LEVELS.intermediate;
            flatPace = preset.flatPace;
            uphillPace = flatPace * preset.uphillRatio;
            downhillPace = flatPace * preset.downhillRatio;
        }
    } else {
        // Check for target time (either by mode or by having a value in the input)
        const heroTargetTime = document.getElementById('heroTargetTime');
        const raceTargetTime = document.getElementById('raceTargetTime');
        const targetValue = heroTargetTime?.value || raceTargetTime?.value || '';
        
        if (currentMode === 'target' || targetValue) {
            // Target time mode - show target time and calculated paces
            basisLabel = labelTargetTime;
            basisValue = targetValue || '-';
            
            // Use calculated paces if available
            if (lastCalculatedPaces) {
                flatPace = lastCalculatedPaces.flat;
                uphillPace = lastCalculatedPaces.uphill;
                downhillPace = lastCalculatedPaces.downhill;
            } else {
                // Fallback to intermediate
                const preset = RUNNER_LEVELS.intermediate;
                flatPace = preset.flatPace;
                uphillPace = flatPace * preset.uphillRatio;
                downhillPace = flatPace * preset.downhillRatio;
            }
        } else {
            // Manual/Runner level mode - show level and preset paces
            const levelSelect = document.getElementById('runnerLevel');
            const level = levelSelect ? levelSelect.value : 'intermediate';
            const preset = RUNNER_LEVELS[level] || RUNNER_LEVELS.intermediate;
            
            basisLabel = labelRunnerLevel;
            basisValue = typeof t === 'function' ? t('hero.' + level) : preset.name;
            
            // Use calculated paces if available (they may differ due to fatigue)
            if (lastCalculatedPaces) {
                flatPace = lastCalculatedPaces.flat;
                uphillPace = lastCalculatedPaces.uphill;
                downhillPace = lastCalculatedPaces.downhill;
            } else {
                flatPace = preset.flatPace;
                uphillPace = flatPace * preset.uphillRatio;
                downhillPace = flatPace * preset.downhillRatio;
            }
        }
    }
    
    // Get fatigue multiplier from API cache
    let fatigueInfo = '';
    if (gpxData && gpxData.totalDistance) {
        const fatigue = lastCachedFatigue || 1.0;
        if (fatigue > 1.0) {
            const pct = Math.round((fatigue - 1) * 100);
            fatigueInfo = `
                <div class="pace-info-row">
                    <span class="pace-info-label">${labelFatigueFactor}</span>
                    <span class="pace-info-value highlight">+${pct}%</span>
                </div>
            `;
        }
    }
    
    // Check if surface is enabled
    const surfaceToggle = document.getElementById('surfaceEnabled');
    let surfaceInfo = '';
    if (surfaceToggle && surfaceToggle.checked) {
        surfaceInfo = `
            <div class="pace-info-row">
                <span class="pace-info-label">${labelSurfaceFactors}</span>
                <span class="pace-info-value">${labelEnabled}</span>
            </div>
        `;
    }
    
    content.innerHTML = `
        <div class="pace-info-row">
            <span class="pace-info-label">${basisLabel}</span>
            <span class="pace-info-value highlight">${basisValue}</span>
        </div>
        <div class="pace-info-row">
            <span class="pace-info-label">${labelFlatPace}</span>
            <span class="pace-info-value">${formatPace(flatPace)}</span>
        </div>
        <div class="pace-info-row">
            <span class="pace-info-label">${labelUphillPace}</span>
            <span class="pace-info-value">${formatPace(uphillPace)}</span>
        </div>
        <div class="pace-info-row">
            <span class="pace-info-label">${labelDownhillPace}</span>
            <span class="pace-info-value">${formatPace(downhillPace)}</span>
        </div>
        ${fatigueInfo}
        ${surfaceInfo}
    `;
}

// Cookie Consent
function setupCookieConsent() {
    const banner = document.getElementById('cookieBanner');
    const acceptBtn = document.getElementById('cookieAccept');
    const declineBtn = document.getElementById('cookieDecline');
    
    if (!banner) return;
    
    // Show banner if no preference saved
    const consent = localStorage.getItem('gpxray-cookies');
    if (!consent) {
        setTimeout(() => banner.classList.add('visible'), 1000);
    }
    
    acceptBtn?.addEventListener('click', () => {
        localStorage.setItem('gpxray-cookies', 'accepted');
        banner.classList.remove('visible');
        loadGA(); // Load GA after consent
        trackEvent('cookie_consent', { action: 'accepted' });
    });
    
    declineBtn?.addEventListener('click', () => {
        localStorage.setItem('gpxray-cookies', 'declined');
        banner.classList.remove('visible');
    });
}

// Early Access Gate - validation happens server-side for security
// Hash a string using SHA-256 (fallback only)
async function hashCode(code) {
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Validate access code via API (server-side validation)
async function validateAccessCode(code) {
    // Use API for validation if enabled
    if (API_CONFIG.useBackend) {
        try {
            const response = await fetch(API_CONFIG.calculateEndpoint.replace('/calculate', '/validate-code'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code.trim().toUpperCase() })
            });
            
            if (response.status === 429) {
                // Rate limited
                showNotification('Too many attempts. Please try again later.', 'error');
                return false;
            }
            
            if (response.ok) {
                const result = await response.json();
                return result.valid === true;
            }
        } catch (error) {
            console.warn('API validation failed:', error.message);
        }
    }
    
    // No fallback - validation requires API
    return false;
}

function setupEarlyAccess() {
    const overlay = document.getElementById('earlyAccessOverlay');
    const modal = document.getElementById('earlyAccessModal');
    const form = document.getElementById('earlyAccessForm');
    const input = document.getElementById('earlyAccessCode');
    const errorMsg = document.getElementById('earlyAccessError');
    const closeBtn = document.getElementById('earlyAccessClose');
    
    if (!modal) return;
    
    // Check if already unlocked
    if (isEarlyAccessUnlocked()) {
        return;
    }
    
    // Close modal handlers
    closeBtn?.addEventListener('click', hideEarlyAccessModal);
    overlay?.addEventListener('click', hideEarlyAccessModal);
    
    // Form submission
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = input.value.trim().toUpperCase();
        
        const isValid = await validateAccessCode(code);
        if (isValid) {
            // Valid code!
            localStorage.setItem('gpxray-early-access', 'unlocked');
            localStorage.setItem('gpxray-access-code', code);
            hideEarlyAccessModal();
            updateEarlyAccessUI();
            
            // Track with code in multiple ways for visibility
            trackEvent('early_access', { action: 'unlocked', code: code });
            trackEvent('unlock_' + code.toLowerCase(), {}); // Separate event per code
            if (typeof setUserProperty === 'function') {
                setUserProperty('access_code', code);
            }
            
            // Show success feedback
            showNotification('🎉 Access granted! You can now upload GPX files.', 'success');
            
            // Reset to clean state so user can upload their own GPX
            resetStrategyState();
            gpxData = null;
            segments = [];
            surfaceData = [];
            preStoredSurfaceData = null;
            isDemoMode = false;
            
            // Hide all result sections
            const sectionsToHide = ['statsSection', 'mapSection', 'elevationSection', 'splitsSection', 'heroResults', 'raceLanding'];
            sectionsToHide.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = 'none';
            });
            
            // Show upload section
            const uploadSection = document.getElementById('uploadSection');
            if (uploadSection) {
                uploadSection.style.display = 'block';
                uploadSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } else {
            // Invalid code
            errorMsg.classList.add('visible');
            input.classList.add('shake');
            setTimeout(() => input.classList.remove('shake'), 500);
            trackEvent('early_access', { action: 'invalid_code' });
        }
    });
    
    // Clear error on input
    input?.addEventListener('input', () => {
        errorMsg.classList.remove('visible');
    });
    
    // Waitlist form submission
    const waitlistForm = document.getElementById('waitlistForm');
    const waitlistEmail = document.getElementById('waitlistEmail');
    const waitlistSuccess = document.getElementById('waitlistSuccess');
    
    waitlistForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = waitlistEmail.value.trim();
        
        if (!email) return;
        
        // Disable form while submitting
        const submitBtn = waitlistForm.querySelector('.waitlist-submit');
        submitBtn.disabled = true;
        submitBtn.textContent = t('btn.joining');
        
        try {
            // Submit to Formspree (waitlist form)
            const response = await fetch('https://formspree.io/f/xnjovnpe', {
                method: 'POST',
                body: JSON.stringify({
                    email: email,
                    type: 'waitlist',
                    source: 'early_access_modal',
                    timestamp: new Date().toISOString()
                }),
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                // Show success message
                waitlistForm.style.display = 'none';
                waitlistSuccess.classList.add('visible');
                trackEvent('waitlist_signup', { source: 'early_access_modal' });
            } else {
                throw new Error('Submission failed');
            }
        } catch (error) {
            console.error('Waitlist submission error:', error);
            submitBtn.disabled = false;
            submitBtn.textContent = t('btn.joinWaitlist');
            showNotification('Something went wrong. Please try again.', 'error');
        }
    });
}

function isEarlyAccessUnlocked() {
    return localStorage.getItem('gpxray-early-access') === 'unlocked';
}

// Update UI elements that depend on early access status
function updateEarlyAccessUI() {
    const browseRacesBtn = document.getElementById('browseRacesBtn');
    const demoBtn = document.getElementById('loadDemoBtn');
    const demoHint = document.getElementById('demoHint');
    
    if (isEarlyAccessUnlocked()) {
        // Early access users: Show browse races, hide demo simulation
        if (browseRacesBtn) browseRacesBtn.style.display = '';
        if (demoBtn) demoBtn.style.display = 'none';
        // Update hint text
        if (demoHint) {
            demoHint.textContent = typeof t === 'function' ? t('upload.demoHintFull') : 'Browse our curated race database';
        }
    } else {
        // Public users: Show demo simulation, hide browse races
        if (browseRacesBtn) browseRacesBtn.style.display = 'none';
        if (demoBtn) demoBtn.style.display = '';
    }
}

function showEarlyAccessModal() {
    const overlay = document.getElementById('earlyAccessOverlay');
    const modal = document.getElementById('earlyAccessModal');
    const input = document.getElementById('earlyAccessCode');
    
    overlay?.classList.add('visible');
    modal?.classList.add('visible');
    input?.focus();
    
    trackEvent('early_access', { action: 'modal_shown' });
}

function hideEarlyAccessModal() {
    const overlay = document.getElementById('earlyAccessOverlay');
    const modal = document.getElementById('earlyAccessModal');
    
    overlay?.classList.remove('visible');
    modal?.classList.remove('visible');
}

function checkEarlyAccess() {
    if (isEarlyAccessUnlocked()) {
        return true;
    }
    showEarlyAccessModal();
    return false;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => notification.classList.add('visible'), 10);
    
    // Remove after delay
    setTimeout(() => {
        notification.classList.remove('visible');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Footer links
function setupFooter() {
    document.getElementById('aboutLink')?.addEventListener('click', (e) => {
        e.preventDefault();
        alert('GPXray - Know your race before it starts.\n\nGPXray helps trail runners plan their race strategy by analyzing GPX files and calculating realistic split times based on terrain, elevation, and personal pace.\n\nBuilt with ❤️ for the trail running community.');
    });
    
    document.getElementById('privacyLink')?.addEventListener('click', (e) => {
        e.preventDefault();
        alert('Privacy Policy\n\n✅ 100% Local Processing\nYour GPX files are processed entirely in your browser. No data is uploaded to any server.\n\n✅ Analytics (with consent)\nIf you accept cookies, we use Google Analytics to understand which features are most useful.\n\n✅ No Account Required\nUse GPXray without creating an account or providing any personal information.');
    });
    
    document.getElementById('impressumLink')?.addEventListener('click', (e) => {
        e.preventDefault();
        alert('Impressum\n\nGPXray\ngpxray.run\n\nDaniel Weppeler\n📷 @daniel.runs.trails\n\nBuilt by trail runners, for trail runners.');
    });
}

// DDL Explainer Modal
function setupDDLExplainer() {
    const learnMoreLink = document.getElementById('ddlLearnMore');
    const explainer = document.getElementById('ddlExplainer');
    const closeBtn = document.getElementById('ddlExplainerClose');
    
    if (!learnMoreLink || !explainer) return;
    
    learnMoreLink.addEventListener('click', (e) => {
        e.preventDefault();
        explainer.classList.add('active');
    });
    
    closeBtn?.addEventListener('click', () => {
        explainer.classList.remove('active');
    });
    
    // Close on overlay click
    explainer.addEventListener('click', (e) => {
        if (e.target === explainer) {
            explainer.classList.remove('active');
        }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && explainer.classList.contains('active')) {
            explainer.classList.remove('active');
        }
    });
}

// Sun times setup
function setupSunTimes() {
    const dateInput = document.getElementById('raceStartDate');
    const timeInput = document.getElementById('raceStartTime');
    
    if (dateInput) {
        // Set default to today's date
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        dateInput.value = dateStr;
        
        // Update sun times when date changes
        dateInput.addEventListener('change', () => {
            updateSunTimesDisplay();
            // Refresh elevation chart with night overlay
            if (gpxData && segments.length > 0) {
                displayElevationChart();
                // Update night widget
                updateHeroNightWidget();
            }
        });
    }
    
    // Update splits table and elevation chart when time changes (for night section highlighting)
    if (timeInput) {
        timeInput.addEventListener('change', () => {
            if (segments.length > 0) {
                generateSplitsTable();
                // Refresh elevation chart with night overlay
                displayElevationChart();
                // Update night widget
                updateHeroNightWidget();
            }
        });
    }
}

// Change Route Button - show upload section again (or race selection on race pages)
function setupChangeRouteButton() {
    const changeBtn = document.getElementById('changeRouteBtn');
    if (!changeBtn) return;
    
    changeBtn.addEventListener('click', () => {
        // Check if we're on a race page URL (not main page with Race Browser selection)
        const isRacePageUrl = typeof detectRaceMode === 'function' && detectRaceMode();
        
        // Check if we're on a race page (multi-distance with step selection)
        const raceStep1 = document.getElementById('raceStep1');
        const raceStep2 = document.getElementById('raceStep2');
        
        if (isRacePageUrl && raceStep1) {
            // Multi-distance race page: scroll to distance selection, hide step 2
            if (raceStep2) raceStep2.style.display = 'none';
            
            // Deselect current distance
            document.querySelectorAll('.race-distance-btn').forEach(btn => btn.classList.remove('selected'));
            
            // Clear stored GPX content
            if (currentDistanceConfig) {
                currentDistanceConfig._gpxContent = null;
            }
            
            // Hide results
            const heroResults = document.getElementById('heroResults');
            if (heroResults) heroResults.style.display = 'none';
            
            // Scroll to race selection
            raceStep1.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        
        // Check if we're on a single-distance race page
        if (isRacePageUrl) {
            // Single-distance race page: scroll to strategy box to edit settings
            const strategyBox = document.getElementById('heroRunnerLevel');
            const editBtn = document.getElementById('editStrategyBtn');
            
            // Show strategy box, hide edit button
            if (strategyBox) {
                strategyBox.style.display = 'block';
                strategyBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            if (editBtn) editBtn.style.display = 'none';
            return;
        }
        
        // Main page: Confirm and start fresh
        const confirmMsg = typeof t === 'function' ? t('route.confirmStartOver') : 'Start over? This will clear your current race plan.';
        if (!confirm(confirmMsg)) return;
        
        // Reset strategy state (clears AID stations, weather, ITRA, etc.)
        resetStrategyState();
        
        // Clear GPX data completely
        gpxData = null;
        segments = [];
        surfaceData = [];
        preStoredSurfaceData = null;
        
        // Remove race-mode class to allow upload section to show
        document.documentElement.classList.remove('race-mode');
        
        // Hide race landing section (from Race Browser selection)
        const raceLanding = document.getElementById('raceLanding');
        if (raceLanding) raceLanding.style.display = 'none';
        
        // Hide ALL result sections
        const sectionsToHide = ['statsSection', 'mapSection', 'elevationSection', 'splitsSection', 'heroResults'];
        sectionsToHide.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        
        // Hide the Start Over button itself until new route is loaded
        const changeBtn = document.getElementById('changeRouteBtn');
        if (changeBtn) changeBtn.style.display = 'none';
        
        // Reset file input
        const fileInput = document.getElementById('gpxFile');
        if (fileInput) fileInput.value = '';
        
        // Show upload section
        const uploadSection = document.getElementById('uploadSection');
        if (uploadSection) {
            uploadSection.style.display = 'block';
            uploadSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
}

// Reset all strategy-related state for a new route
function resetStrategyState() {
    // Reset mode to manual
    currentMode = 'manual';
    
    // Clear ITRA state
    activeItraScore = null;
    cachedItraPaces = null;
    
    // Clear target time input
    const heroTargetTime = document.getElementById('heroTargetTime');
    if (heroTargetTime) {
        heroTargetTime.value = '';
        heroTargetTime.classList.remove('has-value');
    }
    
    // Clear ITRA score inputs
    const mainItraInput = document.getElementById('mainItraScoreInput');
    const mainItraClearBtn = document.getElementById('mainItraClearBtn');
    if (mainItraInput) mainItraInput.value = '';
    if (mainItraClearBtn) mainItraClearBtn.style.display = 'none';
    
    // Reset runner level to intermediate
    const levelButtons = document.querySelectorAll('.race-level-btn');
    levelButtons.forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.level === 'intermediate');
    });
    const runnerLevelSelect = document.getElementById('runnerLevel');
    if (runnerLevelSelect) runnerLevelSelect.value = 'intermediate';
    
    // Clear weather data
    raceWeatherData = null;
    const heroWeatherWidget = document.getElementById('heroWeatherWidget');
    if (heroWeatherWidget) heroWeatherWidget.style.display = 'none';
    
    // Reset date to default (this weekend)
    const datePresetBtns = document.querySelectorAll('.race-date-preset');
    datePresetBtns.forEach(btn => btn.classList.remove('selected'));
    const weekendBtn = document.querySelector('.race-date-preset[data-preset="weekend"]');
    if (weekendBtn) weekendBtn.click(); // Trigger preset to set date
    
    // Hide statement preview
    const statementSection = document.getElementById('statementPreviewSection');
    if (statementSection) statementSection.style.display = 'none';
    
    // Clear AID stations
    aidStations = [];
    const heroAidList = document.getElementById('heroAidList');
    if (heroAidList) heroAidList.innerHTML = '';
    
    // Clear AID station widget in hero section
    const heroAidWidget = document.getElementById('heroAidWidget');
    const heroAidWidgetList = document.getElementById('heroAidWidgetList');
    if (heroAidWidget) heroAidWidget.style.display = 'none';
    if (heroAidWidgetList) heroAidWidgetList.innerHTML = '';
    
    console.log('Strategy state reset for new route');
}

// Demo GPX loading
function setupDemo() {
    const demoBtn = document.getElementById('loadDemoBtn');
    if (!demoBtn) return;
    
    demoBtn.addEventListener('click', loadDemoGpx);
}

async function loadDemoGpx() {
    const demoBtn = document.getElementById('loadDemoBtn');
    const originalText = demoBtn.textContent;
    
    try {
        demoBtn.disabled = true;
        demoBtn.textContent = t('btn.loading');
        
        // Construct absolute URL from current origin
        const demoUrl = resolveGpxUrl('races/demo.gpx');
        console.log('Fetching demo from:', demoUrl);
        
        const response = await fetch(demoUrl);
        console.log('Demo fetch response:', response.status, response.statusText);
        if (!response.ok) {
            throw new Error(`Failed to load demo file: ${response.status} ${response.statusText}`);
        }
        
        const gpxContent = await response.text();
        console.log('Demo GPX content length:', gpxContent.length);
        currentRouteName = 'ZUT Garmisch-Partenkirchen Trail';
        currentRaceLocation = 'Garmisch-Partenkirchen, Bavaria, Germany';
        isDemoMode = true; // Mark as demo mode
        
        // Pre-stored surface profile for demo (75% trail, 22% road, 2% technical)
        preStoredSurfaceData = [
            { startKm: 0, endKm: 3.21, surface: 'road' },
            { startKm: 3.21, endKm: 3.66, surface: 'technical' },
            { startKm: 3.66, endKm: 4.31, surface: 'trail' },
            { startKm: 4.31, endKm: 4.92, surface: 'road' },
            { startKm: 4.92, endKm: 25.76, surface: 'trail' },
            { startKm: 25.76, endKm: 25.97, surface: 'technical' },
            { startKm: 25.97, endKm: 27.48, surface: 'road' },
            { startKm: 27.48, endKm: 27.68, surface: 'unknown' },
            { startKm: 27.68, endKm: 28.1, surface: 'trail' },
            { startKm: 28.1, endKm: 29.0, surface: 'road' }
        ];
        
        parseGPX(gpxContent);
        
        // Auto-apply surface analysis
        await fetchSurfaceData();
        
        // Add sample AID stations for demo
        aidStations = [
            { km: 8.4, name: 'Z8 Laubhütte', stopMin: 3 },
            { km: 13.3, name: 'Z9 Hochalm', stopMin: 5 },
            { km: 21.7, name: 'Z10 Trögllift', stopMin: 4 }
        ];
        renderAidStations();
        renderHeroAidList(); // Update main page AID list
        
        demoBtn.textContent = t('btn.demoLoaded');
        setTimeout(() => {
            demoBtn.textContent = originalText;
            demoBtn.disabled = false;
        }, 2000);
        
    } catch (error) {
        console.error('Error loading demo:', error);
        alert('Failed to load demo GPX file.');
        demoBtn.textContent = originalText;
        demoBtn.disabled = false;
    }
}

// Race Database
// Race database - loaded from races.json
let raceDatabase = [];
let raceDatabaseLoaded = false;

async function loadRaceDatabase() {
    if (raceDatabaseLoaded) return raceDatabase;
    
    try {
        const response = await fetch('races.json');
        if (!response.ok) throw new Error('Failed to load races.json');
        const data = await response.json();
        raceDatabase = data.races || [];
        raceDatabaseLoaded = true;
        console.log(`Loaded ${raceDatabase.length} races from database`);
    } catch (error) {
        console.error('Error loading race database:', error);
        raceDatabase = [];
    }
    return raceDatabase;
}

function setupRaceBrowser() {
    const browseBtn = document.getElementById('browseRacesBtn');
    const panel = document.getElementById('raceBrowserPanel');
    const overlay = document.getElementById('raceBrowserOverlay');
    const closeBtn = document.getElementById('raceBrowserClose');
    const searchInput = document.getElementById('raceSearchInput');
    const filterBtns = document.querySelectorAll('.race-filter-btn');
    
    if (!browseBtn || !panel) return;
    
    let currentFilter = 'all';
    
    // Open panel - load races on first open
    browseBtn.addEventListener('click', async () => {
        panel.classList.add('active');
        overlay.classList.add('active');
        await loadRaceDatabase();
        renderRaceList(currentFilter, '');
        searchInput.focus();
    });
    
    // Close panel
    const closePanel = () => {
        panel.classList.remove('active');
        overlay.classList.remove('active');
    };
    
    closeBtn?.addEventListener('click', closePanel);
    overlay?.addEventListener('click', closePanel);
    
    // Search
    searchInput?.addEventListener('input', (e) => {
        renderRaceList(currentFilter, e.target.value);
    });
    
    // Filters
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderRaceList(currentFilter, searchInput?.value || '');
        });
    });
}

function renderRaceList(filter, searchText) {
    const list = document.getElementById('raceBrowserList');
    if (!list) return;
    
    const query = searchText.toLowerCase();
    
    const filtered = raceDatabase.filter(race => {
        // Filter by category
        if (filter !== 'all' && race.category !== filter) return false;
        
        // Filter by search text
        if (query && !race.name.toLowerCase().includes(query) && !race.country.includes(query)) {
            return false;
        }
        
        return true;
    });
    
    if (filtered.length === 0) {
        list.innerHTML = '<div class="no-races-found">' + t('races.noResults') + '</div>';
        return;
    }
    
    list.innerHTML = filtered.map(race => {
        // Race is loadable only if available AND user has early access
        const isLoadable = race.available && isEarlyAccessUnlocked();
        
        if (isLoadable) {
            return `
                <div class="race-item" onclick="loadRace('${race.id}')">
                    <span class="race-item-flag">${race.country}</span>
                    <div class="race-item-info">
                        <div class="race-item-name">${race.name}</div>
                        <div class="race-item-details">
                            <span>📏 ${race.distance} km</span>
                            <span>⛰️ ${race.elevation.toLocaleString()}m D+</span>
                        </div>
                    </div>
                    <button class="race-item-load" onclick="event.stopPropagation(); loadRace('${race.id}')">Load</button>
                </div>
            `;
        } else {
            return `
                <div class="race-item race-item-unavailable">
                    <span class="race-item-flag">${race.country}</span>
                    <div class="race-item-info">
                        <div class="race-item-name">${race.name}</div>
                        <div class="race-item-details">
                            <span>📏 ${race.distance} km</span>
                            <span>⛰️ ${race.elevation.toLocaleString()}m D+</span>
                        </div>
                    </div>
                    <span class="race-item-coming-soon">Coming Soon</span>
                </div>
            `;
        }
    }).join('');
}

async function loadRace(raceId) {
    const race = raceDatabase.find(r => r.id === raceId);
    if (!race) return;
    
    const panel = document.getElementById('raceBrowserPanel');
    const overlay = document.getElementById('raceBrowserOverlay');
    
    try {
        // Show loading state
        const loadBtns = document.querySelectorAll('.race-item-load');
        loadBtns.forEach(btn => btn.disabled = true);
        
        // Construct absolute URL from current origin
        const gpxUrl = resolveGpxUrl(race.gpxUrl);
        console.log('Loading race from:', gpxUrl);
        
        const response = await fetch(gpxUrl);
        if (!response.ok) {
            throw new Error('GPX file not available');
        }
        
        const gpxContent = await response.text();
        currentRouteName = race.name;
        currentRaceLocation = race.location || '';
        isDemoMode = false; // Race browser load, not demo
        preStoredSurfaceData = null; // Clear pre-stored data, will fetch from OSM
        parseGPX(gpxContent);
        
        // Track race browser selection
        trackEvent('race_browser_load', { 
            race_id: raceId,
            race_name: race.name,
            distance: race.distance,
            category: race.category
        });
        
        // Clear AID stations for new race (user can add their own)
        aidStations = [];
        renderAidStations();
        
        // Close panel
        panel?.classList.remove('active');
        overlay?.classList.remove('active');
        
    } catch (error) {
        console.error('Error loading race:', error);
        alert(`Sorry, the GPX file for "${race.name}" is not available yet. We're working on adding more races!`);
        
        const loadBtns = document.querySelectorAll('.race-item-load');
        loadBtns.forEach(btn => btn.disabled = false);
    }
}

// Make loadRace globally available
window.loadRace = loadRace;

// Drag and Drop functionality
function setupDragAndDrop() {
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (!checkEarlyAccess()) return;
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.gpx')) {
            processFile(file);
        } else {
            alert('Please drop a valid GPX file.');
        }
    });
}

function setupFileInput() {
    browseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!checkEarlyAccess()) return;
        gpxInput.click();
    });

    // Mobile browse button
    const browseBtnMobile = document.getElementById('browseBtnMobile');
    if (browseBtnMobile) {
        browseBtnMobile.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!checkEarlyAccess()) return;
            gpxInput.click();
        });
    }

    dropZone.addEventListener('click', () => {
        if (!checkEarlyAccess()) return;
        gpxInput.click();
    });

    gpxInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            processFile(file);
        }
    });
}

// Process GPX file
function processFile(file) {
    // Store filename (without extension) as default route name
    currentRouteName = file.name.replace(/\.gpx$/i, '');
    currentRaceLocation = ''; // No location info for uploaded files
    isDemoMode = false; // Regular file upload, not demo
    preStoredSurfaceData = null; // Clear pre-stored data, will fetch from OSM
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const gpxContent = e.target.result;
        parseGPX(gpxContent);
    };
    reader.readAsText(file);
}

// Parse GPX XML
function parseGPX(gpxContent) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(gpxContent, 'text/xml');
    
    // Check for parsing errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
        alert('Error parsing GPX file. Please check the file format.');
        return;
    }
    
    // Try to extract route name from GPX metadata
    const nameTag = xmlDoc.querySelector('metadata > name') || 
                    xmlDoc.querySelector('trk > name') || 
                    xmlDoc.querySelector('rte > name');
    if (nameTag && nameTag.textContent.trim()) {
        currentRouteName = nameTag.textContent.trim();
    }

    // Extract track points
    const trackPoints = xmlDoc.querySelectorAll('trkpt');
    if (trackPoints.length === 0) {
        // Try route points if no track points
        const routePoints = xmlDoc.querySelectorAll('rtept');
        if (routePoints.length === 0) {
            alert('No track or route points found in the GPX file.');
            return;
        }
        gpxData = extractPoints(routePoints);
    } else {
        gpxData = extractPoints(trackPoints);
    }

    if (gpxData.points.length < 2) {
        alert('Not enough points in the GPX file for analysis.');
        return;
    }

    // Calculate derived data
    calculateSegments();
    
    // Display everything (initial view)
    showSections();
    displayStats();
    displayMap();
    displayElevationChart();
    displayGradientChart();
    
    // Update ITRA effort display
    updateItraEffortDisplay();
    
    // Re-render AID stations to show leg info with GPX data
    renderAidStations();
    
    // Show surface loading state and fetch data from OSM
    showSurfaceLoading();
    fetchSurfaceData();
    
    // Update sun times display based on route center
    updateSunTimesDisplay();
    
    // Auto-calculate race plan (only on race pages, not main page with Calculate button)
    applyRunnerLevelPaces();
    
    const heroCalculateBtn = document.getElementById('heroCalculateBtn');
    if (!heroCalculateBtn) {
        calculateRacePlan();
    } else {
        // On main page, show preview with known GPX data
        showHeroPreview();
        
        // Auto-scroll to Strategy Box after short delay for rendering
        setTimeout(() => {
            const strategyBox = document.getElementById('heroRunnerLevel');
            if (strategyBox) {
                strategyBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    }
    
    // Hide upload section after GPX is loaded
    const uploadSection = document.getElementById('uploadSection');
    if (uploadSection) {
        uploadSection.style.display = 'none';
    }
    
    // Track GPX load
    trackEvent('gpx_loaded', { 
        race_name: currentRouteName || 'custom_upload',
        distance_km: gpxData.totalDistance.toFixed(1),
        elevation_gain: gpxData.elevationGain.toFixed(0)
    });
}

// Extract points from XML nodes
function extractPoints(nodes) {
    const points = [];
    let totalDistance = 0;
    let minElevation = Infinity;
    let maxElevation = -Infinity;

    // First pass: extract all points
    nodes.forEach((node, index) => {
        const lat = parseFloat(node.getAttribute('lat'));
        const lon = parseFloat(node.getAttribute('lon'));
        const eleNode = node.querySelector('ele');
        const elevation = eleNode ? parseFloat(eleNode.textContent) : null;

        const point = { lat, lon, elevation, distance: 0 };

        if (index > 0) {
            const prevPoint = points[index - 1];
            const segmentDistance = calculateDistance(
                prevPoint.lat, prevPoint.lon,
                lat, lon
            );
            totalDistance += segmentDistance;
            point.distance = totalDistance;
        }

        if (elevation !== null) {
            minElevation = Math.min(minElevation, elevation);
            maxElevation = Math.max(maxElevation, elevation);
        }

        points.push(point);
    });

    // Calculate elevation gain/loss with smoothing to filter GPS noise
    const { elevationGain, elevationLoss } = calculateElevationWithSmoothing(points);

    return {
        points,
        totalDistance,
        elevationGain,
        elevationLoss,
        minElevation: minElevation === Infinity ? 0 : minElevation,
        maxElevation: maxElevation === -Infinity ? 0 : maxElevation
    };
}

// Calculate elevation gain/loss with smoothing to reduce GPS noise
function calculateElevationWithSmoothing(points) {
    // Use distance-based segmentation to smooth out GPS noise
    // Calculate average elevation every 50 meters, then measure gain/loss between averages
    const SEGMENT_DISTANCE = 0.05; // km (50 meters)
    const MIN_CHANGE_THRESHOLD = 1; // minimum meters to count
    
    if (points.length < 2) return { elevationGain: 0, elevationLoss: 0 };
    
    // Group points into 50m segments and average their elevation
    const segmentElevations = [];
    let segmentStart = 0;
    let segmentSum = 0;
    let segmentCount = 0;
    
    for (const point of points) {
        if (point.elevation === null) continue;
        
        segmentSum += point.elevation;
        segmentCount++;
        
        // Check if we've covered enough distance for a new segment
        if (point.distance - segmentStart >= SEGMENT_DISTANCE && segmentCount > 0) {
            segmentElevations.push(segmentSum / segmentCount);
            segmentStart = point.distance;
            segmentSum = 0;
            segmentCount = 0;
        }
    }
    
    // Don't forget the last segment
    if (segmentCount > 0) {
        segmentElevations.push(segmentSum / segmentCount);
    }
    
    // Now calculate gain/loss between smoothed segment averages
    let elevationGain = 0;
    let elevationLoss = 0;
    
    for (let i = 1; i < segmentElevations.length; i++) {
        const change = segmentElevations[i] - segmentElevations[i - 1];
        
        if (Math.abs(change) >= MIN_CHANGE_THRESHOLD) {
            if (change > 0) {
                elevationGain += change;
            } else {
                elevationLoss += Math.abs(change);
            }
        }
    }
    
    return { elevationGain, elevationLoss };
}

// Haversine formula for distance calculation
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg) {
    return deg * (Math.PI / 180);
}

// Calculate segments with terrain classification
function calculateSegments() {
    segments = [];
    const points = gpxData.points;
    
    // Create segments every 100m or so for smooth gradient calculation
    const segmentLength = 0.1; // km
    let currentSegmentStart = 0;
    let segmentStartElevation = points[0].elevation || 0;
    
    for (let i = 1; i < points.length; i++) {
        const distanceFromSegmentStart = points[i].distance - (segments.length * segmentLength);
        
        if (distanceFromSegmentStart >= segmentLength || i === points.length - 1) {
            const segmentDistance = points[i].distance - currentSegmentStart;
            const currentElevation = points[i].elevation || 0;
            const elevationChange = currentElevation - segmentStartElevation;
            
            // Calculate grade percentage
            const grade = segmentDistance > 0 ? (elevationChange / (segmentDistance * 1000)) * 100 : 0;
            
            let terrainType;
            if (grade > GRADE_THRESHOLD) {
                terrainType = 'uphill';
            } else if (grade < -GRADE_THRESHOLD) {
                terrainType = 'downhill';
            } else {
                terrainType = 'flat';
            }
            
            segments.push({
                startIndex: currentSegmentStart === 0 ? 0 : segments.length > 0 ? segments[segments.length - 1].endIndex : 0,
                endIndex: i,
                startDistance: currentSegmentStart,
                endDistance: points[i].distance,
                distance: segmentDistance,
                elevationChange,
                grade,
                terrainType,
                surfaceType: 'unknown', // Will be updated by fetchSurfaceData
                startPoint: points[segments.length > 0 ? segments[segments.length - 1].endIndex : 0],
                endPoint: points[i]
            });
            
            currentSegmentStart = points[i].distance;
            segmentStartElevation = currentElevation;
        }
    }
}

// Fetch surface data from OpenStreetMap via Overpass API
async function fetchSurfaceData() {
    if (!gpxData || segments.length === 0) return;
    
    // Check for pre-stored surface data from race config
    if (preStoredSurfaceData && preStoredSurfaceData.length > 0) {
        console.log('Using pre-stored surface data');
        applySurfaceFromPreStored(preStoredSurfaceData);
        displaySurfaceStats();
        displayMap();
        return;
    }
    
    // Check localStorage cache for this route
    const cacheKey = `surface_${gpxData.totalDistance.toFixed(2)}_${gpxData.elevationGain.toFixed(0)}`;
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
        try {
            const cached = JSON.parse(cachedData);
            if (cached.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000) { // 7 day cache
                console.log('Using cached surface data from localStorage');
                surfaceData = cached.surfaceData;
                applySurfaceToSegments(cached.surfaceData);
                displaySurfaceStats();
                displayMap();
                return;
            }
        } catch (e) {
            console.warn('Invalid cached surface data');
        }
    }
    
    // No cached data - show loading state and fetch from OSM
    showSurfaceLoading();
    
    // Set loading flag
    isSurfaceLoading = true;
    
    // Show loading indicator
    updateSurfaceStatus('Loading surface data from OpenStreetMap...');
    
    try {
        // Sample points along the route (every ~200m to avoid too many queries)
        const samplePoints = [];
        const SAMPLE_INTERVAL = 0.2; // km
        let lastSampleDist = -SAMPLE_INTERVAL;
        
        for (const point of gpxData.points) {
            if (point.distance - lastSampleDist >= SAMPLE_INTERVAL) {
                samplePoints.push({
                    lat: point.lat,
                    lon: point.lon,
                    distance: point.distance
                });
                lastSampleDist = point.distance;
            }
        }
        
        // Build Overpass query for all sample points
        // Query ways near sample points in a single batch
        const bbox = calculateBoundingBox(gpxData.points);
        const overpassQuery = buildOverpassQuery(bbox, samplePoints);
        
        console.log(`Route bbox area: ${(bbox.north - bbox.south) * (bbox.east - bbox.west).toFixed(6)}`);
        console.log(`Sample points: ${samplePoints.length}`);
        
        // Try multiple Overpass API endpoints (some may be rate-limited or down)
        const endpoints = [
            'https://overpass-api.de/api/interpreter',
            'https://overpass.kumi.systems/api/interpreter',
            'https://z.overpass-api.de/api/interpreter'
        ];
        
        let response = null;
        let lastError = null;
        
        for (const endpoint of endpoints) {
            try {
                console.log(`Trying Overpass endpoint: ${endpoint}`);
                response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: 'data=' + encodeURIComponent(overpassQuery)
                });
                
                if (response.ok) {
                    // Check content-type to ensure it's JSON, not an error page
                    const contentType = response.headers.get('content-type') || '';
                    if (!contentType.includes('application/json')) {
                        console.warn(`Endpoint ${endpoint} returned non-JSON: ${contentType}`);
                        lastError = new Error(`Non-JSON response: ${contentType}`);
                        response = null;
                        continue;
                    }
                    console.log(`Success with endpoint: ${endpoint}`);
                    break;
                } else {
                    lastError = new Error(`HTTP ${response.status}`);
                    response = null;
                }
            } catch (e) {
                console.warn(`Endpoint ${endpoint} failed:`, e.message);
                lastError = e;
            }
        }
        
        if (!response) {
            throw lastError || new Error('All Overpass endpoints failed');
        }
        
        // Read response text first to validate it's actually JSON
        const responseText = await response.text();
        if (responseText.startsWith('<?xml') || responseText.startsWith('<')) {
            throw new Error('API returned XML error page instead of JSON');
        }
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            throw new Error('Invalid JSON response from API');
        }
        
        // Process OSM ways and build spatial index
        const ways = processOSMWays(data);
        
        if (ways.length === 0) {
            console.log('No OSM data found for this area. Using default surfaces.');
            isSurfaceLoading = false;
            displaySurfaceStats();
            displayMap();
            return;
        }
        
        // Match sample points to nearest ways
        const surfaceResults = matchPointsToWays(samplePoints, ways);
        
        // Apply surface data to segments
        applySurfaceToSegments(surfaceResults);
        
        // Cache to localStorage for faster reload
        try {
            const cacheKey = `surface_${gpxData.totalDistance.toFixed(2)}_${gpxData.elevationGain.toFixed(0)}`;
            localStorage.setItem(cacheKey, JSON.stringify({
                timestamp: Date.now(),
                surfaceData: surfaceResults
            }));
            console.log('Surface data cached to localStorage');
        } catch (e) {
            console.warn('Could not cache surface data:', e.message);
        }
        
        // Clear loading flag
        isSurfaceLoading = false;
        
        // Update display with surface info
        displayMap(); // Redraw map with surface colors
        displaySurfaceStats();
        
        // If race plan was already calculated, recalculate to show surface data
        const splitsSection = document.getElementById('splitsSection');
        if (splitsSection && splitsSection.style.display !== 'none') {
            calculateRacePlan();
        }
        
    } catch (error) {
        console.error('Error fetching surface data:', error);
        isSurfaceLoading = false;
        // Show stats with default/unknown surfaces
        displaySurfaceStats();
    }
}

// Calculate bounding box for GPX points
function calculateBoundingBox(points) {
    let minLat = Infinity, maxLat = -Infinity;
    let minLon = Infinity, maxLon = -Infinity;
    
    for (const point of points) {
        minLat = Math.min(minLat, point.lat);
        maxLat = Math.max(maxLat, point.lat);
        minLon = Math.min(minLon, point.lon);
        maxLon = Math.max(maxLon, point.lon);
    }
    
    // Add small buffer (~100m)
    const buffer = 0.001;
    return {
        south: minLat - buffer,
        north: maxLat + buffer,
        west: minLon - buffer,
        east: maxLon + buffer
    };
}

// Build Overpass API query - use around filter for better performance on long routes
function buildOverpassQuery(bbox, samplePoints) {
    // For large routes, query around sample points instead of full bbox
    // This is much faster than querying the entire bounding box
    
    // Calculate bbox area (rough approximation)
    const latDiff = bbox.north - bbox.south;
    const lonDiff = bbox.east - bbox.west;
    const bboxArea = latDiff * lonDiff;
    
    // If bbox is small (< ~10km x 10km), use simple bbox query
    if (bboxArea < 0.01) {
        return `[out:json][timeout:60];
(
  way["highway"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
);
out body geom;`;
    }
    
    // For larger areas, use "around" query with sample points (much faster)
    // Limit to ~20 points to keep query manageable
    const step = Math.max(1, Math.floor(samplePoints.length / 20));
    const queryPoints = samplePoints.filter((_, i) => i % step === 0);
    
    // Build around filter - format: around:radius,lat1,lon1,lat2,lon2,...
    const coordString = queryPoints.map(p => `${p.lat},${p.lon}`).join(',');
    
    console.log(`Using around query with ${queryPoints.length} points`);
    
    return `[out:json][timeout:60];
(
  way["highway"](around:50,${coordString});
);
out body geom;`;
}

// Process OSM ways from Overpass response
function processOSMWays(data) {
    const ways = [];
    
    for (const element of data.elements) {
        if (element.type !== 'way' || !element.geometry) continue;
        
        const tags = element.tags || {};
        const surface = tags.surface || null;
        const highway = tags.highway || null;
        
        // Determine surface category
        let surfaceType = 'unknown';
        if (surface && OSM_SURFACE_MAP[surface]) {
            surfaceType = OSM_SURFACE_MAP[surface];
        } else if (highway && OSM_HIGHWAY_MAP[highway]) {
            surfaceType = OSM_HIGHWAY_MAP[highway];
        }
        
        // Store way with its geometry
        ways.push({
            id: element.id,
            surfaceType,
            surfaceTag: surface,
            highway,
            geometry: element.geometry.map(g => ({ lat: g.lat, lon: g.lon }))
        });
    }
    
    return ways;
}

// Match sample points to nearest OSM ways
function matchPointsToWays(samplePoints, ways) {
    const results = [];
    
    for (const point of samplePoints) {
        let nearestWay = null;
        let minDistance = Infinity;
        
        for (const way of ways) {
            // Find minimum distance from point to any segment of the way
            for (let i = 0; i < way.geometry.length - 1; i++) {
                const dist = pointToLineDistance(
                    point.lat, point.lon,
                    way.geometry[i].lat, way.geometry[i].lon,
                    way.geometry[i + 1].lat, way.geometry[i + 1].lon
                );
                
                if (dist < minDistance) {
                    minDistance = dist;
                    nearestWay = way;
                }
            }
        }
        
        // Only accept matches within ~30 meters
        const MAX_MATCH_DISTANCE = 0.03; // km
        results.push({
            distance: point.distance,
            surfaceType: (nearestWay && minDistance < MAX_MATCH_DISTANCE) ? nearestWay.surfaceType : 'unknown',
            matchDistance: minDistance,
            surfaceTag: nearestWay?.surfaceTag || null
        });
    }
    
    return results;
}

// Calculate perpendicular distance from point to line segment (in km)
function pointToLineDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;
    
    let xx, yy;
    if (param < 0) {
        xx = x1; yy = y1;
    } else if (param > 1) {
        xx = x2; yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }
    
    return calculateDistance(px, py, xx, yy);
}

// Apply surface results to segments
// Apply pre-stored surface data from race config
// Format: [{ startKm: 0, endKm: 5.2, surface: 'road' }, ...]
function applySurfaceFromPreStored(preStoredData) {
    // Sort by startKm
    const sortedSurfaces = [...preStoredData].sort((a, b) => a.startKm - b.startKm);
    
    for (const segment of segments) {
        const segmentMidpoint = (segment.startDistance + segment.endDistance) / 2;
        
        // Find which pre-stored segment contains this midpoint
        for (const stored of sortedSurfaces) {
            if (segmentMidpoint >= stored.startKm && segmentMidpoint < stored.endKm) {
                segment.surfaceType = stored.surface;
                break;
            }
        }
    }
    
    // Build surfaceData array for consistency with OSM-fetched data
    surfaceData = [];
    for (const stored of sortedSurfaces) {
        surfaceData.push({
            distance: stored.startKm,
            surfaceType: stored.surface,
            matchDistance: 0,
            surfaceTag: null
        });
    }
    
    isSurfaceLoading = false;
    updateSurfaceStatus('Surface data loaded from race profile');
}

function applySurfaceToSegments(surfaceResults) {
    surfaceData = surfaceResults;
    
    // Sort results by distance for efficient lookup
    const sortedSamples = [...surfaceResults].sort((a, b) => a.distance - b.distance);
    
    for (const segment of segments) {
        const segmentMidpoint = (segment.startDistance + segment.endDistance) / 2;
        
        // Find surface samples within this segment
        const samplesInSegment = sortedSamples.filter(s => 
            s.distance >= segment.startDistance && s.distance <= segment.endDistance
        );
        
        if (samplesInSegment.length > 0) {
            // Use most common non-unknown surface type in segment
            const counts = {};
            for (const sample of samplesInSegment) {
                if (sample.surfaceType !== 'unknown') {
                    counts[sample.surfaceType] = (counts[sample.surfaceType] || 0) + 1;
                }
            }
            
            let maxCount = 0;
            let dominantSurface = 'unknown';
            for (const [type, count] of Object.entries(counts)) {
                if (count > maxCount) {
                    maxCount = count;
                    dominantSurface = type;
                }
            }
            
            if (dominantSurface !== 'unknown') {
                segment.surfaceType = dominantSurface;
                continue;
            }
        }
        
        // No samples in segment - find nearest sample by distance
        let nearestSample = null;
        let minDist = Infinity;
        
        for (const sample of sortedSamples) {
            if (sample.surfaceType === 'unknown') continue;
            
            const dist = Math.abs(sample.distance - segmentMidpoint);
            if (dist < minDist) {
                minDist = dist;
                nearestSample = sample;
            }
        }
        
        // Only use interpolation within reasonable distance (500m)
        if (nearestSample && minDist < 0.5) {
            segment.surfaceType = nearestSample.surfaceType;
        }
    }
}

// Count surfaces for status display
function countSurfaces() {
    const counts = { road: 0, trail: 0, technical: 0, unknown: 0 };
    let totalDist = 0;
    
    for (const segment of segments) {
        counts[segment.surfaceType] += segment.distance;
        totalDist += segment.distance;
    }
    
    const parts = [];
    for (const [type, dist] of Object.entries(counts)) {
        if (dist > 0) {
            const pct = Math.round((dist / totalDist) * 100);
            parts.push(`${getSurfaceName(type)}: ${pct}%`);
        }
    }
    
    return parts.join(', ');
}

// Update surface status display
function updateSurfaceStatus(message) {
    const statusEl = document.getElementById('surfaceStatus');
    if (statusEl) {
        statusEl.textContent = message;
    }
}

// Display surface stats under map (replacing pie chart)
// Show surface loading state
function showSurfaceLoading() {
    // Old surface stats section is now hidden - we use hero widget instead
    const statsContainer = document.getElementById('surfaceStats');
    if (statsContainer) statsContainer.style.display = 'none';
    
    // Show loading in hero surface widget
    showHeroSurfaceLoading();
}

// Show loading state in hero surface widget
function showHeroSurfaceLoading() {
    const widget = document.getElementById('heroSurfaceWidget');
    const loadingEl = document.getElementById('heroSurfaceLoading');
    const barsContainer = document.getElementById('heroSurfaceBars');
    const toggle = document.getElementById('heroSurfaceToggle');
    
    if (widget) widget.style.display = 'flex';
    if (loadingEl) loadingEl.style.display = 'flex';
    if (barsContainer) barsContainer.style.display = 'none';
    if (toggle) toggle.style.display = 'none';
}

// Display surface stats under map (legacy - now hidden, using hero widget instead)
function displaySurfaceStats() {
    // Hide the old surface stats section - we use hero widget now
    const statsContainer = document.getElementById('surfaceStats');
    if (statsContainer) statsContainer.style.display = 'none';
    
    // Update the hero surface widget with fetched data
    updateHeroSurfaceWidget();
}

// Update Hero Surface Widget (in hero results section)
function updateHeroSurfaceWidget() {
    const widget = document.getElementById('heroSurfaceWidget');
    const barsContainer = document.getElementById('heroSurfaceBars');
    const loadingEl = document.getElementById('heroSurfaceLoading');
    const toggle = document.getElementById('heroSurfaceToggle');
    
    // Hide loading
    if (loadingEl) loadingEl.style.display = 'none';
    
    if (!widget || !barsContainer || segments.length === 0) {
        if (widget) widget.style.display = 'none';
        return;
    }
    
    const surfaceDistances = { road: 0, trail: 0, technical: 0 };
    let totalDistance = 0;
    let hasKnownSurface = false;
    
    for (const segment of segments) {
        if (segment.surfaceType !== 'unknown') {
            surfaceDistances[segment.surfaceType] = (surfaceDistances[segment.surfaceType] || 0) + segment.distance;
            hasKnownSurface = true;
        }
        totalDistance += segment.distance;
    }
    
    // If no known surfaces, default to 100% trail
    if (!hasKnownSurface && totalDistance > 0) {
        surfaceDistances.trail = totalDistance;
    }
    
    if (totalDistance === 0) {
        widget.style.display = 'none';
        return;
    }
    
    const surfaceIcons = { road: '🛤️', trail: '🌲', technical: '🏔️' };
    const surfaceNames = { 
        road: typeof t === 'function' ? t('surface.road') : 'Road', 
        trail: typeof t === 'function' ? t('surface.trail') : 'Trail', 
        technical: typeof t === 'function' ? t('surface.technical') : 'Technical' 
    };
    
    // Sort by percentage descending
    const sorted = Object.entries(surfaceDistances)
        .filter(([type, dist]) => dist > 0)
        .sort((a, b) => b[1] - a[1]);
    
    let html = '';
    for (const [type, dist] of sorted) {
        const pct = Math.round((dist / totalDistance) * 100);
        html += `
            <div class="hero-surface-row">
                <span class="hero-surface-icon">${surfaceIcons[type] || '🏃'}</span>
                <div class="hero-surface-bar-container">
                    <div class="hero-surface-bar ${type}" style="width: ${pct}%"></div>
                </div>
                <span class="hero-surface-pct">${pct}%</span>
                <span class="hero-surface-name">${surfaceNames[type] || type}</span>
            </div>
        `;
    }
    
    barsContainer.innerHTML = html;
    barsContainer.style.display = 'flex';
    widget.style.display = html ? 'flex' : 'none';
    if (toggle) toggle.style.display = 'flex';
}

// Update Hero Climb Profile Widget (uphill/flat/downhill percentages)
function updateHeroClimbWidget() {
    const widget = document.getElementById('heroClimbWidget');
    const statsContainer = document.getElementById('heroClimbStats');
    
    if (!widget || !statsContainer || segments.length === 0) {
        if (widget) widget.style.display = 'none';
        return;
    }
    
    const terrainDistances = { uphill: 0, flat: 0, downhill: 0 };
    let totalDistance = 0;
    
    for (const segment of segments) {
        const type = segment.terrainType || 'flat';
        terrainDistances[type] = (terrainDistances[type] || 0) + segment.distance;
        totalDistance += segment.distance;
    }
    
    if (totalDistance === 0) {
        widget.style.display = 'none';
        return;
    }
    
    const climbIcons = { uphill: '⬆️', flat: '➡️', downhill: '⬇️' };
    const climbLabels = { 
        uphill: typeof t === 'function' ? t('climb.uphill') : 'Uphill', 
        flat: typeof t === 'function' ? t('climb.flat') : 'Flat', 
        downhill: typeof t === 'function' ? t('climb.downhill') : 'Downhill' 
    };
    
    // Fixed order: uphill, flat, downhill
    const order = ['uphill', 'flat', 'downhill'];
    
    let html = '';
    for (const type of order) {
        const dist = terrainDistances[type] || 0;
        const pct = Math.round((dist / totalDistance) * 100);
        html += `
            <div class="hero-climb-row">
                <span class="hero-climb-icon">${climbIcons[type]}</span>
                <div class="hero-climb-bar-container">
                    <div class="hero-climb-bar ${type}" style="width: ${pct}%"></div>
                </div>
                <span class="hero-climb-pct">${pct}%</span>
                <span class="hero-climb-label">${climbLabels[type]}</span>
            </div>
        `;
    }
    
    statsContainer.innerHTML = html;
    widget.style.display = 'flex';
}

// Update Hero AID Station Widget
function updateHeroAidWidget() {
    const widget = document.getElementById('heroAidWidget');
    const listContainer = document.getElementById('heroAidWidgetList');
    
    if (!widget || !listContainer) return;
    
    // Check if we have AID stations and checkpoint times
    if (lastCachedCheckpoints && Array.isArray(lastCachedCheckpoints) && lastCachedCheckpoints.length > 0) {
        // Use API-calculated checkpoint times
        const html = lastCachedCheckpoints.map(cp => `
            <div class="hero-aid-item">
                <span class="hero-aid-name">${cp.name}</span>
                <span class="hero-aid-details">
                    <span class="hero-aid-time">+${formatTime(cp.timeMinutes)}</span>
                    <span class="hero-aid-km">${cp.km.toFixed(1)} km</span>
                </span>
            </div>
        `).join('');
        
        listContainer.innerHTML = html;
        widget.style.display = 'flex';
    } else if (typeof aidStations !== 'undefined' && aidStations && Array.isArray(aidStations) && aidStations.length > 0) {
        // Fallback: show AID stations without times (they'll get times after recalculation)
        const html = aidStations.map(aid => `
            <div class="hero-aid-item">
                <span class="hero-aid-name">${aid.name}</span>
                <span class="hero-aid-details">
                    <span class="hero-aid-time">--:--</span>
                    <span class="hero-aid-km">${aid.km.toFixed(1)} km</span>
                </span>
            </div>
        `).join('');
        
        listContainer.innerHTML = html;
        widget.style.display = 'flex';
    } else {
        // No AID stations - hide widget completely
        listContainer.innerHTML = '';
        widget.style.display = 'none';
    }
}

// Show hidden sections
function showSections() {
    // Check if we're on a race page (not main page)
    const isRacePage = typeof detectRaceMode === 'function' && detectRaceMode();
    
    // On race pages, don't show heroRunnerLevel (race pages use raceStep2 instead)
    // Also don't show paceSection (race pages use the compact race strategy box)
    if (isRacePage) {
        document.getElementById('statsSection').style.display = 'block';
        document.getElementById('mapSection').style.display = 'block';
        document.getElementById('elevationSection').style.display = 'block';
        // paceSection stays hidden - race pages use raceStep2 for settings
        
        // Show Story button only for RET races (or all races on dev)
        updateStoryButtonVisibility();
        return;
    }
    
    // On main page with Calculate button, don't auto-show result sections
    const heroCalculateBtn = document.getElementById('heroCalculateBtn');
    if (heroCalculateBtn) {
        // Only show stats section (basic info), hide the rest until Calculate
        document.getElementById('statsSection').style.display = 'block';
        
        // Show strategy box (for creating strategy), hide edit button
        // Note: heroRunnerLevel is OUTSIDE heroResults, so we can show it separately
        const strategyBox = document.getElementById('heroRunnerLevel');
        const editBtn = document.getElementById('editStrategyBtn');
        if (strategyBox) strategyBox.style.display = 'block';
        if (editBtn) editBtn.style.display = 'none';
        
        // Show Start Over button
        const changeBtn = document.getElementById('changeRouteBtn');
        if (changeBtn) changeBtn.style.display = 'inline-flex';
        
        // Keep heroResults HIDDEN until Calculate is clicked
        // It contains insight widgets (Top Climbs, DDL, etc.) that need data
        
        return;
    }
    
    // Fallback: show everything
    document.getElementById('statsSection').style.display = 'block';
    document.getElementById('mapSection').style.display = 'block';
    document.getElementById('elevationSection').style.display = 'block';
    document.getElementById('paceSection').style.display = 'block';
    
    // Show Story button only for RET races (or all races on dev)
    updateStoryButtonVisibility();
}

// Show all sections (called after Calculate on main page)
function showAllSections() {
    document.getElementById('statsSection').style.display = 'block';
    document.getElementById('mapSection').style.display = 'block';
    document.getElementById('elevationSection').style.display = 'block';
    // Note: paceSection is hidden after Calculate since settings are now in Strategy Box
    // splitsSection is shown by calculateRacePlan()
    
    // Show hero results section (contains time display on race pages)
    const heroResults = document.getElementById('heroResults');
    if (heroResults) heroResults.style.display = 'block';
    
    // Show Save/Load Plan buttons on main page (not race pages)
    const routeActions = document.getElementById('routeActions');
    if (routeActions && !detectRaceMode()) {
        routeActions.style.display = 'flex';
    }
    
    // Fix rendering after containers become visible
    setTimeout(() => {
        // Leaflet map needs invalidateSize + re-fit bounds
        if (map && gpxData && gpxData.points) {
            map.invalidateSize();
            const latLngs = gpxData.points.map(p => [p.lat, p.lon]);
            map.fitBounds(L.latLngBounds(latLngs), { padding: [20, 20] });
        }
        // Chart.js charts need resize
        if (elevationChart) elevationChart.resize();
        if (gradientChart) gradientChart.resize();
    }, 100);
    
    // Show Story button only for RET races (or all races on dev)
    updateStoryButtonVisibility();
}

// Show hero preview with GPX data (distance/elevation) before Calculate is clicked
function showHeroPreview() {
    if (!gpxData) return;
    
    const heroCalculateBtn = document.getElementById('heroCalculateBtn');
    if (!heroCalculateBtn) return; // Only on main page
    
    const heroTime = document.getElementById('heroFinishTime');
    const heroDistance = document.getElementById('heroDistance');
    
    // Show distance from GPX data
    if (heroDistance) {
        const dist = useMetric ? gpxData.totalDistance : gpxData.totalDistance * KM_TO_MILES;
        const unit = useMetric ? 'km' : 'mi';
        heroDistance.textContent = `${dist.toFixed(1)} ${unit}`;
    }
    
    // Show elevation gain
    const heroClimbLoad = document.getElementById('heroClimbLoad');
    if (heroClimbLoad) {
        heroClimbLoad.textContent = `+${Math.round(gpxData.elevationGain)}m`;
    }
    
    // Show calculate prompt instead of "-" for time
    if (heroTime) {
        heroTime.textContent = t('hero.clickCalculate');
        heroTime.classList.add('hero-time-preview');
    }
}

// Check if Story card button should be visible
function updateStoryButtonVisibility() {
    const storyBtn = document.getElementById('exportStoryCard');
    const previewSection = document.getElementById('statementPreviewSection');
    if (!storyBtn) return;
    
    // Show button for RET races, dev environment, early access users, or in demo mode (for early access prompt)
    const isRETRace = currentRouteName && 
        (currentRouteName.toLowerCase().includes('ret') || 
         currentRouteName.toLowerCase().includes('rureifel'));
    const hasEarlyAccess = isEarlyAccessUnlocked();
    
    if (IS_DEV || isRETRace || hasEarlyAccess || isDemoMode) {
        storyBtn.style.display = 'inline-flex';
        if (previewSection) {
            // Don't show preview section in demo mode (only show early access prompt)
            if (isDemoMode && !isRETRace) {
                previewSection.style.display = 'none';
            } else {
                previewSection.style.display = 'block';
                initStatementPreview();
            }
        }
    } else {
        storyBtn.style.display = 'none';
        if (previewSection) {
            previewSection.style.display = 'none';
        }
    }
}

// Setup chart selector for elevation/gradient toggle
function setupChartSelector() {
    const selector = document.getElementById('chartSelector');
    if (!selector) return;
    
    selector.addEventListener('change', () => {
        const elevationContainer = document.getElementById('elevationChartContainer');
        const gradientContainer = document.getElementById('gradientChartContainer');
        
        if (selector.value === 'elevation') {
            elevationContainer.style.display = 'block';
            gradientContainer.style.display = 'none';
        } else {
            elevationContainer.style.display = 'none';
            gradientContainer.style.display = 'block';
        }
    });
}

// Display statistics
function displayStats() {
    // Display route name
    const routeNameEl = document.getElementById('routeName');
    if (routeNameEl) {
        routeNameEl.textContent = currentRouteName || 'Unknown Route';
    }
    
    const distanceKm = gpxData.totalDistance;
    const distanceMiles = distanceKm * KM_TO_MILES;
    
    if (useMetric) {
        document.getElementById('totalDistance').textContent = `${distanceKm.toFixed(2)} km`;
    } else {
        document.getElementById('totalDistance').textContent = `${distanceMiles.toFixed(2)} mi`;
    }
    document.getElementById('elevationGain').textContent = `${gpxData.elevationGain.toFixed(0)} m`;
    document.getElementById('elevationLoss').textContent = `${gpxData.elevationLoss.toFixed(0)} m`;
    document.getElementById('minElevation').textContent = `${gpxData.minElevation.toFixed(0)} m`;
    document.getElementById('maxElevation').textContent = `${gpxData.maxElevation.toFixed(0)} m`;
}

// Display map with colored route
function displayMap() {
    // Clear existing map
    if (map) {
        map.remove();
    }
    
    // Clear layer references
    routeLayers = [];
    
    // Initialize map
    map = L.map('map');
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Draw route segments with colors based on terrain AND surface
    const terrainColors = {
        flat: '#4CAF50',
        uphill: '#f44336',
        downhill: '#2196F3'
    };
    
    const points = gpxData.points;
    
    // Check if we have surface data
    const hasSurfaceData = segments.some(s => s.surfaceType !== 'unknown');
    
    // Draw each segment individually for accurate surface/terrain representation
    segments.forEach((segment) => {
        const segmentPoints = [];
        for (let i = segment.startIndex; i <= segment.endIndex; i++) {
            segmentPoints.push([points[i].lat, points[i].lon]);
        }
        
        if (segmentPoints.length < 2) return;
        
        // Create tooltip content
        const tooltipContent = `
            ${getTerrainName(segment.terrainType)}
            ${hasSurfaceData ? ' | ' + getSurfaceName(segment.surfaceType) : ''}
            | ${segment.grade.toFixed(1)}% grade
        `;
        
        // Use surface color if available, otherwise terrain color
        let color;
        if (hasSurfaceData && segment.surfaceType !== 'unknown') {
            color = SURFACE_TYPES[segment.surfaceType].color;
        } else {
            color = terrainColors[segment.terrainType];
        }
        
        const polyline = L.polyline(segmentPoints, {
            color: color,
            weight: 5,
            opacity: 0.8
        }).addTo(map);
        
        polyline.bindTooltip(tooltipContent, { sticky: true });
        routeLayers.push(polyline);
    });
    
    // Add start marker
    L.marker([points[0].lat, points[0].lon])
        .addTo(map)
        .bindPopup('Start');
    
    // Add end marker
    L.marker([points[points.length - 1].lat, points[points.length - 1].lon])
        .addTo(map)
        .bindPopup('Finish');
    
    // Update map legend based on surface data availability
    updateMapLegend(hasSurfaceData);
    
    // Fit map to route bounds
    const latLngs = points.map(p => [p.lat, p.lon]);
    map.fitBounds(L.latLngBounds(latLngs), { padding: [20, 20] });
}

// Update map legend to show either terrain or surface colors
function updateMapLegend(showSurfaceColors) {
    const legendEl = document.querySelector('.map-legend');
    if (!legendEl) return;
    
    if (showSurfaceColors) {
        legendEl.innerHTML = `
            <span class="legend-item"><span class="legend-color" style="background: #4CAF50;"></span> ${t('surface.road')}</span>
            <span class="legend-item"><span class="legend-color" style="background: #FF9800;"></span> ${t('surface.trail')}</span>
            <span class="legend-item"><span class="legend-color" style="background: #9C27B0;"></span> ${t('surface.technical')}</span>
            <span class="legend-item"><span class="legend-color" style="background: #9E9E9E;"></span> ${t('surface.unknown')}</span>
        `;
    } else {
        legendEl.innerHTML = `
            <span class="legend-item"><span class="legend-color flat"></span> ${t('terrain.flat')}</span>
            <span class="legend-item"><span class="legend-color uphill"></span> ${t('terrain.uphill')}</span>
            <span class="legend-item"><span class="legend-color downhill"></span> ${t('terrain.downhill')}</span>
        `;
    }
}

// Display elevation chart
function displayElevationChart() {
    const ctx = document.getElementById('elevationChart').getContext('2d');
    
    // Destroy existing chart
    if (elevationChart) {
        elevationChart.destroy();
    }
    
    const points = gpxData.points;
    
    // Prepare data with colors (handle null elevations)
    const labels = points.map(p => p.distance.toFixed(2));
    const elevations = points.map(p => p.elevation !== null ? p.elevation : 0);
    
    // Create gradient colors based on terrain
    const colors = points.map((p, i) => {
        if (i === 0) return 'rgba(76, 175, 80, 0.8)';
        
        // Find which segment this point belongs to
        for (const segment of segments) {
            if (p.distance <= segment.endDistance) {
                switch (segment.terrainType) {
                    case 'uphill': return 'rgba(244, 67, 54, 0.8)';
                    case 'downhill': return 'rgba(33, 150, 243, 0.8)';
                    default: return 'rgba(76, 175, 80, 0.8)';
                }
            }
        }
        return 'rgba(76, 175, 80, 0.8)';
    });
    
    // Calculate night annotations - pass labels for correct positioning on category axis
    const nightAnnotations = calculateNightAnnotations(labels);
    
    elevationChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Elevation (m)',
                data: elevations,
                borderColor: '#00d4ff',
                backgroundColor: function(context) {
                    const chart = context.chart;
                    const {ctx, chartArea} = chart;
                    if (!chartArea) return;
                    
                    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                    gradient.addColorStop(0, 'rgba(0, 212, 255, 0.1)');
                    gradient.addColorStop(1, 'rgba(0, 212, 255, 0.4)');
                    return gradient;
                },
                fill: true,
                tension: 0.3,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    titleColor: '#00d4ff',
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyColor: '#fff',
                    bodyFont: {
                        size: 13
                    },
                    borderColor: '#00d4ff',
                    borderWidth: 2,
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        title: function(context) {
                            return `📍 ${context[0].label} km`;
                        },
                        label: function(context) {
                            return `⛰️ ${context.raw.toFixed(0)} m`;
                        }
                    }
                },
                annotation: {
                    annotations: nightAnnotations
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: useMetric ? t('elevation.distanceKm') : t('elevation.distanceMi'),
                        color: '#888'
                    },
                    ticks: {
                        color: '#888',
                        maxTicksLimit: 10
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: useMetric ? t('elevation.elevationM') : t('elevation.elevationFt'),
                        color: '#888'
                    },
                    ticks: {
                        color: '#888'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            onHover: function(event, elements) {
                if (!map || !gpxData || !gpxData.points) return;
                
                if (elements && elements.length > 0) {
                    const index = elements[0].index;
                    const point = gpxData.points[index];
                    if (point && point.lat && point.lon) {
                        updateHoverMarker(point.lat, point.lon, point.distance, point.elevation);
                    }
                } else {
                    hideHoverMarker();
                }
            }
        }
    });
    
    // Add mouseleave handler to hide marker when leaving chart
    const chartCanvas = document.getElementById('elevationChart');
    chartCanvas.addEventListener('mouseleave', hideHoverMarker);
    
    // Make chart container responsive
    document.querySelector('.chart-container').style.height = '300px';
}

// Update hover marker position on map (sync with elevation profile)
// Throttle helper for smooth hover
let lastHoverUpdate = 0;
const HOVER_THROTTLE_MS = 16; // ~60fps

function updateHoverMarker(lat, lon, distance, elevation) {
    if (!map) return;
    
    // Throttle updates for smooth performance
    const now = Date.now();
    if (now - lastHoverUpdate < HOVER_THROTTLE_MS) return;
    lastHoverUpdate = now;
    
    if (hoverMarker) {
        // Just move existing marker (fast)
        hoverMarker.setLatLng([lat, lon]);
        // Update tooltip content
        hoverMarker.setTooltipContent(`${distance.toFixed(1)} km · ${elevation?.toFixed(0) || '?'} m`);
    } else {
        // Create marker once with simple circle style
        hoverMarker = L.circleMarker([lat, lon], {
            radius: 8,
            fillColor: '#00d4ff',
            fillOpacity: 1,
            color: '#fff',
            weight: 3,
            className: 'hover-marker-circle'
        }).addTo(map);
        
        // Bind permanent tooltip
        hoverMarker.bindTooltip(`${distance.toFixed(1)} km · ${elevation?.toFixed(0) || '?'} m`, {
            permanent: true,
            direction: 'top',
            offset: [0, -10],
            className: 'hover-marker-tooltip-leaflet'
        });
    }
}

// Hide hover marker
function hideHoverMarker() {
    if (hoverMarker && map) {
        map.removeLayer(hoverMarker);
        hoverMarker = null;
    }
}

// Helper to find the closest label for a given km (for category axis positioning)
// Find the INDEX of the closest label for a given km (for category axis positioning)
function findClosestLabelIndex(labels, targetKm) {
    let closestIndex = 0;
    let closestDiff = Math.abs(parseFloat(labels[0]) - targetKm);
    
    for (let i = 0; i < labels.length; i++) {
        const diff = Math.abs(parseFloat(labels[i]) - targetKm);
        if (diff < closestDiff) {
            closestDiff = diff;
            closestIndex = i;
        }
    }
    return closestIndex;
}

// Calculate night overlay annotations for elevation chart
function calculateNightAnnotations(labels) {
    // Need sun times, paces, and start time
    if (!sunTimes || !gpxData || segments.length === 0 || sunTimes.midnightSun) {
        return {};
    }
    
    if (!labels || labels.length === 0) {
        return {};
    }
    
    const startTimeInput = document.getElementById('raceStartTime');
    if (!startTimeInput || !startTimeInput.value) {
        return {};
    }
    
    const [startHours, startMinutes] = startTimeInput.value.split(':').map(Number);
    const startTimeInMinutes = startHours * 60 + startMinutes;
    
    // Get paces
    const flatPace = lastCalculatedPaces?.flat || 6.5;
    const uphillPace = lastCalculatedPaces?.uphill || 8.5;
    const downhillPace = lastCalculatedPaces?.downhill || 5.5;
    
    // Find night sections
    const nightSections = [];
    let currentNightSection = null;
    let cumulativeTime = 0;
    
    // Sample at every 0.5 km for efficiency
    const totalDist = gpxData.totalDistance;
    const sampleStep = 0.5;
    
    for (let km = 0; km <= totalDist; km += sampleStep) {
        // Calculate time to reach this km using segments
        let timeToKm = 0;
        for (const segment of segments) {
            if (segment.endDistance <= km) {
                const gradientMultiplier = getGradientPaceMultiplier(segment.grade, flatPace, uphillPace, downhillPace);
                timeToKm += segment.distance * flatPace * gradientMultiplier;
            } else if (segment.startDistance < km) {
                const overlapDist = km - segment.startDistance;
                const gradientMultiplier = getGradientPaceMultiplier(segment.grade, flatPace, uphillPace, downhillPace);
                timeToKm += overlapDist * flatPace * gradientMultiplier;
                break;
            }
        }
        
        const clockTime = (startTimeInMinutes + timeToKm) % 1440;
        const isNight = isNightTime(clockTime);
        
        if (isNight) {
            if (!currentNightSection) {
                currentNightSection = { startKm: km };
            }
            currentNightSection.endKm = km;
        } else {
            if (currentNightSection) {
                nightSections.push(currentNightSection);
                currentNightSection = null;
            }
        }
    }
    
    // Close last section
    if (currentNightSection) {
        currentNightSection.endKm = totalDist;
        nightSections.push(currentNightSection);
    }
    
    // Convert to Chart.js annotation format - use label INDEX for category axis
    const annotations = {};
    nightSections.forEach((section, index) => {
        const startIndex = findClosestLabelIndex(labels, section.startKm);
        const endIndex = findClosestLabelIndex(labels, section.endKm);
        
        annotations[`night${index}`] = {
            type: 'box',
            xMin: startIndex,
            xMax: endIndex,
            yMin: 'min',
            yMax: 'max',
            backgroundColor: 'rgba(10, 15, 35, 0.5)',
            borderColor: 'rgba(80, 100, 160, 0.6)',
            borderWidth: 1,
            label: {
                display: index === 0,
                content: '🌙',
                position: { x: 'start', y: 'start' },
                font: { size: 14 }
            }
        };
    });
    
    // Add sunrise/sunset markers based on day/night transitions during the race
    if (sunTimes.sunrise && sunTimes.sunset) {
        // Track actual day/night state transitions
        let sunriseKm = null;  // night → day transition
        let sunsetKm = null;   // day → night transition
        let prevTimeToKm = 0;
        let prevWasNight = null;
        
        for (let km = 0; km <= totalDist; km += sampleStep) {
            let timeToKm = 0;
            for (const segment of segments) {
                if (segment.endDistance <= km) {
                    const gradientMultiplier = getGradientPaceMultiplier(segment.grade, flatPace, uphillPace, downhillPace);
                    timeToKm += segment.distance * flatPace * gradientMultiplier;
                } else if (segment.startDistance < km) {
                    const overlapDist = km - segment.startDistance;
                    const gradientMultiplier = getGradientPaceMultiplier(segment.grade, flatPace, uphillPace, downhillPace);
                    timeToKm += overlapDist * flatPace * gradientMultiplier;
                    break;
                }
            }
            
            // Check current night/day state using the same logic as isNightTime
            const clockTime = (startTimeInMinutes + timeToKm) % 1440;
            const effectiveSunrise = sunTimes.sunrise - TWILIGHT_BUFFER;
            const effectiveSunset = sunTimes.sunset + TWILIGHT_BUFFER;
            const isNight = clockTime < effectiveSunrise || clockTime > effectiveSunset;
            
            // Detect state transitions
            if (prevWasNight !== null && km > 0) {
                if (prevWasNight && !isNight && sunriseKm === null) {
                    // Transition from night to day = SUNRISE
                    sunriseKm = km;
                }
                if (!prevWasNight && isNight && sunsetKm === null) {
                    // Transition from day to night = SUNSET
                    sunsetKm = km;
                }
            }
            
            prevWasNight = isNight;
            prevTimeToKm = timeToKm;
        }
        
        // Add sunrise line - bright yellow, prominent (night → day)
        if (sunriseKm !== null && sunriseKm > 0 && sunriseKm < totalDist) {
            const sunriseIndex = findClosestLabelIndex(labels, sunriseKm);
            annotations['sunrise'] = {
                type: 'line',
                xMin: sunriseIndex,
                xMax: sunriseIndex,
                borderColor: 'rgba(255, 193, 7, 1)',
                borderWidth: 3,
                label: {
                    display: true,
                    content: '🌅 ' + formatSunTime(sunTimes.sunrise),
                    position: 'start',
                    backgroundColor: 'rgba(255, 193, 7, 0.8)',
                    color: '#000',
                    font: { size: 12, weight: 'bold' },
                    padding: 4
                }
            };
        }
        
        // Add sunset line - orange, prominent (day → night)
        if (sunsetKm !== null && sunsetKm > 0 && sunsetKm < totalDist) {
            const sunsetIndex = findClosestLabelIndex(labels, sunsetKm);
            annotations['sunset'] = {
                type: 'line',
                xMin: sunsetIndex,
                xMax: sunsetIndex,
                borderColor: 'rgba(255, 152, 0, 1)',
                borderWidth: 3,
                label: {
                    display: true,
                    content: '🌇 ' + formatSunTime(sunTimes.sunset),
                    position: 'start',
                    backgroundColor: 'rgba(255, 152, 0, 0.8)',
                    color: '#000',
                    font: { size: 12, weight: 'bold' },
                    padding: 4
                }
            };
        }
    }
    
    return annotations;
}

// Display gradient chart
function displayGradientChart() {
    const ctx = document.getElementById('gradientChart').getContext('2d');
    
    // Destroy existing chart
    if (gradientChart) {
        gradientChart.destroy();
    }
    
    // Calculate gradients from segments
    const labels = [];
    const gradients = [];
    const colors = [];
    
    segments.forEach((segment, index) => {
        const midDistance = (segment.startDistance + segment.endDistance) / 2;
        labels.push(midDistance.toFixed(2));
        gradients.push(segment.grade);
        
        // Color based on gradient
        if (segment.grade > GRADE_THRESHOLD) {
            colors.push('rgba(244, 67, 54, 0.8)'); // red for uphill
        } else if (segment.grade < -GRADE_THRESHOLD) {
            colors.push('rgba(33, 150, 243, 0.8)'); // blue for downhill
        } else {
            colors.push('rgba(76, 175, 80, 0.8)'); // green for flat
        }
    });
    
    gradientChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Gradient (%)',
                data: gradients,
                backgroundColor: colors,
                borderColor: colors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            return `Distance: ${context[0].label} km`;
                        },
                        label: function(context) {
                            return `Gradient: ${context.raw.toFixed(1)}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: useMetric ? t('elevation.distanceKm') : t('elevation.distanceMi'),
                        color: '#888'
                    },
                    ticks: {
                        color: '#888',
                        maxTicksLimit: 15
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: t('elevation.gradientPercent'),
                        color: '#888'
                    },
                    ticks: {
                        color: '#888'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
    
    // Make chart container responsive
    const containers = document.querySelectorAll('.chart-container');
    containers.forEach(c => c.style.height = '300px');
}

// Unit Toggle (KM / Miles)
function setupUnitToggle() {
    const kmBtn = document.getElementById('kmBtn');
    const milesBtn = document.getElementById('milesBtn');
    const heroKmBtn = document.getElementById('heroKmBtn');
    const heroMilesBtn = document.getElementById('heroMilesBtn');
    
    // Helper to sync all unit buttons
    function setMetric(isMetric) {
        useMetric = isMetric;
        
        // Update pace section buttons
        if (kmBtn && milesBtn) {
            if (isMetric) {
                kmBtn.classList.add('active');
                milesBtn.classList.remove('active');
            } else {
                milesBtn.classList.add('active');
                kmBtn.classList.remove('active');
            }
        }
        
        // Update hero (Strategy Box) buttons
        if (heroKmBtn && heroMilesBtn) {
            if (isMetric) {
                heroKmBtn.classList.add('active');
                heroMilesBtn.classList.remove('active');
            } else {
                heroMilesBtn.classList.add('active');
                heroKmBtn.classList.remove('active');
            }
        }
        
        updateDistanceHeader();
        if (gpxData) {
            displayStats();
            // Update hero distance display
            const heroDistance = document.getElementById('heroDistance');
            if (heroDistance) {
                const dist = useMetric ? gpxData.totalDistance : gpxData.totalDistance * KM_TO_MILES;
                const unit = useMetric ? 'km' : 'mi';
                heroDistance.textContent = `${dist.toFixed(1)} ${unit}`;
            }
        }
    }
    
    // Pace section buttons
    if (kmBtn) {
        kmBtn.addEventListener('click', () => {
            setMetric(true);
            if (gpxData) {
                const paceResults = document.getElementById('paceResults');
                if (paceResults && paceResults.style.display !== 'none') {
                    calculateRacePlan();
                }
            }
        });
    }
    
    if (milesBtn) {
        milesBtn.addEventListener('click', () => {
            setMetric(false);
            if (gpxData) {
                const paceResults = document.getElementById('paceResults');
                if (paceResults && paceResults.style.display !== 'none') {
                    calculateRacePlan();
                }
            }
        });
    }
    
    // Hero (Strategy Box) buttons
    if (heroKmBtn) {
        heroKmBtn.addEventListener('click', () => setMetric(true));
    }
    
    if (heroMilesBtn) {
        heroMilesBtn.addEventListener('click', () => setMetric(false));
    }
}

function updateDistanceHeader() {
    const header = document.getElementById('distanceHeader');
    if (header) {
        header.textContent = useMetric ? 'KM' : 'Mile';
    }
}

// Save/Load Plan functionality
function setupSaveLoad() {
    const saveBtn = document.getElementById('savePlanBtn');
    const loadBtn = document.getElementById('loadPlanBtn');
    
    if (saveBtn) saveBtn.addEventListener('click', savePlan);
    if (loadBtn) loadBtn.addEventListener('click', loadPlan);
    
    // Also wire up route header save/load buttons (main page)
    const routeSaveBtn = document.getElementById('routeSavePlanBtn');
    const routeLoadBtn = document.getElementById('routeLoadPlanBtn');
    
    if (routeSaveBtn) routeSaveBtn.addEventListener('click', savePlan);
    if (routeLoadBtn) routeLoadBtn.addEventListener('click', loadPlan);
}

function savePlan() {
    if (!gpxData) {
        showToast('Please load a GPX file first', 'error');
        return;
    }
    
    // Prompt for name
    const name = prompt('Save as:', currentRouteName || 'My Race Strategy');
    if (name === null) return; // Cancelled
    
    const entry = saveToHistory(name.trim() || currentRouteName || 'My Race Strategy');
    
    // Also save to legacy single-plan storage for backward compatibility
    const plan = {
        aidStations: aidStations,
        mode: currentMode,
        useMetric: useMetric,
        startTime: document.getElementById('raceStartTime')?.value || '09:00',
        flatPaceMin: document.getElementById('flatPaceMin')?.value || '5',
        flatPaceSec: document.getElementById('flatPaceSec')?.value || '30',
        uphillPaceMin: document.getElementById('uphillPaceMin')?.value || '6',
        uphillPaceSec: document.getElementById('uphillPaceSec')?.value || '30',
        downhillPaceMin: document.getElementById('downhillPaceMin')?.value || '5',
        downhillPaceSec: document.getElementById('downhillPaceSec')?.value || '0',
        targetHours: document.getElementById('targetHours')?.value || '0',
        targetMinutes: document.getElementById('targetMinutes')?.value || '45',
        targetSeconds: document.getElementById('targetSeconds')?.value || '0',
        uphillRatio: document.getElementById('uphillRatio')?.value || '1.2',
        downhillRatio: document.getElementById('downhillRatio')?.value || '0.9'
    };
    
    localStorage.setItem('gpxray_plan', JSON.stringify(plan));
    showToast('💾 Saved locally');
}

function loadPlan() {
    const saved = localStorage.getItem('gpxray_plan');
    if (!saved) {
        showToast('No saved plan found', 'error');
        return;
    }
    
    try {
        const plan = JSON.parse(saved);
        
        // Restore AID stations
        aidStations = plan.aidStations || [];
        renderAidStations();
        
        // Restore mode
        currentMode = plan.mode || 'manual';
        const manualBtn = document.getElementById('manualModeBtn');
        const targetBtn = document.getElementById('targetModeBtn');
        const manualMode = document.getElementById('manualMode');
        const targetMode = document.getElementById('targetMode');
        
        if (currentMode === 'manual') {
            manualBtn?.classList.add('active');
            targetBtn?.classList.remove('active');
            if (manualMode) manualMode.style.display = 'block';
            if (targetMode) targetMode.style.display = 'none';
        } else {
            targetBtn?.classList.add('active');
            manualBtn?.classList.remove('active');
            if (targetMode) targetMode.style.display = 'block';
            if (manualMode) manualMode.style.display = 'none';
        }
        
        // Restore unit
        useMetric = plan.useMetric !== false;
        const kmBtn = document.getElementById('kmBtn');
        const milesBtn = document.getElementById('milesBtn');
        if (useMetric) {
            kmBtn?.classList.add('active');
            milesBtn?.classList.remove('active');
        } else {
            milesBtn?.classList.add('active');
            kmBtn?.classList.remove('active');
        }
        
        // Restore values
        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
        setVal('raceStartTime', plan.startTime);
        if (mainTimePicker24h && plan.startTime) mainTimePicker24h.setValue(plan.startTime);
        setVal('flatPaceMin', plan.flatPaceMin);
        setVal('flatPaceSec', plan.flatPaceSec);
        setVal('uphillPaceMin', plan.uphillPaceMin);
        setVal('uphillPaceSec', plan.uphillPaceSec);
        setVal('downhillPaceMin', plan.downhillPaceMin);
        setVal('downhillPaceSec', plan.downhillPaceSec);
        setVal('targetHours', plan.targetHours);
        setVal('targetMinutes', plan.targetMinutes);
        setVal('targetSeconds', plan.targetSeconds);
        setVal('uphillRatio', plan.uphillRatio);
        setVal('downhillRatio', plan.downhillRatio);
        
        showToast('📂 Plan loaded');
    } catch (e) {
        showToast('Error loading plan', 'error');
        console.error(e);
    }
}

// History Panel functionality
function setupHistory() {
    const historyBtn = document.getElementById('historyBtn');
    const historyPanel = document.getElementById('historyPanel');
    const historyOverlay = document.getElementById('historyOverlay');
    const historyClose = document.getElementById('historyClose');
    const historyExportBtn = document.getElementById('historyExportBtn');
    const historyImportBtn = document.getElementById('historyImportBtn');
    const historyImportInput = document.getElementById('historyImportInput');
    
    if (!historyBtn || !historyPanel) return;
    
    // Open panel
    historyBtn.addEventListener('click', () => {
        historyPanel.classList.add('active');
        historyOverlay.classList.add('active');
        renderHistory();
    });
    
    // Close panel
    const closePanel = () => {
        historyPanel.classList.remove('active');
        historyOverlay.classList.remove('active');
    };
    
    historyClose?.addEventListener('click', closePanel);
    historyOverlay?.addEventListener('click', closePanel);
    
    // Export all history
    historyExportBtn?.addEventListener('click', exportHistory);
    
    // Import history
    historyImportBtn?.addEventListener('click', () => historyImportInput?.click());
    historyImportInput?.addEventListener('change', importHistory);
}

// Feedback Panel functionality
function setupFeedback() {
    const feedbackBtn = document.getElementById('feedbackBtn');
    const feedbackPanel = document.getElementById('feedbackPanel');
    const feedbackOverlay = document.getElementById('feedbackOverlay');
    const feedbackClose = document.getElementById('feedbackClose');
    const feedbackForm = document.getElementById('feedbackForm');
    const feedbackSuccess = document.getElementById('feedbackSuccess');
    
    if (!feedbackBtn || !feedbackPanel) return;
    
    // Setup pricing button selection
    const setupPricingButtons = (containerId, hiddenInputId) => {
        const container = document.getElementById(containerId);
        const hiddenInput = document.getElementById(hiddenInputId);
        if (!container || !hiddenInput) return;
        
        container.querySelectorAll('.pricing-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                // Deselect all in this group
                container.querySelectorAll('.pricing-btn').forEach(b => b.classList.remove('selected'));
                // Select clicked
                btn.classList.add('selected');
                hiddenInput.value = btn.dataset.value;
            });
        });
    };
    
    setupPricingButtons('pricingPerRace', 'feedbackPricingPerRace');
    setupPricingButtons('pricingPerYear', 'feedbackPricingPerYear');
    
    // Open panel
    feedbackBtn.addEventListener('click', () => {
        feedbackPanel.classList.add('active');
        feedbackOverlay.classList.add('active');
        // Reset form when opening
        feedbackForm.style.display = 'flex';
        feedbackSuccess.style.display = 'none';
        feedbackForm.reset();
        // Reset pricing buttons
        document.querySelectorAll('.pricing-btn').forEach(btn => btn.classList.remove('selected'));
    });
    
    // Close panel
    const closePanel = () => {
        feedbackPanel.classList.remove('active');
        feedbackOverlay.classList.remove('active');
    };
    
    feedbackClose?.addEventListener('click', closePanel);
    feedbackOverlay?.addEventListener('click', closePanel);
    
    // Handle form submission
    feedbackForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(feedbackForm);
        const data = {
            like: formData.get('like'),
            missing: formData.get('missing'),
            bugs: formData.get('bugs'),
            pricingPerRace: formData.get('pricingPerRace') || 'not selected',
            pricingPerYear: formData.get('pricingPerYear') || 'not selected',
            email: formData.get('email'),
            url: window.location.href,
            timestamp: new Date().toISOString()
        };
        
        // Submit to Formspree (feedback form)
        const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mqegeeap';
        
        try {
            const response = await fetch(FORMSPREE_ENDPOINT, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                feedbackForm.style.display = 'none';
                feedbackSuccess.style.display = 'flex';
            } else {
                throw new Error('Form submission failed');
            }
        } catch (error) {
            console.error('Feedback submission error:', error);
            // Fallback to mailto on error
            const subject = encodeURIComponent('GPXray Beta Feedback');
            const body = encodeURIComponent(
                `What I like:\n${data.like || 'N/A'}\n\n` +
                `Missing features:\n${data.missing || 'N/A'}\n\n` +
                `Bugs/Issues:\n${data.bugs || 'N/A'}\n\n` +
                `Pricing per race: ${data.pricingPerRace}\n` +
                `Pricing per year: ${data.pricingPerYear}\n\n` +
                `Email: ${data.email || 'N/A'}`
            );
            window.open(`mailto:gpxrayrun@gmail.com?subject=${subject}&body=${body}`, '_blank');
            feedbackForm.style.display = 'none';
            feedbackSuccess.style.display = 'flex';
        }
    });
}

function getHistory() {
    try {
        const data = localStorage.getItem(HISTORY_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Error reading history:', e);
        return [];
    }
}

function saveToHistory(name) {
    if (!gpxData) {
        alert('Please load a GPX file first.');
        return;
    }
    
    const history = getHistory();
    
    const entry = {
        id: Date.now(),
        name: name || currentRouteName || 'Unnamed Route',
        date: new Date().toISOString(),
        distance: gpxData.totalDistance,
        elevation: gpxData.elevationGain,
        plan: {
            aidStations: aidStations,
            mode: currentMode,
            useMetric: useMetric,
            startTime: document.getElementById('raceStartTime')?.value || '09:00',
            flatPaceMin: document.getElementById('flatPaceMin')?.value || '5',
            flatPaceSec: document.getElementById('flatPaceSec')?.value || '30',
            uphillPaceMin: document.getElementById('uphillPaceMin')?.value || '6',
            uphillPaceSec: document.getElementById('uphillPaceSec')?.value || '30',
            downhillPaceMin: document.getElementById('downhillPaceMin')?.value || '5',
            downhillPaceSec: document.getElementById('downhillPaceSec')?.value || '0',
            targetHours: document.getElementById('targetHours')?.value || '0',
            targetMinutes: document.getElementById('targetMinutes')?.value || '45',
            targetSeconds: document.getElementById('targetSeconds')?.value || '0',
            uphillRatio: document.getElementById('uphillRatio')?.value || '1.2',
            downhillRatio: document.getElementById('downhillRatio')?.value || '0.9',
            itraScore: document.getElementById('itraScore')?.value || '550',
            itraUphillRatio: document.getElementById('itraUphillRatio')?.value || '1.3',
            itraDownhillRatio: document.getElementById('itraDownhillRatio')?.value || '0.85'
        }
    };
    
    // Add to beginning of history
    history.unshift(entry);
    
    // Limit to 50 entries
    if (history.length > 50) {
        history.splice(50);
    }
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    return entry;
}

function renderHistory() {
    const historyList = document.getElementById('historyList');
    const historyEmpty = document.getElementById('historyEmpty');
    const history = getHistory();
    
    if (!historyList) return;
    
    if (history.length === 0) {
        historyEmpty.style.display = 'block';
        historyList.innerHTML = '';
        return;
    }
    
    historyEmpty.style.display = 'none';
    
    historyList.innerHTML = history.map(entry => {
        const date = new Date(entry.date);
        const dateStr = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        });
        
        return `
            <div class="history-item" data-id="${entry.id}">
                <div class="history-item-header">
                    <span class="history-item-name">${escapeHtml(entry.name)}</span>
                    <span class="history-item-date">${dateStr}</span>
                </div>
                <div class="history-item-stats">
                    <span>📏 ${entry.distance.toFixed(1)} km</span>
                    <span>⛰️ ${Math.round(entry.elevation)} m</span>
                </div>
                <div class="history-item-actions">
                    <button type="button" class="history-item-btn history-load-btn" onclick="loadFromHistory(${entry.id})">Load Plan</button>
                    <button type="button" class="history-item-btn history-delete-btn" onclick="deleteFromHistory(${entry.id})">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function loadFromHistory(id) {
    const history = getHistory();
    const entry = history.find(e => e.id === id);
    
    if (!entry || !entry.plan) {
        alert('Could not load this plan.');
        return;
    }
    
    const plan = entry.plan;
    
    // Restore AID stations
    aidStations = plan.aidStations || [];
    renderAidStations();
    
    // Restore mode
    currentMode = plan.mode || 'target';
    const manualBtn = document.getElementById('manualModeBtn');
    const targetBtn = document.getElementById('targetModeBtn');
    const itraBtn = document.getElementById('itraModeBtn');
    const manualMode = document.getElementById('manualMode');
    const targetMode = document.getElementById('targetMode');
    const itraMode = document.getElementById('itraMode');
    
    // Reset all modes
    [manualBtn, targetBtn, itraBtn].forEach(btn => btn?.classList.remove('active'));
    [manualMode, targetMode, itraMode].forEach(mode => { if (mode) mode.style.display = 'none'; });
    
    // Activate current mode
    if (currentMode === 'manual') {
        manualBtn?.classList.add('active');
        if (manualMode) manualMode.style.display = 'block';
    } else if (currentMode === 'itra') {
        itraBtn?.classList.add('active');
        if (itraMode) itraMode.style.display = 'block';
    } else {
        targetBtn?.classList.add('active');
        if (targetMode) targetMode.style.display = 'block';
    }
    
    // Restore unit
    useMetric = plan.useMetric !== false;
    const kmBtn = document.getElementById('kmBtn');
    const milesBtn = document.getElementById('milesBtn');
    if (useMetric) {
        kmBtn?.classList.add('active');
        milesBtn?.classList.remove('active');
    } else {
        milesBtn?.classList.add('active');
        kmBtn?.classList.remove('active');
    }
    
    // Restore values
    const setVal = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.value = val; };
    setVal('raceStartTime', plan.startTime);
    if (mainTimePicker24h && plan.startTime) mainTimePicker24h.setValue(plan.startTime);
    setVal('flatPaceMin', plan.flatPaceMin);
    setVal('flatPaceSec', plan.flatPaceSec);
    setVal('uphillPaceMin', plan.uphillPaceMin);
    setVal('uphillPaceSec', plan.uphillPaceSec);
    setVal('downhillPaceMin', plan.downhillPaceMin);
    setVal('downhillPaceSec', plan.downhillPaceSec);
    setVal('targetHours', plan.targetHours);
    setVal('targetMinutes', plan.targetMinutes);
    setVal('targetSeconds', plan.targetSeconds);
    setVal('uphillRatio', plan.uphillRatio);
    setVal('downhillRatio', plan.downhillRatio);
    setVal('itraScore', plan.itraScore);
    setVal('itraUphillRatio', plan.itraUphillRatio);
    setVal('itraDownhillRatio', plan.itraDownhillRatio);
    
    // Close panel
    document.getElementById('historyPanel')?.classList.remove('active');
    document.getElementById('historyOverlay')?.classList.remove('active');
    
    alert(`Loaded plan: ${entry.name}\n\nNote: You'll need to load the same GPX file to recalculate your race strategy.`);
}

function deleteFromHistory(id) {
    if (!confirm('Delete this saved analysis?')) return;
    
    let history = getHistory();
    history = history.filter(e => e.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    renderHistory();
}

function exportHistory() {
    const history = getHistory();
    if (history.length === 0) {
        alert('No history to export.');
        return;
    }
    
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gpxray-history-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importHistory(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const imported = JSON.parse(event.target.result);
            if (!Array.isArray(imported)) {
                throw new Error('Invalid format');
            }
            
            const history = getHistory();
            const existingIds = new Set(history.map(h => h.id));
            
            // Add non-duplicate entries
            let added = 0;
            for (const entry of imported) {
                if (entry.id && !existingIds.has(entry.id)) {
                    history.push(entry);
                    existingIds.add(entry.id);
                    added++;
                }
            }
            
            // Sort by date (newest first)
            history.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // Limit to 50
            if (history.length > 50) {
                history.splice(50);
            }
            
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
            renderHistory();
            alert(`Imported ${added} new entries.`);
        } catch (err) {
            alert('Error importing history: ' + err.message);
        }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset for re-import
}

// Print Race Card functionality
function setupPrintRaceCard() {
    const printBtn = document.getElementById('printRaceCard');
    if (!printBtn) return;
    
    printBtn.addEventListener('click', printRaceCard);
}

function printRaceCard() {
    if (!gpxData) {
        alert('Please load a GPX file first.');
        return;
    }
    
    const splitsBody = document.getElementById('splitsBody');
    if (!splitsBody || splitsBody.children.length === 0) {
        alert('Please calculate your race strategy first.');
        return;
    }
    
    // Prepare print content
    const distanceUnit = useMetric ? 'km' : 'mi';
    const distance = useMetric ? gpxData.totalDistance : gpxData.totalDistance * KM_TO_MILES;
    
    document.getElementById('printTitle').textContent = t('print.title');
    document.getElementById('printDistance').textContent = `${distance.toFixed(2)} ${distanceUnit}`;
    document.getElementById('printElevation').textContent = `↑${gpxData.elevationGain.toFixed(0)}m ↓${gpxData.elevationLoss.toFixed(0)}m`;
    document.getElementById('printTime').textContent = document.getElementById('totalTime')?.textContent || '-';
    
    // Update print table header for units
    const printDistHeader = document.getElementById('printDistanceHeader');
    if (printDistHeader) {
        printDistHeader.textContent = useMetric ? 'KM' : 'Mile';
    }
    
    // Copy splits to print table
    const printBody = document.getElementById('printSplitsBody');
    printBody.innerHTML = '';
    
    const rows = splitsBody.querySelectorAll('tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const printRow = document.createElement('tr');
        
        // Check if it's an AID station row
        if (row.classList.contains('aid-station-row')) {
            printRow.classList.add('aid-row');
        }
        
        // KM, AID, Pace, Race Time, Clock (columns 0, 3, 4, 6, 7)
        const indices = [0, 3, 4, 6, 7];
        indices.forEach(i => {
            const td = document.createElement('td');
            td.textContent = cells[i]?.textContent || '-';
            printRow.appendChild(td);
        });
        
        printBody.appendChild(printRow);
    });
    
    // Trigger print
    window.print();
}

// Pace calculation
function setupPaceCalculation() {
    document.getElementById('calculatePace').addEventListener('click', calculateRacePlan);
}

// Mode selector setup
function setupModeSelector() {
    const manualBtn = document.getElementById('manualModeBtn');
    const targetBtn = document.getElementById('targetModeBtn');
    const itraBtn = document.getElementById('itraModeBtn');
    const manualMode = document.getElementById('manualMode');
    const targetMode = document.getElementById('targetMode');
    const itraMode = document.getElementById('itraMode');
    
    if (!manualBtn || !targetBtn || !manualMode || !targetMode) {
        console.error('Mode selector elements not found');
        return;
    }
    
    manualBtn.addEventListener('click', (e) => {
        e.preventDefault();
        currentMode = 'manual';
        manualBtn.classList.add('active');
        targetBtn.classList.remove('active');
        if (itraBtn) itraBtn.classList.remove('active');
        manualMode.style.display = 'block';
        targetMode.style.display = 'none';
        if (itraMode) itraMode.style.display = 'none';
    });
    
    targetBtn.addEventListener('click', (e) => {
        e.preventDefault();
        currentMode = 'target';
        targetBtn.classList.add('active');
        manualBtn.classList.remove('active');
        if (itraBtn) itraBtn.classList.remove('active');
        targetMode.style.display = 'block';
        manualMode.style.display = 'none';
        if (itraMode) itraMode.style.display = 'none';
    });
    
    if (itraBtn && itraMode) {
        itraBtn.addEventListener('click', (e) => {
            e.preventDefault();
            currentMode = 'itra';
            itraBtn.classList.add('active');
            manualBtn.classList.remove('active');
            targetBtn.classList.remove('active');
            itraMode.style.display = 'block';
            manualMode.style.display = 'none';
            targetMode.style.display = 'none';
            updateItraEffortDisplay();
        });
    }
    
    // Setup ITRA mode specific handlers
    setupItraMode();
}

// ITRA Mode setup and functions
function setupItraMode() {
    // Tab switching
    const directTab = document.getElementById('itraDirectTab');
    const calcTab = document.getElementById('itraCalcTab');
    const directInput = document.getElementById('itraDirectInput');
    const calcInput = document.getElementById('itraCalcInput');
    
    if (directTab && calcTab) {
        directTab.addEventListener('click', () => {
            directTab.classList.add('active');
            calcTab.classList.remove('active');
            directInput.style.display = 'block';
            calcInput.style.display = 'none';
        });
        
        calcTab.addEventListener('click', () => {
            calcTab.classList.add('active');
            directTab.classList.remove('active');
            calcInput.style.display = 'block';
            directInput.style.display = 'none';
        });
    }
    
    // ITRA score input - update level indicator
    const itraScoreInput = document.getElementById('itraScore');
    if (itraScoreInput) {
        itraScoreInput.addEventListener('input', () => {
            updateItraLevel(parseInt(itraScoreInput.value));
            updateItraEstimate();
        });
    }
    
    // Calculate ITRA from past race
    const calcItraBtn = document.getElementById('calcItraBtn');
    if (calcItraBtn) {
        calcItraBtn.addEventListener('click', calculateItraFromRace);
    }
    
    // Use calculated ITRA button
    const useCalcItra = document.getElementById('useCalcItra');
    if (useCalcItra) {
        useCalcItra.addEventListener('click', () => {
            const calcValue = document.getElementById('calcItraValue').textContent;
            if (calcValue && calcValue !== '-') {
                document.getElementById('itraScore').value = parseInt(calcValue);
                updateItraLevel(parseInt(calcValue));
                updateItraEstimate();
                // Switch to direct input tab
                document.getElementById('itraDirectTab').click();
            }
        });
    }
    
    // Update estimate when ratios change
    const uphillRatio = document.getElementById('itraUphillRatio');
    const downhillRatio = document.getElementById('itraDownhillRatio');
    if (uphillRatio) uphillRatio.addEventListener('input', updateItraEstimate);
    if (downhillRatio) downhillRatio.addEventListener('input', updateItraEstimate);
}

// Update ITRA effort display when GPX is loaded
function updateItraEffortDisplay() {
    if (!gpxData) return;
    
    const distanceEl = document.getElementById('itraDistance');
    const elevationEl = document.getElementById('itraElevation');
    const effortEl = document.getElementById('itraEffortPoints');
    
    if (!distanceEl || !elevationEl || !effortEl) return;
    
    const distance = gpxData.totalDistance;
    const elevation = gpxData.elevationGain;
    const effortPoints = calculateEffortPoints(distance, elevation);
    
    distanceEl.textContent = `${distance.toFixed(2)} km`;
    elevationEl.textContent = `${elevation.toFixed(0)} m`;
    effortEl.textContent = effortPoints.toFixed(0);
    
    // Update estimate
    updateItraEstimate();
}

// Calculate ITRA effort points: distance + (elevation / 100)
function calculateEffortPoints(distanceKm, elevationM) {
    return distanceKm + (elevationM / 100);
}

// Update ITRA level indicator text
function updateItraLevel(score) {
    const levelText = document.getElementById('itraLevelText');
    if (!levelText) return;
    
    let level, color;
    if (score >= 800) {
        level = 'Elite';
        color = '#ffd700';
    } else if (score >= 700) {
        level = 'Competitive';
        color = '#00d4ff';
    } else if (score >= 600) {
        level = 'Advanced';
        color = '#4CAF50';
    } else if (score >= 500) {
        level = 'Intermediate';
        color = '#ffa500';
    } else {
        level = 'Beginner';
        color = '#9E9E9E';
    }
    
    levelText.textContent = level;
    levelText.style.color = color;
}

// Calculate ITRA score from past race - uses API to protect formula
async function calculateItraFromRace() {
    const distance = parseFloat(document.getElementById('pastRaceDistance').value);
    const elevation = parseFloat(document.getElementById('pastRaceElevation').value);
    const hours = parseInt(document.getElementById('pastRaceHours').value) || 0;
    const minutes = parseInt(document.getElementById('pastRaceMinutes').value) || 0;
    
    if (isNaN(distance) || distance <= 0 || isNaN(elevation) || elevation < 0) {
        alert('Please enter valid distance and elevation values.');
        return;
    }
    
    if (hours === 0 && minutes === 0) {
        alert('Please enter your finish time.');
        return;
    }
    
    const timeInMinutes = hours * 60 + minutes;
    
    // Call API to calculate ITRA score (formula is protected server-side)
    if (API_CONFIG.useBackend) {
        try {
            const response = await fetch(API_CONFIG.calculateEndpoint.replace('/calculate', '/itra'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    distance: distance,
                    elevation: elevation,
                    timeMinutes: timeInMinutes
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                document.getElementById('calcItraValue').textContent = result.score;
                document.getElementById('calculatedItra').style.display = 'flex';
                
                // Also update the ITRA level indicator
                updateItraLevel(result.score);
                return;
            }
        } catch (error) {
            console.warn('ITRA API failed, using fallback:', error.message);
        }
    }
    
    // Fallback to local calculation (simplified, not the real formula)
    const effortPoints = distance + (elevation / 100);
    const minutesPerPoint = timeInMinutes / effortPoints;
    let estimatedScore = Math.round(2800 / minutesPerPoint); // Slightly different from real formula
    estimatedScore = Math.max(350, Math.min(950, estimatedScore));
    
    document.getElementById('calcItraValue').textContent = estimatedScore;
    document.getElementById('calculatedItra').style.display = 'flex';
}

// Update ITRA estimated time
function updateItraEstimate() {
    if (!gpxData) return;
    
    const itraScore = parseInt(document.getElementById('itraScore')?.value) || 550;
    const distance = gpxData.totalDistance;
    const elevation = gpxData.elevationGain;
    const effortPoints = calculateEffortPoints(distance, elevation);
    
    // Calculate time based on ITRA score
    // Higher score = less minutes per effort point
    const minutesPerPoint = 3000 / itraScore;
    const totalMinutes = effortPoints * minutesPerPoint;
    
    // Add stop times from AID stations
    const totalStopTime = aidStations.reduce((sum, s) => sum + (s.stopMin || 0), 0);
    const finalTime = totalMinutes + totalStopTime;
    
    // Display
    const resultDiv = document.getElementById('itraResult');
    const timeEl = document.getElementById('itraEstimatedTime');
    const paceEl = document.getElementById('itraAvgPace');
    
    if (resultDiv && timeEl && paceEl) {
        resultDiv.style.display = 'block';
        timeEl.textContent = formatTime(finalTime);
        
        const avgPace = totalMinutes / distance;
        paceEl.textContent = `${formatPace(avgPace)} /km`;
    }
}

// Calculate paces from ITRA score - uses cached values from API
function calculatePacesFromItra() {
    // Return cached paces if available (set by API)
    if (lastCalculatedPaces) {
        return {
            flatPace: lastCalculatedPaces.flat,
            uphillPace: lastCalculatedPaces.uphill,
            downhillPace: lastCalculatedPaces.downhill
        };
    }
    // Default fallback
    return { flatPace: 6.5, uphillPace: 8.5, downhillPace: 5.5 };
}

// AID Stations setup
function setupAidStations() {
    const addBtn = document.getElementById('addAidStation');
    const kmInput = document.getElementById('aidStationKm');
    const nameInput = document.getElementById('aidStationName');
    const stopTimeInput = document.getElementById('aidStationStopTime');
    
    if (!addBtn) {
        console.error('AID station button not found');
        return;
    }
    
    // Remove any existing listeners by cloning
    const newBtn = addBtn.cloneNode(true);
    addBtn.parentNode.replaceChild(newBtn, addBtn);
    
    newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Disable adding AID stations in demo mode
        if (isDemoMode) {
            alert('Adding AID stations is disabled in demo mode. Upload your own GPX or use an access code to load races!');
            return;
        }
        
        const km = parseFloat(kmInput.value);
        const name = nameInput.value.trim() || `AID ${aidStations.length + 1}`;
        const stopMin = parseInt(stopTimeInput.value) || 2; // Default 2 min stop
        
        if (isNaN(km) || km < 0) {
            alert('Please enter a valid kilometer position.');
            return;
        }
        
        // Add to array with stop time
        aidStations.push({ km, name, stopMin });
        
        // Sort by km
        aidStations.sort((a, b) => a.km - b.km);
        
        // Render list
        renderAidStations();
        
        // Clear inputs (keep default stop time)
        kmInput.value = '';
        nameInput.value = '';
        stopTimeInput.value = '2';
        
        // Focus back on km input for next entry
        kmInput.focus();
    });
    
    // Add AID station on Enter key in any input field
    const handleEnter = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            newBtn.click();
        }
    };
    
    if (kmInput) kmInput.addEventListener('keypress', handleEnter);
    if (nameInput) nameInput.addEventListener('keypress', handleEnter);
    if (stopTimeInput) stopTimeInput.addEventListener('keypress', handleEnter);
}

function renderAidStations() {
    console.log('renderAidStations called, aidStations:', aidStations.length, aidStations);
    const list = document.getElementById('aidStationsList');
    const addBtn = document.getElementById('addAidStation');
    if (!list) return;
    
    // Disable add button in demo mode
    if (addBtn) {
        addBtn.disabled = isDemoMode;
        addBtn.title = isDemoMode ? 'Disabled in demo mode' : 'Add AID station';
    }
    
    // Sort AID stations by km for proper leg calculation
    const sortedStations = [...aidStations].sort((a, b) => a.km - b.km);
    
    // Build legs between stations (including start and finish)
    const legs = [];
    if (gpxData && sortedStations.length > 0) {
        // Start → First AID
        const firstStation = sortedStations[0];
        legs.push({
            from: 'Start',
            to: firstStation.name,
            fromKm: 0,
            toKm: firstStation.km
        });
        
        // Between AID stations
        for (let i = 0; i < sortedStations.length - 1; i++) {
            legs.push({
                from: sortedStations[i].name,
                to: sortedStations[i + 1].name,
                fromKm: sortedStations[i].km,
                toKm: sortedStations[i + 1].km
            });
        }
        
        // Last AID → Finish
        const lastStation = sortedStations[sortedStations.length - 1];
        legs.push({
            from: lastStation.name,
            to: 'Finish',
            fromKm: lastStation.km,
            toKm: gpxData.totalDistance
        });
    }
    
    // Render stations with leg info
    list.innerHTML = aidStations.map((station, index) => {
        // Find the leg ending at this station
        const legIndex = sortedStations.findIndex(s => s.km === station.km);
        let legInfo = '';
        
        if (gpxData && legIndex >= 0 && legIndex < legs.length) {
            const leg = legs[legIndex];
            const distance = leg.toKm - leg.fromKm;
            const elevFrom = getElevationAtDistance(leg.fromKm);
            const elevTo = getElevationAtDistance(leg.toKm);
            const elevGain = calculateElevationGainBetween(leg.fromKm, leg.toKm);
            const elevLoss = calculateElevationLossBetween(leg.fromKm, leg.toKm);
            
            legInfo = `
                <div class="aid-station-leg">
                    <span class="leg-distance">↔ ${distance.toFixed(1)} km from ${leg.from}</span>
                    <span class="leg-elevation">⬆️ ${elevGain.toFixed(0)}m ⬇️ ${elevLoss.toFixed(0)}m</span>
                </div>
            `;
        }
        
        return `
            <div class="aid-station-item" id="aid-station-${index}">
                <div class="aid-station-info">
                    <span class="aid-station-km">KM ${station.km}</span>
                    <span class="aid-station-name">${station.name}</span>
                    <span class="aid-station-stop ${currentRaceConfig ? 'editable' : ''}" 
                          ${currentRaceConfig ? `onclick="editStopTime(${index})" title="Click to edit stop time"` : ''}>
                        (${station.stopMin || 0} min stop)
                    </span>
                </div>
                ${legInfo}
                ${(isDemoMode || currentRaceConfig) ? '' : `
                <div class="aid-station-actions">
                    <button type="button" class="edit-aid-btn" onclick="editAidStation(${index})" title="Edit">✏️</button>
                    <button type="button" class="remove-aid-btn" onclick="removeAidStation(${index})" title="Remove">×</button>
                </div>
                `}
            </div>
        `;
    }).join('');
    
    // Render final leg summary (last AID → Finish)
    if (gpxData && legs.length > 0) {
        const finalLeg = legs[legs.length - 1];
        const distance = finalLeg.toKm - finalLeg.fromKm;
        const elevGain = calculateElevationGainBetween(finalLeg.fromKm, finalLeg.toKm);
        const elevLoss = calculateElevationLossBetween(finalLeg.fromKm, finalLeg.toKm);
        
        list.innerHTML += `
            <div class="aid-station-item final-leg">
                <div class="aid-station-info">
                    <span class="aid-station-km">🏁 Finish</span>
                    <span class="aid-station-name">${gpxData.totalDistance.toFixed(1)} km</span>
                </div>
                <div class="aid-station-leg">
                    <span class="leg-distance">↔ ${distance.toFixed(1)} km from ${finalLeg.from}</span>
                    <span class="leg-elevation">⬆️ ${elevGain.toFixed(0)}m ⬇️ ${elevLoss.toFixed(0)}m</span>
                </div>
            </div>
        `;
    }
}

// Get elevation at a specific distance along the route
function getElevationAtDistance(distanceKm) {
    if (!gpxData || gpxData.points.length === 0) return 0;
    
    // Find the two points surrounding this distance
    for (let i = 0; i < gpxData.points.length - 1; i++) {
        const p1 = gpxData.points[i];
        const p2 = gpxData.points[i + 1];
        
        if (p1.distance <= distanceKm && p2.distance >= distanceKm) {
            // Interpolate elevation
            const ratio = (distanceKm - p1.distance) / (p2.distance - p1.distance);
            return (p1.elevation || 0) + ratio * ((p2.elevation || 0) - (p1.elevation || 0));
        }
    }
    
    // Return last point elevation if beyond route
    return gpxData.points[gpxData.points.length - 1].elevation || 0;
}

// Calculate elevation gain between two distances (with smoothing to match GPX parsing)
function calculateElevationGainBetween(fromKm, toKm) {
    if (!gpxData) return 0;
    
    // Use same smoothing algorithm as calculateElevationWithSmoothing
    const SEGMENT_DISTANCE = 0.05; // km (50 meters)
    const MIN_CHANGE_THRESHOLD = 1; // minimum meters to count
    
    // Get points in range and group into 50m segments
    const segmentElevations = [];
    let segmentStart = fromKm;
    let segmentSum = 0;
    let segmentCount = 0;
    
    for (const point of gpxData.points) {
        if (point.distance < fromKm) continue;
        if (point.distance > toKm) break;
        if (point.elevation === null) continue;
        
        segmentSum += point.elevation;
        segmentCount++;
        
        // Check if we've covered enough distance for a new segment
        if (point.distance - segmentStart >= SEGMENT_DISTANCE && segmentCount > 0) {
            segmentElevations.push(segmentSum / segmentCount);
            segmentStart = point.distance;
            segmentSum = 0;
            segmentCount = 0;
        }
    }
    
    // Don't forget the last segment
    if (segmentCount > 0) {
        segmentElevations.push(segmentSum / segmentCount);
    }
    
    // Calculate gain between smoothed segment averages
    let gain = 0;
    for (let i = 1; i < segmentElevations.length; i++) {
        const change = segmentElevations[i] - segmentElevations[i - 1];
        if (change >= MIN_CHANGE_THRESHOLD) {
            gain += change;
        }
    }
    
    return gain;
}

// Calculate elevation loss between two distances (with smoothing to match GPX parsing)
function calculateElevationLossBetween(fromKm, toKm) {
    if (!gpxData) return 0;
    
    // Use same smoothing algorithm as calculateElevationWithSmoothing
    const SEGMENT_DISTANCE = 0.05; // km (50 meters)
    const MIN_CHANGE_THRESHOLD = 1; // minimum meters to count
    
    // Get points in range and group into 50m segments
    const segmentElevations = [];
    let segmentStart = fromKm;
    let segmentSum = 0;
    let segmentCount = 0;
    
    for (const point of gpxData.points) {
        if (point.distance < fromKm) continue;
        if (point.distance > toKm) break;
        if (point.elevation === null) continue;
        
        segmentSum += point.elevation;
        segmentCount++;
        
        // Check if we've covered enough distance for a new segment
        if (point.distance - segmentStart >= SEGMENT_DISTANCE && segmentCount > 0) {
            segmentElevations.push(segmentSum / segmentCount);
            segmentStart = point.distance;
            segmentSum = 0;
            segmentCount = 0;
        }
    }
    
    // Don't forget the last segment
    if (segmentCount > 0) {
        segmentElevations.push(segmentSum / segmentCount);
    }
    
    // Calculate loss between smoothed segment averages
    let loss = 0;
    for (let i = 1; i < segmentElevations.length; i++) {
        const change = segmentElevations[i] - segmentElevations[i - 1];
        if (change <= -MIN_CHANGE_THRESHOLD) {
            loss += Math.abs(change);
        }
    }
    
    return loss;
}

function removeAidStation(index) {
    if (isDemoMode) {
        alert('Editing AID stations is disabled in demo mode.');
        return;
    }
    aidStations.splice(index, 1);
    renderAidStations();
}

// Edit stop time inline (for race mode)
function editStopTime(index) {
    const station = aidStations[index];
    if (!station) return;
    
    const item = document.getElementById(`aid-station-${index}`);
    if (!item) return;
    
    const stopSpan = item.querySelector('.aid-station-stop');
    if (!stopSpan || stopSpan.querySelector('input')) return; // Already editing
    
    const currentMin = station.stopMin || 0;
    
    // Replace with input
    stopSpan.innerHTML = `
        <input type="number" class="stop-time-input" value="${currentMin}" min="0" max="60" step="1">
        <span>min</span>
    `;
    stopSpan.onclick = null; // Disable click while editing
    
    const input = stopSpan.querySelector('input');
    input.focus();
    input.select();
    
    const saveStopTime = () => {
        const newMin = parseInt(input.value) || 0;
        aidStations[index].stopMin = Math.max(0, Math.min(60, newMin));
        renderAidStations();
        calculateRacePlan();
    };
    
    input.addEventListener('blur', saveStopTime);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveStopTime();
        } else if (e.key === 'Escape') {
            renderAidStations(); // Cancel edit
        }
    });
}

function editAidStation(index) {
    if (isDemoMode) {
        alert('Editing AID stations is disabled in demo mode.');
        return;
    }
    const station = aidStations[index];
    if (!station) return;
    
    const item = document.getElementById(`aid-station-${index}`);
    if (!item) return;
    
    // Replace content with edit form
    item.innerHTML = `
        <div class="aid-station-edit-form">
            <div class="edit-row">
                <label>KM:</label>
                <input type="number" id="edit-km-${index}" value="${station.km}" step="0.1" min="0">
            </div>
            <div class="edit-row">
                <label>Name:</label>
                <input type="text" id="edit-name-${index}" value="${station.name}">
            </div>
            <div class="edit-row">
                <label>Stop (min):</label>
                <input type="number" id="edit-stop-${index}" value="${station.stopMin || 0}" min="0">
            </div>
            <div class="edit-actions">
                <button type="button" class="save-edit-btn" onclick="saveAidStation(${index})">Save</button>
                <button type="button" class="cancel-edit-btn" onclick="renderAidStations()">Cancel</button>
            </div>
        </div>
    `;
    
    // Focus on name input
    document.getElementById(`edit-name-${index}`).focus();
}

function saveAidStation(index) {
    const km = parseFloat(document.getElementById(`edit-km-${index}`).value);
    const name = document.getElementById(`edit-name-${index}`).value.trim();
    const stopMin = parseInt(document.getElementById(`edit-stop-${index}`).value) || 0;
    
    if (isNaN(km) || km < 0) {
        alert('Please enter a valid kilometer value.');
        return;
    }
    
    if (!name) {
        alert('Please enter a station name.');
        return;
    }
    
    aidStations[index] = { km, name, stopMin };
    renderAidStations();
}

// Make removeAidStation available globally
window.removeAidStation = removeAidStation;
window.editAidStation = editAidStation;
window.saveAidStation = saveAidStation;
window.renderAidStations = renderAidStations;

// Hero AID Stations (Strategy Box version)
function setupHeroAidStations() {
    const toggle = document.getElementById('heroAidToggle');
    const content = document.getElementById('heroAidContent');
    const addBtn = document.getElementById('heroAidAdd');
    const kmInput = document.getElementById('heroAidKm');
    const nameInput = document.getElementById('heroAidName');
    const stopInput = document.getElementById('heroAidStop');
    
    if (!toggle || !content) return;
    
    // Toggle expand/collapse
    toggle.addEventListener('click', () => {
        const isExpanded = content.style.display !== 'none';
        content.style.display = isExpanded ? 'none' : 'block';
        toggle.classList.toggle('expanded', !isExpanded);
    });
    
    // Function to add AID station
    const addAidStation = () => {
        // Block adding in demo mode
        if (isDemoMode) {
            return;
        }
        
        const km = parseFloat(kmInput.value);
        const name = nameInput.value.trim() || `AID ${aidStations.length + 1}`;
        const stopMin = parseInt(stopInput?.value) || 2;
        
        if (isNaN(km) || km < 0) {
            return;
        }
        
        // Add to main aidStations array
        aidStations.push({ km, name, stopMin });
        aidStations.sort((a, b) => a.km - b.km);
        
        // Render both lists
        renderHeroAidList();
        renderAidStations();
        
        // Clear inputs (keep default stop time)
        kmInput.value = '';
        nameInput.value = '';
        if (stopInput) stopInput.value = '2';
        
        // Focus back on km input for next entry
        kmInput.focus();
    };
    
    // Add AID station on button click
    if (addBtn) {
        addBtn.addEventListener('click', addAidStation);
    }
    
    // Add AID station on Enter key in any input field
    const handleEnter = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addAidStation();
        }
    };
    
    if (kmInput) kmInput.addEventListener('keypress', handleEnter);
    if (nameInput) nameInput.addEventListener('keypress', handleEnter);
    if (stopInput) stopInput.addEventListener('keypress', handleEnter);
}

// Render hero AID stations list
function renderHeroAidList() {
    const list = document.getElementById('heroAidList');
    const addBtn = document.getElementById('heroAidAdd');
    const kmInput = document.getElementById('heroAidKm');
    const nameInput = document.getElementById('heroAidName');
    const stopInput = document.getElementById('heroAidStop');
    
    // Disable add form in demo mode
    if (addBtn) {
        addBtn.disabled = isDemoMode;
        addBtn.title = isDemoMode ? 'Disabled in demo mode' : 'Add AID station';
    }
    [kmInput, nameInput, stopInput].forEach(input => {
        if (input) {
            input.disabled = isDemoMode;
            if (isDemoMode) input.placeholder = 'Demo mode';
        }
    });
    
    if (!list) return;
    
    if (aidStations.length === 0) {
        list.innerHTML = '';
        return;
    }
    
    list.innerHTML = aidStations.map((station, index) => `
        <div class="hero-aid-item" id="heroAidItem${index}">
            <div class="hero-aid-item-info">
                <span class="hero-aid-item-km">KM ${station.km.toFixed(1)}</span>
                <span class="hero-aid-item-name">${station.name}</span>
                <span class="hero-aid-item-stop">${station.stopMin || 2} min</span>
            </div>
            ${isDemoMode ? '' : `
            <div class="hero-aid-item-actions">
                <button class="hero-aid-item-edit" onclick="editHeroAidStation(${index})" title="Edit">✏️</button>
                <button class="hero-aid-item-remove" onclick="removeHeroAidStation(${index})" title="Remove">✕</button>
            </div>
            `}
        </div>
    `).join('');
}

// Edit AID station inline
function editHeroAidStation(index) {
    const station = aidStations[index];
    const itemEl = document.getElementById(`heroAidItem${index}`);
    if (!itemEl || !station) return;
    
    // Replace with edit form
    itemEl.innerHTML = `
        <div class="hero-aid-edit-form">
            <input type="number" class="hero-aid-km" value="${station.km}" min="0" step="0.1" id="editKm${index}" />
            <input type="text" class="hero-aid-name" value="${station.name}" id="editName${index}" />
            <input type="number" class="hero-aid-stop" value="${station.stopMin || 2}" min="0" max="60" id="editStop${index}" />
            <button class="hero-aid-save-btn" onclick="saveHeroAidStation(${index})">✓</button>
            <button class="hero-aid-cancel-btn" onclick="renderHeroAidList()">✕</button>
        </div>
    `;
    
    // Focus km input
    document.getElementById(`editKm${index}`)?.focus();
}

// Save edited AID station
function saveHeroAidStation(index) {
    const km = parseFloat(document.getElementById(`editKm${index}`)?.value);
    const name = document.getElementById(`editName${index}`)?.value.trim() || `AID ${index + 1}`;
    const stopMin = parseInt(document.getElementById(`editStop${index}`)?.value) || 2;
    
    if (isNaN(km) || km < 0) return;
    
    aidStations[index] = { km, name, stopMin };
    aidStations.sort((a, b) => a.km - b.km);
    
    renderHeroAidList();
    renderAidStations();
}

// Remove AID station from hero list
function removeHeroAidStation(index) {
    aidStations.splice(index, 1);
    renderHeroAidList();
    renderAidStations();
}

window.removeHeroAidStation = removeHeroAidStation;
window.editHeroAidStation = editHeroAidStation;
window.saveHeroAidStation = saveHeroAidStation;

function getAidStationForKm(km) {
    // Find AID station that falls within or at this km
    return aidStations.find(station => 
        Math.floor(station.km) === km || 
        (station.km > km - 1 && station.km <= km)
    );
}

function getPaceInMinutes(minInput, secInput) {
    const min = parseInt(minInput.value) || 0;
    const sec = parseInt(secInput.value) || 0;
    return min + sec / 60;
}

// Apply runner level paces to manual inputs
async function applyRunnerLevelPaces() {
    let flatPace, uphillPace, downhillPace;
    
    if (activeItraScore !== null) {
        // Use ITRA-derived paces from API (protected business logic)
        const itraPaces = await fetchItraPaces(activeItraScore);
        flatPace = itraPaces.flatPace;
        uphillPace = itraPaces.uphillPace || (flatPace * itraPaces.uphillRatio);
        downhillPace = itraPaces.downhillPace || (flatPace * itraPaces.downhillRatio);
    } else {
        // Use runner level preset
        const levelSelect = document.getElementById('runnerLevel');
        const level = levelSelect ? levelSelect.value : 'intermediate';
        const preset = RUNNER_LEVELS[level] || RUNNER_LEVELS.intermediate;
        
        flatPace = preset.flatPace;
        uphillPace = flatPace * preset.uphillRatio;
        downhillPace = flatPace * preset.downhillRatio;
    }
    
    // Update manual pace inputs
    const flatMin = document.getElementById('flatPaceMin');
    const flatSec = document.getElementById('flatPaceSec');
    const uphillMin = document.getElementById('uphillPaceMin');
    const uphillSec = document.getElementById('uphillPaceSec');
    const downhillMin = document.getElementById('downhillPaceMin');
    const downhillSec = document.getElementById('downhillPaceSec');
    
    if (flatMin && flatSec) {
        flatMin.value = Math.floor(flatPace);
        flatSec.value = Math.round((flatPace % 1) * 60);
    }
    if (uphillMin && uphillSec) {
        uphillMin.value = Math.floor(uphillPace);
        uphillSec.value = Math.round((uphillPace % 1) * 60);
    }
    if (downhillMin && downhillSec) {
        downhillMin.value = Math.floor(downhillPace);
        downhillSec.value = Math.round((downhillPace % 1) * 60);
    }
}

function formatTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    const seconds = Math.round((totalMinutes % 1) * 60);
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatPace(paceMinutes) {
    const min = Math.floor(paceMinutes);
    const sec = Math.round((paceMinutes % 1) * 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
}

function formatClockTime(totalMinutes) {
    // Handle overflow past 24 hours
    let hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = Math.floor(totalMinutes % 60);
    const seconds = Math.round((totalMinutes % 1) * 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Calculate sunrise/sunset times using solar position algorithm
function calculateSunTimes(lat, lon, date) {
    // Convert degrees to radians
    const toRad = (deg) => deg * Math.PI / 180;
    const toDeg = (rad) => rad * 180 / Math.PI;
    
    // Get day of year
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    // Solar declination angle
    const declination = toRad(-23.45 * Math.cos(toRad(360 / 365 * (dayOfYear + 10))));
    
    // Hour angle at sunrise/sunset (when sun is at -0.833 degrees for atmospheric refraction)
    const latRad = toRad(lat);
    const zenith = toRad(90.833); // 90° + 50' for refraction
    
    const cosHourAngle = (Math.cos(zenith) - Math.sin(latRad) * Math.sin(declination)) / 
                         (Math.cos(latRad) * Math.cos(declination));
    
    // Check for polar day/night
    if (cosHourAngle > 1) {
        // Sun never rises (polar night)
        return { sunrise: null, sunset: null, polarNight: true };
    }
    if (cosHourAngle < -1) {
        // Sun never sets (midnight sun)
        return { sunrise: null, sunset: null, midnightSun: true };
    }
    
    const hourAngle = toDeg(Math.acos(cosHourAngle));
    
    // Equation of time (approximation)
    const B = toRad(360 / 365 * (dayOfYear - 81));
    const eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
    
    // Get timezone offset from browser (handles DST automatically)
    // getTimezoneOffset returns minutes, negative for east of UTC
    const browserOffsetHours = -date.getTimezoneOffset() / 60;
    
    // Time offset for longitude (4 minutes per degree from timezone meridian)
    const timezoneMeridian = browserOffsetHours * 15;
    const timeOffset = 4 * (lon - timezoneMeridian) + eot;
    
    // Solar noon in local time
    const solarNoon = 12 * 60 - timeOffset; // in minutes
    
    // Sunrise and sunset times in minutes from midnight (local time)
    const sunriseMinutes = solarNoon - hourAngle * 4;
    const sunsetMinutes = solarNoon + hourAngle * 4;
    
    return {
        sunrise: Math.max(0, Math.min(24 * 60, sunriseMinutes)),
        sunset: Math.max(0, Math.min(24 * 60, sunsetMinutes)),
        polarNight: false,
        midnightSun: false
    };
}

// Format minutes to HH:MM string
function formatSunTime(minutes) {
    if (minutes === null) return '--:--';
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Update sun times display based on route center and selected date
function updateSunTimesDisplay() {
    const dateInput = document.getElementById('raceStartDate');
    const sunTimesContainer = document.getElementById('sunTimes');
    
    if (!dateInput || !sunTimesContainer || !gpxData) return;
    
    const dateValue = dateInput.value;
    if (!dateValue) {
        sunTimesContainer.style.display = 'none';
        sunTimes = null;
        return;
    }
    
    // Get center point of the route for sun calculations
    const points = gpxData.points;
    const midIndex = Math.floor(points.length / 2);
    const lat = points[midIndex].lat;
    const lon = points[midIndex].lon;
    
    // Parse the date (YYYY-MM-DD format)
    const [year, month, day] = dateValue.split('-').map(Number);
    const raceDate = new Date(year, month - 1, day);
    
    // Calculate sun times
    sunTimes = calculateSunTimes(lat, lon, raceDate);
    
    // Update display
    const sunriseSpan = document.getElementById('sunriseTime');
    const sunsetSpan = document.getElementById('sunsetTime');
    
    if (sunTimes.polarNight) {
        sunriseSpan.textContent = t('sun.polarNight');
        sunsetSpan.textContent = '';
    } else if (sunTimes.midnightSun) {
        sunriseSpan.textContent = t('sun.midnightSun');
        sunsetSpan.textContent = '';
    } else {
        sunriseSpan.textContent = formatSunTime(sunTimes.sunrise);
        sunsetSpan.textContent = formatSunTime(sunTimes.sunset);
    }
    
    sunTimesContainer.style.display = 'flex';
    
    // Also update hero sun times
    updateHeroSunTimes();
    
    // Regenerate splits table to update night sections
    if (segments.length > 0) {
        generateSplitsTable();
    }
}

// Update hero section sun times display
function updateHeroSunTimes() {
    const heroSunTimes = document.getElementById('heroSunTimes');
    const heroSunrise = document.getElementById('heroSunriseTime');
    const heroSunset = document.getElementById('heroSunsetTime');
    
    if (!heroSunTimes || !heroSunrise || !heroSunset) return;
    
    if (!sunTimes) {
        heroSunTimes.style.display = 'none';
        return;
    }
    
    if (sunTimes.polarNight) {
        heroSunrise.textContent = t('sun.polarNight');
        heroSunset.textContent = '';
    } else if (sunTimes.midnightSun) {
        heroSunrise.textContent = t('sun.midnightSun');
        heroSunset.textContent = '';
    } else {
        heroSunrise.textContent = formatSunTime(sunTimes.sunrise);
        heroSunset.textContent = formatSunTime(sunTimes.sunset);
    }
    
    heroSunTimes.style.display = 'inline-flex';
}

// Update Hero Night Running Widget
function updateHeroNightWidget() {
    const widget = document.getElementById('heroNightWidget');
    const statsContainer = document.getElementById('heroNightStats');
    
    if (!widget || !statsContainer) return;
    
    // Need sun times and race data
    if (!sunTimes || !gpxData || segments.length === 0 || sunTimes.midnightSun) {
        widget.style.display = 'none';
        return;
    }
    
    // Get start time from DOM
    const startTimeInput = document.getElementById('raceStartTime');
    if (!startTimeInput || !startTimeInput.value) {
        widget.style.display = 'none';
        return;
    }
    const [startHours, startMinutes] = startTimeInput.value.split(':').map(Number);
    const startTimeInMinutes = startHours * 60 + startMinutes;
    
    // Get paces from cache or defaults
    const flatPace = lastCalculatedPaces?.flat || 6.5;
    const uphillPace = lastCalculatedPaces?.uphill || 8.5;
    const downhillPace = lastCalculatedPaces?.downhill || 5.5;
    
    // Calculate night sections by traversing the course
    const nightSections = [];
    let currentNightSection = null;
    let cumulativeTime = 0;
    let totalNightDistance = 0;
    
    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const segmentMidKm = (segment.startDistance + segment.endDistance) / 2;
        
        // Calculate pace for this segment
        const gradientMultiplier = getGradientPaceMultiplier(segment.grade, flatPace, uphillPace, downhillPace);
        const segmentPace = flatPace * gradientMultiplier;
        const segmentTime = segment.distance * segmentPace;
        
        // Clock time at segment start
        const clockTimeAtSegment = startTimeInMinutes + cumulativeTime;
        const isNight = isNightTime(clockTimeAtSegment % 1440); // mod 1440 for multi-day
        
        if (isNight) {
            totalNightDistance += segment.distance;
            if (!currentNightSection) {
                currentNightSection = { startKm: segment.startDistance, endKm: segment.endDistance };
            } else {
                currentNightSection.endKm = segment.endDistance;
            }
        } else {
            if (currentNightSection) {
                nightSections.push(currentNightSection);
                currentNightSection = null;
            }
        }
        
        cumulativeTime += segmentTime;
    }
    
    // Close last night section if still open
    if (currentNightSection) {
        nightSections.push(currentNightSection);
    }
    
    // If no night running, hide widget
    if (totalNightDistance < 0.5) {
        widget.style.display = 'none';
        return;
    }
    
    const totalDistance = gpxData.totalDistance;
    const nightPct = Math.round((totalNightDistance / totalDistance) * 100);
    
    // Calculate dominant surface for penalty info
    let trailDist = 0, techDist = 0, roadDist = 0;
    segments.forEach(s => {
        if (s.surfaceType === 'trail') trailDist += s.distance;
        else if (s.surfaceType === 'technical') techDist += s.distance;
        else if (s.surfaceType === 'road') roadDist += s.distance;
    });
    
    let penaltyInfo = '+8%';
    if (techDist > trailDist && techDist > roadDist) penaltyInfo = '+12%';
    else if (roadDist > trailDist && roadDist > techDist) penaltyInfo = '+5%';
    
    // Format night sections as km ranges
    const sectionStrings = nightSections.map(s => 
        `${Math.round(s.startKm)}-${Math.round(s.endKm)} km`
    );
    
    let html = `
        <div class="hero-night-stat">
            <span class="hero-night-stat-label">${t('night.distance')}</span>
            <span class="hero-night-stat-value">${totalNightDistance.toFixed(1)} km (${nightPct}%)</span>
        </div>
        <div class="hero-night-stat">
            <span class="hero-night-stat-label">${t('night.penalty')}</span>
            <span class="hero-night-stat-value">${penaltyInfo}</span>
        </div>
    `;
    
    if (sectionStrings.length > 0 && sectionStrings.length <= 4) {
        html += `<div class="hero-night-sections">${sectionStrings.join(' • ')}</div>`;
    } else if (sectionStrings.length > 4) {
        // Show first and last section only
        html += `<div class="hero-night-sections">${sectionStrings[0]} ... ${sectionStrings[sectionStrings.length - 1]}</div>`;
    }
    
    statsContainer.innerHTML = html;
    widget.style.display = 'flex';
}

// Check if a given clock time (in minutes from midnight) is during night
function isNightTime(clockMinutes) {
    if (!sunTimes || sunTimes.polarNight) return true;
    if (sunTimes.midnightSun) return false;
    
    // Night includes twilight buffer (45 min before sunrise, 45 min after sunset)
    const effectiveSunrise = sunTimes.sunrise - TWILIGHT_BUFFER;
    const effectiveSunset = sunTimes.sunset + TWILIGHT_BUFFER;
    return clockMinutes < effectiveSunrise || clockMinutes > effectiveSunset;
}

function calculateTerrainDistances() {
    let flatDistance = 0, uphillDistance = 0, downhillDistance = 0;
    
    segments.forEach(segment => {
        switch (segment.terrainType) {
            case 'flat':
                flatDistance += segment.distance;
                break;
            case 'uphill':
                uphillDistance += segment.distance;
                break;
            case 'downhill':
                downhillDistance += segment.distance;
                break;
        }
    });
    
    return { flatDistance, uphillDistance, downhillDistance };
}

// Estimate total time given paces (client-side calculation)
function estimateTotalTimeFromPaces(flatPace, uphillRatio, downhillRatio) {
    const { flatDistance, uphillDistance, downhillDistance } = calculateTerrainDistances();
    
    const flatTime = flatDistance * flatPace;
    const uphillTime = uphillDistance * flatPace * uphillRatio;
    const downhillTime = downhillDistance * flatPace * downhillRatio;
    
    let runningTime = flatTime + uphillTime + downhillTime;
    
    // Apply fatigue multiplier based on total distance
    const totalDist = gpxData?.totalDistance || 0;
    let fatigue = 1.0;
    if (totalDist > 130) fatigue = 1.50;
    else if (totalDist > 100) fatigue = 1.32;
    else if (totalDist > 80) fatigue = 1.25;
    else if (totalDist > 65) fatigue = 1.18;
    else if (totalDist > 50) fatigue = 1.12;
    else if (totalDist > 42) fatigue = 1.05;
    else if (totalDist > 21) fatigue = 1.02;
    
    runningTime *= fatigue;
    
    // Add AID station stop times
    const totalStopTime = aidStations.reduce((sum, s) => sum + (s.stopMin || 0), 0);
    
    return runningTime + totalStopTime;
}

// Find flat pace that achieves target time (binary search)
function findFlatPaceForTargetTime(targetTimeMinutes, uphillRatio, downhillRatio) {
    let minPace = 3.0;  // 3:00/km (very fast)
    let maxPace = 15.0; // 15:00/km (very slow)
    const tolerance = 0.5; // Within 0.5 minutes accuracy
    
    for (let i = 0; i < 50; i++) {
        const midPace = (minPace + maxPace) / 2;
        const estimatedTime = estimateTotalTimeFromPaces(midPace, uphillRatio, downhillRatio);
        
        if (Math.abs(estimatedTime - targetTimeMinutes) < tolerance) {
            return midPace;
        }
        
        if (estimatedTime > targetTimeMinutes) {
            maxPace = midPace; // Need faster pace
        } else {
            minPace = midPace; // Need slower pace
        }
    }
    
    return (minPace + maxPace) / 2;
}

// Pace calculation - uses cached values from API
function calculatePacesFromTargetTime() {
    // Return cached paces if available (set by API)
    if (lastCalculatedPaces) {
        return {
            flatPace: lastCalculatedPaces.flat,
            uphillPace: lastCalculatedPaces.uphill,
            downhillPace: lastCalculatedPaces.downhill
        };
    }
    // Default fallback
    return { flatPace: 6.5, uphillPace: 8.5, downhillPace: 5.5 };
}

// API-based calculation function
async function calculateRacePlanFromAPI() {
    if (!gpxData || segments.length === 0) {
        throw new Error('No GPX data loaded');
    }
    
    // Build request payload
    const surfaceToggle = document.getElementById('surfaceEnabled');
    const applySurface = surfaceToggle ? surfaceToggle.checked : false;
    const startTimeInput = document.getElementById('raceStartTime');
    const startTime = startTimeInput ? startTimeInput.value : '09:00';
    const levelSelect = document.getElementById('runnerLevel');
    const runnerLevel = levelSelect ? levelSelect.value : 'intermediate';
    
    // Prepare segments data for API (include all data needed for DDL calculation)
    const apiSegments = segments.map(seg => ({
        distance: seg.distance,
        terrainType: seg.terrainType,
        surfaceType: seg.surfaceType || 'trail',
        startDistance: seg.startDistance,
        endDistance: seg.endDistance,
        elevationChange: seg.elevationChange || 0,
        grade: seg.grade || 0
    }));
    
    // Prepare AID stations
    const apiAidStations = aidStations.map(station => ({
        km: station.km,
        name: station.name || 'VP',
        stopMin: station.stopMin || 0
    }));
    console.log('calculateRacePlan: aidStations for API:', apiAidStations.length, apiAidStations);
    
    // Build request based on current mode
    const uphillRatioEl = document.getElementById('uphillRatio');
    const downhillRatioEl = document.getElementById('downhillRatio');
    const heroUphillEl = document.getElementById('heroUphillSlider');
    const heroDownhillEl = document.getElementById('heroDownhillSlider');
    
    // Get ratios - prefer hero sliders if they exist and have been touched
    const uphillRatioValue = parseFloat(heroUphillEl?.value) || 
                             parseFloat(uphillRatioEl?.value) || 1.4;
    const downhillRatioValue = parseFloat(heroDownhillEl?.value) || 
                               parseFloat(downhillRatioEl?.value) || 0.85;
    
    const payload = {
        segments: apiSegments,
        runnerLevel: runnerLevel,
        aidStations: apiAidStations,
        applySurface: applySurface,
        startTime: startTime,
        totalDistance: gpxData.totalDistance,
        elevationGain: gpxData.elevationGain || 0,
        mode: currentMode,
        // Always include terrain style ratios from sliders
        uphillRatio: uphillRatioValue,
        downhillRatio: downhillRatioValue
    };
    
    // Add mode-specific data
    if (currentMode === 'manual') {
        payload.manualPaces = {
            flat: getPaceInMinutes(
                document.getElementById('flatPaceMin'),
                document.getElementById('flatPaceSec')
            ),
            uphill: getPaceInMinutes(
                document.getElementById('uphillPaceMin'),
                document.getElementById('uphillPaceSec')
            ),
            downhill: getPaceInMinutes(
                document.getElementById('downhillPaceMin'),
                document.getElementById('downhillPaceSec')
            )
        };
    } else if (currentMode === 'target') {
        // For target mode, we need iterative calculation - handled separately
        // This branch shouldn't be reached directly
        const targetHours = parseInt(document.getElementById('targetHours')?.value) || 0;
        const targetMinutes = parseInt(document.getElementById('targetMinutes')?.value) || 0;
        const targetSeconds = parseInt(document.getElementById('targetSeconds')?.value) || 0;
        const targetTimeMinutes = targetHours * 60 + targetMinutes + targetSeconds / 60;
        
        const uphillRatio = parseFloat(document.getElementById('uphillRatio')?.value) || 1.2;
        const downhillRatio = parseFloat(document.getElementById('downhillRatio')?.value) || 0.9;
        
        // Use initial guess based on simple estimation
        const flatPace = findFlatPaceForTargetTime(targetTimeMinutes, uphillRatio, downhillRatio);
        
        payload.mode = 'manual';
        payload.manualPaces = {
            flat: flatPace,
            uphill: flatPace * uphillRatio,
            downhill: flatPace * downhillRatio
        };
    } else if (currentMode === 'itra') {
        payload.itraScore = parseInt(document.getElementById('itraScore')?.value) || 550;
        payload.uphillRatio = parseFloat(document.getElementById('itraUphillRatio')?.value) || 1.3;
        payload.downhillRatio = parseFloat(document.getElementById('itraDownhillRatio')?.value) || 0.85;
    }
    
    // Call API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
    
    try {
        const response = await fetch(API_CONFIG.calculateEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `API error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('API request timed out');
        }
        throw error;
    }
}

// Iterative API call for target time mode - finds the paces that achieve target
async function calculateRacePlanForTargetTime() {
    const targetHours = parseInt(document.getElementById('targetHours')?.value) || 0;
    const targetMinutes = parseInt(document.getElementById('targetMinutes')?.value) || 0;
    const targetSeconds = parseInt(document.getElementById('targetSeconds')?.value) || 0;
    const targetTimeMinutes = targetHours * 60 + targetMinutes + targetSeconds / 60;
    
    // Get terrain style ratios from slider or hero slider
    const uphillRatio = parseFloat(document.getElementById('uphillRatio')?.value) || 
                        parseFloat(document.getElementById('heroUphillSlider')?.value) || 1.4;
    const downhillRatio = parseFloat(document.getElementById('downhillRatio')?.value) || 
                          parseFloat(document.getElementById('heroDownhillSlider')?.value) || 0.85;
    
    // Build base payload
    const surfaceToggle = document.getElementById('surfaceEnabled');
    const applySurface = surfaceToggle ? surfaceToggle.checked : false;
    const startTimeInput = document.getElementById('raceStartTime');
    const startTime = startTimeInput ? startTimeInput.value : '09:00';
    const levelSelect = document.getElementById('runnerLevel');
    const runnerLevel = levelSelect ? levelSelect.value : 'intermediate';
    
    const apiSegments = segments.map(seg => ({
        distance: seg.distance,
        terrainType: seg.terrainType,
        surfaceType: seg.surfaceType || 'trail',
        startDistance: seg.startDistance,
        endDistance: seg.endDistance,
        elevationChange: seg.elevationChange || 0,
        grade: seg.grade || 0
    }));
    
    const apiAidStations = aidStations.map(station => ({
        km: station.km,
        name: station.name || 'VP',
        stopMin: station.stopMin || 0
    }));
    
    // Binary search to find the right flat pace
    let minPace = 3.0;   // 3:00/km (very fast)
    let maxPace = 15.0;  // 15:00/km (very slow)
    let bestResult = null;
    let bestPace = 6.0;
    const tolerance = 1.0; // Within 1 minute of target
    
    console.log(`Target time: ${targetTimeMinutes.toFixed(0)} min (${targetHours}h ${targetMinutes}m)`);
    
    for (let iteration = 0; iteration < 10; iteration++) {
        const testPace = (minPace + maxPace) / 2;
        
        const payload = {
            segments: apiSegments,
            runnerLevel: runnerLevel,
            aidStations: apiAidStations,
            applySurface: applySurface,
            startTime: startTime,
            totalDistance: gpxData.totalDistance,
            elevationGain: gpxData.elevationGain || 0,
            mode: 'manual',
            uphillRatio: uphillRatio,
            downhillRatio: downhillRatio,
            manualPaces: {
                flat: testPace,
                uphill: testPace * uphillRatio,
                downhill: testPace * downhillRatio
            }
        };
        
        try {
            const response = await fetch(API_CONFIG.calculateEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) throw new Error('API error');
            
            const result = await response.json();
            const actualTime = result.totalTimeMinutes;
            
            console.log(`  Iteration ${iteration + 1}: pace ${testPace.toFixed(2)} → time ${actualTime.toFixed(1)} min`);
            
            if (Math.abs(actualTime - targetTimeMinutes) < tolerance) {
                console.log(`  ✓ Found target pace: ${testPace.toFixed(2)} min/km`);
                return result;
            }
            
            bestResult = result;
            bestPace = testPace;
            
            if (actualTime > targetTimeMinutes) {
                // Too slow, need faster pace (lower number)
                maxPace = testPace;
            } else {
                // Too fast, need slower pace (higher number)
                minPace = testPace;
            }
        } catch (error) {
            console.error('API call failed:', error);
            break;
        }
    }
    
    console.log(`Using best found pace: ${bestPace.toFixed(2)} min/km`);
    return bestResult;
}

// Display results from API response
function displayApiResults(result) {
    const { paces, terrain, totalTimeMinutes, fatigueMultiplier, checkpoints, stopTimeMinutes, ddl, finishClockTime, kmSplits } = result;
    
    console.log('displayApiResults: checkpoints received:', checkpoints?.length, checkpoints);
    
    // Cache API results for use in other functions
    lastCachedCheckpoints = checkpoints;
    lastCachedFatigue = fatigueMultiplier;
    lastCalculatedPaces = { flat: paces.flat, uphill: paces.uphill, downhill: paces.downhill };
    lastCachedKmSplits = kmSplits || null;  // Cache API km splits
    
    // Update the pace info tooltip with actual calculated values
    updatePaceInfoContent();
    
    // Update finish clock time in hero section
    const heroFinishClock = document.getElementById('heroFinishClock');
    if (heroFinishClock && finishClockTime) {
        heroFinishClock.textContent = finishClockTime;
    }
    
    // Show hero results section (hidden until Calculate is clicked)
    const heroResults = document.getElementById('heroResults');
    if (heroResults) {
        heroResults.style.display = 'block';
    }
    
    // Display results (hide paceResults on race pages since hero box shows the result)
    const isRacePage = detectRaceMode();
    if (!isRacePage) {
        document.getElementById('paceResults').style.display = 'block';
    }
    document.getElementById('flatDistance').textContent = `${terrain.flatDistance.toFixed(2)} km`;
    document.getElementById('uphillDistance').textContent = `${terrain.uphillDistance.toFixed(2)} km`;
    document.getElementById('downhillDistance').textContent = `${terrain.downhillDistance.toFixed(2)} km`;
    
    document.getElementById('flatTime').textContent = formatTime(terrain.flatTime);
    document.getElementById('uphillTime').textContent = formatTime(terrain.uphillTime);
    document.getElementById('downhillTime').textContent = formatTime(terrain.downhillTime);
    
    // Display total time (including stop time if any)
    if (stopTimeMinutes > 0) {
        document.getElementById('totalTime').textContent = `${formatTime(totalTimeMinutes)} (incl. ${stopTimeMinutes} min stops)`;
    } else {
        document.getElementById('totalTime').textContent = formatTime(totalTimeMinutes);
    }
    document.getElementById('estimatedTime').textContent = formatTime(totalTimeMinutes);
    
    // Display calculated paces if in target or itra mode
    if (currentMode === 'target' || currentMode === 'itra') {
        const calcPacesDiv = document.getElementById('calculatedPaces');
        if (calcPacesDiv) {
            calcPacesDiv.style.display = 'block';
            document.getElementById('calcFlatPace').textContent = formatPace(paces.flat) + ' /km';
            document.getElementById('calcUphillPace').textContent = formatPace(paces.uphill) + ' /km';
            document.getElementById('calcDownhillPace').textContent = formatPace(paces.downhill) + ' /km';
        }
    }
    
    // Update ITRA estimated time display if in ITRA mode
    if (currentMode === 'itra') {
        const itraResult = document.getElementById('itraResult');
        const itraTimeEl = document.getElementById('itraEstimatedTime');
        const itraPaceEl = document.getElementById('itraAvgPace');
        if (itraResult && itraTimeEl && itraPaceEl) {
            itraResult.style.display = 'block';
            itraTimeEl.textContent = formatTime(totalTimeMinutes);
            const avgPace = totalTimeMinutes / gpxData.totalDistance;
            itraPaceEl.textContent = `${formatPace(avgPace)} /km`;
        }
    }
    
    // Update DDL display from API results
    if (ddl) {
        lastCachedDDL = ddl; // Cache DDL for later use
        const heroDescentLoad = document.getElementById('heroDescentLoad');
        const heroDescentDetail = document.getElementById('heroDescentDetail');
        const heroDescentInsight = document.getElementById('heroDescentInsight');
        
        if (heroDescentLoad && gpxData) {
            const ddlPerKm = ddl.ddlTotal / gpxData.totalDistance;
            heroDescentLoad.textContent = `${Math.round(ddlPerKm)}/km`;
        }
        
        if (heroDescentDetail) {
            if (ddl.fatigueRatio >= 0.8 && ddl.paceLossSeconds >= 5) {
                const text = typeof t === 'function' 
                    ? t('ddl.downhillPaceLoss', { min: ddl.paceLossRange.min, max: ddl.paceLossRange.max })
                    : `Downhill pace loss: +${ddl.paceLossRange.min}-${ddl.paceLossRange.max} sec/km`;
                heroDescentDetail.textContent = text;
            } else {
                heroDescentDetail.textContent = typeof t === 'function' ? t('ddl.noPaceLoss') : 'No pace loss expected';
            }
        }
        
        if (heroDescentInsight) {
            if (ddl.paceLossSeconds >= 25 && ddl.fatigueOnsetKm !== null) {
                const text = typeof t === 'function'
                    ? `⚠ ${t('ddl.expectSlower', { km: Math.round(ddl.fatigueOnsetKm), min: ddl.paceLossRange.min, max: ddl.paceLossRange.max })}`
                    : `⚠ Expect slower descents after KM${Math.round(ddl.fatigueOnsetKm)} (+${ddl.paceLossRange.min}-${ddl.paceLossRange.max} sec/km)`;
                heroDescentInsight.textContent = text;
                heroDescentInsight.className = 'hero-metric-insight warning';
            } else if (ddl.paceLossSeconds >= 10 && ddl.fatigueOnsetKm !== null) {
                const text = typeof t === 'function'
                    ? t('ddl.expectSlower', { km: Math.round(ddl.fatigueOnsetKm), min: ddl.paceLossRange.min, max: ddl.paceLossRange.max })
                    : `Expect slower descents after KM${Math.round(ddl.fatigueOnsetKm)} (+${ddl.paceLossRange.min}-${ddl.paceLossRange.max} sec/km)`;
                heroDescentInsight.textContent = text;
                heroDescentInsight.className = 'hero-metric-insight';
            } else if (ddl.paceLossSeconds >= 5 && ddl.fatigueOnsetKm !== null) {
                const text = typeof t === 'function'
                    ? t('ddl.mildSlowdown', { km: Math.round(ddl.fatigueOnsetKm) })
                    : `Mild downhill slowdown after KM${Math.round(ddl.fatigueOnsetKm)}`;
                heroDescentInsight.textContent = text;
                heroDescentInsight.className = 'hero-metric-insight';
            } else {
                heroDescentInsight.textContent = '';
            }
        }
    }
    
    // Generate splits table using returned paces and total time
    generateSplitsTable(paces.flat, paces.uphill, paces.downhill, totalTimeMinutes);
    
    // Update Hero section
    updateHeroSection(totalTimeMinutes);
    
    // Update statement preview if visible
    updateStatementPreview();
    
    // Update export buttons state (disable in demo mode)
    updateExportButtonsState();
    
    // Refresh elevation chart with night overlay (now that paces are known)
    displayElevationChart();
    
    console.log('Race plan calculated via API', { fatigueMultiplier, checkpoints, ddl });
}

function calculateRacePlan() {
    if (!gpxData || segments.length === 0) {
        alert('Please load a GPX file first.');
        return Promise.reject('No GPX data');
    }
    
    // Show loading state
    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
        resultsSection.classList.add('loading');
    }
    
    // Use iterative approach for target time mode, regular API for other modes
    const apiCall = currentMode === 'target' 
        ? calculateRacePlanForTargetTime() 
        : calculateRacePlanFromAPI();
    
    return apiCall
        .then(result => {
            displayApiResults(result);
            if (resultsSection) {
                resultsSection.classList.remove('loading');
            }
            return result;
        })
        .catch(error => {
            console.error('API calculation failed:', error.message);
            if (resultsSection) {
                resultsSection.classList.remove('loading');
            }
            showNotification('Warming up the servers... Please try again in a moment! ☕', 'error');
            throw error;
        });
}

// Local calculation removed - all calculations done server-side
function calculateRacePlanLocal() {
    showNotification('Warming up the servers... Please try again in a moment! ☕', 'error');
}

// Render km splits from API response
function renderApiKmSplits(kmSplits, splitsBody) {
    const startTimeInput = document.getElementById('raceStartTime');
    const startTimeValue = startTimeInput ? startTimeInput.value : '09:00';
    const [startHours, startMinutes] = startTimeValue.split(':').map(Number);
    const startTimeInMinutes = startHours * 60 + startMinutes;
    
    // Compute eat zones for nutrition column
    if (!window.allEatZones && typeof findEatZones === 'function') {
        window.allEatZones = findEatZones(0.3, 10);
    }
    const eatZones = window.allEatZones || [];
    
    // Build recommended fuel points
    const fuelIntervalMinutes = 45;
    const recommendedFuelKms = new Set();
    aidStations.forEach(aid => recommendedFuelKms.add(Math.round(aid.km)));
    
    // Fill gaps with eat zone recommendations
    let lastFuelKm = 0;
    const avgPace = (lastCalculatedPaces?.flat || 6) * 1.2;
    for (let km = 1; km <= kmSplits.length; km++) {
        if (recommendedFuelKms.has(km)) {
            lastFuelKm = km;
            continue;
        }
        const timeSinceLastFuel = (km - lastFuelKm) * avgPace;
        if (timeSinceLastFuel >= fuelIntervalMinutes) {
            const inZone = eatZones.some(zone => km >= zone.start && km <= zone.end);
            const isFlatOrDown = isTerrainFlatOrDownhill(km);
            if (inZone && isFlatOrDown) {
                recommendedFuelKms.add(km);
                lastFuelKm = km;
            }
        }
    }
    
    // Render each km split
    kmSplits.forEach((split, index) => {
        const km = split.km;
        const splitTime = split.splitMinutes;
        const cumulativeTime = split.cumulativeMinutes;
        const pace = split.pace;
        const elevation = split.elevation;
        const terrain = split.terrain;
        const surface = split.surface || 'trail';
        const clockTime = split.clockTime;
        
        // Check for AID stations at this km
        const aidAtKm = aidStations.find(s => Math.round(s.km) === km);
        const stopTime = aidAtKm?.stopMin || 0;
        
        // Night detection
        const clockMinutes = startTimeInMinutes + cumulativeTime;
        const isNightSplit = isNightTime(clockMinutes % (24 * 60));
        
        // Fuel recommendation - AID stations are natural refuel points
        const isRecommendedFuel = recommendedFuelKms.has(km);
        let fuelHtml = '-';
        if (aidAtKm) {
            fuelHtml = `<span class="fuel-icon" title="${aidAtKm.name || 'AID'} — planned refuel stop (~${Math.round(cumulativeTime)} min in)">🍫🚰</span>`;
        } else if (isRecommendedFuel) {
            fuelHtml = `<span class="fuel-icon" title="Recommended fuel point (~${Math.round(cumulativeTime)} min in)">🍫</span>`;
        }
        
        // Format times
        const splitFormatted = formatTime(splitTime);
        const cumFormatted = formatTime(cumulativeTime);
        const paceFormatted = formatPace(pace);
        
        // Terrain label
        const terrainLabels = {
            'flat': '<span class="terrain-flat">Flat</span>',
            'uphill': '<span class="terrain-uphill">Uphill</span>',
            'downhill': '<span class="terrain-downhill">Downhill</span>'
        };
        const terrainHtml = terrainLabels[terrain] || terrain;
        
        // Surface label with proper capitalization
        const surfaceLabels = {
            'road': 'Road',
            'trail': 'Trail', 
            'technical': 'Technical',
            'rocky': 'Rocky',
            'sand': 'Sand'
        };
        const surfaceHtml = surfaceLabels[surface] || surface;
        
        // Elevation formatting
        const elevHtml = elevation >= 0 ? `+${elevation} m` : `${elevation} m`;
        
        // Create row
        const row = document.createElement('tr');
        if (isNightSplit) {
            row.classList.add('night-section');
        }
        
        row.innerHTML = `
            <td>${isNightSplit ? '🌙 ' : ''}${km}</td>
            <td>${elevHtml}</td>
            <td>${terrainHtml}</td>
            <td>${surfaceHtml}</td>
            <td>${aidAtKm ? aidAtKm.name : '-'}</td>
            <td>${stopTime > 0 ? '+' + stopTime + ' min' : '-'}</td>
            <td>${fuelHtml}</td>
            <td>${paceFormatted}</td>
            <td>${splitFormatted}</td>
            <td>${cumFormatted}</td>
            <td>${clockTime}</td>
        `;
        
        splitsBody.appendChild(row);
    });
}

// Generate kilometer splits table
function generateSplitsTable(flatPace, uphillPace, downhillPace, apiTotalTime) {
    // Use stored paces if not provided
    if (flatPace === undefined || uphillPace === undefined || downhillPace === undefined) {
        if (lastCalculatedPaces) {
            flatPace = lastCalculatedPaces.flat;
            uphillPace = lastCalculatedPaces.uphill;
            downhillPace = lastCalculatedPaces.downhill;
        } else {
            // No paces available - don't render anything
            return;
        }
    }
    
    // Store paces for future re-renders
    lastCalculatedPaces = { flat: flatPace, uphill: uphillPace, downhill: downhillPace };
    
    const splitsBody = document.getElementById('splitsBody');
    splitsBody.innerHTML = '';
    
    // If API provided km splits, use them directly (much cleaner!)
    if (lastCachedKmSplits && lastCachedKmSplits.length > 0) {
        renderApiKmSplits(lastCachedKmSplits, splitsBody);
        return;
    }
    
    // Fallback: calculate splits locally (legacy path)
    const points = gpxData.points;
    
    // Determine unit system and total distance
    const totalDistanceKm = gpxData.totalDistance;
    const unitLabel = useMetric ? 'km' : 'mi';
    const totalUnits = useMetric ? Math.ceil(totalDistanceKm) : Math.ceil(totalDistanceKm * KM_TO_MILES);
    
    // Use cached fatigue multiplier from API (includes ultra-distance adjustment)
    const fatigueMultiplier = lastCachedFatigue || 1.0;
    
    // Pace conversion: input paces are in min/km, convert to min/mi if needed
    const paceMultiplier = useMetric ? 1 : MILES_TO_KM;
    const displayFlatPace = flatPace * paceMultiplier;
    const displayUphillPace = uphillPace * paceMultiplier;
    const displayDownhillPace = downhillPace * paceMultiplier;
    
    // Get start time
    const startTimeInput = document.getElementById('raceStartTime');
    const startTimeValue = startTimeInput ? startTimeInput.value : '09:00';
    const [startHours, startMinutes] = startTimeValue.split(':').map(Number);
    const startTimeInMinutes = startHours * 60 + startMinutes;
    
    // Check if surface multipliers are enabled (defined here for use throughout)
    const surfaceToggle = document.getElementById('surfaceEnabled');
    const applySurface = surfaceToggle ? surfaceToggle.checked : false;
    
    // Pre-calculate total time using gradient-based multipliers to get normalization factor
    // This ensures the splits sum matches the API/hero total while preserving realistic distribution
    let rawTotalTime = 0;
    for (const segment of segments) {
        let surfaceMultiplier = 1.0;
        if (applySurface && segment.surfaceType) {
            const surfaceFactors = {
                'road': { flat: 1.0, uphill: 1.0, downhill: 1.0 },
                'trail': { flat: 1.05, uphill: 1.08, downhill: 1.10 },
                'technical': { flat: 1.12, uphill: 1.15, downhill: 1.30 },
                'rocky': { flat: 1.15, uphill: 1.18, downhill: 1.40 },
                'sand': { flat: 1.25, uphill: 1.30, downhill: 1.15 }
            };
            surfaceMultiplier = surfaceFactors[segment.surfaceType]?.[segment.terrainType] || 1.0;
        }
        const gradientMultiplier = getGradientPaceMultiplier(segment.grade, flatPace, uphillPace, downhillPace);
        rawTotalTime += segment.distance * flatPace * gradientMultiplier * surfaceMultiplier;
    }
    rawTotalTime *= fatigueMultiplier;
    
    // Use the API total time (passed from displayApiResults) or fallback to hero element
    let apiTotalMinutes = apiTotalTime;
    if (!apiTotalMinutes) {
        const heroTimeEl = document.getElementById('heroFinishTime');
        if (heroTimeEl && heroTimeEl.textContent && heroTimeEl.textContent !== '-') {
            const match = heroTimeEl.textContent.match(/(\d+):(\d+):(\d+)/);
            if (match) {
                apiTotalMinutes = parseInt(match[1]) * 60 + parseInt(match[2]) + parseInt(match[3]) / 60;
            }
        }
    }
    // Final fallback to raw calculation
    if (!apiTotalMinutes) {
        apiTotalMinutes = rawTotalTime;
    }
    
    // Calculate normalization factor so splits sum matches hero time
    const totalStopTime = aidStations.reduce((sum, s) => sum + (s.stopMin || 0), 0);
    const apiRunningTime = apiTotalMinutes - totalStopTime;
    const normalizationFactor = apiRunningTime > 0 && rawTotalTime > 0 ? apiRunningTime / rawTotalTime : 1.0;
    
    let cumulativeTime = 0;
    
    // Track which AID stations have had their stop time added (to prevent double-counting)
    const processedStopTimes = new Set();
    
    // Get average pace for AID station time calculations
    const avgPace = (flatPace + uphillPace + downhillPace) / 3;
    
    // Compute eat zones if not already cached (for nutrition column)
    if (!window.allEatZones && typeof findEatZones === 'function') {
        window.allEatZones = findEatZones(0.3, 10);
    }
    const eatZones = window.allEatZones || [];
    
    // Calculate recommended fuel points (every ~45 min, picking best terrain)
    // First pass: estimate time per km using average pace
    const fuelIntervalMinutes = 45;
    const recommendedFuelKms = new Set();
    
    // Add AID stations as natural fuel points
    aidStations.forEach(aid => {
        const aidKm = Math.round(aid.km);
        recommendedFuelKms.add(aidKm);
    });
    
    // Fill gaps >60 min between fuel points with eat zone recommendations
    const sortedFuelKms = [...recommendedFuelKms].sort((a, b) => a - b);
    const totalDistKm = gpxData.totalDistance;
    
    // Add fuel points approximately every 45 min in gaps
    let lastFuelKm = 0;
    for (let km = 1; km <= Math.ceil(totalDistKm); km++) {
        const estTimeAtKm = km * avgPace; // rough estimate
        const timeSinceLastFuel = (km - lastFuelKm) * avgPace;
        
        // If near a recommended point, update lastFuelKm
        if (recommendedFuelKms.has(km)) {
            lastFuelKm = km;
            continue;
        }
        
        // If >45 min since last fuel and we're in an eat zone with flat/downhill terrain, mark it
        if (timeSinceLastFuel >= fuelIntervalMinutes) {
            const inZone = eatZones.some(zone => km >= zone.start && km <= zone.end);
            const isFlatOrDown = isTerrainFlatOrDownhill(km);
            if (inZone && isFlatOrDown) {
                recommendedFuelKms.add(km);
                lastFuelKm = km;
            }
        }
    }
    
    // Calculate splits per unit (km or mile)
    for (let unit = 1; unit <= totalUnits; unit++) {
        // Convert unit boundaries to km for internal calculations
        const unitStartKm = useMetric ? (unit - 1) : ((unit - 1) * MILES_TO_KM);
        const unitEndKm = useMetric ? Math.min(unit, totalDistanceKm) : Math.min(unit * MILES_TO_KM, totalDistanceKm);
        
        // Find elevation change for this unit
        let startElevation = 0, endElevation = 0;
        let dominantTerrain = { flat: 0, uphill: 0, downhill: 0 };
        
        // Find points within this unit range (using km internally)
        for (const segment of segments) {
            if (segment.endDistance >= unitStartKm && segment.startDistance < unitEndKm) {
                const overlapStart = Math.max(segment.startDistance, unitStartKm);
                const overlapEnd = Math.min(segment.endDistance, unitEndKm);
                const overlapDistance = overlapEnd - overlapStart;
                
                dominantTerrain[segment.terrainType] += overlapDistance;
                
                if (startElevation === 0) {
                    startElevation = segment.startPoint.elevation;
                }
                endElevation = segment.endPoint.elevation;
            }
        }
        
        // Determine dominant terrain for this unit
        let terrain = 'flat';
        let maxDist = dominantTerrain.flat;
        if (dominantTerrain.uphill > maxDist) {
            terrain = 'uphill';
            maxDist = dominantTerrain.uphill;
        }
        if (dominantTerrain.downhill > maxDist) {
            terrain = 'downhill';
        }
        
        // Calculate elevation change
        const elevationChange = endElevation - startElevation;
        const distanceKm = unitEndKm - unitStartKm;
        
        // Calculate pace for this unit based on terrain and surface distribution (using km internally)
        let unitTime = 0;
        let dominantSurface = 'unknown';
        let maxSurfaceDist = 0;
        
        // Calculate time with surface multipliers if enabled
        for (const segment of segments) {
            if (segment.endDistance >= unitStartKm && segment.startDistance < unitEndKm) {
                const overlapStart = Math.max(segment.startDistance, unitStartKm);
                const overlapEnd = Math.min(segment.endDistance, unitEndKm);
                const overlapDistance = overlapEnd - overlapStart;
                
                // Track dominant surface for this unit (always track for display)
                if (segment.surfaceType && segment.surfaceType !== 'unknown') {
                    if (overlapDistance > maxSurfaceDist) {
                        maxSurfaceDist = overlapDistance;
                        dominantSurface = segment.surfaceType;
                    }
                }
                
                // Apply surface factors matching the API calculation
                let surfaceMultiplier = 1.0;
                if (applySurface && segment.surfaceType) {
                    const surfaceFactors = {
                        'road': { flat: 1.0, uphill: 1.0, downhill: 1.0 },
                        'trail': { flat: 1.05, uphill: 1.08, downhill: 1.10 },
                        'technical': { flat: 1.12, uphill: 1.15, downhill: 1.30 },
                        'rocky': { flat: 1.15, uphill: 1.18, downhill: 1.40 },
                        'sand': { flat: 1.25, uphill: 1.30, downhill: 1.15 }
                    };
                    surfaceMultiplier = surfaceFactors[segment.surfaceType]?.[segment.terrainType] || 1.0;
                }
                
                // Use gradient-based pace multiplier for realistic km splits
                // This gives more accurate per-km times based on actual grade
                const gradientMultiplier = getGradientPaceMultiplier(segment.grade, flatPace, uphillPace, downhillPace);
                const basePace = flatPace * gradientMultiplier;
                
                unitTime += overlapDistance * basePace * surfaceMultiplier;
            }
        }
        
        // Check for AID stations within this unit (before adding main row)
        const aidStationsInUnit = aidStations.filter(station => {
            // AID stations are stored in km, convert if needed
            const stationInUnit = useMetric ? station.km : station.km * KM_TO_MILES;
            return stationInUnit > (unit - 1) && stationInUnit < unit && stationInUnit % 1 !== 0;
        });
        
        // Add AID station rows for fractional positions
        for (const station of aidStationsInUnit) {
            const stationKm = station.km;
            // Calculate time to station based on km distance (with fatigue)
            const fractionOfUnit = (stationKm - unitStartKm) / distanceKm;
            const timeToStation = cumulativeTime + (unitTime * fatigueMultiplier * fractionOfUnit);
            const stopTime = station.stopMin || 0;
            const clockTimeMinutes = startTimeInMinutes + timeToStation;
            const clockTime = formatClockTime(clockTimeMinutes);
            const displayDistance = useMetric ? station.km : station.km * KM_TO_MILES;

            const aidRow = document.createElement('tr');
            aidRow.classList.add('aid-station-row');
            if (isNightTime(clockTimeMinutes % (24 * 60))) {
                aidRow.classList.add('night-section');
            }
            // Find station index for editing
            const stationIndex = aidStations.findIndex(s => s.km === station.km);
            aidRow.innerHTML = `
                <td>${displayDistance.toFixed(1)}</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td class="aid-station-cell">${station.name}</td>
                <td class="stop-time editable-stop" data-station-index="${stationIndex}" data-station-km="${station.km}">${stopTime > 0 ? '+' + stopTime + ' min' : '-'}</td>
                <td><span class="fuel-icon" title="${station.name || 'AID'} — planned refuel stop">🍫🚰</span></td>
                <td>-</td>
                <td>${formatTime(timeToStation)}</td>
                <td>${clockTime}</td>
            `;
            splitsBody.appendChild(aidRow);
            
            // Add stop time to cumulative time (proportional to position in unit)
            // The full stop time will be added after the fraction passes
        }
        
        // Update cumulative time (including any fractional AID stop times)
        for (const station of aidStationsInUnit) {
            if (!processedStopTimes.has(station.km)) {
                cumulativeTime += station.stopMin || 0;
                processedStopTimes.add(station.km);
            }
        }
        
        // Calculate clock time at START of this unit (for display purposes)
        const clockTimeAtUnitStart = startTimeInMinutes + cumulativeTime;
        
        // Apply fatigue multiplier and normalization to match hero total
        // Normalization preserves realistic gradient distribution while matching target time
        const adjustedUnitTime = unitTime * fatigueMultiplier * normalizationFactor;
        cumulativeTime += adjustedUnitTime;
        
        // Get target pace for dominant terrain (display pace for selected unit)
        let targetPace;
        switch (terrain) {
            case 'uphill': targetPace = displayUphillPace; break;
            case 'downhill': targetPace = displayDownhillPace; break;
            default: targetPace = displayFlatPace;
        }
        
        // Check for AID station at EXACT km boundary only (e.g., 16.0km at km 16)
        // Fractional stations are handled separately above
        const aidStation = aidStations.find(s => {
            const stationInUnit = useMetric ? s.km : s.km * KM_TO_MILES;
            // Only match if station is exactly at this km (within small tolerance)
            return Math.abs(stationInUnit - unit) < 0.05;
        });
        const aidStationText = aidStation ? aidStation.name : '-';
        const hasAidStation = aidStation !== undefined;
        
        // Add stop time only if not already processed (prevents double-counting)
        if (hasAidStation && !processedStopTimes.has(aidStation.km)) {
            cumulativeTime += aidStation.stopMin || 0;
            processedStopTimes.add(aidStation.km);
        }
        const stopTime = hasAidStation ? (aidStation.stopMin || 0) : 0;
        
        // Check if this km is a recommended fuel point
        const unitKm = useMetric ? unit : Math.round(unit * MILES_TO_KM);
        const isRecommendedFuel = recommendedFuelKms.has(unitKm);
        // AID stations always show fuel icon since they're natural refuel points
        const fuelIcon = hasAidStation ? '🍫🚰' : (isRecommendedFuel ? '🍫' : '');
        const fuelTooltip = hasAidStation
            ? `${aidStation.name || 'AID'} — planned refuel stop`
            : (isRecommendedFuel ? 'Flat/downhill terrain — good eating opportunity' : '');
        
        // Calculate clock time (after adding stop time)
        const clockTimeMinutes = startTimeInMinutes + cumulativeTime;
        const clockTime = formatClockTime(clockTimeMinutes);
        
        // Track if this split includes night penalty for display
        const isNightSplit = isNightTime(clockTimeAtUnitStart % (24 * 60));
        
        // Split time is the time for this unit (with fatigue and night, not including stop)
        const splitTime = adjustedUnitTime;
        
        const row = document.createElement('tr');
        if (hasAidStation) {
            row.classList.add('aid-station-row');
        }
        if (isNightTime(clockTimeMinutes % (24 * 60))) {
            row.classList.add('night-section');
        }
        
        // Calculate actual pace for this km (from actual split time)
        const displayDistance = useMetric ? distanceKm : distanceKm * KM_TO_MILES;
        const actualPace = displayDistance > 0 ? splitTime / displayDistance : 0;
        
        // Get surface display name and class
        const surfaceDisplay = isSurfaceLoading ? t('general.loading') : getSurfaceName(dominantSurface);
        const surfaceClass = isSurfaceLoading ? 'surface-loading' : `surface-${dominantSurface}`;
        
        row.innerHTML = `
            <td>${unit}</td>
            <td>${elevationChange >= 0 ? '+' : ''}${elevationChange.toFixed(0)} m</td>
            <td class="terrain-${terrain}">${getTerrainName(terrain)}</td>
            <td class="${surfaceClass}">${surfaceDisplay}</td>
            <td class="${hasAidStation ? 'aid-station-cell' : ''}">${aidStationText}</td>
            <td class="stop-time${hasAidStation ? ' editable-stop' : ''}"${hasAidStation ? ` data-station-index="${aidStations.findIndex(s => s.km === aidStation.km)}" data-station-km="${aidStation.km}"` : ''}>${stopTime > 0 ? '+' + stopTime + ' min' : '-'}</td>
            <td class="fuel-cell"${fuelTooltip ? ` title="${fuelTooltip}"` : ''}>${fuelIcon}</td>
            <td>${formatPace(actualPace)} /${unitLabel}</td>
            <td>${formatTime(splitTime)}</td>
            <td>${formatTime(cumulativeTime)}</td>
            <td>${clockTime}</td>
        `;
        splitsBody.appendChild(row);
    }
    
    // Update hero finish clock with the actual calculated finish time (last clockTime from splits)
    const heroFinishClock = document.getElementById('heroFinishClock');
    if (heroFinishClock) {
        const finalClockTime = formatClockTime(startTimeInMinutes + cumulativeTime);
        heroFinishClock.textContent = finalClockTime;
    }
    
    // Generate leg summary if AID stations exist
    renderLegSummary(flatPace, uphillPace, downhillPace, applySurface, startTimeInMinutes, fatigueMultiplier, apiTotalMinutes);
    
    // Show splits section
    document.getElementById('splitsSection').style.display = 'block';
    
    // Setup editable stop times for AID stations
    setupEditableStopTimes();
}

// Setup inline editing for AID station stop times
function setupEditableStopTimes() {
    const editableCells = document.querySelectorAll('.editable-stop');
    
    editableCells.forEach(cell => {
        // Add click indicator
        cell.style.cursor = 'pointer';
        cell.title = 'Click to edit stop time';
        
        cell.addEventListener('click', function(e) {
            // Don't re-trigger if already editing
            if (this.querySelector('input')) return;
            
            const stationIndex = parseInt(this.dataset.stationIndex);
            const currentValue = aidStations[stationIndex]?.stopMin || 0;
            
            // Store original content
            const originalContent = this.textContent;
            
            // Create input
            const input = document.createElement('input');
            input.type = 'number';
            input.min = '0';
            input.max = '60';
            input.value = currentValue;
            input.className = 'stop-time-input';
            input.style.cssText = 'width: 50px; padding: 2px 4px; border: 1px solid #00d4ff; border-radius: 4px; background: #1a2744; color: #fff; text-align: center; font-size: 0.85rem;';
            
            // Replace cell content with input
            this.textContent = '';
            this.appendChild(input);
            input.focus();
            input.select();
            
            // Handle save on blur or enter
            const saveValue = () => {
                const newValue = Math.max(0, Math.min(60, parseInt(input.value) || 0));
                
                // Update the aidStations array
                if (aidStations[stationIndex]) {
                    aidStations[stationIndex].stopMin = newValue;
                }
                
                // Restore cell display
                cell.textContent = newValue > 0 ? '+' + newValue + ' min' : '-';
                
                // Recalculate race plan with new stop time
                calculateRacePlan();
            };
            
            input.addEventListener('blur', saveValue);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    input.blur();
                } else if (e.key === 'Escape') {
                    cell.textContent = originalContent;
                }
            });
        });
    });
}

// Render leg summary table
function renderLegSummary(flatPace, uphillPace, downhillPace, applySurface, startTimeInMinutes, fatigueMultiplier = 1.0, apiTotalMinutes = null) {
    const legSummary = document.getElementById('legSummary');
    const legSummaryBody = document.getElementById('legSummaryBody');
    
    if (!legSummary || !legSummaryBody) return;
    
    // Need at least one AID station for leg summary
    if (aidStations.length === 0) {
        legSummary.style.display = 'none';
        return;
    }
    
    // Sort AID stations by km
    const sortedStations = [...aidStations].sort((a, b) => a.km - b.km);
    
    // Build legs
    const legs = [];
    
    // Start → First AID
    legs.push({
        name: `Start → ${sortedStations[0].name}`,
        fromKm: 0,
        toKm: sortedStations[0].km,
        stopMin: 0
    });
    
    // Between AID stations
    for (let i = 0; i < sortedStations.length - 1; i++) {
        legs.push({
            name: `${sortedStations[i].name} → ${sortedStations[i + 1].name}`,
            fromKm: sortedStations[i].km,
            toKm: sortedStations[i + 1].km,
            stopMin: sortedStations[i].stopMin || 0
        });
    }
    
    // Last AID → Finish
    const lastStation = sortedStations[sortedStations.length - 1];
    legs.push({
        name: `${lastStation.name} → Finish`,
        fromKm: lastStation.km,
        toKm: gpxData.totalDistance,
        stopMin: lastStation.stopMin || 0,
        isFinish: true
    });
    
    // First pass: calculate raw leg times to compute leg-specific normalization factor
    let rawLegTotal = 0;
    const rawLegTimes = legs.map(leg => {
        let legTime = 0;
        for (const segment of segments) {
            if (segment.endDistance >= leg.fromKm && segment.startDistance < leg.toKm) {
                const overlapStart = Math.max(segment.startDistance, leg.fromKm);
                const overlapEnd = Math.min(segment.endDistance, leg.toKm);
                const overlapDistance = overlapEnd - overlapStart;
                
                let surfaceMultiplier = 1.0;
                if (applySurface && segment.surfaceType) {
                    const surfaceFactors = {
                        'road': { flat: 1.0, uphill: 1.0, downhill: 1.0 },
                        'trail': { flat: 1.05, uphill: 1.08, downhill: 1.10 },
                        'technical': { flat: 1.12, uphill: 1.15, downhill: 1.30 },
                        'rocky': { flat: 1.15, uphill: 1.18, downhill: 1.40 },
                        'sand': { flat: 1.25, uphill: 1.30, downhill: 1.15 }
                    };
                    const terrain = segment.terrainType || 'flat';
                    surfaceMultiplier = surfaceFactors[segment.surfaceType]?.[terrain] || 1.0;
                }
                
                const gradientMultiplier = getGradientPaceMultiplier(segment.grade, flatPace, uphillPace, downhillPace);
                const basePace = flatPace * gradientMultiplier;
                
                legTime += overlapDistance * basePace * surfaceMultiplier;
            }
        }
        rawLegTotal += legTime;
        return legTime;
    });
    
    // Calculate leg-specific normalization factor
    const totalStopTime = aidStations.reduce((sum, s) => sum + (s.stopMin || 0), 0);
    const apiRunningTime = apiTotalMinutes ? apiTotalMinutes - totalStopTime : rawLegTotal * fatigueMultiplier;
    const rawLegWithFatigue = rawLegTotal * fatigueMultiplier;
    const legNormFactor = apiRunningTime > 0 && rawLegWithFatigue > 0 ? apiRunningTime / rawLegWithFatigue : 1.0;
    
    // Calculate times for each leg using leg-specific normalization
    let cumulativeTime = 0;
    
    legSummaryBody.innerHTML = legs.map((leg, idx) => {
        const distance = leg.toKm - leg.fromKm;
        const elevGain = calculateElevationGainBetween(leg.fromKm, leg.toKm);
        const elevLoss = calculateElevationLossBetween(leg.fromKm, leg.toKm);
        
        // Get pre-calculated raw leg time
        const legTime = rawLegTimes[idx];
        
        // Calculate clock time at start of this leg for night indicator
        const clockTimeAtLegStart = startTimeInMinutes + cumulativeTime + leg.stopMin;
        
        // Determine dominant surface for night indicator
        let dominantSurface = 'trail';
        let maxSurfaceDist = 0;
        for (const segment of segments) {
            if (segment.endDistance >= leg.fromKm && segment.startDistance < leg.toKm) {
                if (segment.surfaceType && segment.surfaceType !== 'unknown') {
                    const overlapStart = Math.max(segment.startDistance, leg.fromKm);
                    const overlapEnd = Math.min(segment.endDistance, leg.toKm);
                    const overlapDistance = overlapEnd - overlapStart;
                    if (overlapDistance > maxSurfaceDist) {
                        maxSurfaceDist = overlapDistance;
                        dominantSurface = segment.surfaceType;
                    }
                }
            }
        }
        
        // Check if running at night (for display indicator only)
        const nightMultiplier = getNightPaceMultiplier(clockTimeAtLegStart, dominantSurface);
        const isNightLeg = nightMultiplier > 1.0;
        
        // Apply fatigue and leg-specific normalization to match API total
        const adjustedLegTime = legTime * fatigueMultiplier * legNormFactor;
        
        // Add previous stop time to cumulative
        cumulativeTime += leg.stopMin;
        cumulativeTime += adjustedLegTime;
        
        const arrivalTime = formatClockTime(startTimeInMinutes + cumulativeTime);
        const nightIcon = isNightLeg ? '<span class="leg-night-indicator" title="Night running">🌙</span>' : '';
        
        return `
            <tr class="${leg.isFinish ? 'leg-finish' : ''}${isNightLeg ? ' leg-night' : ''}">
                <td class="leg-name">${leg.name}${nightIcon}</td>
                <td>${distance.toFixed(1)} km</td>
                <td>⬆️${elevGain.toFixed(0)}m ⬇️${elevLoss.toFixed(0)}m</td>
                <td>${formatTime(adjustedLegTime)}</td>
                <td>${arrivalTime}</td>
            </tr>
        `;
    }).join('');
    
    legSummary.style.display = 'block';
}

// Update Hero Result Section with finish time and AID checkpoints
function updateHeroSection(totalTime) {
    const heroTime = document.getElementById('heroFinishTime');
    const heroCheckpoints = document.getElementById('heroCheckpoints');
    const heroDistance = document.getElementById('heroDistance');
    
    if (!heroTime) return;
    
    // Only update finish time if totalTime is provided (skip on language change)
    if (totalTime !== undefined && !isNaN(totalTime)) {
        heroTime.textContent = formatTime(totalTime);
        heroTime.classList.remove('hero-time-preview');
    }
    
    // Update weather impact pill if available
    const weatherPill = document.getElementById('weatherImpactPill');
    const weatherTimeEl = document.getElementById('weatherAdjustedTime');
    const weatherConditionsEl = document.getElementById('weatherConditions');
    const weatherBreakdownEl = document.getElementById('weatherBreakdown');
    const cutoffWarning = document.getElementById('cutoffWarning');
    
    if (weatherPill && weatherTimeEl) {
        const adjustment = getWeatherAdjustedTime(totalTime);
        
        if (adjustment && adjustment.addedMinutes >= 1) {
            weatherTimeEl.textContent = `+${adjustment.addedMinutes} min`;
            
            // Build conditions text
            const conditions = [];
            if (raceWeatherData) {
                conditions.push(`${raceWeatherData.tempAvg}°C`);
                if (raceWeatherData.isRainy) conditions.push('rain forecast');
                else if (raceWeatherData.rainChance > 50) conditions.push(`${raceWeatherData.rainChance}% rain chance`);
                if (raceWeatherData.windSpeed > 30) conditions.push(`${raceWeatherData.windSpeed} km/h wind`);
            }
            if (weatherConditionsEl) {
                weatherConditionsEl.textContent = conditions.length > 0 
                    ? `Based on ${conditions.join(' and ')}` 
                    : 'Based on race day forecast';
            }
            
            // Build breakdown text
            if (weatherBreakdownEl && raceWeatherData && raceWeatherData.adjustment) {
                const breakdown = raceWeatherData.adjustment.breakdown || [];
                const breakdownText = breakdown.map(b => {
                    if (b.factor === 'rain') return `Rain: +${b.penalty.toFixed(1)}%`;
                    if (b.factor === 'heat') return `Heat: +${b.penalty.toFixed(1)}%`;
                    if (b.factor === 'cold') return `Cold: +${b.penalty.toFixed(1)}%`;
                    if (b.factor === 'wind') return `Wind: +${b.penalty.toFixed(1)}%`;
                    return '';
                }).filter(Boolean).join(' · ');
                weatherBreakdownEl.textContent = breakdownText || '';
            }
            
            weatherPill.style.display = 'inline-flex';
        } else {
            weatherPill.style.display = 'none';
        }
    }
    
    // Update distance
    if (heroDistance && gpxData) {
        const dist = useMetric ? gpxData.totalDistance : gpxData.totalDistance * KM_TO_MILES;
        const unit = useMetric ? 'km' : 'mi';
        heroDistance.textContent = `${dist.toFixed(1)} ${unit}`;
    }
    
    // Update Elevation Gain
    const heroClimbLoad = document.getElementById('heroClimbLoad');
    if (heroClimbLoad && gpxData) {
        heroClimbLoad.textContent = `+${Math.round(gpxData.elevationGain)}m`;
    }
    
    // Update Top Climbs (5 biggest continuous ascents)
    const heroTopClimbs = document.getElementById('heroTopClimbs');
    if (heroTopClimbs && gpxData) {
        const topClimbs = findTopClimbs(5);
        const climbItems = heroTopClimbs.querySelectorAll('.top-climb-item');
        
        climbItems.forEach((item, index) => {
            const locationEl = item.querySelector('.climb-location');
            const gainEl = item.querySelector('.climb-gain');
            
            if (topClimbs[index] && topClimbs[index].gain > 100) {
                locationEl.textContent = `KM ${topClimbs[index].start.toFixed(1)}–${topClimbs[index].end.toFixed(1)}`;
                gainEl.textContent = `+${Math.round(topClimbs[index].gain)}m`;
                item.style.display = 'flex';
            } else {
                locationEl.textContent = '-';
                gainEl.textContent = '';
                item.style.display = index === 0 ? 'flex' : 'none';
            }
        });
    }
    
    // Update Dynamic Descent Load using cached API values (formulas protected on server)
    const heroDescentLoad = document.getElementById('heroDescentLoad');
    const heroDescentDetail = document.getElementById('heroDescentDetail');
    const heroDescentInsight = document.getElementById('heroDescentInsight');
    if (heroDescentLoad && gpxData && lastCachedDDL) {
        const ddl = lastCachedDDL;
        
        // Show DDL/km as main value
        const ddlPerKm = ddl.ddlTotal / gpxData.totalDistance;
        heroDescentLoad.textContent = `${Math.round(ddlPerKm)}/km`;
        
        // Show expected downhill pace loss as detail (with range)
        if (heroDescentDetail) {
            if (ddl.fatigueRatio >= 0.8 && ddl.paceLossSeconds >= 5) {
                const text = typeof t === 'function' 
                    ? t('ddl.downhillPaceLoss', { min: ddl.paceLossRange.min, max: ddl.paceLossRange.max })
                    : `Downhill pace loss: +${ddl.paceLossRange.min}-${ddl.paceLossRange.max} sec/km`;
                heroDescentDetail.textContent = text;
            } else {
                heroDescentDetail.textContent = typeof t === 'function' ? t('ddl.noPaceLoss') : 'No pace loss expected';
            }
        }
        
        // Generate late-race insight (readable sentence format)
        if (heroDescentInsight) {
            if (ddl.paceLossSeconds >= 25 && ddl.fatigueOnsetKm !== null) {
                const text = typeof t === 'function'
                    ? `⚠ ${t('ddl.expectSlower', { km: Math.round(ddl.fatigueOnsetKm), min: ddl.paceLossRange.min, max: ddl.paceLossRange.max })}`
                    : `⚠ Expect slower descents after KM${Math.round(ddl.fatigueOnsetKm)} (+${ddl.paceLossRange.min}-${ddl.paceLossRange.max} sec/km)`;
                heroDescentInsight.textContent = text;
                heroDescentInsight.className = 'hero-metric-insight warning';
            } else if (ddl.paceLossSeconds >= 10 && ddl.fatigueOnsetKm !== null) {
                const text = typeof t === 'function'
                    ? t('ddl.expectSlower', { km: Math.round(ddl.fatigueOnsetKm), min: ddl.paceLossRange.min, max: ddl.paceLossRange.max })
                    : `Expect slower descents after KM${Math.round(ddl.fatigueOnsetKm)} (+${ddl.paceLossRange.min}-${ddl.paceLossRange.max} sec/km)`;
                heroDescentInsight.textContent = text;
                heroDescentInsight.className = 'hero-metric-insight';
            } else if (ddl.paceLossSeconds >= 5 && ddl.fatigueOnsetKm !== null) {
                const text = typeof t === 'function'
                    ? t('ddl.mildSlowdown', { km: Math.round(ddl.fatigueOnsetKm) })
                    : `Mild downhill slowdown after KM${Math.round(ddl.fatigueOnsetKm)}`;
                heroDescentInsight.textContent = text;
                heroDescentInsight.className = 'hero-metric-insight';
            } else {
                heroDescentInsight.textContent = '';
            }
        }
    }
    
    // Update Fuel Stops (Smart Recommendations - same logic as splits table)
    const heroFuelWindows = document.getElementById('heroFuelWindows');
    const nutritionBox = document.getElementById('heroNutritionBox');
    if (heroFuelWindows && gpxData) {
        const eatZones = findEatZones(0.3, 10); // min 300m, max 10% grade (smoothed)
        window.allEatZones = eatZones; // cache for splits table
        
        // Estimate time per km (rough average)
        const totalTimeEl = document.getElementById('totalTime');
        let avgPacePerKm = 6; // default fallback (min/km)
        if (totalTimeEl && totalTimeEl.textContent && gpxData.totalDistance > 0) {
            const timeText = totalTimeEl.textContent;
            const match = timeText.match(/(\d+):(\d+)/);
            if (match) {
                const totalMins = parseInt(match[1]) * 60 + parseInt(match[2]);
                avgPacePerKm = totalMins / gpxData.totalDistance;
            }
        }
        
        // Calculate smart fuel recommendations (~45 min intervals)
        const fuelIntervalMinutes = 45;
        const recommendedFuelPoints = [];
        
        // Add AID stations as natural fuel points
        aidStations.forEach(aid => {
            recommendedFuelPoints.push({
                km: Math.round(aid.km),
                isAid: true,
                aidName: aid.name || 'AID Station',
                estTimeMin: Math.round(aid.km * avgPacePerKm)
            });
        });
        
        // Fill gaps >45 min between fuel points with eat zone recommendations
        let lastFuelKm = 0;
        const totalDistKm = gpxData.totalDistance;
        for (let km = 1; km <= Math.ceil(totalDistKm); km++) {
            const timeSinceLastFuel = (km - lastFuelKm) * avgPacePerKm;
            
            // If this is an AID station, update lastFuelKm
            if (recommendedFuelPoints.some(p => p.km === km)) {
                lastFuelKm = km;
                continue;
            }
            
            // If >45 min since last fuel and we're in an eat zone with flat/downhill terrain, mark it
            if (timeSinceLastFuel >= fuelIntervalMinutes) {
                const inZone = eatZones.some(zone => km >= zone.start && km <= zone.end);
                const isFlatOrDown = isTerrainFlatOrDownhill(km);
                if (inZone && isFlatOrDown) {
                    recommendedFuelPoints.push({
                        km: km,
                        isAid: false,
                        estTimeMin: Math.round(km * avgPacePerKm)
                    });
                    lastFuelKm = km;
                }
            }
        }
        
        // Sort by KM and take first 3 for display
        recommendedFuelPoints.sort((a, b) => a.km - b.km);
        const fuelToShow = recommendedFuelPoints.slice(0, 3);
        const moreCount = recommendedFuelPoints.length - 3;
        
        const fuelItems = heroFuelWindows.querySelectorAll('.fuel-window-item');
        
        fuelItems.forEach((item, index) => {
            const iconEl = item.querySelector('.fuel-icon');
            const locationEl = item.querySelector('.fuel-location');
            const timeEl = item.querySelector('.fuel-time');
            
            if (fuelToShow[index]) {
                const point = fuelToShow[index];
                iconEl.textContent = point.isAid ? '🍫🚰' : '🍫';
                locationEl.textContent = `KM ${point.km}`;
                // Show estimated arrival time
                const hours = Math.floor(point.estTimeMin / 60);
                const mins = point.estTimeMin % 60;
                timeEl.textContent = hours > 0 ? `~${hours}h${mins.toString().padStart(2,'0')}` : `~${mins}min`;
                item.style.display = 'flex';
                // Add hover tooltip explaining why this spot
                if (point.isAid) {
                    item.title = `${point.aidName} — planned refuel stop`;
                } else {
                    item.title = 'Flat/downhill terrain — good eating opportunity';
                }
            } else {
                locationEl.textContent = '-';
                timeEl.textContent = '';
                item.style.display = index === 0 ? 'flex' : 'none';
                item.title = '';
            }
        });
        
        // Store for modal
        window.allFuelStops = recommendedFuelPoints;
        
        // Show "+X more" clickable to open modal
        let moreIndicator = heroFuelWindows.querySelector('.fuel-more');
        if (moreCount > 0) {
            if (!moreIndicator) {
                moreIndicator = document.createElement('div');
                moreIndicator.className = 'fuel-more';
                moreIndicator.addEventListener('click', showAllFuelStops);
                heroFuelWindows.appendChild(moreIndicator);
            }
            moreIndicator.textContent = `+ ${moreCount} more`;
            moreIndicator.style.display = 'block';
            moreIndicator.style.cursor = 'pointer';
        } else if (moreIndicator) {
            moreIndicator.style.display = 'none';
        }
    }
    
    // Update Course Shape
    updateCourseShape();
    
    // Update Hero Insight Widgets (Surface, Climb Profile & AID Stations)
    updateHeroSurfaceWidget();
    updateHeroClimbWidget();
    updateHeroAidWidget();
    updateHeroNightWidget();
    
    // Hide old heroCheckpoints (now using heroAidWidget)
    if (heroCheckpoints) {
        heroCheckpoints.style.display = 'none';
    }
    
    // Check and display cutoff warning for race pages
    // cutoffWarning already declared above for weather divider logic
    const cutoffTimeEl = document.getElementById('cutoffTime');
    
    if (cutoffWarning && cutoffTimeEl && currentDistanceConfig && currentDistanceConfig.finishCutoff) {
        const cutoff = currentDistanceConfig.finishCutoff;
        cutoffTimeEl.textContent = cutoff;
        
        // Calculate finish clock time
        const startTimeInput = document.getElementById('raceStartTime');
        const startTimeValue = startTimeInput ? startTimeInput.value : '09:00';
        const [startH, startM] = startTimeValue.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const finishMinutes = startMinutes + totalTime;
        
        // Parse cutoff time
        const [cutoffH, cutoffM] = cutoff.split(':').map(Number);
        const cutoffMinutes = cutoffH * 60 + cutoffM;
        
        // Compare and style
        if (finishMinutes > cutoffMinutes) {
            cutoffWarning.className = 'cutoff-warning danger';
            cutoffWarning.querySelector('.cutoff-icon').textContent = '⚠️';
        } else {
            cutoffWarning.className = 'cutoff-warning safe';
            cutoffWarning.querySelector('.cutoff-icon').textContent = '✓';
        }
        
        cutoffWarning.style.display = 'inline-flex';
    } else if (cutoffWarning) {
        cutoffWarning.style.display = 'none';
    }
}

// Find the main climb (longest continuous ascent window)
// Uses monotonic ascent detection with tolerance for small dips
function findLongestClimb() {
    if (!gpxData || !gpxData.points || gpxData.points.length < 10) return null;
    
    const points = gpxData.points;
    const DIP_TOLERANCE = 30; // Allow up to 30m dips within a climb
    
    let mainClimb = null;
    let windowStart = 0;
    let windowMinElevation = points[0].elevation || 0;
    let windowMaxElevation = windowMinElevation;
    let windowMinDistance = 0;
    
    for (let i = 1; i < points.length; i++) {
        const point = points[i];
        const elevation = point.elevation || 0;
        
        // Update max if we're still climbing
        if (elevation > windowMaxElevation) {
            windowMaxElevation = elevation;
        }
        
        // Check if we've descended too far from the max (end of climb)
        const dropFromMax = windowMaxElevation - elevation;
        
        if (dropFromMax > DIP_TOLERANCE) {
            // End current climb window
            const gain = windowMaxElevation - windowMinElevation;
            
            if (gain > 100 && (!mainClimb || gain > mainClimb.gain)) {
                // Find the point where max elevation was reached
                let maxElevDistance = windowMinDistance;
                for (let j = windowStart; j <= i; j++) {
                    if ((points[j].elevation || 0) === windowMaxElevation) {
                        maxElevDistance = points[j].distance;
                        break;
                    }
                }
                
                mainClimb = {
                    start: windowMinDistance,
                    end: maxElevDistance,
                    gain: gain
                };
            }
            
            // Start new window from current point
            windowStart = i;
            windowMinElevation = elevation;
            windowMaxElevation = elevation;
            windowMinDistance = point.distance;
        }
        
        // Update minimum if we found a new low (starting point of potential climb)
        if (elevation < windowMinElevation) {
            windowMinElevation = elevation;
            windowMinDistance = point.distance;
            windowStart = i;
            windowMaxElevation = elevation;
        }
    }
    
    // Check final window
    const finalGain = windowMaxElevation - windowMinElevation;
    if (finalGain > 100 && (!mainClimb || finalGain > mainClimb.gain)) {
        let maxElevDistance = windowMinDistance;
        for (let j = windowStart; j < points.length; j++) {
            if ((points[j].elevation || 0) === windowMaxElevation) {
                maxElevDistance = points[j].distance;
                break;
            }
        }
        mainClimb = {
            start: windowMinDistance,
            end: maxElevDistance,
            gain: finalGain
        };
    }
    
    return mainClimb;
}

// Find top N climbs sorted by elevation gain
function findTopClimbs(count = 3) {
    if (!gpxData || !gpxData.points || gpxData.points.length < 10) return [];
    
    const points = gpxData.points;
    const DIP_TOLERANCE = 30; // Allow up to 30m dips within a climb
    const allClimbs = [];
    
    let windowStart = 0;
    let windowMinElevation = points[0].elevation || 0;
    let windowMaxElevation = windowMinElevation;
    let windowMinDistance = 0;
    
    for (let i = 1; i < points.length; i++) {
        const point = points[i];
        const elevation = point.elevation || 0;
        
        if (elevation > windowMaxElevation) {
            windowMaxElevation = elevation;
        }
        
        const dropFromMax = windowMaxElevation - elevation;
        
        if (dropFromMax > DIP_TOLERANCE) {
            const gain = windowMaxElevation - windowMinElevation;
            
            if (gain > 100) {
                let maxElevDistance = windowMinDistance;
                for (let j = windowStart; j <= i; j++) {
                    if ((points[j].elevation || 0) === windowMaxElevation) {
                        maxElevDistance = points[j].distance;
                        break;
                    }
                }
                
                allClimbs.push({
                    start: windowMinDistance,
                    end: maxElevDistance,
                    gain: gain
                });
            }
            
            windowStart = i;
            windowMinElevation = elevation;
            windowMaxElevation = elevation;
            windowMinDistance = point.distance;
        }
        
        if (elevation < windowMinElevation) {
            windowMinElevation = elevation;
            windowMinDistance = point.distance;
            windowStart = i;
            windowMaxElevation = elevation;
        }
    }
    
    // Check final window
    const finalGain = windowMaxElevation - windowMinElevation;
    if (finalGain > 100) {
        let maxElevDistance = windowMinDistance;
        for (let j = windowStart; j < points.length; j++) {
            if ((points[j].elevation || 0) === windowMaxElevation) {
                maxElevDistance = points[j].distance;
                break;
            }
        }
        allClimbs.push({
            start: windowMinDistance,
            end: maxElevDistance,
            gain: finalGain
        });
    }
    
    // Sort by gain descending and return top N
    return allClimbs.sort((a, b) => b.gain - a.gain).slice(0, count);
}

// Check if terrain at a specific KM is flat or downhill (not steep uphill)
function isTerrainFlatOrDownhill(km) {
    if (!segments || segments.length === 0) return true; // fallback
    
    const kmStart = km - 1;
    const kmEnd = km;
    let terrain = { flat: 0, uphill: 0, downhill: 0 };
    
    for (const segment of segments) {
        if (segment.endDistance >= kmStart && segment.startDistance < kmEnd) {
            const overlapStart = Math.max(segment.startDistance, kmStart);
            const overlapEnd = Math.min(segment.endDistance, kmEnd);
            const overlapDistance = overlapEnd - overlapStart;
            terrain[segment.terrainType] += overlapDistance;
        }
    }
    
    // Return true if dominant terrain is flat or downhill
    const dominant = Object.entries(terrain).sort((a, b) => b[1] - a[1])[0];
    return dominant[0] !== 'uphill';
}

// Find eat zones - flat/gentle terrain segments where eating is comfortable
function findEatZones(minLength = 0.3, maxGrade = 10) {
    if (!gpxData || !gpxData.points || gpxData.points.length < 10) return [];
    
    const points = gpxData.points;
    const eatZones = [];
    
    // Use 200m rolling window for smoothed grade calculation
    const windowSize = 0.2; // km
    
    let zoneStart = null;
    let zoneStartKm = 0;
    
    for (let i = 0; i < points.length; i++) {
        const curr = points[i];
        const currDist = curr.distance;
        
        // Find point ~200m back for smoothed grade
        let backIdx = i;
        while (backIdx > 0 && currDist - points[backIdx].distance < windowSize) {
            backIdx--;
        }
        
        const backPoint = points[backIdx];
        const dist = (currDist - backPoint.distance) * 1000; // meters
        const elevDiff = Math.abs((curr.elevation || 0) - (backPoint.elevation || 0));
        const smoothedGrade = dist > 50 ? (elevDiff / dist) * 100 : 0;
        
        if (smoothedGrade <= maxGrade) {
            // Flat/gentle terrain
            if (zoneStart === null) {
                zoneStart = i;
                zoneStartKm = currDist;
            }
        } else {
            // Steep terrain - end current zone if exists
            if (zoneStart !== null) {
                const length = currDist - zoneStartKm;
                if (length >= minLength) {
                    eatZones.push({
                        start: zoneStartKm,
                        end: currDist,
                        length: length,
                        type: 'flat'
                    });
                }
                zoneStart = null;
            }
        }
    }
    
    // Check final zone
    if (zoneStart !== null) {
        const lastPoint = points[points.length - 1];
        const length = lastPoint.distance - zoneStartKm;
        if (length >= minLength) {
            eatZones.push({
                start: zoneStartKm,
                end: lastPoint.distance,
                length: length,
                type: 'flat'
            });
        }
    }
    
    // Merge nearby zones (within 500m) 
    const merged = [];
    for (const zone of eatZones) {
        if (merged.length > 0 && zone.start - merged[merged.length - 1].end < 0.5) {
            // Merge with previous
            merged[merged.length - 1].end = zone.end;
            merged[merged.length - 1].length = merged[merged.length - 1].end - merged[merged.length - 1].start;
        } else {
            merged.push({ ...zone });
        }
    }
    
    // Mark only the closest zone for each AID station (not all zones within 2km)
    merged.forEach(zone => zone.nearAid = false);
    
    for (const aid of aidStations) {
        let closestZone = null;
        let closestDist = Infinity;
        
        for (const zone of merged) {
            // Check if AID is within or very close to the zone
            const zoneMid = (zone.start + zone.end) / 2;
            const dist = Math.abs(aid.km - zoneMid);
            
            // Only consider zones within 2km of the AID
            if (dist < 2 && dist < closestDist) {
                closestDist = dist;
                closestZone = zone;
            }
        }
        
        if (closestZone) {
            closestZone.nearAid = true;
        }
    }
    
    // Sort by start KM (so runner can follow along the course)
    return merged.sort((a, b) => a.start - b.start);
}

// Show all fuel stops in a modal
function showAllFuelStops() {
    if (!window.allFuelStops || window.allFuelStops.length === 0) return;
    
    // Create modal if doesn't exist
    let modal = document.getElementById('fuelStopsModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'fuelStopsModal';
        modal.className = 'fuel-stops-modal';
        modal.innerHTML = `
            <div class="fuel-stops-modal-content">
                <button class="fuel-stops-modal-close">✕</button>
                <h3>🍫 All Fuel Windows</h3>
                <p class="fuel-stops-subtitle">Recommended every ~45 min at AID stations or flat terrain</p>
                <div class="fuel-stops-list"></div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Close handlers
        modal.querySelector('.fuel-stops-modal-close').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    }
    
    // Populate list
    const list = modal.querySelector('.fuel-stops-list');
    list.innerHTML = window.allFuelStops.map((point, idx) => {
        const hours = Math.floor(point.estTimeMin / 60);
        const mins = point.estTimeMin % 60;
        const timeStr = hours > 0 ? `~${hours}h${mins.toString().padStart(2,'0')}` : `~${mins}min`;
        const typeText = point.isAid ? (point.aidName || 'AID') : 'Flat terrain';
        return `
            <div class="fuel-stop-row" title="${point.isAid ? (point.aidName || 'AID') + ' — planned refuel stop' : 'Flat/downhill terrain — good eating opportunity'}">
                <span class="fuel-stop-icon">${point.isAid ? '🍫🚰' : '🍫'}</span>
                <span class="fuel-stop-km">KM ${point.km}</span>
                <span class="fuel-stop-type">${typeText}</span>
                <span class="fuel-stop-time">${timeStr}</span>
            </div>
        `;
    }).join('');
    
    modal.style.display = 'flex';
}

// Update Course Shape - Race Intelligence
function updateCourseShape() {
    const courseShapeSection = document.getElementById('heroCourseShape');
    const courseShapeBadge = document.getElementById('courseShapeBadge');
    const courseShapeInsight = document.getElementById('courseShapeInsight');
    
    if (!courseShapeSection || !courseShapeBadge || !gpxData || segments.length === 0) return;
    
    const totalDist = gpxData.totalDistance;
    const totalGain = gpxData.elevationGain;
    const halfwayPoint = totalDist / 2;
    
    // Calculate climb in first half vs second half
    let firstHalfClimb = 0;
    let secondHalfClimb = 0;
    
    for (const segment of segments) {
        if (segment.terrainType === 'uphill' && segment.elevationChange > 0) {
            const midpoint = (segment.startDistance + segment.endDistance) / 2;
            if (midpoint <= halfwayPoint) {
                firstHalfClimb += segment.elevationChange;
            } else {
                secondHalfClimb += segment.elevationChange;
            }
        }
    }
    
    const firstHalfPercent = (firstHalfClimb / totalGain) * 100;
    
    // Determine course shape
    let shapeType, insight;
    
    if (firstHalfPercent >= 65) {
        // Front-loaded: most climbing early
        shapeType = 'front-loaded';
        const percentVal = Math.round(firstHalfPercent);
        
        // Find where the main climbing ends
        let cumulativeGain = 0;
        let climbEndKm = totalDist;
        for (const segment of segments) {
            if (segment.terrainType === 'uphill' && segment.elevationChange > 0) {
                cumulativeGain += segment.elevationChange;
            }
            if (cumulativeGain >= totalGain * 0.8) {
                climbEndKm = segment.endDistance;
                break;
            }
        }
        
        courseShapeBadge.textContent = '⛰️ ' + t('shape.frontLoaded');
        courseShapeBadge.className = 'course-shape-badge front-loaded';
        insight = t('shape.frontInsightDynamic', { pct: percentVal, km: Math.round(climbEndKm) });
        
    } else if (firstHalfPercent <= 35) {
        // Back-loaded: most climbing late
        shapeType = 'back-loaded';
        const percentVal = Math.round(100 - firstHalfPercent);
        
        courseShapeBadge.textContent = '📈 ' + t('shape.backLoaded');
        courseShapeBadge.className = 'course-shape-badge back-loaded';
        insight = t('shape.backInsightDynamic', { pct: percentVal });
        
    } else {
        // Balanced
        shapeType = 'balanced';
        
        courseShapeBadge.textContent = '⚖️ ' + t('shape.balanced');
        courseShapeBadge.className = 'course-shape-badge balanced';
        insight = t('shape.balancedInsightDynamic');
    }
    
    courseShapeInsight.textContent = insight;
    courseShapeSection.style.display = 'flex';
}

// Calculate arrival times at each checkpoint/AID station
function calculateCheckpointTimes() {
    if (!gpxData || !lastCalculatedPaces || aidStations.length === 0) return '';
    
    const { flat: flatPace, uphill: uphillPace, downhill: downhillPace } = lastCalculatedPaces;
    const surfaceToggle = document.getElementById('surfaceEnabled');
    const applySurface = surfaceToggle ? surfaceToggle.checked : false;
    
    // Get start time for night calculations
    const startTimeInput = document.getElementById('raceStartTime');
    const startTimeValue = startTimeInput ? startTimeInput.value : '09:00';
    const [startHours, startMinutes] = startTimeValue.split(':').map(Number);
    const startTimeInMinutes = startHours * 60 + startMinutes;
    
    // Get fatigue multiplier (same as splits table, from API)
    const fatigueMultiplier = lastCachedFatigue || 1.0;
    
    let checkpointsHtml = '';
    let cumulativeTime = 0;
    
    aidStations.forEach((station, index) => {
        const stationKm = station.km;
        let legTime = 0;
        const prevStationKm = index === 0 ? 0 : aidStations[index - 1].km;
        
        // Calculate time for this leg (from previous station to this one)
        let dominantSurface = 'trail';
        let maxSurfaceDist = 0;
        
        for (const segment of segments) {
            if (segment.endDistance >= prevStationKm && segment.startDistance < stationKm) {
                const overlapStart = Math.max(segment.startDistance, prevStationKm);
                const overlapEnd = Math.min(segment.endDistance, stationKm);
                const overlapDistance = overlapEnd - overlapStart;
                
                // Track dominant surface
                if (segment.surfaceType && segment.surfaceType !== 'unknown') {
                    if (overlapDistance > maxSurfaceDist) {
                        maxSurfaceDist = overlapDistance;
                        dominantSurface = segment.surfaceType;
                    }
                }
                
                const gradientMultiplier = getGradientPaceMultiplier(segment.grade, flatPace, uphillPace, downhillPace);
                const pace = flatPace * gradientMultiplier;
                legTime += overlapDistance * pace * fatigueMultiplier;
            }
        }
        
        // Apply night penalty if running at night
        const clockTimeAtLegStart = startTimeInMinutes + cumulativeTime;
        const nightMultiplier = getNightPaceMultiplier(clockTimeAtLegStart, dominantSurface);
        legTime *= nightMultiplier;
        
        // Add previous station's stop time
        if (index > 0) {
            cumulativeTime += aidStations[index - 1].stopMin || 0;
        }
        cumulativeTime += legTime;
        
        checkpointsHtml += `
            <div class="hero-checkpoint">
                <span class="hero-checkpoint-name">${station.name}</span>
                <span class="hero-checkpoint-time">${formatTime(cumulativeTime)}</span>
            </div>
        `;
    });
    
    return checkpointsHtml;
}

// CSV Export functionality
function setupExport() {
    document.getElementById('exportCsv').addEventListener('click', exportToCsv);
    document.getElementById('exportPdf').addEventListener('click', exportToPdf);
    document.getElementById('exportShareCard').addEventListener('click', exportShareCard);
    document.getElementById('exportStoryCard')?.addEventListener('click', exportStoryCard);
    document.getElementById('exportCrewCard')?.addEventListener('click', exportCrewCard);
    document.getElementById('exportCrewPdf')?.addEventListener('click', exportCrewPdf);
}

// Update export buttons disabled state based on demo mode
function updateExportButtonsState() {
    const exportButtons = [
        'exportCsv', 'exportPdf', 'exportShareCard', 
        'exportCrewCard', 'exportCrewPdf'
    ];
    // Note: exportStoryCard is NOT in this list - it shows early access prompt in demo mode
    
    exportButtons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.disabled = isDemoMode;
            if (isDemoMode) {
                btn.title = 'Export disabled in demo mode';
                btn.classList.add('demo-disabled');
            } else {
                btn.title = '';
                btn.classList.remove('demo-disabled');
            }
        }
    });
    
    // Story Card button is enabled in demo mode (shows early access prompt)
    const storyBtn = document.getElementById('exportStoryCard');
    if (storyBtn && isDemoMode) {
        storyBtn.disabled = false;
        storyBtn.title = '';
        storyBtn.classList.remove('demo-disabled');
    }
}

function exportToCsv() {
    if (!gpxData || segments.length === 0) {
        alert('Please load a GPX file and calculate your race strategy first.');
        return;
    }

    const splitsTable = document.getElementById('splitsTable');
    if (!splitsTable || splitsTable.rows.length <= 1) {
        alert('Please calculate your race strategy first to generate splits.');
        return;
    }

    // Get pace values based on current mode
    let flatPace, uphillPace, downhillPace;
    
    if (currentMode === 'manual') {
        flatPace = getPaceInMinutes(
            document.getElementById('flatPaceMin'),
            document.getElementById('flatPaceSec')
        );
        uphillPace = getPaceInMinutes(
            document.getElementById('uphillPaceMin'),
            document.getElementById('uphillPaceSec')
        );
        downhillPace = getPaceInMinutes(
            document.getElementById('downhillPaceMin'),
            document.getElementById('downhillPaceSec')
        );
    } else {
        const paces = calculatePacesFromTargetTime();
        flatPace = paces.flatPace;
        uphillPace = paces.uphillPace;
        downhillPace = paces.downhillPace;
    }

    let csvContent = '';

    // Get start time
    const startTimeInput = document.getElementById('raceStartTime');
    const startTimeValue = startTimeInput ? startTimeInput.value : '09:00';
    
    // Get race date
    const dateInput = document.getElementById('raceStartDate');
    const raceDateValue = dateInput ? dateInput.value : '';
    
    // Unit settings
    const unitLabel = useMetric ? 'km' : 'mi';
    const distanceDisplay = useMetric ? gpxData.totalDistance.toFixed(2) : (gpxData.totalDistance * KM_TO_MILES).toFixed(2);

    // Add summary section
    csvContent += 'GPX RACE STRATEGY EXPORT\n';
    csvContent += `Mode,${currentMode === 'manual' ? 'Manual Pace' : 'Target Time'}\n`;
    csvContent += `Race Date,${raceDateValue || 'Not set'}\n`;
    csvContent += `Race Start Time,${startTimeValue}\n`;
    if (sunTimes && !sunTimes.polarNight && !sunTimes.midnightSun) {
        csvContent += `Sunrise,${formatSunTime(sunTimes.sunrise)}\n`;
        csvContent += `Sunset,${formatSunTime(sunTimes.sunset)}\n`;
    } else if (sunTimes && sunTimes.polarNight) {
        csvContent += `Sun,Polar night (no sunrise)\n`;
    } else if (sunTimes && sunTimes.midnightSun) {
        csvContent += `Sun,Midnight sun (no sunset)\n`;
    }
    csvContent += `Units,${useMetric ? 'Metric (km)' : 'Imperial (miles)'}\n`;
    csvContent += '\n';
    csvContent += 'ROUTE STATISTICS\n';
    csvContent += `Total Distance,${distanceDisplay} ${unitLabel}\n`;
    csvContent += `Elevation Gain,${gpxData.elevationGain.toFixed(0)} m\n`;
    csvContent += `Elevation Loss,${gpxData.elevationLoss.toFixed(0)} m\n`;
    csvContent += `Min Elevation,${gpxData.minElevation.toFixed(0)} m\n`;
    csvContent += `Max Elevation,${gpxData.maxElevation.toFixed(0)} m\n`;
    csvContent += '\n';
    csvContent += 'PACE SETTINGS\n';
    const displayFlatPace = useMetric ? flatPace : flatPace * MILES_TO_KM;
    const displayUphillPace = useMetric ? uphillPace : uphillPace * MILES_TO_KM;
    const displayDownhillPace = useMetric ? downhillPace : downhillPace * MILES_TO_KM;
    csvContent += `Flat Pace,${formatPace(displayFlatPace)} /${unitLabel}\n`;
    csvContent += `Uphill Pace,${formatPace(displayUphillPace)} /${unitLabel}\n`;
    csvContent += `Downhill Pace,${formatPace(displayDownhillPace)} /${unitLabel}\n`;
    csvContent += '\n';
    csvContent += 'TERRAIN BREAKDOWN\n';
    csvContent += `Flat Distance,${document.getElementById('flatDistance').textContent}\n`;
    csvContent += `Uphill Distance,${document.getElementById('uphillDistance').textContent}\n`;
    csvContent += `Downhill Distance,${document.getElementById('downhillDistance').textContent}\n`;
    csvContent += `Flat Time,${document.getElementById('flatTime').textContent}\n`;
    csvContent += `Uphill Time,${document.getElementById('uphillTime').textContent}\n`;
    csvContent += `Downhill Time,${document.getElementById('downhillTime').textContent}\n`;
    csvContent += `Total Estimated Time,${document.getElementById('totalTime').textContent}\n`;
    csvContent += '\n';

    // Add AID stations if any
    if (aidStations.length > 0) {
        csvContent += 'AID STATIONS\n';
        csvContent += `${unitLabel.toUpperCase()},Name,Stop Time (min)\n`;
        aidStations.forEach(station => {
            const stationDist = useMetric ? station.km : station.km * KM_TO_MILES;
            csvContent += `${stationDist.toFixed(1)},${station.name},${station.stopMin || 0}\n`;
        });
        
        // Add total stop time
        const totalStopTime = aidStations.reduce((sum, s) => sum + (s.stopMin || 0), 0);
        csvContent += `Total Stop Time,,${totalStopTime}\n`;
        csvContent += '\n';
    }

    // Add splits table
    csvContent += `${useMetric ? 'KILOMETER' : 'MILE'} SPLITS\n`;
    
    // Get table headers
    const headers = [];
    const headerCells = splitsTable.querySelectorAll('thead th');
    headerCells.forEach(cell => {
        headers.push(cell.textContent);
    });
    csvContent += headers.join(',') + '\n';

    // Get table rows
    const rows = splitsTable.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const rowData = [];
        const cells = row.querySelectorAll('td');
        cells.forEach(cell => {
            // Escape commas and quotes in cell content
            let content = cell.textContent.trim();
            if (content.includes(',') || content.includes('"')) {
                content = '"' + content.replace(/"/g, '""') + '"';
            }
            rowData.push(content);
        });
        csvContent += rowData.join(',') + '\n';
    });

    // Create and download the file using data URI (more compatible)
    const encodedContent = encodeURIComponent(csvContent);
    const dataUri = 'data:text/csv;charset=utf-8,' + encodedContent;
    
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', 'gpx_race_plan.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Track export
    trackEvent('export_csv', { race_name: currentRouteName || 'unknown' });
}

// PDF Race Card Export
async function exportToPdf() {
    if (!gpxData || segments.length === 0) {
        alert('Please load a GPX file and calculate your race strategy first.');
        return;
    }

    const splitsTable = document.getElementById('splitsTable');
    if (!splitsTable || splitsTable.rows.length <= 1) {
        alert('Please calculate your race strategy first to generate splits.');
        return;
    }

    const btn = document.getElementById('exportPdf');
    const originalText = btn.textContent;
    btn.textContent = t('btn.generating');
    btn.disabled = true;

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        let y = margin;

        // Colors
        const primaryColor = [0, 212, 255];
        const darkBg = [30, 30, 50];
        const textColor = [255, 255, 255];
        const mutedColor = [150, 150, 150];

        // Background
        doc.setFillColor(...darkBg);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');

        // Header
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, pageWidth, 20, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        let routeName = currentRouteName || 'Race Strategy';
        
        // Truncate long titles to fit header (max ~50 chars)
        const maxTitleLength = 50;
        if (routeName.length > maxTitleLength) {
            routeName = routeName.substring(0, maxTitleLength - 3) + '...';
        }
        doc.text(routeName, margin, 13);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const dateInput = document.getElementById('raceStartDate');
        const timeInput = document.getElementById('raceStartTime');
        const raceDate = dateInput?.value || '';
        const raceTime = timeInput?.value || '06:00';
        if (raceDate) {
            doc.text(`${raceDate} at ${raceTime}`, pageWidth - margin, 13, { align: 'right' });
        }

        y = 30;

        // Stats row
        doc.setTextColor(...textColor);
        doc.setFontSize(9);
        
        const unitLabel = useMetric ? 'km' : 'mi';
        const distance = useMetric ? gpxData.totalDistance : gpxData.totalDistance * KM_TO_MILES;
        let totalTimeText = document.getElementById('totalTime')?.textContent || '-';
        // Clean up time - remove "(incl. X min stops)" for cleaner display
        const timeMatch = totalTimeText.match(/^[\d:]+/);
        const estTime = timeMatch ? timeMatch[0] : totalTimeText;
        const stopsMatch = totalTimeText.match(/(\d+)\s*min\s*stop/);
        const stopsTime = stopsMatch ? `${stopsMatch[1]} min` : null;
        
        const stats = [
            { label: 'Distance', value: `${distance.toFixed(1)} ${unitLabel}` },
            { label: 'Elevation', value: `+${gpxData.elevationGain.toFixed(0)}m / -${gpxData.elevationLoss.toFixed(0)}m` },
            { label: 'Est. Time', value: estTime }
        ];
        
        // Add stops as separate stat if present
        if (stopsTime) {
            stats.push({ label: 'Stops', value: stopsTime });
        }
        
        // Add sun times if available
        if (sunTimes && !sunTimes.polarNight && !sunTimes.midnightSun) {
            stats.push({ label: 'Sunrise', value: formatSunTime(sunTimes.sunrise) });
            stats.push({ label: 'Sunset', value: formatSunTime(sunTimes.sunset) });
        }

        const statWidth = (pageWidth - 2 * margin) / stats.length;
        stats.forEach((stat, i) => {
            const x = margin + i * statWidth;
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...mutedColor);
            doc.text(stat.label, x, y);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...textColor);
            doc.text(stat.value, x, y + 5);
        });

        y += 15;

        // Elevation chart capture
        const chartCanvas = document.getElementById('elevationChart');
        if (chartCanvas && chartCanvas.style.display !== 'none') {
            try {
                const chartImage = chartCanvas.toDataURL('image/png', 1.0);
                const chartWidth = pageWidth - 2 * margin;
                const chartHeight = 35;
                doc.addImage(chartImage, 'PNG', margin, y, chartWidth, chartHeight);
                y += chartHeight + 8;
            } catch (e) {
                console.warn('Could not capture chart:', e);
            }
        }

        // AID Stations / Leg Summary
        if (aidStations.length > 0) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(...primaryColor);
            doc.text('AID Stations', margin, y);
            y += 6;

            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...textColor);

            aidStations.forEach(station => {
                const stationDist = useMetric ? station.km : station.km * KM_TO_MILES;
                const stopText = station.stopMin > 0 ? ` (+${station.stopMin}min)` : '';
                doc.text(`• ${stationDist.toFixed(1)} ${unitLabel}: ${station.name}${stopText}`, margin + 2, y);
                y += 4;
            });
            y += 4;
        }

        // Splits table
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(...primaryColor);
        doc.text('Splits', margin, y);
        y += 6;

        // Table header
        const cols = [
            { header: unitLabel.toUpperCase(), width: 12 },
            { header: 'Elev', width: 18 },
            { header: 'Terrain', width: 18 },
            { header: 'AID', width: 35 },
            { header: 'Pace', width: 22 },
            { header: 'Split', width: 18 },
            { header: 'Total', width: 18 },
            { header: 'Clock', width: 18 }
        ];

        doc.setFillColor(40, 40, 60);
        doc.rect(margin, y - 3, pageWidth - 2 * margin, 6, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(...mutedColor);
        
        let colX = margin + 1;
        cols.forEach(col => {
            doc.text(col.header, colX, y);
            colX += col.width;
        });
        y += 5;

        // Table rows
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        
        const rows = splitsTable.querySelectorAll('tbody tr');
        rows.forEach((row, rowIndex) => {
            // Check if we need a new page
            if (y > pageHeight - 20) {
                doc.addPage();
                doc.setFillColor(...darkBg);
                doc.rect(0, 0, pageWidth, pageHeight, 'F');
                y = margin;
            }

            const cells = row.querySelectorAll('td');
            const isAid = row.classList.contains('aid-station-row');
            const isNight = row.classList.contains('night-section');
            
            // Row background
            if (isAid) {
                doc.setFillColor(0, 100, 80);
                doc.rect(margin, y - 3, pageWidth - 2 * margin, 5, 'F');
            } else if (isNight) {
                doc.setFillColor(50, 30, 70);
                doc.rect(margin, y - 3, pageWidth - 2 * margin, 5, 'F');
            } else if (rowIndex % 2 === 0) {
                doc.setFillColor(35, 35, 55);
                doc.rect(margin, y - 3, pageWidth - 2 * margin, 5, 'F');
            }

            doc.setTextColor(...textColor);
            colX = margin + 1;
            
            // Columns: 0=km, 1=elev, 2=terrain, 4=aid, 6=pace, 7=split, 8=total, 9=clock
            const indices = [0, 1, 2, 4, 6, 7, 8, 9];
            indices.forEach((cellIndex, i) => {
                let text = cells[cellIndex]?.textContent?.trim() || '-';
                // Truncate long text
                if (text.length > 15) text = text.substring(0, 14) + '…';
                doc.text(text, colX, y);
                colX += cols[i].width;
            });
            y += 5;
        });

        // Footer with branded GPXray
        y = pageHeight - 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 229, 255); // #00E5FF
        doc.text('GPXray', margin, y);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...mutedColor);
        doc.text(' • gpxray.run', margin + 18, y);
        doc.text(new Date().toLocaleDateString(), pageWidth - margin, y, { align: 'right' });

        // Save
        const fileName = (currentRouteName || 'race_plan').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        doc.save(`${fileName}_race_card.pdf`);

    } catch (error) {
        console.error('PDF generation error:', error);
        alert('Failed to generate PDF. Please try again.');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

// Share Card Export (Phone format image)
async function exportShareCard() {
    if (!gpxData || segments.length === 0) {
        alert('Please load a GPX file and calculate your race strategy first.');
        return;
    }

    const btn = document.getElementById('exportShareCard');
    const originalText = btn.textContent;
    btn.textContent = t('btn.creating');
    btn.disabled = true;

    try {
        // Create a hidden container for the share card
        const card = document.createElement('div');
        card.id = 'shareCardContainer';
        card.style.cssText = `
            position: fixed;
            left: -9999px;
            top: 0;
            width: 540px;
            height: 960px;
            background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: white;
            padding: 30px;
            box-sizing: border-box;
        `;

        // Build card content
        const unitLabel = useMetric ? 'km' : 'mi';
        const distance = useMetric ? gpxData.totalDistance : gpxData.totalDistance * KM_TO_MILES;
        const totalTime = document.getElementById('totalTime')?.textContent || '-';
        const dateInput = document.getElementById('raceStartDate');
        const timeInput = document.getElementById('raceStartTime');
        const raceDate = dateInput?.value || '';
        const raceTime = timeInput?.value || '06:00';

        // Get finish clock time from the last row of splits table
        let finishClockTime = '';
        const splitsTable = document.getElementById('splitsTable');
        if (splitsTable) {
            const allRows = splitsTable.querySelectorAll('tbody tr');
            if (allRows.length > 0) {
                const lastRow = allRows[allRows.length - 1];
                const cells = lastRow.querySelectorAll('td');
                finishClockTime = cells[10]?.textContent || ''; // Clock Time column
            }
        }

        // Get AID station times from the splits table (only exact AID station rows)
        let aidStationsList = '';
        if (splitsTable && aidStations.length > 0) {
            // Sort AID stations by km and get their data
            const sortedStations = [...aidStations].sort((a, b) => a.km - b.km);
            
            // Collect matching rows with their data (deduplicated by station name)
            const stationData = [];
            const addedStations = new Set();
            const rows = splitsTable.querySelectorAll('tbody tr.aid-station-row');
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                const distCell = cells[0]?.textContent?.trim() || '';
                const aidName = cells[4]?.textContent || '';
                const raceTime = cells[8]?.textContent || '';
                const clockTime = cells[9]?.textContent || '';
                
                if (aidName && aidName !== '-' && !addedStations.has(aidName)) {
                    // Parse distance and find matching AID station (tolerance-based matching)
                    const rowDist = parseFloat(distCell);
                    const rowKm = useMetric ? rowDist : rowDist * MILES_TO_KM;
                    const matchingStation = sortedStations.find(s => Math.abs(s.km - rowKm) < 0.5);
                    
                    if (matchingStation) {
                        // Use exact station km for display
                        const displayDist = useMetric ? matchingStation.km : matchingStation.km * KM_TO_MILES;
                        stationData.push({ 
                            dist: displayDist.toFixed(1), 
                            name: aidName, 
                            raceTime, 
                            clockTime,
                            crewAllowed: matchingStation.crewAllowed || false
                        });
                        addedStations.add(aidName);
                    }
                }
            });
            
            // Dynamic sizing based on station count
            const stationCount = stationData.length;
            let rowPadding, kmSize, nameSize, timeSize, clockSize, legInfoSize, showLegInfo;
            
            if (stationCount <= 4) {
                // Large mode
                rowPadding = '14px 0';
                kmSize = '20px';
                nameSize = '18px';
                timeSize = '16px';
                clockSize = '20px';
                legInfoSize = '14px';
                showLegInfo = true;
            } else if (stationCount <= 7) {
                // Medium mode
                rowPadding = '10px 0';
                kmSize = '17px';
                nameSize = '15px';
                timeSize = '14px';
                clockSize = '17px';
                legInfoSize = '12px';
                showLegInfo = true;
            } else {
                // Compact mode (8+ stations)
                rowPadding = '8px 0';
                kmSize = '15px';
                nameSize = '13px';
                timeSize = '12px';
                clockSize = '15px';
                legInfoSize = '11px';
                showLegInfo = false; // Hide leg info to save space
            }
            
            // Calculate leg info and build HTML
            let prevKm = 0;
            let prevElevation = gpxData.points[0]?.elevation || 0;
            
            stationData.forEach((station, index) => {
                const stationKm = parseFloat(station.dist);
                const legDist = (stationKm - prevKm).toFixed(1);
                
                // Find elevation at this station
                let stationElevation = prevElevation;
                let elevGain = 0;
                let elevLoss = 0;
                
                // Calculate elevation change for this leg
                for (const point of gpxData.points) {
                    if (point.distance >= prevKm && point.distance <= stationKm) {
                        if (point.elevation !== null) {
                            stationElevation = point.elevation;
                        }
                    }
                }
                
                // Sum up elevation changes in this leg using smoothed calculation
                elevGain = calculateElevationGainBetween(prevKm, stationKm);
                elevLoss = calculateElevationLossBetween(prevKm, stationKm);
                
                // Add station row
                const crewBadge = station.crewAllowed ? ' 👥' : '';
                aidStationsList += `
                    <div style="display: flex; align-items: center; padding: ${rowPadding}; border-bottom: 1px solid rgba(255,255,255,0.15);">
                        <span style="color: #00d4ff; min-width: 55px; font-size: ${kmSize}; font-weight: bold;">📍 ${station.dist}</span>
                        <span style="flex: 1; margin: 0 6px; font-size: ${nameSize}; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${station.name}${crewBadge}</span>
                        <span style="color: #ddd; font-size: ${timeSize}; font-weight: 600; margin-right: 10px;">${station.raceTime}</span>
                        <span style="font-weight: bold; color: #4CAF50; min-width: 75px; text-align: right; font-size: ${clockSize};">${station.clockTime}</span>
                    </div>
                `;
                
                // Add leg info row (if not last station and showLegInfo is true)
                if (index < stationData.length - 1) {
                    const nextKm = parseFloat(stationData[index + 1].dist);
                    const nextLegDist = (nextKm - stationKm).toFixed(1);
                    
                    // Calculate next leg elevation using smoothed calculation
                    const nextElevGain = calculateElevationGainBetween(stationKm, nextKm);
                    const nextElevLoss = calculateElevationLossBetween(stationKm, nextKm);
                    
                    if (showLegInfo) {
                        aidStationsList += `
                            <div style="text-align: center; padding: 6px 0; color: #999; font-size: ${legInfoSize}; font-weight: 500;">
                                ↓ ${nextLegDist} ${unitLabel} · +${Math.round(nextElevGain)}m / -${Math.round(nextElevLoss)}m
                            </div>
                        `;
                    }
                }
                
                prevKm = stationKm;
                prevElevation = stationElevation;
            });
            
            // Add leg info to finish (if there are stations and showLegInfo)
            if (stationData.length > 0 && showLegInfo) {
                const lastStationKm = parseFloat(stationData[stationData.length - 1].dist);
                const finishKm = distance;
                const legToFinish = (finishKm - lastStationKm).toFixed(1);
                
                // Calculate elevation to finish using smoothed calculation
                const finishElevGain = calculateElevationGainBetween(lastStationKm, finishKm);
                const finishElevLoss = calculateElevationLossBetween(lastStationKm, finishKm);
                
                aidStationsList += `
                    <div style="text-align: center; padding: 6px 0; color: #999; font-size: ${legInfoSize}; font-weight: 500;">
                        ↓ ${legToFinish} ${unitLabel} · +${Math.round(finishElevGain)}m / -${Math.round(finishElevLoss)}m
                    </div>
                `;
            }
            
            // Add FINISH row
            aidStationsList += `
                <div style="display: flex; align-items: center; padding: ${rowPadding}; background: rgba(76,175,80,0.2); border-radius: 8px; margin-top: 4px;">
                    <span style="color: #4CAF50; min-width: 55px; font-size: ${kmSize}; font-weight: bold;">🏁 ${distance.toFixed(1)}</span>
                    <span style="flex: 1; margin: 0 6px; font-size: ${nameSize}; font-weight: 700; color: #4CAF50;">${t('lockscreen.finish')}</span>
                    <span style="color: #4CAF50; font-size: ${timeSize}; font-weight: 700; margin-right: 10px;">${totalTime.split('(')[0].trim()}</span>
                    <span style="font-weight: bold; color: #4CAF50; min-width: 75px; text-align: right; font-size: ${clockSize};">${finishClockTime}</span>
                </div>
            `;
        } else {
            // No AID stations - show just FINISH row
            aidStationsList = `
                <div style="display: flex; align-items: center; padding: 14px 0; background: rgba(76,175,80,0.2); border-radius: 8px;">
                    <span style="color: #4CAF50; min-width: 55px; font-size: 20px; font-weight: bold;">🏁 ${distance.toFixed(1)}</span>
                    <span style="flex: 1; margin: 0 6px; font-size: 18px; font-weight: 700; color: #4CAF50;">${t('lockscreen.finish')}</span>
                    <span style="color: #4CAF50; font-size: 16px; font-weight: 700; margin-right: 10px;">${totalTime.split('(')[0].trim()}</span>
                    <span style="font-weight: bold; color: #4CAF50; min-width: 75px; text-align: right; font-size: 20px;">${finishClockTime}</span>
                </div>
            `;
        }

        // Cutoff time warning for Share Card
        let cutoffHtml = '';
        if (currentDistanceConfig && currentDistanceConfig.finishCutoff && finishClockTime) {
            const cutoff = currentDistanceConfig.finishCutoff;
            const [finishH, finishM] = finishClockTime.split(':').map(Number);
            const [cutoffH, cutoffM] = cutoff.split(':').map(Number);
            const finishMins = finishH * 60 + finishM;
            const cutoffMins = cutoffH * 60 + cutoffM;
            const isOver = finishMins > cutoffMins;
            const icon = isOver ? '⚠️' : '✓';
            const color = isOver ? '#f44336' : '#4CAF50';
            cutoffHtml = `
                <div style="text-align: center; margin: 8px 0; font-size: 14px; font-weight: 600; color: ${color};">
                    ${icon} ${t('lockscreen.cutoff')}: ${cutoff}
                </div>
            `;
        }

        // timesSection now only contains cutoff (sun times moved to challenges box)
        const timesSection = cutoffHtml;

        let routeName = currentRouteName || 'Race Strategy';
        if (routeName.length > 35) {
            routeName = routeName.substring(0, 32) + '...';
        }

        // Gather Key Challenges info for lockscreen
        const topClimbs = findTopClimbs(5);
        let challengesHtml = '';
        
        // Sort climbs by start km (race sequence order)
        const sortedClimbs = [...topClimbs].sort((a, b) => a.start - b.start);
        
        // Build climbs grid (2 columns)
        let climbsGrid = '';
        if (sortedClimbs.length > 0) {
            const climbItems = sortedClimbs.map(c => 
                `<div style="background: rgba(255,165,0,0.15); border-radius: 6px; padding: 6px 8px; text-align: center;">
                    <div style="font-size: 13px; font-weight: 600; color: #ffaa00;">⛰️ km ${Math.round(c.start)}</div>
                    <div style="font-size: 11px; color: #999;">+${Math.round(c.gain)}m</div>
                </div>`
            ).join('');
            climbsGrid = `
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 8px;">
                    ${climbItems}
                </div>
            `;
        }
        
        // Night and DDL in a row
        let nightDdlRow = '';
        const extraItems = [];
        
        // Add sunrise/sunset times first if available
        if (sunTimes && !sunTimes.midnightSun && !sunTimes.polarNight) {
            extraItems.push(`<span style="color: #ffcc00;">🌅 ${formatSunTime(sunTimes.sunrise)}</span>`);
            extraItems.push(`<span style="color: #ff8844;">🌇 ${formatSunTime(sunTimes.sunset)}</span>`);
        }
        
        // Night Running - show km ranges
        if (sunTimes && !sunTimes.midnightSun) {
            const stInput = document.getElementById('raceStartTime');
            if (stInput?.value) {
                const [sh, sm] = stInput.value.split(':').map(Number);
                const startMins = sh * 60 + sm;
                const fPace = lastCalculatedPaces?.flat || 6.5;
                const uPace = lastCalculatedPaces?.uphill || 8.5;
                const dPace = lastCalculatedPaces?.downhill || 5.5;
                let totalNightDist = 0;
                let cumTime = 0;
                let nightStart = null;
                let nightEnd = null;
                let cumDist = 0;
                for (const seg of segments) {
                    const gMult = getGradientPaceMultiplier(seg.grade, fPace, uPace, dPace);
                    const segTime = seg.distance * fPace * gMult;
                    const clockTime = (startMins + cumTime) % 1440;
                    if (isNightTime(clockTime)) {
                        totalNightDist += seg.distance;
                        if (nightStart === null) nightStart = cumDist;
                        nightEnd = cumDist + seg.distance;
                    }
                    cumTime += segTime;
                    cumDist += seg.distance;
                }
                if (totalNightDist >= 0.5 && nightStart !== null) {
                    extraItems.push(`<span style="color: #9090ff;">🌙 km ${Math.round(nightStart)}-${Math.round(nightEnd)}</span>`);
                }
            }
        }
        
        // DDL
        if (lastCachedDDL && gpxData) {
            const ddlPerKm = Math.round(lastCachedDDL.ddlTotal / gpxData.totalDistance);
            if (ddlPerKm > 150 && lastCachedDDL.fatigueOnsetKm) {
                extraItems.push(`<span style="color: #ff9090;">🦵 Legs @ km ${Math.round(lastCachedDDL.fatigueOnsetKm)}</span>`);
            }
        }
        
        if (extraItems.length > 0) {
            nightDdlRow = `<div style="display: flex; justify-content: center; gap: 20px; font-size: 12px; color: #ccc;">${extraItems.join('')}</div>`;
        }
        
        if (sortedClimbs.length > 0 || extraItems.length > 0) {
            challengesHtml = `
                <div style="background: rgba(255,255,255,0.05); border-radius: 10px; padding: 10px 12px; margin-bottom: 15px;">
                    <div style="font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; text-align: center;">🎯 Key Challenges</div>
                    ${climbsGrid}
                    ${nightDdlRow}
                </div>
            `;
        }

        // Base64 encoded GPXray logo for html2canvas compatibility
        const logoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFEAAAAoCAYAAACGohY/AAALaElEQVR4nNVbXZAdRRX+unvuvfvHJmyyJAtEiKiQTUIgIJIEISHGQtQXSyi1tEof5Un0Scoy5FGq9IWSorSssqTAIvhLgVoEzI9FQfGrxCywwCYBNpBsTLIJd/fOnek+Vv/N9Myd3UVf2HvC3rm3p7tn+sx3zvn6nIEtG1pBpAgdwgAic1hACCCm/6vuqxtL0zPGQETQ/5gbpbv48QQozhgnwsSpM8fXAGhXz7Q4hOvFGGH5YvyXhRSolQDdi+W/Kjp1iCKVKdBfv6wh3z6KUSx24R4JBnYBGj6MZGNhv/8vY7Nx7uH5a1vldpfwwq9gQZVSOm3VTtXny8guKMurvBOmxUehMIYxLHbJzNl8etMuSH6+fNoul5W7uu+lztqEw2uZIwu+5w7Bektze11izhlC8gVkiDDnOlSVSY4ydLYVgoXzgDqgeLMtuQ9/Je9n7XeFsdEuQGLZjPJoSdlC8z5za5MqmnODDdVTDEEWga4fq/Csi1+HQXQuSUg5wjZS+e8ihnOpVmjoBT3K/TmPzqJbYdqcR7vAnOc6UQU4s9iK4MKcdrziy/El9Hvlub1iCw/N6Fj/UhgbG+siJVZGZuf4FyaMsMOLftScyoKJ1jJlfrEQSkwf5z6cpnMD6RYkOlvKfFMmjrO5tYXnQ59J+k8rj3MQ41A+8hacqCXleoxWozVuty0Kzuc2b++nC6wZkd+CoWROHVu1zHTtwm30Njs++ywYh4xj08brdacc3cchsGTEmeqCiJ0j3ymU0GXmHEhgVR3HDDl68cZ0OcAF0iRFY/PN6Nm0HbKdGkRm0MpM2AzMzdmhP/SL+U3oYXqO0e5QYkY5nF8sO35/9JzSk2TGBCAE0lYLjTUbwJYsAx8aRs8VVyKNYxAPFekVX7qDgB0Ur6stRAHdwhOtcoppm6pNmUGoRof2fWBIWi3IVgy2dBjR5evQ/MeT+ODAHvSs3wg2OATZbpv+1pTtmFwsQjNzDk4VuOTYPEgknT4iYY5adhI3DkYf9R8Rx24S5tzu3SIYMycr+X+EDZ1/QSn9UqTDORf02RqtDEDVelBfdzWSyXfR2LARrUOvQE2+bTQtVn8CS66+DtMHngCdPAEeCUMwjbpc0AgJZwffJFLM2DJNnLpweA3GxhZMhS2QJ3OLIv3UTLfbdu8WjwwPM0xttcNuA2HfPg5sBfZBYe0jTDfidibNg9DnGQtYci5RyO/yLV8Ff/PJHh1A0hT8hhsh4wR9G65FfPRNyHcOgzcaQJoiPTyOM3GMnuu3YuZvf1RMpkyR9qAEITh0/jIPUKWtXpn8VwUWh7wN+84sOS3YTtWKb4z6+htox88NMHVPM6X7FKk66j2sTvJembR7KardfpixL6zd/59VLeIPHUpbP8C2kedKM3cqySpezv18tBLDyOt8XUiaQ55ITEDFMcQVV0LwCDMHHkdcr2vrhmg0QEls7oLXalDH3kZz1Wqo9ddz+d7biLZsBf3reaTjByHqNZCUloh3ZDUCjmk+tTl3KFIvTJ3a8/6vCI3Pccbv4KSOKkTJlEwGG7XaNp60v6YIF8SM/7bB2I5ZRWsv3X/6vpkk2UBMNnuXrnz5or2n7+6BmiTGRhSJw5Kxz3OGU72s9fM26tulUtNHGXvo4qdOfYNxPvjOtqX3Gzexq4hIzU3yvGqufZd5tvdrHzwHpAINDEJcvg7xi88g6u+DqAkwIUAysf6PaVek3SZXOPgyxNqrn+C3fvWl9J8voX90g+IrLoJMJRjXJu4fVb5f99e3++gK12WRoUb3Hh9QjH1JqPb33t0x/CAjLO9RHyQSIpVp++xI39m9A2nzzyyq6wfbFEJdR1HjuxJ08eGbh28ZP312kJTc2Vb0Q3DWw5lqMpk+R2m6sdlSD8i0vVqmya9v+ct4Ayr9CVQyYq6/tfOmuLMq/3yzKGz+PBYdkdaLFxs3o/36q8AH0zbAkKUqpptSAEnQbBPpwCBLrr8JmDk7wvY8NsSOjGPmxWdZ/ZotIFEzkbcQqQtc0t+UfuDV0VnWOGMmylH82b1nl0OIXU0Sj3GKG0xRNDk7sG+2PrAf8eyDb+1Y+QwSbKZ4VkGhf93fT6w+NzJ4TkqaiYm+P3Hj+XcpqSIu+EYGNa2AVX0pfqkUTb/GB37MGJL+iO43F953t6pMQLB5MwealnCouAX+qfVQOuIeHger10GtWSBJgDSxw03fCHLTNqRbtjPx7hHQX/+wHlOTl4qIQ04eZbMTbwBXboLyGvQPK2BC2UcVT9SBgYi/fsPwOSi5X0U9P3uHtT5dmz13LxFxpqiXc94n0va3h/rlVUe3L//mJXuPX8UGzvs9l+l3FOjxcxBPXzJ15kIuRB+HGNCBI42ihwXJaaTJ01FP/8jYjuEJDnoAy5bfxQkvvHbTBe+ZqL5rV6cS585mezLNACmhLvwk1JJhqIMvQG/sqN6AumYzsO1WyFUfN0pWIkKy/Ytm8bUnH4UYfwU8bSkmY0Latqb/5r9Bx49BrbzMKNyC2HnhjOR7s54DiXfbG+RKfIsz/qREdE9T1O9kUfT40kZjinP+p6HlA6+/eO3QtKY2Somvy3Z875EdK36T0Pt3QETPMtCXFacHqcaO6QjMkuRHstZYq2q11TKJH779EIRQ6hdIEoo4fpcppUpTy85fQcYkQ44QpPaJR6DepZD9S6CmJoH+AajLLgdWrAQ78hZwcgr0mS2ov3oQdOllSI5NIjr4PKi31+z4CmFC/9ZRSKVArdeCL5mxboC5wpXtrLQDIdDE6TPDa4CFKU6lWP+ZPxWNpDloSpWsfurEnUrRT2uJWPrmrcvPhhQpFN65X7D+yPpJHXbrkEJoHwS16SbIzVuNHxT7n4B49RWI45MQB/agcfHHwN4ahzj0EtDXB64UuOOGlh/atIQ56qCSzILaTbCM4Id76OIdzaskT6a17NypnbQl22YCs2DKyLZWYEi2LSF3iHFt+rhzr2EtguONqFH/ynwKLCLRXtRlWfSCyO5Oar1IzxsCnTcItGfBTp4AWjNgtShfplLGnJmIbHsWqVzqSyPNX9AkFxxHJDKKzjKyxj/aujMzDlFNnDoztQjqzqaqPue1o2LfPMhYI5BQ7Sb4ySYwpefQSq0BjZqlO5Bmfq0Y0dvrEKzbXER3uxO7rcyjuLuY3Rt7yRUYMFUfWD6i/bPZKrpdyzxSQqJTeikpoRFpg4wjx2HBn7wHsO2GM9mO+UXcjHb6PMlhLbnToRDIIZEWCRLnlwIS/aLC9JQ2Oaa5n+6QAcqbqRkFxoP9jVeeT3PliUgbSDISXywlFFJuebD+aJH4ISUqb/O0zEl6MgA6NDH9SohvD8sAOgozm491E4bKCpO/lXWyhV4iWGQyZ0po3kgZVuqYzerkYdCbc3FciD5fXemo72dfwpkWNwq1mI1udYnKSkdO0XyEreT6+3qMDyTl+cIiQPmzeM2CWXRLZrtYpgzE+TEv5UpJqTN8ktWP9bWSrBKYlwWDOa3yw3SbOzGfoSwqifKAoLf7OoiEMAyjtmkoDO7MfFP4o8MpFPOFQXnUhWrW8VLk3AmIxSSaRhRbSlDLdFdOdWeRl6pnLlX4cgXmZdgMrZ5XZpO6KVi3mHMQkvMdcxCB53OSZu2sw6/5dFpVKbbQ2/vj0isl2acZ3hVILBObgFRXSMf7sKxU1C8kdIsjCy+UhuS9VI4ooHvxA9FGZyMVSguV4yXItGTDWAFtPqEblljtyGxMxjNdMAoCTNhugdhN7yfOQ3DLHK9Q3mTFcYUAG9CdKlyHbcXA3GU8MaxrFElz4CPdm/5B7qBkvggAHbzTE9YeCnvpDmpeJNrmtEt4dIE9R8Y8QwrnfZTPLZT/3wpvioFSuI7xvvQaIK/gZbO3xVzKK9gS2gHeIqzLsIGpOyjOfwEvaLk7TP3ZBQAAAABJRU5ErkJggg==';
        
        card.innerHTML = `
            <div style="text-align: center; margin-bottom: 15px;">
                <div style="font-size: 16px; font-weight: 600; color: #00d4ff; margin-bottom: 4px;">GPXray</div>
                <div style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 2px; font-weight: 500;">${t('lockscreen.subtitle')}</div>
            </div>
            
            <div style="background: rgba(0,212,255,0.15); border-radius: 10px; padding: 12px 15px; margin-bottom: 15px;">
                <div style="font-size: 18px; font-weight: bold; text-align: center; margin-bottom: 8px;">${routeName}</div>
                <div style="display: flex; justify-content: center; gap: 20px; font-size: 14px; color: #ccc;">
                    <span>${distance.toFixed(1)} ${unitLabel}</span>
                    <span>+${gpxData.elevationGain.toFixed(0)}m</span>
                    <span>-${gpxData.elevationLoss.toFixed(0)}m</span>
                </div>
            </div>
            
            ${timesSection ? `<div style="text-align: center; margin-bottom: 15px;">${timesSection}</div>` : ''}
            
            ${challengesHtml}
            
            ${aidStationsList ? `
                <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 15px; margin-bottom: 20px;">
                    <div style="font-size: 16px; color: #aaa; margin-bottom: 12px; text-align: center; font-weight: 600;">⏱️ ${t('lockscreen.raceSchedule')}</div>
                    <div style="display: flex; align-items: center; padding: 6px 0; border-bottom: 2px solid rgba(255,255,255,0.2); margin-bottom: 8px;">
                        <span style="color: #888; min-width: 55px; font-size: 12px; font-weight: 600;">${unitLabel.toUpperCase()}</span>
                        <span style="flex: 1; margin: 0 6px; font-size: 12px; color: #888; font-weight: 600;">${t('lockscreen.station')}</span>
                        <span style="color: #888; font-size: 12px; margin-right: 10px; font-weight: 600;">${t('lockscreen.race')}</span>
                        <span style="color: #888; min-width: 75px; text-align: right; font-size: 12px; font-weight: 600;">${t('lockscreen.clock')}</span>
                    </div>
                    ${aidStationsList}
                </div>
            ` : ''}
            
            <div style="position: absolute; bottom: 20px; left: 0; right: 0; text-align: center;">
                <div style="font-size: 11px; color: #555;">gpxray.run</div>
            </div>
        `;

        document.body.appendChild(card);

        // Use html2canvas to capture the card
        const canvas = await html2canvas(card, {
            width: 540,
            height: 960,
            scale: 2,
            backgroundColor: null,
            logging: false
        });

        // Remove temporary element
        document.body.removeChild(card);

        // Download as PNG
        const link = document.createElement('a');
        const fileName = (currentRouteName || 'race_plan').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.download = `${fileName}_share_card.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        // Track export
        trackEvent('export_share_card', { race_name: currentRouteName || 'unknown' });

    } catch (error) {
        console.error('Share card generation error:', error);
        alert('Failed to generate share card. Please try again.');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

// Instagram Story Card Export - Fun shareable story with witty time-based statements
async function exportStoryCard() {
    // In demo mode, show early access prompt (except for RET races which have it unlocked)
    const isRETRace = currentRouteName && 
        (currentRouteName.toLowerCase().includes('ret') || 
         currentRouteName.toLowerCase().includes('rureifel'));
    
    if (isDemoMode && !isRETRace) {
        showEarlyAccessModal();
        return;
    }
    
    if (!gpxData || segments.length === 0) {
        alert('Please load a GPX file and calculate your race strategy first.');
        return;
    }

    const btn = document.getElementById('exportStoryCard');
    const originalText = btn.textContent;
    btn.textContent = t('btn.creating');
    btn.disabled = true;

    try {
        // Get race info
        const unitLabel = useMetric ? 'km' : 'mi';
        const distance = useMetric ? gpxData.totalDistance : gpxData.totalDistance * KM_TO_MILES;
        const totalTimeText = document.getElementById('totalTime')?.textContent || '-';
        const timeInput = document.getElementById('raceStartTime');
        const startTime = timeInput?.value || '06:00';

        // Get finish clock time
        let finishClockTime = '';
        const splitsTable = document.getElementById('splitsTable');
        if (splitsTable) {
            const allRows = splitsTable.querySelectorAll('tbody tr');
            if (allRows.length > 0) {
                const lastRow = allRows[allRows.length - 1];
                const cells = lastRow.querySelectorAll('td');
                finishClockTime = cells[10]?.textContent || ''; // Clock Time column
            }
        }

        // Parse total time to get hours for statement selection
        let totalHours = 0;
        const timeMatch = totalTimeText.match(/(\d+):(\d+)/);
        if (timeMatch) {
            totalHours = parseInt(timeMatch[1]) + parseInt(timeMatch[2]) / 60;
        }

        // Parse finish clock time for statement
        let finishHour = 12;
        let isNextDay = finishClockTime.includes('+1') || finishClockTime.includes('+2');
        const clockMatch = finishClockTime.match(/(\d+):(\d+)/);
        if (clockMatch) {
            finishHour = parseInt(clockMatch[1]);
        }

        // Use the statement from preview (already selected by user via reroll)
        let wittyStatement = getWittyStatement(finishHour, isNextDay, totalHours, currentStatementIndex);

        // Format target time (simplified)
        let targetTime = totalTimeText.split('(')[0].trim();
        if (targetTime.includes(':')) {
            const parts = targetTime.split(':');
            if (parts.length >= 2) {
                const h = parseInt(parts[0]);
                targetTime = `Sub ${h + 1}h`;
            }
        }

        let routeName = currentRouteName || 'My Race';
        if (routeName.length > 30) {
            routeName = routeName.substring(0, 27) + '...';
        }

        // Get race date and format with weekday
        const dateInput = document.getElementById('raceStartDate');
        let raceDateFormatted = '';
        if (dateInput?.value) {
            const raceDate = new Date(dateInput.value);
            const weekdays = currentLang === 'de' 
                ? ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
                : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const months = currentLang === 'de'
                ? ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
                : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            const weekday = weekdays[raceDate.getDay()];
            const day = raceDate.getDate();
            const month = months[raceDate.getMonth()];
            const year = raceDate.getFullYear();
            raceDateFormatted = currentLang === 'de' 
                ? `${weekday}, ${day}. ${month} ${year}`
                : `${weekday}, ${month} ${day}, ${year}`;
        }

        // Create Instagram Story sized card (1080x1920)
        const card = document.createElement('div');
        card.id = 'storyCardContainer';
        card.style.cssText = `
            position: fixed;
            left: -9999px;
            top: 0;
            width: 540px;
            height: 960px;
            background: linear-gradient(180deg, #0a1628 0%, #0d1f3c 50%, #0a1628 100%);
            font-family: 'Sora', -apple-system, BlinkMacSystemFont, sans-serif;
            color: white;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            padding: 60px 40px;
        `;

        card.innerHTML = `
            <!-- Logo at Top -->
            <div style="text-align: center; padding-top: 20px;">
                <img id="storyCardLogo" crossorigin="anonymous" src="img/gpxray-icon-256.png" style="height: 100px; width: 100px; border-radius: 18px;">
            </div>
            
            <!-- Witty Statement -->
            <div style="text-align: center;">
                <div style="font-size: 36px; font-weight: 600; font-style: italic; color: #00E5FF; line-height: 1.4; max-width: 440px;">
                    ${wittyStatement}
                </div>
            </div>
            
            <!-- Race Strategy Block -->
            <div style="text-align: center;">
                <div style="font-size: 18px; color: #888; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 16px;">👟 ${t('story.myStrategy')}</div>
                <div style="font-size: 30px; font-weight: 700; margin-bottom: 12px; max-width: 400px;">${routeName}</div>
                ${raceDateFormatted ? `<div style="font-size: 18px; color: #00E5FF; margin-bottom: 16px;">📅 ${raceDateFormatted}</div>` : ''}
                <div style="font-size: 26px; font-weight: 500; color: #ddd; margin-bottom: 20px;">${distance.toFixed(0)}${unitLabel} | ${gpxData.elevationGain.toFixed(0)}m</div>
                <div style="font-size: 20px; color: #aaa; margin-bottom: 8px;">${t('story.start')}: ${formatStartTime(startTime)}</div>
                <div style="font-size: 20px; color: #aaa;">${t('story.target')}: ${targetTime}</div>
            </div>
            
            <!-- Footer Wordmark Only -->
            <div style="text-align: center; padding-bottom: 20px;">
                <div style="font-size: 14px; color: #666; margin-bottom: 8px;">${t('story.createdBy')}</div>
                <div style="font-size: 28px; font-weight: 700; color: #00E5FF; letter-spacing: 1px;">GPXray</div>
            </div>
        `;

        document.body.appendChild(card);

        // Wait for logo image to load
        const logoImg = card.querySelector('#storyCardLogo');
        if (logoImg && !logoImg.complete) {
            await new Promise((resolve) => {
                logoImg.onload = resolve;
                logoImg.onerror = resolve;
            });
        }

        // Use html2canvas to capture (scale 2x for retina)
        const canvas = await html2canvas(card, {
            width: 540,
            height: 960,
            scale: 2,
            backgroundColor: null,
            logging: false,
            useCORS: true,
            allowTaint: false
        });

        document.body.removeChild(card);

        // Create blob and file for sharing
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const fileName = (currentRouteName || 'race_story').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const file = new File([blob], `${fileName}_story.png`, { type: 'image/png' });

        // Check if Web Share API is available and can share files (mobile)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            // Mobile - use native share (Instagram, WhatsApp, etc.)
            try {
                await navigator.share({
                    title: `${routeName} - Race Strategy`,
                    text: `${wittyStatement.replace(/<br>/g, ' ')}\n\n👟 ${routeName}\n📅 ${raceDateFormatted}\n\nPlan your race with https://gpxray.run`,
                    files: [file]
                });
                trackEvent('share_story_card', { race_name: currentRouteName || 'unknown', method: 'native' });
            } catch (shareError) {
                if (shareError.name !== 'AbortError') {
                    // User cancelled, that's fine. Otherwise fall back to download
                    downloadStoryCard(canvas, fileName);
                    trackEvent('export_story_card', { race_name: currentRouteName || 'unknown', method: 'download_fallback' });
                }
            }
        } else {
            // Desktop - download
            downloadStoryCard(canvas, fileName);
            trackEvent('export_story_card', { race_name: currentRouteName || 'unknown', method: 'download' });
        }

    } catch (error) {
        console.error('Story card generation error:', error);
        alert('Failed to generate story card. Please try again.');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

// Helper function to download story card as PNG
function downloadStoryCard(canvas, fileName) {
    const link = document.createElement('a');
    link.download = `${fileName}_story.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// Try to get AI-generated statement (location-aware)
async function getAIStatement(raceName, location, finishHour, isNextDay, totalHours) {
    // Only try AI if we have location info
    if (!location || !API_CONFIG.aiStatementEndpoint) {
        return null;
    }
    
    try {
        const response = await fetch(API_CONFIG.aiStatementEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                raceName: raceName,
                location: location,
                finishHour: finishHour,
                isNextDay: isNextDay,
                totalHours: totalHours,
                lang: currentLang || 'en'
            }),
            signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        if (!response.ok) {
            return null;
        }
        
        const data = await response.json();
        if (data.statement && data.source === 'ai') {
            console.log('AI statement generated:', data.statement);
            trackEvent('ai_statement_generated', { race: raceName, location: location });
            return data.statement;
        }
        
        return null;
    } catch (error) {
        console.log('AI statement fallback to local:', error.message);
        return null;
    }
}

// Get statement category based on finish time
function getStatementCategory(finishHour, isNextDay, totalHours) {
    if (isNextDay || totalHours >= 24) return 'nextDay';
    if (finishHour < 7) return 'earlyMorning';
    if (finishHour < 11) return 'morning';
    if (finishHour < 14) return 'midday';
    if (finishHour < 18) return 'afternoon';
    if (finishHour < 21) return 'evening';
    if (finishHour < 24) return 'night';
    return 'default';
}

// Get statement keys for a category
function getStatementKeys(category) {
    if (category === 'default') return ['story.default'];
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(i => `story.${category}.${i}`);
}

// Get witty statement based on finish time (local fallback)
function getWittyStatement(finishHour, isNextDay, totalHours, forceIndex = null) {
    const category = getStatementCategory(finishHour, isNextDay, totalHours);
    const keys = getStatementKeys(category);
    
    // Update current category for reroll
    currentStatementCategory = category;
    
    // Use forced index or current index
    const index = forceIndex !== null ? forceIndex : currentStatementIndex;
    const safeIndex = index % keys.length;
    
    return t(keys[safeIndex]);
}

// Reroll to next statement in current category
function rerollStatement() {
    if (!currentStatementCategory) return;
    
    const keys = getStatementKeys(currentStatementCategory);
    currentStatementIndex = (currentStatementIndex + 1) % keys.length;
    
    // Update preview display
    updateStatementPreview();
}

// Update statement preview display
function updateStatementPreview() {
    const previewEl = document.getElementById('statementPreview');
    if (!previewEl) return;
    
    // Get current finish time info
    const finishInfo = getFinishTimeInfo();
    if (!finishInfo) return;
    
    let statement = getWittyStatement(finishInfo.finishHour, finishInfo.isNextDay, finishInfo.totalHours, currentStatementIndex);
    // Replace <br> tags with space for preview display
    statement = statement.replace(/<br\s*\/?>/gi, ' ');
    previewEl.textContent = `"${statement}"`;
}

// Get finish time info for statement generation
function getFinishTimeInfo() {
    const totalTimeText = document.getElementById('totalTime')?.textContent || '-';
    const splitsTable = document.getElementById('splitsTable');
    
    let finishClockTime = '';
    if (splitsTable) {
        const allRows = splitsTable.querySelectorAll('tbody tr');
        if (allRows.length > 0) {
            const lastRow = allRows[allRows.length - 1];
            const cells = lastRow.querySelectorAll('td');
            finishClockTime = cells[10]?.textContent || ''; // Clock Time column
        }
    }
    
    let totalHours = 0;
    const timeMatch = totalTimeText.match(/(\d+):(\d+)/);
    if (timeMatch) {
        totalHours = parseInt(timeMatch[1]) + parseInt(timeMatch[2]) / 60;
    }
    
    let finishHour = 12;
    let isNextDay = finishClockTime.includes('+1') || finishClockTime.includes('+2');
    const clockMatch = finishClockTime.match(/(\d+):(\d+)/);
    if (clockMatch) {
        finishHour = parseInt(clockMatch[1]);
    }
    
    return { finishHour, isNextDay, totalHours };
}

// Initialize statement preview when share section becomes visible
function initStatementPreview() {
    const previewEl = document.getElementById('statementPreview');
    if (!previewEl) return;
    
    // Reset index for new calculation
    currentStatementIndex = Math.floor(Math.random() * 10);
    updateStatementPreview();
}

// Format start time nicely (24h format)
function formatStartTime(time) {
    const [h, m] = time.split(':').map(Number);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// Crew Card Export - Simple card for sharing AID station schedule with supporters
async function exportCrewCard() {
    if (!gpxData || segments.length === 0) {
        alert('Please load a GPX file and calculate your race strategy first.');
        return;
    }

    if (aidStations.length === 0) {
        alert('Please add AID stations first. Your crew needs to know where to meet you!');
        return;
    }

    const btn = document.getElementById('exportCrewCard');
    const originalText = btn.textContent;
    btn.textContent = t('btn.creating');
    btn.disabled = true;

    try {
        // Get race info
        const unitLabel = useMetric ? 'km' : 'mi';
        const distance = useMetric ? gpxData.totalDistance : gpxData.totalDistance * KM_TO_MILES;
        const totalTime = document.getElementById('totalTime')?.textContent || '-';
        const dateInput = document.getElementById('raceStartDate');
        const timeInput = document.getElementById('raceStartTime');
        const raceDate = dateInput?.value || '';
        const raceTime = timeInput?.value || '06:00';

        // Format date nicely (locale-aware)
        let formattedDate = '';
        if (raceDate) {
            const d = new Date(raceDate);
            const locale = getLang() === 'de' ? 'de-DE' : 'en-US';
            formattedDate = d.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        }

        // Get finish clock time
        let finishClockTime = '';
        const splitsTable = document.getElementById('splitsTable');
        if (splitsTable) {
            const allRows = splitsTable.querySelectorAll('tbody tr');
            if (allRows.length > 0) {
                const lastRow = allRows[allRows.length - 1];
                const cells = lastRow.querySelectorAll('td');
                finishClockTime = cells[10]?.textContent || ''; // Clock Time column
            }
        }

        // Get AID station data from splits table
        const sortedStations = [...aidStations].sort((a, b) => a.km - b.km);
        const stationData = [];
        const addedStations = new Set(); // Track added stations to prevent duplicates
        
        if (splitsTable) {
            const rows = splitsTable.querySelectorAll('tbody tr.aid-station-row');
            
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                const distCell = cells[0]?.textContent?.trim() || '';
                const aidName = cells[4]?.textContent || '';
                const clockTime = cells[9]?.textContent || '';
                
                if (aidName && aidName !== '-' && !addedStations.has(aidName)) {
                    // Parse distance and find matching AID station
                    const rowDist = parseFloat(distCell);
                    const rowKm = useMetric ? rowDist : rowDist * MILES_TO_KM;
                    const station = sortedStations.find(s => Math.abs(s.km - rowKm) < 0.5);
                    
                    if (station) {
                        const stopMin = station.stopMin || 0;
                        
                        // Calculate departure time (arrival + stop time)
                        let departureTime = clockTime;
                        if (stopMin > 0 && clockTime) {
                            const timeParts = clockTime.split(':');
                            if (timeParts.length >= 2) {
                                let hours = parseInt(timeParts[0]);
                                let mins = parseInt(timeParts[1]);
                                mins += stopMin;
                                hours += Math.floor(mins / 60);
                                mins = mins % 60;
                                hours = hours % 24;
                                departureTime = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
                            }
                        }
                        
                        // Use exact station km for display
                        const displayDist = useMetric ? station.km : station.km * KM_TO_MILES;
                        
                        // Calculate leg insights for crew
                        const stationIndex = sortedStations.indexOf(station);
                        const prevKm = stationIndex === 0 ? 0 : sortedStations[stationIndex - 1].km;
                        const legGain = calculateElevationGainBetween(prevKm, station.km);
                        const legLoss = calculateElevationLossBetween(prevKm, station.km);
                        const legDist = station.km - prevKm;
                        
                        // Parse clock time to check for night
                        let isNight = false;
                        if (clockTime) {
                            const hour = parseInt(clockTime.split(':')[0]);
                            isNight = hour < 6 || hour >= 20;
                        }
                        
                        // Generate crew insight for previous leg (translated)
                        let crewInsight = '';
                        if (legGain > 400) {
                            crewInsight = `⛰️ ${t('crew.afterClimb').replace('{0}', Math.round(legGain))}`;
                        } else if (legLoss > 400) {
                            crewInsight = `🦵 ${t('crew.afterDescent').replace('{0}', Math.round(legLoss))}`;
                        } else if (legDist > 15) {
                            crewInsight = `🏃 ${t('crew.longLeg').replace('{0}', legDist.toFixed(0))}`;
                        }
                        
                        if (isNight) {
                            crewInsight = crewInsight ? `${crewInsight} • 🌙 ${t('crew.night')}` : `🌙 ${t('crew.nightArrival')}`;
                        }
                        
                        // NEW: Calculate additional crew info
                        // 1. % Complete
                        const percentComplete = Math.round((station.km / gpxData.totalDistance) * 100);
                        
                        // 2. Elevation at station
                        const stationElevation = Math.round(getElevationAtDistance(station.km));
                        
                        // 3. Cumulative D+
                        const cumulativeGain = Math.round(calculateElevationGainBetween(0, station.km));
                        
                        // Store station km for next leg calculation
                        const stationKm = station.km;
                        
                        stationData.push({ 
                            dist: displayDist.toFixed(1), 
                            name: aidName, 
                            clockTime,
                            departureTime,
                            stopMin,
                            crewInsight,
                            percentComplete,
                            stationElevation,
                            cumulativeGain,
                            stationKm,
                            crewAllowed: station.crewAllowed || false
                        });
                        addedStations.add(aidName);
                    }
                }
            });
        }
        
        // Calculate time to next station and next leg info for each station
        for (let i = 0; i < stationData.length; i++) {
            const station = stationData[i];
            const nextStation = stationData[i + 1];
            
            if (nextStation) {
                // 4. Time to next station
                const depTime = station.departureTime || station.clockTime;
                const arrTime = nextStation.clockTime;
                if (depTime && arrTime) {
                    const [depH, depM] = depTime.split(':').map(Number);
                    const [arrH, arrM] = arrTime.split(':').map(Number);
                    let diffMins = (arrH * 60 + arrM) - (depH * 60 + depM);
                    if (diffMins < 0) diffMins += 24 * 60; // Handle day rollover
                    const hours = Math.floor(diffMins / 60);
                    const mins = diffMins % 60;
                    station.timeToNext = hours > 0 ? `${hours}h${mins > 0 ? mins + 'm' : ''}` : `${mins}m`;
                }
                
                // 5. Next leg description
                const nextGain = calculateElevationGainBetween(station.stationKm, nextStation.stationKm);
                const nextLoss = calculateElevationLossBetween(station.stationKm, nextStation.stationKm);
                const nextDist = nextStation.stationKm - station.stationKm;
                
                if (nextGain > 400 && nextGain > nextLoss) {
                    station.nextLeg = `↗️ ${t('crew.climbAhead').replace('{0}', Math.round(nextGain))}`;
                } else if (nextLoss > 400 && nextLoss > nextGain) {
                    station.nextLeg = `↘️ ${t('crew.descentAhead').replace('{0}', Math.round(nextLoss))}`;
                } else if (nextDist > 15) {
                    station.nextLeg = `➡️ ${t('crew.kmToNext').replace('{0}', nextDist.toFixed(0))}`;
                } else {
                    station.nextLeg = `➡️ ${t('crew.kmToNext').replace('{0}', nextDist.toFixed(1))}`;
                }
            } else {
                // Last station before finish
                const finishKm = gpxData.totalDistance;
                const toFinish = finishKm - station.stationKm;
                const finishGain = calculateElevationGainBetween(station.stationKm, finishKm);
                const finishLoss = calculateElevationLossBetween(station.stationKm, finishKm);
                
                if (finishGain > 300 && finishGain > finishLoss) {
                    station.nextLeg = `🏁 ${t('crew.kmPlusClimbToFinish').replace('{0}', toFinish.toFixed(1)).replace('{1}', Math.round(finishGain))}`;
                } else if (finishLoss > 300 && finishLoss > finishGain) {
                    station.nextLeg = `🏁 ${t('crew.kmDescentToFinish').replace('{0}', toFinish.toFixed(1))}`;
                } else {
                    station.nextLeg = `🏁 ${t('crew.kmToFinish').replace('{0}', toFinish.toFixed(1))}`;
                }
            }
        }

        // Dynamic sizing based on station count
        const stationCount = stationData.length;
        let rowPadding, iconSize, nameSize, detailSize, timeSize, etaSize, rowGap, headerPadding;
        
        if (stationCount <= 4) {
            // Normal mode
            rowPadding = '12px 16px';
            iconSize = '24px';
            nameSize = '16px';
            detailSize = '12px';
            timeSize = '24px';
            etaSize = '10px';
            rowGap = '8px';
            headerPadding = '20px';
        } else if (stationCount <= 6) {
            // Medium compact
            rowPadding = '10px 14px';
            iconSize = '22px';
            nameSize = '15px';
            detailSize = '11px';
            timeSize = '22px';
            etaSize = '9px';
            rowGap = '6px';
            headerPadding = '18px';
        } else if (stationCount <= 8) {
            // Compact mode (7-8 stations)
            rowPadding = '8px 12px';
            iconSize = '20px';
            nameSize = '14px';
            detailSize = '10px';
            timeSize = '20px';
            etaSize = '8px';
            rowGap = '5px';
            headerPadding = '15px';
        } else {
            // Ultra-compact mode (9-10+ stations)
            rowPadding = '6px 10px';
            iconSize = '18px';
            nameSize = '13px';
            detailSize = '9px';
            timeSize = '18px';
            etaSize = '8px';
            rowGap = '4px';
            headerPadding = '12px';
        }

        // Calculate card height based on number of stations and sizing mode
        // Use 9:16 aspect ratio (social media friendly) with width of 540px
        const cardWidth = 540;
        const targetHeight = 960; // 540 * 16/9 = 960 for 9:16 ratio
        // Compact row heights
        const rowHeightEstimate = stationCount <= 4 ? 90 : (stationCount <= 6 ? 80 : (stationCount <= 8 ? 70 : 60));
        const headerHeight = stationCount <= 4 ? 120 : (stationCount <= 6 ? 100 : (stationCount <= 8 ? 85 : 70));
        const footerHeight = 60;
        const contentHeight = headerHeight + (stationData.length + 1) * rowHeightEstimate + footerHeight + 40;
        // Always use 9:16 ratio (960px), expand only if content requires more
        const cardHeight = Math.max(targetHeight, contentHeight);

        // Create card container
        const card = document.createElement('div');
        card.id = 'crewCardContainer';
        const cardPadding = stationCount <= 6 ? '25px' : (stationCount <= 8 ? '20px' : '15px');
        card.style.cssText = `
            position: fixed;
            left: -9999px;
            top: 0;
            width: ${cardWidth}px;
            height: ${cardHeight}px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: white;
            padding: ${cardPadding};
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
        `;

        // Handle title - allow 2 lines, adjust font size for long names
        let routeName = currentRouteName || 'Race';
        let titleSize = stationCount <= 6 ? '22px' : (stationCount <= 8 ? '20px' : '18px');
        let titleLineHeight = '1.2';
        
        if (routeName.length > 40) {
            titleSize = stationCount <= 6 ? '18px' : '16px';
        } else if (routeName.length > 30) {
            titleSize = '22px';
        }

        // Build station rows HTML
        let stationsHtml = stationData.map((station, index) => {
            // Truncate long station names - station names can be longer since we have CSS overflow handling
            let stationName = station.name;
            const maxNameLen = stationCount <= 4 ? 35 : (stationCount <= 6 ? 32 : (stationCount <= 8 ? 30 : 28));
            if (stationName.length > maxNameLen) {
                stationName = stationName.substring(0, maxNameLen - 1) + '…';
            }
            
            // Show arrival time, and time range if there's a stop
            const arrivalTime = station.clockTime.substring(0, 5); // HH:MM
            const departureTime = station.departureTime ? station.departureTime.substring(0, 5) : arrivalTime;
            const hasStop = station.stopMin > 0 && arrivalTime !== departureTime;
            const timeDisplay = hasStop ? `${arrivalTime} - ${departureTime}` : arrivalTime;
            const timeFontSize = hasStop ? (stationCount <= 4 ? '20px' : (stationCount <= 6 ? '17px' : (stationCount <= 8 ? '15px' : '14px'))) : timeSize;
            
            // Build detail lines with new info (translated)
            const breakText = station.stopMin > 0 ? ` · ${station.stopMin}${t('crew.minBreak')}` : '';
            const detailLine1 = `${station.dist} ${unitLabel} · ${station.percentComplete}%${breakText}`;
            const detailLine2 = `📍 ${station.stationElevation}m · D+ ${station.cumulativeGain}m`;
            const timeToNextText = station.timeToNext ? ` · ~${station.timeToNext} ${t('crew.toNext')}` : '';
            const nextLegLine = station.nextLeg + timeToNextText;
            
            const iconMargin = stationCount <= 6 ? '10px' : (stationCount <= 8 ? '8px' : '6px');
            const crewBadgeSize = stationCount <= 6 ? '10px' : '9px';
            const crewBadge = station.crewAllowed ? `<div style="position: absolute; top: 6px; right: 6px; background: rgba(76,175,80,0.5); padding: 3px 8px; border-radius: 4px; font-size: ${crewBadgeSize}; color: #90EE90; display: flex; align-items: center; justify-content: center; line-height: 1;">👥 Crew</div>` : '';
            
            return `
                <div style="display: flex; align-items: center; padding: ${rowPadding}; background: rgba(255,255,255,0.1); border-radius: 10px; margin-bottom: ${rowGap}; position: relative;">
                    ${crewBadge}
                    <div style="font-size: ${iconSize}; margin-right: ${iconMargin};">📍</div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-size: ${nameSize}; font-weight: 700; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${stationName}</div>
                        <div style="font-size: ${detailSize}; opacity: 0.8;">${detailLine1}</div>
                        <div style="font-size: ${detailSize}; opacity: 0.7;">${detailLine2}</div>
                        ${station.crewInsight ? `<div style="font-size: ${detailSize}; font-weight: 600; color: #ffd700;">${station.crewInsight}</div>` : ''}
                        <div style="font-size: ${detailSize}; opacity: 0.8; color: #90EE90;">${nextLegLine}</div>
                    </div>
                    <div style="text-align: right; margin-left: 10px;">
                        <div style="font-size: ${timeFontSize}; font-weight: 800;">${timeDisplay}</div>
                        <div style="font-size: ${etaSize}; opacity: 0.7;">ETA</div>
                    </div>
                </div>
            `;
        }).join('');

        // Add finish row
        const finishTimeDisplay = finishClockTime ? finishClockTime.substring(0, 5) : finishClockTime;
        const totalElevGain = Math.round(gpxData.elevationGain);
        const finishIconMargin = stationCount <= 6 ? '10px' : (stationCount <= 8 ? '8px' : '6px');
        
        // Check cutoff for Crew Card
        let crewCutoffHtml = '';
        if (currentDistanceConfig && currentDistanceConfig.finishCutoff && finishClockTime) {
            const cutoff = currentDistanceConfig.finishCutoff;
            const [finishH, finishM] = finishClockTime.split(':').map(Number);
            const [cutoffH, cutoffM] = cutoff.split(':').map(Number);
            const finishMins = finishH * 60 + finishM;
            const cutoffMins = cutoffH * 60 + cutoffM;
            const isOver = finishMins > cutoffMins;
            const icon = isOver ? '⚠️' : '✓';
            const color = isOver ? '#f44336' : '#90EE90';
            crewCutoffHtml = `<div style="font-size: ${detailSize}; font-weight: 600; color: ${color};">${icon} Cutoff: ${cutoff}</div>`;
        }
        
        stationsHtml += `
            <div style="display: flex; align-items: center; padding: ${rowPadding}; background: rgba(76,175,80,0.4); border-radius: 10px; border: 2px solid rgba(76,175,80,0.8);">
                <div style="font-size: ${iconSize}; margin-right: ${finishIconMargin};">🏁</div>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-size: ${nameSize}; font-weight: 700; margin-bottom: 2px;">${t('crew.finish')}</div>
                    <div style="font-size: ${detailSize}; opacity: 0.8;">${distance.toFixed(1)} ${unitLabel} · 100%</div>
                    <div style="font-size: ${detailSize}; opacity: 0.7;">D+ ${totalElevGain}m · ${totalTime.split('(')[0].trim()}</div>
                    ${crewCutoffHtml}
                </div>
                <div style="text-align: right; margin-left: 10px;">
                    <div style="font-size: ${timeSize}; font-weight: 800;">${finishTimeDisplay}</div>
                    <div style="font-size: ${etaSize}; opacity: 0.7;">ETA</div>
                </div>
            </div>
        `;

        const headerFontSize = stationCount <= 6 ? '12px' : '10px';
        const headerDateSize = stationCount <= 6 ? '14px' : '12px';
        const footerPadding = stationCount <= 6 ? '15px' : '10px';
        const footerLogoSize = stationCount <= 6 ? '18px' : '14px';
        const hasCrewStations = stationData.some(s => s.crewAllowed);
        const legendSize = stationCount <= 6 ? '11px' : '10px';
        const crewLegend = hasCrewStations ? `<div style="font-size: ${legendSize}; opacity: 0.9; margin-top: 6px; display: flex; align-items: center; justify-content: center; gap: 6px;"><span style="background: rgba(76,175,80,0.5); padding: 2px 6px; border-radius: 4px; color: #90EE90; font-size: ${legendSize};">👥 Crew</span> = ${t('crew.legendText')}</div>` : '';

        card.innerHTML = `
            <div style="text-align: center; margin-bottom: ${headerPadding};">
                <div style="font-size: ${headerFontSize}; text-transform: uppercase; letter-spacing: 3px; opacity: 0.8; margin-bottom: 6px;">👥 ${t('crew.title')}</div>
                <div style="font-size: ${titleSize}; font-weight: 800; margin-bottom: 6px; line-height: ${titleLineHeight}; padding: 0 10px;">${routeName}</div>
                <div style="font-size: ${headerDateSize}; opacity: 0.9;">
                    ${formattedDate ? `📅 ${formattedDate} · ` : ''}🏃 ${t('crew.start')}: ${raceTime}
                </div>
                ${crewLegend}
            </div>
            
            <div style="flex: 1;">
                ${stationsHtml}
            </div>
            
            <div style="text-align: center; padding-top: ${footerPadding}; margin-top: auto; border-top: 1px solid rgba(255,255,255,0.2);">
                <div style="font-family: 'Sora', sans-serif; font-weight: 600; font-size: ${footerLogoSize}; color: #00E5FF; letter-spacing: 0.01em;">GPXray</div>
                <div style="font-size: 10px; opacity: 0.6; margin-top: 2px;">gpxray.run</div>
            </div>
        `;

        document.body.appendChild(card);

        // Capture with html2canvas
        const canvas = await html2canvas(card, {
            width: cardWidth,
            height: cardHeight,
            scale: 2,
            backgroundColor: null,
            logging: false
        });

        document.body.removeChild(card);

        // Check if Web Share API is available and can share files (mobile)
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const fileName = (currentRouteName || 'race').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const file = new File([blob], `${fileName}_crew_card.png`, { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            // Mobile - use native share (translated)
            try {
                await navigator.share({
                    title: t('crew.shareTitle').replace('{0}', routeName),
                    text: t('crew.shareText').replace('{0}', routeName),
                    files: [file]
                });
            } catch (shareError) {
                if (shareError.name !== 'AbortError') {
                    // User cancelled, that's fine. Otherwise fall back to download
                    downloadCrewCard(canvas, fileName);
                }
            }
        } else {
            // Desktop - download
            downloadCrewCard(canvas, fileName);
        }

    } catch (error) {
        console.error('Crew card generation error:', error);
        alert('Failed to generate crew card. Please try again.');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

function downloadCrewCard(canvas, fileName) {
    const link = document.createElement('a');
    link.download = `${fileName}_crew_card.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    // Track export
    trackEvent('export_crew_card', { race_name: currentRouteName || 'unknown' });
}

// Crew PDF Export - A4 printable schedule for crew/family
async function exportCrewPdf() {
    if (!gpxData || segments.length === 0) {
        alert('Please load a GPX file and calculate your race strategy first.');
        return;
    }

    if (aidStations.length === 0) {
        alert('Please add AID stations first. Your crew needs to know where to meet you!');
        return;
    }

    const btn = document.getElementById('exportCrewPdf');
    const originalText = btn.textContent;
    btn.textContent = t('btn.generating');
    btn.disabled = true;

    try {
        // Get race info
        const unitLabel = useMetric ? 'km' : 'mi';
        const distance = useMetric ? gpxData.totalDistance : gpxData.totalDistance * KM_TO_MILES;
        const totalTime = document.getElementById('totalTime')?.textContent || '-';
        const dateInput = document.getElementById('raceStartDate');
        const timeInput = document.getElementById('raceStartTime');
        const raceDate = dateInput?.value || '';
        const raceTime = timeInput?.value || '06:00';

        // Format date nicely
        let formattedDate = '';
        if (raceDate) {
            const d = new Date(raceDate);
            formattedDate = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        }

        // Get finish clock time
        let finishClockTime = '';
        const splitsTable = document.getElementById('splitsTable');
        if (splitsTable) {
            const rows = splitsTable.querySelectorAll('tbody tr');
            for (const row of rows) {
                const cells = row.cells;
                if (cells[0] && cells[0].textContent.includes('Finish')) {
                    finishClockTime = cells[5]?.textContent?.trim() || '';
                    break;
                }
            }
        }

        // Build station data (same logic as exportCrewCard)
        let stationData = [];
        const addedStations = new Set();
        
        if (splitsTable) {
            const rows = splitsTable.querySelectorAll('tbody tr');
            const sortedStations = [...aidStations].sort((a, b) => a.km - b.km);
            
            sortedStations.forEach(station => {
                const aidName = station.name;
                if (addedStations.has(aidName)) return;
                
                for (const row of rows) {
                    const cells = row.cells;
                    if (!cells[0]) continue;
                    
                    const segmentText = cells[0]?.textContent?.trim() || '';
                    if (segmentText.includes(aidName) || segmentText.endsWith(aidName)) {
                        const clockTime = cells[5]?.textContent?.trim() || '';
                        let stopMin = 0;
                        let departureTime = '';
                        
                        const stopCell = cells[1]?.textContent?.trim() || '';
                        const stopMatch = stopCell.match(/(\d+)\s*min/i);
                        if (stopMatch) {
                            stopMin = parseInt(stopMatch[1]);
                            if (clockTime && stopMin > 0) {
                                const [h, m] = clockTime.split(':').map(Number);
                                let mins = m + stopMin;
                                let hours = h;
                                hours += Math.floor(mins / 60);
                                mins = mins % 60;
                                hours = hours % 24;
                                departureTime = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
                            }
                        }
                        
                        const displayDist = useMetric ? station.km : station.km * KM_TO_MILES;
                        
                        // Calculate leg insights
                        const stationIndex = sortedStations.indexOf(station);
                        const prevKm = stationIndex === 0 ? 0 : sortedStations[stationIndex - 1].km;
                        const legGain = calculateElevationGainBetween(prevKm, station.km);
                        const legLoss = calculateElevationLossBetween(prevKm, station.km);
                        const legDist = station.km - prevKm;
                        
                        let isNight = false;
                        if (clockTime) {
                            const hour = parseInt(clockTime.split(':')[0]);
                            isNight = hour < 6 || hour >= 20;
                        }
                        
                        let crewInsight = '';
                        if (legGain > 400) {
                            crewInsight = `After ${Math.round(legGain)}m climb`;
                        } else if (legLoss > 400) {
                            crewInsight = `After ${Math.round(legLoss)}m descent`;
                        } else if (legDist > 15) {
                            crewInsight = `Long ${legDist.toFixed(0)}km leg`;
                        }
                        if (isNight) {
                            crewInsight = crewInsight ? `${crewInsight}, Night arrival` : 'Night arrival';
                        }
                        
                        const percentComplete = Math.round((station.km / gpxData.totalDistance) * 100);
                        const stationElevation = Math.round(getElevationAtDistance(station.km));
                        const cumulativeGain = Math.round(calculateElevationGainBetween(0, station.km));
                        
                        stationData.push({ 
                            dist: displayDist.toFixed(1), 
                            name: aidName, 
                            clockTime,
                            departureTime,
                            stopMin,
                            crewInsight,
                            percentComplete,
                            stationElevation,
                            cumulativeGain,
                            stationKm: station.km
                        });
                        addedStations.add(aidName);
                    }
                }
            });
        }
        
        // Calculate time to next and next leg info
        for (let i = 0; i < stationData.length; i++) {
            const station = stationData[i];
            const nextStation = stationData[i + 1];
            
            if (nextStation) {
                const depTime = station.departureTime || station.clockTime;
                const arrTime = nextStation.clockTime;
                if (depTime && arrTime) {
                    const [depH, depM] = depTime.split(':').map(Number);
                    const [arrH, arrM] = arrTime.split(':').map(Number);
                    let diffMins = (arrH * 60 + arrM) - (depH * 60 + depM);
                    if (diffMins < 0) diffMins += 24 * 60;
                    const hours = Math.floor(diffMins / 60);
                    const mins = diffMins % 60;
                    station.timeToNext = hours > 0 ? `${hours}h${mins > 0 ? mins + 'm' : ''}` : `${mins}m`;
                }
                
                const nextGain = calculateElevationGainBetween(station.stationKm, nextStation.stationKm);
                const nextLoss = calculateElevationLossBetween(station.stationKm, nextStation.stationKm);
                const nextDist = nextStation.stationKm - station.stationKm;
                
                if (nextGain > 400 && nextGain > nextLoss) {
                    station.nextLeg = `${Math.round(nextGain)}m climb ahead`;
                } else if (nextLoss > 400 && nextLoss > nextGain) {
                    station.nextLeg = `${Math.round(nextLoss)}m descent ahead`;
                } else {
                    station.nextLeg = `${nextDist.toFixed(1)}km to next`;
                }
            } else {
                const finishKm = gpxData.totalDistance;
                const toFinish = finishKm - station.stationKm;
                station.nextLeg = `${toFinish.toFixed(1)}km to finish`;
            }
        }

        // Generate PDF using jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        let y = margin;

        // Header background
        doc.setFillColor(102, 126, 234);
        doc.rect(0, 0, pageWidth, 35, 'F');
        
        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.setTextColor(255, 255, 255);
        const routeName = currentRouteName || 'Race';
        doc.text('CREW SCHEDULE', pageWidth / 2, 15, { align: 'center' });
        
        doc.setFontSize(14);
        doc.text(routeName, pageWidth / 2, 24, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const headerInfo = formattedDate ? `${formattedDate} • Start: ${raceTime}` : `Start: ${raceTime}`;
        doc.text(headerInfo, pageWidth / 2, 31, { align: 'center' });
        
        y = 45;

        // Race summary
        doc.setTextColor(60, 60, 60);
        doc.setFontSize(11);
        const totalElevGain = Math.round(calculateElevationGainBetween(0, gpxData.totalDistance));
        doc.text(`Distance: ${distance.toFixed(1)} ${unitLabel} • Elevation: +${totalElevGain}m • Est. Time: ${totalTime.split('(')[0].trim()}`, pageWidth / 2, y, { align: 'center' });
        
        y += 12;

        // Table header
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, y, pageWidth - 2 * margin, 10, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        
        const colX = {
            station: margin + 3,
            dist: margin + 55,
            elev: margin + 75,
            arrival: margin + 100,
            departure: margin + 125,
            notes: margin + 150
        };
        
        doc.text('AID STATION', colX.station, y + 7);
        doc.text('DIST', colX.dist, y + 7);
        doc.text('ELEV', colX.elev, y + 7);
        doc.text('ARRIVAL', colX.arrival, y + 7);
        doc.text('DEPART', colX.departure, y + 7);
        doc.text('NOTES', colX.notes, y + 7);
        
        y += 12;

        // Station rows
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        stationData.forEach((station, index) => {
            // Check if we need a new page
            if (y > pageHeight - 30) {
                doc.addPage();
                y = margin;
            }
            
            // Alternating row background
            if (index % 2 === 0) {
                doc.setFillColor(250, 250, 255);
                doc.rect(margin, y - 4, pageWidth - 2 * margin, 14, 'F');
            }
            
            doc.setTextColor(40, 40, 40);
            
            // Station name (bold)
            doc.setFont('helvetica', 'bold');
            let stationName = station.name;
            if (stationName.length > 20) {
                stationName = stationName.substring(0, 18) + '...';
            }
            doc.text(stationName, colX.station, y);
            
            doc.setFont('helvetica', 'normal');
            
            // Distance and %
            doc.text(`${station.dist} ${unitLabel} (${station.percentComplete}%)`, colX.dist, y);
            
            // Elevation
            doc.text(`${station.stationElevation}m`, colX.elev, y);
            
            // Arrival time
            doc.setFont('helvetica', 'bold');
            doc.text(station.clockTime.substring(0, 5), colX.arrival, y);
            doc.setFont('helvetica', 'normal');
            
            // Departure time
            if (station.stopMin > 0 && station.departureTime) {
                doc.text(station.departureTime.substring(0, 5), colX.departure, y);
            } else {
                doc.text('-', colX.departure, y);
            }
            
            // Notes column - combine insights
            let notes = [];
            if (station.stopMin > 0) notes.push(`${station.stopMin}min stop`);
            if (station.crewInsight) notes.push(station.crewInsight);
            if (station.timeToNext) notes.push(`~${station.timeToNext} to next`);
            
            const notesText = notes.slice(0, 2).join(', ');
            doc.setFontSize(8);
            doc.text(notesText || '-', colX.notes, y);
            doc.setFontSize(10);
            
            y += 14;
        });
        
        // Finish row
        if (y > pageHeight - 30) {
            doc.addPage();
            y = margin;
        }
        
        doc.setFillColor(200, 230, 200);
        doc.rect(margin, y - 4, pageWidth - 2 * margin, 14, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40, 40, 40);
        doc.text('FINISH', colX.station, y);
        doc.setFont('helvetica', 'normal');
        doc.text(`${distance.toFixed(1)} ${unitLabel} (100%)`, colX.dist, y);
        doc.text('-', colX.elev, y);
        doc.setFont('helvetica', 'bold');
        doc.text(finishClockTime.substring(0, 5), colX.arrival, y);
        
        y += 20;

        // Footer with branded GPXray
        if (y > pageHeight - 25) {
            doc.addPage();
            y = pageHeight - 20;
        } else {
            y = pageHeight - 20;
        }
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 229, 255); // #00E5FF
        doc.text('GPXray', pageWidth / 2 - 15, y);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 120, 120);
        doc.text(' • gpxray.run', pageWidth / 2 + 8, y);

        // Save PDF
        const fileName = (currentRouteName || 'race').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        doc.save(`${fileName}_crew_schedule.pdf`);
        
        // Track export
        trackEvent('export_crew_pdf', { race_name: currentRouteName || 'unknown' });

    } catch (error) {
        console.error('Crew PDF generation error:', error);
        alert('Failed to generate crew PDF. Please try again.');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

// ========================================
// Race Landing Page Mode (B2B Feature)
// ========================================

let currentRaceConfig = null;
let currentDistanceConfig = null;

// Show race code gate for protected race pages
function showRaceCodeGate(raceId, raceConfig) {
    const raceGate = document.getElementById('raceGate');
    const mainContent = document.getElementById('mainContent');
    const betaGate = document.getElementById('betaGate');
    const raceGateTitle = document.getElementById('raceGateTitle');
    
    if (!raceGate) return;
    
    // Hide other content
    if (betaGate) betaGate.style.display = 'none';
    if (mainContent) mainContent.style.display = 'none';
    
    // Update title with race name
    if (raceGateTitle) {
        raceGateTitle.textContent = `Enter access code for ${raceConfig.name}`;
    }
    
    // Show race gate
    raceGate.style.display = 'flex';
    
    // Focus input
    const codeInput = document.getElementById('raceCodeInput');
    if (codeInput) {
        codeInput.focus();
        
        // Handle enter key
        codeInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                validateRaceCode(raceId, raceConfig);
            }
        });
    }
    
    // Handle submit button
    const submitBtn = document.getElementById('raceCodeSubmit');
    if (submitBtn) {
        submitBtn.addEventListener('click', () => validateRaceCode(raceId, raceConfig));
    }
}

// Validate race access code
function validateRaceCode(raceId, raceConfig) {
    const codeInput = document.getElementById('raceCodeInput');
    const errorEl = document.getElementById('raceCodeError');
    
    if (!codeInput || !raceConfig.accessCode) return;
    
    const enteredCode = codeInput.value.trim().toUpperCase();
    const validCode = raceConfig.accessCode.toUpperCase();
    
    if (enteredCode === validCode) {
        // Store valid code
        localStorage.setItem(`gpxray-race-${raceId}`, enteredCode);
        
        // Hide gate and reload to show race page
        const raceGate = document.getElementById('raceGate');
        if (raceGate) raceGate.style.display = 'none';
        
        // Continue with race mode initialization
        currentRaceConfig = raceConfig;
        currentRaceLocation = raceConfig.location || '';
        initRaceModeContent(raceConfig);
    } else {
        // Show error
        if (errorEl) {
            errorEl.style.display = 'block';
            codeInput.style.borderColor = '#ff6b6b';
        }
    }
}

// Initialize race mode content (called after code validation)
function initRaceModeContent(raceConfig) {
    const mainContent = document.getElementById('mainContent');
    const raceLanding = document.getElementById('raceLanding');
    const uploadSection = document.querySelector('.upload-section');
    const introSection = document.querySelector('.intro-section');
    const addAidStationBox = document.getElementById('addAidStationBox');
    const planActionsBox = document.getElementById('planActionsBox');
    
    if (mainContent) mainContent.style.display = 'block';
    if (raceLanding) raceLanding.style.display = 'block';
    if (uploadSection) uploadSection.style.display = 'none';
    if (introSection) introSection.style.display = 'none';
    if (addAidStationBox) addAidStationBox.style.display = 'none'; // Hide add AID station in race mode
    if (planActionsBox) planActionsBox.style.display = 'none'; // Hide Save/Load Plan in race mode
    
    // Force metric units for race pages (German races use km)
    useMetric = true;
    const unitToggle = document.querySelector('.unit-toggle');
    if (unitToggle) unitToggle.style.display = 'none';
    
    // Update page title for SEO
    document.title = `${raceConfig.name} - Race Strategy | GPXray`;
    
    // Populate race landing page
    populateRaceLanding(raceConfig);
    
    // Setup Create Strategy button handler
    setupRaceCreateStrategyButton();
    
    // Track race page view
    trackEvent('race_landing_view', { race_id: raceConfig.id, race_name: raceConfig.name });
}

function initRaceMode() {
    // Check if races-config.js is loaded
    if (typeof detectRaceMode !== 'function') return;
    
    const raceId = detectRaceMode();
    if (!raceId) return;
    
    const raceConfig = getRaceConfig(raceId);
    if (!raceConfig) {
        console.warn(`Race config not found for: ${raceId}`);
        return;
    }
    
    // Check access code if required (skip if past publicDate)
    const isPublic = raceConfig.publicDate && new Date() >= new Date(raceConfig.publicDate);
    if (raceConfig.accessCode && !isPublic) {
        const urlParams = new URLSearchParams(window.location.search);
        const urlCode = urlParams.get('code');
        const storedCode = localStorage.getItem(`gpxray-race-${raceId}`);
        
        // Validate code from URL or localStorage
        const validCode = raceConfig.accessCode.toUpperCase();
        const hasValidAccess = (urlCode && urlCode.toUpperCase() === validCode) || 
                               (storedCode && storedCode.toUpperCase() === validCode);
        
        if (!hasValidAccess) {
            // Show race code gate
            showRaceCodeGate(raceId, raceConfig);
            return;
        }
        
        // Store valid code for future visits
        if (urlCode && urlCode.toUpperCase() === validCode) {
            localStorage.setItem(`gpxray-race-${raceId}`, urlCode.toUpperCase());
        }
    }
    
    currentRaceConfig = raceConfig;
    currentRaceLocation = raceConfig.location || '';
    
    // Initialize race mode content
    initRaceModeContent(raceConfig);
}

function populateRaceLanding(config) {
    try {
        // Hide hero runner level selector on race pages (it's in the race setup row instead)
        const heroRunnerLevel = document.getElementById('heroRunnerLevel');
        if (heroRunnerLevel) {
            heroRunnerLevel.style.display = 'none';
        }
        
        // Set race info
        const raceName = document.getElementById('raceName');
        const raceTagline = document.getElementById('raceTagline');
        const raceDate = document.getElementById('raceDate');
        const raceLocation = document.getElementById('raceLocation');
        const raceLogo = document.getElementById('raceLogo');
        
        if (raceName) raceName.textContent = config.name + (config.year ? ` ${config.year}` : '');
        if (raceTagline) raceTagline.textContent = config.tagline || '';
        if (raceDate && config.date) {
            const dateObj = new Date(config.date);
            const lang = typeof getLang === 'function' ? getLang() : 'en';
            raceDate.textContent = dateObj.toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            });
        }
        if (raceLocation) raceLocation.textContent = config.location || '';
        
        // Set website link if available
        const raceWebsiteLink = document.getElementById('raceWebsiteLink');
        if (raceWebsiteLink && config.website) {
            raceWebsiteLink.href = config.website;
            raceWebsiteLink.style.display = 'inline-block';
        }
        
        // Set logo if available
        if (raceLogo && config.logo) {
            raceLogo.innerHTML = `<img src="${config.logo}" alt="${config.name} logo">`;
        }
        
        // Populate distance buttons
        const distancesContainer = document.getElementById('raceDistances');
        if (!distancesContainer) {
            console.error('raceDistances container not found');
            return;
        }
        
        distancesContainer.innerHTML = '';
        
        if (!config.distances || !Array.isArray(config.distances)) {
            console.error('No distances array in config:', config);
            return;
        }
        
        console.log('Populating', config.distances.length, 'distances for', config.name);
        
        config.distances.forEach(dist => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'race-distance-btn';
            btn.dataset.distanceId = dist.id;
            btn.innerHTML = `
                <span class="race-distance-name">${dist.name}</span>
                <span class="race-distance-stats">
                    <span class="race-distance-km">${dist.distance} km</span>
                    <span class="race-distance-elev"> · ↑${dist.elevation}m</span>
                </span>
            `;
            
            btn.addEventListener('click', () => selectRaceDistance(dist, btn));
            distancesContainer.appendChild(btn);
        });
        
        console.log('Race landing populated successfully');
        
        // Fetch weather forecast if coordinates available
        if (config.coordinates && config.date) {
            fetchRaceWeather(config);
        }
    } catch (error) {
        console.error('Error in populateRaceLanding:', error);
    }
}

// Client-side weather cache (1 hour TTL)
const WEATHER_CLIENT_CACHE_TTL = 60 * 60 * 1000; // 1 hour in ms

function getClientWeatherCache(lat, lon, date) {
    const key = `weather_${lat.toFixed(2)}_${lon.toFixed(2)}_${date}`;
    const cached = localStorage.getItem(key);
    if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < WEATHER_CLIENT_CACHE_TTL) {
            // Verify the requested date is actually in the cached data
            if (data.daily && data.daily.time && data.daily.time.includes(date)) {
                console.log('Weather client cache HIT:', key);
                return data;
            } else {
                console.log('Weather client cache MISS - date not in data:', date);
                localStorage.removeItem(key);
                return null;
            }
        }
        localStorage.removeItem(key); // Expired
    }
    return null;
}

function setClientWeatherCache(lat, lon, date, data) {
    const key = `weather_${lat.toFixed(2)}_${lon.toFixed(2)}_${date}`;
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
}

// Weather forecast for race landing page
async function fetchRaceWeather(config) {
    console.log('=== fetchRaceWeather CALLED ===', config.name);
    // Disabled on race pages - takes up too much space in hero
    return;
    const widget = document.getElementById('raceWeatherWidget');
    const content = document.getElementById('weatherContent');
    if (!widget || !content) return;
    
    const raceDate = new Date(config.date);
    const today = new Date();
    const daysUntilRace = Math.ceil((raceDate - today) / (1000 * 60 * 60 * 24));
    
    // Only show forecast if race is within 16 days (Open-Meteo limit)
    if (daysUntilRace < 0 || daysUntilRace > 16) {
        content.innerHTML = `<p class="weather-note">Weather forecast available ${daysUntilRace > 16 ? '2 weeks before race' : 'for upcoming races'}</p>`;
        widget.style.display = 'block';
        return;
    }
    
    widget.style.display = 'block';
    
    try {
        const { lat, lon } = config.coordinates;
        
        // Check client-side cache first
        let data = getClientWeatherCache(lat, lon, config.date);
        
        if (!data) {
            // Fetch from our cached weather API
            const url = `${API_CONFIG.weatherEndpoint}?lat=${lat}&lon=${lon}&date=${config.date}`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('Weather API error');
            
            const result = await response.json();
            data = result.data; // Our API wraps the Open-Meteo response
            
            // Cache on client side
            setClientWeatherCache(lat, lon, config.date, data);
            
            if (result.cached) {
                console.log('Race weather data served from server cache');
            }
        }
        
        // Find race day in forecast
        const raceDateStr = config.date;
        const dayIndex = data.daily.time.indexOf(raceDateStr);
        
        if (dayIndex === -1) {
            const notAvailableText = typeof t === 'function' ? t('weather.notAvailable') : 'Forecast not yet available for';
            content.innerHTML = `<p class="weather-note">${notAvailableText} ${raceDate.toLocaleDateString()}</p>`;
            return;
        }
        
        const tempMax = Math.round(data.daily.temperature_2m_max[dayIndex]);
        const tempMin = Math.round(data.daily.temperature_2m_min[dayIndex]);
        const rainChance = data.daily.precipitation_probability_max[dayIndex];
        const windSpeed = Math.round(data.daily.windspeed_10m_max[dayIndex]);
        const weatherCode = data.daily.weathercode[dayIndex];
        
        // Store weather data globally for time adjustment
        raceWeatherData = {
            tempMax,
            tempMin,
            tempAvg: Math.round((tempMax + tempMin) / 2),
            rainChance,
            windSpeed,
            weatherCode,
            isRainy: weatherCode >= 51 && weatherCode <= 82,
            adjustment: calculateWeatherAdjustment(tempMax, tempMin, rainChance, windSpeed, weatherCode)
        };
        
        const weatherIcon = getWeatherIcon(weatherCode);
        const weatherDesc = getWeatherDescription(weatherCode);
        
        // Get weather tip
        const tip = getWeatherTip(raceWeatherData, weatherCode);
        console.log('Race page: getWeatherTip result:', tip, 'data:', { rainChance, tempMax, tempMin, windSpeed, weatherCode });
        const tipHtml = tip ? `
            <div class="weather-tip">
                <span class="weather-tip-icon">${tip.icon}</span>
                <span class="weather-tip-text">${tip.text}</span>
            </div>
        ` : '';
        
        // Get adjustment info
        const adj = raceWeatherData.adjustment;
        console.log('Race page: adjustment:', adj);
        const adjHtml = (adj && adj.totalPenaltyPercent >= 1) ? `
            <div class="weather-adjustment">
                <span class="weather-adj-icon">⏱️</span>
                <span class="weather-adj-text">+${Math.round(adj.totalPenaltyPercent)}%</span>
                <span class="weather-adj-label">${adj.description}</span>
            </div>
        ` : '';
        
        content.innerHTML = `
            <div class="weather-forecast">
                <div class="weather-main">
                    <span class="weather-icon">${weatherIcon}</span>
                    <span class="weather-temp">${tempMin}° - ${tempMax}°C</span>
                </div>
                <div class="weather-details">
                    <span class="weather-desc">${weatherDesc}</span>
                    <span class="weather-rain">💧 ${rainChance}%</span>
                    <span class="weather-wind">💨 ${windSpeed} km/h</span>
                </div>
                ${tipHtml}
                ${adjHtml}
            </div>
        `;
        
        // Also update the hero weather widget
        const adjustment = getWeatherAdjustedTime(100);
        showGpxWeatherWidget(raceWeatherData, weatherCode, config.date);
        
    } catch (error) {
        console.error('Weather fetch error:', error);
        content.innerHTML = `<p class="weather-note">Weather forecast temporarily unavailable</p>`;
    }
}

function getWeatherIcon(code) {
    // WMO Weather interpretation codes
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code <= 48) return '🌫️';
    if (code <= 57) return '🌧️';
    if (code <= 67) return '🌧️';
    if (code <= 77) return '❄️';
    if (code <= 82) return '🌧️';
    if (code <= 86) return '🌨️';
    if (code >= 95) return '⛈️';
    return '🌤️';
}

function getWeatherDescription(code) {
    if (code === 0) return t('weather.clear');
    if (code <= 3) return t('weather.partlyCloudy');
    if (code <= 48) return t('weather.foggy');
    if (code <= 57) return t('weather.drizzle');
    if (code <= 67) return t('weather.rain');
    if (code <= 77) return t('weather.snow');
    if (code <= 82) return t('weather.rainShowers');
    if (code <= 86) return t('weather.snowShowers');
    if (code >= 95) return t('weather.thunderstorm');
    return t('weather.variable');
}

// Weather adjustment algorithm based on research
// Optimal running temp: 10-15°C, penalty increases outside this range
function calculateWeatherAdjustment(tempMax, tempMin, rainChance, windSpeed, weatherCode) {
    let totalPenalty = 0;
    const breakdown = [];
    const tempAvg = (tempMax + tempMin) / 2;
    
    // Heat penalty: +0.5% per °C above 15°C, accelerates above 25°C
    if (tempAvg > 15) {
        const heatDegrees = tempAvg - 15;
        let heatPenalty;
        if (tempAvg > 25) {
            // Accelerated penalty above 25°C: +1% per degree
            heatPenalty = (10 * 0.5) + ((tempAvg - 25) * 1.0);
        } else {
            heatPenalty = heatDegrees * 0.5;
        }
        totalPenalty += heatPenalty;
        breakdown.push({ factor: 'heat', degrees: Math.round(heatDegrees), penalty: heatPenalty });
    }
    
    // Cold penalty: +0.3% per °C below 5°C
    if (tempAvg < 5) {
        const coldDegrees = 5 - tempAvg;
        const coldPenalty = coldDegrees * 0.3;
        totalPenalty += coldPenalty;
        breakdown.push({ factor: 'cold', degrees: Math.round(coldDegrees), penalty: coldPenalty });
    }
    
    // Rain penalty on trails: +2-4% depending on intensity
    const isRainy = weatherCode >= 51 && weatherCode <= 82;
    if (isRainy || rainChance > 50) {
        let rainPenalty;
        if (weatherCode >= 61 && weatherCode <= 67) {
            rainPenalty = 3.5; // Moderate rain
        } else if (weatherCode >= 80 && weatherCode <= 82) {
            rainPenalty = 4.0; // Heavy showers
        } else if (rainChance > 70) {
            rainPenalty = 3.0;
        } else {
            rainPenalty = 2.0; // Light rain / drizzle
        }
        totalPenalty += rainPenalty;
        breakdown.push({ factor: 'rain', penalty: rainPenalty });
    }
    
    // Wind penalty: +1-2% for strong wind (>30 km/h)
    if (windSpeed > 30) {
        const windPenalty = windSpeed > 40 ? 2.0 : 1.0;
        totalPenalty += windPenalty;
        breakdown.push({ factor: 'wind', speed: windSpeed, penalty: windPenalty });
    }
    
    return {
        totalPenaltyPercent: Math.round(totalPenalty * 10) / 10,
        breakdown,
        tempAvg: Math.round(tempAvg),
        description: getWeatherAdjustmentDescription(totalPenalty, tempAvg, isRainy)
    };
}

function getWeatherAdjustmentDescription(penalty, tempAvg, isRainy) {
    if (penalty < 1) return 'Ideal conditions';
    if (penalty < 2) return 'Good conditions';
    if (penalty < 4) return isRainy ? 'Wet trails expected' : (tempAvg > 20 ? 'Warm day' : 'Slight slowdown expected');
    if (penalty < 6) return tempAvg > 25 ? 'Hot conditions - hydrate well' : 'Challenging weather';
    return 'Difficult conditions - adjust expectations';
}

// Calculate weather-adjusted finish time
function getWeatherAdjustedTime(baseTimeMinutes) {
    if (!raceWeatherData || !raceWeatherData.adjustment) return null;
    
    const adjustment = raceWeatherData.adjustment;
    if (adjustment.totalPenaltyPercent < 0.5) return null; // No significant adjustment
    
    const addedMinutes = baseTimeMinutes * (adjustment.totalPenaltyPercent / 100);
    const adjustedTime = baseTimeMinutes + addedMinutes;
    
    return {
        adjustedMinutes: adjustedTime,
        addedMinutes: Math.round(addedMinutes),
        penaltyPercent: adjustment.totalPenaltyPercent,
        description: adjustment.description,
        tempAvg: raceWeatherData.tempAvg,
        isRainy: raceWeatherData.isRainy
    };
}

async function selectRaceDistance(distanceConfig, buttonEl) {
    // Highlight selected button
    document.querySelectorAll('.race-distance-btn').forEach(btn => btn.classList.remove('selected'));
    buttonEl.classList.add('selected');
    
    // Show loading state
    const originalHTML = buttonEl.innerHTML;
    buttonEl.innerHTML = '<span class="race-distance-name">⏳ Loading...</span>';
    buttonEl.disabled = true;
    
    try {
        // Construct GPX URL (uses blob storage if available)
        const gpxUrl = resolveGpxUrl(distanceConfig.gpxUrl);
        console.log('Fetching race GPX from:', gpxUrl);
        
        // Load GPX file
        const response = await fetch(gpxUrl);
        console.log('Race GPX response:', response.status, response.statusText);
        if (!response.ok) throw new Error(`Failed to load GPX: ${response.status}`);
        
        const gpxContent = await response.text();
        console.log('Race GPX content length:', gpxContent.length);
        
        // Store the GPX content for later use when Create Strategy is clicked
        currentDistanceConfig = distanceConfig;
        currentDistanceConfig._gpxContent = gpxContent;
        
        // Set route name
        currentRouteName = `${currentRaceConfig.shortName || currentRaceConfig.name} - ${distanceConfig.name}`;
        
        // Clear and load AID stations
        aidStations = [];
        if (distanceConfig.aidStations && distanceConfig.aidStations.length > 0) {
            aidStations = [...distanceConfig.aidStations];
        }
        console.log('selectRaceDistance: aidStations set to', aidStations.length, 'stations:', aidStations);
        
        // Load pre-stored surface profile if available (skips OSM query)
        preStoredSurfaceData = null;
        if (distanceConfig.surfaceProfile && distanceConfig.surfaceProfile.length > 0) {
            preStoredSurfaceData = [...distanceConfig.surfaceProfile];
            console.log('Pre-stored surface profile loaded:', preStoredSurfaceData.length, 'segments');
        }
        
        // Track selection
        trackEvent('race_distance_selected', { 
            race_id: currentRaceConfig.id, 
            distance_id: distanceConfig.id,
            distance_km: distanceConfig.distance 
        });
        
        // Show Step 2 (settings section) with animation
        const step2 = document.getElementById('raceStep2');
        if (step2) {
            step2.style.display = 'block';
            step2.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
    } catch (error) {
        console.error('Error loading race distance:', error);
        alert('Failed to load race data. Please try again.');
    } finally {
        buttonEl.innerHTML = originalHTML;
        buttonEl.disabled = false;
    }
}

// Create Strategy button click handler for race pages
function setupRaceCreateStrategyButton() {
    const createBtn = document.getElementById('raceCreateStrategyBtn');
    if (!createBtn) return;
    
    createBtn.addEventListener('click', async () => {
        if (!currentDistanceConfig || !currentDistanceConfig._gpxContent) {
            alert('Please select a distance first');
            return;
        }
        
        // Show loading state
        const originalHTML = createBtn.innerHTML;
        createBtn.innerHTML = '⏳ Creating...';
        createBtn.disabled = true;
        
        try {
            // Handle target time from race page input
            const raceTargetTime = document.getElementById('raceTargetTime');
            if (raceTargetTime && raceTargetTime.value) {
                const targetValue = raceTargetTime.value;
                const match = targetValue.match(/^(\d{1,2}):(\d{2})$/);
                if (match) {
                    const hours = parseInt(match[1]);
                    const minutes = parseInt(match[2]);
                    
                    // Sync to target time mode inputs
                    const targetHoursInput = document.getElementById('targetHours');
                    const targetMinutesInput = document.getElementById('targetMinutes');
                    if (targetHoursInput) targetHoursInput.value = hours;
                    if (targetMinutesInput) targetMinutesInput.value = minutes;
                    
                    // Set target mode
                    currentMode = 'target';
                    console.log('Race page: Target time mode activated:', hours, ':', minutes);
                }
            } else {
                // No target time - use runner level / manual mode
                currentMode = 'manual';
            }
            
            // Parse GPX (this will trigger calculateRacePlan with correct aidStations)
            parseGPX(currentDistanceConfig._gpxContent);
            
            // Ensure stats are displayed and race plan is calculated
            // (parseGPX may skip this on race pages due to heroCalculateBtn check)
            if (gpxData) {
                displayStats();
                calculateRacePlan();
            }
            
            // Set fixed race date and start time if configured
            if (currentDistanceConfig.raceDate || currentDistanceConfig.startTime) {
                const dateInput = document.getElementById('raceStartDate');
                const timeInput = document.getElementById('raceStartTime');
                
                if (dateInput && currentDistanceConfig.raceDate) {
                    dateInput.value = currentDistanceConfig.raceDate;
                    dateInput.readOnly = true;
                    dateInput.style.opacity = '0.7';
                    dateInput.style.cursor = 'not-allowed';
                    dateInput.title = 'Fixed race date';
                }
                
                if (timeInput && currentDistanceConfig.startTime) {
                    timeInput.value = currentDistanceConfig.startTime;
                    timeInput.readOnly = true;
                    timeInput.style.opacity = '0.7';
                    timeInput.style.cursor = 'not-allowed';
                    timeInput.title = 'Official start time';
                }
                
                // Recalculate sun times for the race date/location
                if (currentDistanceConfig.raceDate && gpxData) {
                    try {
                        calculateSunTimes();
                    } catch (e) {
                        console.warn('Could not calculate sun times:', e);
                    }
                }
                
                // Also set heroRaceDate for weather fetch
                const heroDateInput = document.getElementById('heroRaceDate');
                if (heroDateInput && currentDistanceConfig.raceDate) {
                    heroDateInput.value = currentDistanceConfig.raceDate;
                }
                
                // Fetch weather for race day (updates hero weather widget)
                try {
                    await fetchGpxWeather();
                } catch (e) {
                    console.warn('Could not fetch weather:', e);
                }
            }
            
            // Show statement preview and story button for race pages
            updateStoryButtonVisibility();
            
            // Show all result sections (map, elevation, splits, etc.)
            showAllSections();
            
            // Hide the strategy box (Step 2) and show Edit Strategy button
            const step2 = document.getElementById('raceStep2');
            const editBtn = document.getElementById('editStrategyBtn');
            if (step2) step2.style.display = 'none';
            if (editBtn) editBtn.style.display = 'inline-flex';
            
            // Scroll to hero results (time display)
            setTimeout(() => {
                const statsSection = document.getElementById('statsSection');
                if (statsSection) {
                    statsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 300);
            
        } catch (error) {
            console.error('Error creating race strategy:', error);
            alert('Failed to create strategy. Please try again.');
        } finally {
            createBtn.innerHTML = originalHTML;
            createBtn.disabled = false;
        }
    });
}

