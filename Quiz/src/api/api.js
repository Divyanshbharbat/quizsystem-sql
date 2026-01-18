// src/api/api.js

const API_URL = "http://localhost:5000/api"; // Update this based on your backend URL

export const fetchQuizQuestions = async (quizId) => {
    try {
        const response = await fetch(`${API_URL}/quizzes/${quizId}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data; // This should include the questions array
    } catch (error) {
        console.error("Error fetching quiz questions:", error);
        throw error; // Rethrow to handle in Quiz component
    }
};

export const submitQuizAnswers = async (quizId, studentId, answers) => {
    try {
        const response = await fetch(`${API_URL}/quizzes/${quizId}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ studentId, answers }),
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data; // Handle the response after submission
    } catch (error) {
        console.error("Error submitting quiz answers:", error);
        throw error; // Rethrow to handle in Quiz component
    }
};
