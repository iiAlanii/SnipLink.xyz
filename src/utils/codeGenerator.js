async function generateShortCode(isUnique) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let shortCode;
    do {
        shortCode = '';
        for (let i = 0; i < 6; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            shortCode += characters.charAt(randomIndex);
        }
    } while (!await isUnique(shortCode));
    return shortCode;
}

module.exports = { generateShortCode };