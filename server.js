const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Your API key - keep this server-side only
const API_KEY = "csk-yykj5f9cpjpm2pw3tvntpmrxetrjnpn8y94ee83dvec4evxj";

// Load system prompt
let systemPrompt = "You are a helpful AI assistant.";
const promptFile = path.join(__dirname, 'negative.txt');

// Read system prompt on startup
if (fs.existsSync(promptFile)) {
    systemPrompt = fs.readFileSync(promptFile, 'utf8');
    console.log('System prompt loaded from negative.txt');
}

// API endpoint to get system prompt
app.get('/api/prompt', (req, res) => {
    res.json({ prompt: systemPrompt });
});

// API endpoint to update system prompt
app.post('/api/prompt', (req, res) => {
    const { prompt } = req.body;
    
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }
    
    systemPrompt = prompt;
    
    // Save to file
    try {
        fs.writeFileSync(promptFile, prompt, 'utf8');
        res.json({ success: true, message: 'Prompt updated and saved' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save prompt' });
    }
});

// API endpoint to send chat messages
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }
    
    try {
        const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                max_completion_tokens: 2000,
                temperature: 0.7,
                top_p: 0.8,
                stream: false
            })
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        res.json(data);
        
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});