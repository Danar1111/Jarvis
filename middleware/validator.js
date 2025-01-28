const validateQuery = (req, res, next) => {
    const { question } = req.body;
    if (!question || typeof question !== 'string') {
        return res.status(400).json({ error: "Invalid input: 'question' is required and must be a string."});
    }
    next();
}

module.exports = { validateQuery };