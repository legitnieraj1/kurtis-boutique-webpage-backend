const https = require('https');

const token = "NUugHZRHG3Bxg5Et"; // Trying API_KEY as token

const options = {
    hostname: 'apiv2.shiprocket.in',
    path: '/v1/external/orders', // Standard endpoint to list orders
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    }
};

console.log(`Testing standard API with Bearer token: ${token}`);

const req = https.request(options, (res) => {
    let responseBody = '';
    res.on('data', (chunk) => responseBody += chunk);
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Body: ${responseBody.substring(0, 200)}`);
    });
});

req.on('error', (error) => {
    console.error(`Error: ${error.message}`);
});

req.end();
