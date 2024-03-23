let currentPage = 1;
const resultsPerPage = 5;
let currentResults = [];

async function updateSearchResults(results) {

    currentResults = results;

    const startIndex = (currentPage - 1) * resultsPerPage;
    const endIndex = startIndex + resultsPerPage;

    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '';

    if (results.length === 0) {
        searchResults.innerHTML = '<p>No results found</p>';
        return;
    }

    const ul = document.createElement('ul');
    ul.classList.add('section-content');

    for (let i = startIndex; i < endIndex && i < results.length; i++) {
        const result = results[i];

        const resultContainer = document.createElement('div');
        resultContainer.classList.add('result-container');

        const profilePicture = document.createElement('img');
        profilePicture.src = result.discordUserProfilePictureUrl;
        profilePicture.alt = 'Discord Profile Picture';

        const resultData = document.createElement('div');
        resultData.classList.add('result-data');

        resultData.innerHTML = `
   <a href="${result.longUrl}" target="_blank">${result.shortenedUrl}</a><br>
   Discord Username: ${result.discordUsername}<br>
   Discord ID: ${result.discordId}<br>
   Email: ${result.discordEmail}<br>
   Date Created: ${new Date(result.dateCreated).toLocaleDateString()}<br>
   Clicks: ${result.clicks.length}<br>
`;

async function fetchClickDetails(clickId) {
    try {
        const authKeyResponse = await fetch('/generateAuthKey');
        const authKeyData = await authKeyResponse.json();
        const authKey = authKeyData.authKey;

        const response = await fetch(`/admin/click-details/${clickId}`, {
            method: 'GET',
            headers: {
                'x-auth-key': authKey,
            },
        });
        return await response.json();
    } catch (error) {
        console.error('Error fetching click details:', error);
        throw error;
    }
}

if (result.clicks.length > 0) {
    const clickId = result.clicks[0];
    const clickDetails = await fetchClickDetails(clickId);

    resultData.innerHTML += `
      IP: ${clickDetails.ip || 'N/A'}<br>
      Referrer: ${clickDetails.referrer || 'N/A'}<br>
      User Agent: ${clickDetails.userAgent || 'N/A'}<br>
    `;
}

        const deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => {
            deleteLink(result._id);
        });

        const manageUserButton = document.createElement('button');
        manageUserButton.classList.add('manage-user-button');
        manageUserButton.textContent = 'Manage User';

        const userManagementUrl = `/admin/user-management/${result.discordId}`;

        manageUserButton.addEventListener('click', async () => {
            try {
                const authKeyResponse = await fetch('/generateAuthKey');
                const authKeyData = await authKeyResponse.json();
                const authKey = authKeyData.authKey;


                const userDetailsResponse = await fetch(userManagementUrl, {
                    method: 'GET',
                    headers: {
                        'x-auth-key': authKey,
                    },
                });


                if (userDetailsResponse.ok) {
                    window.location.href = userManagementUrl;
                } else {
                    console.error('Error fetching user details:', userDetailsResponse.statusText);
                }
            } catch (error) {
                console.error('Error fetching user details:', error);
            }
        });

        resultData.appendChild(manageUserButton);
        resultData.appendChild(deleteButton);
        resultData.appendChild(manageUserButton);

        resultContainer.appendChild(profilePicture);
        resultContainer.appendChild(resultData);

        ul.appendChild(resultContainer);
    }

    searchResults.appendChild(ul);

    const pageInfo = document.getElementById('pageInfo');
    pageInfo.textContent = `Page ${currentPage} of ${Math.ceil(results.length / resultsPerPage)}`;

    const totalResults = document.getElementById('totalResults');
    totalResults.textContent = `Total Results: ${results.length}`;

    const prevPageButton = document.getElementById('prevPage');
    const nextPageButton = document.getElementById('nextPage');
    prevPageButton.disabled = currentPage === 1;
    nextPageButton.disabled = currentPage === Math.ceil(results.length / resultsPerPage);
}

$('#nextPage').click(() => {
    if (currentPage < Math.ceil(currentResults.length / resultsPerPage)) {
        currentPage++;
        updateSearchResults(currentResults);
    }
});

$('#prevPage').click(() => {
    if (currentPage > 1) {
        currentPage--;
        updateSearchResults(currentResults);
    }
});

$('#searchButton').click(async () => {
    const searchInput = $('#searchInput').val();

    try {
        const authKeyResponse = await fetch('/generateAuthKey');
        const authKeyData = await authKeyResponse.json();
        const authKey = authKeyData.authKey;

        const response = await $.ajax({
            type: 'POST',
            url: '/admin/search',
            data: JSON.stringify({ searchQuery: searchInput }),
            contentType: 'application/json',
            headers: {
                'x-auth-key': authKey,
            },
        });

        if (response.links.length > 0) {
            await updateSearchResults(response.links);
        } else {
            await updateSearchResults([]);
        }
    } catch (error) {
        console.error('Error searching for links:', error);
    }
});

$(document).on('click', '.delete-button', async () => {
    try {
        const authKeyResponse = await fetch('/generateAuthKey');
        const authKeyData = await authKeyResponse.json();
        const authKey = authKeyData.authKey;

        const response = await $.ajax({
            type: 'DELETE',
            url: `/admin/deleteLink/${linkId}`,
            headers: {
                'x-auth-key': authKey,
            },
        });

    } catch (error) {
        console.error('Error deleting link:', error);
    }
});

function deleteLink(linkId) {
    console.log('Deleting link with ID:', linkId);
}