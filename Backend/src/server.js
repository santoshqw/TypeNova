import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js"

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/test', (req, res) => {
	res.status(200).json({ ok: true, message: 'tesing server is running or not'});
});


connectDB().then(() => {
  //first connect the DB then run the app.
  app.listen(PORT, () => {
    console.log("Server started on PORT", PORT);
  });
});