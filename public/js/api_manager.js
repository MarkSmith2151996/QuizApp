async function fetchQuestions(apiSource = "open_trivia", amount = 10, category = "general", difficulty = "medium") {
    const endpoints = {
        open_trivia: `https://opentdb.com/api.php?amount=${amount}&category=${category}&difficulty=${difficulty}&type=multiple`,
        trivia_api: `https://the-trivia-api.com/api/questions?categories=${category}&limit=${amount}&difficulty=${difficulty}`,
        quiz_api: `https://quizapi.io/api/v1/questions?apiKey=YOUR_API_KEY&limit=${amount}&category=${category}`,
    };

    try {
        const response = await fetch(endpoints[apiSource]);
        if (!response.ok) throw new Error(`API request failed: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error(`Error fetching from ${apiSource}:`, error);
        return []; // Return empty array if API call fails
    }
}
