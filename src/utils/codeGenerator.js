async function generateShortCode(isUnique, length = 6) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let shortCode = '';
    do {
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            shortCode += characters.charAt(randomIndex);
        }
    } while (!await isUnique(shortCode));
    return shortCode;
}

module.exports = { generateShortCode };