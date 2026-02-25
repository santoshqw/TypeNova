import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:3000";

const useMultiplayerSocket = () => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [roomState, setRoomState] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, { autoConnect: true });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("room:state", (state) => {
      setRoomState(state);
      setError(null);
    });

    socket.on("room:error", ({ message }) => {
      setError(message);
      setTimeout(() => setError(null), 4000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const createRoom = useCallback((username) => {
    socketRef.current?.emit("room:create", { username });
  }, []);

  const joinRoom = useCallback((roomId, username) => {
    socketRef.current?.emit("room:join", { roomId: roomId.toUpperCase(), username });
  }, []);

  const startRace = useCallback(() => {
    socketRef.current?.emit("room:start");
  }, []);

  const toggleReady = useCallback(() => {
    socketRef.current?.emit("room:ready");
  }, []);

  const setDuration = useCallback((duration) => {
    socketRef.current?.emit("room:setDuration", { duration });
  }, []);

  const playAgain = useCallback(() => {
    socketRef.current?.emit("room:playAgain");
  }, []);

  const sendProgress = useCallback((progress, wpm, accuracy, cursorIndex) => {
    socketRef.current?.emit("race:progress", { progress, wpm, accuracy, cursorIndex });
  }, []);

  const leaveRoom = useCallback(() => {
    socketRef.current?.emit("room:leave");
    setRoomState(null);
  }, []);

  const getSocketId = useCallback(() => {
    return socketRef.current?.id;
  }, []);

  return {
    connected,
    roomState,
    error,
    createRoom,
    joinRoom,
    startRace,
    toggleReady,
    setDuration,
    playAgain,
    sendProgress,
    leaveRoom,
    getSocketId,
  };
};

export default useMultiplayerSocket;
