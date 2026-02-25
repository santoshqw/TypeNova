import dotenv from "dotenv";
import express from "express";
import path from "path";
import cors from "cors";
import { connectDB } from "./config/db.js"
import { initSocket } from "./socket/socket.js"

import userRoutes from "./routes/user.route.js"

dotenv.config({ path: path.resolve("Backend", ".env") });

const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

const allowedOrigins = process.env.NODE_ENV === "production"
  ? [process.env.CLIENT_URL].filter(Boolean)
  : ["http://localhost:5173"];

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.use('/api/user', userRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "Frontend/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "Frontend/dist/index.html"));
  });
}

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