// netlify/functions/register.js
const axios = require('axios');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    
    try {
        const requestBody = JSON.parse(event.body);
        const server = requestBody.server || 'oast.fun';
        
        const response = await axios.post(`https://${server}/register`, {}, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Interactsh-Client'
            }
        });
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(response.data)
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                error: 'Failed to register with Interactsh server',
                details: error.message
            })
        };
    }
};