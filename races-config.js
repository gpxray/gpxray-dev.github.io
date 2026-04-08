// Race Landing Page Configurations
// B2B feature: Dedicated race pages with pre-configured distances

// GPX files storage location (Azure Blob Storage)
const GPX_STORAGE_URL = 'https://gpxrayraces.blob.core.windows.net/races';

const RACE_CONFIGS = {
    'zut': {
        id: 'zut',
        name: 'Zugspitz Ultratrail',
        shortName: 'ZUT',
        year: 2026,
        date: '2026-06-19',
        location: 'Garmisch-Partenkirchen, Germany',
        website: 'https://www.zugspitz-ultratrail.com',
        logo: 'https://res.cloudinary.com/utmb-world/image/upload/q_auto/f_auto/c_fill,g_auto/if_w_gt_1920/c_scale,w_1920/if_end/v1/zugspitz/LOGO/Zugspitz_Ultra_Trail_by_UTMB_logo_Negatve_white_6befdf758b',
        tagline: 'Run where the mountains touch the sky',
        accessCode: 'ZUGSPITZ26', // Access code for race page
        
        // Branding colors
        branding: {
            primary: '#1a365d',    // Dark blue
            accent: '#38a169',     // Green
            background: '#0a1628'  // Dark background
        },
        
        // Available distances (sorted by distance)
        distances: [
            {
                id: 'grainau',
                name: 'Grainau Trail',
                distance: 16,
                elevation: 800,
                gpxUrl: 'races/Grainau_Trail_ZUT_2025_01bfa09fb6.gpx',
                aidStations: [
                    { km: 8.0, name: 'VP Hammersbach', stopMin: 2 }
                ],
                cutoffs: [],
                description: 'Perfect introduction to trail running'
            },
            {
                id: 'garmisch',
                name: 'Garmisch-Partenkirchen Trail',
                distance: 26,
                elevation: 1200,
                gpxUrl: 'races/ZUT_Garmisch_Partenkirchen_Trail.gpx',
                aidStations: [
                    { km: 5.2, name: 'VP1 Hammersbach', stopMin: 3 },
                    { km: 12.8, name: 'VP2 Kreuzeck', stopMin: 5 },
                    { km: 18.5, name: 'VP3 Hausberg', stopMin: 3 }
                ],
                cutoffs: [],
                description: 'Classic trail through Garmisch-Partenkirchen'
            },
            {
                id: 'mittenwald',
                name: 'Mittenwald Trail',
                distance: 43,
                elevation: 2100,
                gpxUrl: 'races/Mittenwald_Trail_ZUT_2025_fa6c0d4010.gpx',
                aidStations: [
                    { km: 12.0, name: 'VP1 Kranzberg', stopMin: 3 },
                    { km: 28.0, name: 'VP2 Lautersee', stopMin: 5 }
                ],
                cutoffs: [],
                description: 'Challenging marathon distance with stunning views'
            },
            {
                id: 'leutasch',
                name: 'Leutasch Trail',
                distance: 68,
                elevation: 3500,
                gpxUrl: 'races/Leutasch_Trail_ZUT_2025_620e36ae36.gpx',
                aidStations: [
                    { km: 18.0, name: 'VP1 Mittenwald', stopMin: 5 },
                    { km: 35.0, name: 'VP2 Leutasch', stopMin: 8 },
                    { km: 52.0, name: 'VP3 Gaistal', stopMin: 5 }
                ],
                cutoffs: [],
                description: 'Cross the Austrian border and back'
            },
            {
                id: 'ehrwald',
                name: 'Ehrwald Trail',
                distance: 85,
                elevation: 4500,
                gpxUrl: 'races/Ehrwald_Trail_ZUT_2025_85a841b963.gpx',
                aidStations: [
                    { km: 20.0, name: 'VP1 Mittenwald', stopMin: 5 },
                    { km: 40.0, name: 'VP2 Leutasch', stopMin: 8 },
                    { km: 58.0, name: 'VP3 Ehrwald', stopMin: 10 },
                    { km: 72.0, name: 'VP4 Gaistal', stopMin: 5 }
                ],
                cutoffs: [],
                description: 'Around the Zugspitze massif'
            },
            {
                id: 'ultratrail',
                name: 'Ultratrail',
                distance: 106,
                elevation: 5400,
                gpxUrl: 'races/Ultratrail_ZUT_2025_3b6cbaa510.gpx',
                aidStations: [
                    { km: 22.0, name: 'VP1 Mittenwald', stopMin: 5 },
                    { km: 42.0, name: 'VP2 Leutasch', stopMin: 10 },
                    { km: 62.0, name: 'VP3 Ehrwald', stopMin: 10 },
                    { km: 80.0, name: 'VP4 Gaistal', stopMin: 8 },
                    { km: 95.0, name: 'VP5 Partnachklamm', stopMin: 5 }
                ],
                cutoffs: [],
                description: 'The classic ultratrail experience'
            },
            {
                id: 'zut100',
                name: 'ZUT 100',
                distance: 164,
                elevation: 8500,
                gpxUrl: 'races/ZUT_100_2025_71c0e173fd.gpx',
                aidStations: [
                    { km: 25.0, name: 'VP1 Mittenwald', stopMin: 8 },
                    { km: 50.0, name: 'VP2 Leutasch', stopMin: 12 },
                    { km: 75.0, name: 'VP3 Ehrwald', stopMin: 15 },
                    { km: 100.0, name: 'VP4 Biberwier', stopMin: 12 },
                    { km: 125.0, name: 'VP5 Gaistal', stopMin: 10 },
                    { km: 145.0, name: 'VP6 Partnachklamm', stopMin: 8 }
                ],
                cutoffs: [],
                description: 'The ultimate 100-mile challenge'
            }
        ]
    },
    
    'ret': {
        id: 'ret',
        name: 'Rureifel Trail',
        shortName: 'RET',
        year: 2026,
        date: '2026-04-18',
        location: 'Nideggen, Germany',
        coordinates: { lat: 50.68, lon: 6.48 }, // For weather API
        // website removed for briefing
        logo: 'https://gpxrayraces.blob.core.windows.net/logos/ret-logo.png',
        tagline: 'Go Nature, Go Rureifel Trail',
        // accessCode removed - race page is now public
        
        // Branding colors
        branding: {
            primary: '#2d5a27',    // Forest green
            accent: '#e85d04',     // Orange
            background: '#1a2e1a'  // Dark green background
        },
        
        // Available distances (sorted by distance)
        distances: [
            {
                id: 'ret11',
                name: 'RET11',
                distance: 12.5,
                elevation: 450,
                gpxUrl: 'races/rureifel-trail-2026-ret11.gpx',
                raceDate: '2026-04-18',
                startTime: '10:15',
                finishCutoff: '20:45',
                aidStations: [
                    { km: 7.3, name: 'VP1 Gut Kallerbend', stopMin: 2, crewAllowed: true }
                ],
                // Surface: 70% trail, 22% road, 7% technical
                surfaceProfile: [
                    { startKm: 0, endKm: 0.42, surface: 'trail' },
                    { startKm: 0.42, endKm: 0.83, surface: 'road' },
                    { startKm: 0.83, endKm: 2.76, surface: 'trail' },
                    { startKm: 2.76, endKm: 2.98, surface: 'road' },
                    { startKm: 2.98, endKm: 5.53, surface: 'trail' },
                    { startKm: 5.53, endKm: 6.17, surface: 'road' },
                    { startKm: 6.17, endKm: 6.8, surface: 'trail' },
                    { startKm: 6.8, endKm: 7.26, surface: 'technical' },
                    { startKm: 7.26, endKm: 7.68, surface: 'road' },
                    { startKm: 7.68, endKm: 7.89, surface: 'technical' },
                    { startKm: 7.89, endKm: 9.85, surface: 'trail' },
                    { startKm: 9.85, endKm: 10.06, surface: 'technical' },
                    { startKm: 10.06, endKm: 11.13, surface: 'trail' },
                    { startKm: 11.13, endKm: 12.42, surface: 'road' }
                ],
                cutoffs: [],
                description: 'Perfect trail running introduction'
            },
            {
                id: 'ret22',
                name: 'RET22',
                distance: 23,
                elevation: 807,
                gpxUrl: 'races/rureifel-trail-2026-ret22.gpx',
                raceDate: '2026-04-18',
                startTime: '09:10',
                finishCutoff: '20:45',
                aidStations: [
                    { km: 8.4, name: 'VP1 Bergstein', stopMin: 2, crewAllowed: true },
                    { km: 15.0, name: 'VP2 Obermaubach', stopMin: 2, crewAllowed: true }
                ],
                // Surface: 77% trail, 16% road, 2% technical
                surfaceProfile: [
                    { startKm: 0, endKm: 0.88, surface: 'road' },
                    { startKm: 0.88, endKm: 2.81, surface: 'trail' },
                    { startKm: 2.81, endKm: 3.02, surface: 'road' },
                    { startKm: 3.02, endKm: 5.56, surface: 'trail' },
                    { startKm: 5.56, endKm: 6.18, surface: 'road' },
                    { startKm: 6.18, endKm: 8.32, surface: 'trail' },
                    { startKm: 8.32, endKm: 8.55, surface: 'road' },
                    { startKm: 8.55, endKm: 14.06, surface: 'trail' },
                    { startKm: 14.06, endKm: 15.17, surface: 'road' },
                    { startKm: 15.17, endKm: 15.81, surface: 'trail' },
                    { startKm: 15.81, endKm: 16.01, surface: 'technical' },
                    { startKm: 16.01, endKm: 16.89, surface: 'trail' },
                    { startKm: 16.89, endKm: 17.31, surface: 'trail' },
                    { startKm: 17.31, endKm: 20.31, surface: 'trail' },
                    { startKm: 20.31, endKm: 20.53, surface: 'technical' },
                    { startKm: 20.53, endKm: 21.6, surface: 'trail' },
                    { startKm: 21.6, endKm: 22.81, surface: 'road' }
                ],
                cutoffs: [],
                description: 'Challenging half with steep single trails'
            },
            {
                id: 'ret44',
                name: 'RET44+',
                distance: 46.1,
                elevation: 1853,
                gpxUrl: 'races/rureifel-trail-2026-ret44.gpx',
                raceDate: '2026-04-18',
                startTime: '10:25',
                finishCutoff: '20:45',
                aidStations: [
                    { km: 16.3, name: 'VP1 Bergstein', stopMin: 3, crewAllowed: true },
                    { km: 26.4, name: 'VP2 Obermaubach', stopMin: 3, crewAllowed: true },
                    { km: 35.5, name: 'VP3 Rath/Wanderhütte', stopMin: 3 },
                    { km: 40.9, name: 'VP4 Gut Kallerbend', stopMin: 3, crewAllowed: true }
                ],
                // Surface: 68% trail, 13% road, 19% unknown
                surfaceProfile: [
                    { startKm: 0, endKm: 0.62, surface: 'road' },
                    { startKm: 0.62, endKm: 2.78, surface: 'trail' },
                    { startKm: 2.78, endKm: 3.01, surface: 'road' },
                    { startKm: 3.01, endKm: 3.85, surface: 'trail' },
                    { startKm: 3.85, endKm: 5.32, surface: 'road' },
                    { startKm: 5.32, endKm: 6.63, surface: 'trail' },
                    { startKm: 6.63, endKm: 6.84, surface: 'road' },
                    { startKm: 6.84, endKm: 10.24, surface: 'trail' },
                    { startKm: 10.24, endKm: 10.91, surface: 'road' },
                    { startKm: 10.91, endKm: 13.45, surface: 'trail' },
                    { startKm: 13.45, endKm: 13.91, surface: 'road' },
                    { startKm: 13.91, endKm: 16.03, surface: 'trail' },
                    { startKm: 16.03, endKm: 16.24, surface: 'road' },
                    { startKm: 16.24, endKm: 25.38, surface: 'trail' },
                    { startKm: 25.38, endKm: 26.25, surface: 'road' },
                    { startKm: 26.25, endKm: 28.88, surface: 'trail' },
                    { startKm: 28.88, endKm: 30.41, surface: 'trail' },
                    { startKm: 30.41, endKm: 33.25, surface: 'trail' },
                    { startKm: 33.25, endKm: 33.45, surface: 'technical' },
                    { startKm: 33.45, endKm: 44.0, surface: 'trail' },
                    { startKm: 44.0, endKm: 44.2, surface: 'road' },
                    { startKm: 44.2, endKm: 44.83, surface: 'trail' },
                    { startKm: 44.83, endKm: 45.71, surface: 'road' }
                ],
                cutoffs: [],
                description: 'Your first ultra through the Rureifel'
            },
            {
                id: 'ret77',
                name: 'RET77',
                distance: 77,
                elevation: 2899,
                gpxUrl: 'races/rureifel-trail-2026-ret77.gpx',
                raceDate: '2026-04-18',
                startTime: '06:20',
                finishCutoff: '20:45',
                aidStations: [
                    { km: 18.4, name: 'VP1 Heimbach/Meuchelberg', stopMin: 3 },
                    { km: 31.6, name: 'VP2 Schmidt/Schöne Aussicht', stopMin: 4, crewAllowed: true },
                    { km: 47.2, name: 'VP3 Bergstein', stopMin: 4, crewAllowed: true },
                    { km: 57.3, name: 'VP4 Obermaubach', stopMin: 4, crewAllowed: true },
                    { km: 66.4, name: 'VP5 Rath/Wanderhütte', stopMin: 3 },
                    { km: 71.8, name: 'VP6 Gut Kallerbend', stopMin: 3, crewAllowed: true }
                ],
                // Surface: 55% trail, 13% road, 2% technical, 30% unknown (forest paths)
                surfaceProfile: [
                    { startKm: 0, endKm: 0.41, surface: 'road' },
                    { startKm: 0.41, endKm: 1.28, surface: 'trail' },
                    { startKm: 1.28, endKm: 1.48, surface: 'technical' },
                    { startKm: 1.48, endKm: 5.12, surface: 'trail' },
                    { startKm: 5.12, endKm: 6.13, surface: 'road' },
                    { startKm: 6.13, endKm: 10.25, surface: 'trail' },
                    { startKm: 10.25, endKm: 10.88, surface: 'road' },
                    { startKm: 10.88, endKm: 17.94, surface: 'trail' },
                    { startKm: 17.94, endKm: 18.56, surface: 'road' },
                    { startKm: 18.56, endKm: 25.15, surface: 'trail' },
                    { startKm: 25.15, endKm: 25.59, surface: 'road' },
                    { startKm: 25.59, endKm: 33.44, surface: 'trail' },
                    { startKm: 33.44, endKm: 34.08, surface: 'road' },
                    { startKm: 34.08, endKm: 45.0, surface: 'trail' },
                    { startKm: 45.0, endKm: 45.22, surface: 'technical' },
                    { startKm: 45.22, endKm: 56.27, surface: 'trail' },
                    { startKm: 56.27, endKm: 56.71, surface: 'road' },
                    { startKm: 56.71, endKm: 66.28, surface: 'trail' },
                    { startKm: 66.28, endKm: 66.93, surface: 'road' },
                    { startKm: 66.93, endKm: 74.57, surface: 'trail' },
                    { startKm: 74.57, endKm: 76.4, surface: 'road' }
                ],
                cutoffs: [],
                description: 'The ultimate Rureifel adventure with Rursee views'
            }
        ]
    }
};

// Get race config by ID
function getRaceConfig(raceId) {
    return RACE_CONFIGS[raceId] || null;
}

// Get all available race IDs
function getAvailableRaces() {
    return Object.keys(RACE_CONFIGS);
}

// Check if URL indicates race mode
function detectRaceMode() {
    const params = new URLSearchParams(window.location.search);
    const raceParam = params.get('race');
    
    // Check URL path for /race/xxx pattern
    const pathMatch = window.location.pathname.match(/\/race\/([a-z0-9-]+)/i);
    
    return raceParam || (pathMatch ? pathMatch[1] : null);
}
