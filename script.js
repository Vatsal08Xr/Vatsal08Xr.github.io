document.addEventListener('DOMContentLoaded', () => {
  // Initialize all variables and elements
  const inputEl = document.getElementById('spotifyLink');
  const convertBtn = document.getElementById('convertBtn');
  const statusDiv = document.getElementById('status');
  const resultDiv = document.getElementById('result');
  const appDetection = document.getElementById('appDetection');
  const detectedApps = document.getElementById('detectedApps');

  // Set default heading
  const heading = document.getElementById('heading');
  heading.textContent = 'Spoti2YTM';

  const proxyUrl = 'https://spotify-proxy-1.onrender.com';
  let currentSongData = null;

  // Tab Management
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      
      // Remove active class from all buttons and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked button and corresponding content
      button.classList.add('active');
      document.getElementById(`${tabId}-tab`).classList.add('active');
      
      // Clear results when switching to song tab
      if (tabId === 'song') {
        statusDiv.textContent = '';
        resultDiv.innerHTML = '';
        appDetection.style.display = 'none';
      }
    });
  });

  // Newsletter form
  const newsletterButton = document.querySelector('.newsletter-button');
  if (newsletterButton) {
    newsletterButton.addEventListener('click', () => {
      const emailInput = document.querySelector('.newsletter-input');
      const email = emailInput.value;
      if (email && email.includes('@')) {
        alert('Thanks! We\'ll notify you when playlist conversion launches.');
        emailInput.value = '';
      } else {
        alert('Please enter a valid email address.');
      }
    });
  }

  // Update heading as user types
  inputEl.addEventListener('input', () => {
    const value = inputEl.value.trim();
    if (!value) {
      heading.textContent = 'Spoti2YTM';
      return;
    }

    // Improved regex patterns
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
      heading.textContent = 'Spoti2YTM';
    }
  });

  // Convert button click handler
  convertBtn.addEventListener('click', async () => {
    const input = inputEl.value.trim();
    statusDiv.textContent = '';
    resultDiv.innerHTML = '';
    appDetection.style.display = 'none';

    // Show loading state
    const buttonText = convertBtn.querySelector('.button-text');
    const buttonLoader = convertBtn.querySelector('.button-loader');
    buttonText.style.display = 'none';
    buttonLoader.style.display = 'inline-block';
    convertBtn.disabled = true;

    if (!input) {
      statusDiv.textContent = '❌ Please enter a Spotify, YouTube Music, or Apple Music link.';
      // Reset button state
      buttonText.style.display = 'inline-block';
      buttonLoader.style.display = 'none';
      convertBtn.disabled = false;
      return;
    }

    // Improved regex patterns
    const spotifyRegex = /https?:\/\/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/;
    const ytRegex = /(?:https?:\/\/)?(?:music\.)?youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/;
    const amRegex = /music\.apple\.com\/(?:[a-z]{2}\/)?(?:album|song)\/[^?]+\/(\d+)/;

    const spotifyMatch = input.match(spotifyRegex);
    const ytMatch = input.match(ytRegex);
    const amMatch = input.match(amRegex);

    try {
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
      console.error('Conversion error:', err);
      statusDiv.textContent = `❌ ${err.message || 'Conversion failed. Try again.'}`;
    } finally {
      // Always reset button state
      buttonText.style.display = 'inline-block';
      buttonLoader.style.display = 'none';
      convertBtn.disabled = false;
    }
  });

  // Allow Enter key
  inputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      convertBtn.click();
    }
  });

  // Conversion Functions
  async function convertFromSpotify(trackId) {
    statusDiv.textContent = '🔍 Fetching song info from Spotify...';

    const proxyRes = await fetch(`${proxyUrl}/track/${trackId}`);
    if (!proxyRes.ok) {
      const err = await proxyRes.json().catch(() => ({}));
      throw new Error(err.error || 'Track not found on Spotify');
    }
    
    const track = await proxyRes.json();
    const title = track.name;
    const artist = track.artists[0].name;
    
    statusDiv.textContent = `🎵 Found: "${title}" by ${artist}. Searching other platforms...`;

    // Search for both YouTube Music and Apple Music
    const [ytmResult, amResult] = await Promise.allSettled([
      searchYouTubeMusic(title, artist),
      searchAppleMusicDirect(title, artist)
    ]);

    displayResults(title, artist, {
      youtube: ytmResult.status === 'fulfilled' ? ytmResult.value : null,
      apple: amResult.status === 'fulfilled' ? amResult.value : null,
      originalPlatform: 'spotify'
    });
  }

  async function convertFromYouTube(videoId) {
    statusDiv.textContent = '🔍 Fetching video info from YouTube...';

    const videoInfoRes = await fetch(`${proxyUrl}/get-video-title?v=${videoId}`);
    if (!videoInfoRes.ok) {
      throw new Error('Could not get video info');
    }
    
    const videoInfo = await videoInfoRes.json();
    const title = videoInfo.title;
    
    // Try to extract artist and song title from YouTube title
    const { cleanTitle, artist } = extractArtistFromTitle(title);
    
    statusDiv.textContent = `🎵 Found: "${cleanTitle}"${artist ? ` by ${artist}` : ''}. Searching other platforms...`;

    // Search for both Spotify and Apple Music
    const [spotifyResult, amResult] = await Promise.allSettled([
      searchSpotify(artist ? `${cleanTitle} ${artist}` : cleanTitle),
      searchAppleMusicDirect(cleanTitle, artist || '')
    ]);

    const spotifyData = spotifyResult.status === 'fulfilled' ? spotifyResult.value : null;
    const finalArtist = artist || (spotifyData?.artist || 'Unknown Artist');
    
    displayResults(cleanTitle, finalArtist, {
      spotify: spotifyData,
      apple: amResult.status === 'fulfilled' ? amResult.value : null,
      originalPlatform: 'youtube'
    });
  }

  async function convertFromAppleMusic(trackId, originalUrl) {
    statusDiv.textContent = '🔍 Fetching Apple Music track info...';

    try {
      // First try to get track info using multiple methods
      const songInfo = await getAppleMusicTrackInfo(originalUrl, trackId);
      
      if (songInfo && songInfo.title && songInfo.title !== 'Unknown Track') {
        statusDiv.textContent = `🎵 Found: "${songInfo.title}" by ${songInfo.artist}. Searching other platforms...`;

        // Search for both Spotify and YouTube Music
        const [spotifyResult, ytmResult] = await Promise.allSettled([
          searchSpotify(`${songInfo.title} ${songInfo.artist}`),
          searchYouTubeMusic(songInfo.title, songInfo.artist)
        ]);

        displayResults(songInfo.title, songInfo.artist, {
          spotify: spotifyResult.status === 'fulfilled' ? spotifyResult.value : null,
          youtube: ytmResult.status === 'fulfilled' ? ytmResult.value : null,
          originalPlatform: 'apple'
        });
      } else {
        // If we get here, it means getAppleMusicTrackInfo returned null or unknown track
        throw new Error('Could not retrieve song information from Apple Music');
      }
    } catch (error) {
      console.error('Apple Music conversion error:', error);
      
      // Check if it's a specific error or just a general failure
      if (error.message.includes('Could not retrieve') || error.message.includes('Unknown Track')) {
        // Try direct proxy call as fallback
        statusDiv.textContent = '🔍 Trying alternative method...';
        await tryDirectProxyCall(trackId, originalUrl);
      } else {
        statusDiv.textContent = '❌ Could not convert Apple Music link. Try a different song.';
      }
    }
  }

  function extractArtistFromTitle(title) {
    // Common patterns in YouTube Music titles:
    // "Artist - Song", "Song - Artist", "Artist: Song", "Song (feat. Artist)", etc.
    
    // Pattern 1: "Artist - Song"
    let match = title.match(/^([^-]+) - ([^-]+)$/);
    if (match) {
      return { artist: match[1].trim(), cleanTitle: match[2].trim() };
    }
    
    // Pattern 2: "Song - Artist"
    if (title.includes(' - ')) {
      const parts = title.split(' - ');
      if (parts.length === 2) {
        const part1 = parts[0].trim();
        const part2 = parts[1].trim();
        
        // If part2 contains "Official", "Video", etc., part1 is likely the song
        if (part2.match(/(official|video|audio|lyrics|mv)/i)) {
          return { artist: 'Unknown Artist', cleanTitle: part1 };
        }
        return { artist: part2, cleanTitle: part1 };
      }
    }
    
    // Pattern 3: "Artist: Song"
    match = title.match(/^([^:]+): (.+)$/);
    if (match) {
      return { artist: match[1].trim(), cleanTitle: match[2].trim() };
    }
    
    // Pattern 4: "Song (feat. Artist)"
    match = title.match(/^([^(]+) \(feat\. ([^)]+)\)/i);
    if (match) {
      return { artist: match[2].trim(), cleanTitle: match[1].trim() };
    }
    
    // Pattern 5: "Song (with Artist)"
    match = title.match(/^([^(]+) \(with ([^)]+)\)/i);
    if (match) {
      return { artist: match[2].trim(), cleanTitle: match[1].trim() };
    }
    
    // If no pattern matches, return the original title
    return { artist: null, cleanTitle: title };
  }

  async function getAppleMusicTrackInfo(url, trackId) {
    // Method 1: Try your proxy first (this should work based on your test)
    try {
      const amRes = await fetch(`${proxyUrl}/apple-track/${trackId}`);
      if (amRes.ok) {
        const trackInfo = await amRes.json();
        console.log('Proxy returned:', trackInfo); // Debug log
        if (trackInfo.name && trackInfo.artist) {
          return {
            title: trackInfo.name,
            artist: trackInfo.artist
          };
        }
      } else {
        console.log('Proxy response not OK:', amRes.status);
      }
    } catch (error) {
      console.log('Proxy Apple Music endpoint error:', error);
    }

    // Method 2: Extract from URL and use iTunes API
    const urlInfo = extractSongInfoFromAppleUrl(url);
    if (urlInfo.title && urlInfo.title !== 'Unknown Track') {
      // Try to get more accurate info using iTunes Search API
      try {
        const itunesResponse = await fetch(`https://itunes.apple.com/lookup?id=${trackId}`);
        if (itunesResponse.ok) {
          const data = await itunesResponse.json();
          if (data.results && data.results.length > 0) {
            const track = data.results[0];
            return {
              title: track.trackName || urlInfo.title,
              artist: track.artistName || urlInfo.artist
            };
          }
        }
      } catch (error) {
        console.log('iTunes API failed, using URL extraction');
      }
      
      return urlInfo;
    }

    // Method 3: Final fallback - use iTunes search with the track ID
    try {
      const searchResponse = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(trackId)}&entity=song&limit=1`);
      if (searchResponse.ok) {
        const data = await searchResponse.json();
        if (data.results && data.results.length > 0) {
          const track = data.results[0];
          return {
            title: track.trackName,
            artist: track.artistName
          };
        }
      }
    } catch (error) {
      console.log('iTunes search also failed');
    }

    return null;
  }

  function extractSongInfoFromAppleUrl(url) {
    try {
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split('/').filter(segment => segment);
      
      let songName = '';
      
      // Look for 'song' or 'album' in the path
      for (let i = 0; i < pathSegments.length; i++) {
        if (pathSegments[i] === 'song' || pathSegments[i] === 'album') {
          if (i + 1 < pathSegments.length) {
            songName = pathSegments[i + 1];
            break;
          }
        }
      }
      
      // Decode and format the song name
      if (songName) {
        songName = decodeURIComponent(songName);
        // Replace hyphens with spaces and capitalize
        songName = songName.replace(/-/g, ' ')
                          .replace(/\b\w/g, l => l.toUpperCase());
      }
      
      return {
        title: songName || 'Unknown Track',
        artist: 'Unknown Artist'
      };
    } catch (error) {
      console.error('Error extracting song info from URL:', error);
      return {
        title: 'Unknown Track',
        artist: 'Unknown Artist'
      };
    }
  }

  async function searchYouTubeMusic(title, artist) {
    // Create a more specific search query
    const searchQuery = artist ? `${title} ${artist} official audio` : `${title} official audio`;
    const ytProxyRes = await fetch(`${proxyUrl}/search-youtube?q=${encodeURIComponent(searchQuery)}`);
    
    if (!ytProxyRes.ok) {
      const err = await ytProxyRes.json().catch(() => ({}));
      throw new Error(err.error || 'No YouTube match');
    }
    
    const { videoId } = await ytProxyRes.json();
    return {
      url: `https://music.youtube.com/watch?v=${videoId}`,
      title: title,
      artist: artist || 'Unknown Artist'
    };
  }

  async function searchSpotify(query) {
    const spotifySearchRes = await fetch(`${proxyUrl}/search-spotify?q=${encodeURIComponent(query)}`);
    
    if (!spotifySearchRes.ok) {
      const err = await spotifySearchRes.json().catch(() => ({}));
      throw new Error(err.error || 'No Spotify match');
    }
    
    return await spotifySearchRes.json();
  }

  async function searchAppleMusicDirect(title, artist) {
    const searchQuery = artist ? `${title} ${artist}` : title;
    
    console.log('Searching Apple Music for:', searchQuery);
    
    // Method 1: Try your proxy first
    try {
      const amSearchRes = await fetch(`${proxyUrl}/search-apple?q=${encodeURIComponent(searchQuery)}`);
      if (amSearchRes.ok) {
        const result = await amSearchRes.json();
        if (result.url) {
          console.log('Found via proxy:', result.url);
          return {
            url: result.url,
            title: title,
            artist: artist || 'Unknown Artist'
          };
        }
      }
    } catch (error) {
      console.log('Proxy Apple Music search failed:', error);
    }
    
    // Method 2: Use iTunes Search API directly (more reliable)
    try {
      const itunesResponse = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&entity=song&limit=1&media=music`);
      if (itunesResponse.ok) {
        const data = await itunesResponse.json();
        if (data.results && data.results.length > 0) {
          const track = data.results[0];
          console.log('Found via iTunes API:', track.trackViewUrl);
          return {
            url: track.trackViewUrl,
            title: track.trackName || title,
            artist: track.artistName || artist || 'Unknown Artist'
          };
        }
      }
    } catch (error) {
      console.log('iTunes API search failed:', error);
    }
    
    // Method 3: Try with just the title if artist search failed
    if (artist) {
      try {
        const itunesResponse = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(title)}&entity=song&limit=1&media=music`);
        if (itunesResponse.ok) {
          const data = await itunesResponse.json();
          if (data.results && data.results.length > 0) {
            const track = data.results[0];
            console.log('Found via iTunes API (title only):', track.trackViewUrl);
            return {
              url: track.trackViewUrl,
              title: track.trackName || title,
              artist: track.artistName || artist || 'Unknown Artist'
            };
          }
        }
      } catch (error) {
        console.log('iTunes API title-only search failed:', error);
      }
    }
    
    console.log('No Apple Music match found');
    return null;
  }

  async function tryDirectProxyCall(trackId, originalUrl) {
    try {
      // Call your proxy directly
      const proxyResponse = await fetch(`${proxyUrl}/apple-track/${trackId}`);
      
      if (proxyResponse.ok) {
        const trackData = await proxyResponse.json();
        statusDiv.textContent = `🎵 Found: "${trackData.name}" by ${trackData.artist}. Searching other platforms...`;

        // Search for both Spotify and YouTube Music
        const [spotifyResult, ytmResult] = await Promise.allSettled([
          searchSpotify(`${trackData.name} ${trackData.artist}`),
          searchYouTubeMusic(trackData.name, trackData.artist)
        ]);

        displayResults(trackData.name, trackData.artist, {
          spotify: spotifyResult.status === 'fulfilled' ? spotifyResult.value : null,
          youtube: ytmResult.status === 'fulfilled' ? ytmResult.value : null,
          originalPlatform: 'apple'
        });
      } else {
        throw new Error('Direct proxy call also failed');
      }
    } catch (directError) {
      console.error('Direct proxy call failed:', directError);
      statusDiv.textContent = '❌ Could not convert Apple Music link. Try a different song.';
    }
  }

  function displayResults(title, artist, platforms) {
    const links = [];
    
    // Only show platforms that aren't the original source
    if (platforms.originalPlatform !== 'spotify' && platforms.spotify) {
      links.push({
        url: platforms.spotify.url,
        text: `🎧 Open in Spotify`,
        platform: 'spotify',
        songInfo: `${platforms.spotify.name || title} - ${platforms.spotify.artist || artist}`
      });
    }
    
    if (platforms.originalPlatform !== 'youtube' && platforms.youtube) {
      const ytData = platforms.youtube;
      links.push({
        url: ytData.url,
        text: `▶️ Open in YouTube Music`,
        platform: 'youtube',
        songInfo: `${ytData.title || title} - ${ytData.artist || artist}`
      });
    }
    
    if (platforms.originalPlatform !== 'apple' && platforms.apple) {
      const amData = platforms.apple;
      links.push({
        url: amData.url,
        text: `🎵 Open in Apple Music`,
        platform: 'apple',
        songInfo: `${amData.title || title} - ${amData.artist || artist}`
      });
    }

    if (links.length === 0) {
      resultDiv.innerHTML = '<p>❌ No alternative platforms found for this track.</p>';
      return;
    }

    const linksHTML = links.map(link => 
      `<div class="platform-link">
        <a href="${link.url}" target="_blank" rel="noopener" class="${link.platform}-link">${link.text}</a>
        <div class="song-info">${link.songInfo}</div>
       </div>`
    ).join('');

    resultDiv.innerHTML = `
      <p>✅ Converted "${title}" by ${artist} to:</p>
      <div class="links">
        ${linksHTML}
      </div>
    `;

    // Show app detection section
    showAppDetection({
      title,
      artist,
      spotify: platforms.spotify,
      youtube: platforms.youtube,
      apple: platforms.apple
    });
  }

  // App Detection Functions
  function detectMusicApps() {
    const apps = {
      spotify: false,
      youtube: false,
      apple: false
    };

    // Try to detect Spotify
    try {
      // Method 1: Check if Spotify app protocol is supported
      const spotifyLink = document.createElement('a');
      spotifyLink.href = 'spotify:';
      apps.spotify = spotifyLink.protocol === 'spotify:';
    } catch (e) {
      // Method 2: Check user agent for mobile devices
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile) {
        // On mobile, we can't reliably detect, so assume all apps might be available
        apps.spotify = true;
        apps.youtube = true;
        apps.apple = true;
      }
    }

    // Try to detect YouTube Music
    try {
      const ytLink = document.createElement('a');
      ytLink.href = 'youtube:';
      apps.youtube = ytLink.protocol === 'youtube:';
    } catch (e) {
      // Fallback for mobile
      if (!apps.youtube && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        apps.youtube = true;
      }
    }

    // Try to detect Apple Music
    try {
      const appleLink = document.createElement('a');
      appleLink.href = 'music:';
      apps.apple = appleLink.protocol === 'music:';
    } catch (e) {
      // Apple Music is primarily on iOS
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        apps.apple = true;
      }
    }

    console.log('Detected apps:', apps);
    return apps;
  }

  function showAppDetection(songData) {
    currentSongData = songData;
    appDetection.style.display = 'block';
    
    const availableApps = detectMusicApps();
    
    let html = '<div class="app-status">';
    
    // Show app availability status
    html += '<div style="margin-bottom: 15px;">';
    html += '<h4 style="margin-bottom: 10px; color: var(--text-secondary);">Available Apps:</h4>';
    html += '<div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">';
    
    if (availableApps.spotify) {
      html += '<span class="app-badge available">✅ Spotify</span>';
    } else {
      html += '<span class="app-badge unavailable">❌ Spotify</span>';
    }
    
    if (availableApps.youtube) {
      html += '<span class="app-badge available">✅ YouTube Music</span>';
    } else {
      html += '<span class="app-badge unavailable">❌ YouTube Music</span>';
    }
    
    if (availableApps.apple) {
      html += '<span class="app-badge available">✅ Apple Music</span>';
    } else {
      html += '<span class="app-badge unavailable">❌ Apple Music</span>';
    }
    
    html += '</div></div>';
    
    // Show quick launch buttons for available apps
    html += '<div class="quick-launch">';
    html += '<h4>Quick Launch:</h4>';
    html += '<div class="quick-launch-buttons">';
    
    if (availableApps.spotify && songData.spotify) {
      html += `<a href="${getAppDeepLink('spotify', songData.spotify.url)}" class="quick-launch-btn spotify">🎧 Open in Spotify</a>`;
    }
    
    if (availableApps.youtube && songData.youtube) {
      html += `<a href="${getAppDeepLink('youtube', songData.youtube.url)}" class="quick-launch-btn youtube">▶️ Open in YouTube Music</a>`;
    }
    
    if (availableApps.apple && songData.apple) {
      html += `<a href="${getAppDeepLink('apple', songData.apple.url)}" class="quick-launch-btn apple">🎵 Open in Apple Music</a>`;
    }
    
    html += '</div></div>';
    
    detectedApps.innerHTML = html;
  }

  function getAppDeepLink(platform, webUrl) {
    switch (platform) {
      case 'spotify':
        // Convert web URL to Spotify app deep link
        const spotifyMatch = webUrl.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
        if (spotifyMatch) {
          return `spotify:track:${spotifyMatch[1]}`;
        }
        return webUrl;
        
      case 'youtube':
        // Convert web URL to YouTube app deep link
        const ytMatch = webUrl.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
        if (ytMatch) {
          return `youtube://www.youtube.com/watch?v=${ytMatch[1]}`;
        }
        return webUrl;
        
      case 'apple':
        // Convert web URL to Apple Music app deep link
        const appleMatch = webUrl.match(/music\.apple\.com\/[^/]+\/album\/[^/]+\/(\d+)\?i=(\d+)/);
        if (appleMatch) {
          return `music://music.apple.com/us/album/track?i=${appleMatch[2]}`;
        }
        return webUrl;
        
      default:
        return webUrl;
    }
  }
});
