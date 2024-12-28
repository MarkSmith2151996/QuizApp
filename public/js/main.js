document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('startQuiz').addEventListener('click', startQuiz);
    
    let currentQuestionIndex = 0;
    let score = 0;
    let questions = [];
    let sessionToken = null;

    // Fetch a session token on page load
    async function getSessionToken() {
        try {
            const response = await fetch('https://opentdb.com/api_token.php?command=request');
            const data = await response.json();
            if (data.response_code === 0 && data.token) {
                sessionToken = data.token;
                console.log('Session Token:', sessionToken);
            } else {
                console.error('Invalid token response:', data);
            }
        } catch (error) {
            console.error('Error fetching session token:', error);
        }
    }

    // Start the quiz
    async function startQuiz() {
        // Reset quiz state
        currentQuestionIndex = 0;
        score = 0;
        questions = [];

        const numQuestions = document.getElementById('amount').value;
        const difficulty = document.getElementById('difficulty').value;
        const category = document.getElementById('category').value;

        // Show loading state
        document.getElementById('quiz-container').style.display = 'block';
        document.getElementById('quiz-container').innerHTML = '<p>Loading questions...</p>';

        const apiUrl = `https://opentdb.com/api.php?amount=${numQuestions}&category=${category}&difficulty=${difficulty}${sessionToken ? `&token=${sessionToken}` : ''}`;
        
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('API Response:', data);

            // Handle different response codes
            switch (data.response_code) {
                case 0: // Success
                    if (Array.isArray(data.results) && data.results.length > 0) {
                        questions = data.results;
                        document.getElementById('quiz-settings').style.display = 'none';
                        displayQuestion();
                    } else {
                        throw new Error('No questions received from API');
                    }
                    break;
                    
                case 1: // No Results
                    showError('No questions available for the selected criteria. Please try different options.');
                    break;
                    
                case 2: // Invalid Parameter
                    showError('Invalid parameters provided. Please check your selections.');
                    break;
                    
                case 3: // Token Not Found
                    await getSessionToken();
                    startQuiz();
                    break;
                    
                case 4: // Token Empty
                    await resetSessionToken();
                    break;
                    
                default:
                    throw new Error(`Unknown response code: ${data.response_code}`);
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Failed to load quiz questions. Please try again.');
        }
    }

    // Reset the session token if exhausted
    async function resetSessionToken() {
        if (!sessionToken) {
            await getSessionToken();
            return;
        }

        try {
            const response = await fetch(`https://opentdb.com/api_token.php?command=reset&token=${sessionToken}`);
            const data = await response.json();
            
            if (data.response_code === 0) {
                console.log('Token Reset Successful');
                await getSessionToken();
                startQuiz();
            } else {
                throw new Error('Failed to reset token');
            }
        } catch (error) {
            console.error('Error resetting token:', error);
            sessionToken = null;
            await getSessionToken();
            startQuiz();
        }
    }

    // Display a question and its possible answers
    function displayQuestion() {
        const quizContainer = document.getElementById('quiz-container');
        
        if (!Array.isArray(questions) || !questions.length) {
            showError('No questions available. Please restart the quiz.');
            return;
        }

        if (currentQuestionIndex >= questions.length) {
            endQuiz();
            return;
        }

        try {
            const question = questions[currentQuestionIndex];
            if (!question || !question.question || !question.correct_answer || !Array.isArray(question.incorrect_answers)) {
                throw new Error('Invalid question format');
            }

            const questionElement = document.createElement('div');
            questionElement.classList.add('question');
            questionElement.innerHTML = `<p>Question ${currentQuestionIndex + 1} of ${questions.length}</p>
                                      <h3>${decodeHTMLEntities(question.question)}</h3>`;

            const answersElement = document.createElement('ul');
            answersElement.classList.add('answers');

            const allAnswers = [...question.incorrect_answers, question.correct_answer]
                .map(answer => decodeHTMLEntities(answer))
                .sort(() => Math.random() - 0.5);

            allAnswers.forEach(answer => {
                const answerElement = document.createElement('li');
                answerElement.textContent = answer;
                answerElement.addEventListener('click', checkAnswer);
                answersElement.appendChild(answerElement);
            });

            quizContainer.innerHTML = '';
            quizContainer.appendChild(questionElement);
            quizContainer.appendChild(answersElement);
        } catch (error) {
            console.error('Error displaying question:', error);
            showError('Error displaying question. Please restart the quiz.');
        }
    }

    // Check the selected answer and move to the next question
    function checkAnswer(event) {
        const selectedAnswer = event.target.textContent;
        const correctAnswer = decodeHTMLEntities(questions[currentQuestionIndex].correct_answer);

        // Disable all answer buttons
        const answerItems = document.querySelectorAll('.answers li');
        answerItems.forEach(item => {
            item.removeEventListener('click', checkAnswer);
            if (item.textContent === correctAnswer) {
                item.classList.add('correct');
            }
        });

        if (selectedAnswer === correctAnswer) {
            score++;
            event.target.classList.add('correct');
        } else {
            event.target.classList.add('incorrect');
        }

        setTimeout(() => {
            currentQuestionIndex++;
            displayQuestion();
        }, 1500);
    }

    // End the quiz and display the score
    function endQuiz() {
        const percentage = ((score / questions.length) * 100).toFixed(1);
        const quizContainer = document.getElementById('quiz-container');
        quizContainer.innerHTML = `
            <div class="end-quiz">
                <h2>Quiz Complete!</h2>
                <p>Your Score: ${score} out of ${questions.length} (${percentage}%)</p>
                <button class="start-btn" onclick="location.reload()">Start New Quiz</button>
            </div>
        `;
    }

    // Helper function to show errors
    function showError(message) {
        const quizContainer = document.getElementById('quiz-container');
        document.getElementById('quiz-settings').style.display = 'block';
        quizContainer.style.display = 'block';
        quizContainer.innerHTML = `
            <div class="error">
                <p>${message}</p>
                <button class="start-btn" onclick="location.reload()">Try Again</button>
            </div>
        `;
    }

    // Helper function to decode HTML entities
    function decodeHTMLEntities(text) {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        return textarea.value;
    }

    // Initialize the quiz
    getSessionToken();
});