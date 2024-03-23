document.addEventListener("DOMContentLoaded", function () {
    const linkListContainer = document.querySelector(".link-list");
    const seeMoreButton = document.getElementById("seeMoreButton");

    const defaultVisibleLinks = 3;
    let visibleLinks = defaultVisibleLinks;

    function toggleLinkVisibility() {
        const linkItems = linkListContainer.querySelectorAll(".link-item");
        linkItems.forEach((link, index) => {
            if (index < visibleLinks) {
                link.style.display = "block";
            } else {
                link.style.display = "none";
            }
        });

        if (linkItems.length <= defaultVisibleLinks) {
            seeMoreButton.style.display = "none";
        } else {
            seeMoreButton.style.display = "block";
        }
    }

    toggleLinkVisibility();

    seeMoreButton.addEventListener("click", function () {
        const isExpanded = visibleLinks >= linkListContainer.children.length;
        if (isExpanded) {
            visibleLinks = defaultVisibleLinks;
            seeMoreButton.textContent = "See More";
        } else {
            visibleLinks = linkListContainer.children.length;
            seeMoreButton.textContent = "See Less";
        }
        toggleLinkVisibility();
    });
});

let timeoutId = null;

document.getElementById('customPathInput').addEventListener('keyup', function () {
    this.value = this.value.replace(/ /g, '-');
});
document.getElementById('customPathInput').addEventListener('input', async function () {
    const inputField = this;
    const availabilityStaticText = document.getElementById('availabilityStaticText');
    const availabilityDynamicText = document.getElementById('availabilityDynamicText');
    const availabilitySpinner = document.getElementById('availabilitySpinner');
    const shortenButton = document.querySelector('#shortenForm button');

    if (timeoutId) {
        clearTimeout(timeoutId);
    }

    const customPath = inputField.value.trim();

    if (!customPath) {
        shortenButton.disabled = false;
        shortenButton.style.opacity = 1;
        availabilityStaticText.textContent = '';
        availabilityDynamicText.textContent = '';
        availabilitySpinner.style.display = 'none';
        return;
    }

    shortenButton.disabled = true;
    shortenButton.style.opacity = 0.5;

    timeoutId = setTimeout(async function () {
        availabilityStaticText.textContent = 'Checking if ';
        availabilityDynamicText.textContent = `https://sniplink.xyz/${customPath}`;
        availabilityDynamicText.style.color = 'blue';
        availabilitySpinner.style.display = 'inline-block';

        if (!/^(?![-_])[a-zA-Z0-9\-_]+$/.test(customPath)) {
            availabilityStaticText.textContent = 'Your link can only start with a number or letter and can include numbers, letters, hyphens, and underscores.';
            availabilityDynamicText.textContent = '';
            availabilityDynamicText.style.color = 'red';

            shortenButton.disabled = true;
            shortenButton.style.opacity = 0.5;

            return;
        }

        try {
            const authKeyResponse = await fetch('/generateAuthKey');
            const authKeyData = await authKeyResponse.json();
            const authKey = authKeyData.authKey;
            const encodedCustomPath = encodeURIComponent(customPath);

            const availabilityResponse = await fetch(`/checkAvailability/${encodedCustomPath}`, {
                headers: {
                    'x-auth-key': authKey,
                },
            });
            const data = await availabilityResponse.json();

            if (data.isAvailable) {
                availabilityStaticText.textContent = 'Your link ';
                availabilityDynamicText.textContent = `https://sniplink.xyz/${customPath} is available!`;
                availabilityDynamicText.style.color = 'green';

                shortenButton.disabled = false;
                shortenButton.style.opacity = 1;
            } else {
                availabilityStaticText.textContent = 'Your link ';
                availabilityDynamicText.textContent = `https://sniplink.xyz/${customPath} is not available. ):`;
                availabilityDynamicText.style.color = 'red';

                shortenButton.disabled = true;
                shortenButton.style.opacity = 0.5;
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            availabilitySpinner.style.display = 'none';
        }
    }, 1000);
});

function setFormDisabled(disabled) {
    const formElements = document.querySelectorAll('#shortenForm input, #shortenForm select, #shortenForm button, #shortenForm textarea, #descriptionInput');
    formElements.forEach(element => {
        element.disabled = disabled;
    });
}

window.addEventListener('DOMContentLoaded', () => {
    const shortenForm = document.getElementById('shortenForm');
    const longUrlInput = document.getElementById('longUrlInput');
    const customMetadataAlert = document.getElementById('customMetadataAlert');
    const titleInput = document.getElementById('titleInput');
    const descriptionInput = document.getElementById('descriptionInput');
    const shortenButton = document.querySelector('#shortenForm button');
    const metadataSource = document.getElementById('metadataSource');


    metadataSource.addEventListener('change', checkCustomMetadata);


    titleInput.addEventListener('input', checkCustomMetadata);
    descriptionInput.addEventListener('input', checkCustomMetadata);

    function checkCustomMetadata() {
        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();
        const selectedMetadataSource = metadataSource.value;

        if (selectedMetadataSource === 'custom' && (!title || !description)) {
            customMetadataAlert.textContent = 'Custom title and description are required for custom metadata.';
            customMetadataAlert.style.display = 'block';
            shortenButton.disabled = true;
            shortenButton.style.opacity = 0.5;
        } else {
            customMetadataAlert.style.display = 'none';
            shortenButton.disabled = false;
            shortenButton.style.opacity = 1;
        }
    }

    shortenForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const shortenButton = document.querySelector('#shortenForm button');
        shortenButton.disabled = true;
        shortenButton.style.opacity = 0.5;
        shortenButton.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Working...';
            setFormDisabled(true);

        try {

        const authKeyResponse = await fetch('/generateAuthKey');
        const authKeyData = await authKeyResponse.json();
        const authKey = authKeyData.authKey;

        fetch('/getCaptchaKey', {
            headers: {
                'x-auth-key': authKey,
            }
        })
            .then(response => response.json())
            .then(data => {
                const captchaSiteKey = data.CAPTCHA_SITE_KEY;

                grecaptcha.ready(function () {
                    grecaptcha.execute(captchaSiteKey, {action: 'submit'}).then(function (token) {
                        document.getElementById('g-recaptcha-response').value = token;
                    });
                });
            })
            .catch(error => console.error('Error fetching environment variables:', error));


        const metadataSource = document.getElementById('metadataSource').value;
        const titleInput = document.getElementById('titleInput');
        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();
        const shortenButton = document.querySelector('#shortenForm button');
        const longUrl = longUrlInput.value.trim();

        shortenButton.disabled = true;
        shortenButton.style.opacity = 0.5;

            if (/[\s<>%@]/.test(longUrl)) {
                customMetadataAlert.textContent = 'Your URL must not contain any spaces, less than (<), greater than (>), percent (%), or at (@) characters.';
                customMetadataAlert.style.display = 'block';
                shortenButton.disabled = false;
                shortenButton.style.opacity = 1;
                shortenButton.innerHTML = 'Shorten';
                setTimeout(() => {
                    customMetadataAlert.style.display = 'none';
                }, 5000);
                return;
            }
        if (!/^https?:\/\//i.test(longUrl)) {
            customMetadataAlert.textContent = 'Your URL must start with "http://" or "https://".';
            customMetadataAlert.style.display = 'block';
            setTimeout(() => {
                customMetadataAlert.style.display = 'none';
            }, 5000);
            return;
        }


        if (metadataSource === 'custom' && (!title || !description)) {
            customMetadataAlert.textContent = 'Custom title and description are required for custom metadata.';
            customMetadataAlert.style.display = 'block';
            shortenButton.disabled = true;
            shortenButton.style.opacity = 0.5;
            setTimeout(() => {
                customMetadataAlert.style.display = 'none';
                shortenButton.disabled = false;
                shortenButton.style.opacity = 1;
            }, 5000);
            return;
        }
        if (metadataSource === 'custom' && description.length > 250) {
            customMetadataAlert.textContent = 'Your description must be 250 characters or less.';
            customMetadataAlert.style.display = 'block';
            setTimeout(() => {
                customMetadataAlert.style.display = 'none';
            }, 5000);
            return;
        }

        if (metadataSource === 'custom' && title.length > 60) {
            customMetadataAlert.textContent = 'Your title must be 60 characters or less.';
            customMetadataAlert.style.display = 'block';
            setTimeout(() => {
                customMetadataAlert.style.display = 'none';
            }, 5000);
            return;
        }

        if (metadataSource === 'custom' && !/^[a-zA-Z0-9\-_\. ,!`':?]+$/.test(title)) {
            customMetadataAlert.textContent = 'Your title can only include numbers, letters, hyphens, underscores, periods, spaces, commas, exclamation marks, backticks, apostrophes, colons, and question marks.';
            customMetadataAlert.style.display = 'block';
            setTimeout(() => {
                customMetadataAlert.style.display = 'none';
            }, 5000);
            return;
        }

        if (metadataSource === 'custom' && !/^[a-zA-Z0-9\-_\. ,!`':?]+$/.test(description)) {
            customMetadataAlert.textContent = 'Your description can only include numbers, letters, hyphens, underscores, periods, spaces, commas, exclamation marks, backticks, apostrophes, colons, and question marks.';
            customMetadataAlert.style.display = 'block';
            setTimeout(() => {
                customMetadataAlert.style.display = 'none';
            }, 5000);
            return;
        }

        if (longUrl) {
            await shortenUrl(longUrlInput.value.trim());
        }
        } catch (error) {
            console.error('Error:', error);
        }
    });
    function makeFetchRequest(url, options) {
        return fetch(url, options)
            .then(response => {
                if (!response.ok) {
                    document.getElementById('errorBox').style.display = 'block';
                    console.error('Network response was not ok:', response.status, response.statusText);
                    console.error('Full response:', response);
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .catch(error => {
                console.error('Error in makeFetchRequest:', error);
                throw error;
            });
    }

    async function shortenUrl(longUrl, recaptchaToken) {
        const title = document.getElementById('titleInput').value;
        const description = document.getElementById('descriptionInput').value;
        const customPath = document.getElementById('customPathInput').value;
        const shortenButton = document.querySelector('#shortenForm button');

        shortenButton.disabled = true;
        shortenButton.style.opacity = 0.5;

        const expiryDays = document.getElementById('expiryDateInput').value;
        let parsedExpiryDate;
        if (parseInt(expiryDays) === 15) {
            parsedExpiryDate = null;
        } else {
            parsedExpiryDate = new Date(Date.now() + parseInt(expiryDays) * 24 * 60 * 60 * 1000);
        }

        if (parsedExpiryDate === null || isNaN(parsedExpiryDate)) {
            parsedExpiryDate = null;
        }

        const metadataSource = document.getElementById('metadataSource').value;

        try {
            const authKeyResponse = await fetch('/generateAuthKey');
            const authKeyData = await authKeyResponse.json();
            const authKey = authKeyData.authKey;

            const requestOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-key': authKey,
                },
                body: JSON.stringify({
                    longUrl,
                    title,
                    description,
                    customPath,
                    expiryDate: parsedExpiryDate,
                    metadataSource,
                    recaptchaToken,
                }),
            };

            makeFetchRequest('/shorten', requestOptions)
                .then((data) => {
                    if (data.shortUrl) {
                        const paragraphs = document.querySelectorAll('p');
                        const noLinksMessage = Array.from(paragraphs).find(p => p.textContent === "No shortened Links yet...");
                        if (noLinksMessage) {
                            noLinksMessage.remove();
                        }

                        document.getElementById('customPathInput').value = '';
                        document.getElementById('availabilityStaticText').textContent = '';
                        document.getElementById('availabilityDynamicText').textContent = '';

                        const newLinkItem = document.createElement('div');
                        newLinkItem.classList.add('link-column', 'new-link-item');
                        newLinkItem.innerHTML = `
                        <div class="link-item">
                            <p class="original-url">Original URL: ${data.longUrl}</p>
                            <p class="shortened-url">Shortened URL: <a href="${data.shortUrl}">${data.shortUrl}</a></p>
                            <button class="copy-button" data-clipboard-text="${data.shortUrl}">Copy</button>
                        </div>
                    `;

                        const linkList = document.getElementById('linkList');
                        linkList.prepend(newLinkItem);

                        newLinkItem.querySelector('.copy-button').addEventListener('click', (event) => {
                            const textToCopy = data.shortUrl;
                            const tempElement = document.createElement('textarea');
                            tempElement.value = textToCopy;
                            document.body.appendChild(tempElement);
                            tempElement.select();
                            document.execCommand('copy');
                            document.body.removeChild(tempElement);
                            event.target.innerText = 'Copied!';
                            setTimeout(() => {
                                event.target.innerText = 'Copy';
                            }, 1000);
                        });

                        longUrlInput.value = '';
                    }

                    shortenButton.disabled = false;
                    shortenButton.style.opacity = 1;
                    shortenButton.innerHTML = 'Shorten';

                    setFormDisabled(false);



                })
                .catch((error) => {
                    console.error('Error:', error);
                    document.getElementById('errorBox').style.display = 'block';

                    shortenButton.disabled = false;
                    shortenButton.style.opacity = 1;

                    setFormDisabled(false);
                });
        } catch (error) {
            console.error('Error:', error);
            document.getElementById('errorBox').style.display = 'block';

            shortenButton.disabled = false;
            shortenButton.style.opacity = 1;

            setFormDisabled(false);
        }
    }


    const copyButtons = document.querySelectorAll('.copy-button');
    copyButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const textToCopy = button.dataset.clipboardText;
            const tempElement = document.createElement('textarea');
            tempElement.value = textToCopy;
            document.body.appendChild(tempElement);
            tempElement.select();
            document.execCommand('copy');
            document.body.removeChild(tempElement);
            event.target.innerText = 'Copied!';
            setTimeout(() => {
                event.target.innerText = 'Copy';
            }, 1000);
        });
    });
});

document.addEventListener("DOMContentLoaded", function() {
    const metadataSource = document.getElementById("metadataSource");
    const titleInput = document.getElementById("titleInput");
    const descriptionInput = document.getElementById("descriptionInput");
    const expiryDateInput = document.getElementById("expiryDateInput");
    const expiryDays = document.getElementById("expiryDays");

    metadataSource.value = "original";

    hideCustomMetadataOptions();

    metadataSource.addEventListener("change", function() {
        const selectedValue = metadataSource.value;

        if (selectedValue === "original") {
            fadeOut(titleInput);
            fadeOut(descriptionInput);
        } else {
            fadeIn(titleInput);
            fadeIn(descriptionInput);
        }
    });

    expiryDateInput.addEventListener("input", function() {
        const selectedDays = parseInt(expiryDateInput.value);
        const daysText = selectedDays === 1 ? "day" : "days";
        expiryDays.textContent = selectedDays === 15 ? "never" : `in ${selectedDays} ${daysText}`;
    });

    function fadeIn(element) {
        element.style.display = "block";
        element.style.opacity = 0;

        (function fade() {
            let val = parseFloat(element.style.opacity);
            if (!((val += 0.1) > 1)) {
                element.style.opacity = val;
                requestAnimationFrame(fade);
            }
        })();
    }

    function fadeOut(element) {
        element.style.opacity = 1;

        (function fade() {
            if ((element.style.opacity -= 0.1) < 0) {
                element.style.display = "none";
            } else {
                requestAnimationFrame(fade);
            }
        })();
    }

    function hideCustomMetadataOptions() {
        titleInput.style.display = "none";
        descriptionInput.style.display = "none";
    }
});