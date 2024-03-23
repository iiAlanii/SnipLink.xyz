window.addEventListener('load', () => {
    setTimeout(() => {
        const preloader = document.querySelector('.preloader');

        preloader.classList.add('hidden');

        setTimeout(() => {
            preloader.style.display = 'none';
        }, 500);
    }, 1200);
});