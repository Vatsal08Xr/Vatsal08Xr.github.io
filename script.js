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
        spotify: `🎵`,
        youtube: `🎥`,
        apple: `🍎`
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
        
        // Simple pattern: "Artist - Title"
        const pattern = /^([^-–—]+?)\s*[-–—]\s*([^-–—]+)/;
        const match = title.match(pattern);
        
        if (match) {
            return {
                cleanTitle: match[2].trim(),
                artist: match[1].trim()
            };
        }
        
        return { cleanTitle: title, artist: null };
    }
    
    async function convertFromAppleMusic(trackId, originalUrl) {
        statusDiv.innerHTML = `${platformLogos.apple} Fetching Apple Music track...`;
        
        try {
            const response = await fetch(`https://itunes.apple.com/lookup?id=${trackId}&entity=song&country=US`);
            
            if (!response.ok) {
                throw new Error('Apple Music track not found');
            }
            
            const data = await response.json();
            
            if (!data.results || data.results.length === 0) {
                throw new Error('Apple Music track not found');
            }
            
            const track = data.results[0];
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
        console.log(`Searching Apple Music: "${title}" by "${artist}"`);
        
        // Clean the title
        let cleanTitle = title
            .replace(/\([^)]*\)/g, '')
            .replace(/\s*[-–—].*$/, '')
            .replace(/\s*\([^)]*\)/g, '')
            .replace(/\s*-\s*Topic$/i, '')
            .trim();
        
        let searchQuery = cleanTitle;
        if (artist) {
            searchQuery = `${cleanTitle} ${artist}`;
        }
        
        console.log(`Cleaned search: "${searchQuery}"`);
        
        try {
            const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&entity=song&limit=5&media=music&country=US`);
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.results && data.results.length > 0) {
                    // Return the first result
                    const firstResult = data.results[0];
                    console.log(`Apple Music found: "${firstResult.trackName}" by ${firstResult.artistName}`);
                    
                    return {
                        url: firstResult.trackViewUrl,
                        title: firstResult.trackName,
                        artist: firstResult.artistName
                    };
                }
            }
        } catch (error) {
            console.log('Apple Music search error:', error);
        }
        
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
