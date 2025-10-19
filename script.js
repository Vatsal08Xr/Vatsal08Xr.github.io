// Complete script.js with exact version matching
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
        const amRegex = /music\.apple\.com\/(?:[a-z]{2}\/)?(?:album|song)\/[^?]+\/(\d+)/;
        
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
            const amRegex = /music\.apple\.com\/(?:[a-z]{2}\/)?(?:album|song)\/[^?]+\/(\d+)/;
            
            const spotifyMatch = input.match(spotifyRegex);
            const ytMatch = input.match(ytRegex);
            const amMatch = input.match(amRegex);
            
            if (spotifyMatch) {
                await convertFromSpotify(spotifyMatch[1]);
            } else if (ytMatch) {
                await convertFromYouTube(ytMatch[1]);
            } else if (amMatch) {
                await convertFromAppleMusic(amMatch[1], input);
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
        
        // Search other platforms
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
    
    // Simple artist extraction function
    function extractArtistFromTitle(title) {
        // Remove common YouTube suffixes
        let cleanTitle = title
            .replace(/\s*[-–—]\s*(?:topic|lyrics?|video|audio|official|music|mv|hd|4k|live|cover).*$/i, '')
            .replace(/\s*\([^)]*(?:official|lyrics?|video|audio|music|mv|hd|4k|live|cover)[^)]*\)/gi, '')
            .trim();
        
        // Simple pattern: "Artist - Title"
        const pattern = /^([^-–—]+?)\s*[-–—]\s*([^-–—]+)$/;
        const match = cleanTitle.match(pattern);
        
        if (match) {
            const part1 = match[1].trim();
            const part2 = match[2].trim();
            return { cleanTitle: part2, artist: part1 };
        }
        
        return { cleanTitle, artist: null };
    }
    
    async function convertFromAppleMusic(trackId, originalUrl) {
        statusDiv.innerHTML = `${platformLogos.apple} Fetching Apple Music track...`;
        
        const response = await fetch(`${proxyUrl}/apple-track/${trackId}`);
        if (!response.ok) {
            throw new Error('Apple Music track not found');
        }
        
        const track = await response.json();
        const title = track.name;
        const artist = track.artist;
        
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
        if (!artist) {
            console.log('No artist provided for Apple Music search');
            return null;
        }

        // Use exact title and artist for search
        const query = `${title} ${artist}`;
        console.log(`Searching Apple Music: "${query}"`);

        try {
            const itunesResponse = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=10&media=music`);
            if (itunesResponse.ok) {
                const data = await itunesResponse.json();
                if (data.results && data.results.length > 0) {
                    // Find the best match using exact title matching
                    const bestMatch = findExactAppleMusicMatch(data.results, title, artist);
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
            console.log('Apple Music search failed');
        }

        console.log('❌ No good Apple Music match found');
        return null;
    }

    // Exact matching function with improved version detection
    function findExactAppleMusicMatch(results, targetTitle, targetArtist) {
        console.log(`Looking for exact match: "${targetTitle}" by "${targetArtist}"`);
        
        const normalize = (str) => str.toLowerCase().trim();
        const targetTitleNorm = normalize(targetTitle);
        const targetArtistNorm = normalize(targetArtist);
        
        // Words that indicate different versions (should be avoided)
        const versionIndicators = [
            'remix', 'remaster', 'acoustic', 'live', 'demo', 'instrumental',
            'radio edit', 'extended', 'orchestral', 'cover', 'version',
            'karaoke', 'tribute', 'unplugged', 'stripped', 'deluxe'
        ];
        
        const scoredResults = results.map(track => {
            const trackTitle = track.trackName;
            const trackArtist = track.artistName;
            const trackTitleNorm = normalize(trackTitle);
            const trackArtistNorm = normalize(trackArtist);
            
            let score = 0;
            
            // CRITICAL: Exact title match gets highest priority
            if (trackTitleNorm === targetTitleNorm) {
                score += 100; // Perfect exact match
            } else {
                // Check if title contains version indicators
                const hasVersionIndicator = versionIndicators.some(indicator => 
                    trackTitleNorm.includes(indicator) && !targetTitleNorm.includes(indicator)
                );
                
                if (hasVersionIndicator) {
                    score -= 50; // Heavy penalty for different versions
                    console.log(`  "${trackTitle}" - Version mismatch detected`);
                }
                
                // Check if target title is contained in track title
                if (trackTitleNorm.includes(targetTitleNorm)) {
                    score += 30; // Partial match (but much less than exact)
                } else if (targetTitleNorm.includes(trackTitleNorm)) {
                    score += 25;
                } else {
                    score -= 40; // No title match
                }
            }
            
            // Exact artist match is also very important
            if (trackArtistNorm === targetArtistNorm) {
                score += 50; // Perfect artist match
            } else {
                // Check for partial artist match
                if (trackArtistNorm.includes(targetArtistNorm) || targetArtistNorm.includes(trackArtistNorm)) {
                    score += 20; // Partial artist match
                } else {
                    score -= 50; // Wrong artist
                }
            }
            
            // Bonus: Prefer tracks without extra parenthetical info when target doesn't have it
            const hasParentheses = /\([^)]+\)/.test(trackTitle);
            const targetHasParentheses = /\([^)]+\)/.test(targetTitle);
            if (hasParentheses && !targetHasParentheses) {
                score -= 10; // Small penalty for extra info
            }
            
            console.log(`  "${trackTitle}" by "${trackArtist}" - score: ${score}`);
            
            return { track, score };
        });
        
        // Sort by score (highest first)
        scoredResults.sort((a, b) => b.score - a.score);
        
        const bestMatch = scoredResults[0];
        
        // Only return if we have a good match (raised threshold)
        if (bestMatch && bestMatch.score >= 70) {
            console.log(`✓ Best match score: ${bestMatch.score}`);
            return bestMatch.track;
        }
        
        console.log('✗ No good match found (score too low)');
        return null;
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
            resultDiv.innerHTML = '<p>❌ No alternative platforms found.</p>';
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
