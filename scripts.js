// 基础API地址
const API_BASE_URL = "http://localhost:3000"; 

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

    let currentIndex = 0;
    banners.forEach((banner, index) => {
        const carouselItem = document.createElement("div");
        carouselItem.className = `carousel-item ${index === 0 ? "active" : ""}`;
        carouselItem.innerHTML = `
            <img src="${banner.imageUrl}" alt="轮播图">
        `;
        carouselContainer.appendChild(carouselItem);

        const indicator = document.createElement("span");
        indicator.className = `indicator ${index === 0 ? "active" : ""}`;
        indicator.dataset.index = index;
        carouselIndicators.appendChild(indicator);
    });

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

    // 添加轮播图切换逻辑
    carouselIndicators.addEventListener("click", (event) => {
        if (event.target.classList.contains("indicator")) {
            const newIndex = parseInt(event.target.dataset.index);
            showBanner(newIndex);
        }
    });

    // 自动轮播
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

        // 添加点击事件，跳转到歌单详情
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
        renderPlaylistDetails(data.playlist);
        document.getElementById("playlist-details").scrollIntoView({ behavior: "smooth" });
    } catch (error) {
        console.error("获取歌单详情失败:", error);
    }
}

// 渲染歌单详情
function renderPlaylistDetails(playlist) {
    const playlistName = document.getElementById("playlist-name");
    const playlistDescription = document.getElementById("playlist-description");
    const playlistTracks = document.getElementById("playlist-tracks");

    playlistName.textContent = playlist.name;
    playlistDescription.textContent = playlist.description;

    playlistTracks.innerHTML = "";
    playlist.tracks.forEach(track => {
        const trackItem = document.createElement("div");
        trackItem.className = "track-item";
        const artistsNames = track.artists && track.artists.map(artist => artist.name).join(", ");
        trackItem.innerHTML = `
            <span>${track.no}</span>
            <div class="track-info">
                <h3>${track.name}</h3>
                <p>${artistsNames || "未知艺术家"} - ${track.album && track.album.name || "未知专辑"}</p>
            </div>
        `;
        playlistTracks.appendChild(trackItem);

        // 添加点击事件，播放歌曲
        trackItem.addEventListener("click", () => {
            playSong(track.id);
        });
    });
}

// 播放歌曲
async function playSong(songId) {
    try {
        const response = await fetch(`${API_BASE_URL}/song/url?id=${songId}`);
        const data = await response.json();
        const songUrl = data.data[0].url;

        const audioPlayer = document.getElementById("audioPlayer");
        audioPlayer.src = songUrl;
        audioPlayer.play();

        updateProgress();
    } catch (error) {
        console.error("获取歌曲URL失败:", error);
    }
}

// 更新进度条
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
        const progress = (currentTime / duration) * 100;
        progressRange.value = progress;

        currentTimeElement.textContent = formatTime(currentTime);
        totalTimeElement.textContent = formatTime(duration);
    });

    audioPlayer.addEventListener("ended", () => {
        progressRange.value = 0;
        currentTimeElement.textContent = "0:00";
    });
}

// 格式化时间为 mm:ss
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? "0" + secs : secs}`;
}

// 初始化页面
document.addEventListener("DOMContentLoaded", () => {
    fetchBanners();
    fetchRecommendPlaylists();
});