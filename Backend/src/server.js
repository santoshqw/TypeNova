import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js"
import { initSocket } from "./socket/socket.js"

import userRoutes from "./routes/user.route.js"

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/test', (req, res) => {
	res.status(200).json({ ok: true, message: 'tesing server is running or not'});
});

app.use('/api/user', userRoutes);

const server = initSocket(app);

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log("Server started on PORT", PORT);
  });
});

// ── Graceful shutdown (fixes EADDRINUSE on nodemon restart) ──
const shutdown = () => {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 3000);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Retrying in 2s...`);
    setTimeout(() => {
      server.close();
      server.listen(PORT);
    }, 2000);
  } else {
    throw err;
  }
});