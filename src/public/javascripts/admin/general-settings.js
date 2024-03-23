$(document).ready(function() {
    $('#shortenerToggleBtn').click(function() {
        toggleService('Link Shortener', '/admin/toggle-shortener');
    });
    $('#apiToggleBtn').click(function() {
        toggleService('API', '/admin/toggle-api');
    });

    $('#maintenanceToggleBtn').click(function() {
        toggleService('Maintenance', '/admin/maintenance-toggle');
    });

    async function toggleService(serviceName, endpoint) {
        const authKeyResponse = await fetch('/generateAuthKey');
        const authKeyData = await authKeyResponse.json();
        const authKey = authKeyData.authKey;

        $.ajax({
            url: endpoint,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-key': authKey,
            },
            data: JSON.stringify({action: 'toggle'}),
            success: function (response) {
                handleToggleResponse(serviceName, response);
            },
            error: function (error) {
                handleToggleError(serviceName, error);
            }
        });
    }

    function handleToggleResponse(serviceName, response) {
        const messageDiv = $('#apiStatusMessage');
        if (response.message) {
            messageDiv.text(`${serviceName} ${response.message}`);
        } else {
            messageDiv.text(`${serviceName} status change successful.`);
        }
    }

    function handleToggleError(serviceName, error) {
        console.log('handleToggleError called');
        const logGeneralError = require('../../../middleware/generalErrorLogger');
        console.error(error);
        logGeneralError(error, 'Admin General-settings.ejs');

        const messageDiv = $('#apiStatusMessage');
        messageDiv.text(`An error occurred while toggling ${serviceName}.`);
    }
});