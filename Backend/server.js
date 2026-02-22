require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/test', (req, res) => {
	res.status(200).json({ ok: true, message: 'tesing server is running or not'});
});


app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});