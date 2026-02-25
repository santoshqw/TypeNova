import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import TypingPrompt from "../components/TypingPrompt";
import useMultiplayerSocket from "../hooks/useMultiplayerSocket";

const countCorrectCharacters = (typedText, sourceText) => {
  return typedText.split("").reduce((total, character, index) => {
    if (character === sourceText[index]) return total + 1;
    return total;
  }, 0);
};

/* ── Progress bar for a single player ── */
const PlayerProgress = ({ player, isSelf }) => (
  <div className="mb-3 last:mb-0">
    <div className="mb-1 flex items-center justify-between text-xs">
      <span
        className="font-medium"
        style={{ color: isSelf ? "var(--main-color)" : "var(--text-color)" }}
      >
        {player.username}
        {isSelf && " (you)"}
        {player.position && (
          <span
            className="ml-2 rounded px-1.5 py-0.5 text-[10px] font-bold"
            style={{ background: "var(--main-color)", color: "var(--bg-color)" }}
          >
            #{player.position}
          </span>
        )}
      </span>
      <span style={{ color: "var(--sub-color)" }}>
        {player.wpm} wpm · {player.accuracy}%
      </span>
    </div>
    <div
      className="h-2 w-full overflow-hidden rounded-full"
      style={{ background: "var(--sub-alt-color)" }}
    >
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{
          width: `${Math.min(100, player.progress)}%`,
          background: isSelf ? "var(--main-color)" : "var(--sub-color)",
        }}
      />
    </div>
  </div>
);

const DURATION_OPTIONS = [15, 30, 60, 120];

/* ── Lobby screen ── */
const Lobby = ({ roomState, socketId, onStart, onLeave, onToggleReady, onSetDuration, error }) => {
  const players = roomState?.players || [];
  const isHost = roomState?.hostId === socketId;
  const allReady = players.length >= 2 && players.filter((p) => p.id !== roomState?.hostId).every((p) => p.ready);
  const duration = roomState?.duration || 60;

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center gap-4">
        <div
          className="rounded-lg px-4 py-2"
          style={{ background: "var(--sub-alt-color)" }}
        >
          <span className="text-xs" style={{ color: "var(--sub-color)" }}>
            Room Code
          </span>
          <p
            className="text-2xl font-bold tracking-widest"
            style={{ color: "var(--main-color)" }}
          >
            {roomState.roomId}
          </p>
        </div>
        <div style={{ color: "var(--sub-color)" }} className="text-sm">
          Share this code with your friends to join
        </div>
      </div>

      {/* Duration selector — host only */}
      <div className="mb-6">
        <p className="mb-2 text-sm" style={{ color: "var(--sub-color)" }}>
          Race Duration
        </p>
        <div
          className="inline-flex items-center gap-1 rounded-lg px-3 py-2"
          style={{ background: "var(--sub-alt-color)" }}
        >
          <span className="mr-2 text-xs" style={{ color: "var(--sub-color)" }}>time</span>
          {DURATION_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              disabled={!isHost}
              onClick={() => onSetDuration(opt)}
              className="rounded-md px-3 py-1 text-sm font-medium transition-colors disabled:cursor-default"
              style={{
                color: duration === opt ? "var(--main-color)" : "var(--sub-color)",
                background: duration === opt ? "var(--bg-color)" : "transparent",
                opacity: !isHost && duration !== opt ? 0.5 : 1,
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <p className="mb-3 text-sm" style={{ color: "var(--sub-color)" }}>
          Players ({players.length}/5)
        </p>
        {players.map((p) => (
          <div
            key={p.id}
            className="mb-2 flex items-center justify-between rounded-lg px-4 py-2.5"
            style={{ background: "var(--sub-alt-color)" }}
          >
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{
                  background: p.ready ? "#4ade80" : "var(--sub-color)",
                }}
              />
              <span
                className="text-sm font-medium"
                style={{
                  color:
                    p.id === socketId ? "var(--main-color)" : "var(--text-color)",
                }}
              >
                {p.username}
                {p.id === socketId && " (you)"}
                {p.id === roomState?.hostId && (
                  <span
                    className="ml-2 rounded px-1.5 py-0.5 text-[10px] font-bold"
                    style={{ background: "var(--main-color)", color: "var(--bg-color)" }}
                  >
                    HOST
                  </span>
                )}
              </span>
            </div>
            <span
              className="text-xs font-medium"
              style={{ color: p.ready ? "#4ade80" : "var(--sub-color)" }}
            >
              {p.ready ? "Ready" : "Not Ready"}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <p className="mb-4 text-sm" style={{ color: "var(--error-color)" }}>
          {error}
        </p>
      )}

      <div className="flex gap-3">
        {!isHost && (
          <button
            type="button"
            onClick={onToggleReady}
            className="rounded-lg px-6 py-2.5 text-sm font-medium transition-all duration-200 hover:opacity-90"
            style={{
              background: players.find((p) => p.id === socketId)?.ready
                ? "#4ade80"
                : "var(--sub-alt-color)",
              color: players.find((p) => p.id === socketId)?.ready
                ? "var(--bg-color)"
                : "var(--text-color)",
              border: "1px solid rgba(100,102,105,0.12)",
            }}
          >
            {players.find((p) => p.id === socketId)?.ready ? "✓ Ready" : "Ready Up"}
          </button>
        )}
        {isHost && (
          <button
            type="button"
            onClick={onStart}
            disabled={!allReady}
            className="rounded-lg px-6 py-2.5 text-sm font-medium transition-all duration-200 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "var(--main-color)", color: "var(--bg-color)" }}
          >
            Start Race
          </button>
        )}
        <button
          type="button"
          onClick={onLeave}
          className="rounded-lg px-6 py-2.5 text-sm font-medium transition-all duration-200"
          style={{
            background: "var(--sub-alt-color)",
            color: "var(--sub-color)",
          }}
        >
          Leave
        </button>
      </div>
    </div>
  );
};

/* ── Countdown overlay ── */
const Countdown = ({ count }) => (
  <div className="flex flex-col items-center justify-center py-16">
    <p className="mb-2 text-sm" style={{ color: "var(--sub-color)" }}>
      Race starts in
    </p>
    <span
      className="text-7xl font-bold tabular-nums animate-count-up"
      style={{ color: "var(--main-color)" }}
      key={count}
    >
      {count}
    </span>
  </div>
);

/* ── Results screen ── */
const RaceResults = ({ players, socketId, isHost, onPlayAgain, onLeave }) => {
  const sorted = [...players].sort((a, b) => {
    if (a.position && b.position) return a.position - b.position;
    if (a.position) return -1;
    if (b.position) return 1;
    return b.progress - a.progress;
  });

  return (
    <div className="animate-fade-in">
      <h2
        className="mb-6 text-2xl font-bold"
        style={{ color: "var(--main-color)" }}
      >
        Race Results
      </h2>

      {sorted.map((p, idx) => (
        <div
          key={p.id}
          className="mb-3 flex items-center justify-between rounded-lg px-5 py-3"
          style={{
            background: "var(--sub-alt-color)",
            border:
              p.id === socketId
                ? "1px solid var(--main-color)"
                : "1px solid transparent",
          }}
        >
          <div className="flex items-center gap-3">
            <span
              className="text-lg font-bold tabular-nums"
              style={{
                color:
                  idx === 0 ? "var(--main-color)" : "var(--sub-color)",
                width: "2rem",
              }}
            >
              #{p.position || "–"}
            </span>
            <span
              className="font-medium"
              style={{
                color:
                  p.id === socketId
                    ? "var(--main-color)"
                    : "var(--text-color)",
              }}
            >
              {p.username}
              {p.id === socketId && " (you)"}
            </span>
          </div>
          <div className="flex gap-6 text-sm">
            <span style={{ color: "var(--text-color)" }}>
              {p.wpm}{" "}
              <span style={{ color: "var(--sub-color)" }}>wpm</span>
            </span>
            <span style={{ color: "var(--text-color)" }}>
              {p.accuracy}
              <span style={{ color: "var(--sub-color)" }}>%</span>
            </span>
            {p.finishTime != null && (
              <span style={{ color: "var(--sub-color)" }}>
                {(p.finishTime / 1000).toFixed(1)}s
              </span>
            )}
          </div>
        </div>
      ))}

      <div className="mt-6 flex justify-center gap-3">
        {isHost && (
          <button
            type="button"
            onClick={onPlayAgain}
            className="rounded-lg px-6 py-2.5 text-sm font-medium transition-all duration-200 hover:opacity-90"
            style={{
              background: "var(--main-color)",
              color: "var(--bg-color)",
            }}
          >
            Play Again
          </button>
        )}
        <button
          type="button"
          onClick={onLeave}
          className="rounded-lg px-6 py-2.5 text-sm font-medium transition-all duration-200 hover:opacity-90"
          style={{
            background: "var(--sub-alt-color)",
            color: "var(--text-color)",
            border: "1px solid rgba(100,102,105,0.12)",
          }}
        >
          Leave Room
        </button>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════
   MultiplayerPage — main component
   ═══════════════════════════════════════════ */
const MultiplayerPage = () => {
  const navigate = useNavigate();
  const {
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
  } = useMultiplayerSocket();

  const [username, setUsername] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [userInput, setUserInput] = useState("");
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [liveWpm, setLiveWpm] = useState(0);

  const typingBoxRef = useRef(null);
  const userInputRef = useRef("");
  const totalKeystrokesRef = useRef(0);
  const totalMistakesRef = useRef(0);

  const socketId = getSocketId();
  const raceText = roomState?.text || "";
  const status = roomState?.status;

  // Auto-focus typing area and reset state when race starts
  useEffect(() => {
    if (status === "racing") {
      typingBoxRef.current?.focus();
      // Reset via microtask to satisfy React effect rules
      queueMicrotask(() => {
        setUserInput("");
        setTotalKeystrokes(0);
        setTotalMistakes(0);
        setLiveWpm(0);
        userInputRef.current = "";
        totalKeystrokesRef.current = 0;
        totalMistakesRef.current = 0;
      });
    }
  }, [status]);

  // Calculate live stats
  const correctChars = useMemo(
    () => countCorrectCharacters(userInput, raceText),
    [userInput, raceText],
  );

  const progress = raceText.length
    ? Math.round((userInput.length / raceText.length) * 100)
    : 0;

  const accuracy = useMemo(() => {
    if (!totalKeystrokes) return 100;
    return Math.min(
      100,
      Math.round(
        ((totalKeystrokes - totalMistakes) / totalKeystrokes) * 100,
      ),
    );
  }, [totalKeystrokes, totalMistakes]);

  const cursorPos = userInput.length;

  // Send progress to server on every cursor move
  useEffect(() => {
    if (status !== "racing") return;

    const elapsed = roomState?.startTime
      ? (Date.now() - roomState.startTime) / 60000
      : 0;
    const wpm = elapsed > 0 ? Math.round(correctChars / 5 / elapsed) : 0;

    sendProgress(progress, wpm, accuracy, cursorPos);
    // Update liveWpm in next microtask to avoid synchronous setState in effect
    queueMicrotask(() => setLiveWpm(wpm));
  }, [cursorPos, progress, accuracy, status, correctChars, roomState?.startTime, sendProgress]);

  const handleTyping = (event) => {
    if (status !== "racing") return;

    // Check if current player already finished
    const me = roomState?.players?.find((p) => p.id === socketId);
    if (me?.finished) return;

    if (event.key === "Tab") return;
    event.preventDefault();

    if (event.key === "Backspace") {
      setUserInput((prev) => {
        const next = prev.slice(0, -1);
        userInputRef.current = next;
        return next;
      });
      return;
    }

    if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey)
      return;

    const cursorPos = userInputRef.current.length;
    if (cursorPos >= raceText.length) return;

    totalKeystrokesRef.current += 1;
    setTotalKeystrokes((p) => p + 1);

    if (event.key !== raceText[cursorPos]) {
      totalMistakesRef.current += 1;
      setTotalMistakes((p) => p + 1);
    }

    setUserInput((prev) => {
      const next = (prev + event.key).slice(0, raceText.length);
      userInputRef.current = next;
      return next;
    });
  };

  const handleLeave = () => {
    leaveRoom();
    setUserInput("");
    userInputRef.current = "";
  };

  /* ── Not in a room => show create/join UI ── */
  if (!roomState) {
    return (
      <main
        className="flex min-h-screen flex-col"
        style={{ background: "var(--bg-color)" }}
      >
        <header className="mx-auto flex w-full max-w-[850px] items-center justify-between px-8 pt-8 pb-2">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 select-none"
          >
            <svg
              className="h-7 w-7"
              style={{ color: "var(--main-color)" }}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            <span
              className="text-2xl font-bold tracking-tight"
              style={{ color: "var(--text-color)" }}
            >
              type<span style={{ color: "var(--main-color)" }}>nova</span>
            </span>
          </button>
        </header>

        <div className="mx-auto flex w-full max-w-[850px] flex-1 flex-col items-center justify-center px-8">
          <h1
            className="mb-10 text-3xl font-bold"
            style={{ color: "var(--text-color)" }}
          >
            Multiplayer Race
          </h1>

          {/* Username input */}
          <div className="mb-8 w-full max-w-md">
            <label
              className="mb-1.5 block text-xs font-medium"
              style={{ color: "var(--sub-color)" }}
            >
              Your Name
            </label>
            <input
              type="text"
              maxLength={16}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
              style={{
                background: "var(--sub-alt-color)",
                color: "var(--text-color)",
                border: "1px solid rgba(100,102,105,0.2)",
              }}
            />
          </div>

          {!connected && (
            <p className="mb-4 text-sm" style={{ color: "var(--error-color)" }}>
              Connecting to server...
            </p>
          )}

          {error && (
            <p className="mb-4 text-sm" style={{ color: "var(--error-color)" }}>
              {error}
            </p>
          )}

          {/* Two-column: Create Room | Join Room */}
          <div className="flex w-full max-w-md gap-4">
            {/* Create Room card */}
            <div
              className="flex flex-1 flex-col items-center rounded-xl p-6"
              style={{ background: "var(--sub-alt-color)" }}
            >
              <h2
                className="mb-1 text-sm font-semibold"
                style={{ color: "var(--text-color)" }}
              >
                Create Room
              </h2>
              <p
                className="mb-5 text-center text-xs"
                style={{ color: "var(--sub-color)" }}
              >
                Start a new race and invite friends
              </p>
              <button
                type="button"
                disabled={!connected || !username.trim()}
                onClick={() => createRoom(username.trim())}
                className="w-full rounded-lg px-6 py-2.5 text-sm font-medium transition-all duration-200 hover:opacity-90 disabled:opacity-40"
                style={{
                  background: "var(--main-color)",
                  color: "var(--bg-color)",
                }}
              >
                Create
              </button>
            </div>

            {/* Join Room card */}
            <div
              className="flex flex-1 flex-col items-center rounded-xl p-6"
              style={{ background: "var(--sub-alt-color)" }}
            >
              <h2
                className="mb-1 text-sm font-semibold"
                style={{ color: "var(--text-color)" }}
              >
                Join Room
              </h2>
              <p
                className="mb-5 text-center text-xs"
                style={{ color: "var(--sub-color)" }}
              >
                Enter a room code to join a race
              </p>
              <div className="flex w-full gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={joinCode}
                  onChange={(e) =>
                    setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
                  }
                  placeholder="CODE"
                  className="w-0 flex-1 rounded-lg px-3 py-2.5 text-center text-sm uppercase tracking-widest outline-none"
                  style={{
                    background: "var(--bg-color)",
                    color: "var(--text-color)",
                    border: "1px solid rgba(100,102,105,0.2)",
                  }}
                />
                <button
                  type="button"
                  disabled={!connected || !username.trim() || joinCode.length < 4}
                  onClick={() => joinRoom(joinCode, username.trim())}
                  className="rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200 hover:opacity-90 disabled:opacity-40"
                  style={{
                    background: "var(--main-color)",
                    color: "var(--bg-color)",
                  }}
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* ── In a room ── */
  return (
    <main
      className="flex min-h-screen flex-col"
      style={{ background: "var(--bg-color)" }}
    >
      <header className="mx-auto flex w-full max-w-[850px] items-center justify-between px-8 pt-8 pb-2">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-2 select-none"
        >
          <svg
            className="h-7 w-7"
            style={{ color: "var(--main-color)" }}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
          <span
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--text-color)" }}
          >
            type<span style={{ color: "var(--main-color)" }}>nova</span>
          </span>
        </button>

        <div className="flex items-center gap-3">
          <span
            className="rounded-md px-3 py-1 text-xs font-bold tracking-widest"
            style={{
              background: "var(--sub-alt-color)",
              color: "var(--main-color)",
            }}
          >
            {roomState.roomId}
          </span>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[850px] flex-1 flex-col justify-center px-8">
        {/* Waiting / Lobby */}
        {status === "waiting" && (
          <Lobby
            roomState={roomState}
            socketId={socketId}
            onStart={startRace}
            onLeave={handleLeave}
            onToggleReady={toggleReady}
            onSetDuration={setDuration}
            error={error}
          />
        )}

        {/* Countdown */}
        {status === "countdown" && (
          <Countdown count={roomState.countdown} />
        )}

        {/* Racing */}
        {status === "racing" && (
          <div className="animate-fade-in">
            {/* Timer */}
            <div className="mb-4">
              <span
                className="text-2xl font-semibold tabular-nums"
                style={{ color: roomState.timeLeft <= 5 ? "var(--error-color)" : "var(--main-color)" }}
              >
                {roomState.timeLeft ?? ""}
              </span>
            </div>

            {/* Player progress bars */}
            <div className="mb-6">
              {roomState.players.map((p) => (
                <PlayerProgress
                  key={p.id}
                  player={p}
                  isSelf={p.id === socketId}
                />
              ))}
            </div>

            {/* Typing area */}
            <div
              ref={typingBoxRef}
              tabIndex={0}
              onKeyDown={handleTyping}
              className="typing-area cursor-text rounded-lg py-4"
            >
              <div className="overflow-hidden text-2xl leading-[1.75]">
                <TypingPrompt
                  text={raceText}
                  userInput={userInput}
                  opponents={
                    roomState.players
                      .filter((p) => p.id !== socketId)
                      .map((p) => ({ id: p.id, username: p.username, cursorIndex: p.cursorIndex || 0 }))
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* Finished */}
        {status === "finished" && (
          <RaceResults
            players={roomState.players}
            socketId={socketId}
            isHost={roomState.hostId === socketId}
            onPlayAgain={playAgain}
            onLeave={handleLeave}
          />
        )}
      </div>
    </main>
  );
};

export default MultiplayerPage;
