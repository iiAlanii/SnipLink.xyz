let linksVisible = false;

async function viewLinks(discordId) {
    const linksContainer = document.getElementById('links-container');

    if (linksVisible) {
        linksContainer.style.display = 'none';
        linksVisible = false;
    } else {
        try {
            const authKeyResponse = await fetch('/generateAuthKey');
            const authKeyData = await authKeyResponse.json();
            const authKey = authKeyData.authKey;

            const response = await fetch(`/admin/user-management/${discordId}/links`, {
                headers: {
                    'x-auth-key': authKey,
                },
            });

            const data = await response.json();
            linksContainer.innerHTML = '';
            if (data.length > 0) {
                data.forEach(link => {
                    const linkElement = document.createElement('div');
                    linkElement.innerHTML = `
                        <p><strong>Original URL:</strong> ${link.originalUrl}</p>
                        <p><strong>Shortened URL:</strong> ${link.shortenedUrl}</p>
                        <p><strong>Date Created:</strong> ${new Date(link.dateCreated).toLocaleString()}</p>
                        <hr>
                    `;
                    linksContainer.appendChild(linkElement);
                });
            } else {
                linksContainer.innerHTML = '<p>No links found for this user.</p>';
            }

            linksContainer.style.display = 'block';
            linksVisible = true;
        } catch (error) {
            console.error('Error fetching links:', error);
            alert('Error fetching links. Please try again.' + error);
        }
    }
}
async function exportUserData(discordId) {
    try {
        const authKeyResponse = await fetch('/generateAuthKey');
        const authKeyData = await authKeyResponse.json();
        const authKey = authKeyData.authKey;

        const response = await fetch(`/admin/user-management/${discordId}/export`, {
            headers: {
                'x-auth-key': authKey,
            },
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `user_data_${discordId}.zip`;

            a.click();

            window.URL.revokeObjectURL(url);
        } else {
            console.log(`Failed to export user data: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Error exporting user data:', error);
        alert(`Error exporting user data: ${error.message}`);
    }
}


async function banUser(discordId) {
    const reason = prompt("Enter the reason for the ban:");
    if (reason) {
        const authKeyResponse = await fetch('/generateAuthKey');
        const authKeyData = await authKeyResponse.json();
        const authKey = authKeyData.authKey;

        const ip = "<%= ip %>";
        const userAgent = "<%= userAgent %>"; //This is regarding the banning issue. Fix this as when I ban someone, it bans me directly

        const data = {
            discordId: discordId,
            ip: ip,
            userAgent: userAgent,
            reason: reason,
        };

        try {
            const response = await fetch('/admin/ban', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-key': authKey,
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                alert('User banned successfully.');
            } else {
                alert('Error banning user.');
            }
        } catch (error) {
            console.error('Error banning user:', error);
        }
    }
}

async function deleteUserAccount(discordId) {
    if (confirm('Are you sure you want to delete this user account and their links?')) {
        const authKeyResponse = await fetch('/generateAuthKey');
        const authKeyData = await authKeyResponse.json();
        const authKey = authKeyData.authKey;

        fetch(`/admin/user-management/${discordId}/delete`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-key': authKey,
            },
        })
            .then(response => {
                if (response.ok) {
                    alert('User account and links deleted successfully.');
                } else {
                    console.error('Error deleting user account:', response.statusText);
                    alert('Failed to delete the user account and links. Please try again later.');
                }
            })
            .catch(error => {
                console.error('Error deleting user account:', error);
                alert('An error occurred while deleting the user account and links. Please try again later.');
            });
    }
}