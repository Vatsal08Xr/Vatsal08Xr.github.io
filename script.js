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

    console.log('Input:', input);
    console.log('Spotify match:', spotifyMatch);
    console.log('YouTube match:', ytMatch);
    console.log('Apple Music match:', amMatch);

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
      // Try to get track info from your proxy first
      const amRes = await fetch(`${proxyUrl}/apple-track/${trackId}`);
      if (amRes.ok) {
        const trackInfo = await amRes.json();
        const title = trackInfo.name;
        const artist = trackInfo.artist;
        
        statusDiv.textContent = `🎵 Found: "${title}" by ${artist}. Searching other platforms...`;

        // Search for both Spotify and YouTube Music
        const [spotifyResult, ytmResult] = await Promise.allSettled([
          searchSpotify(`${title} ${artist}`),
          searchYouTubeMusic(title, artist)
        ]);

        displayResults(title, artist, {
          spotify: spotifyResult.status === 'fulfilled' ? spotifyResult.value : null,
          youtube: ytmResult.status === 'fulfilled' ? ytmResult.value : null,
          originalPlatform: 'apple'
        });
        return;
      }
    } catch (error) {
      console.log('Apple Music proxy endpoint failed:', error);
    }

    // Fallback: Extract song name from URL and use web scraping approach
    statusDiv.textContent = '🔍 Extracting song info from Apple Music link...';
    
    const songInfo = extractSongInfoFromAppleUrl(originalUrl);
    const searchQuery = songInfo.title && songInfo.artist 
      ? `${songInfo.title} ${songInfo.artist}`
      : songInfo.title || 'music';

    statusDiv.textContent = `🎵 Searching for "${searchQuery}" on other platforms...`;

    const [spotifyResult, ytmResult] = await Promise.allSettled([
      searchSpotify(searchQuery),
      searchYouTubeMusic(songInfo.title || searchQuery, songInfo.artist || '')
    ]);

    const spotifyData = spotifyResult.status === 'fulfilled' ? spotifyResult.value : null;
    const youtubeData = ytmResult.status === 'fulfilled' ? ytmResult.value : null;

    displayResults(
      songInfo.title || 'Track', 
      songInfo.artist || 'Artist', 
      {
        spotify: spotifyData,
        youtube: youtubeData,
        originalPlatform: 'apple'
      }
    );
  }

  function extractSongInfoFromAppleUrl(url) {
    try {
      // Parse the URL to extract the song name from the path
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split('/').filter(segment => segment);
      
      // Apple Music URL pattern: /us/song/song-name/123456 or /album/album-name/123456
      let songName = '';
      let artist = '';
      
      // Look for 'song' or 'album' in the path and get the next segment
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
        songName = decodeURIComponent(songName.replace(/-/g, ' '));
        // Capitalize words
        songName = songName.replace(/\b\w/g, l => l.toUpperCase());
      }
      
      return {
        title: songName || 'Unknown Track',
        artist: artist || 'Unknown Artist'
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
        text: `🎧 ${platforms.spotify.name || title} - ${platforms.spotify.artist || artist}`,
        platform: 'spotify'
      });
    }
    
    if (platforms.originalPlatform !== 'youtube' && platforms.youtube) {
      const ytData = platforms.youtube;
      links.push({
        url: ytData.url,
        text: `▶️ ${ytData.title || title} - ${ytData.artist || artist}`,
        platform: 'youtube'
      });
    }
    
    if (platforms.originalPlatform !== 'apple' && platforms.apple) {
      const amData = platforms.apple;
      links.push({
        url: amData.url,
        text: `🎵 ${amData.title || title} - ${amData.artist || artist}`,
        platform: 'apple'
      });
    }

    if (links.length === 0) {
      resultDiv.innerHTML = '<p>❌ No alternative platforms found for this track.</p>';
      return;
    }

    const linksHTML = links.map(link => 
      `<a href="${link.url}" target="_blank" rel="noopener" class="${link.platform}-link">${link.text}</a>`
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
