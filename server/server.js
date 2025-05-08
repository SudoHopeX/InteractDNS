const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const app = express();

// Store session info
const sessions = {};

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Register with Interactsh server
app.post('/api/register', async (req, res) => {
    try {
        const server = req.body.server || 'oast.fun';
        
        // Simple registration approach - match your current JS implementation
        const response = await axios.post(`https://${server}/register`, {}, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Interactsh-Client'
            }
        });
        
        // Return the data directly to the client
        res.json(response.data);
    } catch (error) {
        console.error('Error registering with Interactsh:', error);
        res.status(500).json({ 
            error: 'Failed to register with Interactsh server',
            details: error.message
        });
    }
});

// Poll for interactions
app.get('/api/poll', async (req, res) => {
    try {
        const { id, correlation_id, server } = req.query;
        
        const response = await axios.get(`https://${server}/poll?id=${id}&correlation_id=${correlation_id}`, {
            headers: {
                'User-Agent': 'Interactsh-Client'
            }
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('Error polling Interactsh:', error);
        res.status(500).json({ 
            error: 'Failed to poll Interactsh server',
            details: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Interactsh proxy server running on port ${PORT}`);
});