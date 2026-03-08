import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js"
import { initSocket } from "./socket/socket.js"


import userRoutes from "./routes/user.route.js"
import statRoutes from "./routes/stat.route.js"
import typingTextRoutes from "./routes/typingText.route.js"

// __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project root = two levels up from Backend/src/server.js
const rootDir = path.resolve(__dirname, "../..");

dotenv.config({ path: path.join(rootDir, "Backend", ".env") });

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = process.env.NODE_ENV === "production"
  ? [process.env.CLIENT_URL].filter(Boolean)
  : ["http://localhost:5173"];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(cookieParser());



app.use('/api/user', userRoutes);
app.use('/api/stats', statRoutes);
app.use('/api/typing-text', typingTextRoutes);

// Serve frontend — always if the dist folder exists
const distPath = path.join(rootDir, "Frontend", "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // Only serve index.html for non-API routes (Express 5 fix)
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ message: 'API route not found' });
    }
    if (fs.existsSync(distPath)) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

const server = initSocket(app);

connectDB().then(() => {
  server.listen(PORT, () => {
    // ...existing code...
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
    console.error(`Port ${PORT} is already in use.`);
    console.error("Please close the process using this port or change the PORT in .env");
    process.exit(1);
  } else {
    throw err;
  }
});