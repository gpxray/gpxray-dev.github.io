// GPXray Internationalization (i18n)
// Supported languages: English (en), German (de)

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
        'hero.hint': 'Based on default paces',
        'hero.customize': 'Customize strategy ↓',
        'hero.clickCalculate': '▼ Calculate below',
        
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
        'lockscreenExport.hint': '💡 Large font = fewer stations fit. Use Small for 8+ AID stations.',
        'lockscreenExport.export': 'Create Card',
        
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
        'hero.hint': 'Basierend auf Standard-Paces',
        'hero.customize': 'Strategie anpassen ↓',
        'hero.clickCalculate': '▼ Unten berechnen',
        
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
        'lockscreenExport.hint': '💡 Große Schrift = weniger Stationen passen. Nutze Klein für 8+ Stationen.',
        'lockscreenExport.export': 'Karte erstellen',
        
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
