const express = require('express');
const bodyParser = require('body-parser');
const logger = require('./middleware/logger');
const apiRoutes = require('./routes/api');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
const PORT = 3000;

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(logger);

app.use('/api', apiRoutes);

app.listen(PORT, () => {
    console.log(`Server running on PORT ${PORT}`);
});
