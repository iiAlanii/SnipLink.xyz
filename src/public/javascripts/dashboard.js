const copyButtons = document.querySelectorAll('.copy-button');
copyButtons.forEach((button) => {
    button.addEventListener('click', () => {
        const textToCopy = button.getAttribute('data-clipboard-text');
        const tempTextarea = document.createElement('textarea');
        tempTextarea.value = textToCopy;
        document.body.appendChild(tempTextarea);
        tempTextarea.select();
        document.execCommand('copy');
        document.body.removeChild(tempTextarea);

        button.innerText = 'Link Copied!';
        setTimeout(() => {
            button.innerText = 'Copy Link';
        }, 1000);
    });
});