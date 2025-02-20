// 基础API地址
const API_BASE_URL = "http://localhost:3000"; 

// 播放列表
let playlist = {};
let currentTrackIndex = 0;

// 获取轮播图数据
async function fetchBanners() {
    try {
        const response = await fetch(`${API_BASE_URL}/banner`);
        const data = await response.json();
        renderCarousel(data.banners);
    } catch (error) {
        console.error("获取轮播图数据失败:", error);
    }
}

// 渲染轮播图
function renderCarousel(banners) {
    const carouselContainer = document.getElementById("carousel-container");
    const carouselIndicators = document.getElementById("carousel-indicators");

    carouselContainer.innerHTML = "";
    carouselIndicators.innerHTML = "";

    banners.forEach((banner, index) => {
        const carouselItem = document.createElement("div");
        carouselItem.className = `carousel-item ${index === 0 ? "active" : ""}`;
        carouselItem.innerHTML = `<img src="${banner.imageUrl}" alt="轮播图">`;
        carouselContainer.appendChild(carouselItem);

        const indicator = document.createElement("span");
        indicator.className = `indicator ${index === 0 ? "active" : ""}`;
        indicator.dataset.index = index;
        carouselIndicators.appendChild(indicator);
    });

    let currentIndex = 0;

    function showBanner(index) {
        if (index >= banners.length) index = 0;
        if (index < 0) index = banners.length - 1;
        const items = carouselContainer.children;
        for (let i = 0; i < items.length; i++) {
            items[i].classList.remove("active");
        }
        items[index].classList.add("active");

        const indicators = carouselIndicators.children;
        for (let i = 0; i < indicators.length; i++) {
            indicators[i].classList.remove("active");
        }
        indicators[index].classList.add("active");
        currentIndex = index;
    }

    function nextBanner() {
        showBanner(currentIndex + 1);
    }

    function prevBanner() {
        showBanner(currentIndex - 1);
    }

    carouselIndicators.addEventListener("click", (event) => {
        if (event.target.classList.contains("indicator")) {
            const newIndex = parseInt(event.target.dataset.index);
            showBanner(newIndex);
        }
    });

    setInterval(nextBanner, 3000);
}

// 获取推荐歌单
async function fetchRecommendPlaylists() {
    try {
        const response = await fetch(`${API_BASE_URL}/personalized`);
        const data = await response.json();
        renderRecommendPlaylists(data.result);
    } catch (error) {
        console.error("获取推荐歌单失败:", error);
    }
}

// 渲染推荐歌单
function renderRecommendPlaylists(playlists) {
    const recommendPlaylists = document.getElementById("recommend-playlists");
    recommendPlaylists.innerHTML = "";

    playlists.forEach(playlist => {
        const playlistItem = document.createElement("div");
        playlistItem.className = "playlist-item";
        playlistItem.innerHTML = `
            <img src="${playlist.picUrl}" alt="歌单封面">
            <div class="playlist-info">
                <h3>${playlist.name}</h3>
                <p>播放数：${playlist.playCount}</p>
            </div>
        `;
        recommendPlaylists.appendChild(playlistItem);

        playlistItem.addEventListener("click", () => {
            fetchPlaylistDetails(playlist.id);
        });
    });
}

// 获取歌单详情
async function fetchPlaylistDetails(playlistId) {
    try {
        const response = await fetch(`${API_BASE_URL}/playlist/detail?id=${playlistId}`);
        const data = await response.json();
        if (data.playlist && data.playlist.tracks) {
            playlist = data.playlist.tracks; // 直接使用对象
            renderPlaylistDetails(data.playlist);
            document.getElementById("playlist-details").scrollIntoView({ behavior: "smooth" });
        } else {
            console.error("playlist.tracks 不是一个对象");
            renderPlaylistDetails({ ...data.playlist, tracks: {} }); // 处理为一个空对象
        }
    } catch (error) {
        console.error("获取歌单详情失败:", error);
    }
}

// 渲染歌单详情
function renderPlaylistDetails(playlist) {
    const playlistName = document.getElementById("playlist-name");
    const playlistDescription = document.getElementById("playlist-description");
    const playlistTracks = document.getElementById("playlist-tracks");
    const name =document.getElementById("track-title");
    const artist = document.getElementById("track-artist");
    playlistName.textContent = playlist.name;
    playlistDescription.textContent = playlist.description;
    playlistTracks.innerHTML = "";

    // 初始化播放列表
    playlist = playlist.tracks || {};

    // 遍历对象的键
    Object.keys(playlist).forEach((key, index) => {
        const track = playlist[key];
        const trackItem = document.createElement("div");
        trackItem.className = "track-item";
        const artistsNames = track.ar && track.ar.map(artist => artist.name).join(", ");
        trackItem.innerHTML = `
            <span>${index + 1}</span>
            <div class="track-info">
                <h3>${track.name}</h3>
                <p>${artistsNames || "未知艺术家"} - ${track.al && track.al.name || "未知专辑"}</p>
            </div>
        `;
        playlistTracks.appendChild(trackItem);

        // 添加点击事件，播放歌曲
        trackItem.addEventListener("click", () => {
            name.textContent = track.name;
            artist.textContent = artistsNames;
            currentTrackIndex = index;
            playSong(track.id);
        });
    });
}

// 播放歌曲
async function playSong(songId) {
    try {
        const response = await fetch(`${API_BASE_URL}/song/url?id=${songId}`);
        const data = await response.json();
        if (data.data && data.data.length > 0 && data.data[0].url) {
            const songUrl = data.data[0].url;

            const audioPlayer = document.getElementById("audioPlayer");
            audioPlayer.src = songUrl;
            audioPlayer.play();

            updateProgress();
        } else {
            console.error("无法获取有效的歌曲URL");
        }
    } catch (error) {
        console.error("获取歌曲URL失败:", error);
    }
}

// 播放下一首歌曲
function playNextSong() {
    const keys = Object.keys(playlist);
    currentTrackIndex = (currentTrackIndex + 1) % keys.length;
    const nextTrackId = playlist[keys[currentTrackIndex]].id;
    playSong(nextTrackId);
}

// 播放上一首歌曲
function playPreviousSong() {
    const keys = Object.keys(playlist);
    currentTrackIndex = (currentTrackIndex - 1 + keys.length) % keys.length;
    const previousTrackId = playlist[keys[currentTrackIndex]].id;
    playSong(previousTrackId);
}

// 更新进度条和时间显示
function updateProgress() {
    const audioPlayer = document.getElementById("audioPlayer");
    const progressRange = document.getElementById("progressRange");
    const currentTimeElement = document.getElementById("currentTime");
    const totalTimeElement = document.getElementById("totalTime");

    progressRange.value = 0;
    currentTimeElement.textContent = "0:00";
    totalTimeElement.textContent = formatTime(audioPlayer.duration);

    audioPlayer.addEventListener("timeupdate", () => {
        const currentTime = audioPlayer.currentTime;
        const duration = audioPlayer.duration;
        if (isFinite(duration)) {
            const progress = (currentTime / duration) * 100;
            progressRange.value = progress;

            currentTimeElement.textContent = formatTime(currentTime);
            totalTimeElement.textContent = formatTime(duration);
        }
    });

    audioPlayer.addEventListener("ended", () => {
        progressRange.value = 0;
        currentTimeElement.textContent = "0:00";
        playButton.textContent = "播放";
        playNextSong(); // 自动播放下一首
    });
}

// 格式化时间
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
}

document.addEventListener("DOMContentLoaded", () => {
    fetchBanners();
    fetchRecommendPlaylists();

    const sidebarToggle = document.querySelector(".sidebar-toggle");
    const sidebar = document.querySelector(".sidebar");

    if (sidebarToggle) {
        sidebarToggle.addEventListener("click", () => {
            sidebar.classList.toggle("collapsed");
        });
    }

    const audioPlayer = document.getElementById("audioPlayer");
    const playButton = document.querySelector(".play-button");
    const nextButton = document.querySelector(".next-button");
    const prevButton = document.querySelector(".prev-button");
    const progressRange = document.getElementById("progressRange");
    const currentTimeElement = document.getElementById("currentTime");
    const totalTimeElement = document.getElementById("totalTime");
    const volumeRange = document.getElementById("volumeRange");

    if (playButton) {
        playButton.addEventListener("click", () => {
            if (audioPlayer.paused) {
                audioPlayer.play();
                playButton.textContent = "暂停";
            } else {
                audioPlayer.pause();
                playButton.textContent = "播放";
            }
        });
    }

    if (nextButton) {
        nextButton.addEventListener("click", playNextSong);
    }

    if (prevButton) {
        prevButton.addEventListener("click", playPreviousSong);
    }

    if (audioPlayer) {
        audioPlayer.addEventListener("timeupdate", () => {
            const currentTime = audioPlayer.currentTime;
            const duration = audioPlayer.duration;
            if (isFinite(duration)) {
                const progress = (currentTime / duration) * 100;
                progressRange.value = progress;

                currentTimeElement.textContent = formatTime(currentTime);
                totalTimeElement.textContent = formatTime(duration);
            }
        });

        audioPlayer.addEventListener("ended", () => {
            progressRange.value = 0;
            currentTimeElement.textContent = "0:00";
            playButton.textContent = "播放";
            playNextSong(); // 自动播放下一首
        });
    }

    if (progressRange) {
        progressRange.addEventListener("input", () => {
            const duration = audioPlayer.duration;
            if (isFinite(duration)) {
                const newTime = (progressRange.value / 100) * duration;
                if (isFinite(newTime)) {
                    audioPlayer.currentTime = newTime;
                }
            }
        });
    }

    if (volumeRange) {
        volumeRange.addEventListener("input", () => {
            audioPlayer.volume = volumeRange.value / 100;
        });
    }
});