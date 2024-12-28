// server/server.js

const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = 10000;

app.use(express.static('public')); // Serve static files from the 'public' folder

// Endpoint to fetch trivia questions from Open Trivia DB
app.get('/api/questions', async (req, res) => {
    const { amount = 10, category = 9, difficulty = 'easy' } = req.query; // Default category: General Knowledge
    try {
        const questions = await fetchOpenTrivia(amount, category, difficulty);
        res.json(questions);
    } catch (error) {
        res.status(500).send('Error fetching questions');
    }
});

// Fetch trivia questions from Open Trivia DB
async function fetchOpenTrivia(amount, category, difficulty) {
    const url = `https://opentdb.com/api.php?amount=${amount}&category=${category}&difficulty=${difficulty}&type=multiple`;
    const response = await fetch(url);
    const data = await response.json();
    return data.results;
}

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
