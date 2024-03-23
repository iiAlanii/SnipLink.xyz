function onRecaptchaLoad() {
    const recaptchaElement = document.getElementById('recaptcha');
    if (recaptchaElement && recaptchaElement.innerHTML.trim() === '') {
        grecaptcha.render('recaptcha', {
            sitekey: captchaSiteKey,
            size: 'visible',
            callback: (recaptchaToken) => {
                window.recaptchaToken = recaptchaToken;
            }
        });
    }
}

window.onload = onRecaptchaLoad;

function validateCaptchaAndLogin() {
    if (window.recaptchaToken) {
        openDiscordPopup(window.recaptchaToken);
        document.getElementById('captcha-error').style.display = 'none';
    } else {
        document.getElementById('captcha-error').style.display = 'block';
    }
}

function openDiscordPopup(recaptchaToken) {
    const redirectUrl = sessionStorage.getItem('redirectUrl');
    const maxPopupWidth = window.innerWidth / 2;
    const maxPopupHeight = window.innerHeight;
    const popupWidth = Math.min(maxPopupWidth, 450);
    const popupHeight = maxPopupHeight;
    const popupLeft = 0;
    const popupTop = 0;

    const discordPopup = window.open(`/auth/discord?recaptchaToken=${recaptchaToken}`, 'discordPopup', `width=${popupWidth},height=${popupHeight},left=${popupLeft},top=${popupTop}`);

    document.querySelector('.discord-button').innerText = 'Logging In...';

    const checkClosed = setInterval(() => {
        if (discordPopup.closed) {
            clearInterval(checkClosed);
            if (redirectUrl) {
                sessionStorage.removeItem('redirectUrl');
                window.location.href = redirectUrl;
            } else {
                window.location.href = '/dashboard';
            }
        }
    }, 1000);
}