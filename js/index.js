document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    activateSearchTab();
    fetchAndDisplayAlbums();
});

function setupEventListeners() {
    const searchForm = document.getElementById('search-form');
    searchForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const query = document.getElementById('query').value.trim();
        fetchAndDisplayAlbums(query);
    });

    document.getElementById('search-button').addEventListener('click', activateSearchTab);
    document.getElementById('favorites-button').addEventListener('click', activateFavoritesTab);
}

function activateSearchTab() {
    document.getElementById('search-button').classList.add('active');
    document.getElementById('favorites-button').classList.remove('active');
    document.getElementById('search-tab').classList.remove('d-none');
    document.getElementById('favorites-tab').classList.add('d-none');
}

function activateFavoritesTab() {
    document.getElementById('search-button').classList.remove('active');
    document.getElementById('favorites-button').classList.add('active');
    document.getElementById('search-tab').classList.add('d-none');
    document.getElementById('favorites-tab').classList.remove('d-none');
    fetchFavorites();
}

async function fetchAlbums() {
    try {
        const response = await fetch('https://661c4d0fe7b95ad7fa6a1bf6.mockapi.io/api/config/albums');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch albums:", error);
        displayMessage('Failed to load albums. Please try again later.', 'danger');
        return [];
    }
}

async function fetchFavorites() {
    try {
        const response = await fetch('https://661c4d0fe7b95ad7fa6a1bf6.mockapi.io/api/config/favorites');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const favorites = await response.json();
        displayAlbums(favorites, document.getElementById('favorites'), true);
    } catch (error) {
        console.error("Failed to fetch favorites:", error);
        displayMessage('Failed to load favorites. Please try again later.', 'danger');
    }
}

async function fetchAndDisplayAlbums(query) {
    const albums = await fetchAlbums();
    const filteredAlbums = query ? albums.filter(album =>
        album.artistName.toLowerCase().includes(query.toLowerCase()) ||
        album.albumName.toLowerCase().includes(query.toLowerCase())
    ) : albums;
    displayAlbums(filteredAlbums, document.getElementById('search-results'), false);
}

function displayAlbums(albums, listElement, isFavorite) {
    listElement.innerHTML = '';
    if (albums.length === 0) {
        listElement.innerHTML = '<li class="list-group-item">No albums found.</li>';
        return;
    }
    albums.forEach(album => {
        const listItem = document.createElement('li');
        listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start');
        listItem.innerHTML = `
            <div class="ms-2 me-auto">
                <div class="fw-bold">${album.albumName} <span class="badge bg-primary rounded-pill">${album.averageRating}</span></div>
                ${album.artistName}
            </div>
            <button type="button" class="btn btn-${isFavorite ? 'danger' : 'success'}">
                ${isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
            </button>
        `;
        const btn = listItem.querySelector('button');
        btn.addEventListener('click', () => {
            if (isFavorite) {
                removeFromFavorites(album);
            } else {
                addToFavorites(album);
            }
        });
        listElement.appendChild(listItem);
    });
}

async function addToFavorites(album) {
    try {
        const response = await fetch('https://661c4d0fe7b95ad7fa6a1bf6.mockapi.io/api/config/favorites');
        const currentFavorites = await response.json();

        if (currentFavorites.some(fav => fav.uid === album.uid)) {
            displayMessage('Album already in favorites', 'warning');
            return;
        }

        const addResponse = await fetch('https://661c4d0fe7b95ad7fa6a1bf6.mockapi.io/api/config/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(album)
        });

        if (addResponse.ok) {
            displayMessage('Album successfully added to favorites', 'success');
            fetchFavorites();
        } else {
            throw new Error(`Failed to add album, status: ${addResponse.status}`);
        }
    } catch (error) {
        console.error('Error in adding to favorites:', error);
        displayMessage('Failed to add to favorites. Please try again.', 'danger');
    }
}

async function removeFromFavorites(album, listItem) {
    try {
        const response = await fetch(`https://661c4d0fe7b95ad7fa6a1bf6.mockapi.io/api/config/favorites/${album.id}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            listItem.remove();  // Immediately remove the item from the DOM
            displayMessage('Album removed from favorites', 'success');
        } else {
            throw new Error('Failed to remove album from favorites');
        }
    } catch (error) {
        console.error('Failed to remove album from favorites:', error);
        displayMessage('Failed to remove from favorites. Please try again.', 'danger');
    }
}


function displayMessage(message, type) {
    const messageElement = document.getElementById('message-area');
    messageElement.textContent = message;
    messageElement.className = `alert alert-${type}`;
    messageElement.style.display = 'block';
    
    setTimeout(() => {
        messageElement.style.display = 'none';
    }, 2000);
}
