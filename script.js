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

    // Regex patterns - improved Apple Music regex
    const spotifyRegex = /https?:\/\/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/;
    const ytRegex = /(?:https?:\/\/)?(?:music\.)?youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/;
    const amRegex = /music\.apple\.com\/[a-z]{2}\/(?:album|song)\/[^?]*\?i=([0-9]+)/;

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
    const amRegex = /music\.apple\.com\/[a-z]{2}\/(?:album|song)\/[^?]*\?i=([0-9]+)/;

    const spotifyMatch = input.match(spotifyRegex);
    const ytMatch = input.match(ytRegex);
    const amMatch = input.match(amRegex);

    try {
      if (spotifyMatch) {
        await convertFromSpotify(spotifyMatch[1]);
      } else if (ytMatch) {
        await convertFromYouTube(ytMatch[1]);
      } else if (amMatch) {
        await convertFromAppleMusic(amMatch[1]);
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
      apple: amResult.status === 'fulfilled' ? amResult.value : null
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
      apple: amResult.status === 'fulfilled' ? amResult.value : null
    });
  }

  async function convertFromAppleMusic(trackId) {
    statusDiv.textContent = '🔍 Fetching Apple Music track...';

    const amRes = await fetch(`${proxyUrl}/apple-track/${trackId}`);
    if (!amRes.ok) {
      const err = await amRes.json().catch(() => ({}));
      throw new Error(err.error || 'Track not found on Apple Music');
    }
    
    const { name, artist } = await amRes.json();
    statusDiv.textContent = `🎵 Found: "${name}" by ${artist}. Searching other platforms...`;

    // Search for both Spotify and YouTube Music
    const [spotifyResult, ytmResult] = await Promise.allSettled([
      searchSpotify(`${name} ${artist}`),
      searchYouTubeMusic(name, artist)
    ]);

    displayResults(name, artist, {
      spotify: spotifyResult.status === 'fulfilled' ? spotifyResult.value : null,
      youtube: ytmResult.status === 'fulfilled' ? ytmResult.value : null
    });
  }

  async function searchYouTubeMusic(title, artist) {
    const searchQuery = `${title} ${artist}`;
    const ytProxyRes = await fetch(`${proxyUrl}/search-youtube?q=${encodeURIComponent(searchQuery)}`);
    
    if (!ytProxyRes.ok) {
      const err = await ytProxyRes.json().catch(() => ({}));
      throw new Error(err.error || 'No YouTube match');
    }
    
    const { videoId } = await ytProxyRes.json();
    return `https://music.youtube.com/watch?v=${videoId}`;
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
    const amSearchRes = await fetch(`${proxyUrl}/search-apple?q=${encodeURIComponent(searchQuery)}`);
    
    if (!amSearchRes.ok) {
      const err = await amSearchRes.json().catch(() => ({}));
      throw new Error(err.error || 'No Apple Music match');
    }
    
    const { url } = await amSearchRes.json();
    return url;
  }

  async function searchAppleMusicFromTitle(title) {
    const amSearchRes = await fetch(`${proxyUrl}/search-apple?q=${encodeURIComponent(title)}`);
    
    if (!amSearchRes.ok) {
      const err = await amSearchRes.json().catch(() => ({}));
      throw new Error(err.error || 'No Apple Music match');
    }
    
    const { url } = await amSearchRes.json();
    return url;
  }

  function displayResults(title, artist, platforms) {
    const links = [];
    
    if (platforms.spotify) {
      links.push(`<a href="${platforms.spotify.url}" target="_blank" rel="noopener">🎧 Open in Spotify</a>`);
    }
    
    if (platforms.youtube) {
      links.push(`<a href="${platforms.youtube}" target="_blank" rel="noopener">▶️ Open in YouTube Music</a>`);
    }
    
    if (platforms.apple) {
      links.push(`<a href="${platforms.apple}" target="_blank" rel="noopener">🎵 Open in Apple Music</a>`);
    }

    if (links.length === 0) {
      resultDiv.innerHTML = '<p>❌ No alternative platforms found for this track.</p>';
      return;
    }

    resultDiv.innerHTML = `
      <p>✅ Found "${title}" by ${artist} on:</p>
      <div class="links">
        ${links.join('')}
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
