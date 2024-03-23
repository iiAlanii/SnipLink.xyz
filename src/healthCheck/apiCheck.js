const axios = require('axios');

async function checkApiAvailability() {
    try {
        const checks = 5;
        let totalResponseTime = 0;

        for (let i = 0; i < checks; i++) {
            const startTime = Date.now();
            const expiryDate = Math.floor(Date.now() / 1000) + 60 * 60;

            const healthCheckResponse = await axios.post(
                'http://localhost:3000/api/v1/shorten' || 'https://sniplink,xyz' || 'https://www.sniplink.xyz',

                {
                    longUrl: 'https://www.google.com',
                    expiryDate: expiryDate,
                    isHealthCheck: true,

                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'api-key': '0ec64d48-6a91-49a9-be13-71a6c1ac1944',
                        'client-identifier': 'HealthCheckIdentifier',
                    },
                }
            ).catch((error) => {
                if (error.response) {
                    console.log(error.response.data);
                    console.log(error.response.status);
                    console.log(error.response.headers);
                } else if (error.request) {
                    console.log(error.request);
                } else {
                    console.log('Error', error.message);
                }
                console.log(error.config);
                throw error;
            });

            const endTime = Date.now();
            totalResponseTime += endTime - startTime;

            if (healthCheckResponse.status !== 201) {
                console.error('Failed to create health check link:', healthCheckResponse.status);
                return -1;
            }

            const linkId = healthCheckResponse.data.debug.linkId;
            const linkToDelete = await apiLinks.findOne({ apiLinkId: linkId });
            if (linkToDelete && linkToDelete.isHealthCheck && linkToDelete.clientIdentifier === 'HealthCheckIdentifier') {
                await apiLinks.findOneAndDelete({ apiLinkId: linkId });
            }
        }

        const averageResponseTime = totalResponseTime / checks;
        const threshold = 50000;
        const isHealthy = averageResponseTime <= threshold;

        if (isHealthy) {
            const health = 100 - Math.min((averageResponseTime / threshold) * 100, 100);
            return health;
        } else {
            console.error('API response time exceeds threshold:', averageResponseTime);
            return -1;
        }
    } catch (error) {
        console.error('Error checking API health:', error);
        healthCheckResponse = { status: error.response ? error.response.status : 500 };
        return -1;
    }
}

module.exports = { checkApiAvailability };