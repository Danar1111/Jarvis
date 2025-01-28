const fs = require('fs');
const path = require('path');
const natural = require('natural');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const keys = process.env.API_KEYS;
const genAI = new GoogleGenerativeAI(keys);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const dataPath = path.join(__dirname, '../data/data.json');
const data = JSON.parse(fs.readFileSync(dataPath));

const tokenizer = new natural.WordTokenizer();

const detectLanguage = (input) => {
	const indonesianKeywords = [
		'siapa', 'apa', 'dimana', 'halo', 
		'nama', 'email', 'warna', 'hobi', 'pekerjaan', 'tujuan', 'tinggal',
		'hari', 'tanggal',
		'buat', 'kamu', 'saya', 'bisa', 'milik', 'email saya', 'hobi saya', 'pekerjaan saya'
	];

	const inputTokens = input.toLowerCase().split(/\s+/); // Tokenize input
	const isIndonesian = inputTokens.some((token) => indonesianKeywords.includes(token));
	return isIndonesian ? 'id' : 'en';
};  

const getRandomAnswer = (answers) => {
	const randomIndex = Math.floor(Math.random() * answers.length);
	return answers[randomIndex];
};

const findAnswer = async (input) => {
    const language = detectLanguage(input);
    const inputTokens = tokenizer.tokenize(input.toLowerCase());
    let bestMatch = null;
    let bestScore = 0;

    data.knowledge_base.forEach((entry) => {
        entry.questions.forEach((question) => {
            const questionTokens = tokenizer.tokenize(question.toLowerCase());
            const score = natural.DiceCoefficient(
                inputTokens.join(' '),
                questionTokens.join(' ')
            );

            if (score > bestScore && score >= 0.7) {
                bestScore = score;
                bestMatch = language === 'id' ? entry.answers_id : entry.answers_en;
            }
        });
    });

    if (bestMatch) {
        return getRandomAnswer(bestMatch);
    }

    let inputFix = `${input} (Please provide a short and concise explanation)`;

    try {
        const prompt = inputFix;
        const result = await model.generateContent(prompt);
        let result_generated = result.response.text().trim().replace(/\n+$/, '');

        return result_generated || (language === 'id'
            ? "Maaf, saya tidak dapat menemukan jawaban dari API Gemini."
            : "I'm sorry, I couldn't retrieve an answer from Gemini API.");
    } catch (error) {
        console.error('Error contacting Gemini API:', error.message);

        return language === 'id'
            ? "Maaf, terjadi kesalahan saat menghubungi API Gemini."
            : "Sorry, there was an error contacting Gemini API.";
    }
};

exports.handleQuery = async (req, res) => {
    const { question } = req.body;

    if (!question || typeof question !== 'string') {
        return res.status(400).json({
            error: 'Invalid input: "question" is required and must be a string.'
        });
    }

    try {
        const answer = await findAnswer(question);

        const processDynamicAnswer = (answer) => {
            if (answer === 'CURRENT_DATE') {
                const currentDate = new Date();
                return currentDate.toLocaleDateString('id-ID');
            }
            if (answer === 'CURRENT_TIME') {
                const currentTime = new Date();
                return currentTime.toLocaleTimeString('id-ID');
            }
            return answer;
        };

        const finalAnswer = processDynamicAnswer(answer);

        res.json({ question, answer: finalAnswer });
    } catch (error) {
        console.error('Error processing query:', error.message);

        res.status(500).json({
            error: 'An error occurred while processing your query.'
        });
    }
};