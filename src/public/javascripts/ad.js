const countdownTimer = document.getElementById('countdown-timer');
const skipButton = document.getElementById('skip-button');
const tokenInput = document.getElementById('token');
let remainingTime = 5;

function updateTimer() {
    countdownTimer.textContent = remainingTime;
    remainingTime--;
}

const countdownInterval = setInterval(() => {
    if (remainingTime > 0) {
        updateTimer();
    } else {
        clearInterval(countdownInterval);
        countdownTimer.style.display = 'none';
        skipButton.style.display = 'block';
    }
}, 1000);

skipButton.addEventListener('click', () => {
    const token = tokenInput.value;
    const originalUrl = tokenInput.dataset.originalUrl;

    fetch('/validateToken', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.valid) {
                window.location.href = originalUrl;
            } else {
                console.error('Invalid token');
            }
        })
        .catch(error => {
            console.error('Error validating token:', error);
        });
});

