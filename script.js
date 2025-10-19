async function searchAppleMusic(title, artist) {
    if (!artist) {
        console.log('No artist provided for Apple Music search');
        return null;
    }

    // Clean and prepare search terms
    const cleanTitle = title.toLowerCase().trim();
    const cleanArtist = artist.toLowerCase().trim();
    
    console.log(`Searching Apple Music: "${cleanTitle}" by "${cleanArtist}"`);

    // Strategy 1: Exact match with both title and artist
    const exactQuery = `${cleanTitle} ${cleanArtist}`;
    console.log(`Trying exact match: "${exactQuery}"`);
    
    try {
        const response = await fetch(`${proxyUrl}/search-apple?q=${encodeURIComponent(exactQuery)}`);
        if (response.ok) {
            const data = await response.json();
            if (data.url && data.name && data.artist) {
                const foundArtist = data.artist.toLowerCase();
                if (foundArtist.includes(cleanArtist) || cleanArtist.includes(foundArtist)) {
                    console.log(`✓ Exact match found: "${data.name}" by ${data.artist}`);
                    return {
                        url: data.url,
                        title: data.name,
                        artist: data.artist
                    };
                }
            }
        }
    } catch (error) {
        console.log('Exact match search failed');
    }

    // Strategy 2: Use iTunes API with strict filtering
    try {
        const itunesResponse = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(exactQuery)}&entity=song&limit=10&media=music`);
        if (itunesResponse.ok) {
            const data = await itunesResponse.json();
            if (data.results && data.results.length > 0) {
                // Find the best match with strict artist checking
                const bestMatch = findStrictAppleMusicMatch(data.results, cleanTitle, cleanArtist);
                if (bestMatch) {
                    console.log(`✓ iTunes match found: "${bestMatch.trackName}" by ${bestMatch.artistName}`);
                    return {
                        url: bestMatch.trackViewUrl,
                        title: bestMatch.trackName,
                        artist: bestMatch.artistName
                    };
                }
            }
        }
    } catch (error) {
        console.log('iTunes API search failed');
    }

    // Strategy 3: Try with just the main artist name (handle featured artists)
    const mainArtist = cleanArtist.split(/[,&]|feat\.?|ft\.?/)[0].trim();
    if (mainArtist !== cleanArtist) {
        console.log(`Trying with main artist only: "${mainArtist}"`);
        const mainArtistQuery = `${cleanTitle} ${mainArtist}`;
        
        try {
            const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(mainArtistQuery)}&entity=song&limit=5&media=music`);
            if (response.ok) {
                const data = await response.json();
                if (data.results && data.results.length > 0) {
                    const bestMatch = findStrictAppleMusicMatch(data.results, cleanTitle, mainArtist);
                    if (bestMatch) {
                        console.log(`✓ Main artist match found: "${bestMatch.trackName}" by ${bestMatch.artistName}`);
                        return {
                            url: bestMatch.trackViewUrl,
                            title: bestMatch.trackName,
                            artist: bestMatch.artistName
                        };
                    }
                }
            }
        } catch (error) {
            console.log('Main artist search failed');
        }
    }

    console.log('❌ No good Apple Music match found');
    return null;
}

// Strict matching function for Apple Music
function findStrictAppleMusicMatch(results, targetTitle, targetArtist) {
    console.log(`Looking for strict match: "${targetTitle}" by "${targetArtist}"`);
    
    const scoredResults = results.map(track => {
        const trackTitle = track.trackName.toLowerCase().trim();
        const trackArtist = track.artistName.toLowerCase().trim();
        
        let score = 0;
        
        // Title matching (most important)
        if (trackTitle === targetTitle) {
            score += 20; // Exact title match
        } else if (trackTitle.includes(targetTitle) || targetTitle.includes(trackTitle)) {
            score += 10; // Partial title match
        } else {
            // Title doesn't match at all - heavy penalty
            score -= 20;
        }
        
        // Artist matching (very important)
        if (trackArtist === targetArtist) {
            score += 20; // Exact artist match
        } else if (trackArtist.includes(targetArtist) || targetArtist.includes(trackArtist)) {
            score += 15; // Partial artist match
        } else {
            // Check if it's the same artist with different formatting
            const normalizeName = (name) => name.replace(/[^a-z0-9]/g, '');
            if (normalizeName(trackArtist) === normalizeName(targetArtist)) {
                score += 18; // Same artist, different formatting
            } else {
                // Artist doesn't match - heavy penalty
                score -= 25;
            }
        }
        
        // Popularity boost (minor factor)
        if (track.trackNumber === 1) {
            score += 2; // Likely a single or popular track
        }
        
        console.log(`  "${trackTitle}" by "${trackArtist}" - score: ${score}`);
        
        return { track, score };
    });
    
    // Filter out negative scores and sort
    const validResults = scoredResults.filter(item => item.score > 0);
    validResults.sort((a, b) => b.score - a.score);
    
    const bestMatch = validResults[0];
    
    if (bestMatch && bestMatch.score >= 15) { // Minimum threshold
        console.log(`✓ Best match score: ${bestMatch.score}`);
        return bestMatch.track;
    }
    
    console.log('✗ No match met minimum score threshold');
    return null;
}
