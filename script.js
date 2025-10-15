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

    // Regex patterns
    const spotifyRegex = /https?:\/\/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/;
    const ytRegex = /(?:https?:\/\/)?(?:music\.)?youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/;
    const amRegex = /music\.apple\.com\/[a-z]{2}\/album\/[^?]*\?i=([0-9]+)/;

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

    // Regex patterns
    const spotifyRegex = /https?:\/\/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/;
    const ytRegex = /(?:https?:\/\/)?(?:music\.)?youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/;
    const amRegex = /music\.apple\.com\/[a-z]{2}\/album\/[^?]*\?i=([0-9]+)/;

    const spotifyMatch = input.match(spotifyRegex);
    const ytMatch = input.match(ytRegex);
    const amMatch = input.match(amRegex);

    try {
      if (spotifyMatch) {
        const trackId = spotifyMatch[1].split('?')[0];
        statusDiv.textContent = '🔍 Fetching song info...';

        const proxyRes = await fetch(`${proxyUrl}/track/${trackId}`);
        if (!proxyRes.ok) {
          const err = await proxyRes.json().catch(() => ({}));
          throw new Error(err.error || 'Track not found on Spotify');
        }
        const track = await proxyRes.json();
        const title = track.name;
        const artist = track.artists[0].name;
        statusDiv.textContent = `🎵 Found: "${title}" by ${artist}. Searching other platforms...`;

        // For now, default to YouTube Music
        const ytProxyRes = await fetch(`${proxyUrl}/search-youtube?q=${encodeURIComponent(`${title} ${artist}`)}`);
        if (!ytProxyRes.ok) {
          const err = await ytProxyRes.json().catch(() => ({}));
          throw new Error(err.error || 'No YouTube match');
        }
        const { videoId } = await ytProxyRes.json();
        const ytmUrl = `https://music.youtube.com/watch?v=${videoId}`;
        resultDiv.innerHTML = `<p>✅ Open in YouTube Music:</p><a href="${ytmUrl}" target="_blank" rel="noopener">▶️ ${title} - ${artist}</a>`;

      } else if (ytMatch) {
        const videoId = ytMatch[1];
        statusDiv.textContent = '🔍 Fetching video info...';

        const videoInfoRes = await fetch(`${proxyUrl}/get-video-title?v=${videoId}`);
        if (!videoInfoRes.ok) {
          throw new Error('Could not get video info');
        }
        const { title } = await videoInfoRes.json();
        statusDiv.textContent = `🎵 Found: "${title}". Searching Spotify...`;

        const spotifySearchRes = await fetch(`${proxyUrl}/search-spotify?q=${encodeURIComponent(title)}`);
        if (!spotifySearchRes.ok) {
          const err = await spotifySearchRes.json().catch(() => ({}));
          throw new Error(err.error || 'No Spotify match');
        }
        const { name, artist, url } = await spotifySearchRes.json();
        resultDiv.innerHTML = `<p>✅ Open in Spotify:</p><a href="${url}" target="_blank" rel="noopener">🎧 ${name} - ${artist}</a>`;

      } else if (amMatch) {
        const trackId = amMatch[1];
        statusDiv.textContent = '🔍 Fetching Apple Music track...';

        const amRes = await fetch(`${proxyUrl}/apple-track/${trackId}`);
        if (!amRes.ok) {
          const err = await amRes.json().catch(() => ({}));
          throw new Error(err.error || 'Track not found on Apple Music');
        }
        const { name, artist } = await amRes.json();
        statusDiv.textContent = `🎵 Found: "${name}" by ${artist}. Searching Spotify...`;

        const spotifySearchRes = await fetch(`${proxyUrl}/search-spotify?q=${encodeURIComponent(`${name} ${artist}`)}`);
        if (!spotifySearchRes.ok) {
          throw new Error('No Spotify match');
        }
        const { url } = await spotifySearchRes.json();
        resultDiv.innerHTML = `<p>✅ Open in Spotify:</p><a href="${url}" target="_blank" rel="noopener">🎧 ${name} - ${artist}</a>`;

      } else {
        throw new Error('Unsupported link. Use Spotify, YouTube Music, or Apple Music.');
      }

    } catch (err) {
      console.error('Conversion error:', err);
      statusDiv.textContent = `❌ ${err.message || 'Conversion failed. Try again.'}`;
    }
  });

  // Allow Enter key
  inputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      convertBtn.click();
    }
  });
});
