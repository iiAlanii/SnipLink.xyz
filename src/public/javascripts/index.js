let isFetching = false;

async function fetchStatistics() {
    if (isFetching) return;
    isFetching = true;

    try {
        const authKeyResponse = await fetch('/generateAuthKey');
        const authKeyData = await authKeyResponse.json();
        const authKey = authKeyData.authKey;

        const response = await fetch('/statistics', {
            headers: {
                'x-auth-key': authKey,
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.totalLinks || !data.totalUsers) {
            throw new Error('No data returned from server');
        }

        // Store the new values in localStorage
        localStorage.setItem('totalLinks', data.totalLinks);
        localStorage.setItem('totalUsers', data.totalUsers);

        animateCount(document.getElementById('total-links-count'), document.getElementById('total-links-count').innerText, data.totalLinks, 2000);
        animateCount(document.getElementById('total-users-count'), document.getElementById('total-users-count').innerText, data.totalUsers, 2000);
    } catch (error) {
        console.error('Error fetching statistics:', error);
    } finally {
        isFetching = false;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the values from localStorage
    document.getElementById('total-links-count').innerText = localStorage.getItem('totalLinks') || '0';
    document.getElementById('total-users-count').innerText = localStorage.getItem('totalUsers') || '0';

    fetchStatistics();
});

function animateCount(element, start, end, duration) {
    let startTime;
    const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = timestamp - startTime;

        element.innerText = Math.ceil(easeInOutQuad(progress, start, end - start, duration));

        if (progress < duration) {
            requestAnimationFrame(animate);
        }
    };

    requestAnimationFrame(animate);
}

function easeInOutQuad(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t + b;
    t--;
    return -c / 2 * (t * (t - 2) - 1) + b;
}