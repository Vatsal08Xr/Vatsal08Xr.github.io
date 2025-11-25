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
        
        // Search other platforms
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
    
    function extractArtistFromTitle(title) {
        console.log('YouTube Title:', title);
        
        // Pattern for Japanese titles: "Artist - Title" or "Artist ― Title"
        const patterns = [
            /^([^-–—―]+?)\s*[-–—]\s*([^-–—―]+)/, // Standard dash
            /^([^-–—―]+?)\s*[―]\s*([^-–—―]+)/, // Japanese long dash
            /^([^-–—―]+?)\s*[～]\s*([^-–—―]+)/, // Japanese wave dash
        ];
        
        for (const pattern of patterns) {
            const match = title.match(pattern);
            if (match) {
                return {
                    cleanTitle: match[2].trim(),
                    artist: match[1].trim()
                };
            }
        }
        
        return { cleanTitle: title, artist: null };
    }
    
    async function convertFromAppleMusic(trackId, originalUrl) {
        statusDiv.innerHTML = `${platformLogos.apple} Fetching Apple Music track...`;
        
        try {
            // Try multiple regions including Japan
            const regions = ['us', 'gb', 'jp'];
            let track = null;
            
            for (const region of regions) {
                try {
                    const response = await fetch(`https://itunes.apple.com/lookup?id=${trackId}&entity=song&country=${region}`);
                    
                    if (response.ok) {
                        const data = await response.json();
                        
                        if (data.results && data.results.length > 0) {
                            track = data.results[0];
                            break;
                        }
                    }
                } catch (error) {
                    console.log(`Region ${region} failed:`, error);
                    continue;
                }
            }
            
            if (!track) {
                throw new Error('Apple Music track not found');
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
            throw new Error('Apple Music track not found');
        }
    }
    
    async function searchYouTubeMusic(title, artist) {
        let query = artist ? `${title} ${artist}` : title;
        
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
        console.log(`🔍 Searching Apple Music: "${title}" by "${artist}"`);
        
        // Try multiple search strategies
        const searchStrategies = [];
        
        // Strategy 1: Exact title + artist (highest priority)
        if (artist) {
            searchStrategies.push({
                query: `${title} ${artist}`,
                weight: 100
            });
        }
        
        // Strategy 2: Clean title + artist
        const cleanTitle = cleanSongTitle(title);
        if (cleanTitle !== title && artist) {
            searchStrategies.push({
                query: `${cleanTitle} ${artist}`,
                weight: 90
            });
        }
        
        // Strategy 3: Title only (lower priority)
        searchStrategies.push({
            query: title,
            weight: 50
        });
        
        console.log('Search strategies:', searchStrategies);
        
        // Try each search strategy with regions - PRIORITIZE ENGLISH REGIONS FIRST
        const regions = ['us', 'gb', 'ca', 'au', 'jp'];
        
        // Sort strategies by weight (highest first)
        searchStrategies.sort((a, b) => b.weight - a.weight);
        
        for (const strategy of searchStrategies) {
            for (const region of regions) {
                console.log(`Trying: "${strategy.query}" in region ${region} (weight: ${strategy.weight})`);
                
                try {
                    const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(strategy.query)}&entity=song&limit=15&media=music&country=${region}`);
                    
                    if (response.ok) {
                        const data = await response.json();
                        
                        if (data.results && data.results.length > 0) {
                            console.log(`Found ${data.results.length} results in ${region}`);
                            
                            // Find the best match with STRICT matching
                            const bestMatch = findStrictMatch(data.results, title, artist, region, strategy.weight);
                            if (bestMatch) {
                                console.log(`✅ STRICT Apple Music match: "${bestMatch.trackName}" by ${bestMatch.artistName} (${region})`);
                                
                                // If we found a match in Japanese region, but the song is likely English,
                                // try one more time with English regions only for English songs
                                if (region === 'jp' && isLikelyEnglishSong(title, artist)) {
                                    console.log('English song found in Japanese region, trying English regions...');
                                    const englishMatch = await searchEnglishRegionsOnly(title, artist);
                                    if (englishMatch) {
                                        return englishMatch;
                                    }
                                }
                                
                                return {
                                    url: bestMatch.trackViewUrl,
                                    title: bestMatch.trackName,
                                    artist: bestMatch.artistName
                                };
                            } else {
                                console.log('❌ No strict match found in results');
                            }
                        }
                    }
                } catch (error) {
                    console.log(`Search failed for "${strategy.query}" in ${region}:`, error);
                }
                
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 150));
            }
        }
        
        console.log('❌ No Apple Music match found after all strategies');
        return null;
    }
    
    // STRICT matching function - much more accurate
    function findStrictMatch(results, targetTitle, targetArtist, region, strategyWeight) {
        console.log(`🎯 STRICT matching: "${targetTitle}" by "${targetArtist}"`);
        
        const scoredResults = results.map(track => {
            const trackTitle = track.trackName || '';
            const trackArtist = track.artistName || '';
            
            let score = 0;
            
            // TITLE MATCHING (70% weight) - VERY STRICT
            const titleScore = calculateStrictTitleScore(trackTitle, targetTitle);
            score += titleScore * 70;
            
            // ARTIST MATCHING (30% weight) - VERY STRICT
            const artistScore = calculateStrictArtistScore(trackArtist, targetArtist);
            score += artistScore * 30;
            
            // MAJOR BONUS for exact title and artist match
            if (trackTitle.toLowerCase() === targetTitle.toLowerCase() && 
                trackArtist.toLowerCase() === targetArtist.toLowerCase()) {
                score += 100; // Massive bonus for exact match
                console.log(`🎯 EXACT MATCH: +100 bonus`);
            }
            
            // Bonus for strategy weight (higher weight strategies get preference)
            score += strategyWeight * 0.1;
            
            // Small bonus for English regions for English songs
            if (region !== 'jp' && isLikelyEnglishSong(targetTitle, targetArtist)) {
                score += 5;
            }
            
            console.log(`  📊 "${trackTitle}" by "${trackArtist}" - Score: ${score.toFixed(1)}`);
            
            return { track, score };
        });
        
        // Sort by score and get the best match
        scoredResults.sort((a, b) => b.score - a.score);
        const bestMatch = scoredResults[0];
        
        // VERY HIGH threshold for matches - only accept very confident matches
        if (bestMatch && bestMatch.score >= 80) {
            console.log(`✅ STRICT match accepted: ${bestMatch.score.toFixed(1)}`);
            return bestMatch.track;
        }
        
        console.log(`❌ No match meets strict threshold (needed 80, got ${bestMatch ? bestMatch.score.toFixed(1) : 0})`);
        return null;
    }
    
    function calculateStrictTitleScore(trackTitle, targetTitle) {
        const trackTitleLower = trackTitle.toLowerCase();
        const targetTitleLower = targetTitle.toLowerCase();
        
        // Exact match - highest score
        if (trackTitleLower === targetTitleLower) return 1.0;
        
        // Clean both titles and compare
        const cleanTrack = cleanSongTitle(trackTitleLower);
        const cleanTarget = cleanSongTitle(targetTitleLower);
        
        // Exact match after cleaning
        if (cleanTrack === cleanTarget) return 0.95;
        
        // One contains the other (after cleaning)
        if (cleanTrack.includes(cleanTarget) || cleanTarget.includes(cleanTrack)) return 0.85;
        
        // Calculate word overlap with higher requirements
        const trackWords = new Set(cleanTrack.split(/\s+/).filter(word => word.length > 2));
        const targetWords = new Set(cleanTarget.split(/\s+/).filter(word => word.length > 2));
        
        if (trackWords.size === 0 || targetWords.size === 0) return 0.3;
        
        const intersection = new Set([...trackWords].filter(x => targetWords.has(x)));
        const union = new Set([...trackWords, ...targetWords]);
        
        const overlapScore = intersection.size / union.size;
        
        // Require at least 60% word overlap for a decent score
        if (overlapScore >= 0.6) {
            return overlapScore * 0.8;
        }
        
        return overlapScore * 0.5; // Penalize low overlap
    }
    
    function calculateStrictArtistScore(trackArtist, targetArtist) {
        if (!targetArtist) return 0.3; // Low score if no artist to compare
        
        const trackArtistLower = trackArtist.toLowerCase();
        const targetArtistLower = targetArtist.toLowerCase();
        
        // Exact artist match
        if (trackArtistLower === targetArtistLower) return 1.0;
        
        // Remove featured artists and compare main artists
        const mainTrackArtist = trackArtistLower.split(/[,&]|feat\.?|ft\.?|featuring|&/)[0].trim();
        const mainTargetArtist = targetArtistLower.split(/[,&]|feat\.?|ft\.?|featuring|&/)[0].trim();
        
        // Exact match of main artists
        if (mainTrackArtist === mainTargetArtist) return 0.95;
        
        // One contains the other (main artists)
        if (mainTrackArtist.includes(mainTargetArtist) || mainTargetArtist.includes(mainTrackArtist)) return 0.8;
        
        // Word overlap for artist names
        const trackWords = new Set(mainTrackArtist.split(/\s+/).filter(word => word.length > 1));
        const targetWords = new Set(mainTargetArtist.split(/\s+/).filter(word => word.length > 1));
        
        if (trackWords.size === 0 || targetWords.size === 0) return 0.2;
        
        const intersection = new Set([...trackWords].filter(x => targetWords.has(x)));
        const union = new Set([...trackWords, ...targetWords]);
        
        const overlapScore = intersection.size / union.size;
        
        return overlapScore >= 0.5 ? overlapScore * 0.7 : overlapScore * 0.3;
    }
    
    function cleanSongTitle(title) {
        return title
            .replace(/\([^)]*\)/g, '') // Remove parentheses content
            .replace(/\[[^\]]*\]/g, '') // Remove brackets content
            .replace(/\s*[-–—].*$/, '') // Remove everything after dash
            .replace(/\s*[\(（].*[\)）].*$/, '') // Remove Japanese parentheses
            .replace(/\s*[【].*[】].*$/, '') // Remove Japanese brackets
            .replace(/\s*-\s*Topic$/i, '') // Remove "- Topic"
            .replace(/\s*\(Official Audio\)/gi, '') // Remove "Official Audio"
            .replace(/\s*\(Official Video\)/gi, '') // Remove "Official Video"
            .replace(/\s*\(Official Music Video\)/gi, '') // Remove "Official Music Video"
            .replace(/\s*\(Lyrics?\)/gi, '') // Remove "Lyrics"
            .replace(/\s*\(Visualizer\)/gi, '') // Remove "Visualizer"
            .replace(/\s+/g, ' ') // Normalize spaces
            .trim();
    }
    
    // New function to search only English regions for English songs
    async function searchEnglishRegionsOnly(title, artist) {
        const englishRegions = ['us', 'gb', 'ca', 'au'];
        const searchQuery = artist ? `${title} ${artist}` : title;
        
        for (const region of englishRegions) {
            try {
                const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&entity=song&limit=5&media=music&country=${region}`);
                
                if (response.ok) {
                    const data = await response.json();
                    
                    if (data.results && data.results.length > 0) {
                        const bestMatch = findStrictMatch(data.results, title, artist, region, 100);
                        if (bestMatch) {
                            console.log(`✅ English region strict match: "${bestMatch.trackName}" by ${bestMatch.artistName} (${region})`);
                            return {
                                url: bestMatch.trackViewUrl,
                                title: bestMatch.trackName,
                                artist: bestMatch.artistName
                            };
                        }
                    }
                }
            } catch (error) {
                console.log(`English region search failed for ${region}:`, error);
            }
        }
        return null;
    }
    
    // Function to detect if a song is likely English
    function isLikelyEnglishSong(title, artist) {
        // Check if title contains English characters (basic detection)
        const englishRegex = /[a-zA-Z]/;
        const hasEnglishChars = englishRegex.test(title) || englishRegex.test(artist);
        
        // Check if it contains Japanese characters
        const japaneseRegex = /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF]/;
        const hasJapaneseChars = japaneseRegex.test(title) || japaneseRegex.test(artist);
        
        // If it has English characters and no Japanese characters, it's likely English
        return hasEnglishChars && !hasJapaneseChars;
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
                <p>❌ No alternative platforms found for this song.</p>
                <p style="margin-top: 10px; font-size: 14px; color: var(--text-secondary);">
                    The conversion couldn't find a confident match on other platforms.
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
