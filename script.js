document.addEventListener('DOMContentLoaded', () => {
  // Tab functionality
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');
      
      // Update active tab button
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Update active tab content
      tabContents.forEach(content => content.classList.remove('active'));
      document.getElementById(`${tabName}-tab`).classList.add('active');
      
      // Update subtitle based on active tab
      const subtitle = document.getElementById('subtitle');
      if (tabName === 'song') {
        subtitle.textContent = 'Paste any Spotify, YouTube Music, or Apple Music song link. Get the other two. Instantly.';
      } else {
        subtitle.textContent = 'Convert entire playlists between Spotify and YouTube Music. Coming soon!';
      }
    });
  });

  // Song conversion functionality
  const songInput = document.getElementById('songLink');
  const convertSongBtn = document.getElementById('convertSongBtn');
  const songStatus = document.getElementById('songStatus');
  const songResult = document.getElementById('songResult');
  const heading = document.getElementById('heading');

  const proxyUrl = 'https://spotify-proxy-1.onrender.com';

  // Update heading as user types in song input
  songInput.addEventListener('input', () => {
    const value = songInput.value.trim();
    if (!value) {
      heading.textContent = 'Spoti2YTM';
      return;
    }

    const spotifyRegex = /https?:\/\/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/;
    const ytRegex = /(?:https?:\/\/)?(?:music\.)?youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/;
    const amRegex = /music\.apple\.com\/(?:[a-z]{2}\/)?(?:album|song)\/[^?]+\/(\d+)/;

    if (spotifyRegex.test(value)) {
      heading.innerHTML = '<span class="spotify">Spotify</span> → <span class="youtube">YouTube Music</span> or <span class="apple">Apple Music</span>';
    } else if (ytRegex.test(value)) {
      heading.innerHTML = '<span class="youtube">YouTube Music</span> → <span class="spotify">Spotify</span> or <span class="apple">Apple Music</span>';
    } else if (amRegex.test(value)) {
      heading.innerHTML = '<span class="apple">Apple Music</span> → <span class="spotify">Spotify</span> or <span class="youtube">YouTube Music</span>';
    } else {
      heading.textContent = 'Spoti2YTM';
    }
  });

  convertSongBtn.addEventListener('click', async () => {
    const input = songInput.value.trim();
    songStatus.textContent = '';
    songResult.innerHTML = '';

    if (!input) {
      songStatus.textContent = '❌ Please enter a Spotify, YouTube Music, or Apple Music link.';
      return;
    }

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
      songStatus.textContent = `❌ ${err.message || 'Conversion failed. Try again.'}`;
    }
  });

  // Playlist conversion functionality
  const playlistInput = document.getElementById('playlistLink');
  const convertPlaylistBtn = document.getElementById('convertPlaylistBtn');
  const playlistStatus = document.getElementById('playlistStatus');
  const playlistResult = document.getElementById('playlistResult');

  convertPlaylistBtn.addEventListener('click', async () => {
    const input = playlistInput.value.trim();
    playlistStatus.textContent = '';
    playlistResult.innerHTML = '';

    if (!input) {
      playlistStatus.textContent = '❌ Please enter a Spotify or YouTube Music playlist link.';
      return;
    }

    const spotifyPlaylistRegex = /https?:\/\/open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/;
    const ytPlaylistRegex = /(?:https?:\/\/)?(?:music\.)?youtube\.com\/.*[?&]list=([a-zA-Z0-9_-]+)/;

    const spotifyMatch = input.match(spotifyPlaylistRegex);
    const ytMatch = input.match(ytPlaylistRegex);

    if (spotifyMatch || ytMatch) {
      // Simulate playlist conversion (to be implemented)
      playlistStatus.textContent = '⏳ Playlist conversion is coming soon! Working on it...';
      setTimeout(() => {
        playlistResult.innerHTML = `
          <p>🎉 Playlist conversion feature is under development!</p>
          <div style="margin-top: 20px; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 12px;">
            <p style="margin-bottom: 10px;">Features being worked on:</p>
            <ul style="text-align: left; color: var(--text-secondary);">
              <li>Batch playlist conversion</li>
              <li>Smart song matching across platforms</li>
              <li>Playlist metadata preservation</li>
              <li>Fast processing for large playlists</li>
            </ul>
          </div>
        `;
      }, 2000);
    } else {
      playlistStatus.textContent = '❌ Please enter a valid Spotify or YouTube Music playlist link.';
    }
  });

  // Allow Enter key in both inputs
  songInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      convertSongBtn.click();
    }
  });

  playlistInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      convertPlaylistBtn.click();
    }
  });

  // Existing conversion functions (keep your existing song conversion logic here)
  async function convertFromSpotify(trackId) {
    songStatus.textContent = '🔍 Fetching song info from Spotify...';

    const proxyRes = await fetch(`${proxyUrl}/track/${trackId}`);
    if (!proxyRes.ok) {
      const err = await proxyRes.json().catch(() => ({}));
      throw new Error(err.error || 'Track not found on Spotify');
    }
    
    const track = await proxyRes.json();
    const title = track.name;
    const artist = track.artists[0].name;
    
    songStatus.textContent = `🎵 Found: "${title}" by ${artist}. Searching other platforms...`;

    const [ytmResult, amResult] = await Promise.allSettled([
      searchYouTubeMusic(title, artist),
      searchAppleMusicDirect(title, artist)
    ]);

    displaySongResults(title, artist, {
      youtube: ytmResult.status === 'fulfilled' ? ytmResult.value : null,
      apple: amResult.status === 'fulfilled' ? amResult.value : null,
      originalPlatform: 'spotify'
    });
  }

  async function convertFromYouTube(videoId) {
    songStatus.textContent = '🔍 Fetching video info from YouTube...';

    const videoInfoRes = await fetch(`${proxyUrl}/get-video-title?v=${videoId}`);
    if (!videoInfoRes.ok) {
      throw new Error('Could not get video info');
    }
    
    const videoInfo = await videoInfoRes.json();
    const title = videoInfo.title;
    
    const { cleanTitle, artist } = extractArtistFromTitle(title);
    
    songStatus.textContent = `🎵 Found: "${cleanTitle}"${artist ? ` by ${artist}` : ''}. Searching other platforms...`;

    const [spotifyResult, amResult] = await Promise.allSettled([
      searchSpotify(artist ? `${cleanTitle} ${artist}` : cleanTitle),
      searchAppleMusicDirect(cleanTitle, artist || '')
    ]);

    const spotifyData = spotifyResult.status === 'fulfilled' ? spotifyResult.value : null;
    const finalArtist = artist || (spotifyData?.artist || 'Unknown Artist');
    
    displaySongResults(cleanTitle, finalArtist, {
      spotify: spotifyData,
      apple: amResult.status === 'fulfilled' ? amResult.value : null,
      originalPlatform: 'youtube'
    });
  }

  function extractArtistFromTitle(title) {
    // Your existing extractArtistFromTitle function
    let match = title.match(/^([^-]+) - ([^-]+)$/);
    if (match) {
      return { artist: match[1].trim(), cleanTitle: match[2].trim() };
    }
    
    if (title.includes(' - ')) {
      const parts = title.split(' - ');
      if (parts.length === 2) {
        const part1 = parts[0].trim();
        const part2 = parts[1].trim();
        
        if (part2.match(/(official|video|audio|lyrics|mv)/i)) {
          return { artist: 'Unknown Artist', cleanTitle: part1 };
        }
        return { artist: part2, cleanTitle: part1 };
      }
    }
    
    match = title.match(/^([^:]+): (.+)$/);
    if (match) {
      return { artist: match[1].trim(), cleanTitle: match[2].trim() };
    }
    
    match = title.match(/^([^(]+) \(feat\. ([^)]+)\)/i);
    if (match) {
      return { artist: match[2].trim(), cleanTitle: match[1].trim() };
    }
    
    match = title.match(/^([^(]+) \(with ([^)]+)\)/i);
    if (match) {
      return { artist: match[2].trim(), cleanTitle: match[1].trim() };
    }
    
    return { artist: null, cleanTitle: title };
  }

  async function convertFromAppleMusic(trackId, originalUrl) {
    songStatus.textContent = '🔍 Fetching Apple Music track info...';

    try {
      const songInfo = await getAppleMusicTrackInfo(originalUrl, trackId);
      
      if (songInfo && songInfo.title && songInfo.title !== 'Unknown Track') {
        songStatus.textContent = `🎵 Found: "${songInfo.title}" by ${songInfo.artist}. Searching other platforms...`;

        const [spotifyResult, ytmResult] = await Promise.allSettled([
          searchSpotify(`${songInfo.title} ${songInfo.artist}`),
          searchYouTubeMusic(songInfo.title, songInfo.artist)
        ]);

        displaySongResults(songInfo.title, songInfo.artist, {
          spotify: spotifyResult.status === 'fulfilled' ? spotifyResult.value : null,
          youtube: ytmResult.status === 'fulfilled' ? ytmResult.value : null,
          originalPlatform: 'apple'
        });
      } else {
        throw new Error('Could not retrieve song information from Apple Music');
      }
    } catch (error) {
      console.error('Apple Music conversion error:', error);
      songStatus.textContent = '❌ Could not convert Apple Music link. The proxy may not support Apple Music yet.';
    }
  }

  async function getAppleMusicTrackInfo(url, trackId) {
    // Your existing getAppleMusicTrackInfo function
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

    const urlInfo = extractSongInfoFromAppleUrl(url);
    if (urlInfo.title && urlInfo.title !== 'Unknown Track') {
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
    // Your existing extractSongInfoFromAppleUrl function
    try {
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split('/').filter(segment => segment);
      
      let songName = '';
      
      for (let i = 0; i < pathSegments.length; i++) {
        if (pathSegments[i] === 'song') {
          if (i + 1 < pathSegments.length) {
            songName = pathSegments[i + 1];
            break;
          }
        }
      }
      
      if (songName) {
        songName = decodeURIComponent(songName);
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

  function displaySongResults(title, artist, platforms) {
    const links = [];
    
    if (platforms.originalPlatform !== 'spotify' && platforms.spotify) {
      links.push({
        url: platforms.spotify.url,
        text: `<span class="platform-logo spotify-logo">Spotify</span>`,
        platform: 'spotify',
        songInfo: `${platforms.spotify.name || title} - ${platforms.spotify.artist || artist}`
      });
    }
    
    if (platforms.originalPlatform !== 'youtube' && platforms.youtube) {
      const ytData = platforms.youtube;
      links.push({
        url: ytData.url,
        text: `<span class="platform-logo youtube-logo">YouTube Music</span>`,
        platform: 'youtube',
        songInfo: `${ytData.title || title} - ${ytData.artist || artist}`
      });
    }
    
    if (platforms.originalPlatform !== 'apple' && platforms.apple) {
      const amData = platforms.apple;
      links.push({
        url: amData.url,
        text: `<span class="platform-logo apple-logo">Apple Music</span>`,
        platform: 'apple',
        songInfo: `${amData.title || title} - ${amData.artist || artist}`
      });
    }

    if (links.length === 0) {
      songResult.innerHTML = '<p>❌ No alternative platforms found for this track.</p>';
      return;
    }

    const linksHTML = links.map(link => 
      `<div class="platform-link">
        <a href="${link.url}" target="_blank" rel="noopener" class="${link.platform}-link">${link.text}</a>
        <div class="song-info">${link.songInfo}</div>
       </div>`
    ).join('');

    songResult.innerHTML = `
      <p>✅ Converted "${title}" by ${artist} to:</p>
      <div class="links">
        ${linksHTML}
      </div>
    `;
  }
});
