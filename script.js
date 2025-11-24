document.addEventListener('DOMContentLoaded', function() {
    console.log('Script loaded successfully!');
    
    // Get all elements
    const inputEl = document.getElementById('spotifyLink');
    const convertBtn = document.getElementById('convertBtn');
    const statusDiv = document.getElementById('status');
    const resultDiv = document.getElementById('result');
    
    // Tab functionality
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Add click listeners to tabs
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remove active from all
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active to clicked
            this.classList.add('active');
            document.getElementById(tabId + '-tab').classList.add('active');
            
            // Clear results when switching to song tab
            if (tabId === 'song') {
                clearResults();
            }
        });
    });
    
    // Newsletter button
    const newsletterBtn = document.querySelector('.newsletter-button');
    if (newsletterBtn) {
        newsletterBtn.addEventListener('click', function() {
            const emailInput = document.querySelector('.newsletter-input');
            if (emailInput.value && emailInput.value.includes('@')) {
                alert('Thanks! We\'ll notify you when playlist conversion launches.');
                emailInput.value = '';
            } else {
                alert('Please enter a valid email address.');
            }
        });
    }
    
    // Convert button click handler
    convertBtn.addEventListener('click', handleConvertClick);
    
    // Enter key support
    inputEl.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleConvertClick();
        }
    });
    
    // Update heading based on input
    inputEl.addEventListener('input', function() {
        const value = inputEl.value.trim();
        const heading = document.getElementById('heading');
        
        if (!value) {
            heading.innerHTML = 'Spoti2YTM';
            return;
        }
        
        const spotifyRegex = /https?:\/\/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/;
        const ytRegex = /(?:https?:\/\/)?(?:music\.)?youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/;
        const amRegex = /music\.apple\.com\/(?:[a-z]{2}\/)?(?:album|song)\/[^?/]+(?:\/[^?]*)?[?&]i=(\d+)|music\.apple\.com\/(?:[a-z]{2}\/)?(?:album|song)\/[^?/]+\/(\d+)/;
        
        if (spotifyRegex.test(value)) {
            heading.innerHTML = 'Spotify → <span class="ytm">YouTube Music</span> or <span class="am">Apple Music</span>';
        } else if (ytRegex.test(value)) {
            heading.innerHTML = '<span class="ytm">YouTube Music</span> → Spotify or <span class="am">Apple Music</span>';
        } else if (amRegex.test(value)) {
            heading.innerHTML = '<span class="am">Apple Music</span> → Spotify or <span class="ytm">YouTube Music</span>';
        } else {
            heading.innerHTML = 'Spoti2YTM';
        }
    });
    
    function clearResults() {
        statusDiv.textContent = '';
        resultDiv.innerHTML = '';
    }
    
    async function handleConvertClick() {
        console.log('Convert button clicked!');
        
        const input = inputEl.value.trim();
        clearResults();
        
        // Show loading state
        const buttonText = convertBtn.querySelector('.button-text');
        const buttonLoader = convertBtn.querySelector('.button-loader');
        buttonText.style.display = 'none';
        buttonLoader.style.display = 'inline-block';
        convertBtn.disabled = true;
        
        if (!input) {
            statusDiv.textContent = '❌ Please enter a music link.';
            resetButton();
            return;
        }
        
        try {
            statusDiv.innerHTML = '🔍 Processing your link...';
            
            const spotifyRegex = /https?:\/\/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/;
            const ytRegex = /(?:https?:\/\/)?(?:music\.)?youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/;
            const amRegex = /music\.apple\.com\/(?:[a-z]{2}\/)?(?:album|song)\/[^?/]+(?:\/[^?]*)?[?&]i=(\d+)|music\.apple\.com\/(?:[a-z]{2}\/)?(?:album|song)\/[^?/]+\/(\d+)/;
            
            const spotifyMatch = input.match(spotifyRegex);
            const ytMatch = input.match(ytRegex);
            const amMatch = input.match(amRegex);
            
            if (spotifyMatch) {
                await convertFromSpotify(spotifyMatch[1]);
            } else if (ytMatch) {
                await convertFromYouTube(ytMatch[1]);
            } else if (amMatch) {
                // amMatch[1] is from ?i= parameter, amMatch[2] is from /song/title/id format
                const trackId = amMatch[1] || amMatch[2];
                await convertFromAppleMusic(trackId, input);
            } else {
                throw new Error('Unsupported link. Use Spotify, YouTube Music, or Apple Music.');
            }
        } catch (err) {
            console.error('Error:', err);
            statusDiv.textContent = '❌ ' + (err.message || 'Conversion failed. Please try again.');
        } finally {
            resetButton();
        }
        
        function resetButton() {
            buttonText.style.display = 'inline-block';
            buttonLoader.style.display = 'none';
            convertBtn.disabled = false;
        }
    }
    
    const proxyUrl = 'https://spotify-proxy-1.onrender.com';
    
    // Platform logo SVGs
    const platformLogos = {
        spotify: `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-2-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
        `,
        youtube: `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
            </svg>
        `,
        apple: `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
        `
    };
    
    async function convertFromSpotify(trackId) {
        statusDiv.innerHTML = `${platformLogos.spotify} Fetching Spotify track...`;
        
        const response = await fetch(`${proxyUrl}/track/${trackId}`);
        if (!response.ok) {
            throw new Error('Spotify track not found');
        }
        
        const track = await response.json();
        const title = track.name;
        const artist = track.artists[0].name;
        
        statusDiv.innerHTML = `${platformLogos.spotify} Found: "${title}" by ${artist}`;
        
        // Search other platforms - preserve exact version
        const [youtubeResult, appleResult] = await Promise.allSettled([
            searchYouTubeMusic(title, artist),
            searchAppleMusic(title, artist)
        ]);
        
        showResults(title, artist, {
            youtube: youtubeResult.status === 'fulfilled' ? youtubeResult.value : null,
            apple: appleResult.status === 'fulfilled' ? appleResult.value : null,
            originalPlatform: 'spotify'
        });
    }
    
    async function convertFromYouTube(videoId) {
        statusDiv.innerHTML = `${platformLogos.youtube} Fetching YouTube video...`;
        
        const response = await fetch(`${proxyUrl}/get-video-title?v=${videoId}`);
        if (!response.ok) {
            throw new Error('YouTube video not found');
        }
        
        const data = await response.json();
        const title = data.title;
        
        // Extract artist from YouTube title
        const { cleanTitle, artist } = extractArtistFromTitle(title);
        
        statusDiv.innerHTML = `${platformLogos.youtube} Found: "${cleanTitle}"${artist ? ` by ${artist}` : ''}`;
        
        // Search other platforms with exact title
        const searchQuery = artist ? `${cleanTitle} ${artist}` : cleanTitle;
        
        const [spotifyResult, appleResult] = await Promise.allSettled([
            searchSpotify(searchQuery),
            searchAppleMusic(cleanTitle, artist || '')
        ]);

        const spotifyData = spotifyResult.status === 'fulfilled' ? spotifyResult.value : null;
        const finalArtist = artist || (spotifyData?.artist || 'Unknown Artist');
        
        showResults(cleanTitle, finalArtist, {
            spotify: spotifyData,
            apple: appleResult.status === 'fulfilled' ? appleResult.value : null,
            originalPlatform: 'youtube'
        });
    }
    
    // Improved artist extraction function
    function extractArtistFromTitle(title) {
        // Remove common YouTube suffixes
        let cleanTitle = title
            .replace(/\s*[-–—]\s*(?:topic|lyrics?|video|audio|official|music|mv|hd|4k|live|cover).*$/i, '')
            .replace(/\s*\([^)]*(?:official|lyrics?|video|audio|music|mv|hd|4k|live|cover)[^)]*\)/gi, '')
            .trim();
        
        // Multiple patterns for artist extraction
        const patterns = [
            /^([^-–—]+?)\s*[-–—]\s*([^-–—]+)$/, // "Artist - Title"
            /^(.+?)\s*:\s*(.+)$/, // "Artist: Title"
            /^(.+?)\s*\/\s*(.+)$/, // "Artist / Title"
            /^(.+?)\s*"\s*(.+)"$/, // 'Artist "Title"'
        ];
        
        for (const pattern of patterns) {
            const match = cleanTitle.match(pattern);
            if (match) {
                const part1 = match[1].trim();
                const part2 = match[2].trim();
                return { cleanTitle: part2, artist: part1 };
            }
        }
        
        return { cleanTitle, artist: null };
    }
    
    async function convertFromAppleMusic(trackId, originalUrl) {
        statusDiv.innerHTML = `${platformLogos.apple} Fetching Apple Music track...`;
        
        try {
            console.log('Fetching Apple Music track ID:', trackId);
            
            // Try multiple country codes
            const countries = ['us', 'gb', 'ca', 'au', 'de', 'fr', 'jp'];
            let track = null;
            
            for (const country of countries) {
                try {
                    const itunesResponse = await fetch(`https://itunes.apple.com/lookup?id=${trackId}&entity=song&country=${country}`);
                    
                    if (itunesResponse.ok) {
                        const itunesData = await itunesResponse.json();
                        console.log(`iTunes API response for ${country}:`, itunesData);
                        
                        if (itunesData.results && itunesData.results.length > 0) {
                            // Find the track (not the collection/album)
                            track = itunesData.results.find(item => 
                                item.wrapperType === 'track' && item.kind === 'song'
                            );
                            
                            if (!track && itunesData.results.length > 0) {
                                // Fallback to first result if no track found
                                track = itunesData.results.find(item => item.trackName) || itunesData.results[0];
                            }
                            
                            if (track && track.trackName) {
                                console.log('Found track:', track);
                                break;
                            }
                        }
                    }
                } catch (err) {
                    console.log(`Failed to fetch from ${country}:`, err);
                    continue;
                }
            }
            
            if (!track || !track.trackName) {
                throw new Error('Apple Music track not found or unavailable in supported regions');
            }
            
            const title = track.trackName;
            const artist = track.artistName;
            
            statusDiv.innerHTML = `${platformLogos.apple} Found: "${title}" by ${artist}`;
            
            // Search other platforms
            const [spotifyResult, youtubeResult] = await Promise.allSettled([
                searchSpotify(`${title} ${artist}`),
                searchYouTubeMusic(title, artist)
            ]);
            
            showResults(title, artist, {
                spotify: spotifyResult.status === 'fulfilled' ? spotifyResult.value : null,
                youtube: youtubeResult.status === 'fulfilled' ? youtubeResult.value : null,
                originalPlatform: 'apple'
            });
        } catch (error) {
            console.error('Apple Music error:', error);
            throw new Error('Apple Music track not found or unavailable');
        }
    }
    
    async function searchYouTubeMusic(title, artist) {
        // Use exact title and artist for search
        let query;
        if (artist) {
            query = `${title} ${artist}`;
        } else {
            query = title;
        }
        
        const response = await fetch(`${proxyUrl}/search-youtube?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
            throw new Error('YouTube Music not found');
        }
        
        const data = await response.json();
        return {
            url: `https://music.youtube.com/watch?v=${data.videoId}`,
            title: data.title || title,
            artist: data.artist || artist
        };
    }
    
    async function searchSpotify(query) {
        const response = await fetch(`${proxyUrl}/search-spotify?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
            throw new Error('Spotify not found');
        }
        
        return await response.json();
    }
    
    async function searchAppleMusic(title, artist) {
        console.log(`🔍 Searching Apple Music: "${title}" by "${artist || 'Unknown Artist'}"`);
        
        // Try multiple search strategies
        const searchStrategies = [];
        
        // Strategy 1: Exact title + artist
        if (artist) {
            searchStrategies.push(`${title} ${artist}`);
        }
        
        // Strategy 2: Title only (remove featured artists)
        const mainArtist = artist ? artist.split(/[,&]|feat\.?|ft\.?/)[0].trim() : null;
        if (mainArtist && mainArtist !== artist) {
            searchStrategies.push(`${title} ${mainArtist}`);
        }
        
        // Strategy 3: Title only
        searchStrategies.push(title);
        
        // Strategy 4: Remove common suffixes from title
        const cleanTitle = title.replace(/\([^)]*\)/g, '').replace(/\s*[-–—].*$/, '').trim();
        if (cleanTitle !== title) {
            if (artist) searchStrategies.push(`${cleanTitle} ${artist}`);
            if (mainArtist) searchStrategies.push(`${cleanTitle} ${mainArtist}`);
            searchStrategies.push(cleanTitle);
        }
        
        console.log('Search strategies:', searchStrategies);
        
        for (const searchQuery of searchStrategies) {
            console.log(`Trying search: "${searchQuery}"`);
            
            try {
                const itunesResponse = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&entity=song&limit=10&media=music`);
                if (itunesResponse.ok) {
                    const data = await itunesResponse.json();
                    if (data.results && data.results.length > 0) {
                        const bestMatch = findBestAppleMusicMatch(data.results, title, artist);
                        if (bestMatch) {
                            console.log(`✓ Apple Music match found: "${bestMatch.trackName}" by ${bestMatch.artistName}`);
                            return {
                                url: bestMatch.trackViewUrl,
                                title: bestMatch.trackName,
                                artist: bestMatch.artistName
                            };
                        }
                    }
                }
            } catch (error) {
                console.log(`Search failed for "${searchQuery}":`, error);
            }
        }
        
        console.log('❌ No Apple Music match found after all strategies');
        return null;
    }

    // Improved matching function with better scoring
    function findBestAppleMusicMatch(results, targetTitle, targetArtist) {
        console.log(`Looking for best match: "${targetTitle}" by "${targetArtist || 'Unknown Artist'}"`);
        
        const scoredResults = results.map(track => {
            const trackTitle = track.trackName;
            const trackArtist = track.artistName;
            
            let score = 0;
            
            // Title matching (most important)
            const trackTitleLower = trackTitle.toLowerCase();
            const targetTitleLower = targetTitle.toLowerCase();
            
            if (trackTitleLower === targetTitleLower) {
                score += 40; // Perfect title match
            } else if (trackTitleLower.includes(targetTitleLower) || targetTitleLower.includes(trackTitleLower)) {
                score += 25; // Partial title match
            } else {
                // Calculate title similarity
                const titleSimilarity = calculateSimilarity(trackTitleLower, targetTitleLower);
                score += titleSimilarity * 20;
            }
            
            // Artist matching (important but less than title)
            if (targetArtist) {
                const trackArtistLower = trackArtist.toLowerCase();
                const targetArtistLower = targetArtist.toLowerCase();
                
                if (trackArtistLower === targetArtistLower) {
                    score += 30; // Perfect artist match
                } else if (trackArtistLower.includes(targetArtistLower) || targetArtistLower.includes(trackArtistLower)) {
                    score += 20; // Partial artist match
                } else {
                    // Calculate artist similarity
                    const artistSimilarity = calculateSimilarity(trackArtistLower, targetArtistLower);
                    score += artistSimilarity * 15;
                }
            } else {
                // No artist provided, give baseline score
                score += 10;
            }
            
            // Bonus for exact matches in key fields
            if (trackTitleLower === targetTitleLower && targetArtist && trackArtist.toLowerCase() === targetArtist.toLowerCase()) {
                score += 20; // Bonus for perfect match
            }
            
            console.log(`  "${trackTitle}" by "${trackArtist}" - score: ${score.toFixed(1)}`);
            
            return { track, score };
        });
        
        // Sort by score and return the best match
        scoredResults.sort((a, b) => b.score - a.score);
        
        const bestMatch = scoredResults[0];
        
        // Lower threshold to catch more matches
        if (bestMatch && bestMatch.score >= 15) {
            console.log(`✓ Best match score: ${bestMatch.score.toFixed(1)}`);
            return bestMatch.track;
        }
        
        console.log('✗ No good match found');
        return null;
    }
    
    // Simple string similarity function
    function calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        // Check if one string contains the other
        if (longer.includes(shorter)) return 0.8;
        
        // Simple character-based similarity
        let matches = 0;
        for (let i = 0; i < Math.min(shorter.length, 10); i++) {
            if (longer.includes(shorter[i])) matches++;
        }
        
        return matches / Math.min(shorter.length, 10);
    }
    
    function showResults(title, artist, platforms) {
        const links = [];
        
        if (platforms.originalPlatform !== 'spotify' && platforms.spotify) {
            links.push({
                url: platforms.spotify.url,
                text: `${platformLogos.spotify} Open in Spotify`,
                platform: 'spotify',
                songInfo: `${platforms.spotify.name || title} - ${platforms.spotify.artist || artist}`
            });
        }
        
        if (platforms.originalPlatform !== 'youtube' && platforms.youtube) {
            links.push({
                url: platforms.youtube.url,
                text: `${platformLogos.youtube} Open in YouTube Music`,
                platform: 'youtube',
                songInfo: `${platforms.youtube.title || title} - ${platforms.youtube.artist || artist}`
            });
        }
        
        if (platforms.originalPlatform !== 'apple' && platforms.apple) {
            links.push({
                url: platforms.apple.url,
                text: `${platformLogos.apple} Open in Apple Music`,
                platform: 'apple',
                songInfo: `${platforms.apple.title || title} - ${platforms.apple.artist || artist}`
            });
        }
        
        if (links.length === 0) {
            resultDiv.innerHTML = `
                <p>❌ No alternative platforms found for "${title}" by ${artist}.</p>
                <p style="margin-top: 10px; font-size: 14px; color: var(--text-secondary);">
                    Try searching manually on the platforms.
                </p>
            `;
            return;
        }
        
        const linksHTML = links.map(link => `
            <div class="platform-link">
                <a href="${link.url}" target="_blank" class="${link.platform}-link">${link.text}</a>
                <div class="song-info">${link.songInfo}</div>
            </div>
        `).join('');
        
        resultDiv.innerHTML = `
            <p>✅ Converted "${title}" by ${artist} to:</p>
            <div class="links">${linksHTML}</div>
        `;
    }
});
