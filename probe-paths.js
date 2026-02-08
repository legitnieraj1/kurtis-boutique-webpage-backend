const https = require('https');

const paths = [
    '/v1/access-token',
    '/access-token',
    '/auth/token',
    '/v1/auth/token',
    '/v1/auth/login',
    '/auth/login',
    '/v1/token',
    '/token',
    '/api/v1/access-token',
    '/public-api/v1/access-token'
];

const API_KEY = "NUugHZRHG3Bxg5Et";

paths.forEach(path => {
    const options = {
        hostname: 'checkout-api.shiprocket.com',
        path: path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': `Bearer ${API_KEY}`
        }
    };

    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log(`Path: ${path} -> Status: ${res.statusCode}`);
            if (res.statusCode !== 404) {
                console.log(`FOUND! ${path} Response: ${data.substring(0, 200)}...`);
            } else {
                // Log 404 response body too, might contain hints
                console.log(`404 Body: ${data.substring(0, 100)}`);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`Error with ${path}: ${e.message}`);
    });

    req.write('{}');
    req.end();
});
