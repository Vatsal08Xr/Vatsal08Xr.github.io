document.getElementById('convertBtn').addEventListener('click', async () => {
  const input = document.getElementById('spotifyLink').value.trim();
  const statusDiv = document.getElementById('status');
  const resultDiv = document.getElementById('result');
  const heading = document.getElementById('heading');

  // Reset UI
  statusDiv.textContent = '';
  resultDiv.innerHTML = '';
  heading.innerHTML = 'Spotify → <span class="ytm">YouTube Music</span>';

  if (!input) {
    statusDiv.textContent = '❌ Please enter a Spotify or YouTube Music link.';
    return;
  }

  const proxyUrl = 'https://spotify-proxy-1.onrender.com'; // ✅ No space!

  // Regex patterns
  const spotifyRegex = /https?:\/\/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/;
  const ytRegex = /(?:https?:\/\/)?(?:music\.)?youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/;

  const spotifyMatch = input.match(spotifyRegex);
  const ytMatch = input.match(ytRegex);

  try {
    if (spotifyMatch) {
      // 🟢 Spotify → YouTube Music
      heading.innerHTML = 'Spotify → <span class="ytm">YouTube Music</span>';
      
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
      statusDiv.textContent = `🎵 Found: "${title}" by ${artist}. Searching YouTube Music...`;

      const ytProxyRes = await fetch(`${proxyUrl}/search-youtube?q=${encodeURIComponent(`${title} ${artist}`)}`);
      if (!ytProxyRes.ok) {
        const err = await ytProxyRes.json().catch(() => ({}));
        throw new Error(err.error || 'No YouTube match');
      }

      const { videoId } = await ytProxyRes.json();
      const ytmUrl = `https://music.youtube.com/watch?v=${videoId}`;

      resultDiv.innerHTML = `
        <p>✅ Open in YouTube Music:</p>
        <a href="${ytmUrl}" target="_blank" rel="noopener">▶️ ${title} - ${artist}</a>
      `;

    } else if (ytMatch) {
      // 🔴 YouTube Music → Spotify
      heading.innerHTML = '<span class="ytm">YouTube Music</span> → Spotify';
      
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
      resultDiv.innerHTML = `
        <p>✅ Open in Spotify:</p>
        <a href="${url}" target="_blank" rel="noopener">🎧 ${name} - ${artist}</a>
      `;

    } else {
      throw new Error('Unsupported link. Use a Spotify or YouTube Music track link.');
    }

    statusDiv.textContent = '';

  } catch (err) {
    console.error('Conversion error:', err);
    statusDiv.textContent = `❌ ${err.message || 'Conversion failed. Try again.'}`;
  }
});

// Allow Enter key
document.getElementById('spotifyLink').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('convertBtn').click();
  }
});