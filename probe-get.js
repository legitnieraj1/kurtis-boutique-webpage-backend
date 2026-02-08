const https = require('https');

const paths = [
    '/v1/access-token',
    '/access-token',
    '/v1/token',
    '/token',
    '/v1/checkout/create-session',
    '/create-session',
    '/',
    '/api/v1/access-token'
];

const API_KEY = "NUugHZRHG3Bxg5Et";

paths.forEach(path => {
    const options = {
        hostname: 'checkout-api.shiprocket.com',
        path: path,
        method: 'GET', // Trying GET
        headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': `Bearer ${API_KEY}`
        }
    };

    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            // Log if status is NOT 404
            if (res.statusCode !== 404) {
                console.log(`GET ${path} -> Status: ${res.statusCode} Body: ${data.substring(0, 100)}`);
            } else {
                // console.log(`GET ${path} -> 404`);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`Error with ${path}: ${e.message}`);
    });

    req.end();
});
