document.addEventListener('DOMContentLoaded', function () {
    const mobileMenuIcon = document.getElementById('mobile-menu-icon');
    const closeMobileMenu = document.getElementById('close-mobile-menu');
    const mobileMenu = document.querySelector('.mobile-menu');
    const desktopViewBreakpoint = 992;

    mobileMenu.style.right = '-250px';

    mobileMenuIcon.addEventListener('click', function () {
        mobileMenu.style.right = '0';
    });

    closeMobileMenu.addEventListener('click', function () {
        mobileMenu.style.right = '-250px';
    });

    function checkScreenWidth() {
        if (window.innerWidth >= desktopViewBreakpoint) {
            mobileMenu.style.right = '-250px';
        }
    }

    checkScreenWidth();
    window.addEventListener('resize', checkScreenWidth);
});