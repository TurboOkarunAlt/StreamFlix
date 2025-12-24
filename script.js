const API_BASE = 'https://vidsrcme.ru/api';
let selectedMovie = null;
let allMovies = [];
let allSeries = [];
let favorites = [];
let currentTab = 'movies';
let filteredContent = [];
let selectedEpisode = null;
let heroCarouselIndex = 0;
let heroCarouselData = [];
let heroCarouselInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearBtn');
    const modal = document.getElementById('movieModal');
    const closeBtn = document.querySelector('.modal-close');
    const watchBtn = document.getElementById('watchBtn');
    const addToFavBtn = document.getElementById('addToFavBtn');
    const genreFilter = document.getElementById('genreFilter');
    const tabBtns = document.querySelectorAll('.tab-btn');

    loadFavoritesFromStorage();

    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentTab = e.target.dataset.tab;
            tabBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            loadContent();
        });
    });

    if (genreFilter) {
        genreFilter.addEventListener('change', () => {
            searchContent();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchContent();
        });

        searchInput.addEventListener('input', () => {
            clearBtn.style.display = searchInput.value ? 'block' : 'none';
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            loadContent();
            searchInput.focus();
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    if (watchBtn) {
        watchBtn.addEventListener('click', playMovie);
    }

    if (addToFavBtn) {
        addToFavBtn.addEventListener('click', toggleFavorite);
    }

    loadAllContent();
});

function loadFavoritesFromStorage() {
    const stored = localStorage.getItem('streamflix_favorites');
    favorites = stored ? JSON.parse(stored) : [];
}

function saveFavoritesToStorage() {
    localStorage.setItem('streamflix_favorites', JSON.stringify(favorites));
}

function isFavorite(id) {
    return favorites.some(fav => fav.id === id);
}

function toggleFavorite() {
    if (!selectedMovie) return;
    
    const index = favorites.findIndex(fav => fav.id === selectedMovie.id);
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push(selectedMovie);
    }
    
    saveFavoritesToStorage();
    updateFavBtn();
    displayFavorites();
}

function updateFavBtn() {
    const favBtn = document.getElementById('addToFavBtn');
    if (!favBtn || !selectedMovie) return;
    
    if (isFavorite(selectedMovie.id)) {
        favBtn.classList.add('active');
        favBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 10.26 24 10.27 17.82 16.15 20.91 24.46 12 18.59 3.09 24.46 6.18 16.15 0 10.27 8.91 10.26 12 2"></polygon></svg>Saved';
    } else {
        favBtn.classList.remove('active');
        favBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 10.26 24 10.27 17.82 16.15 20.91 24.46 12 18.59 3.09 24.46 6.18 16.15 0 10.27 8.91 10.26 12 2"></polygon></svg>Add to List';
    }
}

async function loadAllContent() {
    try {
        const [moviesResponse, seriesResponse] = await Promise.all([
            fetch('movies.json'),
            fetch('series.json')
        ]);
        allMovies = await moviesResponse.json();
        allSeries = await seriesResponse.json();
        loadContent();
    } catch (error) {
        console.error('Error loading content:', error);
        const moviesGrid = document.getElementById('moviesGrid');
        if (moviesGrid) {
            moviesGrid.innerHTML = '<div class="loading">Error loading content. Please refresh the page.</div>';
        }
    }
}

function loadContent() {
    const genreFilter = document.getElementById('genreFilter');
    const searchInput = document.getElementById('searchInput');
    const genre = genreFilter ? genreFilter.value : '';
    const search = searchInput ? searchInput.value.toLowerCase() : '';
    
    if (currentTab === 'movies') {
        let content = allMovies;
        if (search) {
            content = content.filter(m => 
                m.title.toLowerCase().includes(search) ||
                (m.description && m.description.toLowerCase().includes(search))
            );
        }
        if (genre) {
            content = content.filter(m => m.genre && m.genre.includes(genre));
        }
        filteredContent = content;
        displayMovies(content);
    } else if (currentTab === 'series') {
        let content = allSeries;
        if (search) {
            content = content.filter(s => 
                s.title.toLowerCase().includes(search) ||
                (s.description && s.description.toLowerCase().includes(search))
            );
        }
        if (genre) {
            content = content.filter(s => s.genre && s.genre.includes(genre));
        }
        filteredContent = content;
        displaySeries(content);
    } else if (currentTab === 'favorites') {
        displayFavorites();
    }
}

async function loadPopularMovies() {
    loadAllContent();
}

function displayMovies(movies) {
    const moviesGrid = document.getElementById('moviesGrid');
    const sectionTitle = document.getElementById('sectionTitle');
    const heroSection = document.getElementById('heroSection');
    const heroPlayBtn = document.getElementById('heroPlayBtn');

    if (!moviesGrid) return;

    if (!movies || movies.length === 0) {
        moviesGrid.innerHTML = '<div class="loading">No movies found</div>';
        return;
    }

    if (movies.length > 0) {
        heroCarouselData = movies;
        heroCarouselIndex = 0;
        startHeroCarousel();
        if (heroSection) {
            heroSection.style.display = 'block';
        }
    }

    if (sectionTitle) {
        sectionTitle.textContent = 'Popular Movies';
    }

    moviesGrid.innerHTML = movies.map(movie => `
        <div class="movie-card" onclick="openMovieModal(${movie.id}, '${movie.title.replace(/'/g, "\\'")}', '${(movie.description || '').replace(/'/g, "\\'")}', ${movie.year || 0}, ${movie.rating || 0}, '${movie.link || ''}', '${movie.imagebanner || ''}', 0, 0, '${(movie.genre || '').replace(/'/g, "\\'")}')" data-fav="${isFavorite(movie.id) ? 'true' : 'false'}">
            <div class="movie-poster">
                <img src="${movie.imageurl || 'https://via.placeholder.com/300x450?text=' + encodeURIComponent(movie.title)}" alt="${movie.title}">
                <div class="movie-overlay">
                    <div class="movie-overlay-text">Watch Now</div>
                </div>
            </div>
            <div class="movie-info">
                <div class="movie-title">${movie.title}</div>
                <div class="movie-year">${movie.year || 'N/A'}</div>
            </div>
        </div>
    `).join('');
}

function displaySeries(series) {
    const moviesGrid = document.getElementById('moviesGrid');
    const sectionTitle = document.getElementById('sectionTitle');
    const heroSection = document.getElementById('heroSection');
    const heroPlayBtn = document.getElementById('heroPlayBtn');

    if (!moviesGrid) return;

    if (!series || series.length === 0) {
        moviesGrid.innerHTML = '<div class="loading">No series found</div>';
        return;
    }

    if (series.length > 0) {
        heroCarouselData = series;
        heroCarouselIndex = 0;
        startHeroCarousel();
        if (heroSection) {
            heroSection.style.display = 'block';
        }
    }

    if (sectionTitle) {
        sectionTitle.textContent = 'Popular Series';
    }

    moviesGrid.innerHTML = series.map(show => `
        <div class="movie-card" onclick="openMovieModal(${show.id}, '${show.title.replace(/'/g, "\\'")}', '${(show.description || '').replace(/'/g, "\\'")}', ${show.year || 0}, ${show.rating || 0}, '${show.link || ''}', '${show.imagebanner || ''}', ${show.seasons || 0}, ${show.episodes || 0}, '${(show.genre || '').replace(/'/g, "\\'")}')" data-fav="${isFavorite(show.id) ? 'true' : 'false'}">
            <div class="movie-poster">
                <img src="${show.imageurl || 'https://via.placeholder.com/300x450?text=' + encodeURIComponent(show.title)}" alt="${show.title}">
                <div class="movie-overlay">
                    <div class="movie-overlay-text">Watch Now</div>
                </div>
            </div>
            <div class="movie-info">
                <div class="movie-title">${show.title}</div>
                <div class="movie-year">${show.year || 'N/A'}</div>
            </div>
        </div>
    `).join('');
}

function startHeroCarousel() {
    if (heroCarouselInterval) clearInterval(heroCarouselInterval);
    updateHeroContent();
    heroCarouselInterval = setInterval(() => {
        heroCarouselIndex = (heroCarouselIndex + 1) % heroCarouselData.length;
        updateHeroContent();
    }, 6000);
}

function updateHeroContent() {
    if (!heroCarouselData || heroCarouselData.length === 0) return;
    
    const featured = heroCarouselData[heroCarouselIndex];
    const heroTitle = document.getElementById('heroTitle');
    const heroDesc = document.getElementById('heroDescription');
    const heroImg = document.getElementById('heroImage');
    const heroPlayBtn = document.getElementById('heroPlayBtn');
    const heroIndicators = document.getElementById('heroIndicators');

    if (heroTitle) heroTitle.textContent = featured.title;
    if (heroDesc) heroDesc.textContent = featured.description || '';
    if (heroImg) heroImg.src = featured.imagebanner || featured.imageurl || 'https://via.placeholder.com/1280x720?text=' + encodeURIComponent(featured.title);
    if (heroPlayBtn) {
        if (featured.seasons) {
            heroPlayBtn.onclick = () => openMovieModal(featured.id, featured.title, featured.description, featured.year, featured.rating, featured.link, featured.imagebanner, featured.seasons, featured.episodes, featured.genre);
        } else {
            heroPlayBtn.onclick = () => openMovieModal(featured.id, featured.title, featured.description, featured.year, featured.rating, featured.link, featured.imagebanner, 0, 0, featured.genre);
        }
    }

    if (heroIndicators) {
        heroIndicators.innerHTML = heroCarouselData.slice(0, 5).map((_, idx) => `
            <div class="hero-indicator ${idx === heroCarouselIndex ? 'active' : ''}" onclick="heroJumpTo(${idx})"></div>
        `).join('');
    }
}

function heroJumpTo(index) {
    heroCarouselIndex = index;
    updateHeroContent();
    if (heroCarouselInterval) clearInterval(heroCarouselInterval);
    heroCarouselInterval = setInterval(() => {
        heroCarouselIndex = (heroCarouselIndex + 1) % heroCarouselData.length;
        updateHeroContent();
    }, 6000);
}

function displayFavorites() {
    const favSection = document.getElementById('favoritesSection');
    const favGrid = document.getElementById('favoritesGrid');
    const moviesGrid = document.getElementById('moviesGrid');

    if (currentTab !== 'favorites') return;

    if (favSection) favSection.style.display = 'block';
    if (moviesGrid) moviesGrid.style.display = 'none';

    if (!favGrid) return;

    if (favorites.length === 0) {
        favGrid.innerHTML = '<div class="empty-message" style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: rgba(255,255,255,0.5);">No favorites yet. Add your favorites to see them here!</div>';
        return;
    }

    favGrid.innerHTML = favorites.map(item => {
        const seasons = item.seasons ? `${item.seasons} Seasons • ${item.episodes} Episodes` : '';
        return `
            <div class="movie-card" onclick="openMovieModal(${item.id}, '${item.title.replace(/'/g, "\\'")}', '${(item.description || '').replace(/'/g, "\\'")}', ${item.year || 0}, ${item.rating || 0}, '${item.link || ''}', '${item.imagebanner || ''}', ${item.seasons || 0}, ${item.episodes || 0}, '${(item.genre || '').replace(/'/g, "\\'")}')" data-fav="true">
                <div class="movie-poster">
                    <img src="${item.imageurl || 'https://via.placeholder.com/300x450?text=' + encodeURIComponent(item.title)}" alt="${item.title}">
                    <div class="movie-overlay">
                        <div class="movie-overlay-text">Watch Now</div>
                    </div>
                </div>
                <div class="movie-info">
                    <div class="movie-title">${item.title}</div>
                    <div class="movie-year">${item.year || 'N/A'}</div>
                </div>
            </div>
        `;
    }).join('');
}

function searchContent() {
    const searchInput = document.getElementById('searchInput');
    const sectionTitle = document.getElementById('sectionTitle');

    const query = searchInput.value.trim().toLowerCase();
    
    if (currentTab === 'movies' || currentTab === 'series') {
        loadContent();
    }
}

function openMovieModal(id, title, description, year, rating, link, imagebanner, seasons = 0, episodes = 0, genre = '', episodeList = null) {
    // Fetch episodeList from data if not provided
    if (!episodeList) {
        const fromSeries = allSeries.find(s => s.id === id);
        if (fromSeries && fromSeries.episodeList) {
            episodeList = fromSeries.episodeList;
        }
    }
    
    selectedMovie = { id, title, description, year, rating: rating || 0, link, imagebanner, seasons, episodes, genre, episodeList };
    selectedEpisode = null;
    const modal = document.getElementById('movieModal');

    document.getElementById('modalTitle').textContent = title;

    let fullDescription = description || 'No description available';
    if (seasons > 0) {
        fullDescription += `\n\n${seasons} Seasons • ${episodes} Episodes`;
    }
    document.getElementById('modalDescription').textContent = fullDescription;
    
    const genreDiv = document.getElementById('modalGenre');
    if (genreDiv) {
        genreDiv.innerHTML = genre ? `<div class="genre-badge">${genre}</div>` : '';
    }

    const yearSpan = document.querySelector('#modalYear span');
    if (yearSpan) yearSpan.textContent = year || 'N/A';

    const ratingSpan = document.querySelector('#modalRating span');
    if (ratingSpan) ratingSpan.textContent = rating ? `${rating}/10` : 'N/A';

    document.getElementById('modalPoster').src = imagebanner || `https://via.placeholder.com/1280x720?text=${encodeURIComponent(title)}`;
    document.getElementById('playerContainer').style.display = 'none';

    const episodeSelector = document.getElementById('episodeSelector');
    if (seasons > 0 && episodeList && episodeList.length > 0) {
        episodeSelector.style.display = 'block';
        const episodeListDiv = document.getElementById('episodeList');
        episodeListDiv.innerHTML = episodeList.map((ep, idx) => `
            <button class="episode-btn" onclick="selectEpisode(${idx}, '${title.replace(/'/g, "\\'")}', ${id})">
                S${ep.season}E${ep.episode} - ${ep.title}
            </button>
        `).join('');
    } else {
        episodeSelector.style.display = 'none';
    }

    updateFavBtn();

    if (modal) {
        modal.classList.add('active');
    }
}

function selectEpisode(index, title, id) {
    if (!selectedMovie || !selectedMovie.episodeList) return;
    const episode = selectedMovie.episodeList[index];
    selectedEpisode = episode;
    const episodeBtns = document.querySelectorAll('.episode-btn');
    episodeBtns.forEach(btn => btn.classList.remove('active'));
    episodeBtns[index].classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('movieModal');
    if (modal) {
        modal.classList.remove('active');
    }
    const playerContainer = document.getElementById('playerContainer');
    const videoPlayer = document.getElementById('videoPlayer');
    playerContainer.style.display = 'none';
    videoPlayer.src = '';
    selectedMovie = null;
}

function playMovie() {
    if (!selectedMovie) return;

    try {
        let embedUrl = selectedMovie.link;
        if (selectedEpisode) {
            embedUrl = selectedEpisode.link;
        }
        
        if (!embedUrl) {
            alert('Embed link not available for this ' + (selectedEpisode ? 'episode' : 'movie') + '.');
            return;
        }

        const playerContainer = document.getElementById('playerContainer');
        const videoPlayer = document.getElementById('videoPlayer');

        videoPlayer.src = embedUrl;
        playerContainer.style.display = 'block';

        playerContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
        console.error('Error loading player:', error);
        alert('Unable to load video player. Please try again.');
    }
}

window.addEventListener('DOMContentLoaded', loadPopularMovies);
