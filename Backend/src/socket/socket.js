import { Server } from "socket.io";
import http from "http";

let io;

const RACE_TEXTS = [
  "Typing fast is useful, but typing accurately is what actually makes you productive. Stay calm, keep a steady rhythm, and focus on every character.",
  "Build speed by reducing hesitation between words. Keep your eyes ahead, trust your fingers, and let your rhythm stay consistent.",
  "Great typing comes from smooth movement, not force. Press gently, recover quickly from mistakes, and stay relaxed through every line.",
  "Consistency beats short bursts. Keep a stable pace, breathe normally, and focus on finishing each sentence with clean accuracy.",
];

const DURATION_OPTIONS = [15, 30, 60, 120];

// roomId -> { players: Map<socketId, playerData>, text, status, countdown, timer, raceTimer, duration, timeLeft }
const rooms = new Map();

const generateRoomId = () => {
  let id;
  do {
    id = Math.random().toString(36).substring(2, 8).toUpperCase();
  } while (rooms.has(id));
  return id;
};

const getRandomText = () => {
  return RACE_TEXTS[Math.floor(Math.random() * RACE_TEXTS.length)];
};

const broadcastRoomState = (roomId) => {
  const room = rooms.get(roomId);
  if (!room) return;

  const players = [];
  room.players.forEach((data, id) => {
    players.push({ id, ...data });
  });

  io.to(roomId).emit("room:state", {
    roomId,
    text: room.text,
    status: room.status,
    countdown: room.countdown,
    hostId: room.hostId,
    startTime: room.startTime,
    duration: room.duration,
    timeLeft: room.timeLeft,
    players,
  });
};

const startCountdown = (roomId) => {
  const room = rooms.get(roomId);
  if (!room || room.status !== "waiting") return;

  room.status = "countdown";
  room.countdown = 5;
  room.text = getRandomText();
  broadcastRoomState(roomId);

  room.timer = setInterval(() => {
    const r = rooms.get(roomId);
    if (!r) return clearInterval(room.timer);

    r.countdown -= 1;

    if (r.countdown <= 0) {
      clearInterval(room.timer);
      r.status = "racing";
      r.countdown = 0;
      r.startTime = Date.now();
      r.timeLeft = r.duration;
      broadcastRoomState(roomId);

      // Start race timer countdown
      r.raceTimer = setInterval(() => {
        const rm = rooms.get(roomId);
        if (!rm || rm.status !== "racing") {
          clearInterval(r.raceTimer);
          return;
        }
        rm.timeLeft -= 1;
        if (rm.timeLeft <= 0) {
          clearInterval(rm.raceTimer);
          // Mark unfinished players
          let pos = 1;
          rm.players.forEach((p) => { if (p.finished) pos++; });
          rm.players.forEach((p) => {
            if (!p.finished) {
              p.finished = true;
              p.finishTime = Date.now() - rm.startTime;
              p.position = pos++;
            }
          });
          rm.timeLeft = 0;
          rm.status = "finished";
          broadcastRoomState(roomId);
        } else {
          broadcastRoomState(roomId);
        }
      }, 1000);
    } else {
      broadcastRoomState(roomId);
    }
  }, 1000);
};

const checkAllFinished = (roomId) => {
  const room = rooms.get(roomId);
  if (!room || room.status !== "racing") return;

  // If only one player remains, end the race immediately
  if (room.players.size <= 1) {
    clearInterval(room.raceTimer);
    let pos = 1;
    room.players.forEach((p) => { if (p.finished) pos++; });
    room.players.forEach((p) => {
      if (!p.finished) {
        p.finished = true;
        p.finishTime = Date.now() - room.startTime;
        p.position = pos++;
      }
    });
    room.status = "finished";
    broadcastRoomState(roomId);
    return;
  }

  let allDone = true;
  room.players.forEach((p) => {
    if (!p.finished) allDone = false;
  });

  if (allDone) {
    clearInterval(room.raceTimer);
    room.status = "finished";
    broadcastRoomState(roomId);
  }
};

export const initSocket = (app) => {
  const server = http.createServer(app);

  const allowedOrigins = process.env.NODE_ENV === "production"
    ? [process.env.CLIENT_URL].filter(Boolean)
    : ["http://localhost:5173"];

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Create a new room
    socket.on("room:create", ({ username }) => {
      // Leave any existing room first
      if (socket.roomId) {
        const oldRoom = rooms.get(socket.roomId);
        if (oldRoom) {
          oldRoom.players.delete(socket.id);
          socket.leave(socket.roomId);
          if (oldRoom.players.size === 0) {
            clearInterval(oldRoom.timer);
            rooms.delete(socket.roomId);
          } else {
            if (oldRoom.hostId === socket.id) {
              oldRoom.hostId = oldRoom.players.keys().next().value;
            }
            broadcastRoomState(socket.roomId);
          }
        }
        socket.roomId = null;
      }

      const roomId = generateRoomId();
      const room = {
        players: new Map(),
        text: "",
        status: "waiting", // waiting | countdown | racing | finished
        countdown: 0,
        timer: null,
        raceTimer: null,
        startTime: null,
        duration: 30,
        timeLeft: 30,
      };
      room.hostId = socket.id;
      room.players.set(socket.id, {
        username: username || "Player",
        progress: 0,
        wpm: 0,
        accuracy: 100,
        cursorIndex: 0,
        ready: true,
        finished: false,
        finishTime: null,
        position: null,
      });
      rooms.set(roomId, room);
      socket.join(roomId);
      socket.roomId = roomId;
      broadcastRoomState(roomId);
    });

    // Join an existing room
    socket.on("room:join", ({ roomId, username }) => {
      // Leave any existing room first
      if (socket.roomId) {
        const oldRoom = rooms.get(socket.roomId);
        if (oldRoom) {
          oldRoom.players.delete(socket.id);
          socket.leave(socket.roomId);
          if (oldRoom.players.size === 0) {
            clearInterval(oldRoom.timer);
            rooms.delete(socket.roomId);
          } else {
            if (oldRoom.hostId === socket.id) {
              oldRoom.hostId = oldRoom.players.keys().next().value;
            }
            broadcastRoomState(socket.roomId);
          }
        }
        socket.roomId = null;
      }

      const room = rooms.get(roomId);
      if (!room) {
        socket.emit("room:error", { message: "Room not found" });
        return;
      }
      if (room.status !== "waiting") {
        socket.emit("room:error", { message: "Race already started" });
        return;
      }
      if (room.players.size >= 5) {
        socket.emit("room:error", { message: "Room is full (max 5)" });
        return;
      }

      room.players.set(socket.id, {
        username: username || "Player",
        progress: 0,
        wpm: 0,
        accuracy: 100,
        cursorIndex: 0,
        ready: false,
        finished: false,
        finishTime: null,
        position: null,
      });
      socket.join(roomId);
      socket.roomId = roomId;
      broadcastRoomState(roomId);
    });

    // Host sets race duration
    socket.on("room:setDuration", ({ duration }) => {
      const roomId = socket.roomId;
      const room = rooms.get(roomId);
      if (!room || room.status !== "waiting") return;
      if (socket.id !== room.hostId) return;
      if (!DURATION_OPTIONS.includes(duration)) return;
      room.duration = duration;
      room.timeLeft = duration;
      broadcastRoomState(roomId);
    });

    // Play again — reset room to waiting, keep players
    socket.on("room:playAgain", () => {
      const roomId = socket.roomId;
      const room = rooms.get(roomId);
      if (!room || room.status !== "finished") return;
      if (socket.id !== room.hostId) {
        socket.emit("room:error", { message: "Only the host can restart" });
        return;
      }
      clearInterval(room.timer);
      clearInterval(room.raceTimer);
      room.status = "waiting";
      room.text = "";
      room.countdown = 0;
      room.startTime = null;
      room.timeLeft = room.duration;
      room.players.forEach((p, id) => {
        p.progress = 0;
        p.wpm = 0;
        p.accuracy = 100;
        p.cursorIndex = 0;
        p.ready = id === room.hostId; // host stays ready
        p.finished = false;
        p.finishTime = null;
        p.position = null;
      });
      broadcastRoomState(roomId);
    });

    // Toggle ready status (host is always ready)
    socket.on("room:ready", () => {
      const roomId = socket.roomId;
      const room = rooms.get(roomId);
      if (!room || room.status !== "waiting") return;
      if (socket.id === room.hostId) return; // host can't toggle

      const player = room.players.get(socket.id);
      if (!player) return;

      player.ready = !player.ready;
      broadcastRoomState(roomId);
    });

    // Start the race (only from lobby)
    socket.on("room:start", () => {
      const roomId = socket.roomId;
      const room = rooms.get(roomId);
      if (!room || room.status !== "waiting") return;

      // Only the host can start
      if (socket.id !== room.hostId) {
        socket.emit("room:error", { message: "Only the host can start the race" });
        return;
      }
      if (room.players.size < 2) {
        socket.emit("room:error", { message: "Need at least 2 players" });
        return;
      }

      // Check all non-host players are ready
      let allReady = true;
      room.players.forEach((p, id) => {
        if (id !== room.hostId && !p.ready) allReady = false;
      });
      if (!allReady) {
        socket.emit("room:error", { message: "All players must be ready" });
        return;
      }

      startCountdown(roomId);
    });

    // Player progress update during the race
    socket.on("race:progress", ({ progress, wpm, accuracy, cursorIndex }) => {
      const roomId = socket.roomId;
      const room = rooms.get(roomId);
      if (!room || room.status !== "racing") return;

      const player = room.players.get(socket.id);
      if (!player || player.finished) return;

      player.progress = progress;
      player.wpm = wpm;
      player.accuracy = accuracy;
      player.cursorIndex = cursorIndex || 0;

      // Check if player finished
      if (progress >= 100) {
        if (!player.finished) { // only set finish time once
          player.finished = true;
          player.finishTime = Date.now() - room.startTime;
          // Position is now calculated on the client
        }
      }

      broadcastRoomState(roomId);
      if (progress >= 100) checkAllFinished(roomId);
    });

    // Leave room
    socket.on("room:leave", () => {
      const roomId = socket.roomId;
      if (!roomId) return;
      const room = rooms.get(roomId);
      if (!room) return;

      room.players.delete(socket.id);
      socket.leave(roomId);
      socket.roomId = null;

      if (room.players.size === 0) {
        clearInterval(room.timer);
        clearInterval(room.raceTimer);
        rooms.delete(roomId);
      } else {
        // Transfer host if the host left
        if (room.hostId === socket.id) {
          room.hostId = room.players.keys().next().value;
        }
        broadcastRoomState(roomId);
        if (room.status === "racing") checkAllFinished(roomId);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      const roomId = socket.roomId;
      if (!roomId) return;
      const room = rooms.get(roomId);
      if (!room) return;

      room.players.delete(socket.id);

      if (room.players.size === 0) {
        clearInterval(room.timer);
        clearInterval(room.raceTimer);
        rooms.delete(roomId);
      } else {
        // Transfer host if the host disconnected
        if (room.hostId === socket.id) {
          room.hostId = room.players.keys().next().value;
        }
        broadcastRoomState(roomId);
        if (room.status === "racing") checkAllFinished(roomId);
      }
    });
  });

  return server;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized. Call initSocket(app) first.");
  }
  return io;
};
