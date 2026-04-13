// GPXray Internationalization (i18n)
// Supported languages: English (en), German (de), French (fr)

const TRANSLATIONS = {
    en: {
        // Header
        'header.tagline': 'Know your race before it starts.',
        'header.feedback': 'Feedback',
        'header.history': 'History',
        
        // Intro section
        'intro.headline': 'Build your race strategy before race day.',
        'intro.text': 'Analyze terrain, simulate realistic pace, and understand where your race is decided.',
        'intro.smartPace': 'Smart Pace',
        'intro.smartPacing': 'Smart Pacing',
        'intro.topClimbs': 'Top Climbs',
        'intro.weatherImpact': 'Weather Impact',
        'intro.surfaceAnalysis': 'Surface Analysis',
        'intro.aidStations': 'AID Stations',
        'intro.sunTimes': 'Sun Times',
        'intro.shareCard': 'Share Card',
        'intro.lockscreenCard': 'Lockscreen Card',
        'intro.nutritionPlanner': 'Nutrition Planner',
        'intro.downhillLoad': 'Downhill Load',
        'intro.crewCard': 'Crew Card',
        'intro.comingSoon': 'coming soon',
        'intro.raceHeadline': 'Build your race strategy before race day.',
        'intro.raceText': 'Analyze terrain, simulate realistic pace, and understand where your race is decided.',
        'intro.feature1': '🏔️ Analyze the terrain',
        'intro.feature2': '⏱️ Simulate realistic pace',
        'intro.feature3': '🎯 Find the decisive spots',
        
        // Feature pill tooltips
        'pill.smartPace.info': 'Hit every split on target. Realistic pace predictions that adapt to climbs and descents — no more blowing up on mile 15.',
        'pill.smartPacing.info': 'Hit every split on target. Realistic pace predictions that adapt to climbs and descents — no more blowing up on mile 15.',
        'pill.topClimbs.info': 'Know what\'s coming. See the 5 biggest climbs with exact locations and elevation gain — so you can pace smart.',
        'pill.weatherImpact.info': 'Race-day conditions matter. See how temperature, rain, and wind will affect your finish time.',
        'pill.surfaceAnalysis.info': 'Prepare for what\'s underfoot. Know where technical terrain will slow you — so you can plan your effort.',
        'pill.aidStations.info': 'Never bonk between stations. See how far and how hard each leg is — fuel and pace accordingly.',
        'pill.sunTimes.info': 'Race the light, not just the clock. Know when you\'ll need your headlamp so you pack smart and run confident.',
        'pill.shareCard.info': 'Show your race plan to the world. Create a visual strategy card to share with friends and on social media.',
        'pill.lockscreenCard.info': 'Stay focused when it hurts. See distance to the next aid and where the big climbs hit — one glance, no thinking.',
        'pill.nutritionPlanner.info': 'Fuel without guessing. Plan calories and hydration for every leg so you stay strong to the finish.',
        'pill.downhillLoad.info': 'Protect your quads for race day. See where cumulative descent stress will peak — so you know when to hold back.',
        'pill.crewCard.info': 'Keep your crew in sync. Give them exact times and locations so they\'re ready when you roll in.',
        
        // Upload section
        'upload.dragDrop': 'Drag & drop a GPX file here or',
        'upload.browse': 'Browse locally',
        'upload.selectFile': 'Select GPX File',
        'upload.or': 'or',
        'upload.tryDemo': 'Preview: ZUT Garmisch-Partenkirchen Trail',
        'upload.browseRaces': 'Browse Popular Races',
        'upload.demoHint': 'Load a sample trail to explore the features',
        'upload.demoHintFull': 'Browse our curated race database',
        'upload.privacy': '100% Local Processing – Your GPX data never leaves your device',
        
        // Route name
        'route.changeRoute': '↻ Start Over',
        'route.confirmStartOver': 'Start over? This will clear your current race plan.',
        
        // Dev gate
        'beta.title': 'GPXray',
        'beta.badge': 'DEV',
        'beta.description': 'Development preview with new features.',
        'beta.placeholder': 'Enter dev password',
        'beta.enter': 'Enter',
        'beta.error': 'Incorrect password',
        'beta.stableHint': "Don't have a password? Visit the",
        'beta.stableLink': 'stable version',
        
        // Early access modal
        'earlyAccess.title': 'Early Access',
        'earlyAccess.description': 'Unlock full race strategy for your GPX file.',
        'earlyAccess.placeholder': 'Enter access code',
        'earlyAccess.unlock': 'Unlock',
        'earlyAccess.error': 'Invalid code. Please try again.',
        'earlyAccess.hint': 'Or run the simulation below to see how it works!',
        
        // Hero section
        'hero.estimatedFinish': 'Estimated Finish Time',
        'hero.runnerLevel': 'Runner Level:',
        'hero.beginner': 'Beginner',
        'hero.intermediate': 'Intermediate',
        'hero.advanced': 'Advanced',
        'hero.elite': 'Elite',
        'hero.topClimbs': 'Top Climbs',
        'hero.downhillLoad': 'Downhill Load',
        'hero.elevationGain': 'Elevation Gain',
        'hero.nutritionWindow': 'Fuel Windows',
        'nutrition.title': 'Smart Fuel Recommendations',
        'nutrition.description': 'Approximately every ~45 min at flat terrain or AID stations.',
        'nutrition.logic': 'Prioritizes AID stations, fills gaps with gentle terrain (<10% grade).',
        'leg.gels': 'gels',
        'leg.nutritionTooltip': 'Estimated fuel needs for this leg',
        'hero.hint': 'Based on default paces',
        'hero.customize': 'Customize strategy ↓',
        'hero.clickCalculate': '▼ Calculate below',
        'hero.gpxBased': 'Based on GPX file',
        'hero.official': 'Official',
        
        // Race landing page
        'race.strategyTitle': 'Create Your Race Strategy',
        'race.selectLevel': "What's your runner level?",
        'race.selectDistance': 'Which distance are you running?',
        'race.itraOptional': 'Know your ITRA score?',
        'race.advancedOptions': 'Advanced Options',
        'race.itraApply': 'Apply',
        'race.itraApplied': 'Applied',
        'race.itraHint': 'ITRA score gives more precise pace estimation',
        'race.itraExplain': 'ITRA (International Trail Running Association) assigns performance scores based on your race results.',
        'race.itraFindScore': 'Find your ITRA score',
        
        // Terrain skills
        'race.terrainSkills': 'Terrain Skills',
        'race.uphill': 'Uphill',
        'race.downhill': 'Downhill',
        'race.terrainBalanced': 'Balanced',
        'race.uphillStrong': 'Strong climber',
        'race.uphillGood': 'Good climber',
        'race.uphillStruggles': 'Struggles uphill',
        'race.downhillAggressive': 'Aggressive',
        'race.downhillGood': 'Good descender',
        'race.downhillCautious': 'Cautious',
        'race.terrainExplain': 'Adjust based on your climbing and descending ability. Slide right (cyan) = faster, left (orange) = slower.',
        'race.slow': 'Slow',
        'race.fast': 'Fast',
        
        // Fuel preferences
        'race.fuelPrefs': 'My Fuel',
        'race.fuelExplain': 'Select what you actually use during races. We\'ll suggest these in the Fuel column.',
        'fuel.gels': 'Gels',
        'fuel.bars': 'Bars',
        'fuel.gummies': 'Gummies',
        'fuel.realFood': 'Real Food',
        'fuel.carbDrinks': 'Carb Drinks',
        
        // Race date/time presets
        'race.whenRace': 'When is your race?',
        'race.preset2h': 'In 2 hours',
        'race.presetTomorrow': 'Tomorrow',
        'race.presetWeekend': 'This Weekend',
        'race.presetCustom': 'Custom',
        'race.calculate': '🚀 Create Strategy',
        'race.calculating': '⏳ Creating...',
        'race.editStrategy': '✏️ Edit Strategy',
        'race.units': 'Units:',
        'race.targetTime': 'Target time:',
        'race.targetOptional': '(optional)',
        'race.overrideHint': 'Target time or ITRA overrides runner level',
        'race.createStrategy': 'Create Strategy',        'race.addAidStations': 'Add AID Stations',
        'race.visitWebsite': 'Visit Official Website',
        
        // Weather
        'weather.forecast': 'Weather Forecast',
        'weather.raceDayForecast': 'Race Day Weather Forecast',
        'weather.notAvailable': 'Forecast not yet available for',
        'weather.loading': 'Loading forecast...',
        'weather.adjustment': 'weather adjustment',
        'weather.source': 'Source',
        'weather.sourceTitle': 'Weather Data',
        'weather.sourceDesc': 'Powered by Open-Meteo, a free weather API aggregating multiple models.',
        'weather.sourceModels': 'Models used:',
        'weather.sourceNote': 'Forecasts may differ from other services due to different model blending.',
        'weather.clear': 'Clear sky',
        'weather.partlyCloudy': 'Partly cloudy',
        'weather.foggy': 'Foggy',
        'weather.drizzle': 'Drizzle',
        'weather.rain': 'Rain',
        'weather.snow': 'Snow',
        'weather.rainShowers': 'Rain showers',
        'weather.snowShowers': 'Snow showers',
        'weather.thunderstorm': 'Thunderstorm',
        'weather.variable': 'Variable',
        
        // Surface Analysis
        'surface.title': 'Surface Analysis',
        'surface.road': 'Road',
        'surface.trail': 'Trail',
        'surface.technical': 'Technical',
        'surface.loading': 'Analyzing...',
        'surface.applyMultipliers': 'Apply to pace',
        
        // Climb Profile
        'climb.profile': 'Climb Profile',
        'climb.uphill': 'Uphill',
        'climb.flat': 'Flat',
        'climb.downhill': 'Downhill',
        
        // Night Running
        'night.title': 'Night Running',
        'night.distance': 'Distance at night',
        'night.sections': 'Night sections',
        'night.headlamp': 'Headlamp needed',
        'night.penalty': 'Night pace penalty',
        
        // AID Station
        'aid.planTitle': 'AID Station Plan',
        
        // Downhill Load tooltip
        'ddl.title': 'Descent Load (DDL/km)',
        'ddl.description': 'Average downhill stress per km (steepness × surface).',
        'ddl.intensity': 'Course intensity:',
        'ddl.easy': 'Easy terrain',
        'ddl.moderate': 'Moderate descents',
        'ddl.demanding': 'Demanding descents',
        'ddl.extreme': 'Quad-buster!',
        'ddl.paceLossNote': 'Pace loss depends on your runner level.',
        'ddl.howItWorks': 'How it works',
        
        // DDL insights
        'ddl.noPaceLoss': 'No pace loss expected',
        'ddl.downhillPaceLoss': 'Downhill pace loss: +{min}-{max} sec/km',
        'ddl.expectSlower': 'Expect slower descents after KM{km} (+{min}-{max} sec/km)',
        'ddl.mildSlowdown': 'Mild downhill slowdown after KM{km}',
        
        // DDL Modal
        'ddl.modal.title': 'Dynamic Descent Load → Pace Loss',
        'ddl.modal.tagline': 'DDL builds up as you descend. When cumulative DDL approaches your DFT, quads fatigue → downhill pace drops.',
        'ddl.modal.freshLegs': 'Fresh legs',
        'ddl.modal.noPaceLoss': 'No pace loss',
        'ddl.modal.lateFatigue': 'Late race fatigue',
        'ddl.modal.dftExplain': '<strong>DFT = your downhill fatigue threshold</strong> (depends on runner level). Change level above to personalize.',
        'ddl.modal.showFormula': 'Show formula',
        'ddl.modal.disclaimer': 'This is a heuristic model, not medical advice.',
        
        // Weather adjustment tooltip
        'weather.title': 'Weather Impact',
        'weather.description': 'Race day forecast affects your finish time.',
        'weather.factors': 'Adjustment factors:',
        
        // Course shape
        'shape.frontLoaded': 'Front-Loaded',
        'shape.backLoaded': 'Back-Loaded',
        'shape.balanced': 'Balanced',
        'shape.frontInsight': 'Major climbs in first half',
        'shape.backInsight': 'Big climbs late — save energy',
        'shape.balancedInsight': 'Even effort distribution',
        
        // Stats section
        'stats.courseDetails': 'Course Details',
        'stats.totalDistance': 'Total Distance',
        'stats.elevGain': 'Elevation Gain',
        'stats.elevLoss': 'Elevation Loss',
        'stats.minElev': 'Min Elevation',
        'stats.maxElev': 'Max Elevation',
        'stats.estimatedTime': 'Estimated Time',
        
        // Map section
        'map.title': 'Route Map',
        'map.flat': 'Flat',
        'map.uphill': 'Uphill',
        'map.downhill': 'Downhill',
        'map.surfaceAnalysis': 'Surface Analysis',
        'map.analyzingSurface': 'Analyzing surface data...',
        'map.applySurface': 'Apply surface multipliers to pace',
        
        // Elevation section
        'elevation.title': 'Course Load',
        'elevation.profile': 'Elevation Profile',
        'elevation.gradient': 'Gradient Profile',
        'elevation.distanceKm': 'Distance (km)',
        'elevation.distanceMi': 'Distance (mi)',
        'elevation.elevationM': 'Elevation (m)',
        'elevation.elevationFt': 'Elevation (ft)',
        'elevation.gradientPercent': 'Gradient (%)',
        
        // Pace section
        'pace.title': 'Race Strategy',
        'pace.units': 'Units:',
        'pace.savePlan': 'Save Plan',
        'pace.loadPlan': 'Load Plan',
        'pace.targetTime': 'Target Time',
        'pace.itraIndex': 'ITRA Index',
        'pace.manualPace': 'Manual Pace',
        'pace.description': 'Set your target pace for different terrain types. Pace is in minutes per kilometer (min/km).',
        'pace.flat': 'Flat Pace',
        'pace.flatHint': 'Your pace on flat terrain',
        'pace.uphill': 'Uphill Pace',
        'pace.uphillHint': 'Grade > 5%',
        'pace.downhill': 'Downhill Pace',
        'pace.downhillHint': 'Grade < -5%',
        'pace.calculate': 'Calculate Race Plan',
        
        // Pace Info Tooltip
        'paceInfo.header': 'Calculation based on:',
        'paceInfo.runnerLevel': 'Runner Level',
        'paceInfo.itraScore': 'ITRA Score',
        'paceInfo.targetTime': 'Target Time',
        'paceInfo.flatPace': 'Flat Pace',
        'paceInfo.uphillPace': 'Uphill Pace',
        'paceInfo.downhillPace': 'Downhill Pace',
        'paceInfo.fatigueFactor': 'Fatigue Factor',
        'paceInfo.surfaceFactors': 'Surface Factors',
        'paceInfo.enabled': 'Enabled',
        
        // Splits section
        'splits.title': 'Splits Table',
        'splits.strategyTitle': 'Strategy Details',
        'splits.km': 'KM',
        'splits.miles': 'Mile',
        'splits.terrain': 'Terrain',
        'splits.pace': 'Pace',
        'splits.splitTime': 'Split',
        'splits.cumulative': 'Cumulative',
        'splits.elevation': 'Elev',
        
        // AID stations
        'aid.title': 'AID Stations',
        'aid.addStation': 'Add Station',
        'aid.name': 'Station Name',
        'aid.distance': 'Distance (km)',
        'aid.stopTime': 'Stop Time',
        'aid.eta': 'ETA',
        'aid.noStations': 'No AID stations configured.',
        'aid.addHint': 'Click "Add Station" to set up checkpoints.',
        
        // Sun times
        'sun.title': 'Sun & Night',
        'sun.raceDate': 'Race Date',
        'sun.startTime': 'Start Time',
        'sun.sunrise': 'Sunrise',
        'sun.sunset': 'Sunset',
        'sun.nightSections': 'Night running sections will be highlighted in the splits table.',
        
        // Export section
        'export.title': 'Export & Share',
        'export.raceCard': 'Create Race Card',
        'export.pdf': 'Download PDF',
        'export.print': 'Print Race Card',
        
        // Footer
        'footer.about': 'About',
        'footer.privacy': 'Privacy',
        'footer.impressum': 'Impressum',
        
        // Feedback panel
        'feedback.title': 'Send Feedback',
        'feedback.like': 'What do you like about GPXray?',
        'feedback.likePlaceholder': 'The features I find most useful...',
        'feedback.missing': 'What features are missing?',
        'feedback.missingPlaceholder': 'I wish GPXray could...',
        'feedback.bugs': 'Any bugs or issues?',
        'feedback.bugsPlaceholder': 'I noticed that...',
        'feedback.pricing': 'What would you pay for race strategy?',
        'feedback.perRace': 'Per race:',
        'feedback.perYear': 'Per year:',
        'feedback.email': 'Email (optional, for follow-up)',
        'feedback.send': 'Send Feedback',
        'feedback.orEmail': 'or email us directly',
        'feedback.thanks': 'Thank you!',
        'feedback.thanksSub': 'Your feedback helps us improve GPXray.',
        
        // History panel
        'history.title': 'Analysis History',
        'history.empty': 'No saved analyses yet.',
        'history.emptyHint': 'Your analyses will appear here after you save them.',
        'history.exportAll': 'Export All',
        'history.import': 'Import',
        
        // Race browser
        'races.title': 'Popular Trail Races',
        'races.search': 'Search races...',
        'races.all': 'All',
        'races.ultra': 'Ultra (100km+)',
        'races.marathon': 'Marathon Trail',
        'races.short': 'Short (<42km)',
        'races.missing': 'Missing a race?',
        'races.request': 'Request it!',
        
        // Cookie consent
        'cookies.message': 'We use cookies for analytics to improve GPXray.',
        'cookies.accept': 'Accept',
        'cookies.decline': 'Decline',
        
        // Surface types
        'surface.road': 'Road',
        'surface.trail': 'Trail',
        'surface.technical': 'Technical',
        'surface.unknown': 'Unknown',
        
        // Terrain types
        'terrain.flat': 'Flat',
        'terrain.uphill': 'Uphill',
        'terrain.downhill': 'Downhill',
        
        // Course shape insights
        'shape.frontInsightDynamic': '{pct}% climb in first half → Save legs for fast descent after KM{km}',
        'shape.backInsightDynamic': '{pct}% climb in second half → Conserve energy early, dig deep late',
        'shape.balancedInsightDynamic': 'Even climb distribution → Steady effort throughout',
        
        // Sun times special cases
        'sun.polarNight': 'Polar night',
        'sun.midnightSun': 'Midnight sun',
        
        // Print
        'print.title': 'Race Strategy',
        
        // Button states
        'btn.loading': '⏳ Loading...',
        'btn.demoLoaded': '✅ Preview Loaded!',
        'btn.generating': '⏳ Generating...',
        'btn.creating': '⏳ Creating...',
        'btn.joining': 'Joining...',
        'btn.joinWaitlist': 'Join Waitlist',
        'btn.shareStrategy': 'Create Share Card',
        'btn.exportGpx': 'Export for Watch',
        'btn.downloaded': '✅ Downloaded!',
        'btn.lockscreenCard': 'Lockscreen Card',
        'btn.feedback': 'Share your feedback',
        'btn.cancel': 'Cancel',
        
        // GPX Export Options Modal
        'gpxExport.title': 'Customize Watch Export',
        'gpxExport.subtitle': 'Select which waypoints to include:',
        'gpxExport.aidStations': 'Aid Stations',
        'gpxExport.aidStationsDesc': 'Water, food, crew access',
        'gpxExport.climbs': 'Major Climbs',
        'gpxExport.climbsDesc': 'Top 5 climbs with elevation gain',
        'gpxExport.eatStops': 'Eat Reminders',
        'gpxExport.eatStopsDesc': 'Terrain-based fuel spots between aid stations',
        'gpxExport.hint': '💡 Some watches show climbs automatically. Uncheck if yours does too.',
        
        // Lockscreen Card Export Options Modal
        'lockscreenExport.title': 'Customize Lockscreen Card',
        'lockscreenExport.subtitle': 'Choose what to include on your card:',
        'lockscreenExport.schedule': 'AID Station Schedule',
        'lockscreenExport.scheduleDesc': 'Expected arrival times at each station',
        'lockscreenExport.challenges': 'Key Challenges',
        'lockscreenExport.challengesDesc': 'Major climbs, night sections, leg fatigue',
        'lockscreenExport.stats': 'Race Stats',
        'lockscreenExport.statsDesc': 'Distance, elevation gain/loss',
        'lockscreenExport.profile': 'Elevation Profile',
        'lockscreenExport.profileDesc': 'Mini chart with key markers',
        'lockscreenExport.showAidStations': 'Show AID Stations',
        'lockscreenExport.showClimbs': 'Show Major Climbs',
        'lockscreenExport.fontSize': 'Font Size:',
        'lockscreenExport.small': 'Small',
        'lockscreenExport.medium': 'Medium',
        'lockscreenExport.large': 'Large',
        'lockscreenExport.hint': '💡 Profile shows climb zones (orange) + AID markers (green). Challenges = text-only climbs list.',
        'lockscreenExport.export': 'Create Card',
        
        // PDF Export Options Modal
        'pdfExport.title': 'Customize PDF Export',
        'pdfExport.subtitle': 'Choose what to include:',
        'pdfExport.stats': 'Race Stats',
        'pdfExport.statsDesc': 'Distance, elevation, time, sun times',
        'pdfExport.profile': 'Elevation Profile',
        'pdfExport.profileDesc': 'Course elevation chart',
        'pdfExport.profileAid': 'Show AID stations',
        'pdfExport.profileClimbs': 'Show climbs',
        'pdfExport.aidSummary': 'AID Station Summary',
        'pdfExport.aidSummaryDesc': 'Quick reference list with stop times',
        'pdfExport.splits': 'Detailed Splits Table',
        'pdfExport.splitsDesc': 'Pace, terrain, times per kilometer',
        'pdfExport.themeLabel': 'Theme:',
        'pdfExport.dark': 'Dark',
        'pdfExport.light': 'Light',
        'pdfExport.fontSizeLabel': 'Font Size:',
        'pdfExport.fontNormal': 'Normal',
        'pdfExport.fontLarge': 'Large',
        'pdfExport.download': 'Download PDF',
        'pdfExport.hint': 'Profile: climb zones (orange) + AID stations (green).',
        
        // Crew Card export
        'crew.title': 'CREW SCHEDULE',
        'crew.finish': 'FINISH',
        'crew.start': 'Start',
        'crew.minBreak': 'min break',
        'crew.toNext': 'to next',
        'crew.toFinish': 'to finish',
        'crew.afterClimb': 'After {0}m climb',
        'crew.afterDescent': 'After {0}m descent',
        'crew.longLeg': 'Long {0}km leg',
        'crew.nightArrival': 'Night arrival',
        'crew.night': 'Night',
        'crew.climbAhead': '{0}m climb ahead',
        'crew.descentAhead': '{0}m descent ahead',
        'crew.kmToNext': '{0}km to next',
        'crew.kmToFinish': '{0}km to finish',
        'crew.kmPlusClimbToFinish': '{0}km + {1}m to finish',
        'crew.kmDescentToFinish': '{0}km ↘️ to finish',
        'crew.crewAllowed': 'Crew',
        'crew.legendText': 'Crew allowed',
        'crew.shareTitle': 'Crew Schedule - {0}',
        'crew.shareText': "Here's my race schedule for {0}! Meet me at these AID stations 👟\n\nPlan your race with https://gpxray.run",
        
        // Lockscreen Card export
        'lockscreen.subtitle': 'RACE STRATEGY',
        'lockscreen.mGain': 'm gain',
        'lockscreen.mLoss': 'm loss',
        'lockscreen.cutoff': 'Cutoff',
        'lockscreen.raceSchedule': 'RACE SCHEDULE',
        'lockscreen.station': 'STATION',
        'lockscreen.race': 'RACE',
        'lockscreen.clock': 'CLOCK',
        'lockscreen.finish': 'FINISH',
        
        // Share card preview
        'share.previewLabel': 'On your Share Card:',
        'share.rerollHint': 'Get different statement',

        // Race browser
        'races.noResults': 'No races found matching your criteria.',
        
        // Splits table
        'splits.surface': 'Surface',
        'splits.aid': 'AID',
        'splits.stop': 'Stop',
        'splits.fuel': 'Fuel',
        'splits.clock': 'Clock',
        'splits.min': 'min',
        
        // Leg summary
        'leg.title': 'Leg Summary',
        'leg.leg': 'Leg',
        'leg.dist': 'Dist',
        'leg.gain': 'Gain',
        'leg.loss': 'Loss',
        'leg.time': 'Time',
        'leg.arrival': 'Arrival',
        'leg.toFinish': 'to Finish',
        
        // General
        'general.loading': 'Loading...',
        'general.error': 'Error',
        'general.success': 'Success',
        'general.close': 'Close',
        'general.save': 'Save',
        'general.cancel': 'Cancel',
        'general.delete': 'Delete',
        
        // Story card witty statements
        'story.nextDay.1': 'See you tomorrow. ☕<br>Keep the coffee warm.',
        'story.nextDay.2': "Don't wait up. 😴<br>This one's gonna take a while.",
        'story.nextDay.3': "I'll be back... eventually.<br>Save me some breakfast. 🥐",
        'story.nextDay.4': 'Gone running. 🏃<br>Back in a day or so.',
        'story.nextDay.5': 'Overnight adventure. 🍾<br>Pop the Champagne tomorrow.',
        'story.nextDay.6': 'Sleep tight. 💤<br>I\'ll be chasing sunrise.',
        'story.nextDay.7': 'Long day ahead. ⛺<br>Pack your patience.',
        'story.nextDay.8': 'Running into tomorrow. 🌅<br>Literally.',
        'story.nextDay.9': 'Dawn to dawn. 🌓<br>This is gonna be epic.',
        'story.nextDay.10': 'Ice bucket booked. 🧊<br>My legs will need it.',
        'story.nextDay.11': 'Marathon? That\'s cute. 🏃<br>I\'m going further.',
        'story.nextDay.12': 'Two sunsets. One race. 🌅<br>Let\'s go.',
        'story.nextDay.13': 'Compression socks ready. 🧦<br>Tomorrow me will thank me.',
        'story.nextDay.14': 'Running through the night. 🌌<br>Stars are my company.',
        'story.nextDay.15': 'Long haul mode. ✈️<br>See you on the other side.',
        'story.earlyMorning.1': "I'll be done before you wake up.<br>Don't worry about me. 🌅",
        'story.earlyMorning.2': 'Back before breakfast. 🥣<br>Just a quick one.',
        'story.earlyMorning.3': 'Early bird gets the medal. 🏅<br>See you at sunrise.',
        'story.earlyMorning.4': 'Catching the first light. 🌄<br>Back before the alarm.',
        'story.earlyMorning.5': 'Dawn patrol. ⛰️<br>Coffee can wait.',
        'story.earlyMorning.6': 'Beat the sun. ☀️<br>Beat the crowd.',
        'story.earlyMorning.7': 'Running with the roosters. 🐓<br>Almost done.',
        'story.earlyMorning.8': 'Nightcap? No.<br>Trail cap. 🧢',
        'story.earlyMorning.9': 'Stars to sunrise. 🌟<br>What a ride.',
        'story.earlyMorning.10': 'Done before the world wakes. 🌅<br>Best feeling.',
        'story.earlyMorning.11': 'Alarm at 4am. Worth it. ⏰<br>Always.',
        'story.earlyMorning.12': 'Pre-dawn warrior. ⚔️<br>Coffee at the finish.',
        'story.earlyMorning.13': 'Still faster than commuting. 🚗<br>And more fun.',
        'story.earlyMorning.14': 'Sunrise finish. 🌄<br>Instagram ready.',
        'story.earlyMorning.15': 'Before anyone asks where I am. 🤫<br>Already done.',
        'story.morning.1': "Save me some breakfast. 🍳<br>I'll be there by mid-morning.",
        'story.morning.2': "I'll be back for brunch.<br>Make it a big one. 🥞",
        'story.morning.3': 'Morning run, they said. 😅<br>Should be done by 10ish.',
        'story.morning.4': 'Just a morning jog. 🏃<br>With some extra kilometers.',
        'story.morning.5': 'Earning my breakfast. 🥓<br>The hard way.',
        'story.morning.6': 'Coffee can wait. ☕<br>Mountains can\'t.',
        'story.morning.7': 'AM hustle. 🌄<br>PM rest.',
        'story.morning.8': 'Morning miles done. ✅<br>Day just started.',
        'story.morning.9': 'Pancakes are calling. 🥞<br>Running to answer.',
        'story.morning.10': 'Early shift. 🏔️<br>Overtime optional.',
        'story.morning.11': 'Second breakfast awaits. 🧇<br>Hobbit mode.',
        'story.morning.12': 'Croissant motivation. 🥐<br>Works every time.',
        'story.morning.13': 'Morning miles. Morning vibes. 🌅<br>No regrets.',
        'story.morning.14': 'Finished before noon. 😎<br>Pro move.',
        'story.morning.15': 'Brunch reservation secured. 🍳<br>Running there now.',
        'story.midday.1': "Don't wait for lunch.<br>I'll grab something on the trail. 🥪",
        'story.midday.2': 'Back by lunchtime.<br>With a story or two. 📖',
        'story.midday.3': 'Noon-ish finish planned.<br>Keep the sandwiches ready. 🥪',
        'story.midday.4': 'High noon finish. 🤠<br>Pizza time after.',
        'story.midday.5': 'Lunch is earned. 🍔<br>Not given.',
        'story.midday.6': 'Sun high. Me higher. 🌞<br>Almost there.',
        'story.midday.7': 'Carbs loading soon. 🍝<br>Justified.',
        'story.midday.8': 'Midday madness. 😎<br>Worth every step.',
        'story.midday.9': 'Brunch? Lunch?<br>Both. 🍳',
        'story.midday.10': 'Peak sun. Peak effort. ☀️<br>Peak rewards.',
        'story.midday.11': 'Lunch plans: huge. 🍔<br>I earned it.',
        'story.midday.12': 'Noon noodles calling. 🍜<br>Almost there.',
        'story.midday.13': 'Tan lines incoming. ☀️<br>Trail edition.',
        'story.midday.14': 'Siesta scheduled. 😴<br>Right after.',
        'story.midday.15': 'Ice cream at the finish. 🍦<br>Mandatory.',
        'story.afternoon.1': "Back for Aperol Spritz. 🍹<br>First round's on me.",
        'story.afternoon.2': 'Afternoon finish ahead.<br>Then straight to the couch. 🛋️',
        'story.afternoon.3': "Should be done by dinner prep.<br>Don't start without me. 🍽️",
        'story.afternoon.4': 'Siesta after the finish. 😴<br>Priorities.',
        'story.afternoon.5': 'Cake and coffee waiting. ☕<br>Almost there.',
        'story.afternoon.6': 'Beer o\'clock approaching. 🍺<br>Right on schedule.',
        'story.afternoon.7': 'Netflix and recover. 📺<br>The plan.',
        'story.afternoon.8': 'Couch, here I come. 🛋️<br>Miss me?',
        'story.afternoon.9': 'Done by apero. 🥂<br>Perfect timing.',
        'story.afternoon.10': 'Sundown countdown. 🌅<br>Almost free.',
        'story.afternoon.11': 'Shower first. Questions later. 🚿<br>Please.',
        'story.afternoon.12': 'Happy hour starts at the finish. 🍺<br>On my way.',
        'story.afternoon.13': 'The couch is calling. 🛋️<br>Loudly.',
        'story.afternoon.14': 'Pasta loading... ⏳<br>98% complete.',
        'story.afternoon.15': 'Legs: tired. Spirit: unbroken. 💪<br>Almost done.',
        'story.evening.1': "I'll be back for dinner.<br>Maybe. 🤷",
        'story.evening.2': 'Evening finish planned.<br>Save me a plate. 🍝',
        'story.evening.3': "Don't wait for me at dinner.<br>But do save dessert. 🍰",
        'story.evening.4': 'Golden hour finish. 🌅<br>Perfect for photos.',
        'story.evening.5': 'Dinner might be late. 🍕<br>Order without me.',
        'story.evening.6': 'Sunset finish. 🌇<br>Worth every blister.',
        'story.evening.7': 'Home for movie night. 🎬<br>Probably.',
        'story.evening.8': 'Late but not too late. ⏰<br>Perfect.',
        'story.evening.9': 'Twilight triumph. 🌆<br>Day well spent.',
        'story.evening.10': 'Dinner reservation? 🍷<br>Open the wine at 9pm.',
        'story.evening.11': 'Dinner? I AM the dinner. 🥵<br>Starving.',
        'story.evening.12': 'Netflix and collapse. 📺<br>Perfect evening.',
        'story.evening.13': 'Ordered pizza at km 50. 🍕<br>Timing is everything.',
        'story.evening.14': 'Headlamp? Almost needed it. 🔦<br>Close call.',
        'story.evening.15': 'Golden finish. Golden memories. 🏆<br>Worth it.',
        'story.night.1': "I'll be back at midnight.<br>Go ahead and chill the Prosecco. 🥂",
        'story.night.2': 'Late night finish incoming. 🌙<br>Keep the lights on.',
        'story.night.3': "Don't wait up. 😴<br>But maybe leave a snack out.",
        'story.night.4': 'Back by bedtime.<br>Hopefully. 🤞',
        'story.night.5': 'Headlamp heroes. 🔦<br>Night shift running.',
        'story.night.6': 'Chasing stars tonight. ⭐<br>Be home before dawn.',
        'story.night.7': 'Moonlit finish. 🌙<br>Best kind.',
        'story.night.8': 'Recovery boots waiting. 🦶<br>See you later.',
        'story.night.9': 'Sleep is overrated. 😴<br>Medals aren\'t.',
        'story.night.10': 'Night owl mode. 🦉<br>Trail edition.',
        'story.night.11': 'Midnight warrior. ⚔️<br>Still going.',
        'story.night.12': 'Who needs sleep anyway? 😴<br>Not me.',
        'story.night.13': 'The stars are prettier up here. ⭐<br>Trust me.',
        'story.night.14': 'Night moves. 🌙<br>Bob Seger would be proud.',
        'story.night.15': 'Darkness is just a mindset. 🔦<br>Mine is bright.',
        'story.default': "Out for a run. 🏃<br>Back when I'm done.",
        'story.myStrategy': 'My Race Plan',
        'story.createdBy': 'Plan your race with',
        'story.start': 'Start',
        'story.target': 'Target'
    },
    
    de: {
        // Header
        'header.tagline': 'Kenne dein Rennen, bevor es beginnt.',
        'header.feedback': 'Feedback',
        'header.history': 'Verlauf',
        
        // Intro section
        'intro.headline': 'Plane deine Rennstrategie schon vor dem Start.',
        'intro.text': 'Analysiere das Gelände, simuliere realistische Pace und finde die entscheidenden Stellen.',
        'intro.smartPace': 'Smart Pace',
        'intro.smartPacing': 'Smart Pacing',
        'intro.topClimbs': 'Top Anstiege',
        'intro.weatherImpact': 'Wetter-Einfluss',
        'intro.surfaceAnalysis': 'Untergrund-Analyse',
        'intro.aidStations': 'Verpflegungspunkte',
        'intro.sunTimes': 'Sonnenzeiten',
        'intro.shareCard': 'Teilen',
        'intro.lockscreenCard': 'Sperrbildschirm',
        'intro.nutritionPlanner': 'Ernährungsplaner',
        'intro.downhillLoad': 'Abstiegsbelastung',
        'intro.crewCard': 'Crew-Karte',
        'intro.comingSoon': 'bald verfügbar',
        'intro.raceHeadline': 'Plane deine Rennstrategie schon vor dem Start.',
        'intro.raceText': 'Analysiere das Gelände, simuliere realistische Pace und finde die entscheidenden Stellen.',
        'intro.feature1': '🏔️ Analysiere das Gelände',
        'intro.feature2': '⏱️ Simuliere realistische Pace',
        'intro.feature3': '🎯 Finde die entscheidenden Stellen',
        
        // Feature pill tooltips
        'pill.smartPace.info': 'Triff jeden Split. Realistische Pace-Vorhersagen, die sich an Anstiege und Abfahrten anpassen — nie wieder einbrechen auf KM 25.',
        'pill.smartPacing.info': 'Triff jeden Split. Realistische Pace-Vorhersagen, die sich an Anstiege und Abfahrten anpassen — nie wieder einbrechen auf KM 25.',
        'pill.topClimbs.info': 'Wisse was kommt. Sieh die 5 größten Anstiege mit exakter Position und Höhenmetern — und teile dir die Kraft ein.',
        'pill.weatherImpact.info': 'Wetterprognose fürs Rennen. Sieh wie Temperatur, Regen und Wind deine Zielzeit beeinflussen.',
        'pill.surfaceAnalysis.info': 'Wisse, was dich erwartet. Erkenne technisches Gelände im Voraus — und plane deine Kräfte ein.',
        'pill.aidStations.info': 'Nie wieder Hungerast zwischen den Stationen. Sieh wie weit und wie hart jede Etappe ist — und verpflege dich richtig.',
        'pill.sunTimes.info': 'Lauf dem Licht voraus. Wisse wann du die Stirnlampe brauchst — pack smart und lauf sicher.',
        'pill.shareCard.info': 'Zeig deinen Rennplan der Welt. Erstelle eine Strategie-Karte zum Teilen mit Freunden und auf Social Media.',
        'pill.lockscreenCard.info': 'Bleib fokussiert wenn es wehtut. Sieh die Distanz zur nächsten Verpflegung und wo die harten Anstiege kommen — ein Blick, kein Nachdenken.',
        'pill.nutritionPlanner.info': 'Verpflegung ohne Rätselraten. Plane Kalorien und Flüssigkeit für jede Etappe — stark bis ins Ziel.',
        'pill.downhillLoad.info': 'Schone deine Oberschenkel fürs Rennen. Sieh wo die Abstiegsbelastung ihren Höhepunkt erreicht — und halte dich zurück.',
        'pill.crewCard.info': 'Halte dein Crew-Team synchron. Gib ihnen genaue Zeiten und Standorte — sie sind bereit wenn du ankommst.',
        
        // Upload section
        'upload.dragDrop': 'GPX-Datei hierher ziehen oder',
        'upload.browse': 'Datei auswählen',
        'upload.selectFile': 'GPX-Datei wählen',
        'upload.or': 'oder',
        'upload.tryDemo': 'Vorschau: ZUT Garmisch-Partenkirchen Trail',
        'upload.browseRaces': 'Bekannte Rennen durchsuchen',
        'upload.demoHint': 'Lade einen Beispiel-Trail um die Funktionen zu entdecken',
        'upload.demoHintFull': 'Durchsuche unsere Renndatenbank',
        'upload.privacy': '100% lokale Verarbeitung – Deine GPX-Daten verlassen nie dein Gerät',
        
        // Route name
        'route.changeRoute': '↻ Neu starten',
        'route.confirmStartOver': 'Neu starten? Dein aktueller Rennplan wird gelöscht.',
        
        // Dev gate
        'beta.title': 'GPXray',
        'beta.badge': 'DEV',
        'beta.description': 'Entwicklungsvorschau mit neuen Funktionen.',
        'beta.placeholder': 'Dev-Passwort eingeben',
        'beta.enter': 'Weiter',
        'beta.error': 'Falsches Passwort',
        'beta.stableHint': 'Kein Passwort? Besuche die',
        'beta.stableLink': 'stabile Version',
        
        // Early access modal
        'earlyAccess.title': 'Early Access',
        'earlyAccess.description': 'Schalte die volle Rennstrategie für deine GPX-Datei frei.',
        'earlyAccess.placeholder': 'Zugangscode eingeben',
        'earlyAccess.unlock': 'Freischalten',
        'earlyAccess.error': 'Ungültiger Code. Bitte versuche es erneut.',
        'earlyAccess.hint': 'Oder starte die Simulation unten, um zu sehen wie es funktioniert!',
        
        // Hero section
        'hero.estimatedFinish': 'Geschätzte Zielzeit',
        'hero.runnerLevel': 'Läufer-Level:',
        'hero.beginner': 'Anfänger',
        'hero.intermediate': 'Fortgeschritten',
        'hero.advanced': 'Erfahren',
        'hero.elite': 'Elite',
        'hero.topClimbs': 'Top-Anstiege',
        'hero.downhillLoad': 'Abstiegsbelastung',
        'hero.elevationGain': 'Höhenmeter',
        'hero.nutritionWindow': 'Tankfenster',
        'nutrition.title': 'Smarte Verpflegungsempfehlungen',
        'nutrition.description': 'Etwa alle ~45 Min bei flachem Terrain oder VP-Stationen.',
        'nutrition.logic': 'Priorisiert VP-Stationen, flache Abschnitte (<10% Steigung) füllen Lücken.',
        'leg.gels': 'Gels',
        'leg.nutritionTooltip': 'Geschätzter Verpflegungsbedarf für diese Etappe',
        'hero.hint': 'Basierend auf Standard-Paces',
        'hero.customize': 'Strategie anpassen ↓',
        'hero.clickCalculate': '▼ Unten berechnen',
        'hero.gpxBased': 'Basierend auf GPX-Datei',
        'hero.official': 'Offiziell',
        
        // Race landing page
        'race.strategyTitle': 'Erstelle deine Rennstrategie',
        'race.selectLevel': 'Was ist dein Läufer-Level?',
        'race.selectDistance': 'Welche Distanz läufst du?',
        'race.itraOptional': 'Kennst du deinen ITRA-Score?',
        'race.advancedOptions': 'Erweiterte Optionen',
        'race.itraApply': 'Anwenden',
        'race.itraApplied': 'Angewendet',
        'race.itraHint': 'ITRA-Score ermöglicht präzisere Tempoberechnung',
        'race.itraExplain': 'ITRA (International Trail Running Association) vergibt Leistungswerte basierend auf deinen Rennergebnissen.',
        'race.itraFindScore': 'Finde deinen ITRA-Score',
        
        // Terrain skills
        'race.terrainSkills': 'Gelände-Fähigkeiten',
        'race.uphill': 'Bergauf',
        'race.downhill': 'Bergab',
        'race.terrainBalanced': 'Ausgeglichen',
        'race.uphillStrong': 'Stark bergauf',
        'race.uphillGood': 'Gut bergauf',
        'race.uphillStruggles': 'Schwach bergauf',
        'race.downhillAggressive': 'Aggressiv',
        'race.downhillGood': 'Guter Abfahrer',
        'race.downhillCautious': 'Vorsichtig',
        'race.terrainExplain': 'Passe an deine Stärken bergauf und bergab an. Rechts (cyan) = schneller, links (orange) = langsamer.',
        'race.slow': 'Langsam',
        'race.fast': 'Schnell',
        
        // Fuel preferences
        'race.fuelPrefs': 'Meine Verpflegung',
        'race.fuelExplain': 'Wähle aus, was du wirklich im Rennen isst. Wir schlagen es in der Fuel-Spalte vor.',
        'fuel.gels': 'Gels',
        'fuel.bars': 'Riegel',
        'fuel.gummies': 'Gummis',
        'fuel.realFood': 'Echtes Essen',
        'fuel.carbDrinks': 'Kohlenhydrat-Drinks',
        
        // Race date/time presets
        'race.whenRace': 'Wann ist dein Rennen?',
        'race.preset2h': 'In 2 Stunden',
        'race.presetTomorrow': 'Morgen',
        'race.presetWeekend': 'Am Wochenende',
        'race.presetCustom': 'Individuell',
        'race.calculate': '🚀 Strategie erstellen',
        'race.calculating': '⏳ Erstelle...',
        'race.editStrategy': '✏️ Strategie ändern',
        'race.units': 'Einheiten:',
        'race.targetTime': 'Zielzeit:',
        'race.targetOptional': '(optional)',
        'race.overrideHint': 'Zielzeit oder ITRA überschreibt das Läufer-Level',
        'race.createStrategy': 'Strategie erstellen',
        'race.addAidStations': 'Verpflegungsstationen hinzufügen',
        'race.visitWebsite': 'Offizielle Website besuchen',
        
        // Weather
        'weather.forecast': 'Wettervorhersage',
        'weather.raceDayForecast': 'Wettervorhersage am Renntag',
        'weather.notAvailable': 'Vorhersage noch nicht verfügbar für',
        'weather.loading': 'Lade Vorhersage...',
        'weather.adjustment': 'Wetteranpassung',
        'weather.source': 'Quelle',
        'weather.sourceTitle': 'Wetterdaten',
        'weather.sourceDesc': 'Bereitgestellt von Open-Meteo, einer kostenlosen Wetter-API mit mehreren Modellen.',
        'weather.sourceModels': 'Verwendete Modelle:',
        'weather.sourceNote': 'Vorhersagen können von anderen Diensten abweichen, da verschiedene Modelle kombiniert werden.',
        'weather.clear': 'Klarer Himmel',
        'weather.partlyCloudy': 'Teilweise bewölkt',
        'weather.foggy': 'Neblig',
        'weather.drizzle': 'Nieselregen',
        'weather.rain': 'Regen',
        'weather.snow': 'Schnee',
        'weather.rainShowers': 'Regenschauer',
        'weather.snowShowers': 'Schneeschauer',
        'weather.thunderstorm': 'Gewitter',
        'weather.variable': 'Wechselhaft',
        
        // Surface Analysis
        'surface.title': 'Untergrundanalyse',
        'surface.road': 'Straße',
        'surface.trail': 'Trail',
        'surface.technical': 'Technisch',
        'surface.loading': 'Analysiere...',
        'surface.applyMultipliers': 'Auf Tempo anwenden',
        
        // Climb Profile
        'climb.profile': 'Höhenprofil',
        'climb.uphill': 'Bergauf',
        'climb.flat': 'Flach',
        'climb.downhill': 'Bergab',
        
        // Night Running
        'night.title': 'Nachtlauf',
        'night.distance': 'Distanz bei Nacht',
        'night.sections': 'Nachtabschnitte',
        'night.headlamp': 'Stirnlampe benötigt',
        'night.penalty': 'Nacht-Tempoaufschlag',
        
        // AID Station
        'aid.planTitle': 'Verpflegungsstationen',
        
        // Downhill Load tooltip
        'ddl.title': 'Abstiegsbelastung (DDL/km)',
        'ddl.description': 'Durchschnittlicher Abstiegsstress pro km (Steilheit × Untergrund).',
        'ddl.intensity': 'Strecken-Intensität:',
        'ddl.easy': 'Leichtes Gelände',
        'ddl.moderate': 'Moderate Abstiege',
        'ddl.demanding': 'Anspruchsvolle Abstiege',
        'ddl.extreme': 'Quad-Killer!',
        'ddl.paceLossNote': 'Tempoverlust hängt von deinem Läufer-Level ab.',
        'ddl.howItWorks': 'So funktioniert es',
        
        // DDL insights
        'ddl.noPaceLoss': 'Kein Tempoverlust erwartet',
        'ddl.downhillPaceLoss': 'Abstiegs-Tempoverlust: +{min}-{max} sec/km',
        'ddl.expectSlower': 'Langsamere Abstiege ab KM{km} (+{min}-{max} sec/km)',
        'ddl.mildSlowdown': 'Leichte Abstiegs-Verlangsamung ab KM{km}',
        
        // DDL Modal
        'ddl.modal.title': 'Dynamic Descent Load → Tempoverlust',
        'ddl.modal.tagline': 'DDL akkumuliert sich beim Abstieg. Wenn DDL sich deinem DFT nähert, ermüden die Quads → Abstiege werden langsamer.',
        'ddl.modal.freshLegs': 'Frische Beine',
        'ddl.modal.noPaceLoss': 'Kein Tempoverlust',
        'ddl.modal.lateFatigue': 'Späte Ermüdung',
        'ddl.modal.dftExplain': '<strong>DFT = deine Abstiegs-Ermüdungsschwelle</strong> (abhängig vom Läufer-Level). Ändere das Level oben für personalisierte Werte.',
        'ddl.modal.showFormula': 'Formel anzeigen',
        'ddl.modal.disclaimer': 'Dies ist ein heuristisches Modell, keine medizinische Beratung.',
        
        // Weather adjustment tooltip
        'weather.title': 'Wetter-Einfluss',
        'weather.description': 'Die Wettervorhersage beeinflusst deine Zielzeit.',
        'weather.factors': 'Anpassungsfaktoren:',
        
        // Course shape
        'shape.frontLoaded': 'Front-Lastig',
        'shape.backLoaded': 'End-Lastig',
        'shape.balanced': 'Ausgewogen',
        'shape.frontInsight': 'Hauptanstiege in erster Hälfte',
        'shape.backInsight': 'Große Anstiege spät — Energie sparen',
        'shape.balancedInsight': 'Gleichmäßige Belastungsverteilung',
        
        // Stats section
        'stats.courseDetails': 'Streckendetails',
        'stats.totalDistance': 'Gesamtdistanz',
        'stats.elevGain': 'Höhenmeter Aufstieg',
        'stats.elevLoss': 'Höhenmeter Abstieg',
        'stats.minElev': 'Min. Höhe',
        'stats.maxElev': 'Max. Höhe',
        'stats.estimatedTime': 'Geschätzte Zeit',
        
        // Map section
        'map.title': 'Streckenmap',
        'map.flat': 'Flach',
        'map.uphill': 'Bergauf',
        'map.downhill': 'Bergab',
        'map.surfaceAnalysis': 'Untergrund-Analyse',
        'map.analyzingSurface': 'Analysiere Untergrund-Daten...',
        'map.applySurface': 'Untergrund-Multiplikatoren auf Tempo anwenden',
        
        // Elevation section
        'elevation.title': 'Streckenprofil',
        'elevation.profile': 'Höhenprofil',
        'elevation.gradient': 'Steigungsprofil',
        'elevation.distanceKm': 'Distanz (km)',
        'elevation.distanceMi': 'Distanz (mi)',
        'elevation.elevationM': 'Höhe (m)',
        'elevation.elevationFt': 'Höhe (ft)',
        'elevation.gradientPercent': 'Steigung (%)',
        
        // Pace section
        'pace.title': 'Rennstrategie',
        'pace.units': 'Einheiten:',
        'pace.savePlan': 'Plan speichern',
        'pace.loadPlan': 'Plan laden',
        'pace.targetTime': 'Zielzeit',
        'pace.itraIndex': 'ITRA Index',
        'pace.manualPace': 'Manuelles Tempo',
        'pace.description': 'Setze dein Zieltempo für verschiedene Geländetypen. Tempo in Minuten pro Kilometer (min/km).',
        'pace.flat': 'Flach-Tempo',
        'pace.flatHint': 'Dein Tempo auf flachem Terrain',
        'pace.uphill': 'Bergauf-Tempo',
        'pace.uphillHint': 'Steigung > 5%',
        'pace.downhill': 'Bergab-Tempo',
        'pace.downhillHint': 'Gefälle < -5%',
        'pace.calculate': 'Rennplan berechnen',
        
        // Pace Info Tooltip
        'paceInfo.header': 'Berechnung basiert auf:',
        'paceInfo.runnerLevel': 'Läufer-Level',
        'paceInfo.itraScore': 'ITRA-Score',
        'paceInfo.targetTime': 'Zielzeit',
        'paceInfo.flatPace': 'Flach-Tempo',
        'paceInfo.uphillPace': 'Bergauf-Tempo',
        'paceInfo.downhillPace': 'Bergab-Tempo',
        'paceInfo.fatigueFactor': 'Ermüdungsfaktor',
        'paceInfo.surfaceFactors': 'Untergrund-Faktoren',
        'paceInfo.enabled': 'Aktiviert',
        
        // Splits section
        'splits.title': 'Splits-Tabelle',
        'splits.strategyTitle': 'Strategie-Details',
        'splits.km': 'KM',
        'splits.miles': 'Meile',
        'splits.terrain': 'Terrain',
        'splits.pace': 'Tempo',
        'splits.splitTime': 'Split',
        'splits.cumulative': 'Gesamt',
        'splits.elevation': 'Höhe',
        
        // AID stations
        'aid.title': 'Verpflegungspunkte',
        'aid.addStation': 'Station hinzufügen',
        'aid.name': 'Stationsname',
        'aid.distance': 'Distanz (km)',
        'aid.stopTime': 'Aufenthalt',
        'aid.eta': 'Ankunft',
        'aid.noStations': 'Keine Verpflegungspunkte konfiguriert.',
        'aid.addHint': 'Klicke "Station hinzufügen" um Checkpoints einzurichten.',
        
        // Sun times
        'sun.title': 'Sonne & Nacht',
        'sun.raceDate': 'Renndatum',
        'sun.startTime': 'Startzeit',
        'sun.sunrise': 'Sonnenaufgang',
        'sun.sunset': 'Sonnenuntergang',
        'sun.nightSections': 'Nachtabschnitte werden in der Splits-Tabelle hervorgehoben.',
        
        // Export section
        'export.title': 'Export & Teilen',
        'export.raceCard': 'Race Card erstellen',
        'export.pdf': 'PDF herunterladen',
        'export.print': 'Race Card drucken',
        
        // Footer
        'footer.about': 'Über uns',
        'footer.privacy': 'Datenschutz',
        'footer.impressum': 'Impressum',
        
        // Feedback panel
        'feedback.title': 'Feedback senden',
        'feedback.like': 'Was gefällt dir an GPXray?',
        'feedback.likePlaceholder': 'Die Funktionen, die ich am nützlichsten finde...',
        'feedback.missing': 'Welche Funktionen fehlen?',
        'feedback.missingPlaceholder': 'Ich wünsche mir, GPXray könnte...',
        'feedback.bugs': 'Bugs oder Probleme?',
        'feedback.bugsPlaceholder': 'Mir ist aufgefallen, dass...',
        'feedback.pricing': 'Was würdest du für Rennstrategie zahlen?',
        'feedback.perRace': 'Pro Rennen:',
        'feedback.perYear': 'Pro Jahr:',
        'feedback.email': 'E-Mail (optional, für Rückfragen)',
        'feedback.send': 'Feedback senden',
        'feedback.orEmail': 'oder direkt per E-Mail',
        'feedback.thanks': 'Danke!',
        'feedback.thanksSub': 'Dein Feedback hilft uns, GPXray zu verbessern.',
        
        // History panel
        'history.title': 'Analyse-Verlauf',
        'history.empty': 'Noch keine gespeicherten Analysen.',
        'history.emptyHint': 'Deine Analysen erscheinen hier nach dem Speichern.',
        'history.exportAll': 'Alle exportieren',
        'history.import': 'Importieren',
        
        // Race browser
        'races.title': 'Beliebte Trailrennen',
        'races.search': 'Rennen suchen...',
        'races.all': 'Alle',
        'races.ultra': 'Ultra (100km+)',
        'races.marathon': 'Marathon Trail',
        'races.short': 'Kurz (<42km)',
        'races.missing': 'Rennen fehlt?',
        'races.request': 'Anfragen!',
        
        // Cookie consent
        'cookies.message': 'Wir nutzen Cookies für Analytics, um GPXray zu verbessern.',
        'cookies.accept': 'Akzeptieren',
        'cookies.decline': 'Ablehnen',
        
        // Surface types
        'surface.road': 'Straße',
        'surface.trail': 'Trail',
        'surface.technical': 'Technisch',
        'surface.unknown': 'Unbekannt',
        
        // Terrain types
        'terrain.flat': 'Flach',
        'terrain.uphill': 'Bergauf',
        'terrain.downhill': 'Bergab',
        
        // Course shape insights
        'shape.frontInsightDynamic': '{pct}% Anstieg in erster Hälfte → Beine schonen für schnellen Abstieg nach KM{km}',
        'shape.backInsightDynamic': '{pct}% Anstieg in zweiter Hälfte → Früh Energie sparen, spät alles geben',
        'shape.balancedInsightDynamic': 'Gleichmäßige Anstiegsverteilung → Konstanter Einsatz durchgehend',
        
        // Sun times special cases
        'sun.polarNight': 'Polarnacht',
        'sun.midnightSun': 'Mitternachtssonne',
        
        // Print
        'print.title': 'Rennstrategie',
        
        // Button states
        'btn.loading': '⏳ Lädt...',
        'btn.demoLoaded': '✅ Vorschau geladen!',
        'btn.generating': '⏳ Generiere...',
        'btn.creating': '⏳ Erstelle...',
        'btn.joining': 'Beitritt...',
        'btn.joinWaitlist': 'Warteliste beitreten',
        'btn.shareStrategy': 'Share Card erstellen',
        'btn.exportGpx': 'Export für Uhr',
        'btn.downloaded': '✅ Heruntergeladen!',
        'btn.lockscreenCard': 'Sperrbildschirm-Karte',
        'btn.feedback': 'Feedback teilen',
        'btn.cancel': 'Abbrechen',
        
        // GPX Export Options Modal
        'gpxExport.title': 'Export anpassen',
        'gpxExport.subtitle': 'Welche Wegpunkte sollen enthalten sein?',
        'gpxExport.aidStations': 'Verpflegungsstationen',
        'gpxExport.aidStationsDesc': 'Wasser, Essen, Crew-Zugang',
        'gpxExport.climbs': 'Grosse Anstiege',
        'gpxExport.climbsDesc': 'Top 5 Anstiege mit Höhengewinn',
        'gpxExport.eatStops': 'Essen-Erinnerungen',
        'gpxExport.eatStopsDesc': 'Terrain-basierte Spots zwischen Stationen',
        'gpxExport.hint': '💡 Manche Uhren zeigen Anstiege automatisch. Deaktiviere wenn deine das auch tut.',
        
        // Lockscreen Card Export Options Modal
        'lockscreenExport.title': 'Sperrbildschirm-Karte anpassen',
        'lockscreenExport.subtitle': 'Was soll auf der Karte enthalten sein?',
        'lockscreenExport.schedule': 'Verpflegungsplan',
        'lockscreenExport.scheduleDesc': 'Erwartete Ankunftszeiten an jeder Station',
        'lockscreenExport.challenges': 'Schlüsselherausforderungen',
        'lockscreenExport.challengesDesc': 'Große Anstiege, Nachtetappen, Beinermüdung',
        'lockscreenExport.stats': 'Renndaten',
        'lockscreenExport.statsDesc': 'Distanz, Höhengewinn/-verlust',
        'lockscreenExport.profile': 'Höhenprofil',
        'lockscreenExport.profileDesc': 'Mini-Diagramm mit wichtigen Markierungen',
        'lockscreenExport.showAidStations': 'Verpflegungsstationen anzeigen',
        'lockscreenExport.showClimbs': 'Große Anstiege anzeigen',
        'lockscreenExport.fontSize': 'Schriftgröße:',
        'lockscreenExport.small': 'Klein',
        'lockscreenExport.medium': 'Mittel',
        'lockscreenExport.large': 'Groß',
        'lockscreenExport.hint': '💡 Profil zeigt Anstiege (orange) + Verpflegung (grün). Herausforderungen = nur Text-Liste.',
        'lockscreenExport.export': 'Karte erstellen',
        
        // PDF Export Options Modal
        'pdfExport.title': 'PDF Export anpassen',
        'pdfExport.subtitle': 'Wähle, was enthalten sein soll:',
        'pdfExport.stats': 'Rennstatistiken',
        'pdfExport.statsDesc': 'Distanz, Höhenmeter, Zeit, Sonnenzeiten',
        'pdfExport.profile': 'Höhenprofil',
        'pdfExport.profileDesc': 'Streckenhöhendiagramm',
        'pdfExport.profileAid': 'AID-Stationen anzeigen',
        'pdfExport.profileClimbs': 'Anstiege anzeigen',
        'pdfExport.aidSummary': 'Verpflegungsübersicht',
        'pdfExport.aidSummaryDesc': 'Schnellreferenz mit Pausenzeiten',
        'pdfExport.splits': 'Detaillierte Splits-Tabelle',
        'pdfExport.splitsDesc': 'Tempo, Terrain, Zeiten pro Kilometer',
        'pdfExport.themeLabel': 'Design:',
        'pdfExport.dark': 'Dunkel',
        'pdfExport.light': 'Hell',
        'pdfExport.fontSizeLabel': 'Schriftgröße:',
        'pdfExport.fontNormal': 'Normal',
        'pdfExport.fontLarge': 'Groß',
        'pdfExport.download': 'PDF herunterladen',
        'pdfExport.hint': 'Profil: Anstiegszonen (orange) + Verpflegungsstationen (grün).',
        
        // Crew Card export
        'crew.title': 'CREW ZEITPLAN',
        'crew.finish': 'ZIEL',
        'crew.start': 'Start',
        'crew.minBreak': 'min Pause',
        'crew.toNext': 'bis nächste',
        'crew.toFinish': 'bis Ziel',
        'crew.afterClimb': 'Nach {0}m Anstieg',
        'crew.afterDescent': 'Nach {0}m Abstieg',
        'crew.longLeg': 'Lange {0}km Etappe',
        'crew.nightArrival': 'Nacht-Ankunft',
        'crew.night': 'Nacht',
        'crew.climbAhead': '{0}m Anstieg voraus',
        'crew.descentAhead': '{0}m Abstieg voraus',
        'crew.kmToNext': '{0}km bis nächste',
        'crew.kmToFinish': '{0}km bis Ziel',
        'crew.kmPlusClimbToFinish': '{0}km + {1}m bis Ziel',
        'crew.kmDescentToFinish': '{0}km ↘️ bis Ziel',
        'crew.crewAllowed': 'Crew',
        'crew.legendText': 'Crew erlaubt',
        'crew.shareTitle': 'Crew Zeitplan - {0}',
        'crew.shareText': "Hier ist mein Rennplan für {0}! Triff mich an diesen Verpflegungsstationen 👟\n\nPlane dein Rennen mit https://gpxray.run",
        
        // Lockscreen Card export
        'lockscreen.subtitle': 'RENNSTRATEGIE',
        'lockscreen.mGain': 'Hm Anstieg',
        'lockscreen.mLoss': 'Hm Abstieg',
        'lockscreen.cutoff': 'Cutoff',
        'lockscreen.raceSchedule': 'RENN ZEITPLAN',
        'lockscreen.station': 'STATION',
        'lockscreen.race': 'ZEIT',
        'lockscreen.clock': 'UHRZEIT',
        'lockscreen.finish': 'ZIEL',
        
        // Share card preview
        'share.previewLabel': 'Auf deiner Share Card:',
        'share.rerollHint': 'Anderen Spruch',

        // Race browser
        'races.noResults': 'Keine Rennen gefunden, die deinen Kriterien entsprechen.',
        
        // Splits table
        'splits.surface': 'Untergrund',
        'splits.aid': 'VP',
        'splits.stop': 'Stopp',
        'splits.fuel': 'Essen',
        'splits.clock': 'Uhrzeit',
        'splits.min': 'min',
        
        // Leg summary
        'leg.title': 'Etappen-Übersicht',
        'leg.leg': 'Etappe',
        'leg.dist': 'Dist',
        'leg.gain': 'Aufstieg',
        'leg.loss': 'Abstieg',
        'leg.time': 'Zeit',
        'leg.arrival': 'Ankunft',
        'leg.toFinish': 'bis Ziel',
        
        // General
        'general.loading': 'Lädt...',
        'general.error': 'Fehler',
        'general.success': 'Erfolg',
        'general.close': 'Schließen',
        'general.save': 'Speichern',
        'general.cancel': 'Abbrechen',
        'general.delete': 'Löschen',
        
        // Story card witty statements
        'story.nextDay.1': 'Bis morgen. ☕<br>Haltet den Kaffee warm.',
        'story.nextDay.2': 'Wartet nicht auf mich. 😴<br>Das wird länger dauern.',
        'story.nextDay.3': 'Bin irgendwann zurück.<br>Hebt mir Frühstück auf. 🥐',
        'story.nextDay.4': 'Bin laufen. 🏃<br>Zurück in einem Tag oder so.',
        'story.nextDay.5': 'Nachtabenteuer. 🍾<br>Champagner morgen öffnen.',
        'story.nextDay.6': 'Schlaft gut. 💤<br>Ich jage den Sonnenaufgang.',
        'story.nextDay.7': 'Langer Tag voraus. ⛺<br>Geduld einpacken.',
        'story.nextDay.8': 'Laufe in den nächsten Tag. 🌅<br>Buchstäblich.',
        'story.nextDay.9': 'Dämmerung zu Dämmerung. 🌓<br>Das wird episch.',
        'story.nextDay.10': 'Eisbad gebucht. 🧊<br>Meine Beine werden es brauchen.',
        'story.nextDay.11': 'Marathon? Niedlich. 🏃<br>Ich geh weiter.',
        'story.nextDay.12': 'Zwei Sonnenuntergänge. Ein Rennen. 🌅<br>Los geht\'s.',
        'story.nextDay.13': 'Kompressionsstrümpfe ready. 🧦<br>Morgen-Ich wird danken.',
        'story.nextDay.14': 'Durch die Nacht laufen. 🌌<br>Sterne als Begleitung.',
        'story.nextDay.15': 'Langstrecken-Modus. ✈️<br>Bis später.',
        'story.earlyMorning.1': 'Fertig bevor ihr aufwacht.<br>Keine Sorge. 🌅',
        'story.earlyMorning.2': 'Zurück vor dem Frühstück. 🥣<br>Nur ne kurze Runde.',
        'story.earlyMorning.3': 'Der frühe Vogel holt die Medaille. 🏅<br>Bis Sonnenaufgang.',
        'story.earlyMorning.4': 'Erstes Tageslicht. 🌄<br>Zurück vor dem Wecker.',
        'story.earlyMorning.5': 'Früh-Patrouille. ⛰️<br>Kaffee kann warten.',
        'story.earlyMorning.6': 'Schneller als die Sonne. ☀️<br>Schneller als alle.',
        'story.earlyMorning.7': 'Laufen mit den Hähnen. 🐓<br>Fast fertig.',
        'story.earlyMorning.8': 'Schlummertrunk? Nee.<br>Trail-Mütze. 🧢',
        'story.earlyMorning.9': 'Sterne bis Sonnenaufgang. 🌟<br>Was für ein Ritt.',
        'story.earlyMorning.10': 'Fertig bevor die Welt aufwacht. 🌅<br>Bestes Gefühl.',
        'story.earlyMorning.11': 'Wecker um 4 Uhr. Lohnt sich. ⏰<br>Immer.',
        'story.earlyMorning.12': 'Morgendämmerungs-Krieger. ⚔️<br>Kaffee im Ziel.',
        'story.earlyMorning.13': 'Immer noch schneller als pendeln. 🚗<br>Und macht mehr Spaß.',
        'story.earlyMorning.14': 'Sonnenaufgangs-Finish. 🌄<br>Instagram ready.',
        'story.earlyMorning.15': 'Bevor jemand fragt wo ich bin. 🤫<br>Schon fertig.',
        'story.morning.1': 'Hebt mir Frühstück auf. 🍳<br>Bin gegen Vormittag da.',
        'story.morning.2': 'Zurück zum Brunch.<br>Macht ordentlich was. 🥞',
        'story.morning.3': 'Morgenrunde, sagten sie. 😅<br>Sollte gegen 10 fertig sein.',
        'story.morning.4': 'Nur ein Morgenlauf. 🏃<br>Mit Extra-Kilometern.',
        'story.morning.5': 'Frühstück verdienen. 🥓<br>Auf die harte Tour.',
        'story.morning.6': 'Kaffee kann warten. ☕<br>Berge nicht.',
        'story.morning.7': 'Morgens Gas. 🌄<br>Nachmittags Ruhe.',
        'story.morning.8': 'Morgen-Kilometer erledigt. ✅<br>Tag fängt grad an.',
        'story.morning.9': 'Pfannkuchen rufen. 🥞<br>Laufe hin.',
        'story.morning.10': 'Frühschicht. 🏔️<br>Überstunden optional.',
        'story.morning.11': 'Zweites Frühstück wartet. 🧇<br>Hobbit-Modus.',
        'story.morning.12': 'Croissant-Motivation. 🥐<br>Funktioniert immer.',
        'story.morning.13': 'Morgen-Kilometer. Morgen-Vibes. 🌅<br>Kein Bereuen.',
        'story.morning.14': 'Fertig vor Mittag. 😎<br>Pro-Move.',
        'story.morning.15': 'Brunch-Reservierung steht. 🍳<br>Laufe gerade hin.',
        'story.midday.1': 'Wartet nicht mit dem Mittagessen.<br>Ich ess unterwegs was. 🥪',
        'story.midday.2': 'Zurück zur Mittagszeit.<br>Mit ein paar Geschichten. 📖',
        'story.midday.3': 'Ziel gegen Mittag.<br>Haltet die Brote bereit. 🥪',
        'story.midday.4': 'High Noon Finish. 🤠<br>Danach gibts Pizza.',
        'story.midday.5': 'Mittagessen wird verdient. 🍔<br>Nicht geschenkt.',
        'story.midday.6': 'Sonne hoch. Ich höher. 🌞<br>Fast da.',
        'story.midday.7': 'Carbs laden bald. 🍝<br>Berechtigt.',
        'story.midday.8': 'Mittags-Wahnsinn. 😎<br>Jeden Schritt wert.',
        'story.midday.9': 'Brunch? Lunch?<br>Beides. 🍳',
        'story.midday.10': 'Maximale Sonne. Maximaler Einsatz. ☀️<br>Maximale Belohnung.',
        'story.midday.11': 'Mittagsplan: RIESIG. 🍔<br>Hab ich verdient.',
        'story.midday.12': 'Mittags-Nudeln rufen. 🍜<br>Fast da.',
        'story.midday.13': 'Bräunungslinien incoming. ☀️<br>Trail Edition.',
        'story.midday.14': 'Siesta eingeplant. 😴<br>Gleich danach.',
        'story.midday.15': 'Eis im Ziel. 🍦<br>Pflichtprogramm.',
        'story.afternoon.1': 'Zurück zum Aperol Spritz. 🍹<br>Erste Runde geht auf mich.',
        'story.afternoon.2': 'Nachmittags im Ziel.<br>Dann ab aufs Sofa. 🛋️',
        'story.afternoon.3': 'Sollte vor dem Abendessen fertig sein.<br>Fangt nicht ohne mich an. 🍽️',
        'story.afternoon.4': 'Siesta nach dem Finish. 😴<br>Prioritäten.',
        'story.afternoon.5': 'Kaffee und Kuchen warten. ☕<br>Fast da.',
        'story.afternoon.6': 'Bier-Uhr naht. 🍺<br>Perfekt im Zeitplan.',
        'story.afternoon.7': 'Netflix und erholen. 📺<br>Der Plan.',
        'story.afternoon.8': 'Sofa, ich komme. 🛋️<br>Hast du mich vermisst?',
        'story.afternoon.9': 'Fertig zum Apero. 🥂<br>Perfektes Timing.',
        'story.afternoon.10': 'Sonnenuntergang-Countdown. 🌅<br>Fast frei.',
        'story.afternoon.11': 'Erst duschen. Dann Fragen. 🚿<br>Bitte.',
        'story.afternoon.12': 'Happy Hour startet im Ziel. 🍺<br>Bin unterwegs.',
        'story.afternoon.13': 'Die Couch ruft. 🛋️<br>Laut.',
        'story.afternoon.14': 'Pasta laden... ⏳<br>98% fertig.',
        'story.afternoon.15': 'Beine: müde. Spirit: ungebrochen. 💪<br>Fast da.',
        'story.evening.1': 'Bin zum Abendessen zurück.<br>Vielleicht. 🤷',
        'story.evening.2': 'Abends im Ziel.<br>Hebt mir was auf. 🍝',
        'story.evening.3': 'Wartet nicht mit dem Essen.<br>Aber hebt mir Nachtisch auf. 🍰',
        'story.evening.4': 'Golden Hour Finish. 🌅<br>Perfekt für Fotos.',
        'story.evening.5': 'Abendessen wird spät. 🍕<br>Bestellt ohne mich.',
        'story.evening.6': 'Sonnenuntergangs-Finish. 🌇<br>Jede Blase wert.',
        'story.evening.7': 'Daheim zum Filmabend. 🎬<br>Wahrscheinlich.',
        'story.evening.8': 'Spät aber nicht zu spät. ⏰<br>Perfekt.',
        'story.evening.9': 'Dämmerungs-Triumph. 🌆<br>Tag gut genutzt.',
        'story.evening.10': 'Tischreservierung? 🍷<br>Wein öffnen um 21 Uhr.',
        'story.evening.11': 'Abendessen? ICH BIN das Abendessen. 🥵<br>Ausgehungert.',
        'story.evening.12': 'Netflix und zusammenbrechen. 📺<br>Perfekter Abend.',
        'story.evening.13': 'Pizza bei km 50 bestellt. 🍕<br>Timing ist alles.',
        'story.evening.14': 'Stirnlampe? Fast gebraucht. 🔦<br>Knapp.',
        'story.evening.15': 'Goldenes Finish. Goldene Erinnerungen. 🏆<br>Hat sich gelohnt.',
        'story.night.1': 'Bin um Mitternacht zurück.<br>Stellt schon mal den Prosecco kalt. 🥂',
        'story.night.2': 'Spätes Finish. 🌙<br>Lasst das Licht an.',
        'story.night.3': 'Bleibt nicht auf. 😴<br>Aber lasst mir nen Snack da.',
        'story.night.4': 'Zurück vor der Bettzeit.<br>Hoffentlich. 🤞',
        'story.night.5': 'Stirnlampen-Helden. 🔦<br>Nachtschicht laufen.',
        'story.night.6': 'Sterne jagen heute Nacht. ⭐<br>Vor Sonnenaufgang daheim.',
        'story.night.7': 'Mondschein-Finish. 🌙<br>Die beste Art.',
        'story.night.8': 'Recovery Boots warten. 🦶<br>Bis später.',
        'story.night.9': 'Schlaf ist überbewertet. 😴<br>Medaillen nicht.',
        'story.night.10': 'Nachteule-Modus. 🦉<br>Trail Edition.',
        'story.night.11': 'Mitternachts-Krieger. ⚔️<br>Noch unterwegs.',
        'story.night.12': 'Wer braucht schon Schlaf? 😴<br>Ich nicht.',
        'story.night.13': 'Die Sterne sind schöner hier oben. ⭐<br>Vertrau mir.',
        'story.night.14': 'Night Moves. 🌙<br>Bob Seger wäre stolz.',
        'story.night.15': 'Dunkelheit ist nur Einstellung. 🔦<br>Meine ist hell.',
        'story.default': 'Bin laufen. 🏃<br>Zurück wenn ich fertig bin.',
        'story.myStrategy': 'Mein Rennplan',
        'story.createdBy': 'Plane dein Rennen mit',
        'story.start': 'Start',
        'story.target': 'Ziel'
    },
    fr: {
        // Header
        'header.tagline': 'Connais ta course avant le départ.',
        'header.feedback': 'Feedback',
        'header.history': 'Historique',
        
        // Intro section
        'intro.headline': 'Construis ta stratégie de course avant le jour J.',
        'intro.text': 'Analyse le terrain, simule une allure réaliste et comprends où ta course se joue.',
        'intro.smartPace': 'Allure Intelligente',
        'intro.smartPacing': 'Pacing Intelligent',
        'intro.topClimbs': 'Montées Clés',
        'intro.weatherImpact': 'Impact Météo',
        'intro.surfaceAnalysis': 'Analyse Surface',
        'intro.aidStations': 'Ravitaillements',
        'intro.sunTimes': 'Lever/Coucher',
        'intro.shareCard': 'Carte de Partage',
        'intro.lockscreenCard': 'Écran Verrouillage',
        'intro.nutritionPlanner': 'Plan Nutrition',
        'intro.downhillLoad': 'Charge Descente',
        'intro.crewCard': 'Carte Équipe',
        'intro.comingSoon': 'bientôt',
        'intro.raceHeadline': 'Construis ta stratégie de course avant le jour J.',
        'intro.raceText': 'Analyse le terrain, simule une allure réaliste et comprends où ta course se joue.',
        'intro.feature1': '🏔️ Analyse le terrain',
        'intro.feature2': '⏱️ Simule une allure réaliste',
        'intro.feature3': '🎯 Trouve les points décisifs',
        
        // Feature pill tooltips
        'pill.smartPace.info': 'Passe chaque split dans les temps. Prédictions d\'allure réalistes qui s\'adaptent aux montées et descentes — plus d\'explosion au km 15.',
        'pill.smartPacing.info': 'Passe chaque split dans les temps. Prédictions d\'allure réalistes qui s\'adaptent aux montées et descentes — plus d\'explosion au km 15.',
        'pill.topClimbs.info': 'Sache ce qui t\'attend. Visualise les 5 plus grandes montées avec position exacte et dénivelé — pour gérer ton effort.',
        'pill.weatherImpact.info': 'Les conditions du jour comptent. Vois comment température, pluie et vent affecteront ton temps d\'arrivée.',
        'pill.surfaceAnalysis.info': 'Prépare-toi au terrain. Identifie où le terrain technique te ralentira — pour planifier ton effort.',
        'pill.aidStations.info': 'Plus de fringale entre les ravitos. Vois la distance et difficulté de chaque section — ravitaille-toi et gère ton allure.',
        'pill.sunTimes.info': 'Cours contre la lumière, pas seulement le chrono. Sache quand tu auras besoin de ta frontale.',
        'pill.shareCard.info': 'Montre ton plan de course au monde. Crée une carte stratégie à partager avec amis et sur les réseaux.',
        'pill.lockscreenCard.info': 'Reste concentré quand ça fait mal. Vois la distance jusqu\'au prochain ravito et où arrivent les grosses montées — un coup d\'œil, sans réfléchir.',
        'pill.nutritionPlanner.info': 'Ravitaille sans deviner. Planifie calories et hydratation pour chaque section — fort jusqu\'à l\'arrivée.',
        'pill.downhillLoad.info': 'Protège tes quadriceps. Vois où le stress de descente cumulé atteindra son maximum — et retiens-toi si besoin.',
        'pill.crewCard.info': 'Garde ton équipe synchronisée. Donne-leur horaires et lieux exacts — ils seront prêts quand tu arrives.',
        
        // Upload section
        'upload.dragDrop': 'Glisse-dépose un fichier GPX ici ou',
        'upload.browse': 'Parcourir',
        'upload.selectFile': 'Sélectionner fichier GPX',
        'upload.or': 'ou',
        'upload.tryDemo': 'Aperçu: ZUT Garmisch-Partenkirchen Trail',
        'upload.browseRaces': 'Parcourir les courses populaires',
        'upload.demoHint': 'Charge un parcours exemple pour découvrir les fonctionnalités',
        'upload.demoHintFull': 'Parcours notre base de courses',
        'upload.privacy': '100% Local — Tes données GPX ne quittent jamais ton appareil',
        
        // Route name
        'route.changeRoute': '↻ Recommencer',
        'route.confirmStartOver': 'Recommencer? Ton plan de course actuel sera effacé.',
        
        // Dev gate
        'beta.title': 'GPXray',
        'beta.badge': 'DEV',
        'beta.description': 'Aperçu développement avec nouvelles fonctionnalités.',
        'beta.placeholder': 'Mot de passe dev',
        'beta.enter': 'Entrer',
        'beta.error': 'Mot de passe incorrect',
        'beta.stableHint': 'Pas de mot de passe? Visite la',
        'beta.stableLink': 'version stable',
        
        // Early access modal
        'earlyAccess.title': 'Accès Anticipé',
        'earlyAccess.description': 'Débloque la stratégie complète pour ton fichier GPX.',
        'earlyAccess.placeholder': 'Code d\'accès',
        'earlyAccess.unlock': 'Débloquer',
        'earlyAccess.error': 'Code invalide. Réessaie.',
        'earlyAccess.hint': 'Ou lance la simulation ci-dessous pour voir comment ça marche!',
        
        // Hero section
        'hero.estimatedFinish': 'Temps d\'arrivée estimé',
        'hero.runnerLevel': 'Niveau coureur:',
        'hero.beginner': 'Débutant',
        'hero.intermediate': 'Intermédiaire',
        'hero.advanced': 'Avancé',
        'hero.elite': 'Élite',
        'hero.topClimbs': 'Montées Clés',
        'hero.downhillLoad': 'Charge Descente',
        'hero.elevationGain': 'Dénivelé Positif',
        'hero.nutritionWindow': 'Fenêtres Ravito',
        'nutrition.title': 'Recommandations Ravitaillement',
        'nutrition.description': 'Environ toutes les ~45 min sur terrain plat ou aux ravitos.',
        'nutrition.logic': 'Priorise les ravitos, complète avec terrain facile (<10% pente).',
        'leg.gels': 'gels',
        'leg.nutritionTooltip': 'Besoins en ravitaillement estimés pour cette étape',
        'hero.hint': 'Basé sur allures par défaut',
        'hero.customize': 'Personnaliser ↓',
        'hero.clickCalculate': '▼ Calculer ci-dessous',
        'hero.gpxBased': 'Basé sur fichier GPX',
        'hero.official': 'Officiel',
        
        // Race landing page
        'race.strategyTitle': 'Crée ta stratégie de course',
        'race.selectLevel': 'Quel est ton niveau?',
        'race.selectDistance': 'Quelle distance cours-tu?',
        'race.itraOptional': 'Tu connais ton score ITRA?',
        'race.advancedOptions': 'Options avancées',
        'race.itraApply': 'Appliquer',
        'race.itraApplied': 'Appliqué',
        'race.itraHint': 'Le score ITRA permet une estimation d\'allure plus précise',
        'race.itraExplain': 'ITRA (International Trail Running Association) attribue des scores de performance basés sur tes résultats.',
        'race.itraFindScore': 'Trouve ton score ITRA',
        
        // Terrain skills
        'race.terrainSkills': 'Compétences Terrain',
        'race.uphill': 'Montée',
        'race.downhill': 'Descente',
        'race.terrainBalanced': 'Équilibré',
        'race.uphillStrong': 'Fort grimpeur',
        'race.uphillGood': 'Bon grimpeur',
        'race.uphillStruggles': 'Difficultés en montée',
        'race.downhillAggressive': 'Agressif',
        'race.downhillGood': 'Bon descendeur',
        'race.downhillCautious': 'Prudent',
        'race.terrainExplain': 'Ajuste selon tes capacités en montée et descente. Droite (cyan) = plus rapide, gauche (orange) = plus lent.',
        'race.slow': 'Lent',
        'race.fast': 'Rapide',
        
        // Fuel preferences
        'race.fuelPrefs': 'Mon Carburant',
        'race.fuelExplain': 'Sélectionne ce que tu utilises vraiment en course. On te le suggérera dans la colonne Fuel.',
        'fuel.gels': 'Gels',
        'fuel.bars': 'Barres',
        'fuel.gummies': 'Bonbons',
        'fuel.realFood': 'Vraie Nourriture',
        'fuel.carbDrinks': 'Boissons Glucidiques',
        
        // Race date/time presets
        'race.whenRace': 'Quand est ta course?',
        'race.preset2h': 'Dans 2 heures',
        'race.presetTomorrow': 'Demain',
        'race.presetWeekend': 'Ce weekend',
        'race.presetCustom': 'Personnalisé',
        'race.calculate': '🚀 Créer Stratégie',
        'race.calculating': '⏳ Création...',
        'race.editStrategy': '✏️ Modifier Stratégie',
        'race.units': 'Unités:',
        'race.targetTime': 'Temps cible:',
        'race.targetOptional': '(optionnel)',
        'race.overrideHint': 'Temps cible ou ITRA remplace le niveau coureur',
        'race.createStrategy': 'Créer Stratégie',
        'race.addAidStations': 'Ajouter Ravitaillements',
        'race.visitWebsite': 'Visiter Site Officiel',
        
        // Weather
        'weather.forecast': 'Prévisions Météo',
        'weather.raceDayForecast': 'Météo du Jour de Course',
        'weather.notAvailable': 'Prévisions pas encore disponibles pour',
        'weather.loading': 'Chargement prévisions...',
        'weather.adjustment': 'ajustement météo',
        'weather.source': 'Source',
        'weather.sourceTitle': 'Données Météo',
        'weather.sourceDesc': 'Fourni par Open-Meteo, une API météo gratuite agrégeant plusieurs modèles.',
        'weather.sourceModels': 'Modèles utilisés:',
        'weather.sourceNote': 'Les prévisions peuvent différer d\'autres services en raison du mélange de modèles.',
        'weather.clear': 'Ciel dégagé',
        'weather.partlyCloudy': 'Partiellement nuageux',
        'weather.foggy': 'Brouillard',
        'weather.drizzle': 'Bruine',
        'weather.rain': 'Pluie',
        'weather.snow': 'Neige',
        'weather.rainShowers': 'Averses',
        'weather.snowShowers': 'Averses de neige',
        'weather.thunderstorm': 'Orage',
        'weather.variable': 'Variable',
        
        // Surface Analysis
        'surface.title': 'Analyse Surface',
        'surface.road': 'Route',
        'surface.trail': 'Sentier',
        'surface.technical': 'Technique',
        'surface.loading': 'Analyse...',
        'surface.applyMultipliers': 'Appliquer à l\'allure',
        
        // Climb Profile
        'climb.profile': 'Profil de Montée',
        'climb.uphill': 'Montée',
        'climb.flat': 'Plat',
        'climb.downhill': 'Descente',
        
        // Night Running
        'night.title': 'Course de Nuit',
        'night.distance': 'Distance de nuit',
        'night.sections': 'Sections de nuit',
        'night.headlamp': 'Frontale nécessaire',
        'night.penalty': 'Pénalité nuit',
        
        // AID Station
        'aid.planTitle': 'Plan Ravitaillements',
        
        // Downhill Load tooltip
        'ddl.title': 'Charge Descente (DDL/km)',
        'ddl.description': 'Stress de descente moyen par km (pente × surface).',
        'ddl.intensity': 'Intensité du parcours:',
        'ddl.easy': 'Terrain facile',
        'ddl.moderate': 'Descentes modérées',
        'ddl.demanding': 'Descentes exigeantes',
        'ddl.extreme': 'Tueur de quadriceps!',
        'ddl.paceLossNote': 'La perte d\'allure dépend de ton niveau.',
        'ddl.howItWorks': 'Comment ça marche',
        
        // DDL insights
        'ddl.noPaceLoss': 'Pas de perte d\'allure prévue',
        'ddl.downhillPaceLoss': 'Perte d\'allure en descente: +{min}-{max} sec/km',
        'ddl.expectSlower': 'Descentes plus lentes après KM{km} (+{min}-{max} sec/km)',
        'ddl.mildSlowdown': 'Léger ralentissement en descente après KM{km}',
        
        // DDL Modal
        'ddl.modal.title': 'Charge de Descente → Perte d\'Allure',
        'ddl.modal.tagline': 'La DDL s\'accumule en descendant. Quand le DDL cumulé approche ton DFT, les quadriceps fatiguent → l\'allure en descente diminue.',
        'ddl.modal.freshLegs': 'Jambes fraîches',
        'ddl.modal.noPaceLoss': 'Pas de perte d\'allure',
        'ddl.modal.lateFatigue': 'Fatigue fin de course',
        'ddl.modal.dftExplain': '<strong>DFT = ton seuil de fatigue en descente</strong> (dépend du niveau coureur). Change le niveau pour personnaliser.',
        'ddl.modal.showFormula': 'Voir la formule',
        'ddl.modal.disclaimer': 'Ceci est un modèle heuristique, pas un avis médical.',
        
        // Weather adjustment tooltip
        'weather.title': 'Impact Météo',
        'weather.description': 'La météo du jour de course affecte ton temps d\'arrivée.',
        'weather.factors': 'Facteurs d\'ajustement:',
        
        // Course shape
        'shape.frontLoaded': 'Chargé au Début',
        'shape.backLoaded': 'Chargé à la Fin',
        'shape.balanced': 'Équilibré',
        'shape.frontInsight': 'Montées principales en première moitié',
        'shape.backInsight': 'Grosses montées tard — économise ton énergie',
        'shape.balancedInsight': 'Distribution d\'effort équilibrée',
        
        // Stats section
        'stats.courseDetails': 'Détails du Parcours',
        'stats.totalDistance': 'Distance Totale',
        'stats.elevGain': 'Dénivelé Positif',
        'stats.elevLoss': 'Dénivelé Négatif',
        'stats.minElev': 'Altitude Min',
        'stats.maxElev': 'Altitude Max',
        'stats.estimatedTime': 'Temps Estimé',
        
        // Map section
        'map.title': 'Carte du Parcours',
        'map.flat': 'Plat',
        'map.uphill': 'Montée',
        'map.downhill': 'Descente',
        'map.surfaceAnalysis': 'Analyse Surface',
        'map.analyzingSurface': 'Analyse des données surface...',
        'map.applySurface': 'Appliquer coefficients surface à l\'allure',
        
        // Elevation section
        'elevation.title': 'Charge du Parcours',
        'elevation.profile': 'Profil Altimétrique',
        'elevation.gradient': 'Profil de Pente',
        'elevation.distanceKm': 'Distance (km)',
        'elevation.distanceMi': 'Distance (mi)',
        'elevation.elevationM': 'Altitude (m)',
        'elevation.elevationFt': 'Altitude (ft)',
        'elevation.gradientPercent': 'Pente (%)',
        
        // Pace section
        'pace.title': 'Stratégie de Course',
        'pace.units': 'Unités:',
        'pace.savePlan': 'Sauvegarder',
        'pace.loadPlan': 'Charger',
        'pace.targetTime': 'Temps Cible',
        'pace.itraIndex': 'Index ITRA',
        'pace.manualPace': 'Allure Manuelle',
        'pace.description': 'Définis ton allure cible pour différents types de terrain. Allure en minutes par kilomètre (min/km).',
        'pace.flat': 'Allure Plat',
        'pace.flatHint': 'Ton allure sur terrain plat',
        'pace.uphill': 'Allure Montée',
        'pace.uphillHint': 'Pente > 5%',
        'pace.downhill': 'Allure Descente',
        'pace.downhillHint': 'Pente < -5%',
        'pace.calculate': 'Calculer Plan de Course',
        
        // Pace Info Tooltip
        'paceInfo.header': 'Calcul basé sur:',
        'paceInfo.runnerLevel': 'Niveau Coureur',
        'paceInfo.itraScore': 'Score ITRA',
        'paceInfo.targetTime': 'Temps Cible',
        'paceInfo.flatPace': 'Allure Plat',
        'paceInfo.uphillPace': 'Allure Montée',
        'paceInfo.downhillPace': 'Allure Descente',
        'paceInfo.fatigueFactor': 'Facteur Fatigue',
        'paceInfo.surfaceFactors': 'Facteurs Surface',
        'paceInfo.enabled': 'Activé',
        
        // Splits section
        'splits.title': 'Tableau des Splits',
        'splits.strategyTitle': 'Détails Stratégie',
        'splits.km': 'KM',
        'splits.miles': 'Mile',
        'splits.terrain': 'Terrain',
        'splits.pace': 'Allure',
        'splits.splitTime': 'Split',
        'splits.cumulative': 'Cumulé',
        'splits.elevation': 'Altitude',
        
        // AID stations
        'aid.title': 'Ravitaillements',
        'aid.addStation': 'Ajouter Station',
        'aid.name': 'Nom Station',
        'aid.distance': 'Distance (km)',
        'aid.stopTime': 'Temps d\'arrêt',
        'aid.eta': 'Heure Arrivée',
        'aid.noStations': 'Aucun ravitaillement configuré.',
        'aid.addHint': 'Clique "Ajouter Station" pour configurer les checkpoints.',
        
        // Sun times
        'sun.title': 'Soleil & Nuit',
        'sun.raceDate': 'Date de Course',
        'sun.startTime': 'Heure de Départ',
        'sun.sunrise': 'Lever du soleil',
        'sun.sunset': 'Coucher du soleil',
        'sun.nightSections': 'Les sections de nuit seront mises en évidence dans le tableau.',
        
        // Export section
        'export.title': 'Export & Partage',
        'export.raceCard': 'Créer Carte Course',
        'export.pdf': 'Télécharger PDF',
        'export.print': 'Imprimer Carte',
        
        // Footer
        'footer.about': 'À Propos',
        'footer.privacy': 'Confidentialité',
        'footer.impressum': 'Mentions Légales',
        
        // Feedback panel
        'feedback.title': 'Envoyer Feedback',
        'feedback.like': 'Qu\'aimes-tu dans GPXray?',
        'feedback.likePlaceholder': 'Les fonctionnalités que je trouve les plus utiles...',
        'feedback.missing': 'Quelles fonctionnalités manquent?',
        'feedback.missingPlaceholder': 'J\'aimerais que GPXray puisse...',
        'feedback.bugs': 'Des bugs ou problèmes?',
        'feedback.bugsPlaceholder': 'J\'ai remarqué que...',
        'feedback.pricing': 'Que paierais-tu pour une stratégie de course?',
        'feedback.perRace': 'Par course:',
        'feedback.perYear': 'Par an:',
        'feedback.email': 'Email (optionnel, pour suivi)',
        'feedback.send': 'Envoyer Feedback',
        'feedback.orEmail': 'ou envoyez-nous un email',
        'feedback.thanks': 'Merci!',
        'feedback.thanksSub': 'Ton feedback nous aide à améliorer GPXray.',
        
        // History panel
        'history.title': 'Historique Analyses',
        'history.empty': 'Aucune analyse sauvegardée.',
        'history.emptyHint': 'Tes analyses apparaîtront ici après sauvegarde.',
        'history.exportAll': 'Tout Exporter',
        'history.import': 'Importer',
        
        // Race browser
        'races.title': 'Courses Trail Populaires',
        'races.search': 'Rechercher courses...',
        'races.all': 'Tout',
        'races.ultra': 'Ultra (100km+)',
        'races.marathon': 'Marathon Trail',
        'races.short': 'Court (<42km)',
        'races.missing': 'Course manquante?',
        'races.request': 'Demander!',
        
        // Cookie consent
        'cookies.message': 'Nous utilisons des cookies pour les analytics afin d\'améliorer GPXray.',
        'cookies.accept': 'Accepter',
        'cookies.decline': 'Refuser',
        
        // Surface types
        'surface.road': 'Route',
        'surface.trail': 'Sentier',
        'surface.technical': 'Technique',
        'surface.unknown': 'Inconnu',
        
        // Terrain types
        'terrain.flat': 'Plat',
        'terrain.uphill': 'Montée',
        'terrain.downhill': 'Descente',
        
        // Course shape insights
        'shape.frontInsightDynamic': '{pct}% montée en première moitié → Garde tes jambes pour une descente rapide après KM{km}',
        'shape.backInsightDynamic': '{pct}% montée en seconde moitié → Économise tôt, donne tout tard',
        'shape.balancedInsightDynamic': 'Distribution de montée équilibrée → Effort constant tout au long',
        
        // Sun times special cases
        'sun.polarNight': 'Nuit polaire',
        'sun.midnightSun': 'Soleil de minuit',
        
        // Print
        'print.title': 'Stratégie de Course',
        
        // Button states
        'btn.loading': '⏳ Chargement...',
        'btn.demoLoaded': '✅ Aperçu chargé!',
        'btn.generating': '⏳ Génération...',
        'btn.creating': '⏳ Création...',
        'btn.joining': 'Inscription...',
        'btn.joinWaitlist': 'Rejoindre la liste',
        'btn.shareStrategy': 'Créer Carte Partage',
        'btn.exportGpx': 'Export pour Montre',
        'btn.downloaded': '✅ Téléchargé!',
        'btn.lockscreenCard': 'Carte Verrouillage',
        'btn.feedback': 'Partager ton avis',
        'btn.cancel': 'Annuler',
        
        // GPX Export Options Modal
        'gpxExport.title': 'Personnaliser Export Montre',
        'gpxExport.subtitle': 'Sélectionne les waypoints à inclure:',
        'gpxExport.aidStations': 'Ravitaillements',
        'gpxExport.aidStationsDesc': 'Eau, nourriture, accès équipe',
        'gpxExport.climbs': 'Montées Majeures',
        'gpxExport.climbsDesc': 'Top 5 montées avec dénivelé',
        'gpxExport.eatStops': 'Rappels Nutrition',
        'gpxExport.eatStopsDesc': 'Points de ravito basés sur le terrain',
        'gpxExport.hint': '💡 Certaines montres affichent les montées automatiquement. Décoche si c\'est le cas.',
        
        // Lockscreen Card Export Options Modal
        'lockscreenExport.title': 'Personnaliser Carte Verrouillage',
        'lockscreenExport.subtitle': 'Choisis ce qui apparaît sur ta carte:',
        'lockscreenExport.schedule': 'Planning Ravitos',
        'lockscreenExport.scheduleDesc': 'Heures d\'arrivée prévues à chaque station',
        'lockscreenExport.challenges': 'Défis Clés',
        'lockscreenExport.challengesDesc': 'Montées majeures, sections nuit, fatigue',
        'lockscreenExport.stats': 'Stats Course',
        'lockscreenExport.statsDesc': 'Distance, dénivelé +/-',
        'lockscreenExport.profile': 'Profil Altitude',
        'lockscreenExport.profileDesc': 'Mini graphique avec marqueurs clés',
        'lockscreenExport.showAidStations': 'Afficher Ravitos',
        'lockscreenExport.showClimbs': 'Afficher Montées Majeures',
        'lockscreenExport.fontSize': 'Taille Police:',
        'lockscreenExport.small': 'Petit',
        'lockscreenExport.medium': 'Moyen',
        'lockscreenExport.large': 'Grand',
        'lockscreenExport.hint': '💡 Profil: zones de montée (orange) + ravitos (vert). Défis = liste texte des montées.',
        'lockscreenExport.export': 'Créer Carte',
        
        // PDF Export Options Modal
        'pdfExport.title': 'Personnaliser Export PDF',
        'pdfExport.subtitle': 'Choisis ce qui apparaît:',
        'pdfExport.stats': 'Stats Course',
        'pdfExport.statsDesc': 'Distance, dénivelé, temps, heures soleil',
        'pdfExport.profile': 'Profil Altitude',
        'pdfExport.profileDesc': 'Graphique d\'altitude du parcours',
        'pdfExport.profileAid': 'Afficher les postes de ravitaillement',
        'pdfExport.profileClimbs': 'Afficher les montées',
        'pdfExport.aidSummary': 'Résumé Ravitos',
        'pdfExport.aidSummaryDesc': 'Liste rapide avec temps de pause',
        'pdfExport.splits': 'Tableau Splits Détaillé',
        'pdfExport.splitsDesc': 'Allure, terrain, temps par kilomètre',
        'pdfExport.themeLabel': 'Thème:',
        'pdfExport.dark': 'Sombre',
        'pdfExport.light': 'Clair',
        'pdfExport.fontSizeLabel': 'Taille de police:',
        'pdfExport.fontNormal': 'Normal',
        'pdfExport.fontLarge': 'Grand',
        'pdfExport.download': 'Télécharger PDF',
        'pdfExport.hint': 'Profil: zones de montée (orange) + ravitos (vert).',
        
        // Crew Card export
        'crew.title': 'PLANNING ÉQUIPE',
        'crew.finish': 'ARRIVÉE',
        'crew.start': 'Départ',
        'crew.minBreak': 'min pause',
        'crew.toNext': 'au prochain',
        'crew.toFinish': 'à l\'arrivée',
        'crew.afterClimb': 'Après {0}m montée',
        'crew.afterDescent': 'Après {0}m descente',
        'crew.longLeg': 'Long tronçon {0}km',
        'crew.nightArrival': 'Arrivée nuit',
        'crew.night': 'Nuit',
        'crew.climbAhead': '{0}m montée à venir',
        'crew.descentAhead': '{0}m descente à venir',
        'crew.kmToNext': '{0}km au prochain',
        'crew.kmToFinish': '{0}km à l\'arrivée',
        'crew.kmPlusClimbToFinish': '{0}km + {1}m à l\'arrivée',
        'crew.kmDescentToFinish': '{0}km ↘️ à l\'arrivée',
        'crew.crewAllowed': 'Équipe',
        'crew.legendText': 'Équipe autorisée',
        'crew.shareTitle': 'Planning Équipe - {0}',
        'crew.shareText': "Voici mon planning de course pour {0}! Retrouve-moi à ces ravitaillements 👟\n\nPlanifie ta course avec https://gpxray.run",
        
        // Lockscreen Card export
        'lockscreen.subtitle': 'STRATÉGIE DE COURSE',
        'lockscreen.mGain': 'm D+',
        'lockscreen.mLoss': 'm D-',
        'lockscreen.cutoff': 'Barrière',
        'lockscreen.raceSchedule': 'PLANNING COURSE',
        'lockscreen.station': 'STATION',
        'lockscreen.race': 'TEMPS',
        'lockscreen.clock': 'HEURE',
        'lockscreen.finish': 'ARRIVÉE',
        
        // Share card preview
        'share.previewLabel': 'Sur ta carte de partage:',
        'share.rerollHint': 'Autre phrase',

        // Race browser
        'races.noResults': 'Aucune course trouvée correspondant à tes critères.',
        
        // Splits table
        'splits.surface': 'Surface',
        'splits.aid': 'Ravito',
        'splits.stop': 'Stop',
        'splits.fuel': 'Ravito',
        'splits.clock': 'Heure',
        'splits.min': 'min',
        
        // Leg summary
        'leg.title': 'Résumé Tronçons',
        'leg.leg': 'Tronçon',
        'leg.dist': 'Dist',
        'leg.gain': 'D+',
        'leg.loss': 'D-',
        'leg.time': 'Temps',
        'leg.arrival': 'Arrivée',
        'leg.toFinish': 'à l\'arrivée',
        
        // General
        'general.loading': 'Chargement...',
        'general.error': 'Erreur',
        'general.success': 'Succès',
        'general.close': 'Fermer',
        'general.save': 'Sauvegarder',
        'general.cancel': 'Annuler',
        'general.delete': 'Supprimer',
        
        // Story card witty statements
        'story.nextDay.1': 'À demain. ☕<br>Gardez le café chaud.',
        'story.nextDay.2': 'Ne m\'attendez pas. 😴<br>Ça va être long.',
        'story.nextDay.3': 'Je reviens... un jour.<br>Gardez-moi le petit-déj. 🥐',
        'story.nextDay.4': 'Parti courir. 🏃<br>Retour dans un jour ou deux.',
        'story.nextDay.5': 'Aventure nocturne. 🍾<br>Ouvrez le Champagne demain.',
        'story.nextDay.6': 'Bonne nuit. 💤<br>Je chasse le lever du soleil.',
        'story.nextDay.7': 'Longue journée en vue. ⛺<br>Faites le plein de patience.',
        'story.nextDay.8': 'Je cours jusqu\'à demain. 🌅<br>Littéralement.',
        'story.nextDay.9': 'D\'une aube à l\'autre. 🌓<br>Ça va être épique.',
        'story.nextDay.10': 'Bain de glace réservé. 🧊<br>Mes jambes en auront besoin.',
        'story.nextDay.11': 'Marathon? C\'est mignon. 🏃<br>Je vais plus loin.',
        'story.nextDay.12': 'Deux couchers de soleil. Une course. 🌅<br>C\'est parti.',
        'story.nextDay.13': 'Chaussettes de récup prêtes. 🧦<br>Mon moi de demain me remerciera.',
        'story.nextDay.14': 'Je cours dans la nuit. 🌌<br>Les étoiles me tiennent compagnie.',
        'story.nextDay.15': 'Mode longue distance. ✈️<br>À plus tard.',
        'story.earlyMorning.1': 'Fini avant votre réveil.<br>Ne vous inquiétez pas. 🌅',
        'story.earlyMorning.2': 'Retour avant le petit-déj. 🥣<br>Juste une petite sortie.',
        'story.earlyMorning.3': 'L\'oiseau matinal attrape la médaille. 🏅<br>Rendez-vous au lever du soleil.',
        'story.earlyMorning.4': 'Premières lueurs. 🌄<br>Retour avant le réveil.',
        'story.earlyMorning.5': 'Patrouille matinale. ⛰️<br>Le café peut attendre.',
        'story.earlyMorning.6': 'Plus rapide que le soleil. ☀️<br>Plus rapide que tout le monde.',
        'story.earlyMorning.7': 'Je cours avec les coqs. 🐓<br>Presque fini.',
        'story.earlyMorning.8': 'Digestif? Non.<br>Casquette trail. 🧢',
        'story.earlyMorning.9': 'Des étoiles au lever. 🌟<br>Quelle aventure.',
        'story.earlyMorning.10': 'Fini avant le réveil du monde. 🌅<br>Meilleure sensation.',
        'story.earlyMorning.11': 'Réveil à 4h. Ça vaut le coup. ⏰<br>Toujours.',
        'story.earlyMorning.12': 'Guerrier de l\'aube. ⚔️<br>Café à l\'arrivée.',
        'story.earlyMorning.13': 'Toujours plus rapide que les transports. 🚗<br>Et plus fun.',
        'story.earlyMorning.14': 'Arrivée au lever du soleil. 🌄<br>Prêt pour Instagram.',
        'story.earlyMorning.15': 'Avant qu\'on demande où je suis. 🤫<br>Déjà fini.',
        'story.morning.1': 'Gardez-moi du petit-déj. 🍳<br>J\'arrive en milieu de matinée.',
        'story.morning.2': 'Retour pour le brunch.<br>Faites-en un gros. 🥞',
        'story.morning.3': 'Une petite sortie matinale. 😅<br>Devrait finir vers 10h.',
        'story.morning.4': 'Juste un jogging matinal. 🏃<br>Avec quelques kms en plus.',
        'story.morning.5': 'Je mérite mon petit-déj. 🥓<br>À la dure.',
        'story.morning.6': 'Le café peut attendre. ☕<br>Les montagnes non.',
        'story.morning.7': 'Effort le matin. 🌄<br>Repos l\'après-midi.',
        'story.morning.8': 'Kilomètres matinaux faits. ✅<br>La journée commence à peine.',
        'story.morning.9': 'Les pancakes m\'appellent. 🥞<br>Je cours pour y répondre.',
        'story.morning.10': 'Équipe du matin. 🏔️<br>Heures sup\' optionnelles.',
        'story.morning.11': 'Second petit-déj m\'attend. 🧇<br>Mode Hobbit.',
        'story.morning.12': 'Motivation croissant. 🥐<br>Ça marche à chaque fois.',
        'story.morning.13': 'Kilomètres du matin. Vibes du matin. 🌅<br>Aucun regret.',
        'story.morning.14': 'Fini avant midi. 😎<br>Coup de pro.',
        'story.morning.15': 'Réservation brunch confirmée. 🍳<br>Je cours pour y arriver.',
        'story.midday.1': 'N\'attendez pas pour le déjeuner.<br>Je mangerai sur le parcours. 🥪',
        'story.midday.2': 'Retour pour le déjeuner.<br>Avec une ou deux histoires. 📖',
        'story.midday.3': 'Arrivée vers midi.<br>Gardez les sandwiches prêts. 🥪',
        'story.midday.4': 'Arrivée à midi pile. 🤠<br>Pizza après.',
        'story.midday.5': 'Le déjeuner se mérite. 🍔<br>Pas donné.',
        'story.midday.6': 'Soleil haut. Moi plus haut. 🌞<br>Presque arrivé.',
        'story.midday.7': 'Chargement de glucides bientôt. 🍝<br>Justifié.',
        'story.midday.8': 'Folie de midi. 😎<br>Chaque pas en vaut la peine.',
        'story.midday.9': 'Brunch? Déjeuner?<br>Les deux. 🍳',
        'story.midday.10': 'Soleil max. Effort max. ☀️<br>Récompense max.',
        'story.midday.11': 'Plan déjeuner: ÉNORME. 🍔<br>Je l\'ai mérité.',
        'story.midday.12': 'Les nouilles de midi m\'appellent. 🍜<br>Presque là.',
        'story.midday.13': 'Traces de bronzage en vue. ☀️<br>Edition trail.',
        'story.midday.14': 'Sieste programmée. 😴<br>Juste après.',
        'story.midday.15': 'Glace à l\'arrivée. 🍦<br>Obligatoire.',
        'story.afternoon.1': 'Retour pour l\'Aperol Spritz. 🍹<br>La première tournée est pour moi.',
        'story.afternoon.2': 'Arrivée l\'après-midi.<br>Puis direction canapé. 🛋️',
        'story.afternoon.3': 'Devrait finir avant le dîner.<br>Ne commencez pas sans moi. 🍽️',
        'story.afternoon.4': 'Sieste après l\'arrivée. 😴<br>Priorités.',
        'story.afternoon.5': 'Café et gâteau m\'attendent. ☕<br>Presque là.',
        'story.afternoon.6': 'L\'heure de la bière approche. 🍺<br>Pile dans les temps.',
        'story.afternoon.7': 'Netflix et récup. 📺<br>Le plan.',
        'story.afternoon.8': 'Canapé, j\'arrive. 🛋️<br>Tu m\'as manqué?',
        'story.afternoon.9': 'Fini pour l\'apéro. 🥂<br>Timing parfait.',
        'story.afternoon.10': 'Compte à rebours coucher de soleil. 🌅<br>Presque libre.',
        'story.afternoon.11': 'Douche d\'abord. Questions après. 🚿<br>S\'il vous plaît.',
        'story.afternoon.12': 'Happy hour commence à l\'arrivée. 🍺<br>En route.',
        'story.afternoon.13': 'Le canapé m\'appelle. 🛋️<br>Fort.',
        'story.afternoon.14': 'Chargement pâtes... ⏳<br>98% terminé.',
        'story.afternoon.15': 'Jambes: fatiguées. Esprit: intact. 💪<br>Presque là.',
        'story.evening.1': 'Je serai là pour le dîner.<br>Peut-être. 🤷',
        'story.evening.2': 'Arrivée ce soir.<br>Gardez-moi une assiette. 🍝',
        'story.evening.3': 'Ne m\'attendez pas pour le dîner.<br>Mais gardez le dessert. 🍰',
        'story.evening.4': 'Arrivée à l\'heure dorée. 🌅<br>Parfait pour les photos.',
        'story.evening.5': 'Dîner peut-être tard. 🍕<br>Commandez sans moi.',
        'story.evening.6': 'Arrivée au coucher du soleil. 🌇<br>Chaque ampoule en vaut la peine.',
        'story.evening.7': 'À la maison pour le film. 🎬<br>Probablement.',
        'story.evening.8': 'Tard mais pas trop. ⏰<br>Parfait.',
        'story.evening.9': 'Triomphe au crépuscule. 🌆<br>Journée bien remplie.',
        'story.evening.10': 'Réservation resto? 🍷<br>Ouvrez le vin à 21h.',
        'story.evening.11': 'Dîner? JE SUIS le dîner. 🥵<br>Affamé.',
        'story.evening.12': 'Netflix et s\'effondrer. 📺<br>Soirée parfaite.',
        'story.evening.13': 'Pizza commandée au km 50. 🍕<br>Le timing est tout.',
        'story.evening.14': 'Frontale? Presque nécessaire. 🔦<br>C\'était juste.',
        'story.evening.15': 'Arrivée dorée. Souvenirs dorés. 🏆<br>Ça valait le coup.',
        'story.night.1': 'Retour à minuit.<br>Mettez le Prosecco au frais. 🥂',
        'story.night.2': 'Arrivée tardive. 🌙<br>Laissez les lumières allumées.',
        'story.night.3': 'Ne m\'attendez pas. 😴<br>Mais laissez-moi un snack.',
        'story.night.4': 'Retour avant l\'heure du coucher.<br>J\'espère. 🤞',
        'story.night.5': 'Héros de la frontale. 🔦<br>Équipe de nuit en course.',
        'story.night.6': 'Je chasse les étoiles ce soir. ⭐<br>À la maison avant l\'aube.',
        'story.night.7': 'Arrivée au clair de lune. 🌙<br>La meilleure façon.',
        'story.night.8': 'Bottes de récup m\'attendent. 🦶<br>À plus tard.',
        'story.night.9': 'Le sommeil est surcoté. 😴<br>Les médailles non.',
        'story.night.10': 'Mode hibou. 🦉<br>Édition trail.',
        'story.night.11': 'Guerrier de minuit. ⚔️<br>Toujours en route.',
        'story.night.12': 'Qui a besoin de dormir? 😴<br>Pas moi.',
        'story.night.13': 'Les étoiles sont plus belles là-haut. ⭐<br>Fais-moi confiance.',
        'story.night.14': 'Night Moves. 🌙<br>Bob Seger serait fier.',
        'story.night.15': 'L\'obscurité n\'est qu\'un état d\'esprit. 🔦<br>Le mien est lumineux.',
        'story.default': 'Parti courir. 🏃<br>Retour quand c\'est fini.',
        'story.myStrategy': 'Mon Plan de Course',
        'story.createdBy': 'Planifie ta course avec',
        'story.start': 'Départ',
        'story.target': 'Objectif'
    }
};

// Current language (default: English, or from localStorage)
let currentLang = localStorage.getItem('gpxray-lang') || 'en';

// Translation function
function t(key, params = {}) {
    let text = TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS.en[key] || key;
    
    // Replace {placeholder} with values
    Object.keys(params).forEach(k => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), params[k]);
    });
    
    return text;
}

// Translate all elements with data-i18n attribute
function translatePage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        const translation = t(key);
        
        // Check if we need to set innerHTML (for strings with <strong>, etc.)
        if (translation.includes('<')) {
            el.innerHTML = translation;
        } else {
            el.textContent = translation;
        }
    });
    
    // Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    
    // Translate titles
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        el.title = t(el.dataset.i18nTitle);
    });
    
    // Update html lang attribute
    document.documentElement.lang = currentLang;
}

// Set language and re-translate
function setLanguage(lang) {
    if (!TRANSLATIONS[lang]) return;
    
    currentLang = lang;
    localStorage.setItem('gpxray-lang', lang);
    translatePage();
    
    // Update language toggle buttons if they exist
    const langToggle = document.getElementById('langToggle');
    if (langToggle) {
        langToggle.querySelectorAll('.lang-btn').forEach(btn => {
            if (btn.dataset.lang === lang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
    // Re-render dynamic content if GPX is loaded
    if (typeof gpxData !== 'undefined' && gpxData) {
        if (typeof updateHeroSection === 'function') {
            updateHeroSection();
        }
        if (typeof updateCourseShape === 'function') {
            updateCourseShape();
        }
        if (typeof generateSplitsTable === 'function') {
            generateSplitsTable();
        }
        if (typeof updateMapLegend === 'function') {
            const surfaceToggle = document.getElementById('surfaceColors');
            updateMapLegend(surfaceToggle ? surfaceToggle.checked : false);
        }
        if (typeof displaySurfaceStats === 'function') {
            displaySurfaceStats();
        }
        if (typeof updatePaceInfoContent === 'function') {
            updatePaceInfoContent();
        }
        if (typeof displayElevationChart === 'function') {
            displayElevationChart();
        }
        if (typeof displayGradientChart === 'function') {
            displayGradientChart();
        }
    }
}

// Get current language
function getLang() {
    return currentLang;
}

// Initialize language on page load
function initI18n() {
    // Check URL param first (for sharing links)
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    if (urlLang && TRANSLATIONS[urlLang]) {
        currentLang = urlLang;
        localStorage.setItem('gpxray-lang', currentLang);
    }
    
    // Try browser language as fallback
    if (!localStorage.getItem('gpxray-lang')) {
        const browserLang = navigator.language.split('-')[0];
        if (TRANSLATIONS[browserLang]) {
            currentLang = browserLang;
        }
    }
    
    // Translate the page
    translatePage();
}
