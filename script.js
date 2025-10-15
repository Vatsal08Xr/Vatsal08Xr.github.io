document.addEventListener('DOMContentLoaded', () => {
  const inputEl = document.getElementById('spotifyLink');
  const convertBtn = document.getElementById('convertBtn');
  const statusDiv = document.getElementById('status');
  const resultDiv = document.getElementById('result');
  const heading = document.getElementById('heading');

  // Set default heading
  heading.textContent = 'Spoti2YTM';

  const proxyUrl = 'https://spotify-proxy-1.onrender.com';

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
    const amRegex = /music\.apple\.com\/(?:[a-z]{2}\/)?(?:album|song)\/[^/]+\/(\d+)/;

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

  convertBtn.addEventListener('click', async () => {
    const input = inputEl.value.trim();
    statusDiv.textContent = '';
    resultDiv.innerHTML = '';

    if (!input) {
      statusDiv.textContent = '❌ Please enter a Spotify, YouTube Music, or Apple Music link.';
      return;
    }

    // Improved regex patterns
    const spotifyRegex = /https?:\/\/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/;
    const ytRegex = /(?:https?:\/\/)?(?:music\.)?youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/;
    const amRegex = /music\.apple\.com\/(?:[a-z]{2}\/)?(?:album|song)\/[^/]+\/(\d+)/;

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
    }
  });

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
      searchAppleMusic(title, artist)
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
    
    const { title } = await videoInfoRes.json();
    statusDiv.textContent = `🎵 Found: "${title}". Searching other platforms...`;

    // Search for both Spotify and Apple Music
    const [spotifyResult, amResult] = await Promise.allSettled([
      searchSpotify(title),
      searchAppleMusicFromTitle(title)
    ]);

    const spotifyData = spotifyResult.status === 'fulfilled' ? spotifyResult.value : null;
    const artist = spotifyData?.artist || 'Unknown Artist';
    
    displayResults(title, artist, {
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
        throw new Error('Could not retrieve song information from Apple Music');
      }
    } catch (error) {
      console.error('Apple Music conversion error:', error);
      statusDiv.textContent = '❌ Could not convert Apple Music link. The proxy may not support Apple Music yet.';
    }
  }

  async function getAppleMusicTrackInfo(url, trackId) {
    // Method 1: Try your proxy first
    try {
      const amRes = await fetch(`${proxyUrl}/apple-track/${trackId}`);
      if (amRes.ok) {
        const trackInfo = await amRes.json();
        if (trackInfo.name && trackInfo.artist) {
          return {
            title: trackInfo.name,
            artist: trackInfo.artist
          };
        }
      }
    } catch (error) {
      console.log('Proxy Apple Music endpoint not available');
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
      
      // Look for 'song' in the path and get the next segment
      for (let i = 0; i < pathSegments.length; i++) {
        if (pathSegments[i] === 'song') {
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
      
      // For common songs, we can hardcode the artist for better results
      const knownSongs = {
        'eyes closed': { title: 'Eyes Closed', artist: 'Ed Sheeran' },
        'blank space': { title: 'Blank Space', artist: 'Taylor Swift' },
        'blinding lights': { title: 'Blinding Lights', artist: 'The Weeknd' },
        'flowers': { title: 'Flowers', artist: 'Miley Cyrus' },
        'cruel summer': { title: 'Cruel Summer', artist: 'Taylor Swift' },
        'save your tears': { title: 'Save Your Tears', artist: 'The Weeknd' },
        'levitating': { title: 'Levitating', artist: 'Dua Lipa' },
        'stay': { title: 'Stay', artist: 'The Kid LAROI, Justin Bieber' },
        'good 4 u': { title: 'good 4 u', artist: 'Olivia Rodrigo' },
        'drivers license': { title: 'drivers license', artist: 'Olivia Rodrigo' }
      };
      
      const lowerSongName = songName.toLowerCase();
      if (knownSongs[lowerSongName]) {
        return knownSongs[lowerSongName];
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
    const searchQuery = `${title} ${artist} official audio`;
    const ytProxyRes = await fetch(`${proxyUrl}/search-youtube?q=${encodeURIComponent(searchQuery)}`);
    
    if (!ytProxyRes.ok) {
      const err = await ytProxyRes.json().catch(() => ({}));
      throw new Error(err.error || 'No YouTube match');
    }
    
    const { videoId } = await ytProxyRes.json();
    return {
      url: `https://music.youtube.com/watch?v=${videoId}`,
      title: title,
      artist: artist
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

  async function searchAppleMusic(title, artist) {
    const searchQuery = `${title} ${artist}`;
    try {
      const amSearchRes = await fetch(`${proxyUrl}/search-apple?q=${encodeURIComponent(searchQuery)}`);
      
      if (amSearchRes.ok) {
        const { url } = await amSearchRes.json();
        return {
          url: url,
          title: title,
          artist: artist
        };
      }
    } catch (error) {
      console.log('Apple Music search not available');
    }
    return null;
  }

  async function searchAppleMusicFromTitle(title) {
    try {
      const amSearchRes = await fetch(`${proxyUrl}/search-apple?q=${encodeURIComponent(title)}`);
      
      if (amSearchRes.ok) {
        const { url } = await amSearchRes.json();
        return {
          url: url,
          title: title,
          artist: 'Unknown Artist'
        };
      }
    } catch (error) {
      console.log('Apple Music search not available');
    }
    return null;
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
  }

  // Allow Enter key
  inputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      convertBtn.click();
    }
  });
});
