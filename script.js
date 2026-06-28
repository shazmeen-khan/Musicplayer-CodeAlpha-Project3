// Playlist songs — MP3 files are in the songs/ folder
const defaultSongs = [
    {
        title: "Allah Waariyan",
        artist: "Himansh Kohli",
        src: "songs/ALLAH WAARIYAN FULL SONG (AUDIO) _ YAARIYAN _ HIMANSH KOHLI_ RAKUL PREET(MP3_320K).mp3",
        cover: "Images/allah_waariyan.jpg",
        isLocal: false
    },
    {
        title: "Lambiyaan Si Judaiyaan",
        artist: "Arijit Singh",
        src: "songs/Arijit Singh _ Lambiyaan Si Judaiyaan With Lyrics _ Raabta _ Sushant Rajput_ Kriti Sanon _ T-Series(MP3_320K).mp3",
        cover: "Images/lambiyaan_judaiyaan.png",
        isLocal: false
    },
    {
        title: "Roi Na",
        artist: "Hindi Sad Song",
        src: "songs/Roi Na Je yaad Meri Aayi Ve _ New Sad Songs Hindi 2020 _ Hindi Sad Song _ Sad Songs _ New Sad Song(MP3_320K).mp3",
        cover: "Images/roi_na.png",
        isLocal: false
    },
    {
        title: "Shiddat",
        artist: "Manan Bhardwaj",
        src: "songs/Shiddat Title Track (LYRICS) - Sunny Kaushal_ Radhika Madan_ Mohit Raina_ Diana P _ Manan Bhardwaj(MP3_320K).mp3",
        cover: "Images/shiddat.png",
        isLocal: false
    },
    {
        title: "Milne Hai Mujhse Aayi",
        artist: "Aditya Roy Kapur",
        src: "songs/_Milne Hai Mujhse Aayi Aashiqui 2_ Full Video Song _ Aditya Roy Kapur_ Shraddha Kapoor(MP3_320K).mp3",
        cover: "Images/milne_hai_mujhse.png",
        isLocal: false
    },
    {
        title: "So Dafa Pukara Hai",
        artist: "Sad Song",
        src: "songs/use so dafa pukara hai dil ne song(MP3_320K).mp3",
        cover: "Images/so_dafa.png",
        isLocal: false
    }
];

// Load saved songs from localStorage (songs user added previously)
// We only save non-local songs to localStorage — local file ObjectURLs
// don't survive page refresh, so we can't restore those.
function loadSavedSongs() {
    let saved = localStorage.getItem('userAddedSongs');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            return [];
        }
    }
    return [];
}

// Build the full playlist: preset songs + user-added saved songs
let songs = defaultSongs.concat(loadSavedSongs());

// DOM Elements
const audio         = document.getElementById('audio');
const coverImg      = document.getElementById('cover');
const titleEl       = document.getElementById('title');
const artistEl      = document.getElementById('artist');
const playBtn       = document.getElementById('play');
const playIcon      = document.getElementById('play-icon');
const prevBtn       = document.getElementById('prev');
const nextBtn       = document.getElementById('next');
const shuffleBtn    = document.getElementById('shuffle');
const repeatBtn     = document.getElementById('repeat');
const progressBar   = document.getElementById('progress-bar');
const currentTimeEl = document.getElementById('current-time');
const durationEl    = document.getElementById('duration');
const volumeSlider  = document.getElementById('volume-slider');
const muteBtn       = document.getElementById('mute');
const volumeIcon    = document.getElementById('volume-icon');
const playlistEl    = document.getElementById('playlist');

const fileInput        = document.getElementById('file-input');
const uploadModal      = document.getElementById('upload-modal');
const modalTitleInput  = document.getElementById('modal-title');
const modalArtistInput = document.getElementById('modal-artist');
const modalCoverFile   = document.getElementById('modal-cover-file');
const coverFileName    = document.getElementById('cover-file-name');
const coverPreview     = document.getElementById('cover-preview');
const modalCancelBtn   = document.getElementById('modal-cancel');
const modalAddBtn      = document.getElementById('modal-add');

// State
let currentIndex = 0;
let isPlaying    = false;
let isShuffle    = false;
let isRepeat     = false;

let pendingAudioURL = null;
let pendingCoverURL = null;

const defaultCover = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=500&q=60";

// =====================
// Init
// =====================
function init() {
    audio.volume = volumeSlider.value / 100;
    renderPlaylist();
    loadSong(songs[currentIndex]);
}

// =====================
// Load song into player
// =====================
function loadSong(song) {
    titleEl.textContent  = song.title;
    artistEl.textContent = song.artist;
    coverImg.src         = song.cover;
    audio.src            = song.src;
    progressBar.value    = 0;
    currentTimeEl.textContent = '0:00';
    updatePlaylistHighlight();
}

// =====================
// Play / Pause
// =====================
function togglePlay() {
    if (isPlaying) {
        pauseSong();
    } else {
        playSong();
    }
}

function playSong() {
    isPlaying = true;
    playIcon.classList.replace('fa-play', 'fa-pause');
    coverImg.classList.add('spinning');
    audio.play();
}

function pauseSong() {
    isPlaying = false;
    playIcon.classList.replace('fa-pause', 'fa-play');
    coverImg.classList.remove('spinning');
    audio.pause();
}

// =====================
// Previous / Next
// =====================
function prevSong() {
    currentIndex--;
    if (currentIndex < 0) currentIndex = songs.length - 1;
    loadSong(songs[currentIndex]);
    if (isPlaying) playSong();
}

function nextSong() {
    if (isShuffle) {
        let r;
        do { r = Math.floor(Math.random() * songs.length); }
        while (r === currentIndex && songs.length > 1);
        currentIndex = r;
    } else {
        currentIndex++;
        if (currentIndex >= songs.length) currentIndex = 0;
    }
    loadSong(songs[currentIndex]);
    if (isPlaying) playSong();
}

// =====================
// Progress
// =====================
function updateProgress(e) {
    let dur = e.target.duration;
    let cur = e.target.currentTime;
    if (!isNaN(dur)) {
        progressBar.value = (cur / dur) * 100;
        currentTimeEl.textContent = formatTime(cur);
        durationEl.textContent    = formatTime(dur);
    }
}

function setProgress(e) {
    if (!isNaN(audio.duration)) {
        audio.currentTime = (e.target.value / 100) * audio.duration;
    }
}

// =====================
// Volume
// =====================
function setVolume(e) {
    let vol = e.target.value / 100;
    audio.volume = vol;
    if (audio.muted && vol > 0) audio.muted = false;
    updateVolumeIcon(vol);
}

function toggleMute() {
    audio.muted = !audio.muted;
    updateVolumeIcon(audio.muted ? 0 : audio.volume);
}

function updateVolumeIcon(vol) {
    if (vol === 0 || audio.muted) {
        volumeIcon.className = 'fa-solid fa-volume-xmark';
    } else if (vol > 0.5) {
        volumeIcon.className = 'fa-solid fa-volume-high';
    } else {
        volumeIcon.className = 'fa-solid fa-volume-low';
    }
}

// =====================
// Render playlist
// =====================
function renderPlaylist() {
    playlistEl.innerHTML = '';

    for (let i = 0; i < songs.length; i++) {
        let song = songs[i];
        let li   = document.createElement('li');
        li.classList.add('playlist-item');
        if (i === currentIndex) li.classList.add('active');

        li.innerHTML = `
            <img src="${song.cover}" alt="cover" class="playlist-item-img">
            <div class="playlist-item-info">
                <div class="playlist-item-title">${song.title}</div>
                <div class="playlist-item-artist">${song.artist}</div>
            </div>
            <i class="fa-solid fa-music playlist-item-playing-icon"></i>
        `;

        li.addEventListener('click', (function(idx) {
            return function() {
                currentIndex = idx;
                loadSong(songs[currentIndex]);
                playSong();
            };
        })(i));

        playlistEl.appendChild(li);
    }
}

function updatePlaylistHighlight() {
    let items = playlistEl.querySelectorAll('.playlist-item');
    for (let i = 0; i < items.length; i++) {
        items[i].classList.toggle('active', i === currentIndex);
    }
}

// =====================
// Save user songs to localStorage
// Only saves songs that are NOT local ObjectURL files
// because ObjectURLs expire after page refresh
// =====================
function saveUserSongs() {
    // Get only the user-added songs (after the default 5)
    let userSongs = songs.slice(defaultSongs.length).filter(function(s) {
        return !s.isLocal;
    });
    localStorage.setItem('userAddedSongs', JSON.stringify(userSongs));
}

// =====================
// Upload Modal
// =====================
fileInput.addEventListener('change', function(e) {
    let file = e.target.files[0];
    if (!file) return;

    pendingAudioURL = URL.createObjectURL(file);

    // Pre-fill title from filename
    modalTitleInput.value  = file.name.replace(/\.[^.]+$/, '');
    modalArtistInput.value = '';

    pendingCoverURL = null;
    coverPreview.style.display = 'none';
    coverFileName.textContent  = 'No file chosen';

    uploadModal.style.display = 'flex';
    fileInput.value = '';
});

modalCoverFile.addEventListener('change', function(e) {
    let imgFile = e.target.files[0];
    if (!imgFile) return;

    pendingCoverURL = URL.createObjectURL(imgFile);
    coverFileName.textContent  = imgFile.name;
    coverPreview.src           = pendingCoverURL;
    coverPreview.style.display = 'block';
});

modalCancelBtn.addEventListener('click', function() {
    closeModal();
});

modalAddBtn.addEventListener('click', function() {
    let songTitle  = modalTitleInput.value.trim()  || 'Unknown Title';
    let songArtist = modalArtistInput.value.trim() || 'Unknown Artist';
    let songCover  = pendingCoverURL || defaultCover;

    let newSong = {
        title:   songTitle,
        artist:  songArtist,
        src:     pendingAudioURL,
        cover:   songCover,
        isLocal: true   // local ObjectURL — cannot be saved to localStorage
    };

    songs.push(newSong);

    // Save only non-local songs to localStorage for next session
    saveUserSongs();

    currentIndex = songs.length - 1;
    renderPlaylist();
    loadSong(songs[currentIndex]);
    playSong();

    closeModal();
});

uploadModal.addEventListener('click', function(e) {
    if (e.target === uploadModal) closeModal();
});

function closeModal() {
    uploadModal.style.display = 'none';
    pendingAudioURL = null;
    pendingCoverURL = null;
    modalCoverFile.value = '';
}

// =====================
// Time Formatter
// =====================
function formatTime(seconds) {
    let min = Math.floor(seconds / 60);
    let sec = Math.floor(seconds % 60);
    return min + ':' + (sec < 10 ? '0' + sec : sec);
}

// =====================
// Events
// =====================
playBtn.addEventListener('click', togglePlay);
prevBtn.addEventListener('click', prevSong);
nextBtn.addEventListener('click', nextSong);
muteBtn.addEventListener('click', toggleMute);
progressBar.addEventListener('input', setProgress);
volumeSlider.addEventListener('input', setVolume);
audio.addEventListener('timeupdate', updateProgress);

audio.addEventListener('loadedmetadata', function() {
    durationEl.textContent = formatTime(audio.duration);
});

audio.addEventListener('ended', function() {
    if (isRepeat) {
        audio.currentTime = 0;
        playSong();
    } else {
        nextSong();
    }
});

shuffleBtn.addEventListener('click', function() {
    isShuffle = !isShuffle;
    shuffleBtn.classList.toggle('active', isShuffle);
});

repeatBtn.addEventListener('click', function() {
    isRepeat = !isRepeat;
    repeatBtn.classList.toggle('active', isRepeat);
});

// Start
init();
