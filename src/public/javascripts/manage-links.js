document.addEventListener('DOMContentLoaded', () => {
    const editButtons = document.querySelectorAll('.edit-button');

    editButtons.forEach(button => {
        button.addEventListener('click', () => {
            const shortenedUrl = button.getAttribute('data-id');
            window.location.href = `/edit/${shortenedUrl}`;
        });
    });

    const deleteButtons = document.querySelectorAll('.delete-button');
    const analyticsButtons = document.querySelectorAll('.analytics-button');

    deleteButtons.forEach(button => {
        button.addEventListener('click', () => {

        });
    });

    analyticsButtons.forEach(button => {
        button.addEventListener('click', () => {
            const shortenedUrl = button.getAttribute('data-id');
            window.location.href = `/analytics/${shortenedUrl}`;
        });
    });

    deleteButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const linkIdToDelete = button.getAttribute('data-id');
            const authKeyResponse = await fetch('/generateAuthKey');
            const authKeyData = await authKeyResponse.json();
            const authKey = authKeyData.authKey;

            try {
                const response = await fetch(`/delete-link/${linkIdToDelete}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-key': authKey,
                    },
                });

                if (response.ok) {
                    const result = await response.json();

                    if (result.message === 'Link deleted successfully') {
                        button.parentElement.parentElement.remove();

                        const linkList = document.getElementById('link-list');
                        if (linkList.children.length === 0) {
                            linkList.innerHTML = '<li>No links to display.</li>';
                            linkList.innerHTML += '<li><a href="/shortener" class="cta-button">Create a new link here</a></li>';
                        }
                    } else {
                        console.error('Error deleting link:', result.message);
                        alert('Failed to delete the link. Please try again later.');
                    }
                } else {
                    console.error('Error deleting link:', response.statusText);
                    alert('Failed to delete the link. Please try again later.');
                }
            } catch (error) {
                console.error('Error deleting link:', error);
                alert('An error occurred while deleting the link. Please try again later.');
            }
        });
    });

    const copyButtons = document.querySelectorAll('.copy-button');

    copyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const textToCopy = 'https://sniplink.xyz/' + button.getAttribute('data-clipboard-text');
            navigator.clipboard.writeText(textToCopy)
                .then(() => {
                    button.textContent = 'Copied!';
                    setTimeout(() => {
                        button.textContent = 'Copy Link';
                    }, 3000);
                })
                .catch(err => {
                    console.error('Could not copy text: ', err);
                });
        });
    });
});