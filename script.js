const API_BASE = 'https://vidsrcme.ru/api';
let selectedMovie = null;
let allMovies = [];
let allSeries = [];
let currentTab = 'movies';

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearBtn');
    const modal = document.getElementById('movieModal');
    const closeBtn = document.querySelector('.modal-close');
    const watchBtn = document.getElementById('watchBtn');
    const tabBtns = document.querySelectorAll('.tab-btn');

    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentTab = e.target.dataset.tab;
            tabBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            loadContent();
        });
    });

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

    loadAllContent();
});

async function loadAllContent() {
    try {
        const response = await fetch('movies.json');
        const data = await response.json();
        allMovies = data.movies || [];
        allSeries = data.series || [];
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
    if (currentTab === 'movies') {
        displayMovies(allMovies);
    } else {
        displaySeries(allSeries);
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
        const featured = movies[0];
        const heroTitle = document.getElementById('heroTitle');
        const heroDesc = document.getElementById('heroDescription');
        const heroImg = document.getElementById('heroImage');
        const heroYear = document.getElementById('heroYear');
        const heroRating = document.getElementById('heroRating');
        
        if (heroTitle) heroTitle.textContent = featured.title;
        if (heroDesc) heroDesc.textContent = featured.description || '';
        if (heroYear) heroYear.textContent = featured.year || 'N/A';
        if (heroRating) heroRating.textContent = '★ ' + (featured.rating || 'N/A');
        if (heroImg) heroImg.src = featured.imagebanner || featured.imageurl || 'https://via.placeholder.com/1280x720?text=' + encodeURIComponent(featured.title);
        if (heroPlayBtn) {
            heroPlayBtn.onclick = () => openMovieModal(featured.id, featured.title, featured.description, featured.year, featured.rating, featured.link, featured.imageurl);
        }
        if (heroSection) {
            heroSection.style.display = 'block';
        }
    }

    if (sectionTitle) {
        sectionTitle.textContent = 'Popular Movies';
    }

    moviesGrid.innerHTML = movies.map(movie => `
        <div class="movie-card" onclick="openMovieModal(${movie.id}, '${movie.title.replace(/'/g, "\\'")}', '${(movie.description || '').replace(/'/g, "\\'")}', ${movie.year || 0}, ${movie.rating || 0}, '${movie.link || ''}', '${movie.imageurl || ''}')">
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
        const featured = series[0];
        const heroTitle = document.getElementById('heroTitle');
        const heroDesc = document.getElementById('heroDescription');
        const heroImg = document.getElementById('heroImage');
        const heroYear = document.getElementById('heroYear');
        const heroRating = document.getElementById('heroRating');
        
        if (heroTitle) heroTitle.textContent = featured.title;
        if (heroDesc) heroDesc.textContent = featured.description || '';
        if (heroYear) heroYear.textContent = featured.year || 'N/A';
        if (heroRating) heroRating.textContent = '★ ' + (featured.rating || 'N/A');
        if (heroImg) heroImg.src = featured.imagebanner || featured.imageurl || 'https://via.placeholder.com/1280x720?text=' + encodeURIComponent(featured.title);
        if (heroPlayBtn) {
            heroPlayBtn.onclick = () => openMovieModal(featured.id, featured.title, featured.description, featured.year, featured.rating, featured.link, featured.imageurl, featured.seasons, featured.episodes);
        }
        if (heroSection) {
            heroSection.style.display = 'block';
        }
    }

    if (sectionTitle) {
        sectionTitle.textContent = 'Popular Series';
    }

    moviesGrid.innerHTML = series.map(show => `
        <div class="movie-card" onclick="openMovieModal(${show.id}, '${show.title.replace(/'/g, "\\'")}', '${(show.description || '').replace(/'/g, "\\'")}', ${show.year || 0}, ${show.rating || 0}, '${show.link || ''}', '${show.imageurl || ''}', ${show.seasons || 0}, ${show.episodes || 0})">
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

function searchContent() {
    const searchInput = document.getElementById('searchInput');
    const sectionTitle = document.getElementById('sectionTitle');
    
    const query = searchInput.value.trim().toLowerCase();
    if (!query) {
        loadContent();
        return;
    }

    let results = [];
    if (currentTab === 'movies') {
        results = allMovies.filter(movie =>
            movie.title.toLowerCase().includes(query) ||
            (movie.description && movie.description.toLowerCase().includes(query))
        );
    } else {
        results = allSeries.filter(show =>
            show.title.toLowerCase().includes(query) ||
            (show.description && show.description.toLowerCase().includes(query))
        );
    }

    if (sectionTitle) {
        sectionTitle.textContent = `Search Results for "${searchInput.value}"`;
    }
    
    if (currentTab === 'movies') {
        displayMovies(results);
    } else {
        displaySeries(results);
    }
}

function openMovieModal(id, title, description, year, rating, link, imageurl, seasons = 0, episodes = 0) {
    selectedMovie = { id, title, description, year, rating: rating || 0, link, imageurl };
    const modal = document.getElementById('movieModal');

    document.getElementById('modalTitle').textContent = title;
    
    let fullDescription = description || 'No description available';
    if (seasons > 0) {
        fullDescription += `\n\n${seasons} Seasons • ${episodes} Episodes`;
    }
    document.getElementById('modalDescription').textContent = fullDescription;
    
    const yearSpan = document.querySelector('#modalYear span');
    if (yearSpan) yearSpan.textContent = year || 'N/A';
    
    const ratingSpan = document.querySelector('#modalRating span');
    if (ratingSpan) ratingSpan.textContent = rating ? `${rating}/10` : 'N/A';
    
    document.getElementById('modalPoster').src = imageurl || `https://via.placeholder.com/200x300?text=${encodeURIComponent(title)}`;
    document.getElementById('playerContainer').style.display = 'none';

    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal() {
    const modal = document.getElementById('movieModal');
    if (modal) {
        modal.classList.remove('active');
    }
    document.getElementById('playerContainer').style.display = 'none';
    selectedMovie = null;
}

function playMovie() {
    if (!selectedMovie) return;

    try {
        const embedUrl = selectedMovie.link;
        if (!embedUrl) {
            alert('Embed link not available for this movie.');
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
