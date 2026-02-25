import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import cors from "cors";
import { connectDB } from "./config/db.js"
import { initSocket } from "./socket/socket.js"

import userRoutes from "./routes/user.route.js"

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

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.use('/api/user', userRoutes);

// Serve frontend — always if the dist folder exists
const distPath = path.join(rootDir, "Frontend", "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("/{*splat}", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
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