function generatePreviewHtml(title, link, description, image, loadingContent) {
    return `
<!DOCTYPE html>
<html lang="en">
    <head>
        <title>${title}</title>
        <meta name="referrer" content="origin">
        <meta property="og:url" content="${link.shortenedUrl}" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="${title}" />
        <meta property="og:description" content="${description}" />
        <meta property="og:image" content="${image}" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${title}" />
        <meta name="twitter:description" content="${description}" />
        <meta name="twitter:image" content="${image}" />
        <meta name="description" content="${description}" />
        <meta name="author" content="SnipLink.xyz" />
        <script>
            if (window !== window.top) {
                console.log('Embedded page, no redirect');
            }
        </script>
    </head>
    <body>
           ${loadingContent}
    </body>
</html>
`;
}
module.exports = generatePreviewHtml;