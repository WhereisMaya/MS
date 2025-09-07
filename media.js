// ===== MINDS EYE - MEDIA HANDLING =====

// Centralized logging system - OPTIMIZED FOR PERFORMANCE & ORGANIZATION
(function() {
    const LOG_LEVELS = {
        ERROR: 0,
        WARN: 1,
        INFO: 2,
        DEBUG: 3
    };

    // Set to WARN for media operations - reduces console spam while keeping important media info
    let currentLogLevel = LOG_LEVELS.WARN;
    let logCount = 0;
    const MAX_LOGS_PER_SECOND = 3; // Allow slightly more logs for media operations
    let lastLogTime = 0;
    const MIN_LOG_INTERVAL = 150; // Slightly more frequent than main.js for media feedback

    // Log categorization for better organization
    const LOG_CATEGORIES = {
        MEDIA: '🎵',
        VIDEO: '🎬',
        AUDIO: '🔊',
        PLAYLIST: '📋',
        UPLOAD: '📁',
        SYSTEM: '⚙️',
        ERROR: '❌',
        SUCCESS: '✅',
        WARNING: '⚠️'
    };

    function log(level, message, data = null, category = 'SYSTEM') {
        const now = Date.now();

        // Rate limiting: only log if enough time has passed and we're under the limit
        if (level <= currentLogLevel &&
            logCount < MAX_LOGS_PER_SECOND &&
            (now - lastLogTime) >= MIN_LOG_INTERVAL) {

            const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
            const categoryIcon = LOG_CATEGORIES[category] || LOG_CATEGORIES.SYSTEM;
            const prefix = `[MEDIA:${timestamp}] ${categoryIcon} `;

            switch (level) {
                case LOG_LEVELS.ERROR:
                    console.error(prefix + message, data);
                    break;
                case LOG_LEVELS.WARN:
                    console.warn(prefix + message, data);
                    break;
                case LOG_LEVELS.INFO:
                    console.info(prefix + message, data);
                    break;
                case LOG_LEVELS.DEBUG:
                    console.log(prefix + message, data);
                    break;
            }
            logCount++;
            lastLogTime = now;
        }
    }

    // Reset log counter every second
    setInterval(() => { logCount = 0; }, 1000);

    // Enhanced logging utility functions with categorization
    const logger = {
        error: (msg, data, category = 'ERROR') => log(LOG_LEVELS.ERROR, msg, data, category),
        warn: (msg, data, category = 'WARNING') => log(LOG_LEVELS.WARN, msg, data, category),
        info: (msg, data, category = 'SYSTEM') => log(LOG_LEVELS.INFO, msg, data, category),
        debug: (msg, data, category = 'SYSTEM') => {
            // Only log debug messages every N frames to prevent spam in animation loops
            if (typeof window.frameCounter !== 'undefined') {
                if (window.frameCounter % 60 === 0) { // Log every 60 frames (once per second at 60fps)
                    log(LOG_LEVELS.DEBUG, msg, data, category);
                }
            } else {
                // Fallback to regular debug if frameCounter not available
                log(LOG_LEVELS.DEBUG, msg, data, category);
            }
        },
        debugSparse: (msg, data, interval = 120, category = 'SYSTEM') => {
            // Frame-based logging control to prevent spam in animation loops
            if (typeof window.frameCounter !== 'undefined') {
                if (window.frameCounter % interval === 0) {
                    log(LOG_LEVELS.DEBUG, msg, data, category);
                }
            } else {
                // Fallback to regular debug if frameCounter not available
                log(LOG_LEVELS.DEBUG, msg, data, category);
            }
        },
        // Category-specific logging methods for better organization
        media: (msg, data) => log(LOG_LEVELS.INFO, msg, data, 'MEDIA'),
        video: (msg, data) => log(LOG_LEVELS.INFO, msg, data, 'VIDEO'),
        audio: (msg, data) => log(LOG_LEVELS.INFO, msg, data, 'AUDIO'),
        playlist: (msg, data) => log(LOG_LEVELS.INFO, msg, data, 'PLAYLIST'),
        upload: (msg, data) => log(LOG_LEVELS.INFO, msg, data, 'UPLOAD'),
        success: (msg, data) => log(LOG_LEVELS.INFO, msg, data, 'SUCCESS'),
        // Performance monitoring
        performance: (msg, data) => {
            if (typeof window.frameCounter !== 'undefined' && window.frameCounter % 120 === 0) {
                log(LOG_LEVELS.DEBUG, `⚡ ${msg}`, data, 'SYSTEM');
            }
        }
    };

    // Make logger available globally for this file
    window.mediaLogger = logger;
    window.logger = logger; // Also make it available as 'logger' for consistency with main.js
    
    // Expose logging constants for external use
    window.MEDIA_LOG_LEVELS = LOG_LEVELS;
    window.MEDIA_LOG_CATEGORIES = LOG_CATEGORIES;
})();

// ===== VIDEO PLAYLIST VARIABLES =====
let uploadedPlaylists = [];
let currentPlaylistIndex = -1;


// ===== VIDEO CONTROLS AUTO-HIDE VARIABLES =====
let videoControlsTimeout = null;
let videoControlsVisible = true;

// ===== MUSIC VISUALIZER VARIABLES =====
let visualizerInterval = null;
let isMusicPlaying = false;
let currentVisualizerColors = [];

// ===== IDEA ID ASSIGNMENT FOR ANIMATION MAPPING =====
let ideaUidCounter = 1;
function ensureIdeaUids() {
  try {
    if (!Array.isArray(ideas)) return;
    for (let i = 0; i < ideas.length; i++) {
      const idea = ideas[i];
      if (idea && !idea._uid) {
        idea._uid = ideaUidCounter++;
      }
    }
  } catch (e) {
    // non-fatal
  }
}

// ===== VISUALIZER READY CHECK =====
function waitForVisualizer(callback) {
    if (typeof window.LocalVisualizer !== 'undefined') {
        callback(window.LocalVisualizer);
    } else {
        window.addEventListener('visualizerReady', () => {
            callback(window.LocalVisualizer);
        }, { once: true });
    }
}

// ===== UTILITY FUNCTIONS =====
function formatTime(seconds) {
  if (isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ===== YOUTUBE FUNCTIONS =====

function loadYouTubeVideo() {
  const url = document.getElementById("youtubeLink").value;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^\s&]+)/);
  const video = document.getElementById("bgVideo");
  const iframe = document.getElementById("ytFrame");
  
  if (match) {
    const videoId = match[1];
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}`;
    backgroundImage = null;
    video.style.display = "none";
    video.pause();
    iframe.src = embedUrl;
    iframe.style.display = "block";
  } else {
    alert("Invalid YouTube URL.");
  }
}

// ===== YOUTUBE IFRAME API SUPPORT =====
let youTubeApiReady = null;
let ytPlayer = null;
let unembeddableVideoIds = new Set();

function ensureYouTubeAPI() {
  if (youTubeApiReady) return youTubeApiReady;
  youTubeApiReady = new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = function() {
      resolve();
    };
  });
  return youTubeApiReady;
}

function initYouTubePlayer(videoId) {
  const iframeEl = document.getElementById('videoIframe');
  if (!iframeEl) return;
  ytPlayer = new YT.Player('videoIframe', {
    videoId: videoId,
    playerVars: { autoplay: 1, controls: 1, rel: 0, modestbranding: 1 },
    events: {
      onReady: function() {
        try { ytPlayer.playVideo(); } catch (e) {}
      },
      onError: function(e) {
        // 101/150: embedding disabled by owner
        if (e && (e.data === 101 || e.data === 150)) {
          unembeddableVideoIds.add(videoId);
          logger.warn('📺 Embedding disabled by owner for video', videoId, 'VIDEO');
          // Try next video if available, otherwise offer to open on YouTube
          if (typeof window.videoNext === 'function') {
            window.videoNext();
          } else {
            const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
            window.open(watchUrl, '_blank');
          }
        }
      }
    }
  });
}

// ===== MUSIC FUNCTIONS =====

function toggleMusicPanel() {
  const musicPanel = document.getElementById('musicPanel');
  if (musicPanel.style.display === 'none' || musicPanel.style.display === '') {
    musicPanel.style.display = 'block';
    loadMusicList();
    
    // Highlight currently playing track if any
    highlightCurrentTrack();
    // Sync DOM index so Next/Prev continue correctly after reopen
    syncCurrentMusicDomIndex();
    
    // Update now playing info
    updateNowPlayingInfo();
    
    // Load PNG images for music control buttons
    setTimeout(() => {
      PNG_CONFIG.musicPanel.forEach(({ dataIcon, file }) => {
        const button = PNGLoader.findButtonInContainer(dataIcon, '#musicPanel');
        if (button) {
          PNGLoader.applyPNG(button, file);
        }
      });
    }, 100);
    
    // Auto-hide after 60 seconds
    setTimeout(() => {
      musicPanel.style.display = 'none';
    }, 60000);
  } else {
    musicPanel.style.display = 'none';
  }
}

function closeMusicPanel() {
  const musicPanel = document.getElementById('musicPanel');
  if (musicPanel) {
    musicPanel.style.display = 'none';
  }
}

function updateNowPlayingInfo() {
  const nowPlayingInfo = document.getElementById('nowPlayingInfo');
  if (!nowPlayingInfo) return;
  
  if (!window.currentAudio || !window.currentAudio.src) {
    nowPlayingInfo.textContent = 'No track playing';
    return;
  }
  
  const src = window.currentAudio.src;
  
  // Check if it's a radio stream
  if (src.includes('http') && (src.includes('stream') || src.includes('radio') || src.includes('live'))) {
    // For radio streams, try to get metadata or show station info
    if (window.currentRadioUrl) {
      // Try to extract station name from URL
      try {
        const url = new URL(window.currentRadioUrl);
        const hostname = url.hostname.replace('www.', '');
        nowPlayingInfo.textContent = `📻 ${hostname}`;
      } catch (e) {
        nowPlayingInfo.textContent = '📻 Radio Stream';
      }
    } else {
      nowPlayingInfo.textContent = '📻 Radio Stream';
    }
  } else {
    // For local music files, show filename
    try {
      const filename = src.split('/').pop() || src.split('\\').pop() || 'Unknown Track';
      const cleanName = filename.replace(/\.(mp3|wav|ogg|m4a)$/i, '');
      nowPlayingInfo.textContent = `🎵 ${cleanName}`;
    } catch (e) {
      nowPlayingInfo.textContent = '🎵 Music Track';
    }
  }
}

async function loadMusicList() {
  const musicList = document.getElementById('musicList');
  
  // Try to load tracks from tracklist.txt, fall back to default
  let musicFiles = [];
  const possiblePaths = [
    'tracklist.txt',
    './tracklist.txt',
    '/tracklist.txt'
  ];
  
  let loaded = false;
  for (const path of possiblePaths) {
    try {
      const response = await fetch(path);
      if (response.ok) {
        const content = await response.text();
        musicFiles = content.split('\n').filter(line => line.trim() !== '');
        loaded = true;
        break;
      }
    } catch (error) {
      // Error logging removed for performance
    }
  }
  
  if (!loaded) {
    musicFiles = getDefaultPlaylist();
  }
  
  // Add uploaded playlist if available
  if (window.uploadedMusicPlaylist && window.uploadedMusicPlaylist.length > 0) {
    const uploadedTracks = window.uploadedMusicPlaylist.map(track => {
      if (typeof track === 'string') {
        // Parse string format (Title|URL or just URL)
        const parts = track.split('|');
        if (parts.length === 2) {
          return {
            title: parts[0].trim(),
            url: parts[1].trim()
          };
        } else {
          // Use filename as title
          const url = track.trim();
          const filename = url.split('/').pop() || url;
          return {
            title: filename,
            url: url
          };
        }
      }
      return track;
    });
    
    // Add uploaded tracks to the beginning of the list
    musicFiles = [...uploadedTracks, ...musicFiles];
  }
  
  // Parse tracks into the new object format
  const parsedTracks = musicFiles.map(track => {
    if (typeof track === 'object' && track.title && track.url) {
      // Already in correct format
      return track;
    } else if (typeof track === 'string') {
      // Parse string format (Title|URL or just URL)
      const parts = track.split('|');
      if (parts.length === 2) {
        const parsedTrack = {
          title: parts[0].trim(),
          url: parts[1].trim()
        };
        return parsedTrack;
      } else {
        // Fallback for old format - use filename as title
        const url = track.trim();
        const filename = url.split('/').pop() || url;
        const parsedTrack = {
          title: filename,
          url: url
        };
        return parsedTrack;
      }
    }
    return track;
  });
  
  musicFiles = parsedTracks;
  
  musicList.innerHTML = '';
  
  // Check browser audio support
  const audio = new Audio();
  const canPlayMp3 = audio.canPlayType('audio/mpeg');
  const canPlayOpus = audio.canPlayType('audio/opus');
  
  musicFiles.forEach((track, index) => {
    // Track processing logging removed for performance
    const musicItem = document.createElement('div');
    musicItem.className = 'music-item';
    
    // Check if it's a radio stream or local file
    if (track.url.startsWith('http://') || track.url.startsWith('https://')) {
      // Radio stream
      const displayName = `📻 ${track.title}`;
      musicItem.textContent = displayName;
      musicItem.style.borderLeft = '3px solid #9C27B0';
      musicItem.title = `Radio Stream: ${track.url}`;
      // Mark item metadata for reliable matching
      musicItem.dataset.type = 'radio';
      musicItem.dataset.radioUrl = track.url;
      // Radio item created
    } else {
      // Local file
      const filename = track.url.split('/').pop();
      const isOpus = filename.toLowerCase().endsWith('.opus');
      const displayName = isOpus ? `${track.title} 🎵` : track.title;
      musicItem.textContent = displayName;
      
      // Add visual indicator for OPUS files
      if (isOpus) {
        musicItem.style.borderLeft = '3px solid #ff6b6b';
        musicItem.title = 'OPUS format - may not work in all browsers';
      }
      // Mark item metadata for reliable matching
      musicItem.dataset.type = 'file';
      musicItem.dataset.url = track.url;
      // Music item created
    }
    
    musicItem.onclick = (event) => {
      if (track.url.startsWith('http://') || track.url.startsWith('https://')) {
        // Use the playlist-aware version so highlighting follows DOM order
        playRadioStreamFromPlaylist(track.url, index);
      } else {
        playMusic(track.url, event);
      }
      // Update stored DOM index so next/prev navigate correctly
      currentMusicDomIndex = index;
    };
    musicList.appendChild(musicItem);
  });
  
  // Show the existing seek bar (now positioned between next and radio buttons)
  const musicPlayerSlider = document.getElementById('musicPlayerSlider');
  if (musicPlayerSlider) {
    musicPlayerSlider.style.display = 'block';
  }
  
  // Set up seeking bar functionality
  const seekBar = document.getElementById('musicSeekBar');
  const timeDisplay = document.getElementById('musicTime');
  
  if (seekBar && timeDisplay) {
    seekBar.addEventListener('input', function() {
      if (window.currentAudio) {
        const seekTime = (seekBar.value / 100) * window.currentAudio.duration;
        window.currentAudio.currentTime = seekTime;
      }
    });
    
    // Update seeking bar during playback
    setInterval(() => {
      if (window.currentAudio && !window.currentAudio.paused) {
        const progress = (window.currentAudio.currentTime / window.currentAudio.duration) * 100;
        seekBar.value = progress;
        
        const currentTime = formatTime(window.currentAudio.currentTime);
        const totalTime = formatTime(window.currentAudio.duration);
        timeDisplay.textContent = `${currentTime} / ${totalTime}`;
      }
    }, 100);
  }
}

function playMusic(filename, event) {
  // Remove playing class from all items and reset background
  const musicItems = document.querySelectorAll('.music-item');
  
  musicItems.forEach(item => {
    item.classList.remove('playing');
    item.style.background = 'rgba(0, 0, 0, 0.6)';
  });

  // Add playing class to clicked item
  if (event && event.target) {
    event.target.classList.add('playing');
    event.target.style.background = '#35CF3A';
  }
  
  // Mark playlist as started when any music is played
  isPlaylistStarted = true;

  // Check if it's an OPUS file
  const isOpus = filename.toLowerCase().endsWith('.opus');
  
  if (isOpus) {
    // Check if browser supports OPUS
    const audio = new Audio();
    const canPlayOpus = audio.canPlayType('audio/opus');
    
    if (canPlayOpus === 'probably' || canPlayOpus === 'maybe') {
      // Browser supports OPUS natively
    } else {
      // Browser may not support OPUS natively, trying anyway
    }
  }

  // Create audio element and play
  const audio = new Audio(filename);
  audio.volume = 0.5; // Set volume to 50%

  // Clear radio URL tracking since we're playing a file track
  window.currentRadioUrl = null;
  window.currentRadioTitle = null;

  // Stop any currently playing audio
  if (window.currentAudio) {
    window.currentAudio.pause();
    window.currentAudio = null;
  }

  window.currentAudio = audio;
  updateNowPlayingInfo();
  // Ensure DOM index reflects the clicked item
  if (event && event.target) {
    const items = document.querySelectorAll('.music-item');
    currentMusicDomIndex = Array.prototype.indexOf.call(items, event.target.closest('.music-item'));
  }

  // Enhance music playback with better controls and monitoring
  const cleanupEnhancement = enhanceMusicPlayback(audio);

  // Add event listeners to detect when music ends naturally
  audio.addEventListener('ended', () => {
    if (audio !== window.currentAudio) return;
    isMusicPlaying = false;
    stopMusicVisualizer();
    
    // Clean up enhancement
    if (cleanupEnhancement) cleanupEnhancement();
    
    // Auto-advance to next track if we're in playlist mode
    if (musicPlaylist.length > 0 && isMusicLooping) {
      setTimeout(() => {
        nextMusicTrack();
      }, 1000); // 1 second delay before next track
    } else {
      // Update music button to show inactive state
      const musicButton = document.querySelector('[data-icon="music"]');
      if (musicButton && typeof PNGLoader !== 'undefined') {
        PNGLoader.applyPNG(musicButton, 'music.png');
      }
    }
  });

  audio.addEventListener('pause', () => {
    if (audio !== window.currentAudio) return;
    isMusicPlaying = false;
    stopMusicVisualizer();
    // Update music button to show inactive state
    const musicButton = document.querySelector('[data-icon="music"]');
    if (musicButton && typeof PNGLoader !== 'undefined') {
      PNGLoader.applyPNG(musicButton, 'music.png');
    }
  });

  audio.addEventListener('play', () => {
    if (audio !== window.currentAudio) return;
    isMusicPlaying = true;
    startMusicVisualizer();
    // Update music button to show active state
    const musicButton = document.querySelector('[data-icon="music"]');
    if (musicButton && typeof PNGLoader !== 'undefined') {
      PNGLoader.applyPNG(musicButton, 'music2.png');
    }
  });

  audio.play().then(() => {
    // Update music button to show active state
    const musicButton = document.querySelector('[data-icon="music"]');
    if (musicButton && typeof PNGLoader !== 'undefined') {
      PNGLoader.applyPNG(musicButton, 'music2.png');
    }
  }).catch(err => {
    logger.error(`Error playing audio: ${err}`, null, 'AUDIO');
    
    // If OPUS fails, try to provide helpful error message
    if (filename.toLowerCase().endsWith('.opus')) {
      logger.error('OPUS playback failed. This might be due to:', {
        reasons: [
          'Browser not supporting OPUS format',
          'Missing OPUS codec', 
          'File corruption',
          'CORS issues'
        ]
      });
    }
    
    if (event && event.target) {
      event.target.classList.remove('playing');
    }
  });
}

// Global music playlist variables
let musicPlaylist = [];
let currentMusicIndex = 0;
let isMusicLooping = true;
let isPlaylistStarted = false; // Track if playlist has been started
let isMediaToolbarMinimized = false; // Track if media toolbar is minimized
let isMediaToolbarVisible = false; // Track if media toolbar is visible
// Shuffle and DOM index tracking
let isMusicShuffle = false; // When true, Next selects a random item from the visible list
let currentMusicDomIndex = -1; // Tracks the index within the visible music list

function stopMusic() {
  // Toggle play/pause for currently playing audio
  if (window.currentAudio) {
    if (window.currentAudio.paused) {
      window.currentAudio.play();
      isMusicPlaying = true;
      startMusicVisualizer();
      
      // Update music button to show active state
      const musicButton = document.querySelector('[data-icon="music"]');
      if (musicButton && typeof PNGLoader !== 'undefined') {
        PNGLoader.applyPNG(musicButton, 'music2.png');
      }
    } else {
      window.currentAudio.pause();
      isMusicPlaying = false;
      stopMusicVisualizer();
      
      // Update music button to show inactive state
      const musicButton = document.querySelector('[data-icon="music"]');
      if (musicButton && typeof PNGLoader !== 'undefined') {
        PNGLoader.applyPNG(musicButton, 'music.png');
      }
      
      // Update now playing info
      updateNowPlayingInfo();
    }
  } else {
    logger.audio("No music currently loaded");
    isMusicPlaying = false;
    stopMusicVisualizer();
    
    // Update music button to show inactive state
    const musicButton = document.querySelector('[data-icon="music"]');
    if (musicButton && typeof PNGLoader !== 'undefined') {
      PNGLoader.applyPNG(musicButton, 'music.png');
    }
    
    // Update now playing info
    updateNowPlayingInfo();
  }
}

async function loadMusicPlaylist() {
  // Try different possible paths for the tracklist file
  const possiblePaths = [
    'tracklist.txt',
    './tracklist.txt',
    '/tracklist.txt'
  ];
  
  for (const path of possiblePaths) {
    try {
      const response = await fetch(path);
      
      if (response.ok) {
        const content = await response.text();
        const lines = content.split('\n').filter(line => line.trim() !== '');
        
        // Parse tracks with titles (format: "Title|URL" or just "URL")
        const tracks = lines.map(line => {
          const parts = line.split('|');
          if (parts.length === 2) {
            return {
              title: parts[0].trim(),
              url: parts[1].trim()
            };
          } else {
            // Fallback for old format - use filename as title
            const url = line.trim();
            const filename = url.split('/').pop() || url;
            return {
              title: filename,
              url: url
            };
          }
        });
        
        musicPlaylist = tracks;
        return true;
      }
    } catch (error) {
      // Error logging removed for performance
    }
  }
  
  return false;
}

function getDefaultPlaylist() {
  return [
    { title: 'Track 1', url: 'mp3/track1.mp3' },
    { title: 'Track 1 NGE', url: 'mp3/Track1NGE.mp3' },
    { title: 'Stereotype Anomaly - HEMPHILL (2025)', url: 'mp3/Stereotype Anomaly - HEMPHILL (2025).mp3' },
    { title: 'Track 2 D+B', url: 'mp3/Track2D+B.mp3' },
    { title: 'Track 2', url: 'mp3/track2.mp3' },
    { title: 'Track 3', url: 'mp3/track3.mp3' },
    { title: 'Track 4', url: 'mp3/track4.mp3' },
    { title: 'Track 5', url: 'mp3/track5.mp3' },
    { title: 'Track 6', url: 'mp3/track6.mp3' },
    { title: 'Track 7', url: 'mp3/track7.mp3' },
    { title: 'Track 8', url: 'mp3/track8.mp3' }
  ];
}

async function startMusicPlaylist() {
  // Load playlist from file if not already loaded
  if (musicPlaylist.length === 0) {
    const loaded = await loadMusicPlaylist();
    if (!loaded) {
      musicPlaylist = getDefaultPlaylist();
    }
  }
  
  // Start playing from the beginning
  if (musicPlaylist.length > 0) {
    currentMusicIndex = 0;
    isPlaylistStarted = true;
    playMusicFromPlaylist(currentMusicIndex);
  }
}

function playMusicFromPlaylist(index) {
  if (index >= 0 && index < musicPlaylist.length) {
    currentMusicIndex = index;
    // Also sync the DOM index for navigation
    syncCurrentMusicDomIndex();
    const track = musicPlaylist[index];
    
    // Update visual indicators
    const musicItems = document.querySelectorAll('.music-item');
    
    musicItems.forEach((item, i) => {
      item.classList.remove('playing');
      item.style.background = 'rgba(0, 0, 0, 0.6)';
      if (i === index) {
        item.classList.add('playing');
        item.style.background = '#35CF3A';
      }
    });
    
    // Check if it's a radio stream (URL) or local file
    if (track.url.startsWith('http://') || track.url.startsWith('https://')) {
      // For radio streams, we need to pass the index to maintain highlighting
      playRadioStreamFromPlaylist(track.url, index);
      // Radio stream playing
      // Start visualizer for radio streams with 1 second delay
      isMusicPlaying = true;
      setTimeout(() => {
        if (isMusicPlaying) {
      startMusicVisualizer();
        }
      }, 1000);
    } else {
      playMusic(track.url);
      logger.audio(`Playing track ${index + 1}/${musicPlaylist.length}: ${track.title}`);
      // Start visualizer for any music playback with 1 second delay
      isMusicPlaying = true;
      setTimeout(() => {
        if (isMusicPlaying) {
      startMusicVisualizer();
        }
      }, 1000);
    }
  }
}

function playRadioStream(radioUrl) {
  try {
    logger.audio(`playRadioStream called with URL: ${radioUrl}`);
    
    // Stop current music
    if (window.currentAudio) {
      window.currentAudio.pause();
      window.currentAudio = null;
    }
    
    // Mark playlist as started when radio is played
    isPlaylistStarted = true;
    
    // Find and highlight the radio item in the music panel
    const musicItems = document.querySelectorAll('.music-item');
    logger.debug(`Found ${musicItems.length} music items to check for radio`, null, 'AUDIO');
    
    musicItems.forEach((item, index) => {
      item.classList.remove('playing');
      item.style.background = 'rgba(0, 0, 0, 0.6)';
      
      // Check if this item contains the radio URL
      const itemText = item.textContent || '';
      if (itemText.includes(radioUrl) || item.getAttribute('onclick')?.includes(radioUrl)) {
        item.classList.add('playing');
        item.style.background = '#35CF3A';
        logger.debug(`Highlighted radio item ${index}:`, { itemText: itemText }, 'AUDIO');
      }
    });
    
    // Create new audio element for radio
    const audio = new Audio(radioUrl);
    audio.volume = 0.5;
    
    // Add event listeners
    audio.addEventListener('ended', () => {
      if (audio !== window.currentAudio) return;
      logger.audio('Radio stream ended');
      const musicButton = document.querySelector('[data-icon="music"]');
      if (musicButton && typeof PNGLoader !== 'undefined') {
        PNGLoader.applyPNG(musicButton, 'music.png');
      }
    });

    audio.addEventListener('pause', () => {
      if (audio !== window.currentAudio) return;
      logger.audio('Radio paused');
      const musicButton = document.querySelector('[data-icon="music"]');
      if (musicButton && typeof PNGLoader !== 'undefined') {
        PNGLoader.applyPNG(musicButton, 'music.png');
      }
    });

    audio.addEventListener('play', () => {
      if (audio !== window.currentAudio) return;
      logger.audio('Radio started playing');
      const musicButton = document.querySelector('[data-icon="music"]');
      if (musicButton && typeof PNGLoader !== 'undefined') {
        PNGLoader.applyPNG(musicButton, 'music2.png');
      }
      
      // Start music visualizer when radio begins playing with 1 second delay
      isMusicPlaying = true;
      setTimeout(() => {
        if (isMusicPlaying) {
      startMusicVisualizer();
        }
      }, 1000);
    });
    
    window.currentAudio = audio;
    audio.play().then(() => {
      logger.audio('Radio station loaded and playing');
      const musicButton = document.querySelector('[data-icon="music"]');
      if (musicButton && typeof PNGLoader !== 'undefined') {
        PNGLoader.applyPNG(musicButton, 'music2.png');
      }
      
      // Start music visualizer when radio begins playing with 1 second delay
      isMusicPlaying = true;
      setTimeout(() => {
        if (isMusicPlaying) {
      startMusicVisualizer();
        }
      }, 1000);
    }).catch(err => {
      logger.error('Error loading radio station', { error: err }, 'AUDIO');
      alert('Failed to load radio station. Please check the URL.');
    });
  } catch (error) {
    logger.error('Error creating radio audio', { error: error }, 'AUDIO');
    alert('Failed to load radio station. Please check the URL.');
  }
}

function playRadioStreamFromPlaylist(radioUrl, index) {
  try {
    logger.audio(`playRadioStreamFromPlaylist called with URL: ${radioUrl}, index: ${index}`);
    
    // Stop current music
    if (window.currentAudio) {
      window.currentAudio.pause();
      window.currentAudio = null;
    }
    
    // Mark playlist as started when radio is played
    isPlaylistStarted = true;
    
    // Update visual indicators using the index
    const musicItems = document.querySelectorAll('.music-item');
    logger.debug(`Found ${musicItems.length} music items to highlight`, null, 'AUDIO');
    
    musicItems.forEach((item, i) => {
      item.classList.remove('playing');
      item.style.background = 'rgba(0, 0, 0, 0.6)';
      if (i === index) {
        item.classList.add('playing');
        item.style.background = '#35CF3A';
        logger.debug(`Highlighted radio item ${i}:`, { itemText: item.textContent }, 'AUDIO');
      }
    });
    // Sync current DOM index and logical index
    currentMusicDomIndex = index;
    currentMusicIndex = index;
    
    // Create new audio element for radio
    const audio = new Audio(radioUrl);
    audio.volume = 0.5;
    
    // Add event listeners
    audio.addEventListener('ended', () => {
      if (audio !== window.currentAudio) return;
      logger.audio('Radio stream ended');
      const musicButton = document.querySelector('[data-icon="music"]');
      if (musicButton && typeof PNGLoader !== 'undefined') {
        PNGLoader.applyPNG(musicButton, 'music.png');
      }
      
      // Stop music visualizer when radio ends
      isMusicPlaying = false;
      stopMusicVisualizer();
    });

    audio.addEventListener('pause', () => {
      if (audio !== window.currentAudio) return;
      logger.audio('Radio paused');
      const musicButton = document.querySelector('[data-icon="music"]');
      if (musicButton && typeof PNGLoader !== 'undefined') {
        PNGLoader.applyPNG(musicButton, 'music.png');
      }
      
      // Stop music visualizer when radio is paused
      isMusicPlaying = false;
      stopMusicVisualizer();
    });

    audio.addEventListener('play', () => {
      if (audio !== window.currentAudio) return;
      logger.audio('Radio started playing');
      const musicButton = document.querySelector('[data-icon="music"]');
      if (musicButton && typeof PNGLoader !== 'undefined') {
        PNGLoader.applyPNG(musicButton, 'music2.png');
      }
      
      // Start music visualizer when radio begins playing with 1 second delay
      isMusicPlaying = true;
      setTimeout(() => {
        if (isMusicPlaying) {
      startMusicVisualizer();
        }
      }, 1000);
    });
    
    window.currentAudio = audio;
    updateNowPlayingInfo();
    audio.play().then(() => {
      logger.audio('Radio station loaded and playing');
      const musicButton = document.querySelector('[data-icon="music"]');
      if (musicButton && typeof PNGLoader !== 'undefined') {
        PNGLoader.applyPNG(musicButton, 'music2.png');
      }
      
      // Start music visualizer when radio begins playing with 1 second delay
      isMusicPlaying = true;
      setTimeout(() => {
        if (isMusicPlaying) {
      startMusicVisualizer();
        }
      }, 1000);
    }).catch(err => {
      logger.error('Error loading radio station', { error: err }, 'AUDIO');
      alert('Failed to load radio station. Please check the URL.');
    });
  } catch (error) {
    logger.error('Error creating radio audio', { error: error }, 'AUDIO');
    alert('Failed to load radio station. Please check the URL.');
  }
}

function nextMusicTrack() {
  // Always navigate in the order currently displayed in the music panel
  const musicItems = document.querySelectorAll('.music-item');
  if (musicItems.length === 0) {
    logger.audio('No music tracks or radio stations available');
    return;
  }

  // Determine current index by stored DOM index first, fallback to highlighted element
  let currentIndex = (typeof currentMusicDomIndex === 'number' && currentMusicDomIndex >= 0) ? currentMusicDomIndex : -1;
  if (currentIndex === -1) {
    const playingItem = document.querySelector('.music-item.playing');
    if (playingItem) {
      currentIndex = Array.prototype.indexOf.call(musicItems, playingItem);
    }
  }

  // Shuffle support
  let nextIndex;
  if (isMusicShuffle) {
    // Pick a random different index if more than 1 item
    if (musicItems.length > 1) {
      do {
        nextIndex = Math.floor(Math.random() * musicItems.length);
      } while (nextIndex === currentIndex);
    } else {
      nextIndex = 0;
    }
  } else {
    nextIndex = currentIndex >= 0 ? (currentIndex + 1) % musicItems.length : 0;
  }
  logger.debug(`Clicking next DOM item at index: ${nextIndex}`, null, 'AUDIO');
  musicItems[nextIndex].click();
  currentMusicDomIndex = nextIndex;
}

function previousMusicTrack() {
  // Always navigate in the order currently displayed in the music panel
  const musicItems = document.querySelectorAll('.music-item');
  if (musicItems.length === 0) {
    logger.audio('No music tracks or radio stations available');
    return;
  }

  // Determine current index by stored DOM index first, fallback to highlighted element
  let currentIndex = (typeof currentMusicDomIndex === 'number' && currentMusicDomIndex >= 0) ? currentMusicDomIndex : -1;
  if (currentIndex === -1) {
    const playingItem = document.querySelector('.music-item.playing');
    if (playingItem) {
      currentIndex = Array.prototype.indexOf.call(musicItems, playingItem);
    }
  }

  const prevIndex = currentIndex >= 0 ? (currentIndex - 1 + musicItems.length) % musicItems.length : musicItems.length - 1;
  logger.debug(`Clicking previous DOM item at index: ${prevIndex}`, null, 'AUDIO');
  musicItems[prevIndex].click();
  currentMusicDomIndex = prevIndex;
}

function syncCurrentMusicDomIndex() {
  const musicItems = document.querySelectorAll('.music-item');
  const playingItem = document.querySelector('.music-item.playing');
  if (playingItem) {
    currentMusicDomIndex = Array.prototype.indexOf.call(musicItems, playingItem);
    return;
  }
  // Try to match by currentAudio src
  if (window.currentAudio && window.currentAudio.src) {
    for (let i = 0; i < musicItems.length; i++) {
      const item = musicItems[i];
      if (item.dataset && item.dataset.type === 'file' && item.dataset.url) {
        if (window.currentAudio.src.toLowerCase().endsWith(item.dataset.url.toLowerCase())) {
          currentMusicDomIndex = i;
          return;
        }
      }
      if (item.dataset && item.dataset.type === 'radio' && item.dataset.radioUrl) {
        if (window.currentAudio.src.indexOf(item.dataset.radioUrl) !== -1) {
          currentMusicDomIndex = i;
          return;
        }
      }
    }
  }
  currentMusicDomIndex = -1;
}

function toggleMusicShuffle(enabled) {
  isMusicShuffle = !!enabled;
}

// Expose shuffle to global for the inline onchange
window.toggleMusicShuffle = toggleMusicShuffle;

async function handleMusicRightClick() {
  if (!isPlaylistStarted) {
    // First right-click: start the playlist
    await startMusicPlaylist();
  } else {
    // Subsequent right-clicks: toggle play/pause
    stopMusic();
  }
}

function handleVideoRightClick() {
  const player = document.getElementById('videoPlayer');
  if (player) {
    // Check if video player is currently visible
    const isVisible = player.style.display !== 'none' && 
                     getComputedStyle(player).display !== 'none' &&
                     player.style.visibility !== 'hidden' &&
                     getComputedStyle(player).visibility !== 'hidden';
    
    if (isVisible) {
      // Use the same logic as videoClose() to properly close the video
      videoClose();
      logger.info('🎥 Video player closed via right-click');
    } else {
      // If video player is closed, show Welcome message
      showWelcomeMessage();
    }
  } else {
    // Fallback to Welcome message if player element not found
    showWelcomeMessage();
  }
}

function showWelcomeMessage() {
  // Use the existing read panel instead of creating a new overlay
  const readPanel = document.getElementById('readPanel');
  if (readPanel) {
    // Update the content to show video player information
    const contentDiv = readPanel.querySelector('div[style*="color: white"]');
    if (contentDiv) {
      contentDiv.innerHTML = `
        <div style="margin-bottom: 15px; font-weight: bold; color: gold;">🎬 MindsEye Guide</div>
        <div style="color: white; margin-bottom: 20px; line-height: 1.4;">
          <strong>Video Player Controls:</strong><br>
          • Click video button to open/close player<br>
          • Right-click when playing to close completely<br>
          • Use playlist controls to navigate videos<br>
          • Upload .txt files with YouTube URLs<br><br>
          
          <strong>Music Player Controls:</strong><br>
          • Right-click to Play/pause<br>
          • Click Music button to open/close player<br>
          • Upload .txt files with Radio URLs<br>
          • Use playlist controls to navigate music<br><br>

          <strong>Keyboard Shortcuts:</strong><br>
          • <kbd>V</kbd> - Open/close video player<br>
          • <kbd>M</kbd> - Open/close music panel<br>
          • <kbd>H</kbd> - Open/close mindseye hub<br>
          • <kbd>Space</kbd> - Pause/unpause speed<br>
          • <kbd>ESC</kbd> - Close all panels<br>
          • <kbd>D</kbd> - Toggle drawing mode<br>
          • <kbd>C</kbd> - Drawing Colour<br>
          • <kbd>X</kbd> - Clear drawings<br>
          • <kbd>W</kbd> - Change Line Size<br>
          • <kbd>S</kbd> - Smooth last line<br>
          • <kbd>F</kbd> - Flash drawings<br><br>
          
          <strong>Bubble Movement:</strong><br>
          • <kbd>Arrow Keys</kbd> - Move selected bubble<br>
          • <kbd>B</kbd> - Toggle bubble panel<br>
          • <kbd>[</kbd> - Decrease bubble size<br>
          • <kbd>]</kbd> - Increase bubble size<br><br>
          
          <strong>Speed Control:</strong><br>
          • <kbd>-</kbd> - Decrease speed<br>
          • <kbd>+</kbd> - Increase speed<br>
          • <kbd>Space</kbd> - Pause/Resume speed<br><br>

          <strong>Avatar Assistant:</strong><br>
          • <kbd>A</kbd> - Toggle assistant On/off<br>
          • <kbd>Z</kbd> - Next assistant<br><br>
          
          <strong>Gamepad Controls 🎮 (PS5):</strong><br>
          • <kbd>Triangle △</kbd> - Toggle video player<br>
          • <kbd>Circle ⭕️</kbd> - Toggle music panel<br>
          • <kbd>Square 🟪</kbd> - Close all panels<br>
          • <kbd>X ❎</kbd> - Select music track<br>
          • <kbd>L1/R1</kbd> - Switch bubbles<br>
          • <kbd>R2 Shift </kbd> - Bubble Bounce☄️<br>
          • <kbd>L2 .</kbd> - Bubble Collect🥍<br><br>

          <strong>😀 Special Thanks to: 😀</strong><br>
          • LA Forster<br>
          • Sarah West<br>
          • Megan Bean<br>
          • Sandra Oxton<br>
          • Alison Stanton<br>
          • Joanna Ballard<br>
          • AAAPPP🥰<br>
          • CQC, PSA<br>
          • ChatGPT, Cursor<br>
          • Youtube, 11Labs<br>
          • Railway, Render<br>
          • Github, Heygen<br>
          • Porkbun, Huggingface<br>
          • Not to be repeated...
        </div>
      `;
    }
    
    readPanel.style.display = 'block';
    logger.info('🎬 Video player welcome message shown');
  }
}

function hideWelcomeMessage() {
  // Use the existing hideReadPanel function
  if (typeof hideReadPanel === 'function') {
    hideReadPanel();
    logger.info('🎬 Video player welcome message hidden');
  }
}

function showReadPanel() {
  const readPanel = document.getElementById('readPanel');
  if (readPanel) {
    readPanel.style.display = 'block';
    logger.info('📖 Read panel shown');
  }
}

function hideReadPanel() {
  const readPanel = document.getElementById('readPanel');
  if (readPanel) {
    readPanel.style.display = 'none';
    logger.info('📖 Read panel hidden');
  }
}

// Make functions available globally
window.hideWelcomeMessage = hideWelcomeMessage;
window.showWelcomeMessage = showWelcomeMessage;
window.showReadPanel = showReadPanel;
window.hideReadPanel = hideReadPanel;
window.cancelRadioInput = cancelRadioInput;
window.confirmRadioInput = confirmRadioInput;
window.showRadioError = showRadioError;
window.showPlaylistConfirmation = showPlaylistConfirmation;
window.closePlaylistConfirmation = closePlaylistConfirmation;
window.uploadMp4Video = uploadMp4Video;
window.playMp4Video = playMp4Video;
window.pauseMp4Video = pauseMp4Video;
window.stopMp4Video = stopMp4Video;
window.playSingleVideoStream = playSingleVideoStream;
window.stopSingleVideoStream = stopSingleVideoStream;
// Keep old function names for backward compatibility
window.playSingleYouTubeVideo = playSingleVideoStream;
window.stopSingleYouTubeVideo = stopSingleVideoStream;

function loadRadioStation() {
  // Show the custom radio input panel
  const radioPanel = document.getElementById('radioInputPanel');
  const radioInput = document.getElementById('radioUrlInput');
  
  if (radioPanel && radioInput) {
    radioPanel.style.display = 'block';
    radioInput.value = '';
    radioInput.focus();
    
    // Add Enter key support
    radioInput.onkeydown = function(e) {
      if (e.key === 'Enter') {
        confirmRadioInput();
      } else if (e.key === 'Escape') {
        cancelRadioInput();
      }
    };
  }
}

function cancelRadioInput() {
  const radioPanel = document.getElementById('radioInputPanel');
  if (radioPanel) {
    radioPanel.style.display = 'none';
  }
      logger.info('📻 Radio input cancelled');
}

function confirmRadioInput() {
  const radioInput = document.getElementById('radioUrlInput');
  const radioPanel = document.getElementById('radioInputPanel');
  
  if (!radioInput || !radioPanel) return;
  
  const radioUrl = radioInput.value.trim();
  if (radioUrl !== '') {
    try {
      // Stop current music
      if (window.currentAudio) {
        window.currentAudio.pause();
        window.currentAudio = null;
      }
      
      // Create new audio element for radio
      const audio = new Audio(radioUrl);
      audio.volume = 0.5;
      
      // Add event listeners
      audio.addEventListener('ended', () => {
        logger.info('🎵 Radio stream ended');
        const musicButton = document.querySelector('[data-icon="music"]');
        if (musicButton && typeof PNGLoader !== 'undefined') {
          PNGLoader.applyPNG(musicButton, 'music.png');
        }
      });

      audio.addEventListener('pause', () => {
        logger.info('🎵 Radio paused');
        const musicButton = document.querySelector('[data-icon="music"]');
        if (musicButton && typeof PNGLoader !== 'undefined') {
          PNGLoader.applyPNG(musicButton, 'music.png');
        }
      });

      audio.addEventListener('play', () => {
        logger.info('🎵 Radio started playing');
        const musicButton = document.querySelector('[data-icon="music"]');
        if (musicButton && typeof PNGLoader !== 'undefined') {
          PNGLoader.applyPNG(musicButton, 'music2.png');
        }
      });
      
      window.currentAudio = audio;
      updateNowPlayingInfo();
      
      // Store current radio info for highlighting
      window.currentRadioUrl = radioUrl;
      window.currentRadioTitle = radioUrl; // Use URL as title for now
      
      audio.play().then(() => {
        logger.info('🎵 Radio station loaded and playing');
        const musicButton = document.querySelector('[data-icon="music"]');
        if (musicButton && typeof PNGLoader !== 'undefined') {
          PNGLoader.applyPNG(musicButton, 'music2.png');
        }
        
        // Close the radio input panel on successful connection
        radioPanel.style.display = 'none';
        
        // Highlight the radio station in the music panel
        highlightCurrentTrack();
        
        // Start visualizer with delay
        setTimeout(() => {
          if (window.currentAudio && !window.currentAudio.paused) {
            startMusicVisualizer();
          }
        }, 1000);
      }).catch(err => {
        logger.error('❌ Error loading radio station:', err);
        // Show styled error message instead of alert
        showRadioError('Failed to load radio station. Please check the URL and try again.');
      });
    } catch (error) {
      logger.error('❌ Error creating radio audio:', error);
      showRadioError('Failed to load radio station. Please check the URL and try again.');
    }
  } else {
    showRadioError('Please enter a valid radio stream URL.');
  }
}

function showRadioError(message) {
  const radioInput = document.getElementById('radioUrlInput');
  if (radioInput) {
    radioInput.style.borderColor = '#f44336';
    radioInput.style.boxShadow = '0 0 10px rgba(244, 67, 54, 0.3)';
    radioInput.placeholder = message;
    radioInput.value = '';
    
    // Reset border color after 3 seconds
    setTimeout(() => {
      radioInput.style.borderColor = '#4CAF50';
      radioInput.style.boxShadow = 'none';
      radioInput.placeholder = 'https://example.com/stream.m3u8';
    }, 3000);
  }
}

function showPlaylistConfirmation(trackCount) {
  const confirmationPanel = document.getElementById('playlistConfirmationPanel');
  const trackCountElement = document.getElementById('trackCount');
  
  if (confirmationPanel && trackCountElement) {
    // Update the track count
    trackCountElement.textContent = trackCount;
    
    // Show the panel with animation
    confirmationPanel.style.display = 'block';
    
    // Add keyboard support (Enter or Escape to close)
    const keyHandler = function(e) {
      if (e.key === 'Enter' || e.key === 'Escape') {
        closePlaylistConfirmation();
        document.removeEventListener('keydown', keyHandler);
      }
    };
    document.addEventListener('keydown', keyHandler);
    
    // Auto-close after 5 seconds
    setTimeout(() => {
      if (confirmationPanel.style.display === 'block') {
        closePlaylistConfirmation();
        document.removeEventListener('keydown', keyHandler);
      }
    }, 5000);
    
    logger.info(`🎵 Showing playlist confirmation for ${trackCount} tracks`);
  }
}

function closePlaylistConfirmation() {
  const confirmationPanel = document.getElementById('playlistConfirmationPanel');
  if (confirmationPanel) {
    confirmationPanel.style.display = 'none';
    logger.info('🎵 Playlist confirmation closed');
  }
}

// ===== MP4 VIDEO UPLOAD FUNCTIONS =====

// Global variables for MP4 video handling
let currentMp4Url = null;
let isPlayingMp4 = false;
let mp4VideoElement = null;

function uploadMp4Video(event) {
  const file = event.target.files[0];
  if (!file) {
    logger.warn('No MP4 file selected', null, 'UPLOAD');
    return;
  }

  // Validate file type
  if (!file.type.startsWith('video/mp4') && !file.name.toLowerCase().endsWith('.mp4')) {
    alert('Please select a valid .mp4 video file.');
    event.target.value = '';
    return;
  }

  logger.video('MP4 file selected', { name: file.name, size: (file.size / 1024 / 1024).toFixed(2) + ' MB' });

  // Create object URL for the video file
  if (currentMp4Url) {
    URL.revokeObjectURL(currentMp4Url);
  }
  
  currentMp4Url = URL.createObjectURL(file);
  
  // Clear the file input
  event.target.value = '';
  
  // Play the MP4 video
  playMp4Video();
  
  logger.success('MP4 video uploaded and ready to play');
}

function playMp4Video() {
  if (!currentMp4Url) {
    logger.warn('No MP4 video uploaded', null, 'UPLOAD');
    return;
  }

  const iframe = document.getElementById('videoIframe');
  if (!iframe) {
    logger.warn('Video iframe not found', null, 'VIDEO');
    return;
  }

  // Stop any currently playing YouTube video
  if (videoIsPlaying) {
    videoPause();
  }

  // Create a video element HTML to display in the iframe
  const videoHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          margin: 0;
          padding: 0;
          background: black;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }
        video {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
      </style>
    </head>
    <body>
      <video id="mp4Player" controls autoplay loop>
        <source src="${currentMp4Url}" type="video/mp4">
        Your browser does not support the video tag.
      </video>
      <script>
        const video = document.getElementById('mp4Player');
        
        // Handle play/pause events
        video.addEventListener('play', () => {
          window.parent.postMessage({type: 'mp4Play'}, '*');
        });
        
        video.addEventListener('pause', () => {
          window.parent.postMessage({type: 'mp4Pause'}, '*');
        });
        
        // Make video accessible to parent
        window.toggleMp4Playback = function() {
          if (video.paused) {
            video.play();
          } else {
            video.pause();
          }
        };
        
        // Auto-play with better error handling
        video.play().catch(err => {
          logger.warn('Autoplay prevented', { error: err.message, code: err.name }, 'VIDEO');
          
          // Show user-friendly message
          const message = document.createElement('div');
          message.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #ff6b6b; color: white; padding: 10px; border-radius: 5px; z-index: 10000; font-family: Arial, sans-serif;';
          message.textContent = 'Click the video to start playing (autoplay blocked)';
          document.body.appendChild(message);
          
          // Remove message after 5 seconds
          setTimeout(() => {
            if (message.parentNode) {
              message.parentNode.removeChild(message);
            }
          }, 5000);
        });
        
        // Add keyboard controls
        document.addEventListener('keydown', (e) => {
          switch(e.code) {
            // Spacebar removed - now only controls speed multiplier in main.js
            case 'ArrowRight':
              video.currentTime = Math.min(video.duration, video.currentTime + 10);
              break;
            case 'ArrowLeft':
              video.currentTime = Math.max(0, video.currentTime - 10);
              break;
            case 'ArrowUp':
              video.volume = Math.min(1, video.volume + 0.1);
              break;
            case 'ArrowDown':
              video.volume = Math.max(0, video.volume - 0.1);
              break;
          }
        });
        
        // Enhance video with performance monitoring
        if (window.parent.enhanceMp4Video) {
          window.parent.enhanceMp4Video(video);
        }
      </script>
    </body>
    </html>
  `;

  // Create a blob URL for the HTML content
  const blob = new Blob([videoHtml], { type: 'text/html' });
  const htmlUrl = URL.createObjectURL(blob);
  
  // Load the HTML into the iframe
  iframe.src = htmlUrl;
  
  isPlayingMp4 = true;
  videoIsPlaying = true;
  
  // Update video button icon based on current state
  if (typeof updateVideoButtonIcon === 'function') {
    updateVideoButtonIcon();
  }
  
  // Show video player if hidden
  const player = document.getElementById('videoPlayer');
  if (player && player.style.display === 'none') {
    toggleVideoPlayer();
  }
  
  logger.video('MP4 video started playing in iframe');
}

function pauseMp4Video() {
  const iframe = document.getElementById('videoIframe');
  if (iframe && iframe.contentWindow && isPlayingMp4) {
    iframe.contentWindow.toggleMp4Playback();
    logger.video('MP4 video pause/play toggled');
  }
}

function stopMp4Video() {
  const iframe = document.getElementById('videoIframe');
  if (iframe && isPlayingMp4) {
    iframe.src = '';
    isPlayingMp4 = false;
    videoIsPlaying = false;
    
    // Update video button icon based on current state
    if (typeof updateVideoButtonIcon === 'function') {
      updateVideoButtonIcon();
    }
    
    logger.video('MP4 video stopped');
  }
}

// ===== MEDIA ENHANCEMENTS =====

// Enhanced video controls and performance monitoring
function enhanceVideo(videoElement) {
  if (!videoElement) return;
  
  // Add performance monitoring
  let lastTime = 0;
  let frameCount = 0;
  let performanceData = {
    fps: 0,
    bufferHealth: 0,
    quality: 'unknown',
    type: 'video'
  };
  
  // Monitor frame rate and performance
  const monitorPerformance = () => {
    const now = performance.now();
    frameCount++;
    
    if (now - lastTime >= 1000) {
      performanceData.fps = Math.round((frameCount * 1000) / (now - lastTime));
      frameCount = 0;
      lastTime = now;
      
      // Monitor buffer health
      if (videoElement.buffered && videoElement.buffered.length > 0) {
        const bufferedEnd = videoElement.buffered.end(videoElement.buffered.length - 1);
        const bufferAhead = bufferedEnd - videoElement.currentTime;
        performanceData.bufferHealth = bufferAhead;
        
        if (bufferAhead < 2) {
          logger.warn('Low video buffer health', { bufferAhead: bufferAhead.toFixed(1) + 's' }, 'VIDEO');
        }
      }
      
      // Log performance data sparingly
      logger.performance('Video Performance', performanceData);
    }
    
    // Continue monitoring if video is still playing
    if (!videoElement.paused) {
      requestAnimationFrame(monitorPerformance);
    }
  };
  
  // Start performance monitoring when video starts playing
  videoElement.addEventListener('play', () => {
    monitorPerformance();
  });
  
  // Add enhanced keyboard controls for video
  const handleVideoKeydown = (e) => {
    if (e.target.tagName === 'INPUT') return; // Don't interfere with input fields
    
    switch(e.code) {
      // Spacebar removed - now only controls speed multiplier in main.js
      case 'ArrowRight':
        videoElement.currentTime = Math.min(videoElement.duration, videoElement.currentTime + 10);
        break;
      case 'ArrowLeft':
        videoElement.currentTime = Math.max(0, videoElement.currentTime - 10);
        break;
      case 'ArrowUp':
        videoElement.volume = Math.min(1, videoElement.volume + 0.1);
        break;
      case 'ArrowDown':
        videoElement.volume = Math.max(0, videoElement.volume - 0.1);
        break;
      // Removed KeyF: reserved for drawing flash in main.js
      // M key shortcut removed - conflicts with music panel shortcut
    }
  };
  
  // Add global video keyboard controls
  document.addEventListener('keydown', handleVideoKeydown);
  
  // Clean up function
  return () => {
    document.removeEventListener('keydown', handleVideoKeydown);
  };
}

// Enhanced MP4 video controls and performance monitoring
function enhanceMp4Video(videoElement) {
  if (!videoElement) return;
  
  // Add performance monitoring
  let lastTime = 0;
  let frameCount = 0;
  let performanceData = {
    fps: 0,
    bufferHealth: 0,
    quality: 'unknown'
  };
  
  // Monitor frame rate
  const monitorPerformance = () => {
    const now = performance.now();
    frameCount++;
    
    if (now - lastTime >= 1000) {
      performanceData.fps = Math.round((frameCount * 1000) / (now - lastTime));
      frameCount = 0;
      lastTime = now;
      
      // Log performance data sparingly
      logger.performance('MP4 Performance', performanceData);
    }
    
    // Monitor buffer health
    if (videoElement.buffered.length > 0) {
      const bufferedEnd = videoElement.buffered.end(videoElement.buffered.length - 1);
      const currentTime = videoElement.currentTime;
      const bufferAhead = bufferedEnd - currentTime;
      
      if (bufferAhead < 5) {
        logger.warn('Low buffer health', { bufferAhead: bufferAhead.toFixed(1) + 's' }, 'VIDEO');
      }
    }
    
    requestAnimationFrame(monitorPerformance);
  };
  
  // Start performance monitoring
  monitorPerformance();
  
  // Add quality detection
  videoElement.addEventListener('loadedmetadata', () => {
    const width = videoElement.videoWidth;
    const height = videoElement.videoHeight;
    
    if (width >= 1920 && height >= 1080) {
      performanceData.quality = '1080p';
    } else if (width >= 1280 && height >= 720) {
      performanceData.quality = '720p';
    } else if (width >= 854 && height >= 480) {
      performanceData.quality = '480p';
    } else {
      performanceData.quality = 'SD';
    }
    
    logger.video('Video quality detected', { quality: performanceData.quality, dimensions: `${width}x${height}` });
  });
  
  return performanceData;
}

// Enhanced music playback with better controls and monitoring
function enhanceMusicPlayback(audioElement) {
  if (!audioElement) return;
  
  // Add music-specific performance monitoring
  let musicPerformanceData = {
    volume: audioElement.volume,
    duration: 0,
    currentTime: 0,
    bufferHealth: 0,
    quality: 'unknown'
  };
  
  // Monitor audio performance
  const monitorMusicPerformance = () => {
    if (audioElement.duration && !isNaN(audioElement.duration)) {
      musicPerformanceData.duration = audioElement.duration;
      musicPerformanceData.currentTime = audioElement.currentTime;
      musicPerformanceData.volume = audioElement.volume;
      
      // Calculate buffer health
      if (audioElement.buffered.length > 0) {
        const bufferedEnd = audioElement.buffered.end(audioElement.buffered.length - 1);
        const bufferAhead = bufferedEnd - audioElement.currentTime;
        musicPerformanceData.bufferHealth = bufferAhead;
        
        if (bufferAhead < 2) {
          logger.warn('Low audio buffer health', { bufferAhead: bufferAhead.toFixed(1) + 's' }, 'AUDIO');
        }
      }
      
      // Log performance data sparingly
      logger.performance('Music Performance', musicPerformanceData);
    }
    
    // Continue monitoring if audio is still playing
    if (!audioElement.paused) {
      requestAnimationFrame(monitorMusicPerformance);
    }
  };
  
  // Start performance monitoring when audio starts playing
  audioElement.addEventListener('play', () => {
    monitorMusicPerformance();
  });
  
  // Add enhanced keyboard controls for music
  const handleMusicKeydown = (e) => {
    if (e.target.tagName === 'INPUT') return; // Don't interfere with input fields
    
    switch(e.code) {
      // Spacebar removed - now only controls speed multiplier in main.js
      case 'ArrowRight':
        audioElement.currentTime = Math.min(audioElement.duration, audioElement.currentTime + 10);
        break;
      case 'ArrowLeft':
        audioElement.currentTime = Math.max(0, audioElement.currentTime - 10);
        break;
      case 'ArrowUp':
        audioElement.volume = Math.min(1, audioElement.volume + 0.1);
        break;
      case 'ArrowDown':
        audioElement.volume = Math.max(0, audioElement.volume - 0.1);
        break;
      // M key shortcut removed - conflicts with music panel shortcut
    }
  };
  
  // Add global music keyboard controls
  document.addEventListener('keydown', handleMusicKeydown);
  
  // Clean up function
  return () => {
    document.removeEventListener('keydown', handleMusicKeydown);
  };
}

// ===== SINGLE VIDEO STREAM FUNCTIONS =====

// Global variables for single video stream handling
let currentSingleVideoUrl = null;
let isPlayingSingleVideo = false;

function playSingleVideoStream() {
  const urlInput = document.getElementById('singleVideoUrl');
  if (!urlInput) {
    logger.warn('⚠️ URL input not found');
    return;
  }

  const url = urlInput.value.trim();
  if (!url) {
    alert('Please enter a URL');
    return;
  }

  // Basic URL validation
  if (!isValidUrl(url)) {
    alert('Please enter a valid URL (e.g., https://example.com, https://youtube.com/watch?v=..., or video.mp4)');
    return;
  }

  logger.info('🌐 Loading content:', url);

  // Stop any currently playing MP4 video
  if (isPlayingMp4) {
    stopMp4Video();
    logger.info('🎬 Stopped MP4 video to load new content');
  }

  const iframe = document.getElementById('videoIframe');
  if (!iframe) {
    logger.warn('⚠️ Video iframe not found');
    return;
  }

  let embedUrl;
  const contentType = detectContentType(url);
  
  switch(contentType) {
    case 'youtube':
      // Handle YouTube videos with loop
      const videoId = extractYouTubeId(url);
      embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&controls=1&modestbranding=1&rel=0`;
      logger.info('🎥 Detected YouTube video, using embed URL');
      break;
      
    case 'video':
      // Handle direct video streams by creating an HTML5 video player
      const videoHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { margin: 0; padding: 0; background: black; display: flex; justify-content: center; align-items: center; height: 100vh; }
            video { max-width: 100%; max-height: 100%; object-fit: contain; }
          </style>
        </head>
        <body>
          <video controls autoplay loop crossorigin="anonymous">
            <source src="${url}" type="video/mp4">
            <source src="${url}" type="video/webm">
            <source src="${url}" type="video/ogg">
            <source src="${url}">
            <p>Your browser doesn't support HTML5 video. <a href="${url}">Download the video</a> instead.</p>
          </video>
          <script>
            const video = document.querySelector('video');
            video.addEventListener('loadstart', () => {
              logger.info('🎥 Video loading started');
            });
            video.addEventListener('error', (e) => {
              logger.error('🎥 Video error:', e);
              document.body.innerHTML = '<div style="color: white; text-align: center; padding: 20px;">Error loading video stream. Please check the URL and try again.</div>';
            });
            video.addEventListener('canplay', () => {
              logger.info('🎥 Video ready to play');
            });
          </script>
        </body>
        </html>
      `;
      
      const blob = new Blob([videoHtml], { type: 'text/html' });
      embedUrl = URL.createObjectURL(blob);
      logger.info('🎥 Created HTML5 video player for video stream');
      break;
      
    case 'website':
    default:
      // Handle regular websites by loading them directly in iframe
      embedUrl = url;
      logger.info('🌐 Loading website directly in iframe');
      break;
  }
  
  // Load the content in the iframe
  iframe.src = embedUrl;
  
  currentSingleVideoUrl = url;
  isPlayingSingleVideo = true;
  videoIsPlaying = true;
  
  // Update video button to show active state
  const videoButton = document.querySelector('[data-icon="video"]');
  if (videoButton && typeof PNGLoader !== 'undefined') {
    PNGLoader.applyPNG(videoButton, 'video2.png');
  }
  
  // Show video player if hidden
  const player = document.getElementById('videoPlayer');
  if (player && player.style.display === 'none') {
    toggleVideoPlayer();
  }
  
  // Clear the input field
  urlInput.value = '';
  
  logger.info(`🌐 Content loaded: ${contentType} - ${url}`);
}

function stopSingleVideoStream() {
  const iframe = document.getElementById('videoIframe');
  if (iframe && isPlayingSingleVideo) {
    // If it was a blob URL, revoke it to free memory
    if (iframe.src.startsWith('blob:')) {
      URL.revokeObjectURL(iframe.src);
    }
    
    iframe.src = '';
    isPlayingSingleVideo = false;
    videoIsPlaying = false;
    currentSingleVideoUrl = null;
    
    // Update video button to show inactive state
    const videoButton = document.querySelector('[data-icon="video"]');
    if (videoButton && typeof PNGLoader !== 'undefined') {
      PNGLoader.applyPNG(videoButton, 'video.png');
    }
    
    logger.info('🎥 Single video stream stopped');
  }
}

// Helper function to validate URLs
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

// Helper function to detect content type
function detectContentType(url) {
  // Check if it's a YouTube URL first
  if (extractYouTubeId(url)) {
    return 'youtube';
  }
  
  // Check if it's a direct video file
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.wmv', '.flv', '.m4v'];
  const streamingFormats = ['.m3u8', '.mpd', '.f4m'];
  const allVideoFormats = [...videoExtensions, ...streamingFormats];
  
  const urlLower = url.toLowerCase();
  if (allVideoFormats.some(ext => urlLower.includes(ext))) {
    return 'video';
  }
  
  // IMPORTANT: Do NOT guess 'video' for generic streaming paths/domains.
  // Only explicit file or manifest extensions above should be classified as 'video'.
  // Everything else should be treated as 'website' so it embeds in an iframe.
  
  // Default to website
  return 'website';
}

// Listen for messages from MP4 video iframe
window.addEventListener('message', function(event) {
  if (event.data && event.data.type) {
    switch(event.data.type) {
      case 'mp4Play':
        isPlayingMp4 = true;
        videoIsPlaying = true;
        logger.info('🎬 MP4 video started playing');
        break;
      case 'mp4Pause':
        // Don't set isPlayingMp4 = false here as user might resume
        logger.info('🎬 MP4 video paused');
        break;
    }
  }
});

// ===== MUSIC PLAYLIST UPLOAD FUNCTIONS =====

async function uploadMusicPlaylist(event) {
  logger.info('🎵 Music playlist upload triggered');
  
  const file = event.target.files[0];
  if (!file) {
    logger.warn('⚠️ No file selected');
    return;
  }

  logger.info('📁 File selected:', file.name, 'Type:', file.type);

  if (file.type !== 'text/plain' && !file.name.endsWith('.txt')) {
    alert('Please select a .txt file for the playlist.');
    return;
  }

  try {
    logger.info('📁 Uploading music playlist:', file.name);
    
    // Read the file content
    const content = await file.text();
    logger.debug('📄 File content length:', content.length);
    logger.debug('📄 First 200 characters:', content.substring(0, 200));
    
    const tracks = content.split('\n').filter(line => line.trim() !== '');
    logger.debug('🎵 Parsed tracks:', tracks);
    
    if (tracks.length === 0) {
      alert('The playlist file is empty or contains no valid tracks.');
      return;
    }

    logger.info(`🎵 Loaded ${tracks.length} tracks from uploaded playlist`);
    
    // Store the uploaded playlist globally
    window.uploadedMusicPlaylist = tracks;
    window.currentMusicPlaylistIndex = 0;
    
    // Stop current music
    if (window.currentAudio) {
      window.currentAudio.pause();
      window.currentAudio = null;
    }
    
    // Reload the music list to include the uploaded playlist
    logger.info('🔄 Reloading music list...');
    await loadMusicList();
    
    // Show success message with styled panel
    showPlaylistConfirmation(tracks.length);
    
    // Clear the file input
    event.target.value = '';
    
  } catch (error) {
    logger.error('❌ Error uploading music playlist:', error);
    alert('Failed to upload playlist. Please check the file format.');
  }
}

// ===== MOBILE DETECTION =====
function isMobileDevice() {
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = ['android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone', 'mobile'];
  const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));
  
  // Also check for touch capability and screen size
  const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth <= 768 || window.innerHeight <= 1024;
  
  const isMobile = isMobileUA || (hasTouchScreen && isSmallScreen);
  
  return isMobile;
}

// ===== MEDIA TOOLBAR FUNCTIONS =====

function toggleMediaToolbar() {
  const bar = document.getElementById("mediaToolbar");
  if (bar) {
    const currentDisplay = bar.style.display || getComputedStyle(bar).display;
    const newDisplay = (currentDisplay === "none" || currentDisplay === "") ? "flex" : "none";
    bar.style.display = newDisplay;
    isMediaToolbarVisible = (newDisplay === "flex");
    
    // News ticker visibility no longer controlled by media toolbar
    logger.info(`📺 Media toolbar visibility toggled to: ${newDisplay} (news ticker unaffected)`);
  }
}

function toggleMediaToolbarMinimize() {
  const bar = document.getElementById("mediaToolbar");
  if (bar) {
    isMediaToolbarMinimized = !isMediaToolbarMinimized;
    
    if (isMediaToolbarMinimized) {
      bar.classList.add('minimized');
      logger.info("📺 Media toolbar minimized");
    } else {
      bar.classList.remove('minimized');
      logger.info("📺 Media toolbar expanded");
    }
  }
}

function toggleMediaToolbarVisibility() {
  const bar = document.getElementById("mediaToolbar");
  if (bar) {
    const currentDisplay = bar.style.display || getComputedStyle(bar).display;
    const newDisplay = (currentDisplay === "none" || currentDisplay === "") ? "flex" : "none";
    bar.style.display = newDisplay;
    isMediaToolbarVisible = (newDisplay === "flex");
    
    // News ticker visibility no longer controlled by media toolbar
    logger.info(`📺 Media toolbar visibility toggled to: ${newDisplay} (news ticker unaffected)`);
  }
}

// Function to control toolbar visibility without affecting news ticker
function toggleMediaToolbarVisibilityOnly() {
  const bar = document.getElementById("mediaToolbar");
  if (bar) {
    const currentDisplay = bar.style.display || getComputedStyle(bar).display;
    const newDisplay = (currentDisplay === "none" || currentDisplay === "") ? "flex" : "none";
    bar.style.display = newDisplay;
    isMediaToolbarVisible = (newDisplay === "flex");
    
    // Don't update news ticker visibility - only control toolbar
    logger.info(`📺 Media toolbar visibility toggled to: ${newDisplay} (news ticker unaffected)`);
  }
}

// Make the new function available globally
if (typeof window !== 'undefined') {
  window.toggleMediaToolbarVisibilityOnly = toggleMediaToolbarVisibilityOnly;
}

// ===== MOBILE TOOLBAR INITIALIZATION =====
// Cache mobile detection result to avoid repeated calls
let cachedMobileStatus = null;
let resizeTimeout = null;

function ensureMobileToolbarVisibility() {
  // Only check mobile status if we haven't cached it yet
  if (cachedMobileStatus === null) {
    cachedMobileStatus = isMobileDevice();
  }
  
  if (cachedMobileStatus) {
    const topToolbar = document.getElementById("toolbar");
    if (topToolbar) {
      topToolbar.style.display = "flex";
      topToolbar.style.opacity = "1";
      topToolbar.classList.add('mobile-always-visible');
    }
  }
}

// Debounced resize handler to avoid excessive calls
function handleWindowResize() {
  // Clear existing timeout
  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
  }
  
  // Set new timeout to debounce resize events
  resizeTimeout = setTimeout(() => {
    // Only re-check mobile status if screen size changes significantly
    const newMobileStatus = isMobileDevice();
    if (newMobileStatus !== cachedMobileStatus) {
      cachedMobileStatus = newMobileStatus;
      ensureMobileToolbarVisibility();
    }
  }, 250); // 250ms debounce
}

// Add resize listener
if (typeof window !== 'undefined') {
  window.addEventListener('resize', handleWindowResize);
  window.addEventListener('orientationchange', handleWindowResize);
}

// ===== BACKGROUND UPLOAD FUNCTIONS =====

function handleBackgroundUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file (PNG, JPG, etc.)');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      backgroundImage = img;
      // Hide video and iframe
      const video = document.getElementById("bgVideo");
      const iframe = document.getElementById("ytFrame");
      if (video) {
        video.style.display = "none";
        video.pause();
      }
      if (iframe) {
        iframe.style.display = "none";
        iframe.src = "";
      }
      logger.info("🖼️ Background image uploaded successfully");
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ===== VIDEO UPLOAD FUNCTIONS =====

function handleVideoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (!file.type.startsWith('video/')) {
    alert('Please select a video file (MP4, WebM, etc.)');
    return;
  }
  
  const video = document.getElementById("bgVideo");
  const iframe = document.getElementById("ytFrame");
  
  if (video) {
    // Hide iframe
    if (iframe) {
      iframe.style.display = "none";
      iframe.src = "";
    }
    
    // Create object URL for video
    const videoURL = URL.createObjectURL(file);
    video.src = videoURL;
    video.style.display = "block";
    video.play().then(() => {
      logger.info("📀 Video uploaded and playing successfully");
    }).catch(err => {
      logger.error("❌ Error playing uploaded video:", err);
    });
    
    // Clear background image
    backgroundImage = null;
  }
}

// ===== SNAPSHOT FUNCTIONS =====

function captureCanvas() {
  const canvas = document.getElementById("canvas");
  if (!canvas) {
    logger.error("Canvas not found");
    return;
  }
  
  // Ensure canvas is properly sized
  if (canvas.width === 0 || canvas.height === 0) {
    logger.error("Canvas has zero dimensions");
    return;
  }
  
  logger.info("Canvas dimensions:", canvas.width, "x", canvas.height);
  
  try {
    const dataURL = canvas.toDataURL("image/png");
    logger.debug("Data URL length:", dataURL.length);
    
    const link = document.createElement("a");
    link.download = "snapshot.png";
    link.href = dataURL.replace("image/png", "image/octet-stream");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    logger.info("Snapshot download initiated");
  } catch (error) {
    logger.error("Error capturing snapshot:", error);
  }
}

function captureCanvasOnly() {
  const canvas = document.getElementById("canvas");
  if (!canvas) {
    logger.error("Canvas not found");
    return;
  }
  
  // Ensure canvas is properly sized
  if (canvas.width === 0 || canvas.height === 0) {
    logger.error("Canvas has zero dimensions");
    return;
  }
  
  logger.info("Canvas dimensions:", canvas.width, "x", canvas.height);
  
  try {
    const dataURL = canvas.toDataURL("image/png");
    logger.debug("Data URL length:", dataURL.length);
    
    const link = document.createElement("a");
    link.download = "canvas_snapshot.png";
    link.href = dataURL.replace("image/png", "image/octet-stream");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    logger.info("Canvas snapshot download initiated");
  } catch (error) {
    logger.error("Error capturing canvas snapshot:", error);
  }
}

// ===== DICE FUNCTION =====

// Global dice settings
let diceMaxValue = 6;
let diceSliderTimeout = null;
let lastDiceResult = null;
let consecutiveCount = 0;

function rollDice() {
  const result = Math.floor(Math.random() * diceMaxValue) + 1;
  const diceOverlay = document.getElementById('diceOverlay');
  const diceButton = document.getElementById('diceButton');
  
  // Check if this is the same as the last result
  if (result === lastDiceResult) {
    consecutiveCount++;
  } else {
    consecutiveCount = 0;
  }
  lastDiceResult = result;
  
  // Choose color based on whether it's a consecutive roll
  let textColor, buttonColor;
  if (consecutiveCount > 0) {
    // Different color for consecutive same numbers
    textColor = '#FF8C00'; // Orange text for consecutive numbers
    buttonColor = '#FF8C00'; // Orange text for button
    logger.info(`🎲 Consecutive roll #${consecutiveCount + 1} of ${result}!`);
  } else {
    // Normal color for new numbers
    textColor = 'gold'; // Normal gold text
    buttonColor = 'gold'; // Gold text for button
  }
  
  // Show the dice result in overlay with appropriate color
  diceOverlay.textContent = result;
  diceOverlay.style.display = 'block';
  diceOverlay.style.color = textColor;
  // Keep the background consistent
  diceOverlay.style.background = 'rgba(0, 0, 0, 0.8)';
  
  // Show the dice result on top of the button (even with PNG)
  if (diceButton) {
    diceButton.textContent = result;
    diceButton.style.color = buttonColor;
    // Add CSS class to override PNG styles
    diceButton.classList.add('showing-number');
  }
  
      logger.info("🎲 Dice roll result:", result, "(max:", diceMaxValue, ")");
  
  // Hide overlay after 5 seconds
  setTimeout(() => {
    diceOverlay.style.display = 'none';
  }, 5000);
}

function showDiceSlider() {
  // Remove existing slider if present
  const existingSlider = document.getElementById('diceSlider');
  if (existingSlider) {
    existingSlider.remove();
  }
  
  // Create slider overlay
  const sliderOverlay = document.createElement('div');
  sliderOverlay.id = 'diceSlider';
  sliderOverlay.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.9);
    color: gold;
    padding: 20px;
    border-radius: 10px;
    border: 2px solid darkgreen;
    z-index: 60000;
    text-align: center;
    min-width: 200px;
  `;
  
  sliderOverlay.innerHTML = `
    <div style="margin-bottom: 15px; font-weight: bold;">🎲 Dice Max: ${diceMaxValue}</div>
    <input type="range" id="diceMaxSlider" min="2" max="24" value="${diceMaxValue}" 
           style="width: 100%; height: 8px; background: rgba(0, 0, 0, 0.6); border: 2px solid darkgreen; border-radius: 5px; outline: none; margin: 10px 0;">
    <div style="font-size: 12px; color: #888; margin-top: 10px;">Drag to change max dice value (2-24)</div>
    <button onclick="hideDiceSlider()" style="margin-top: 15px; padding: 8px 16px; background: rgba(0, 0, 0, 0.7); color: gold; border: 2px solid darkgreen; border-radius: 6px; cursor: pointer;">Close</button>
  `;
  
  document.body.appendChild(sliderOverlay);
  
  // Set up slider functionality
  const slider = document.getElementById('diceMaxSlider');
  const valueDisplay = sliderOverlay.querySelector('div');
  
  slider.addEventListener('input', function() {
    diceMaxValue = parseInt(this.value);
    valueDisplay.textContent = `🎲 Dice Max: ${diceMaxValue}`;
  });
  
  // Auto-hide after 10 seconds
  diceSliderTimeout = setTimeout(() => {
    hideDiceSlider();
  }, 10000);
}

function hideDiceSlider() {
  const slider = document.getElementById('diceSlider');
  if (slider) {
    slider.remove();
  }
  if (diceSliderTimeout) {
    clearTimeout(diceSliderTimeout);
    diceSliderTimeout = null;
  }
}

// ===== PLAYLIST FUNCTIONS =====

// Initialize video player
function initVideoPlayer() {
  logger.info('🎥 Initializing video player...');
  
  // Ensure video elements are properly hidden initially
  const player = document.getElementById('videoPlayer');
  const controls = document.getElementById('videoControls');
  const playlist = document.getElementById('videoPlaylist');
  
  if (player) {
    player.style.display = 'none';
    player.style.pointerEvents = 'none';
    player.style.zIndex = '-1';
    player.style.visibility = 'hidden';
    logger.info('🎥 Video player element properly initialized');
  }
  
  if (controls) {
    controls.style.display = 'none';
    controls.style.pointerEvents = 'none';
    controls.style.zIndex = '-1';
    controls.style.visibility = 'hidden';
  }
  
  if (playlist) {
    playlist.style.display = 'none';
    playlist.style.pointerEvents = 'none';
    playlist.style.zIndex = '-1';
    playlist.style.visibility = 'hidden';
  }
  
  // Pre-load playlists from root folder
  setTimeout(async () => {
    await preloadPlaylists();
    logger.info('🎥 Video player initialized with pre-loaded playlists');
  }, 100);
  
  // Load video control images
  loadVideoControlImages();
  
  // Set initial opacity
  const opacitySlider = document.getElementById('videoOpacitySlider');
  if (opacitySlider && player) {
    player.style.opacity = opacitySlider.value;
    logger.info('🎥 Initial video opacity set to:', opacitySlider.value);
  }
  
  // Set initial size
  const sizeSlider = document.getElementById('videoSizeSlider');
  if (sizeSlider && player) {
    player.style.transform = `translate(-50%, -50%) scale(${sizeSlider.value})`;
    logger.info('🎥 Initial video size set to:', sizeSlider.value);
  }
  
  // Debug video controls after a short delay
  setTimeout(() => {
    debugVideoControls();
    testPngAccess();
    loadToolbarButtonImages();
    
    // Enhance video player with performance monitoring and better controls
    if (player) {
      const cleanupEnhancement = enhanceVideo(player);
      // Store cleanup function for later use
      window.videoEnhancementCleanup = cleanupEnhancement;
    }
  }, 1000);
  
  // Add click handler for minimized playlist
  const playlistElement = document.getElementById('videoPlaylist');
  if (playlistElement) {
    playlistElement.addEventListener('click', function(e) {
      // Only restore if minimized and click is not on a button
      if (this.classList.contains('minimized') && !e.target.matches('button')) {
        restorePlaylist();
      }
    });
  }

  // ESC key closes player when highlighted (hovered or focused)
  document.addEventListener('keydown', function(e) {
    if (e.key !== 'Escape') return;
    const player = document.getElementById('videoPlayer');
    const iframe = document.getElementById('videoIframe');
    if (!player || getComputedStyle(player).display === 'none') return;
    const rect = player.getBoundingClientRect();
    const mx = window._lastMouseX, my = window._lastMouseY;
    const hovered = typeof mx === 'number' && typeof my === 'number' && mx >= rect.left && mx <= rect.right && my >= rect.top && my <= rect.bottom;
    const activeInside = player.contains(document.activeElement);
    if (hovered || activeInside) {
      if (typeof videoClose === 'function') {
        videoClose();
      } else if (iframe) {
        iframe.src = '';
        player.style.display = 'none';
        player.style.pointerEvents = 'none';
        player.style.visibility = 'hidden';
      }
    }
  });

  // Track mouse position to infer hover state
  document.addEventListener('mousemove', function(e) {
    window._lastMouseX = e.clientX;
    window._lastMouseY = e.clientY;
  });
}

// ===== VIDEO AS BACKGROUND TOGGLE =====
let videoBackgroundMode = false;
let savedVideoPlayerStyle = null;

function toggleVideoBackground() {
  const player = document.getElementById('videoPlayer');
  const iframe = document.getElementById('videoIframe');
  const bgVideo = document.getElementById('bgVideo');
  const ytFrame = document.getElementById('ytFrame');
  if (!player || !iframe) {
    logger.warn('🎬 Video player/iframe not found', null, 'VIDEO');
    return;
  }

  if (!videoBackgroundMode) {
    // Enter background mode: place the video iframe behind the canvas
    savedVideoPlayerStyle = {
      display: player.style.display,
      pointerEvents: player.style.pointerEvents,
      zIndex: player.style.zIndex,
      visibility: player.style.visibility,
      position: player.style.position,
      top: player.style.top,
      left: player.style.left,
      width: player.style.width,
      height: player.style.height,
      transform: player.style.transform
    };

    // Ensure other background elements are hidden to avoid stacking
    if (bgVideo) { bgVideo.style.display = 'none'; }
    if (ytFrame) { ytFrame.style.display = 'none'; ytFrame.src = ''; }

    // Expand and move the player behind everything
    player.style.display = 'block';
    player.style.pointerEvents = 'none';
    player.style.zIndex = '-2';
    player.style.visibility = 'visible';
    player.style.position = 'fixed';
    player.style.top = '0';
    player.style.left = '0';
    player.style.width = '100vw';
    player.style.height = '100vh';
    player.style.transform = 'none';

    // Ensure iframe fills container
    iframe.style.width = '100%';
    iframe.style.height = '100%';

    videoBackgroundMode = true;
    logger.success('🎬 Video set as background (iframe behind canvas)', null, 'VIDEO');
  } else {
    // Exit background mode: restore previous player positioning
    if (savedVideoPlayerStyle) {
      player.style.display = savedVideoPlayerStyle.display || '';
      player.style.pointerEvents = savedVideoPlayerStyle.pointerEvents || '';
      player.style.zIndex = savedVideoPlayerStyle.zIndex || '';
      player.style.visibility = savedVideoPlayerStyle.visibility || '';
      player.style.position = savedVideoPlayerStyle.position || '';
      player.style.top = savedVideoPlayerStyle.top || '';
      player.style.left = savedVideoPlayerStyle.left || '';
      player.style.width = savedVideoPlayerStyle.width || '';
      player.style.height = savedVideoPlayerStyle.height || '';
      player.style.transform = savedVideoPlayerStyle.transform || '';
    }

    // Allow interactions with the floating player again
    player.style.pointerEvents = 'auto';
    if (player.style.zIndex === '' || player.style.zIndex === '-2') {
      player.style.zIndex = '9998';
    }

    videoBackgroundMode = false;
    logger.success('🎬 Video background mode disabled', null, 'VIDEO');
  }
}

// Video Playlist loading function
async function loadVideoPlaylist() {
  try {
    // Check if we're running from file:// protocol (local file)
    const isLocalFile = window.location.protocol === 'file:';
    
    if (isLocalFile) {
      logger.warn('📋 Running from local file - playlist loading may be restricted by CORS');
      logger.info('📋 You can upload your own playlist file using the upload button');
      videoPlaylist = [];
      
      // Update display with empty playlist
      if (typeof updateVideoPlaylistDisplay === 'function') {
        await updateVideoPlaylistDisplay();
      }
      
      return videoPlaylist;
    }
    
    // Try to load playlists from playlist.txt
    const playlistResponse = await fetch('playlist.txt', {
      method: 'GET',
      headers: {
        'Accept': 'text/plain',
      }
    });
    
    if (!playlistResponse.ok) {
      throw new Error(`Could not load playlist.txt: ${playlistResponse.status}`);
    }
    
    const playlistContent = await playlistResponse.text();
    const playlistFiles = playlistContent.split('\n')
      .map(line => line.trim())
      .filter(line => line !== '' && line.endsWith('.txt'));
    
    if (playlistFiles.length === 0) {
      throw new Error('No playlist files found in playlist.txt');
    }
    
    // Load the first playlist file as the primary playlist
    const response = await fetch(playlistFiles[0], {
      method: 'GET',
      headers: {
        'Accept': 'text/plain',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const content = await response.text();
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    // Filter for valid URLs (including YouTube, webcam streams, etc.)
    videoPlaylist = lines.filter(line => {
      const trimmedLine = line.trim();
      // Check if it's a valid URL (starts with http:// or https://)
      return trimmedLine.startsWith('http://') || trimmedLine.startsWith('https://');
    });
    
    const youtubeCount = videoPlaylist.filter(url => url.includes('youtube.com') || url.includes('youtu.be')).length;
    const otherCount = videoPlaylist.length - youtubeCount;
    logger.info(`📋 Video Loaded ${videoPlaylist.length} URLs from playlist (${youtubeCount} YouTube videos, ${otherCount} other content)`);
    
    // Update display after loading
    if (typeof updateVideoPlaylistDisplay === 'function') {
      await updateVideoPlaylistDisplay();
    }
    
    return videoPlaylist;
  } catch (error) {
    logger.error('❌ Error loading video playlist:', error);
    logger.info('📋 Creating empty playlist - you can upload your own playlist file');
    
    // Create a default empty playlist
    videoPlaylist = [];
    
    // Update display with empty playlist
    if (typeof updateVideoPlaylistDisplay === 'function') {
      await updateVideoPlaylistDisplay();
    }
    
    return videoPlaylist;
  }
}

async function uploadPlaylist() {
  // Prevent multiple simultaneous uploads
  if (isUploadingPlaylist) {
    logger.warn('📋 Playlist upload already in progress, skipping');
    return;
  }
  
  isUploadingPlaylist = true;
  
  const fileInput = document.getElementById('playlistUpload');
  const file = fileInput.files[0];
  
  if (!file) {
    alert('Please select a .txt file');
    return;
  }
  
  if (!file.name.toLowerCase().endsWith('.txt')) {
    alert('Please select a .txt file');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const content = e.target.result;
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    // Extract all valid URLs from lines and remove duplicates
    const validUrls = lines.filter(line => {
      const trimmedLine = line.trim();
      // Check if it's a valid URL (starts with http:// or https://)
      return trimmedLine.startsWith('http://') || trimmedLine.startsWith('https://');
    });
    
    if (validUrls.length === 0) {
      alert('No valid URLs found in the file. Please include valid URLs (one per line) starting with http:// or https://.');
      return;
    }
    
    // Remove duplicate URLs to prevent playlist duplication
    const uniqueUrls = [...new Set(validUrls)];
    if (uniqueUrls.length !== validUrls.length) {
      logger.warn(`📋 Removed ${validUrls.length - uniqueUrls.length} duplicate URLs from playlist`);
    }
    
    // Replace current playlist with uploaded one (using unique URLs)
    videoPlaylist = uniqueUrls;
    videoCurrentIndex = 0;
    videoTitles = []; // Clear cached titles
    
    // Add to uploaded playlists for cycling (check for duplicates)
    const playlistName = file.name.replace('.txt', '');
    const existingIndex = uploadedPlaylists.findIndex(p => p.name === playlistName);
    
    if (existingIndex === -1) {
      uploadedPlaylists.push({
        name: playlistName,
        urls: uniqueUrls
      });
      currentPlaylistIndex = uploadedPlaylists.length - 1; // Set to the newly uploaded playlist
    } else {
      // Replace existing playlist
      uploadedPlaylists[existingIndex] = {
        name: playlistName,
        urls: uniqueUrls
      };
      currentPlaylistIndex = existingIndex;
    }
    
    // Update display to show the new playlist
    if (typeof updateVideoPlaylistDisplay === 'function') {
      updateVideoPlaylistDisplay();
    }
    
    // Clear the file input
    fileInput.value = '';
    
    const youtubeCount = uniqueUrls.filter(url => url.includes('youtube.com') || url.includes('youtu.be')).length;
    const otherCount = uniqueUrls.length - youtubeCount;
    logger.info(`📋 Uploaded playlist "${playlistName}" with ${uniqueUrls.length} URLs (${youtubeCount} YouTube videos, ${otherCount} other content)`);
    alert(`✅ Uploaded playlist "${playlistName}" with ${uniqueUrls.length} URLs (${youtubeCount} YouTube videos, ${otherCount} other content)`);
  };
  
  reader.readAsText(file);
  
  // Reset upload flag
  isUploadingPlaylist = false;
}

async function nextPlaylist() {
  if (uploadedPlaylists.length === 0) {
    logger.warn('📋 No uploaded playlists available');
    return;
  }
  
  logger.debug(`📋 Before next: currentPlaylistIndex = ${currentPlaylistIndex}, total playlists = ${uploadedPlaylists.length}`);
  logger.debug('📊 Available playlists:', uploadedPlaylists.map((p, i) => `${i}: ${p.name} (${p.urls.length} videos)`));
  
  // Initialize index if it's invalid
  if (currentPlaylistIndex < 0 || currentPlaylistIndex >= uploadedPlaylists.length) {
    currentPlaylistIndex = 0;
    logger.debug('📋 Initialized currentPlaylistIndex to 0');
  }
  
  // Loop to next playlist
  const newIndex = (currentPlaylistIndex + 1) % uploadedPlaylists.length;
  currentPlaylistIndex = newIndex;
  
  logger.debug(`📋 After next: currentPlaylistIndex = ${currentPlaylistIndex}`);
  
  const playlist = uploadedPlaylists[currentPlaylistIndex];
  
  // Update global playlist variables
  videoPlaylist = playlist.urls;
  videoCurrentIndex = 0;
  videoTitles = []; // Clear cached titles for new playlist
  
  // Force update display using silent version to avoid flag conflicts
  await updateVideoPlaylistDisplaySilent();
  
  logger.info(`📋 Switched to next playlist: ${playlist.name} (${playlist.urls.length} videos)`);
}

async function previousPlaylist() {
  if (uploadedPlaylists.length === 0) {
    logger.warn('📋 No uploaded playlists available');
    return;
  }
  
  logger.debug(`📋 Before previous: currentPlaylistIndex = ${currentPlaylistIndex}, total playlists = ${uploadedPlaylists.length}`);
  logger.debug('📊 Available playlists:', uploadedPlaylists.map((p, i) => `${i}: ${p.name} (${p.urls.length} videos)`));
  
  // Initialize index if it's invalid
  if (currentPlaylistIndex < 0 || currentPlaylistIndex >= uploadedPlaylists.length) {
    currentPlaylistIndex = 0;
    logger.debug('📋 Initialized currentPlaylistIndex to 0');
  }
  
  // Loop to previous playlist
  const newIndex = currentPlaylistIndex === 0 ? uploadedPlaylists.length - 1 : currentPlaylistIndex - 1;
  currentPlaylistIndex = newIndex;
  
  logger.debug(`📋 After previous: currentPlaylistIndex = ${currentPlaylistIndex}`);
  
  const playlist = uploadedPlaylists[currentPlaylistIndex];
  
  // Update global playlist variables
  videoPlaylist = playlist.urls;
  videoCurrentIndex = 0;
  videoTitles = []; // Clear cached titles for new playlist
  
  // Force update display using silent version to avoid flag conflicts
  await updateVideoPlaylistDisplaySilent();
  
  logger.info(`📋 Switched to previous playlist: ${playlist.name} (${playlist.urls.length} videos)`);
}

async function playRandomVideo() {
  if (videoPlaylist.length === 0) {
    logger.warn('📋 No videos in current playlist');
    return;
  }
  
  const randomIndex = Math.floor(Math.random() * videoPlaylist.length);
  videoPlayVideo(randomIndex);
  logger.info(`🎲 Playing random video: ${randomIndex + 1} of ${videoPlaylist.length}`);
}

function loadUploadedPlaylist(index) {
  if (index < 0 || index >= uploadedPlaylists.length) return;
  
  const playlist = uploadedPlaylists[index];
  
  // Update current playlist index to match what we're loading
  currentPlaylistIndex = index;
  
  // Update global playlist variables
  videoPlaylist = playlist.urls;
  videoCurrentIndex = 0;
  videoTitles = []; // Clear cached titles for new playlist
  
  // Update display once using silent version to avoid conflicts
  if (typeof updateVideoPlaylistDisplaySilent === 'function') {
    updateVideoPlaylistDisplaySilent();
  } else if (typeof updateVideoPlaylistDisplay === 'function') {
    updateVideoPlaylistDisplay();
  }
  
  // Don't auto-play first video - let user choose when to start
  // if (typeof videoPlayVideo === 'function') {
  //   videoPlayVideo(0);
  // }
  
          logger.info(`🔄 Loaded uploaded playlist: ${playlist.name} with ${playlist.urls.length} videos (index: ${index})`);
}

// ===== VIDEO PLAYER FUNCTIONS =====

function extractYouTubeId(url) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^\s&]+)/);
  return match ? match[1] : null;
}

async function fetchVideoTitle(videoId) {
  try {
    // Use YouTube oEmbed API to get video title
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      mode: 'cors' // Explicitly set CORS mode
    });
    
    if (response.ok) {
      const data = await response.json();
              logger.info('✅ Successfully fetched video title for', videoId, ':', data.title);
      return data.title;
    } else {
              logger.warn('⚠️ YouTube API returned status:', response.status, 'for video', videoId);
    }
  } catch (error) {
          logger.warn('⚠️ Network error fetching video title for', videoId, ':', error.message);
    // Don't log the full error to avoid console spam
  }
  return null;
}

function videoPlayVideo(index) {
  if (index < 0 || index >= videoPlaylist.length) return;
  
  // Stop any currently playing MP4 video when switching to playlist video
  if (isPlayingMp4) {
    stopMp4Video();
            logger.info('🎬 Stopped MP4 video to play playlist video');
  }
  
  // Stop any currently playing single video stream when switching to playlist video
  if (isPlayingSingleVideo) {
    stopSingleVideoStream();
            logger.info('🎥 Stopped single video stream to play playlist video');
  }
  
  videoCurrentIndex = index;
  const url = videoPlaylist[index];
  const videoId = extractYouTubeId(url);
  
  const iframe = document.getElementById('videoIframe');
  if (!iframe) {
    logger.error('❌ Video iframe not found');
    return;
  }
  
  // Check if it's a YouTube URL or other type of URL
  if (videoId) {
    // Handle YouTube videos
    logger.debug('🎵 videoPlayVideo debug (YouTube):', {
      index: index,
      videoId: videoId
    });
    
    // If video previously flagged unembeddable, open on YouTube instead
    if (unembeddableVideoIds && unembeddableVideoIds.has(videoId)) {
      const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
      window.open(watchUrl, '_blank');
      logger.warn('📺 Opening video on YouTube due to embed restrictions', videoId, 'VIDEO');
      return;
    }
    
    // Prefer IFrame API; fallback to standard embed
    ensureYouTubeAPI().then(() => {
      try {
        initYouTubePlayer(videoId);
      } catch (e) {
        const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1&loop=1&playlist=${videoId}&enablejsapi=1&origin=${window.location.origin}`;
        iframe.src = embedUrl;
      }
      videoIsPlaying = true;
      logger.info('🎵 Video Playing YouTube video:', index + 1, 'of', videoPlaylist.length, 'Video ID:', videoId);
    });
  } else {
    // Handle non-YouTube URLs (webcam streams, direct video links, etc.)
    logger.info('🌐 Playing non-YouTube URL from playlist:', url);
    
    const contentType = detectContentType(url);
    let embedUrl;
    
    switch(contentType) {
      case 'video':
        // Handle direct video streams by creating an HTML5 video player
        const videoHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { margin: 0; padding: 0; background: black; display: flex; justify-content: center; align-items: center; height: 100vh; }
              video { max-width: 100%; max-height: 100%; object-fit: contain; }
            </style>
          </head>
          <body>
            <video controls autoplay loop crossorigin="anonymous">
              <source src="${url}" type="video/mp4">
              <source src="${url}" type="video/webm">
              <source src="${url}" type="video/ogg">
              <source src="${url}">
              <p>Your browser doesn't support HTML5 video. <a href="${url}">Download the video</a> instead.</p>
            </video>
            <script>
              const video = document.querySelector('video');
              video.addEventListener('loadstart', () => {
                console.log('🎥 Video loading started');
              });
              video.addEventListener('error', (e) => {
                console.error('🎥 Video error:', e);
                document.body.innerHTML = '<div style="color: white; text-align: center; padding: 20px;">Error loading video stream. Please check the URL and try again.</div>';
              });
              video.addEventListener('canplay', () => {
                console.log('🎥 Video ready to play');
              });
            </script>
          </body>
          </html>
        `;
        
        const blob = new Blob([videoHtml], { type: 'text/html' });
        embedUrl = URL.createObjectURL(blob);
        logger.info('🎥 Created HTML5 video player for video stream in playlist');
        break;
        
      case 'website':
      default:
        // Handle regular websites by loading them directly in iframe
        embedUrl = url;
        logger.info('🌐 Loading website directly in iframe from playlist');
        break;
    }
    
    // Load the content in the iframe
    iframe.src = embedUrl;
    videoIsPlaying = true;
    logger.info('🌐 Playing non-YouTube content:', index + 1, 'of', videoPlaylist.length, 'URL:', url);
  }
  
  // Update the play button icon after a short delay to allow iframe to load
  setTimeout(() => {
    updateVideoPlayButtonIcon();
  }, 1000);
  
  // Update display without triggering the flag system
  updateVideoPlaylistDisplaySilent();
}

function videoTogglePlay() {
  const iframe = document.getElementById('videoIframe');
          logger.debug('🎥 videoTogglePlay called');
      logger.debug('🎥 iframe:', iframe);
      logger.debug('🎥 videoIsPlaying before:', videoIsPlaying);
  
  if (iframe) {
    try {
      // Toggle between play and pause
      if (videoIsPlaying) {
        // Try multiple methods to pause the video
        iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        iframe.contentWindow.postMessage('{"event":"command","func":"stopVideo","args":""}', '*');
        videoIsPlaying = false;
        logger.info('⏸️ Video paused');
      } else {
        // Try multiple methods to play the video
        iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":[]}', '*');
        videoIsPlaying = true;
        logger.info('▶️ Video playing');
      }
      
              logger.debug('🎥 videoIsPlaying after:', videoIsPlaying);
      
      // Update the play button icon
      updateVideoPlayButtonIcon();
      
      // Update the main video button icon
      updateVideoButtonIcon();
      
      // Also try to reload the iframe if postMessage fails
      setTimeout(() => {
        if (videoIsPlaying && iframe.src) {
          logger.info('🔄 Attempting to force play by reloading iframe');
          const currentSrc = iframe.src;
          iframe.src = currentSrc.replace('autoplay=0', 'autoplay=1');
          setTimeout(() => {
            iframe.src = currentSrc;
          }, 100);
        }
      }, 500);
      
      // Alternative approach: try to click the play button inside the iframe
      setTimeout(() => {
        if (videoIsPlaying) {
          logger.info('🎥 Attempting alternative play method');
          try {
            // Try to find and click the play button inside the iframe
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            const playButton = iframeDoc.querySelector('.ytp-play-button');
            if (playButton) {
              playButton.click();
              logger.info('🎥 Clicked play button inside iframe');
            }
          } catch (error) {
            logger.warn('⚠️ Could not access iframe content (CORS restriction)');
          }
        }
      }, 1000);
      
    } catch (error) {
      logger.error('❌ Error toggling video:', error);
      // Fallback: just toggle the state and update button
      videoIsPlaying = !videoIsPlaying;
      updateVideoPlayButtonIcon();
    }
  } else {
            logger.error('❌ No video iframe found');
  }
}

// Keep the old functions for backward compatibility
function videoPlay() {
  const iframe = document.getElementById('videoIframe');
  if (iframe) {
    iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
    videoIsPlaying = true;
  }
}

function videoPause() {
  const iframe = document.getElementById('videoIframe');
  if (iframe) {
    iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
    videoIsPlaying = false;
  }
}

function videoNext() {
  if (videoPlaylist.length > 0) {
    videoCurrentIndex = (videoCurrentIndex + 1) % videoPlaylist.length;
    videoPlayVideo(videoCurrentIndex);
  }
}

function videoPrev() {
  if (videoPlaylist.length > 0) {
    videoCurrentIndex = videoCurrentIndex === 0 ? videoPlaylist.length - 1 : videoCurrentIndex - 1;
    videoPlayVideo(videoCurrentIndex);
  }
}

function videoTogglePlaylist() {
  const playlist = document.getElementById('videoPlaylist');
  const playlistButton = document.querySelector('#videoControls button[onclick="videoTogglePlaylist()"]');
  
  videoPlaylistVisible = !videoPlaylistVisible;
  
  if (videoPlaylistVisible) {
    // Show playlist
    playlist.style.display = 'block';
    playlist.style.pointerEvents = 'auto';
    playlist.style.zIndex = '9999';
    playlist.style.visibility = 'visible';
    playlist.style.opacity = '1';
    
    // Update button text to show it's ON
    if (playlistButton) {
      playlistButton.textContent = '📋';
      playlistButton.title = 'Hide Playlist';
    }
    
    // Auto-hide after 60 seconds
    videoPlaylistTimeout = setTimeout(() => {
      if (videoPlaylistVisible) {
        videoTogglePlaylist(); // This will hide the playlist
        logger.info('📋 Video playlist auto-hidden after 60 seconds');
      }
    }, 60000);
  } else {
    // Hide playlist
    playlist.style.display = 'none';
    playlist.style.pointerEvents = 'none';
    playlist.style.zIndex = '-1';
    playlist.style.visibility = 'hidden';
    playlist.style.opacity = '0';
    
    // Update button text to show it's OFF
    if (playlistButton) {
      playlistButton.textContent = '📋';
      playlistButton.title = 'Show Playlist';
    }
    
    // Clear any existing timeout
    if (videoPlaylistTimeout) {
      clearTimeout(videoPlaylistTimeout);
      videoPlaylistTimeout = null;
    }
  }
  
          logger.info('📋 Playlist toggled:', videoPlaylistVisible ? 'ON' : 'OFF');
}

function videoToggleFullscreen() {
  const player = document.getElementById('videoPlayer');
  if (player) {
    if (document.fullscreenElement) {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
              logger.info('🖥️ Exiting fullscreen');
    } else {
      // Enter fullscreen
      if (player.requestFullscreen) {
        player.requestFullscreen();
      } else if (player.webkitRequestFullscreen) {
        player.webkitRequestFullscreen();
      } else if (player.mozRequestFullScreen) {
        player.mozRequestFullScreen();
      } else if (player.msRequestFullscreen) {
        player.msRequestFullscreen();
      }
              logger.info('🖥️ Entering fullscreen');
    }
  }
}

function updateVideoOpacity(value) {
  const player = document.getElementById('videoPlayer');
  if (player) {
    player.style.opacity = value;
            logger.info('🎥 Video opacity updated to:', value);
    
    // If opacity is 0, make sure the player is still functional
    if (parseFloat(value) === 0) {
              logger.info('🎥 Video player is now invisible but still functional');
    }
  }
}

function updateVideoSize(value) {
  const player = document.getElementById('videoPlayer');
  if (player) {
    const scale = parseFloat(value);
    // Get current vertical offset from transform
    const currentTransform = player.style.transform || '';
    const verticalMatch = currentTransform.match(/calc\(-50% \+ (-?\d+)px\)/);
    const verticalOffset = verticalMatch ? parseInt(verticalMatch[1]) : 0;
    
    // Apply scale with preserved vertical position
    player.style.transform = `translate(-50%, calc(-50% + ${verticalOffset}px)) scale(${scale})`;
            logger.info('🎥 Video size updated to:', scale);
  }
}

function updateVideoVertical(value) {
  const player = document.getElementById('videoPlayer');
  if (player) {
    const verticalOffset = parseInt(value);
    // Get current scale from transform
    const currentTransform = player.style.transform || '';
    const scaleMatch = currentTransform.match(/scale\(([^)]+)\)/);
    const scale = scaleMatch ? scaleMatch[1] : '1';
    
    // Apply vertical position with preserved scale (inverted)
    player.style.transform = `translate(-50%, calc(-50% - ${verticalOffset}px)) scale(${scale})`;
            logger.info('🎥 Video vertical position updated to:', -verticalOffset, 'px');
  }
}

function videoClose() {
  const player = document.getElementById('videoPlayer');
  const controls = document.getElementById('videoControls');
  const playlist = document.getElementById('videoPlaylist');
  const iframe = document.getElementById('videoIframe');
  
  // Stop the video by clearing the iframe src
  if (iframe) {
    iframe.src = '';
    videoIsPlaying = false;
            logger.info('🎥 Video stopped');
  }
  
  // Reset video player state
  videoCurrentIndex = 0;
  videoPlayerInitialized = false;
  videoPlayerFirstOpen = true; // Reset first open flag when video is closed
  window.videoPlayerFirstOpen = true;
  
  
  // Hide all video elements
  if (player) {
    player.style.display = 'none';
    player.style.pointerEvents = 'none';
    player.style.zIndex = '-1';
    player.style.visibility = 'hidden';
  }
  
  if (controls) {
    controls.style.display = 'none';
    controls.style.pointerEvents = 'none';
    controls.style.zIndex = '-1';
    controls.style.visibility = 'hidden';
  }
  
  if (playlist) {
    playlist.style.display = 'none';
    playlist.style.pointerEvents = 'none';
    playlist.style.zIndex = '-1';
    playlist.style.visibility = 'hidden';
    videoPlaylistVisible = false;
  }
  
  videoPlaylistVisible = false;
  
  // Update toolbar icon based on current state
  if (typeof updateVideoButtonIcon === 'function') {
    updateVideoButtonIcon();
  }
  
  // Clean up video enhancement
  if (window.videoEnhancementCleanup) {
    window.videoEnhancementCleanup();
    window.videoEnhancementCleanup = null;
    logger.debug('🎥 Video enhancement cleaned up');
  }
  
  logger.info('🎥 Video player closed and video stopped');
}

function showVideoControls() {
  const player = document.getElementById('videoPlayer');
  const controls = document.getElementById('videoControls');
  
          logger.debug('🎥 showVideoControls called');
      logger.debug('🎥 Player:', player);
      logger.debug('🎥 Controls:', controls);
      logger.debug('🎥 Player display:', player ? player.style.display : 'no player');
  
  // Only show controls if video player is visible
  if (controls && player && player.style.display !== 'none') {
    controls.style.display = 'block';
    controls.style.pointerEvents = 'auto';
    controls.style.zIndex = '20001';
            logger.info('🎥 Video controls shown with z-index:', controls.style.zIndex);
    
    // Start auto-hide timer when controls are shown
    startVideoControlsAutoHide();
  } else {
            logger.debug('🎥 Video controls not shown - conditions not met');
  }
}

function showVideoPlaylist() {
  const player = document.getElementById('videoPlayer');
  const playlist = document.getElementById('videoPlaylist');
  
  // Only show playlist if video player is visible AND playlist toggle is ON
  if (playlist && player && player.style.display !== 'none' && videoPlaylistVisible) {
    playlist.style.opacity = '1';
    playlist.style.display = 'block';
    playlist.style.pointerEvents = 'auto';
    playlist.style.zIndex = '9999';
    playlist.style.visibility = 'visible';
  }
}

// ===== VIDEO CONTROLS AUTO-HIDE FUNCTIONS =====

function startVideoControlsAutoHide() {
  // Clear any existing timeout
  if (videoControlsTimeout) {
    clearTimeout(videoControlsTimeout);
  }
  
  // Set new timeout to hide controls after 10 seconds
  videoControlsTimeout = setTimeout(() => {
    hideVideoControls();
  }, 10000);
  
          logger.info('⏰ Video controls auto-hide timer started (10s)');
}

function hideVideoControls() {
  const controls = document.getElementById('videoControls');
  if (controls && controls.style.display !== 'none') {
    controls.classList.add('fade-out');
    videoControlsVisible = false;
            logger.info('👻 Video controls faded out');
  }
}

function showVideoControlsOnMouseMove() {
  const controls = document.getElementById('videoControls');
  if (controls && controls.style.display !== 'none') {
    // Clear existing timeout
    if (videoControlsTimeout) {
      clearTimeout(videoControlsTimeout);
    }
    
    // Show controls if they were hidden
    if (!videoControlsVisible) {
      controls.classList.remove('fade-out');
      videoControlsVisible = true;
              logger.info('👁️ Video controls shown on mouse move');
    }
    
    // Restart auto-hide timer
    startVideoControlsAutoHide();
  }
}

// Auto-hide functionality removed - playlist now only toggles via button

// Flag to prevent multiple simultaneous updates
let isUpdatingPlaylistDisplay = false;
let videoPlayerInitialized = false;
let videoPlayerFirstOpen = true; // Track if this is the first time opening the video player

// Make videoPlayerFirstOpen globally accessible
window.videoPlayerFirstOpen = videoPlayerFirstOpen;

async function updateVideoPlaylistDisplay() {
  // Prevent multiple simultaneous updates
  if (isUpdatingPlaylistDisplay) {
    logger.debug('📋 Playlist display update already in progress, skipping');
    return;
  }
  
  // Additional check to prevent updates if playlist is empty
  if (!videoPlaylist || videoPlaylist.length === 0) {
    logger.debug('📋 Playlist is empty, skipping display update');
    return;
  }
  
  isUpdatingPlaylistDisplay = true;
  
  const playlistContainer = document.getElementById('videoPlaylistItems');
  if (!playlistContainer) {
    logger.error('❌ Video Playlist container not found');
    isUpdatingPlaylistDisplay = false;
    return;
  }
  
  // Update playlist header to show current playlist name
  const playlistHeader = document.querySelector('#videoPlaylist h3');
  const currentPlaylistLabel = document.getElementById('currentPlaylistLabel');
  
  if (uploadedPlaylists.length > 0 && currentPlaylistIndex >= 0 && currentPlaylistIndex < uploadedPlaylists.length) {
    const currentPlaylist = uploadedPlaylists[currentPlaylistIndex];
    if (playlistHeader) {
      playlistHeader.textContent = `💚 ${currentPlaylist.name} (${currentPlaylist.urls.length} videos) ♻️`;
    }
    if (currentPlaylistLabel) {
      currentPlaylistLabel.textContent = `Playing: ${currentPlaylist.name}`;
    }
  } else {
    if (playlistHeader) {
      playlistHeader.textContent = '💚 Video Playlist ♻️';
    }
    if (currentPlaylistLabel) {
      currentPlaylistLabel.textContent = '📋 Upload Playlist (.txt):';
    }
  }
  
  logger.info('📋 Video Updating playlist display with', videoPlaylist.length, 'videos');
  
  // Clear the container completely to prevent duplicates
  playlistContainer.innerHTML = '';
  
  // Additional safety check - ensure we have a clean slate
  if (playlistContainer.children.length > 0) {
    logger.warn('📋 Container still has children after clearing, forcing removal');
    while (playlistContainer.firstChild) {
      playlistContainer.removeChild(playlistContainer.firstChild);
    }
  }
  
  for (let index = 0; index < videoPlaylist.length; index++) {
    const url = videoPlaylist[index];
    const item = document.createElement('div');
    item.className = 'playlist-item';
    
    // Get video ID and title
    const videoId = extractYouTubeId(url);
    let title = videoTitles[index];
    
    // If title not cached, fetch it (but only if we haven't already tried)
    if (!title && videoId && !videoTitles[index]) {
      try {
        title = await fetchVideoTitle(videoId);
        if (title) {
          videoTitles[index] = title;
        } else {
          // Mark as attempted to avoid repeated failed requests
          videoTitles[index] = null;
        }
      } catch (error) {
        logger.error('Error fetching video title for silent playlist display', { error: error.message, videoId, index }, 'VIDEO');
        // Mark as attempted to avoid repeated failed requests
        videoTitles[index] = null;
      }
    }
    
    // Generate display text for different types of URLs
    let displayText;
    if (title) {
      displayText = title;
    } else if (videoId) {
      displayText = `Video ${index + 1} (${videoId})`;
    } else {
      // For non-YouTube URLs, create a descriptive title
      const contentType = detectContentType(url);
      if (contentType === 'video') {
        // Extract filename from URL or use domain
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const filename = pathname.split('/').pop() || urlObj.hostname;
        displayText = `Stream ${index + 1} (${filename})`;
      } else if (contentType === 'website') {
        // Use domain name for websites
        const urlObj = new URL(url);
        displayText = `Website ${index + 1} (${urlObj.hostname})`;
      } else {
        displayText = `Content ${index + 1} (${url})`;
      }
    }
    
    item.textContent = displayText;
    
    item.onclick = () => {
      logger.info('📋 Video Clicked playlist item:', index, 'Title:', displayText, 'URL:', url);
      videoPlayVideo(index);
      showVideoPlaylist(); // Show playlist when clicking
    };
    
    if (index === videoCurrentIndex) {
      item.classList.add('playing');
    }
    playlistContainer.appendChild(item);
  }
  
  logger.info('📋 Video Playlist display updated');
  isUpdatingPlaylistDisplay = false;
}

// Silent version that doesn't use the flag system
async function updateVideoPlaylistDisplaySilent() {
  const playlistContainer = document.getElementById('videoPlaylistItems');
  if (!playlistContainer) {
    logger.error('❌ Video Playlist container not found');
    return;
  }
  
  // Update playlist header to show current playlist name
  const playlistHeader = document.querySelector('#videoPlaylist h3');
  const currentPlaylistLabel = document.getElementById('currentPlaylistLabel');
  
  if (uploadedPlaylists.length > 0 && currentPlaylistIndex >= 0 && currentPlaylistIndex < uploadedPlaylists.length) {
    const currentPlaylist = uploadedPlaylists[currentPlaylistIndex];
    if (playlistHeader) {
      playlistHeader.textContent = `💚 ${currentPlaylist.name} (${currentPlaylist.urls.length} videos) ♻️`;
    }
    if (currentPlaylistLabel) {
      currentPlaylistLabel.textContent = `Playing: ${currentPlaylist.name}`;
    }
  } else {
    if (playlistHeader) {
      playlistHeader.textContent = '💚 Video Playlist ♻️';
    }
    if (currentPlaylistLabel) {
      currentPlaylistLabel.textContent = '📋 Upload Playlist (.txt):';
    }
  }
  
  // Rebuild the entire playlist items list to reflect the current playlist
  logger.info('📋 Video Updating playlist display (silent) with', videoPlaylist.length, 'videos');
  playlistContainer.innerHTML = '';
  
  for (let index = 0; index < videoPlaylist.length; index++) {
    const url = videoPlaylist[index];
    const item = document.createElement('div');
    item.className = 'playlist-item';
    
    // Get video ID and title
    const videoId = extractYouTubeId(url);
    let title = videoTitles[index];
    
    // If title not cached, fetch it (but only if we haven't already tried)
    if (!title && videoId && !videoTitles[index]) {
      try {
        title = await fetchVideoTitle(videoId);
        if (title) {
          videoTitles[index] = title;
        } else {
          // Mark as attempted to avoid repeated failed requests
          videoTitles[index] = null;
        }
      } catch (error) {
        logger.error('Error fetching video title for playlist display', { error: error.message, videoId, index }, 'VIDEO');
        // Mark as attempted to avoid repeated failed requests
        videoTitles[index] = null;
      }
    }
    
    // Generate display text for different types of URLs
    let displayText;
    if (title) {
      displayText = title;
    } else if (videoId) {
      displayText = `Video ${index + 1} (${videoId})`;
    } else {
      // For non-YouTube URLs, create a descriptive title
      const contentType = detectContentType(url);
      if (contentType === 'video') {
        // Extract filename from URL or use domain
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const filename = pathname.split('/').pop() || urlObj.hostname;
        displayText = `Stream ${index + 1} (${filename})`;
      } else if (contentType === 'website') {
        // Use domain name for websites
        const urlObj = new URL(url);
        displayText = `Website ${index + 1} (${urlObj.hostname})`;
      } else {
        displayText = `Content ${index + 1} (${url})`;
      }
    }
    
    item.textContent = displayText;
    
    item.onclick = () => {
      logger.info('📋 Video Clicked playlist item:', index, 'Title:', displayText, 'URL:', url);
      videoPlayVideo(index);
      showVideoPlaylist(); // Show playlist when clicking
    };
    
    if (index === videoCurrentIndex) {
      item.classList.add('playing');
    }
    playlistContainer.appendChild(item);
  }
  
  logger.info('📋 Video Playlist display updated (silent)');
}

async function toggleVideoPlayer() {
  const player = document.getElementById('videoPlayer');
  const controls = document.getElementById('videoControls');
  const playlist = document.getElementById('videoPlaylist');
  
  if (!player) return;
  
  // Check if video player is currently visible by checking both inline style and computed style
  const isVisible = player.style.display !== 'none' && 
                   getComputedStyle(player).display !== 'none' &&
                   player.style.visibility !== 'hidden' &&
                   getComputedStyle(player).visibility !== 'hidden';
  
  logger.debug('🎥 Toggle video player - Current state:', {
    display: player.style.display,
    computedDisplay: getComputedStyle(player).display,
    visibility: player.style.visibility,
    computedVisibility: getComputedStyle(player).visibility,
    isVisible: isVisible
  });
  
  if (isVisible) {
    // Just hide video elements without stopping playback
    if (player) {
      player.style.display = 'none';
      player.style.pointerEvents = 'none';
      player.style.zIndex = '-1';
      player.style.visibility = 'hidden';
    }
    if (controls) {
      controls.style.display = 'none';
      controls.style.pointerEvents = 'none';
      controls.style.zIndex = '-1';
      controls.style.visibility = 'hidden';
    }
    if (playlist) {
      playlist.style.display = 'none';
      playlist.style.pointerEvents = 'none';
      playlist.style.zIndex = '-1';
      playlist.style.visibility = 'hidden';
    }
    videoPlaylistVisible = false;
    logger.info('🎥 Video player hidden (playback continues)');
    
    // Reset first open flag when video player is closed
    videoPlayerFirstOpen = true;
    window.videoPlayerFirstOpen = true;
    
    // Keep icon logic centralized
    if (typeof updateVideoButtonIcon === 'function') {
      updateVideoButtonIcon();
    }
  } else {
    // Show video player with proper z-index and current opacity
    if (player) {
      player.style.display = 'block';
      player.style.pointerEvents = 'auto';
      player.style.zIndex = '9998';
      player.style.visibility = 'visible';
      
      // Apply current opacity setting
      const opacitySlider = document.getElementById('videoOpacitySlider');
      if (opacitySlider) {
        player.style.opacity = opacitySlider.value;
      }
    }
    
    // Show controls initially
    if (controls) {
      controls.style.display = 'block';
      controls.style.pointerEvents = 'auto';
      controls.style.zIndex = '9997';
      controls.style.visibility = 'visible';
    }

    // Wire pop-out button each time player is shown
    const popBtn = document.getElementById('videoPopoutBtn');
    const iframeEl = document.getElementById('videoIframe');
    if (popBtn && iframeEl) {
      popBtn.onclick = function() {
        try {
          const iframe = document.getElementById('videoIframe');
          const src = (iframe && iframe.src) ? iframe.src : '';
          if (!src) return;
          // If YouTube embed, convert to watch URL
          const ytMatch = src.match(/youtube\.com\/embed\/([^?&]+)/);
          if (ytMatch && ytMatch[1]) {
            const watchUrl = `https://www.youtube.com/watch?v=${ytMatch[1]}`;
            window.open(watchUrl, '_blank');
          } else {
            window.open(src, '_blank');
          }
        } catch(_) {}
      };
    }
    
    // Initialize video player only if it hasn't been initialized OR if it was closed (iframe src is empty)
    const iframe = document.getElementById('videoIframe');
    const needsInitialization = !videoPlayerInitialized || (iframe && iframe.src === '');
    
    if (needsInitialization) {
      videoPlayerInitialized = true;
      logger.info('🎥 Video player initialized/reinitialized');
      
      // Use pre-loaded playlists if available, but don't auto-play the first video
      if (uploadedPlaylists.length > 0) {
        currentPlaylistIndex = 0;
        // Load playlist without auto-playing first video
        const playlist = uploadedPlaylists[currentPlaylistIndex];
        videoPlaylist = playlist.urls;
        videoCurrentIndex = 0;
        videoTitles = []; // Clear cached titles for new playlist
        
        // Defer playlist UI update to a single call later to avoid duplicates
        
        // Auto-play first video on first open
        if (videoPlayerFirstOpen && videoPlaylist.length > 0) {
          videoPlayerFirstOpen = false;
          window.videoPlayerFirstOpen = false;
          setTimeout(() => {
            videoPlayVideo(0);
            logger.info('🎥 Auto-playing first video on first open');
          }, 500); // Small delay to ensure iframe is ready
        }
        
        logger.info('🎥 Video player opened with pre-loaded playlist (no auto-play)');
      } else {
        // If no pre-loaded playlists, wait a moment and try to preload them
        setTimeout(async () => {
          await preloadPlaylists();
          if (uploadedPlaylists.length > 0) {
            currentPlaylistIndex = 0;
            // Load playlist without auto-playing first video
            const playlist = uploadedPlaylists[currentPlaylistIndex];
            videoPlaylist = playlist.urls;
            videoCurrentIndex = 0;
            videoTitles = []; // Clear cached titles for new playlist
            
            // Defer playlist UI update to a single call later to avoid duplicates
            
            // Auto-play first video on first open
            if (videoPlayerFirstOpen && videoPlaylist.length > 0) {
              videoPlayerFirstOpen = false;
              window.videoPlayerFirstOpen = false;
              setTimeout(() => {
                videoPlayVideo(0);
                logger.info('🎥 Auto-playing first video on first open (delayed loading)');
              }, 500); // Small delay to ensure iframe is ready
            }
            
            logger.info('🎥 Video player opened after delayed playlist loading (no auto-play)');
          } else {
            logger.info('🎥 No playlists available - video player ready for manual uploads');
          }
        }, 100);
      }
    } else {
      logger.info('🎥 Video player toggled (no reinitialization needed)');
    }
      
    // Perform a single playlist UI update after state is set to prevent first-load duplication
    if (needsInitialization && typeof updateVideoPlaylistDisplay === 'function') {
      updateVideoPlaylistDisplay();
    }
    
    // Start with playlist hidden and update button text
    if (playlist) {
      playlist.style.display = 'none';
      playlist.style.opacity = '0';
      playlist.style.pointerEvents = 'none';
      playlist.style.zIndex = '-1';
      playlist.style.visibility = 'hidden';
    }
    
    // Update playlist button text to show it's OFF initially
    const playlistButton = document.querySelector('#videoControls button[onclick="videoTogglePlaylist()"]');
    if (playlistButton) {
      playlistButton.textContent = '📋';
      playlistButton.title = 'Show Playlist';
    }
    
    // Reset playlist visibility state
    videoPlaylistVisible = false;
    
    // Keep icon logic centralized
    if (typeof updateVideoButtonIcon === 'function') {
      updateVideoButtonIcon();
    }
  }
  
  logger.info('🎥 Video player toggled:', isVisible ? 'hidden' : 'shown');
}

// ===== MODULAR ANIMATION SYSTEM =====

// Animation Configuration
const ANIMATION_CONFIG = {
  defaultDuration: 10000, // 10 seconds
  minKeyframes: 2,
  timelineStep: 0.01
};

// Animation State Manager
const AnimationState = {
  data: {
    inPoint: null,
    outPoint: null,
    keyframes: [],
    duration: ANIMATION_CONFIG.defaultDuration,
    isRecording: false,
    isPlaying: false,
    currentTime: 0,
    startTime: 0
  },
  
  timelineMarkers: [],
  playbackStartTime: 0,
  playbackDuration: 0,
  currentPlaybackTime: 0,
  
  // Reset animation state
  reset() {
    this.data.keyframes = [];
    this.timelineMarkers = [];
    this.data.isRecording = false;
    this.data.isPlaying = false;
    logger.info('🔄 Animation state reset');
  },
  
  // Get current state
  getState() {
    return { ...this.data };
  },
  
  // Update duration
  updateDuration(duration) {
    this.data.duration = duration;
    logger.info(`⏱️ Animation duration updated: ${duration}ms`);
  }
};

function recordState(type) {
  // Get duration from dropdown
  const durationSelect = document.getElementById('mediaPlaybackDuration');
  const duration = parseInt(durationSelect.value);
  AnimationState.updateDuration(duration);
  // Ensure timeline slider max reflects duration in seconds
  const timelineSlider = document.getElementById('mediaPlaybackSlider');
  if (timelineSlider) {
    timelineSlider.min = 0;
    timelineSlider.max = 1;
    timelineSlider.step = ANIMATION_CONFIG.timelineStep;
  }
  
  if (type === 'start') {
    // If toolbar is hidden, show it minimized; if minimized, expand to full for marking In
    const bar = document.getElementById('mediaToolbar');
    if (bar) {
      if (bar.style.display === 'none' || getComputedStyle(bar).display === 'none') {
        bar.style.display = 'flex';
        if (!bar.classList.contains('minimized')) bar.classList.add('minimized');
        isMediaToolbarMinimized = true;
      }
      // Expand to maximize for editing when marking In
      if (bar.classList.contains('minimized')) {
        bar.classList.remove('minimized');
        isMediaToolbarMinimized = false;
      }
    }
    // Auto-pause if speed is not 0
    if (typeof speedMultiplier !== 'undefined' && speedMultiplier !== 0) {
      if (typeof togglePauseButton === 'function') {
        togglePauseButton();
      }
    }
    
    // Reset animation state
    AnimationState.reset();
    updateTimelineDisplay();
    
    // Set in point at 0 seconds and out point at full duration
    AnimationState.data.inPoint = 0;
    AnimationState.data.outPoint = duration / 1000;
    AnimationState.data.isRecording = true;
    
    logger.info('🎬 In point set at 0s, Out point set at', (duration / 1000).toFixed(1), 's');
    
    // Capture current bubble positions
    const currentPositions = captureBubblePositions();
    
    // Create keyframes: in point (0s) and out point (full duration) with same positions
    AnimationState.data.keyframes = [
      {
        time: 0,
        positions: currentPositions
      },
      {
        time: duration / 1000,
        positions: currentPositions
      }
    ];
    
    // Add timeline markers
    addTimelineMarker('in', 0);
    addTimelineMarker('out', duration / 1000);
    
    // Reset slider to start when marking in
    const timelineSliderEl = document.getElementById('mediaPlaybackSlider');
    if (timelineSliderEl) timelineSliderEl.value = 0;
    updateTimelineDisplay();
    
    // Update time display
    updatePlaybackTimeDisplay(0, duration / 1000);
    
    logger.info('✅ Animation ready: In and Out points created with current positions');
    logger.info('📊 Keyframes created:', AnimationState.data.keyframes.length);
    AnimationState.data.keyframes.forEach((kf, index) => {
      logger.debug(`  Keyframe ${index}: time=${kf.time}s, positions=${kf.positions.length}`);
    });
    
  } else if (type === 'end') {
    // Determine end time from slider (or default to full duration if missing)
    const timelineSlider = document.getElementById('mediaPlaybackSlider');
    const sliderProgress = timelineSlider ? parseFloat(timelineSlider.value) : 1;
    const endTime = Math.max(0, Math.min(1, isNaN(sliderProgress) ? 1 : sliderProgress)) * (duration / 1000);

    const oldOut = AnimationState.data.outPoint;
    AnimationState.data.outPoint = endTime;
    // Ending recording session if it was active
    AnimationState.data.isRecording = false;
    logger.info('🏁 Out point set to', endTime.toFixed(1), 's');

    // Update markers and slider display
    updateTimelineMarkers();
    if (timelineSlider) {
      const newProgress = endTime / (duration / 1000);
      timelineSlider.value = Math.max(0, Math.min(1, newProgress));
    }

    // Capture current bubble positions for out point
    const endPositions = captureBubblePositions();

    // Ensure we have at least an in keyframe at 0
    if (AnimationState.data.keyframes.length === 0) {
      AnimationState.data.keyframes.push({ time: 0, positions: endPositions });
    }

    // Update or insert the out keyframe
    let updated = false;
    if (typeof oldOut === 'number') {
      const oldIdx = AnimationState.data.keyframes.findIndex(kf => kf.time === oldOut);
      if (oldIdx !== -1) {
        AnimationState.data.keyframes[oldIdx].time = endTime;
        AnimationState.data.keyframes[oldIdx].positions = endPositions;
        updated = true;
      }
    }
    if (!updated) {
      // Try to find an existing keyframe at new end time to update
      const exactIdx = AnimationState.data.keyframes.findIndex(kf => kf.time === endTime);
      if (exactIdx !== -1) {
        AnimationState.data.keyframes[exactIdx].positions = endPositions;
      } else {
        AnimationState.data.keyframes.push({ time: endTime, positions: endPositions });
      }
    }

    // Keep keyframes ordered
    AnimationState.data.keyframes.sort((a, b) => a.time - b.time);

    // Update time display
    updatePlaybackTimeDisplay(endTime, duration / 1000);

    logger.info('✅ Out point updated with current positions (recording state not required)');
    
  } else if (type === 'keyframe') {
    // Pause any current playback
    if (AnimationState.data.isPlaying) {
      stopPlayback();
      logger.info('⏸️ Paused playback to add keyframe');
    }
    
    // Get current time from timeline slider
    const timelineSlider = document.getElementById('mediaPlaybackSlider');
    const progress = parseFloat(timelineSlider.value);
    const keyframeTime = progress * (duration / 1000);
    
    const maxTime = duration / 1000;
    
    // Auto-initialize in/out if not set
    if (!AnimationState.data.isRecording && AnimationState.data.keyframes.length < 2) {
      AnimationState.data.isRecording = true;
      AnimationState.data.inPoint = 0;
      AnimationState.data.outPoint = maxTime;
      const currentPositions = captureBubblePositions();
      AnimationState.data.keyframes = [
        { time: 0, positions: currentPositions },
        { time: maxTime, positions: currentPositions }
      ];
      updateTimelineMarkers();
      logger.info('🎬 Auto-initialized in/out for keyframing');
    }
    
    // Clamp keyframe to be within in/out (exclusive)
    const clampedTime = Math.max(AnimationState.data.inPoint + 0.01, Math.min(AnimationState.data.outPoint - 0.01, keyframeTime));
    
    // Capture current bubble positions for keyframe
    const keyframePositions = captureBubblePositions();
    const keyframe = {
      time: clampedTime,
      positions: keyframePositions
    };
    
    // If no animation is active, start one
    if (!AnimationState.data.isRecording) {
      AnimationState.data.isRecording = true;
      AnimationState.data.inPoint = 0;
      AnimationState.data.outPoint = maxTime;
      AnimationState.data.keyframes = [];
      logger.info('🎬 Started new animation recording');
    }
    
    // Insert keyframe in time-sorted order
    AnimationState.data.keyframes.push(keyframe);
    AnimationState.data.keyframes.sort((a, b) => a.time - b.time);
    addTimelineMarker('keyframe', clampedTime);
    
    logger.info('📍 Keyframe added at:', clampedTime.toFixed(1), 's with current positions');
  }
}

function deepCopyIdeas() {
  // Deep copy the ideas array (equivalent to the previous system)
  ensureIdeaUids();
  return ideas.map(idea => ({ ...idea }));
}

function captureBubblePositions() {
  // Use the ideas array instead of DOM elements
  logger.debug('🎬 Capturing bubble positions from ideas array...');
  logger.debug('🔍 Found ideas:', ideas.length);
  
  const positions = deepCopyIdeas();
  
  // Only log detailed info in debug mode and limit frequency
  if (typeof window.frameCounter !== 'undefined' && window.frameCounter % 120 === 0) {
    positions.forEach((idea, index) => {
      logger.debug(`  Idea ${index}: x=${idea.x.toFixed(1)}, y=${idea.y.toFixed(1)}, title="${idea.title}"`);
    });
  }
  
  logger.info('✅ Captured positions for', positions.length, 'ideas');
  return positions;
}

function addTimelineMarker(type, time) {
  const marker = {
    type: type,
    time: time,
    position: Math.max(0, Math.min(100, (time / (AnimationState.data.duration / 1000)) * 100)) // Clamp 0-100%
  };
  
  // Remove existing marker of same type
  AnimationState.timelineMarkers = AnimationState.timelineMarkers.filter(m => m.type !== type);
  
  // Add new marker
  AnimationState.timelineMarkers.push(marker);
  updateTimelineDisplay();
}

function updateTimelineDisplay() {
  const overlay = document.getElementById('timelineMarkersOverlay');
  const slider = document.getElementById('mediaPlaybackSlider');
  if (!overlay || !slider) return;
  
  // Clear existing markers
  overlay.innerHTML = '';
  
  // Add new markers inside overlay, positioned over the slider track
  AnimationState.timelineMarkers.forEach(marker => {
    const markerElement = document.createElement('div');
    markerElement.className = 'timeline-marker';
    markerElement.style.position = 'absolute';
    markerElement.style.top = '50%';
    markerElement.style.transform = 'translate(-50%, -50%)';
    markerElement.style.width = '6px';
    markerElement.style.height = '12px';
    markerElement.style.borderRadius = '2px';
    markerElement.style.left = `${marker.position}%`;
    markerElement.style.backgroundColor = marker.type === 'in' ? '#4CAF50' : 
                                       marker.type === 'out' ? '#f44336' : '#FF9800';
    markerElement.title = `${marker.type} point at ${marker.time.toFixed(1)}s`;
    overlay.appendChild(markerElement);
  });
}

function updateTimelineMarkers() {
  // Clear and rebuild all markers
  AnimationState.timelineMarkers = [];
  
  // Add in marker
  addTimelineMarker('in', AnimationState.data.inPoint || 0);
  
  // Add out marker
  addTimelineMarker('out', AnimationState.data.outPoint || (AnimationState.data.duration / 1000));
  
  // Add keyframe markers
  AnimationState.data.keyframes.forEach(keyframe => {
    if (keyframe.time > 0 && keyframe.time < AnimationState.data.outPoint) {
      addTimelineMarker('keyframe', keyframe.time);
    }
  });
}

function updatePlaybackTimeDisplay(currentTime, totalTime) {
  const timeDisplay = document.getElementById('playbackTimeDisplay');
  if (timeDisplay) {
    const currentFormatted = formatTime(currentTime);
    const totalFormatted = formatTime(totalTime);
    timeDisplay.textContent = `${currentFormatted} / ${totalFormatted}`;
  }
  // Also refresh marker positions to keep visuals in sync if needed
  updateTimelineDisplay();
}

function startPlayback() {
  logger.debug('🎬 Playback check:', {
    inPoint: AnimationState.data.inPoint,
    outPoint: AnimationState.data.outPoint,
    keyframes: AnimationState.data.keyframes.length,
    isRecording: AnimationState.data.isRecording
  });
  
  // Check if we have at least 2 keyframes (in and out points)
  if (AnimationState.data.keyframes.length < 2) {
    logger.error('❌ Not enough keyframes for playback:', AnimationState.data.keyframes.length);
    // Auto-create in/out at current positions if missing
    const durationSeconds = AnimationState.data.duration / 1000;
    AnimationState.data.inPoint = 0;
    AnimationState.data.outPoint = durationSeconds;
    const currentPositions = captureBubblePositions();
    AnimationState.data.keyframes = [
      { time: 0, positions: currentPositions },
      { time: durationSeconds, positions: currentPositions }
    ];
    updateTimelineMarkers();
    logger.info('✅ Auto-created in/out keyframes for playback');
  }
  
  logger.info('✅ Sufficient keyframes for playback:', AnimationState.data.keyframes.length);
  
  if (AnimationState.data.isPlaying) {
    stopPlayback();
    return;
  }
  
  AnimationState.data.isPlaying = true;
  AnimationState.playbackStartTime = Date.now();
  
  // Calculate duration from in and out points
  AnimationState.playbackDuration = (AnimationState.data.outPoint - AnimationState.data.inPoint) * 1000; // Convert to milliseconds
  
  logger.info('▶️ Starting animation playback:', AnimationState.playbackDuration, 'ms');
  
  // Start the animation and sync the slider
  const timelineSlider = document.getElementById('mediaPlaybackSlider');
  if (timelineSlider) timelineSlider.value = 0;
  animateBubbles(AnimationState.playbackDuration);
}

function stopPlayback() {
  AnimationState.data.isPlaying = false;
  logger.info('⏹️ Animation playback stopped');
}

function animateBubbles(duration) {
  if (!AnimationState.data.isPlaying) return;
  
  // Cache DOM elements and calculations for better performance
  const timelineSlider = document.getElementById('mediaPlaybackSlider');
  const inPoint = AnimationState.data.inPoint;
  const outPoint = AnimationState.data.outPoint;
  const durationSeconds = AnimationState.data.duration / 1000;
  
  function animate() {
    if (!AnimationState.data.isPlaying) return;
    
    const currentTime = Date.now();
    const elapsed = currentTime - AnimationState.playbackStartTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Calculate current playback time in seconds (absolute in animation timeline)
    AnimationState.currentPlaybackTime = inPoint + (progress * (outPoint - inPoint));
    
    // Update timeline slider (only if it exists) with clamped progress
    if (timelineSlider) timelineSlider.value = Math.max(0, Math.min(1, progress));
    
    // Update time display
    updatePlaybackTimeDisplay(AnimationState.currentPlaybackTime, durationSeconds);
    
    // Interpolate bubble positions at the absolute current time
    interpolateBubblePositions(AnimationState.currentPlaybackTime);
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // Animation complete
      AnimationState.data.isPlaying = false;
      logger.info('✅ Animation playback complete');
    }
  }
  
  animate();
}

function interpolateBubblePositions(currentTime) {
  if (AnimationState.data.keyframes.length < 2) {
    logger.error('❌ Not enough keyframes for interpolation:', AnimationState.data.keyframes.length);
    return;
  }
  
  // Clamp current time to animation duration
  const maxTime = (AnimationState.data.duration / 1000);
  if (currentTime < 0) currentTime = 0;
  if (currentTime > maxTime) currentTime = maxTime;
  
  // Only log debug info every 30 frames to reduce performance impact
  if (typeof window.frameCounter !== 'undefined' && window.frameCounter % 30 === 0) {
    logger.debug('🎬 Interpolating at time:', currentTime.toFixed(1), 's');
  }
  
  // Ensure keyframes are sorted by time to support 3rd/4th points
  AnimationState.data.keyframes.sort((a, b) => a.time - b.time);
  
  // Find the two keyframes to interpolate between for current time
  let startKeyframe = AnimationState.data.keyframes[0];
  let endKeyframe = AnimationState.data.keyframes[AnimationState.data.keyframes.length - 1];
  
  // Optimize keyframe search with early exit
  const keyframes = AnimationState.data.keyframes;
  const keyframeCount = keyframes.length;
  
  for (let i = 0; i < keyframeCount - 1; i++) {
    const currentKeyframe = keyframes[i];
    const nextKeyframe = keyframes[i + 1];
    
    if (currentTime >= currentKeyframe.time && currentTime <= nextKeyframe.time) {
      startKeyframe = currentKeyframe;
      endKeyframe = nextKeyframe;
      break;
    }
  }
  
  // Calculate interpolation factor (0..1) within segment
  const denom = (endKeyframe.time - startKeyframe.time) || 0.000001;
  const segmentProgress = (currentTime - startKeyframe.time) / denom;
  
  // Only log debug info every 30 frames
  if (typeof window.frameCounter !== 'undefined' && window.frameCounter % 30 === 0) {
    logger.debug('🎬 Interpolating between keyframes:', startKeyframe.time.toFixed(1), 's and', endKeyframe.time.toFixed(1), 's, factor:', segmentProgress.toFixed(2));
  }
  
  // Apply interpolated positions to ideas array (which drives the rendering)
  const startPositions = startKeyframe.positions;
  const endPositions = endKeyframe.positions;
  
  if (startPositions && endPositions) {
    // Cache ideas array length for better performance
    const ideasLength = ideas.length;
    
    // Build uid->position maps for robust matching
    const startMap = Object.create(null);
    const endMap = Object.create(null);
    for (let i = 0; i < startPositions.length; i++) {
      const p = startPositions[i];
      if (p && p._uid != null) startMap[p._uid] = p;
    }
    for (let i = 0; i < endPositions.length; i++) {
      const p = endPositions[i];
      if (p && p._uid != null) endMap[p._uid] = p;
    }

    // Ensure current ideas have uids
    ensureIdeaUids();

    // Update the ideas array with interpolated positions using uid mapping
    for (let index = 0; index < ideasLength; index++) {
      const idea = ideas[index];
      const startPos = idea && idea._uid != null ? startMap[idea._uid] : startPositions[index];
      const endPos = idea && idea._uid != null ? endMap[idea._uid] : endPositions[index];
      
      if (startPos && endPos) {
        // Interpolate position with optimized math
        const deltaX = endPos.x - startPos.x;
        const deltaY = endPos.y - startPos.y;
        
        idea.x = startPos.x + deltaX * segmentProgress;
        idea.y = startPos.y + deltaY * segmentProgress;
        
        // Interpolate velocity (optional)
        if (startPos.vx !== undefined && endPos.vx !== undefined) {
          const deltaVX = endPos.vx - startPos.vx;
          const deltaVY = endPos.vy - startPos.vy;
          
          idea.vx = startPos.vx + deltaVX * segmentProgress;
          idea.vy = startPos.vy + deltaVY * segmentProgress;
        }
        
        // Interpolate other properties if they exist
        if (startPos.radius !== undefined && endPos.radius !== undefined) {
          const deltaRadius = endPos.radius - startPos.radius;
          idea.radius = startPos.radius + deltaRadius * segmentProgress;
        }
      }
    }
    
    // Only log success every 60 frames to reduce performance impact
    if (typeof window.frameCounter !== 'undefined' && window.frameCounter % 60 === 0) {
      logger.info('✅ Applied interpolated positions to ideas array');
    }
  }
}

// ===== SAVE/LOAD ANIMATION FUNCTIONS =====

function saveAnimation() {
  if (AnimationState.data.keyframes.length < 2) {
    alert('Please record an animation first (mark in and out points)');
    return;
  }
  
  const animationToSave = {
    ...AnimationState.data,
    timestamp: Date.now(),
    name: `Animation_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`
  };
  
  const dataStr = JSON.stringify(animationToSave, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `${animationToSave.name}.json`;
  link.click();
  
  logger.info('💾 Animation saved:', animationToSave.name);
}

function loadAnimation() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const loadedAnimation = JSON.parse(e.target.result);
        
        // Validate the loaded animation
        if (!loadedAnimation.keyframes || loadedAnimation.keyframes.length < 2) {
          alert('Invalid animation file: missing keyframes');
          return;
        }
        
        // Load the animation data
        animationData = {
          inPoint: loadedAnimation.inPoint || 0,
          outPoint: loadedAnimation.outPoint || 10,
          keyframes: loadedAnimation.keyframes,
          duration: loadedAnimation.duration || 10000,
          isRecording: false,
          isPlaying: false,
          currentTime: 0,
          startTime: 0
        };
        
        // Update duration dropdown
        const durationSelect = document.getElementById('mediaPlaybackDuration');
        durationSelect.value = animationData.duration;
        
        // Clear and rebuild timeline markers
        timelineMarkers = [];
        animationData.keyframes.forEach(keyframe => {
          addTimelineMarker('keyframe', keyframe.time);
        });
        
        // Add in/out markers
        addTimelineMarker('in', 0);
        addTimelineMarker('out', animationData.outPoint);
        
        logger.info('📂 Animation loaded:', loadedAnimation.name || 'Unnamed Animation', 'SYSTEM');
        
      } catch (error) {
        logger.error('Error loading animation file', { error: error.message, fileName: file.name }, 'SYSTEM');
        alert('Error loading animation file');
      }
    };
    
    reader.readAsText(file);
  };
  
  input.click();
}

// ===== VIDEO CONTROL IMAGE HANDLING =====

function loadVideoControlImages() {
  const imageNames = ['prev', 'play', 'next', 'playlist', 'fullscreen', 'close'];
  const imageFileMap = {
    'prev': 'previous.png',
    'play': 'play.png',
    'next': 'next.png',
    'playlist': 'playlist.png',
    'fullscreen': 'fullscreen.png',
    'close': 'stop.png'
  };
  
      logger.info('🎨 Loading video control PNG images...', null, 'VIDEO');
  
  // First, let's check if the buttons exist
  const buttons = document.querySelectorAll('.video-control-btn');
  logger.info(`Found ${buttons.length} video control buttons`, null, 'VIDEO');
  
  imageNames.forEach(iconName => {
    const fileName = imageFileMap[iconName];
    const img = new Image();
    
    img.onload = function() {
      // Image loaded successfully, update button style
      const buttons = document.querySelectorAll(`[data-icon="${iconName}"]`);
      logger.info(`Found ${buttons.length} buttons for ${iconName}`, null, 'VIDEO');
      
      buttons.forEach(button => {
        // Set the background image directly
        button.style.backgroundImage = `url('images/${fileName}')`;
        button.style.color = 'transparent';
        button.style.fontSize = '0';
        button.style.backgroundSize = 'cover';
        button.style.backgroundRepeat = 'no-repeat';
        button.style.backgroundPosition = 'center';
        
        logger.success(`✅ Applied ${fileName} to ${iconName} button`, null, 'VIDEO');
      });
    };
    
    img.onerror = function() {
      // Image failed to load, keep emoji fallback
      logger.warn(`⚠️ Video control image not found: ${fileName} for ${iconName} button (using emoji fallback)`, null, 'VIDEO');
    };
    
    // Set the source to trigger loading
    img.src = `images/${fileName}`;
    logger.info(`🔄 Attempting to load: images/${fileName}`, null, 'VIDEO');
  });
}

// ===== MEDIA EVENT LISTENER SETUP =====

function setupMediaEventListeners() {
  // Media toolbar functionality
  const bgLoader = document.getElementById('bgLoader');
  if (bgLoader && typeof handleBackgroundUpload === 'function') {
    bgLoader.addEventListener('change', handleBackgroundUpload);
    logger.success('✅ Background upload listener set up', null, 'UPLOAD');
  }
  
  const videoLoader = document.getElementById('videoLoader');
  if (videoLoader && typeof handleVideoUpload === 'function') {
    videoLoader.addEventListener('change', handleVideoUpload);
    logger.success('✅ Video upload listener set up', null, 'UPLOAD');
  }
  
  // Set up timeline slider events
  const timelineSlider = document.getElementById('mediaPlaybackSlider');
  if (timelineSlider) {
    timelineSlider.addEventListener('input', (e) => {
      if (!AnimationState.data.isPlaying) {
        const progress = parseFloat(e.target.value);
        if (AnimationState.data.keyframes.length >= 2) {
          const currentTime = progress * (AnimationState.data.duration / 1000);
          AnimationState.currentPlaybackTime = currentTime;
          interpolateBubblePositions(currentTime);
          updatePlaybackTimeDisplay(currentTime, AnimationState.data.duration / 1000);
        } else {
          logger.warn('❌ No keyframes available for timeline scrubbing', null, 'SYSTEM');
        }
      }
    });
    
    // Add change event to record positions when scrubbing to end
    timelineSlider.addEventListener('change', (e) => {
      if (!AnimationState.data.isPlaying && AnimationState.data.isRecording) {
        const progress = parseFloat(e.target.value);
        const currentTime = progress * (AnimationState.data.duration / 1000);
        
        // If scrubbed to the end (or very close), update the out point
        if (progress >= 0.95) { // Within 5% of the end
          logger.info('🎬 Timeline scrubbed to end - updating out point', null, 'SYSTEM');
          
          // Capture current positions
          const endPositions = captureBubblePositions();
          
          // Update the out keyframe
          const outKeyframeIndex = AnimationState.data.keyframes.findIndex(kf => kf.time === AnimationState.data.outPoint);
          if (outKeyframeIndex !== -1) {
            AnimationState.data.keyframes[outKeyframeIndex].positions = endPositions;
            logger.success('✅ Out point updated with current positions', null, 'SYSTEM');
          }
          
          // Update timeline markers
          updateTimelineMarkers();
        }
      }
    });
  }
  
  // Set up duration change handler
  const durationSelect = document.getElementById('mediaPlaybackDuration');
  if (durationSelect) {
    durationSelect.addEventListener('change', (e) => {
      AnimationState.data.duration = parseInt(e.target.value);
      logger.info('⏱️ Animation duration changed to:', AnimationState.data.duration, 'ms', 'SYSTEM');
    });
  }
  
  // Load toolbar button images immediately
  loadToolbarButtonImages();
  
  // Test PNG loading
  setTimeout(() => {
    logger.debug('🧪 Testing PNG loading...', null, 'VIDEO');
    const testButtons = document.querySelectorAll('[data-icon]');
    testButtons.forEach((button, index) => {
      const dataIcon = button.getAttribute('data-icon');
      const bgImage = getComputedStyle(button).backgroundImage;
      logger.debug(`Button ${index + 1}: data-icon="${dataIcon}", background="${bgImage}"`, null, 'VIDEO');
    });
    
    // Test if PNG files exist
    logger.debug('🧪 Testing PNG file existence...', null, 'VIDEO');
    const testFiles = ['recordin.png', 'keyframe.png', 'recordout.png', 'play.png', 'save.png', 'load.png', 'snapshot.png'];
    testFiles.forEach(file => {
      const img = new Image();
      img.onload = () => logger.success(`✅ PNG file exists: ${file}`, null, 'VIDEO');
      img.onerror = () => logger.warn(`❌ PNG file missing: ${file}`, null, 'VIDEO');
      img.src = `images/${file}`;
    });
  }, 500);
}

// ===== PLAYLIST PANEL FUNCTIONS =====

function closePlaylist() {
  const playlist = document.getElementById('videoPlaylist');
  if (playlist) {
    playlist.style.display = 'none';
    playlist.style.pointerEvents = 'none';
    playlist.style.zIndex = '-1';
    playlist.style.visibility = 'hidden';
    videoPlaylistVisible = false;
    logger.info('📋 Playlist panel closed', null, 'PLAYLIST');
  }
}

function minimizePlaylist() {
  const playlist = document.getElementById('videoPlaylist');
  if (playlist) {
    if (playlist.classList.contains('minimized')) {
      // Restore playlist
      playlist.classList.remove('minimized');
      playlist.style.width = '300px';
      playlist.style.height = '400px';
      playlist.style.overflow = 'auto';
      playlist.style.maxHeight = '400px';
      logger.info('📋 Playlist panel restored', null, 'PLAYLIST');
    } else {
      // Minimize playlist
      playlist.classList.add('minimized');
      playlist.style.width = '30px';
      playlist.style.height = '200px';
      playlist.style.overflow = 'hidden';
      playlist.style.maxHeight = '200px';
      logger.info('📋 Playlist panel minimized', null, 'PLAYLIST');
    }
  }
}

function restorePlaylist() {
  const playlist = document.getElementById('videoPlaylist');
  if (playlist && playlist.classList.contains('minimized')) {
    playlist.classList.remove('minimized');
    playlist.style.width = '300px';
    playlist.style.height = '400px';
    playlist.style.overflow = 'auto';
    playlist.style.maxHeight = '400px';
    logger.info('📋 Playlist panel restored', null, 'PLAYLIST');
  }
}

// ===== DEBUG FUNCTIONS =====

function debugVideoControls() {
  logger.debug('🔍 Debugging video controls...', null, 'VIDEO');
  const buttons = document.querySelectorAll('.video-control-btn');
  logger.debug(`Found ${buttons.length} video control buttons`, null, 'VIDEO');
  
  buttons.forEach((button, index) => {
    const icon = button.getAttribute('data-icon');
    const backgroundImage = getComputedStyle(button).backgroundImage;
    const color = getComputedStyle(button).color;
    const fontSize = getComputedStyle(button).fontSize;
    logger.debug(`Button ${index + 1}: icon="${icon}", background="${backgroundImage}", color="${color}", fontSize="${fontSize}"`, null, 'VIDEO');
  });
}

function testPngAccess() {
  logger.debug('🧪 Testing PNG file access...', null, 'VIDEO');
  const testFiles = ['previous.png', 'play.png', 'next.png', 'playlist.png', 'fullscreen.png'];
  
  testFiles.forEach(fileName => {
    const img = new Image();
    img.onload = function() {
      logger.success(`✅ PNG file accessible: ${fileName}`, null, 'VIDEO');
    };
    img.onerror = function() {
              logger.warn(`❌ PNG file not accessible: ${fileName}`, null, 'VIDEO');
    };
    img.src = `images/${fileName}`;
  });
}

// ===== MODULAR PNG LOADING SYSTEM =====

// PNG Configuration
const PNG_CONFIG = {
  mediaToolbar: [
    { dataIcon: 'record-in', file: 'recordin.png' },
    { dataIcon: 'keyframe', file: 'keyframe.png' },
    { dataIcon: 'record-out', file: 'recordout.png' },
    { dataIcon: 'play', file: 'play.png' },
    { dataIcon: 'save', file: 'saveanimation.png' },
    { dataIcon: 'load', file: 'loadanimation.png' },
    { dataIcon: 'snapshot-media', file: 'snapshot.png' },
    { dataIcon: 'youtube', file: 'youtube.png' },
    { dataIcon: 'hide', file: 'hide.png' }
  ],
  // Main toolbar buttons (with specific selectors)
  mainToolbar: [
    { dataIcon: 'media', file: 'media.png' },
    { dataIcon: 'youtube', file: 'youtube.png' },
    { dataIcon: 'dice', file: 'dice.png' },
    { dataIcon: 'rotate', file: 'rotate.png' },
    { dataIcon: 'music', file: 'music.png' },
    { dataIcon: 'clear', file: 'clear.png' },
    { dataIcon: 'reset', file: 'reset.png' },
    { dataIcon: 'cycle', file: 'cycle.png' },
    { dataIcon: 'rand', file: 'rand.png' },
    { dataIcon: 'pause', file: 'pause.png' },
    { dataIcon: 'video', file: 'video2.png' },
    { dataIcon: 'snapshot', file: 'snapshot.png' },
    { dataIcon: 'save', file: 'save.png' },
    { dataIcon: 'load', file: 'load.png' },
    { dataIcon: 'draw', file: 'draw.png' },
    { dataIcon: 'analysis', file: 'analysis.png' }
  ],
  // Music panel control buttons
  musicPanel: [
    { dataIcon: 'mprevious', file: 'mprevious.png' },
    { dataIcon: 'mplay', file: 'mplay.png' },
    { dataIcon: 'mnext', file: 'mnext.png' },
    { dataIcon: 'mradio', file: 'mradio.png' },
    { dataIcon: 'mplaylist', file: 'mplaylist.png' }
  ],
  // Video control buttons
  videoControls: [
    { dataIcon: 'playlist', file: 'playlist.png' },
    { dataIcon: 'prev', file: 'previous.png' },
    { dataIcon: 'play', file: 'play.png' },
    { dataIcon: 'next', file: 'next.png' },
    { dataIcon: 'close', file: 'stop.png' }
  ]
};

// PNG Loading Utilities
const PNGLoader = {
  // Apply PNG to a single button
  applyPNG(button, pngFile) {
    if (!button || !pngFile) return false;
    
    // Check if this PNG is already applied to avoid unnecessary reloads
    const currentPng = button.style.getPropertyValue('--png-url');
    const newPng = `url(images/${pngFile})`;
    
    if (currentPng === newPng) {
      // PNG already applied, no need to reload
      return true;
    }
    
    try {
      // Set CSS custom property for PNG URL
      button.style.setProperty('--png-url', newPng, 'important');
      button.classList.add('has-png');
      
      logger.success(`✅ PNG applied: ${pngFile} to ${button.getAttribute('data-icon')}`, null, 'VIDEO');
      return true;
    } catch (error) {
      logger.error(`❌ Failed to apply PNG: ${pngFile}`, error, 'VIDEO');
      return false;
    }
  },
  
  // Find button by data-icon
  findButton(dataIcon) {
    return document.querySelector(`[data-icon="${dataIcon}"]`);
  },
  
  // Find button by data-icon within specific container
  findButtonInContainer(dataIcon, containerSelector) {
    const container = document.querySelector(containerSelector);
    if (container) {
      return container.querySelector(`[data-icon="${dataIcon}"]`);
    }
    return null;
  },
  
  // Load PNGs for a specific toolbar
  loadToolbarPNGs(toolbarConfig) {
    logger.info(`🎛️ Loading PNGs for toolbar...`, null, 'VIDEO');
    
    let successCount = 0;
    const totalButtons = toolbarConfig.length;
    
    // Use for loop instead of forEach for better performance
    for (let i = 0; i < totalButtons; i++) {
      const { dataIcon, file } = toolbarConfig[i];
      const button = this.findButton(dataIcon);
      if (button) {
        if (this.applyPNG(button, file)) {
          successCount++;
        }
      } else {
        logger.warn(`⚠️ Button not found: ${dataIcon}`, null, 'VIDEO');
      }
    }
    
    logger.info(`🎛️ PNG loading complete: ${successCount}/${totalButtons} successful`, null, 'VIDEO');
    return successCount;
  },
  
  // Debug: Show all buttons with data-icon
  debugButtons() {
    const buttons = document.querySelectorAll('[data-icon]');
    logger.debug('🔍 Found buttons:', null, 'VIDEO');
    buttons.forEach((button, index) => {
      const dataIcon = button.getAttribute('data-icon');
      const text = button.textContent.trim();
      logger.debug(`  ${index + 1}: data-icon="${dataIcon}", text="${text}"`, null, 'VIDEO');
    });
  }
};

// Main PNG loading function
function loadToolbarButtonImages() {
  logger.info('🎛️ Starting PNG loading system...', null, 'VIDEO');
  
  // Debug: Show all buttons
  PNGLoader.debugButtons();
  
  // Load media toolbar PNGs (specific to #mediaToolbar)
  let mediaCount = 0;
  const mediaToolbar = PNG_CONFIG.mediaToolbar;
  const mediaToolbarLength = mediaToolbar.length;
  
  for (let i = 0; i < mediaToolbarLength; i++) {
    const { dataIcon, file } = mediaToolbar[i];
    const button = PNGLoader.findButtonInContainer(dataIcon, '#mediaToolbar');
    if (button) {
      if (PNGLoader.applyPNG(button, file)) {
        mediaCount++;
      }
    }
  }
  
  // Load main toolbar PNGs (specific to #toolbar)
  let mainCount = 0;
  const mainToolbar = PNG_CONFIG.mainToolbar;
  const mainToolbarLength = mainToolbar.length;
  
  for (let i = 0; i < mainToolbarLength; i++) {
    const { dataIcon, file } = mainToolbar[i];
    const button = PNGLoader.findButtonInContainer(dataIcon, '#toolbar');
    if (button) {
      if (PNGLoader.applyPNG(button, file)) {
        mainCount++;
      }
    }
  }
  
  // Load video control PNGs
  const videoCount = PNGLoader.loadToolbarPNGs(PNG_CONFIG.videoControls);
  
  // Load music panel PNGs (specific to #musicPanel)
  let musicCount = 0;
  PNG_CONFIG.musicPanel.forEach(({ dataIcon, file }) => {
    const button = PNGLoader.findButtonInContainer(dataIcon, '#musicPanel');
    if (button) {
      if (PNGLoader.applyPNG(button, file)) {
        musicCount++;
      }
    }
  });
  
  const totalCount = mediaCount + mainCount + videoCount + musicCount;
  logger.info(`🎛️ PNG loading system complete: ${totalCount} PNGs loaded (Media: ${mediaCount}, Main: ${mainCount}, Video: ${videoCount}, Music: ${musicCount})`, null, 'VIDEO');
}

function updatePauseButtonIcon() {
  const pauseButton = document.querySelector('.toolbar-btn[data-icon="pause"]');
  if (pauseButton) {
    const filename = speedMultiplier === 0 ? 'play.png' : 'pause.png';
    // Use our PNG system to update the button
    PNGLoader.applyPNG(pauseButton, filename);
    logger.info(`🎛️ Updated pause button to ${filename} (speed: ${speedMultiplier})`, null, 'VIDEO');
  }
}

function updateVideoPlayButtonIcon() {
  const playButton = document.querySelector('.video-control-btn[data-icon="play"]');
  if (playButton) {
    const filename = videoIsPlaying ? 'pause.png' : 'play.png';
    PNGLoader.applyPNG(playButton, filename);
    logger.info(`🎥 Updated video play button to ${filename} (playing: ${videoIsPlaying})`, null, 'VIDEO');
  }
}

function updateVideoButtonIcon() {
  const videoButton = document.querySelector('[data-icon="video"]');
  if (videoButton && typeof PNGLoader !== 'undefined') {
    // Show video.png when the player is open OR when any video is actively playing (even if UI hidden)
    // Show video2.png only when player is closed AND nothing is playing
    const player = document.getElementById('videoPlayer');
    const isPlayerOpen = player && (player.style.display !== 'none' || getComputedStyle(player).display !== 'none');
    const hasActivePlayback = !!videoIsPlaying; // unified playback flag
    const showPlayerIcon = isPlayerOpen || hasActivePlayback;
    const filename = showPlayerIcon ? 'video.png' : 'video2.png';
    PNGLoader.applyPNG(videoButton, filename);
    logger.info(`🎥 Updated video button to ${filename} (open:${showPlayerIcon}, playing:${videoIsPlaying})`, null, 'VIDEO');
  }
}

// ===== PRE-LOAD PLAYLISTS FROM ROOT FOLDER =====
let playlistsPreloaded = false; // Flag to prevent double loading
let preloadingInProgress = false; // Flag to prevent race conditions
let isUploadingPlaylist = false; // Flag to prevent multiple simultaneous uploads

async function preloadPlaylists() {
  if (playlistsPreloaded) {
    logger.info('📋 Playlists already pre-loaded, skipping', null, 'PLAYLIST');
    logger.info('📊 Current uploadedPlaylists:', uploadedPlaylists.map(p => p.name), 'PLAYLIST');
    return;
  }
  
  if (preloadingInProgress) {
    logger.info('📋 Playlist preloading already in progress, skipping', null, 'PLAYLIST');
    return;
  }
  
  preloadingInProgress = true;
  logger.info('📋 Pre-loading playlists from playlist.txt...', null, 'PLAYLIST');
  logger.info('📊 Before loading - uploadedPlaylists count:', uploadedPlaylists.length, 'PLAYLIST');
  
  // Clear existing playlists to prevent duplication
  if (uploadedPlaylists.length === 0) {
    // Only clear if we don't already have playlists loaded
    videoPlaylist = [];
    videoTitles = [];
    videoCurrentIndex = 0;
  } else {
    logger.info('📋 Playlists already loaded, skipping preload', null, 'PLAYLIST');
    preloadingInProgress = false;
    return;
  }
  
  try {
    // First, read playlist.txt to get the list of playlist files
    const playlistResponse = await fetch('playlist.txt');
    if (!playlistResponse.ok) {
      logger.warn('⚠️ Could not load playlist.txt:', playlistResponse.status, 'PLAYLIST');
      return;
    }
    
    const playlistContent = await playlistResponse.text();
    const playlistFiles = playlistContent.split('\n')
      .map(line => line.trim())
      .filter(line => line !== '' && line.endsWith('.txt'));
    
    logger.info(`📋 Found ${playlistFiles.length} playlist files in playlist.txt:`, playlistFiles, 'PLAYLIST');
  
  for (const filename of playlistFiles) {
    try {
      const response = await fetch(filename);
      if (response.ok) {
        const content = await response.text();
        const lines = content.split('\n').filter(line => line.trim() !== '');
        
        // Extract all valid URLs from lines and remove duplicates
        const validUrls = lines.filter(line => {
          const trimmedLine = line.trim();
          // Check if it's a valid URL (starts with http:// or https://)
          return trimmedLine.startsWith('http://') || trimmedLine.startsWith('https://');
        });
        
        if (validUrls.length > 0) {
          // Remove duplicate URLs to prevent playlist duplication
          const uniqueUrls = [...new Set(validUrls)];
          if (uniqueUrls.length !== validUrls.length) {
            logger.warn(`📋 Removed ${validUrls.length - uniqueUrls.length} duplicate URLs from preloaded playlist "${filename}"`, null, 'PLAYLIST');
          }
          
          const playlistName = filename.replace('.txt', '');
          
          // Check if playlist already exists (additional safety check)
          const existingPlaylist = uploadedPlaylists.find(p => p.name === playlistName);
          if (!existingPlaylist) {
            uploadedPlaylists.push({
              name: playlistName,
              urls: uniqueUrls
            });
            logger.success(`📋 Pre-loaded playlist "${playlistName}" with ${uniqueUrls.length} URLs (including ${uniqueUrls.filter(url => url.includes('youtube.com') || url.includes('youtu.be')).length} YouTube videos)`, null, 'PLAYLIST');
          } else {
            logger.warn(`⚠️ Playlist "${playlistName}" already exists, skipping duplicate`, null, 'PLAYLIST');
          }
        } else {
          logger.warn(`⚠️ No valid URLs found in ${filename}`, null, 'PLAYLIST');
        }
      } else {
        logger.warn(`⚠️ Could not load ${filename}: ${response.status}`, null, 'PLAYLIST');
      }
    } catch (error) {
      logger.error(`⚠️ Error loading ${filename}:`, error.message, 'PLAYLIST');
    }
  }
  
  // Set current playlist index if we have playlists
  if (uploadedPlaylists.length > 0) {
    currentPlaylistIndex = 0;
    loadUploadedPlaylist(0);
    logger.success(`📋 Successfully loaded ${uploadedPlaylists.length} playlists from playlist.txt`, null, 'PLAYLIST');
          logger.info('📊 Final playlist names:', uploadedPlaylists.map(p => p.name), 'PLAYLIST');
  } else {
    logger.warn('📋 No playlists found in playlist.txt', null, 'PLAYLIST');
  }
  
  } catch (error) {
    logger.error('⚠️ Error reading playlist.txt:', error.message, 'PLAYLIST');
  }
  
  preloadingInProgress = false;
  playlistsPreloaded = true;
  logger.success('📋 Playlist preloading completed', null, 'PLAYLIST');
}

// ===== MEDIA.JS LOADED =====
logger.info('🔧 Media.js loaded successfully', null, 'SYSTEM');

// ===== INITIALIZATION SYSTEM =====
function initializeMediaSystem() {
  logger.info('🎛️ Initializing media system...', null, 'SYSTEM');
  
  // Wait for DOM to be fully ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        loadToolbarButtonImages();
        ensureMobileToolbarVisibility();
        // Set media toolbar to minimized by default
        const mediaToolbar = document.getElementById('mediaToolbar');
        if (mediaToolbar) {
          // Start fully hidden AND minimized by default
          mediaToolbar.style.display = 'none';
          mediaToolbar.classList.add('minimized');
          isMediaToolbarMinimized = true;
          logger.info('📺 Media toolbar set to hidden + minimized by default');
        }
        logger.success('🎛️ Media system initialized after DOM load', null, 'SYSTEM');
      }, 100);
    });
  } else {
    // DOM is already loaded
    setTimeout(() => {
      loadToolbarButtonImages();
      ensureMobileToolbarVisibility();
      // Set media toolbar to minimized by default
      const mediaToolbar = document.getElementById('mediaToolbar');
      if (mediaToolbar) {
        // Start fully hidden AND minimized by default
        mediaToolbar.style.display = 'none';
        mediaToolbar.classList.add('minimized');
        isMediaToolbarMinimized = true;
        logger.info('📺 Media toolbar set to hidden + minimized by default');
      }
      logger.success('🎛️ Media system initialized immediately', null, 'SYSTEM');
    }, 100);
  }
}

// Initialize when script loads
initializeMediaSystem();

// ===== MANUAL DEBUG FUNCTIONS =====
// Call these from browser console to debug PNG loading

function debugPNGLoading() {
      logger.debug('🔍 === PNG LOADING DEBUG ===', null, 'VIDEO');
  
  // Check if PNG files exist
      logger.debug('📁 Checking PNG file existence...', null, 'VIDEO');
  const testFiles = [
    // Media toolbar
    'recordin.png', 'keyframe.png', 'recordout.png', 'play.png', 'saveanimation.png', 'loadanimation.png', 'snapshot.png', 'youtube.png',
    // Main toolbar
    'media.png', 'youtube.png', 'dice.png', 'rotate.png', 'music.png', 'clear.png', 'reset.png', 'cycle.png', 'rand.png', 'pause.png', 'video.png', 'snapshot.png', 'save.png', 'load.png',
    // Video controls
    'playlist.png', 'previous.png', 'next.png', 'stop.png'
  ];
  
  testFiles.forEach(file => {
    const img = new Image();
          img.onload = () => logger.success(`✅ PNG exists: ${file}`, null, 'VIDEO');
      img.onerror = () => logger.warn(`❌ PNG missing: ${file}`, null, 'VIDEO');
    img.src = `images/${file}`;
  });
  
  // Check buttons
      logger.debug('🔘 Checking buttons...', null, 'VIDEO');
  const buttons = document.querySelectorAll('[data-icon]');
      logger.debug(`Found ${buttons.length} buttons with data-icon`, null, 'VIDEO');
  
  buttons.forEach((button, index) => {
    const dataIcon = button.getAttribute('data-icon');
    const text = button.textContent.trim();
    const bgImage = getComputedStyle(button).backgroundImage;
          logger.debug(`Button ${index + 1}: data-icon="${dataIcon}", text="${text}", background="${bgImage}"`, null, 'VIDEO');
  });
  
  // Test PNG loading
      logger.debug('🎛️ Testing PNG loading...', null, 'VIDEO');
  loadToolbarButtonImages();
}

// Make debug function globally available
window.debugPNGLoading = debugPNGLoading;

// Quick test function to check specific missing buttons
function testMissingButtons() {
  logger.debug('🔍 === TESTING MISSING BUTTONS ===', null, 'VIDEO');
  
  const missingButtons = [
    { dataIcon: 'pause', file: 'pause.png' },
    { dataIcon: 'video', file: 'video.png' },
    { dataIcon: 'snapshot', file: 'snapshot.png' }
  ];
  
  missingButtons.forEach(({ dataIcon, file }) => {
    const button = document.querySelector(`[data-icon="${dataIcon}"]`);
    if (button) {
      logger.success(`✅ Found button: data-icon="${dataIcon}"`, null, 'VIDEO');
      
      // Test PNG file
      const img = new Image();
      img.onload = () => {
        logger.success(`✅ PNG exists: ${file}`, null, 'VIDEO');
        // Apply PNG
        PNGLoader.applyPNG(button, file);
      };
              img.onerror = () => logger.warn(`❌ PNG missing: ${file}`, null, 'VIDEO');
      img.src = `images/${file}`;
    } else {
      logger.warn(`❌ Button not found: data-icon="${dataIcon}"`, null, 'VIDEO');
    }
  });
}

window.testMissingButtons = testMissingButtons;

// Test function for pause button
function testPauseButton() {
  logger.debug('⏯️ === TESTING PAUSE BUTTON ===', null, 'VIDEO');
  
  const pauseButton = document.querySelector('.toolbar-btn[data-icon="pause"]');
  if (pauseButton) {
    logger.success('✅ Found pause button', null, 'VIDEO');
          logger.debug('Current speedMultiplier:', speedMultiplier, 'VIDEO');
    
    // Test the toggle
          logger.debug('🔄 Testing pause button toggle...', null, 'VIDEO');
    togglePauseButton();
          logger.debug('Speed after toggle:', speedMultiplier, 'VIDEO');
    
    // Check if PNG updated
    const bgImage = getComputedStyle(pauseButton).backgroundImage;
          logger.debug('Background image after toggle:', bgImage, 'VIDEO');
  } else {
    logger.warn('❌ Pause button not found', null, 'VIDEO');
  }
}

window.testPauseButton = testPauseButton;

// Test function for bubble capture
function testBubbleCapture() {
  logger.debug('🎬 === TESTING BUBBLE CAPTURE ===', null, 'SYSTEM');
  
  // Check ideas array
      logger.debug('🔍 Checking ideas array...', null, 'SYSTEM');
      logger.debug('  Ideas count:', ideas.length, 'SYSTEM');
      logger.debug('  Ideas structure:', ideas.length > 0 ? Object.keys(ideas[0]) : 'No ideas', 'SYSTEM');
  
  if (ideas.length === 0) {
    logger.warn('❌ No ideas found! Add some bubbles first.', null, 'SYSTEM');
    return;
  }
  
  // Show some idea examples
  ideas.slice(0, 3).forEach((idea, index) => {
          logger.debug(`  Idea ${index}: x=${idea.x}, y=${idea.y}, title="${idea.title}"`, null, 'SYSTEM');
  });
  
  // Test capturing positions
      logger.debug('🎬 Testing position capture...', null, 'SYSTEM');
  const positions = captureBubblePositions();
  
      logger.success('✅ Capture test complete. Positions:', positions, 'SYSTEM');
  
  // Test animation state
      logger.debug('🎬 Animation state:', {
    inPoint: AnimationState.data.inPoint,
    outPoint: AnimationState.data.outPoint,
    keyframes: AnimationState.data.keyframes.length,
    isRecording: AnimationState.data.isRecording
  });
  
  // Test if we can create a test animation
  if (positions.length > 0) {
    logger.debug('🎬 Testing animation creation...', null, 'SYSTEM');
    AnimationState.reset();
    AnimationState.data.inPoint = 0;
    AnimationState.data.outPoint = 10;
    AnimationState.data.keyframes = [
      { time: 0, positions: positions },
      { time: 10, positions: positions }
    ];
    logger.success('✅ Test animation created with', positions.length, 'ideas', 'SYSTEM');
  }
}

window.testBubbleCapture = testBubbleCapture;

// Function to create test bubbles for animation testing
function createTestBubbles() {
  logger.debug('🎬 Creating test bubbles for animation...', null, 'SYSTEM');
  
  // Remove existing test bubbles
  const existingTestBubbles = document.querySelectorAll('.test-bubble');
  existingTestBubbles.forEach(bubble => bubble.remove());
  
  // Create test bubbles
  const testPositions = [
    { x: 100, y: 100, text: 'Test 1' },
    { x: 300, y: 150, text: 'Test 2' },
    { x: 200, y: 300, text: 'Test 3' }
  ];
  
  testPositions.forEach((pos, index) => {
    const bubble = document.createElement('div');
    bubble.className = 'test-bubble bubble';
    bubble.style.cssText = `
      position: absolute;
      left: ${pos.x}px;
      top: ${pos.y}px;
      width: 80px;
      height: 80px;
      background: linear-gradient(45deg, #ff6b6b, #ee5a24);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      cursor: move;
      z-index: 1000;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    `;
    bubble.textContent = pos.text;
    document.body.appendChild(bubble);
  });
  
  logger.success('✅ Created', testPositions.length, 'test bubbles', 'SYSTEM');
  return testPositions.length;
}

window.createTestBubbles = createTestBubbles;

// Function to update keyframes when bubbles are moved
function updateKeyframesForCurrentPositions() {
  if (!AnimationState.data.isRecording && AnimationState.data.keyframes.length === 0) {
    logger.warn('❌ No animation active to update', null, 'SYSTEM');
    return;
  }
  
  logger.debug('🔄 Updating keyframes with current bubble positions...', null, 'SYSTEM');
  
  // Capture current positions
  const currentPositions = captureBubblePositions();
  
  // Update all keyframes with current positions
  AnimationState.data.keyframes.forEach((keyframe, index) => {
    keyframe.positions = currentPositions;
    logger.debug(`  Updated keyframe ${index} at ${keyframe.time}s`, null, 'SYSTEM');
  });
  
  logger.success('All keyframes updated with current positions', null, 'SYSTEM');
}

// Function to automatically update keyframes when bubbles are moved during recording
function autoUpdateKeyframes() {
  if (AnimationState.data.keyframes.length > 0) {
    // Get current timeline position
    const timelineSlider = document.getElementById('mediaPlaybackSlider');
    if (timelineSlider) {
      const progress = parseFloat(timelineSlider.value);
      const currentTime = progress * (AnimationState.data.duration / 1000);
      
      // Find the closest keyframe to update
      let closestKeyframe = null;
      let minDistance = Infinity;
      
      AnimationState.data.keyframes.forEach(keyframe => {
        const distance = Math.abs(keyframe.time - currentTime);
        if (distance < minDistance) {
          minDistance = distance;
          closestKeyframe = keyframe;
        }
      });
      
      // If we're close to a keyframe (within 0.5 seconds), update it
      if (closestKeyframe && minDistance < 0.5) {
        const currentPositions = captureBubblePositions();
        closestKeyframe.positions = currentPositions;
        logger.info(`Auto-updated keyframe at ${closestKeyframe.time}s`, null, 'SYSTEM');
      }
    }
  }
}

// Make it globally available for manual updates
window.autoUpdateKeyframes = autoUpdateKeyframes;

// Make it globally available
window.updateKeyframesForCurrentPositions = updateKeyframesForCurrentPositions;

// ===== MUSIC VISUALIZER FUNCTIONS =====

function highlightCurrentTrack() {
  // Clear all previous highlights
    const musicItems = document.querySelectorAll('.music-item');
  musicItems.forEach(item => {
      item.classList.remove('playing');
      item.style.background = 'rgba(0, 0, 0, 0.6)';
  });
  
  // Try metadata-based highlighting first
  if (window.currentAudio && !window.currentAudio.paused) {
    const currentSrc = window.currentAudio.src;
    for (const item of musicItems) {
      // Radio items have dataset.radioUrl
      if (item.dataset && item.dataset.type === 'radio' && item.dataset.radioUrl) {
        if (currentSrc.includes(item.dataset.radioUrl)) {
          item.classList.add('playing');
          item.style.background = '#35CF3A';
          return;
        }
      }
      // File items have dataset.url
      if (item.dataset && item.dataset.type === 'file' && item.dataset.url) {
        // Some browsers expand relative paths; use endsWith for robustness
        const srcLower = currentSrc.toLowerCase();
        const urlLower = item.dataset.url.toLowerCase();
        if (srcLower.endsWith(urlLower)) {
          item.classList.add('playing');
          item.style.background = '#35CF3A';
          return;
        }
      }
    }
  }
  
  // Fallback to index-based highlighting if metadata match not found
  if (musicPlaylist.length > 0 && currentMusicIndex >= 0 && currentMusicIndex < musicItems.length) {
    const currentItem = musicItems[currentMusicIndex];
    if (currentItem) {
      currentItem.classList.add('playing');
      currentItem.style.background = '#35CF3A';
    }
  }
}

// Get a unique identifier for the currently playing track/radio
function getCurrentTrackId() {
  try {
    // For radio from input panel
    if (window.currentRadioUrl) {
      return `radio_${window.currentRadioUrl}`;
    }
    
    // For playlist tracks (guard against race conditions)
    if (Array.isArray(musicPlaylist)) {
      const index = (typeof currentMusicIndex === 'number') ? currentMusicIndex : -1;
      if (index >= 0 && index < musicPlaylist.length) {
        const currentTrack = musicPlaylist[index];
        if (currentTrack && currentTrack.url) {
          const title = (typeof currentTrack.title === 'string') ? currentTrack.title : '';
          return `track_${currentTrack.url}_${title}`;
        }
      }
    }
    
    // For audio source
    if (window.currentAudio && window.currentAudio.src) {
      return `audio_${window.currentAudio.src}`;
    }
  } catch (e) {
    // Non-fatal: fall through to default
  }
  
  return 'default';
}

// Generate new color palettes for visualizers
function generateNewVisualizerColors() {
  // Create larger, more diverse color pools
  const colorPools = [
    // Pool 1: Warm colors
    ['#FF6B6B', '#FF4757', '#FF3838', '#E74C3C', '#C0392B', '#FF5722', '#FF7043', '#FF8A65', '#FFAB40', '#FFC107', '#FFD54F', '#FFEB3B', '#FFF176', '#FFD700', '#FFA500', '#FF8C00', '#FF6347', '#FF4500'],
    
    // Pool 2: Cool colors  
    ['#3498DB', '#2980B9', '#2196F3', '#42A5F5', '#64B5F6', '#03A9F4', '#00BCD4', '#26C6DA', '#4DD0E1', '#00ACC1', '#009688', '#26A69A', '#4DB6AC', '#80CBC4', '#4CAF50', '#66BB6A', '#8BC34A', '#9CCC65'],
    
    // Pool 3: Purple/Pink colors
    ['#9C27B0', '#BA68C8', '#CE93D8', '#E1BEE7', '#673AB7', '#7E57C2', '#9575CD', '#B39DDB', '#E91E63', '#F06292', '#F8BBD9', '#FF4081', '#F50057', '#C2185B', '#AD1457', '#880E4F'],
    
    // Pool 4: Green/Teal colors
    ['#4CAF50', '#66BB6A', '#81C784', '#A5D6A7', '#8BC34A', '#9CCC65', '#AED581', '#C5E1A5', '#CDDC39', '#DCE775', '#E6EE9C', '#009688', '#4DB6AC', '#80CBC4', '#B2DFDB', '#00BCD4', '#4DD0E1', '#80DEEA'],
    
    // Pool 5: Orange/Yellow colors
    ['#FF9800', '#FFB74D', '#FFCC02', '#FFEB3B', '#FFF176', '#FFF59D', '#FFEE58', '#FFD54F', '#FFC107', '#FFAB40', '#FF8F00', '#FF6F00', '#FFD600', '#FFEA00', '#FFF8E1', '#FFF3C4']
  ];
  
  const glowPools = [
    ['#FFD700', '#FF69B4', '#FF1493', '#FF6347', '#FF8C00'],
    ['#00FFFF', '#32CD32', '#00CED1', '#4CAF50', '#26A69A'],
    ['#9370DB', '#BA55D3', '#DA70D6', '#FF00FF', '#C71585'],
    ['#90EE90', '#98FB98', '#00FF7F', '#3CB371', '#2E8B57'],
    ['#FFD700', '#FFA500', '#FF8C00', '#FFFF00', '#F0E68C']
  ];
  
  // Select a random color pool for this track
  const poolIndex = Math.floor(Math.random() * colorPools.length);
  const barColorPool = colorPools[poolIndex];
  const glowColorPool = glowPools[poolIndex];
  
  // Select a different pool for the second visualizer
  let pool2Index = Math.floor(Math.random() * colorPools.length);
  while (pool2Index === poolIndex && colorPools.length > 1) {
    pool2Index = Math.floor(Math.random() * colorPools.length);
  }
  const barColorPool2 = colorPools[pool2Index];
  const glowColorPool2 = glowPools[pool2Index];
  
  // Store the generated colors globally for use in the visualizer
  window.currentVisualizerColors = {
    visualizer1: [],
    visualizer2: []
  };
  
  // Generate colors for first visualizer
  for (let i = 0; i < 8; i++) {
    const barColor = barColorPool[Math.floor(Math.random() * barColorPool.length)];
    const glowColor = glowColorPool[Math.floor(Math.random() * glowColorPool.length)];
    window.currentVisualizerColors.visualizer1.push({ bar: barColor, glow: glowColor });
  }
  
  // Generate colors for second visualizer  
  for (let i = 0; i < 8; i++) {
    const barColor = barColorPool2[Math.floor(Math.random() * barColorPool2.length)];
    const glowColor = glowColorPool2[Math.floor(Math.random() * glowColorPool2.length)];
    window.currentVisualizerColors.visualizer2.push({ bar: barColor, glow: glowColor });
  }
}

function startMusicVisualizer() {
  if (visualizerInterval) {
    clearInterval(visualizerInterval);
  }
  
  const visualizer1 = document.getElementById('musicVisualizer');
  const visualizer2 = document.getElementById('musicVisualizer2');
  
  if (visualizer1) visualizer1.style.display = 'block';
  if (visualizer2) visualizer2.style.display = 'block';
  
  // Enhanced visualizer with performance monitoring
  let frameCount = 0;
  let lastFrameTime = performance.now();
  const targetFPS = 30; // Limit to 30 FPS for better performance
  const frameInterval = 1000 / targetFPS;
  
  // Performance monitoring
  const monitorVisualizerPerformance = () => {
    const now = performance.now();
    frameCount++;
    
    if (now - lastFrameTime >= 1000) {
      const actualFPS = Math.round((frameCount * 1000) / (now - lastFrameTime));
      logger.performance('Visualizer Performance', { 
        fps: actualFPS, 
        targetFPS: targetFPS,
        type: 'music_visualizer'
      });
      
      // Adjust performance if needed
      if (actualFPS < targetFPS * 0.8) {
        logger.warn('Visualizer performance below target', { actualFPS, targetFPS }, 'SYSTEM');
      }
      
      frameCount = 0;
      lastFrameTime = now;
    }
  };
  
  // Generate unique colors for each track/radio URL
  const currentTrackId = getCurrentTrackId();
  if (!currentTrackId) {
    // Defensive: if something went wrong, bail gracefully
    return;
  }
  
  // Check if we need new colors (new track or first time)
  if (!window.lastTrackId || window.lastTrackId !== currentTrackId) {
    window.lastTrackId = currentTrackId;
    generateNewVisualizerColors();
    logger.info(`Generated new visualizer colors for track: ${currentTrackId}`, null, 'AUDIO');
  }
  
  // Generate random colors for this session (backup)
  currentVisualizerColors = [];
  
  // Pre-define color arrays for better performance
  const barColors = [
    // Reds & Pinks
    '#FF6B6B', '#FF4757', '#FF3838', '#FF1744', '#F50057',
    '#E91E63', '#C2185B', '#AD1457', '#FF4081', '#F50057',
    
    // Oranges & Yellows
    '#FF9800', '#FF5722', '#FF7043', '#FF8A65', '#FFAB40',
    '#FFC107', '#FFD54F', '#FFEB3B', '#FFF176', '#FFF59D',
    
    // Greens
    '#4CAF50', '#8BC34A', '#CDDC39', '#9CCC65', '#66BB6A',
    '#4DB6AC', '#26A69A', '#00BCD4', '#00ACC1', '#009688',
    
    // Blues
    '#2196F3', '#42A5F5', '#64B5F6', '#90CAF9', '#BBDEFB',
    '#3F51B5', '#5C6BC0', '#7986CB', '#9FA8DA', '#C5CAE9',
    
    // Purples
    '#9C27B0', '#BA68C8', '#CE93D8', '#E1BEE7', '#F3E5F5',
    '#673AB7', '#7E57C2', '#9575CD', '#B39DDB', '#D1C4E9',
    
    // Cyans & Teals
    '#00BCD4', '#26C6DA', '#4DD0E1', '#80DEEA', '#B2EBF2',
    '#009688', '#26A69A', '#4DB6AC', '#80CBC4', '#B2DFDB',
    
    // Magentas
    '#E91E63', '#F06292', '#F8BBD9', '#FCE4EC', '#F3E5F5',
    '#9C27B0', '#BA68C8', '#CE93D8', '#E1BEE7', '#F3E5F5',
    
    // Special Colors
    '#FFD700', '#FFA500', '#FF6347', '#FF4500', '#FF1493',
    '#00FF00', '#00FFFF', '#FF00FF', '#FFFF00', '#FF69B4',
    '#00CED1', '#FF8C00', '#32CD32', '#FF69B4', '#9370DB'
  ];
  
  const glowColors = [
    '#FFD700', '#FF69B4', '#00FFFF', '#FF1493', '#32CD32',
    '#FF6347', '#9370DB', '#00CED1', '#FF8C00', '#FF4500',
    '#FF00FF', '#FFFF00', '#00FF00', '#FF69B4', '#FFD700',
    '#FF1493', '#00FFFF', '#32CD32', '#FF6347', '#9370DB'
  ];
  
  // Create separate color sets for each visualizer
  // First visualizer: Warm colors (reds, oranges, yellows)
  const warmColors = [
    '#FF6B6B', '#FF4757', '#FF3838', '#FF1744', '#F50057',
    '#E91E63', '#C2185B', '#AD1457', '#FF4081', '#FF9800', 
    '#FF5722', '#FF7043', '#FF8A65', '#FFAB40', '#FFC107', 
    '#FFD54F', '#FFEB3B', '#FFF176', '#FFD700', '#FFA500'
  ];
  
  // Second visualizer: Cool colors (blues, greens, purples)  
  const coolColors = [
    '#4CAF50', '#8BC34A', '#66BB6A', '#4DB6AC', '#26A69A',
    '#00BCD4', '#00ACC1', '#009688', '#2196F3', '#42A5F5',
    '#64B5F6', '#3F51B5', '#5C6BC0', '#7986CB', '#9C27B0',
    '#BA68C8', '#673AB7', '#7E57C2', '#9575CD', '#00FFFF'
  ];
  
  const warmGlows = ['#FFD700', '#FF69B4', '#FF1493', '#FF6347', '#FF8C00'];
  const coolGlows = ['#00FFFF', '#32CD32', '#9370DB', '#00CED1', '#4CAF50'];
  
  // Use the new color system if available, otherwise fallback to old system
  let visualizer1Colors, visualizer2Colors;
  
  if (window.currentVisualizerColors) {
    visualizer1Colors = window.currentVisualizerColors.visualizer1;
    visualizer2Colors = window.currentVisualizerColors.visualizer2;
  } else {
    // Fallback: generate colors for first visualizer (warm)
    visualizer1Colors = [];
  for (let i = 0; i < 8; i++) {
      const barColor = warmColors[Math.floor(Math.random() * warmColors.length)];
      const glowColor = warmGlows[Math.floor(Math.random() * warmGlows.length)];
      visualizer1Colors.push({ bar: barColor, glow: glowColor });
    }
    
    // Fallback: generate colors for second visualizer (cool)
    visualizer2Colors = [];
    for (let i = 0; i < 8; i++) {
      const barColor = coolColors[Math.floor(Math.random() * coolColors.length)];
      const glowColor = coolGlows[Math.floor(Math.random() * coolGlows.length)];
      visualizer2Colors.push({ bar: barColor, glow: glowColor });
    }
  }
  
  // Apply colors to first visualizer
  const bars1 = document.querySelectorAll('#visualizerBars .viz-bar');
  bars1.forEach((bar, index) => {
    if (visualizer1Colors[index]) {
      bar.style.background = visualizer1Colors[index].bar;
      bar.style.boxShadow = `0 0 4px ${visualizer1Colors[index].glow}`;
      bar.style.filter = `drop-shadow(0 0 2px ${visualizer1Colors[index].glow})`;
    }
  });
  
  // Apply colors to second visualizer
  const bars2 = document.querySelectorAll('#visualizerBars2 .viz-bar');
  bars2.forEach((bar, index) => {
    if (visualizer2Colors[index]) {
      bar.style.background = visualizer2Colors[index].bar;
      bar.style.boxShadow = `0 0 4px ${visualizer2Colors[index].glow}`;
      bar.style.filter = `drop-shadow(0 0 2px ${visualizer2Colors[index].glow})`;
    }
  });
  
  visualizerInterval = setInterval(() => {
    if (!isMusicPlaying) {
      stopMusicVisualizer();
      return;
    }
    
    // Animate visualizer bars
    const bars1 = document.querySelectorAll('#visualizerBars .viz-bar');
    const bars2 = document.querySelectorAll('#visualizerBars2 .viz-bar');
    
    bars1.forEach((bar, index) => {
      const height = Math.random() * 100;
      bar.style.height = `${height}%`;
    });
    
    bars2.forEach((bar, index) => {
      const height = Math.random() * 100;
      bar.style.height = `${height}%`;
    });
  }, 100);
}

function stopMusicVisualizer() {
  if (visualizerInterval) {
    clearInterval(visualizerInterval);
    visualizerInterval = null;
  }
  
  const visualizer1 = document.getElementById('musicVisualizer');
  const visualizer2 = document.getElementById('musicVisualizer2');
  
  if (visualizer1) visualizer1.style.display = 'none';
  if (visualizer2) visualizer2.style.display = 'none';
  
  // Reset bar heights
  const bars1 = document.querySelectorAll('#visualizerBars .viz-bar');
  const bars2 = document.querySelectorAll('#visualizerBars2 .viz-bar');
  
  bars1.forEach(bar => bar.style.height = '0%');
  bars2.forEach(bar => bar.style.height = '0%');
}

// ===== PROJECTM VISUALIZATION FUNCTIONS =====

function toggleProjectMPanel() {
    try {
        const panel = document.getElementById('projectmPanel');
        if (!panel) return;
        
        if (panel.style.display === 'block') {
            closeProjectMPanel();
        } else {
            // Show the panel
            panel.style.display = 'block';
            
            // Auto-load local presets when panel is opened
            autoLoadLocalPresets();
            
            logger.info('🎨 Music visualization panel opened');
        }
        
    } catch (error) {
        console.error('Failed to toggle ProjectM panel:', error);
    }
}

// Auto-load local presets when panel is opened
function autoLoadLocalPresets() {
    // Check if presets are already loaded
    if (butterchurnPresets.length === 0) {
        console.log('🔄 Auto-loading local presets...');
        loadLocalPresets();
    }
}

function closeProjectMPanel() {
    try {
        // Stop local visualizer if running
        if (typeof window.LocalVisualizer !== 'undefined' && window.LocalVisualizer.isRunning) {
            window.LocalVisualizer.stop();
            isVisualizerRunning = false;
        }
        
        // Hide the panel
        const panel = document.getElementById('projectmPanel');
        if (panel) {
            panel.style.display = 'none';
        }
        
        // Hide control buttons - check if functions exist before calling
        if (typeof hideRetryButton === 'function') {
            hideRetryButton();
        }
        if (typeof hideLocalEffectButton === 'function') {
            hideLocalEffectButton();
        }
        
        logger.info('🎨 Visualization panel closed');
        
    } catch (error) {
        console.error('Failed to close ProjectM panel:', error);
        // Ensure panel is hidden even if there's an error
        const panel = document.getElementById('projectmPanel');
        if (panel) {
            panel.style.display = 'none';
        }
    }
}

function toggleProjectM() {
  const toggleBtn = document.getElementById('projectmToggleBtn');
  const iframe = document.getElementById('projectmFrame');
  
  if (toggleBtn.textContent.includes('Start')) {
    // Start visualization
    toggleBtn.textContent = '⏸️ Stop Visualization';
    
    // Load enhanced ProjectM visualizer with .milk support
    iframe.src = 'projectm-real.html';
    
    logger.info('🎨 ProjectM visualization started');
  } else {
    // Stop visualization
    toggleBtn.textContent = '▶️ Start Visualization';
    iframe.src = 'about:blank';
    logger.info('🎨 ProjectM visualization stopped');
  }
}

function changeProjectMPreset() {
  // Send message to iframe to change preset
  const iframe = document.getElementById('projectmFrame');
  if (iframe.src && iframe.src.includes('projectm-visualizer.html')) {
    try {
      iframe.contentWindow.postMessage({ command: 'changePreset' }, '*');
      logger.info('🎨 ProjectM preset changed');
    } catch (error) {
      logger.error('Failed to change preset:', error);
      // Fallback: reload iframe
      const currentSrc = iframe.src;
      iframe.src = 'about:blank';
      setTimeout(() => {
        iframe.src = currentSrc;
      }, 100);
    }
  }
}

function toggleProjectMFullscreen() {
  const projectmPanel = document.getElementById('projectmPanel');
  if (projectmPanel) {
    projectmPanel.classList.toggle('fullscreen');
    
    if (projectmPanel.classList.contains('fullscreen')) {
      logger.info('🎨 ProjectM visualization fullscreen enabled');
    } else {
      logger.info('🎨 ProjectM visualization fullscreen disabled');
    }
  }
}

function resetProjectMVisualizer() {
  // Send message to iframe to reset visualizer
  const iframe = document.getElementById('projectmFrame');
  if (iframe.src && iframe.src.includes('projectm-visualizer.html')) {
    try {
      iframe.contentWindow.postMessage({ command: 'reset' }, '*');
      logger.info('🎨 ProjectM visualizer reset');
    } catch (error) {
      logger.error('Failed to reset visualizer:', error);
    }
  }
}

// Butterchurn visualization system
let butterchurnViz = null;
let butterchurnCtx = null;
let butterchurnAnalyser = null;
let butterchurnPresets = [];
let currentPresetIndex = 0;
let autoPresetTimer = null;
let isVisualizerRunning = false;
let globalVisualizerState = {
    isRunning: false,
    type: null, // 'butterchurn' or 'local'
    instance: null
};

function toggleButterchurn() {
    if (globalVisualizerState.isRunning) {
        // Stop visualizer
        if (globalVisualizerState.instance && typeof globalVisualizerState.instance.stop === 'function') {
            globalVisualizerState.instance.stop();
        }
        if (typeof window.LocalVisualizer !== 'undefined') {
            window.LocalVisualizer.stop();
        }
        
        // Reset global state
        globalVisualizerState.isRunning = false;
        globalVisualizerState.type = null;
        globalVisualizerState.instance = null;
        isVisualizerRunning = false;
        
        // Update button text and status
        const toggleBtn = document.getElementById('toggleVisualizerBtn');
        if (toggleBtn) toggleBtn.textContent = '🎵 Start Visualizer';
        
        const presetStatus = document.getElementById('presetStatus');
        if (presetStatus) presetStatus.textContent = 'Stopped';
        
        logger.info('🎨 Visualizer stopped');
    } else {
        // Start visualizer
        try {
            const presetStatus = document.getElementById('presetStatus');
            if (presetStatus) presetStatus.textContent = 'Using local presets only';
            if (typeof window.LocalVisualizer !== 'undefined') {
                window.LocalVisualizer.start();
                
                // Update global state
                globalVisualizerState.isRunning = true;
                globalVisualizerState.type = 'local';
                globalVisualizerState.instance = window.LocalVisualizer;
                isVisualizerRunning = true;
                
                updatePresetSelect();
                updatePresetInfo();
                updateCurrentPreset();
                
                // Update button text
                const toggleBtn = document.getElementById('toggleVisualizerBtn');
                if (toggleBtn) toggleBtn.textContent = '⏹️ Stop Visualizer';
                
                // Ensure presets are loaded and dropdown is populated
                if (window.LocalVisualizer && window.LocalVisualizer.presets) {
                    console.log(`🎯 Loaded ${window.LocalVisualizer.presets.length} presets:`, window.LocalVisualizer.presets.map(p => p.name));
                }
                
                logger.info('🎨 Started LocalVisualizer (Butterchurn disabled)');
            }
        } catch (e) {
            console.error('Failed to start LocalVisualizer:', e);
        }
    }
}

function startButterchurn() {
    // Temporarily disable Butterchurn; use LocalVisualizer only
    try {
        const presetStatus = document.getElementById('presetStatus');
        if (presetStatus) presetStatus.textContent = 'Using local presets only';
        if (typeof window.LocalVisualizer !== 'undefined') {
            window.LocalVisualizer.start();
            isVisualizerRunning = true;
            updatePresetSelect();
            updatePresetInfo();
            updateCurrentPreset();
            logger.info('🎨 Started LocalVisualizer (Butterchurn disabled)');
        }
    } catch (e) {
        console.error('Failed to start LocalVisualizer:', e);
    }
}

function initializeButterchurn() {
    // Disabled; always use local presets
    const presetStatus = document.getElementById('presetStatus');
    if (presetStatus) presetStatus.textContent = 'Ready - Click Start Visualizer to begin';
    
    // Don't auto-start, just prepare the presets
    if (typeof window.LocalVisualizer !== 'undefined') {
        updatePresetSelect();
        updatePresetInfo();
        updateCurrentPreset();
        console.log('🎨 LocalVisualizer ready - not auto-started');
    }
}

function createButterchurnVisualizer() {
    try {
        const canvas = document.getElementById('butterchurnCanvas');
        if (!canvas) {
            throw new Error('Canvas not found');
        }
        
        // Check if Butterchurn is actually available
        if (typeof butterchurn === 'undefined') {
            throw new Error('Butterchurn library not loaded');
        }
        
        // Check if the createVisualizer method exists
        if (typeof butterchurn.createVisualizer !== 'function') {
            throw new Error('Butterchurn.createVisualizer is not a function - version compatibility issue');
        }
        
        console.log('🎨 Creating Butterchurn visualizer with:', butterchurn);
        
        // Create audio context
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        butterchurnCtx = new AudioContext();
        butterchurnAnalyser = butterchurnCtx.createAnalyser();
        butterchurnAnalyser.fftSize = 2048;
        butterchurnAnalyser.smoothingTimeConstant = 0.8;
        
        // Create visualizer
        butterchurnViz = butterchurn.createVisualizer(butterchurnCtx, canvas, {
            width: canvas.clientWidth || 400,
            height: canvas.clientHeight || 300,
            pixelRatio: Math.min(window.devicePixelRatio || 1, 2)
        });
        
        butterchurnViz.connectAudio(butterchurnAnalyser);
        
        // Connect to current audio if playing
        connectCurrentAudio();
        
        logger.info('🎨 Butterchurn visualizer created successfully');
        
        // Load presets
        loadAllPresets();
        
        // Hide local effect button since Butterchurn is working
        hideLocalEffectButton();

        // Start rendering immediately
        isVisualizerRunning = true;
        startRenderLoop();
        
    } catch (error) {
        console.error('Failed to create Butterchurn visualizer:', error);
        const presetStatus = document.getElementById('presetStatus');
        if (presetStatus) presetStatus.textContent = 'Visualizer creation failed - using fallback';
        
        // Try to use local visualizer as fallback
        initializeLocalFallback();
    }
}

function initializeLocalFallback() {
    try {
        console.log('🔄 Initializing local visualization fallback...');
        
        // Check if local visualizer is available
        if (typeof window.LocalVisualizer !== 'undefined') {
            console.log('✅ Local visualizer available as fallback');
            const presetStatus = document.getElementById('presetStatus');
            if (presetStatus) presetStatus.textContent = 'Using local visualizer';
        } else {
            console.log('⚠️ Local visualizer not available, showing error message');
            const presetStatus = document.getElementById('presetStatus');
            if (presetStatus) presetStatus.textContent = 'Visualization unavailable';
        }
        
        // Show local effect button if available
        if (typeof showLocalEffectButton === 'function') {
            showLocalEffectButton();
        }
        
    } catch (error) {
        console.error('Failed to initialize local fallback:', error);
        const presetStatus = document.getElementById('presetStatus');
        if (presetStatus) presetStatus.textContent = 'Fallback failed';
    }
}

function loadButterchurnScripts() {
    // Check if scripts are already loaded
    if (document.querySelector('script[src*="butterchurn"]')) {
        return;
    }
    
    // Try multiple CDN sources
    const cdnSources = [
        'https://unpkg.com/butterchurn@2.6.7/butterchurn.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/butterchurn/2.6.7/butterchurn.min.js',
        'https://cdn.jsdelivr.net/npm/butterchurn@2.6.7/butterchurn.min.js'
    ];
    
    const presetSources = [
        'https://unpkg.com/butterchurn-presets@2.4.7/dist/butterchurn-presets.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/butterchurn-presets/2.4.7/butterchurn-presets.min.js',
        'https://cdn.jsdelivr.net/npm/butterchurn-presets@2.4.7/dist/butterchurn-presets.min.js'
    ];
    
    function tryLoadScript(url, onSuccess, onError) {
        const script = document.createElement('script');
        script.src = url;
        script.onload = onSuccess;
        script.onerror = onError;
        document.head.appendChild(script);
    }
    
    function loadButterchurnCore(index = 0) {
        if (index >= cdnSources.length) {
            console.error('Failed to load Butterchurn from all CDN sources');
            const presetStatus = document.getElementById('presetStatus');
            if (presetStatus) presetStatus.textContent = 'Failed to load Butterchurn';
            showRetryButton();
            return;
        }
        
        tryLoadScript(cdnSources[index], 
            () => {
                console.log(`✅ Butterchurn loaded from: ${cdnSources[index]}`);
                loadButterchurnPresets(0);
            },
            () => {
                console.warn(`⚠️ Failed to load from: ${cdnSources[index]}`);
                loadButterchurnCore(index + 1);
            }
        );
    }
    
    function loadButterchurnPresets(index = 0) {
        if (index >= presetSources.length) {
            console.error('Failed to load Butterchurn presets from all CDN sources');
            const presetStatus = document.getElementById('presetStatus');
            if (presetStatus) presetStatus.textContent = 'Failed to load presets';
            showRetryButton();
            return;
        }
        
        tryLoadScript(presetSources[index],
            () => {
                console.log(`✅ Butterchurn presets loaded from: ${presetSources[index]}`);
                setTimeout(initializeButterchurn, 100);
            },
            () => {
                console.warn(`⚠️ Failed to load presets from: ${presetSources[index]}`);
                loadButterchurnPresets(index + 1);
            }
        );
    }
}

function connectCurrentAudio() {
    if (!butterchurnCtx || !butterchurnAnalyser) return;
    try {
        if (window.currentAudio) {
            // Resume context if suspended
            if (butterchurnCtx.state === 'suspended') {
                butterchurnCtx.resume().catch(() => {});
            }
            // Reuse existing source if bound to same element
            if (!butterchurnMediaSource || butterchurnMediaSource.mediaElement !== window.currentAudio) {
                // Disconnect previous
                try { butterchurnMediaSource && butterchurnMediaSource.disconnect(); } catch {}
                const src = butterchurnCtx.createMediaElementSource(window.currentAudio);
                butterchurnMediaSource = src;
                const gain = butterchurnCtx.createGain();
                src.connect(gain);
                gain.connect(butterchurnAnalyser);
                gain.connect(butterchurnCtx.destination);
            }
            logger.info('🎵 Connected to current audio');
        }
    } catch (error) {
        console.error('Failed to connect audio:', error);
    }
}

function loadAllPresets() {
    try {
        if (!butterchurnViz) return;
        
        // Load presets from Butterchurn
        const banks = [];
        if (window.butterchurnPresets?.getPresets) {
            banks.push(window.butterchurnPresets.getPresets("community"));
            banks.push(window.butterchurnPresets.getPresets("legacy"));
            banks.push(window.butterchurnPresets.getPresets("monstercat"));
        }
        
        // Flatten to array
        const list = [];
        banks.forEach(bank => {
            if (!bank) return;
            Object.keys(bank).forEach(name => list.push({ name, obj: bank[name] }));
        });
        
        // Fallback preset
        if (list.length === 0) {
            list.push({
                name: "Built-in: Simple Waves",
                obj: {
                    name: "simple-waves",
                    author: "butterchurn-inline",
                    shaders: {}
                }
            });
        }
        
        // Sort and store
        list.sort((a, b) => a.name.localeCompare(b.name));
        butterchurnPresets = list;
        
        // Update UI
        updatePresetSelect();
        updatePresetInfo();
        
        // Load first preset
        if (butterchurnPresets[0]) {
            butterchurnViz.loadPreset(butterchurnPresets[0].obj, 0.0);
            currentPresetIndex = 0;
            updateCurrentPreset();
        }
        
        logger.info(`🎨 Loaded ${butterchurnPresets.length} presets`);
        
    } catch (error) {
        console.error('Failed to load presets:', error);
        document.getElementById('presetStatus').textContent = 'Failed to load presets';
    }
}

function updatePresetSelect() {
    const presetSelect = document.getElementById('presetSelect');
    if (!presetSelect) return;
    
    // Clear existing options
    presetSelect.innerHTML = '';
    
    if (butterchurnPresets && butterchurnPresets.length) {
        butterchurnPresets.forEach((preset, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = preset.name;
            presetSelect.appendChild(option);
        });
        presetSelect.value = String(currentPresetIndex);
    } else if (typeof window.LocalVisualizer !== 'undefined' && window.LocalVisualizer.presets) {
        // Ensure we have the latest presets
        const presets = window.LocalVisualizer.presets;
        console.log(`🎯 Populating dropdown with ${presets.length} presets:`, presets.map(p => p.name));
        
        presets.forEach((preset, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = preset.name;
            presetSelect.appendChild(option);
        });
        
        if (typeof window.LocalVisualizer.currentPreset === 'number') {
            presetSelect.value = window.LocalVisualizer.currentPreset;
        }
    }
    
    // Log the final dropdown state
    console.log(`📋 Preset dropdown populated with ${presetSelect.options.length} options`);
}

function updatePresetInfo() {
    const totalPresets = document.getElementById('totalPresets');
    if (!totalPresets) return;
    if (butterchurnPresets && butterchurnPresets.length) {
        totalPresets.textContent = String(butterchurnPresets.length);
    } else if (typeof window.LocalVisualizer !== 'undefined' && window.LocalVisualizer.presets) {
        totalPresets.textContent = String(window.LocalVisualizer.presets.length);
    } else {
        totalPresets.textContent = '0';
    }
}

function updateCurrentPreset() {
    const currentPreset = document.getElementById('currentPreset');
    if (!currentPreset) return;
    if (butterchurnPresets && butterchurnPresets.length && typeof currentPresetIndex === 'number') {
        currentPreset.textContent = butterchurnPresets[currentPresetIndex]?.name || 'None';
    } else if (typeof window.LocalVisualizer !== 'undefined' && window.LocalVisualizer.presets) {
        currentPreset.textContent = window.LocalVisualizer.presets[window.LocalVisualizer.currentPreset]?.name || 'None';
    } else {
        currentPreset.textContent = 'None';
    }
}

function nextPreset() {
    if (butterchurnViz && butterchurnPresets && butterchurnPresets.length) {
        const blend = Number(document.getElementById('blendSec')?.value || 2);
        currentPresetIndex = (currentPresetIndex + 1) % butterchurnPresets.length;
        butterchurnViz.loadPreset(butterchurnPresets[currentPresetIndex].obj, blend);
        updateCurrentPreset();
        logger.info('⏭️ Next Butterchurn preset');
    } else if (typeof window.LocalVisualizer !== 'undefined') {
        window.LocalVisualizer.next();
        updateCurrentPreset();
        logger.info('⏭️ Next local preset');
    }
}

function previousPreset() {
    if (butterchurnViz && butterchurnPresets && butterchurnPresets.length) {
        const blend = Number(document.getElementById('blendSec')?.value || 2);
        currentPresetIndex = (currentPresetIndex - 1 + butterchurnPresets.length) % butterchurnPresets.length;
        butterchurnViz.loadPreset(butterchurnPresets[currentPresetIndex].obj, blend);
        updateCurrentPreset();
        logger.info('⏮️ Previous Butterchurn preset');
    } else if (typeof window.LocalVisualizer !== 'undefined') {
        window.LocalVisualizer.previous();
        updateCurrentPreset();
        logger.info('⏮️ Previous local preset');
    }
}

function randomPreset() {
    if (butterchurnViz && butterchurnPresets && butterchurnPresets.length) {
        const blend = Number(document.getElementById('blendSec')?.value || 2);
        let n = currentPresetIndex;
        if (butterchurnPresets.length > 1) {
            while (n === currentPresetIndex) {
                n = (Math.random() * butterchurnPresets.length) | 0;
            }
        }
        currentPresetIndex = n;
        butterchurnViz.loadPreset(butterchurnPresets[currentPresetIndex].obj, blend);
        updateCurrentPreset();
        logger.info('🎲 Random Butterchurn preset');
    } else if (typeof window.LocalVisualizer !== 'undefined') {
        window.LocalVisualizer.random();
        updateCurrentPreset();
        logger.info('🎲 Random local preset');
    }
}

function selectPreset(value) {
    const index = parseInt(value);
    if (butterchurnViz && butterchurnPresets && butterchurnPresets.length) {
        if (index >= 0 && index < butterchurnPresets.length) {
            const blend = Number(document.getElementById('blendSec')?.value || 2);
            currentPresetIndex = index;
            butterchurnViz.loadPreset(butterchurnPresets[currentPresetIndex].obj, blend);
            updateCurrentPreset();
            logger.info(`🎯 Selected Butterchurn preset: ${butterchurnPresets[index].name}`);
        }
    } else if (typeof window.LocalVisualizer !== 'undefined' && window.LocalVisualizer.presets) {
        if (index >= 0 && index < window.LocalVisualizer.presets.length) {
            // Update the current preset
            window.LocalVisualizer.currentPreset = index;
            
            // Force a render update to show the new preset
            if (window.LocalVisualizer.isRunning) {
                // Trigger a render to show the new preset immediately
                window.LocalVisualizer.render();
            }
            
            // Update UI
            window.LocalVisualizer.updatePresetInfo();
            updateCurrentPreset();
            
            console.log(`🎯 Selected preset: ${window.LocalVisualizer.presets[index].name} (type: ${window.LocalVisualizer.presets[index].type})`);
            logger.info(`🎯 Selected preset: ${window.LocalVisualizer.presets[index].name}`);
        }
    }
}

function toggleAutoPreset() {
    const autoSelect = document.getElementById('autoMs');
    const currentValue = autoSelect.value;
    
    if (currentValue === '0') {
        // Turn on auto with 30s default
        autoSelect.value = '30000';
        setAutoPreset('30000');
    } else {
        // Turn off auto
        autoSelect.value = '0';
        setAutoPreset('0');
    }
}

function setAutoPreset(ms) {
    if (autoPresetTimer) {
        clearInterval(autoPresetTimer);
        autoPresetTimer = null;
    }
    
    const milliseconds = Number(ms);
    if (milliseconds > 0) {
        autoPresetTimer = setInterval(() => {
            if (isVisualizerRunning) {
                nextPreset();
            }
        }, milliseconds);
        logger.info(`🔄 Auto preset enabled: ${milliseconds/1000}s`);
    } else {
        logger.info('🔄 Auto preset disabled');
    }
}

function startRenderLoop() {
    if (!butterchurnViz) return;
    
    function render() {
        if (isVisualizerRunning && butterchurnViz) {
            butterchurnViz.render();
            requestAnimationFrame(render);
        }
    }
    render();
}

// This function has been consolidated with the main closeProjectMPanel function above

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

// Add this to the existing music system to connect Butterchurn when audio plays
function connectButterchurnToAudio(audioElement) {
    if (!butterchurnCtx || !butterchurnAnalyser || !audioElement) return;
    
    try {
        // Disconnect any existing connections
        if (butterchurnCtx.state === 'suspended') {
            butterchurnCtx.resume();
        }
        
        // Create new audio source connection
        const source = butterchurnCtx.createMediaElementSource(audioElement);
        const gain = butterchurnCtx.createGain();
        source.connect(gain);
        gain.connect(butterchurnAnalyser);
        gain.connect(butterchurnCtx.destination); // Route to speakers
        
        logger.info('🎵 Butterchurn connected to audio');
        
        // If visualizer is running, start rendering
        if (isVisualizerRunning && butterchurnViz) {
            startRenderLoop();
        }
        
    } catch (error) {
        console.error('Failed to connect Butterchurn to audio:', error);
    }
}

// Hook into existing music system
function hookButterchurnIntoMusic() {
    // Override the existing playMusic function to connect Butterchurn
    const originalPlayMusic = window.playMusic;
    if (originalPlayMusic) {
        window.playMusic = function(trackIndex) {
            const result = originalPlayMusic.call(this, trackIndex);
            
            // Connect Butterchurn after a short delay to ensure audio is loaded
            setTimeout(() => {
                if (window.currentAudio) {
                    connectButterchurnToAudio(window.currentAudio);
                }
            }, 100);
            
            return result;
        };
    }
    
    // Also hook into radio stream changes
    const originalPlayRadio = window.playRadio;
    if (originalPlayRadio) {
        window.playRadio = function(streamUrl) {
            const result = originalPlayRadio.call(this, streamUrl);
            
            setTimeout(() => {
                if (window.currentAudio) {
                    connectButterchurnToAudio(window.currentAudio);
                }
            }, 100);
            
            return result;
        };
    }
}

// Initialize Butterchurn integration when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Hook Butterchurn into the existing music system
    hookButterchurnIntoMusic();
    
    // Initialize Butterchurn when the panel is first opened
    const projectmPanel = document.getElementById('projectmPanel');
    if (projectmPanel) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    if (projectmPanel.style.display === 'block' && !butterchurnViz) {
                        // Panel opened for the first time, initialize Butterchurn
                        setTimeout(() => {
                            if (typeof butterchurn !== 'undefined') {
                                initializeButterchurn();
                            }
                        }, 100);
                    }
                }
            });
        });
        
        observer.observe(projectmPanel, { attributes: true });
    }
});

function retryButterchurn() {
    try {
        // Reset state
        butterchurnViz = null;
        butterchurnCtx = null;
        butterchurnAnalyser = null;
        butterchurnPresets = [];
        currentPresetIndex = 0;
        isVisualizerRunning = false;
        
        // Safely update UI elements if they exist
        const retryBtn = document.getElementById('retryBtn');
        const presetStatus = document.getElementById('presetStatus');
        const currentPreset = document.getElementById('currentPreset');
        const totalPresets = document.getElementById('totalPresets');
        
        if (retryBtn) retryBtn.style.display = 'none';
        if (presetStatus) presetStatus.textContent = 'Retrying...';
        if (currentPreset) currentPreset.textContent = 'None';
        if (totalPresets) totalPresets.textContent = '0';
        
        // Hide local effect button
        hideLocalEffectButton();
        
        // Clear canvas
        const canvas = document.getElementById('butterchurnCanvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
        
        // Stop local visualizer if running
        if (window.localVisualizer) {
            window.localVisualizer.stop();
            window.localVisualizer = null;
        }
        
        // Try to initialize again
        setTimeout(() => {
            initializeButterchurn();
        }, 500);
        
        logger.info('🔄 Retrying Butterchurn initialization');
        
    } catch (error) {
        console.error('Failed to retry Butterchurn:', error);
        const presetStatus = document.getElementById('presetStatus');
        if (presetStatus) presetStatus.textContent = 'Retry failed';
    }
}

function showRetryButton() {
    const retryBtn = document.getElementById('retryBtn');
    if (retryBtn) {
        retryBtn.style.display = 'inline-block';
    }
}

function hideRetryButton() {
    const retryBtn = document.getElementById('retryBtn');
    if (retryBtn) {
        retryBtn.style.display = 'none';
    }
}

function nextLocalEffect() {
    if (window.localVisualizer) {
        window.localVisualizer.nextEffect();
        logger.info('🎨 Switched to next local effect');
    }
}

function showLocalEffectButton() {
    const nextLocalEffectBtn = document.getElementById('nextLocalEffectBtn');
    if (nextLocalEffectBtn) {
        nextLocalEffectBtn.style.display = 'inline-block';
    }
}

function hideLocalEffectButton() {
    const nextLocalEffectBtn = document.getElementById('nextLocalEffectBtn');
    if (nextLocalEffectBtn) {
        nextLocalEffectBtn.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Hook local visualizer into the existing music system
    hookLocalVisualizerIntoMusic();
    
    // Initialize local visualizer when the panel is first opened
    const projectmPanel = document.getElementById('projectmPanel');
    if (projectmPanel) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    if (projectmPanel.style.display === 'block') {
                        // Panel opened, ensure local visualizer is ready
                                if (typeof window.LocalVisualizer !== 'undefined' && !window.LocalVisualizer.canvas) {
            // Module system handles initialization
            console.log('🎨 Module-based visualizer ready');
        }
                    }
                }
            });
        });
        
        observer.observe(projectmPanel, { attributes: true });
    }
});

function hookLocalVisualizerIntoMusic() {
    // Override the existing playMusic function to connect to local visualizer
    const originalPlayMusic = window.playMusic;
    window.playMusic = function(filename, event) {
        // Call original function
        const result = originalPlayMusic.call(this, filename, event);
        
        // Connect local visualizer to audio if available
        if (typeof LocalVisualizer !== 'undefined' && window.currentAudio) {
            connectLocalVisualizerToAudio(window.currentAudio);
        }
        
        return result;
    };
    
    // Override the existing playRadio function to connect to local visualizer
    const originalPlayRadio = window.playRadioStream;
    window.playRadioStream = function(radioUrl) {
        // Call original function
        const result = originalPlayRadio.call(this, radioUrl);
        
        // Connect local visualizer to audio if available
        if (typeof LocalVisualizer !== 'undefined' && window.currentAudio) {
            connectLocalVisualizerToAudio(window.currentAudio);
        }
        
        return result;
    };
    
    logger.info('🎵 Local visualizer hooked into music system');
}

function connectLocalVisualizerToAudio(audioElement) {
    try {
        if (!audioElement || typeof LocalVisualizer === 'undefined') return;
        
        // Connect the LocalVisualizer to the audio element
        if (LocalVisualizer.connectToAudio) {
            LocalVisualizer.connectToAudio(audioElement);
        }
        
        // Dispatch audio connected event for other systems
        document.dispatchEvent(new CustomEvent('audioConnected', {
            detail: { audioElement: audioElement }
        }));
        
        logger.info('🎵 Local visualizer connected to audio');
        
    } catch (error) {
        console.error('Failed to connect local visualizer to audio:', error);
    }
}

// ===== BUTTERCHURN CDN LOADING FUNCTIONS =====
window.loadButterchurnDynamically = function() {
    return new Promise((resolve, reject) => {
        console.log('🔄 Loading Butterchurn from CDN...');
        
        // Multiple CDN sources with specific versions for compatibility
        const cdnSources = [
            'https://unpkg.com/butterchurn@2.6.7/dist/butterchurn.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/butterchurn/2.6.7/butterchurn.min.js',
            'https://cdn.jsdelivr.net/npm/butterchurn@2.6.7/dist/butterchurn.min.js',
            'https://unpkg.com/butterchurn@latest/dist/butterchurn.min.js',
            'https://cdn.jsdelivr.net/npm/butterchurn@latest/dist/butterchurn.min.js'
        ];
        
        let currentSourceIndex = 0;
        
        function tryNextSource() {
            if (currentSourceIndex >= cdnSources.length) {
                reject(new Error('All CDN sources failed'));
                return;
            }
            
            const source = cdnSources[currentSourceIndex];
            console.log(`🔄 Trying CDN source ${currentSourceIndex + 1}: ${source}`);
            
            const script = document.createElement('script');
            script.src = source;
            script.onload = () => {
                console.log(`✅ Butterchurn loaded successfully from: ${source}`);
                
                // Wait a moment for the script to initialize
                setTimeout(() => {
                    if (typeof butterchurn !== 'undefined') {
                        console.log('✅ Butterchurn object available:', butterchurn);
                        resolve();
                    } else {
                        console.warn('⚠️ Butterchurn loaded but object not available, trying next source');
                        currentSourceIndex++;
                        tryNextSource();
                    }
                }, 100);
            };
            script.onerror = () => {
                console.warn(`⚠️ Failed to load from: ${source}`);
                currentSourceIndex++;
                tryNextSource();
            };
            
            document.head.appendChild(script);
        }
        
        tryNextSource();
    });
};

window.loadButterchurnPresetsDynamically = function() {
    return new Promise((resolve, reject) => {
        console.log('🔄 Loading Butterchurn presets (CDN)...');
        
        const presetSources = [
            'https://unpkg.com/butterchurn-presets@2.4.7/dist/butterchurn-presets.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/butterchurn-presets/2.4.7/butterchurn-presets.min.js',
            'https://cdn.jsdelivr.net/npm/butterchurn-presets@2.4.7/dist/butterchurn-presets.min.js'
        ];
        
        let idx = 0;
        
        function tryNext() {
            if (idx >= presetSources.length) {
                return reject(new Error('All butterchurn-presets CDN sources failed'));
            }
            const src = presetSources[idx];
            console.log(`🔄 Trying presets CDN ${idx + 1}: ${src}`);
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => {
                // Verify global is present
                setTimeout(() => {
                    if (window.butterchurnPresets && typeof window.butterchurnPresets.getPresets === 'function') {
                        console.log('✅ butterchurn-presets loaded');
                        resolve();
                    } else {
                        console.warn('⚠️ Presets script loaded but API missing, trying next');
                        idx += 1;
                        tryNext();
                    }
                }, 100);
            };
            script.onerror = () => {
                console.warn(`⚠️ Failed to load presets from ${src}`);
                idx += 1;
                tryNext();
            };
            document.head.appendChild(script);
        }
        
        tryNext();
    });
};

// ===== UNIFIED LOCAL PRESET LOADING SYSTEM =====
async function loadLocalPresets() {
    try {
        console.log('🏠 Loading all available local presets...');
        
        // Update status
        const presetStatus = document.getElementById('presetStatus');
        if (presetStatus) presetStatus.textContent = 'Loading local presets...';
        
        // Stop any currently running visualizers to prevent conflicts
        if (typeof window.LocalVisualizer !== 'undefined' && window.LocalVisualizer.isRunning) {
            window.LocalVisualizer.stop();
        }
        if (butterchurnViz) {
            butterchurnViz.disconnect();
            butterchurnViz = null;
        }
        
        // Clear existing presets
        butterchurnPresets = [];
        currentPresetIndex = 0;
        
        // Load all available preset files
        const presetFiles = [
            'presets/effects/aurora-borealis.js',
            'presets/effects/fractal-universe.js',
            'presets/effects/holographic-display.js',
            'presets/effects/image-collage-visual.js',
            'presets/effects/matrix-rain-visual.js',
            'presets/effects/milklike-elephant.js',
            'presets/effects/my-cool-effect.js',
            'presets/effects/neon-pulse.js',
            'presets/effects/neural-network.js',
            'presets/effects/quantum-plasma-storm.js',
            'presets/effects/rainbow-spiral-GL.js',
            'presets/effects/solar-flare.js',
            'presets/effects/spirograph-orbital.js'
        ];
        
        console.log(`📁 Found ${presetFiles.length} preset files to load`);
        
        // Load each preset file
        for (const presetFile of presetFiles) {
            try {
                const response = await fetch(presetFile);
                if (response.ok) {
                    const presetCode = await response.text();
                    
                    // Create a preset object
                    const preset = {
                        name: presetFile.split('/').pop().replace('.js', ''),
                        file: presetFile,
                        code: presetCode,
                        type: 'local'
                    };
                    
                    butterchurnPresets.push(preset);
                    console.log(`✅ Loaded preset: ${preset.name}`);
                } else {
                    console.warn(`⚠️ Failed to load preset: ${presetFile} (${response.status})`);
                }
            } catch (error) {
                console.warn(`⚠️ Error loading preset ${presetFile}:`, error.message);
            }
        }
        
        // Also check if LocalVisualizer has presets and merge them
        if (typeof window.LocalVisualizer !== 'undefined' && window.LocalVisualizer.presets) {
            console.log(`🔄 Merging ${window.LocalVisualizer.presets.length} LocalVisualizer presets`);
            
            window.LocalVisualizer.presets.forEach((preset, index) => {
                const mergedPreset = {
                    name: preset.name || `Local-${index + 1}`,
                    source: 'LocalVisualizer',
                    index: index,
                    type: 'local-module'
                };
                butterchurnPresets.push(mergedPreset);
            });
        }
        
        console.log(`🎯 Total presets loaded: ${butterchurnPresets.length}`);
        
        // Update UI
        updatePresetSelect();
        updatePresetInfo();
        
        // Update status
        if (presetStatus) {
            presetStatus.textContent = `Loaded ${butterchurnPresets.length} local presets`;
        }
        
        // Show success message
        logger.success(`🏠 Successfully loaded ${butterchurnPresets.length} local presets`);
        
        // Auto-start visualizer if presets were loaded
        if (butterchurnPresets.length > 0) {
            startButterchurn();
        }
        
    } catch (error) {
        console.error('❌ Failed to load local presets:', error);
        const presetStatus = document.getElementById('presetStatus');
        if (presetStatus) {
            presetStatus.textContent = 'Failed to load presets';
        }
        logger.error('Failed to load local presets: ' + error.message);
    }
}

// Retry Butterchurn loading
function retryButterchurn() {
    // Disabled; keep using local presets only
    const presetStatus = document.getElementById('presetStatus');
    if (presetStatus) presetStatus.textContent = 'Butterchurn disabled - using local presets';
    if (typeof hideRetryButton === 'function') hideRetryButton();
}

// Make functions globally available
window.loadLocalPresets = loadLocalPresets;
window.autoLoadLocalPresets = autoLoadLocalPresets;
window.retryButterchurn = retryButterchurn;