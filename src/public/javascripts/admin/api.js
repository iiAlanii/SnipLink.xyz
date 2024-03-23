async function fetchApiKeys() {
    try {
        const authKeyResponse = await fetch('/generateAuthKey');
        const authKeyData = await authKeyResponse.json();
        const authKey = authKeyData.authKey;

        const response = await fetch('/api/getApiKeys', {
            headers: {
                'x-auth-key': authKey,
            },
        });

        const data = await response.json();
        const apiList = document.querySelector('.api-key-list');
        apiList.innerHTML = '';

        data.apiKeys.forEach(apiKey => {
            const li = document.createElement('li');
            li.classList.add('api-key-item');
            li.innerHTML = `
                <div class="api-key">${apiKey.key}</div>
                <div class="actions">
                    <a href="#" class="delete-btn" data-key="${apiKey.key}">Delete</a>
                    <a href="#" class="edit-btn" data-key="${apiKey.key}">Edit</a>
                </div>
            `;
            apiList.appendChild(li);
        });
    } catch (error) {
        console.error('Error fetching API keys:', error);
    }
}

const apiList = document.querySelector('.api-key-list');
apiList.addEventListener('click', async (event) => {
    if (event.target.classList.contains('delete-btn')) {
        const apiKeyToDelete = event.target.getAttribute('data-key');
        console.log('API Key to Delete:', apiKeyToDelete);
        try {
            const authKeyResponse = await fetch('/generateAuthKey');
            const authKeyData = await authKeyResponse.json();
            const authKey = authKeyData.authKey;

            const response = await fetch(`/api/deleteApiKey/${apiKeyToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-key': authKey,
                },
            });
            console.log('Delete Response:', response);

            if (response.ok) {
                console.log('API Key Deleted Successfully!');
                await fetchApiKeys();
            } else {
                console.log('Error Deleting API Key:', await response.json());
            }
        } catch (error) {
            console.error('Error Sending DELETE Request:', error);
        }
    } else if (event.target.classList.contains('edit-btn')) {
        const apiKeyToModify = event.target.getAttribute('data-key');
        const modifyForm = document.getElementById('modify-api-key-form');
        modifyForm.style.display = 'block';
        addApiKeyForm.style.display = 'none';
        modifyForm.querySelector('input[name="apiKeyToModify"]').value = apiKeyToModify;
    }
});

const addApiKeyForm = document.getElementById('add-api-key-form');
addApiKeyForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(addApiKeyForm);
    const newApiKey = formData.get('newApiKey');

    try {
        const authKeyResponse = await fetch('/generateAuthKey');
        const authKeyData = await authKeyResponse.json();
        const authKey = authKeyData.authKey;

        const response = await fetch('/api/addApiKey', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-key': authKey,
            },
            body: JSON.stringify({ apiKey: newApiKey }),
        });

        if (response.ok) {
            console.log('API Key Added Successfully!');
            await fetchApiKeys();
            addApiKeyForm.reset();
        } else {
            console.log('Error Adding API Key:', await response.json());
        }
    } catch (error) {
        console.error('Error Sending POST Request:', error);
    }
});

fetchApiKeys();