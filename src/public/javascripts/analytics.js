function formatDate(unixTimestamp) {
    const date = new Date(unixTimestamp * 1000);
    const options = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
}

const creationDateElement = document.getElementById('creationDate');
if (creationDateElement) {
    const creationUnixTimestamp = creationDateElement.getAttribute('data-unix-timestamp');
    creationDateElement.textContent = formatDate(creationUnixTimestamp);
}

const expiryDateElement = document.getElementById('expiryDate');
if (expiryDateElement) {
    const expiryUnixTimestamp = expiryDateElement.getAttribute('data-unix-timestamp');
    expiryDateElement.textContent = formatDate(expiryUnixTimestamp);
}