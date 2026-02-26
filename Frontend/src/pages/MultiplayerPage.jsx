import React, { useEffect, useMemo, useRef, useState } from "react";
import Layout from "../components/Layout";
import TypingPrompt from "../components/TypingPrompt";
import useMultiplayerSocket from "../hooks/useMultiplayerSocket";
import {
  Clipboard, Check, Timer, Users, Crown, Flag, Link, User,
  Sparkles, RotateCcw, LogOut, Trophy, Medal, Clock,
  Car,
} from "lucide-react";

const countCorrectCharacters = (typedText, sourceText) => {
  return typedText.split("").reduce((total, character, index) => {
    if (character === sourceText[index]) return total + 1;
    return total;
  }, 0);
};

/* ── Progress bar for a single player ── */
const PlayerProgress = ({ player, isSelf, showStats = true }) => (
  <div className="mb-4 last:mb-0">
    <div className="mb-1.5 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div
          className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold uppercase"
          style={{
            background: isSelf ? "var(--main-color)" : "var(--sub-alt-color)",
            color: isSelf ? "var(--bg-color)" : "var(--sub-color)",
          }}
        >
          {player.username.charAt(0)}
        </div>
        <span className={`text-sm font-medium ${isSelf ? "text-main" : "text-text"}`}>
          {player.username}
          {isSelf && <span className="ml-1 text-xs text-sub">(you)</span>}
        </span>
        {player.position && (
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-main text-[10px] font-bold text-bg">
            {player.position}
          </span>
        )}
      </div>
      {showStats && (
        <div className="flex items-center gap-3 text-xs tabular-nums">
          <span className="font-semibold text-main">{player.wpm} <span className="font-normal text-sub">wpm</span></span>
          <span className="text-sub">{player.accuracy}%</span>
        </div>
      )}
    </div>
    <div className="flex items-center gap-2">
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-sub-alt">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(100, player.progress)}%`,
            background: isSelf
              ? "linear-gradient(90deg, var(--main-color), #f0d050)"
              : "var(--sub-color)",
            boxShadow: isSelf ? "0 0 8px rgba(226, 183, 20, 0.3)" : "none",
          }}
        />
      </div>
      <span className={`min-w-[2.5rem] text-right text-xs font-semibold tabular-nums ${isSelf ? "text-main" : "text-sub"}`}>
        {Math.min(100, player.progress)}%
      </span>
    </div>
  </div>
);

const DURATION_OPTIONS = [15, 30, 60, 120];

/* ── Copy button with feedback ── */
const CopyButton = ({ text }) => {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`ml-3 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all duration-200 ${
        copied
          ? "bg-success/20 text-success"
          : "bg-surface text-sub hover:bg-main/10 hover:text-main"
      }`}
      title="Copy room code"
    >
      {copied ? <><Check className="inline h-3 w-3 mr-1" />Copied</> : <><Clipboard className="inline h-3 w-3 mr-1" />Copy</>}
    </button>
  );
};

/* ── Lobby screen ── */
const Lobby = ({ roomState, socketId, onStart, onLeave, onToggleReady, onSetDuration, error }) => {
  const players = roomState?.players || [];
  const isHost = roomState?.hostId === socketId;
  const allReady = players.length >= 2 && players.filter((p) => p.id !== roomState?.hostId).every((p) => p.ready);
  const duration = roomState?.duration || 30;

  return (
    <div className="mx-auto w-full max-w-lg animate-fade-in space-y-6">
      {/* Duration selector — host only */}
      <div>
        <p className="mb-2 text-[11px] uppercase tracking-widest text-sub">
          <Timer className="inline h-3 w-3 mr-1" /> Race Duration
        </p>
        <div className="duration-selector">
          <span className="mr-1 px-2 text-xs text-sub">time</span>
          {DURATION_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              disabled={!isHost}
              onClick={() => onSetDuration(opt)}
              className={`duration-btn ${duration === opt ? "active" : ""}`}
              style={{ opacity: !isHost && duration !== opt ? 0.5 : 1 }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-surface" />

      {/* Players list */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-widest text-sub">
            <Users className="inline h-3 w-3 mr-1" /> Players
          </p>
          <span className="rounded-full bg-sub-alt px-2.5 py-0.5 text-[11px] font-medium tabular-nums text-sub">
            {players.length} / 5
          </span>
        </div>
        <div className="space-y-2">
          {players.map((p, idx) => {
            const isSelf = p.id === socketId;
            const isPlayerHost = p.id === roomState?.hostId;
            return (
              <div
                key={p.id}
                className={`card flex items-center justify-between px-4 py-3 transition-all animate-fade-in animate-delay-${idx}00`}
                style={isSelf ? { borderColor: "var(--main-color)", boxShadow: "0 0 12px rgba(226, 183, 20, 0.08)" } : undefined}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar circle */}
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold uppercase shadow-sm"
                    style={{
                      background: isSelf
                        ? "linear-gradient(135deg, var(--main-color), #f0d050)"
                        : "var(--sub-alt-color)",
                      color: isSelf ? "var(--bg-color)" : "var(--sub-color)",
                    }}
                  >
                    {p.username.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-sm font-medium leading-tight ${isSelf ? "text-main" : "text-text"}`}>
                      {p.username}
                      {isSelf && <span className="ml-1 text-xs text-sub">(you)</span>}
                    </span>
                    {isPlayerHost && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-main">
                        <Crown className="h-3 w-3" /> Host
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full transition-colors duration-300 ${p.ready ? "animate-pulse" : ""}`}
                    style={{ background: p.ready ? "#4ade80" : "var(--sub-color)" }}
                  />
                  <span
                    className="text-xs font-medium transition-colors duration-300"
                    style={{ color: p.ready ? "#4ade80" : "var(--sub-color)" }}
                  >
                    {p.ready ? "Ready" : "Waiting"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-error/10 px-4 py-3 text-center text-sm text-error">
          {error}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-center gap-3 pt-2">
        {!isHost && (
          <button
            type="button"
            onClick={onToggleReady}
            className={`btn ${
              players.find((p) => p.id === socketId)?.ready
                ? "btn-primary"
                : "btn-secondary"
            }`}
            style={
              players.find((p) => p.id === socketId)?.ready
                ? { background: "#4ade80", color: "var(--bg-color)", boxShadow: "0 4px 16px rgba(74, 222, 128, 0.2)" }
                : {}
            }
          >
            {players.find((p) => p.id === socketId)?.ready ? "✓ Ready" : "Ready Up"}
          </button>
        )}
        {isHost && (
          <button
            type="button"
            onClick={onStart}
            disabled={!allReady}
            className="btn btn-primary"
          >
            <Flag className="h-4 w-4" /> Start Race
          </button>
        )}
        <button
          type="button"
          onClick={onLeave}
          className="btn btn-ghost"
        >
          Leave
        </button>
      </div>

      {/* Divider */}
      <div className="h-px bg-surface" />

      {/* Room Code — below action buttons */}
      <div className="text-center">
        <p className="mb-2 text-[11px] uppercase tracking-widest text-sub">
          <Link className="inline h-3 w-3 mr-1" /> Room Code
        </p>
        <div className="inline-flex items-center rounded-xl bg-sub-alt px-6 py-3 shadow-sm">
          <span className="font-mono text-3xl font-bold tracking-[0.3em] text-main sm:text-4xl">
            {roomState.roomId}
          </span>
          <CopyButton text={roomState.roomId} />
        </div>
        <p className="mt-2 text-xs text-sub">
          Share this code with friends to join the race
        </p>
      </div>
    </div>
  );
};

/* ── Countdown overlay ── */
const Countdown = ({ count }) => {
  const total = 3;
  const radius = 70;
  const stroke = 6;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - ((total - count + 1) / total) * circumference;

  return (
    <div className="flex flex-col items-center justify-center py-24">
      <p className="mb-8 text-sm font-medium uppercase tracking-[0.25em] text-sub">
        Race starts in
      </p>
      <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
        {/* Background circle */}
        <svg className="absolute inset-0" width="180" height="180" viewBox="0 0 180 180">
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="var(--sub-alt-color)"
            strokeWidth={stroke}
          />
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="var(--main-color)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={progressOffset}
            className="countdown-ring"
            style={{
              transformOrigin: "center",
              transform: "rotate(-90deg)",
              filter: "drop-shadow(0 0 6px rgba(226, 183, 20, 0.4))",
            }}
          />
        </svg>
        {/* Number */}
        <span
          className="relative text-7xl font-black tabular-nums text-main animate-count-up"
          key={count}
        >
          {count}
        </span>
      </div>
      <p className="mt-8 text-xs text-sub">Get ready to type!</p>
    </div>
  );
};

/* ── Results screen ── */
const RaceResults = ({ players, socketId, isHost, onPlayAgain, onLeave }) => {
  const sorted = [...players].sort((a, b) => {
    if (a.position && b.position) return a.position - b.position;
    if (a.position) return -1;
    if (b.position) return 1;
    return b.progress - a.progress;
  });

  const medalIcons = [Trophy, Medal, Medal];
  const medalColors = ["var(--main-color)", "#c0c0c0", "#cd7f32"];
  const positionColors = ["var(--main-color)", "#c0c0c0", "#cd7f32"];

  return (
    <div className="mx-auto w-full max-w-lg animate-fade-in">
      <h2 className="mb-2 text-center text-2xl font-bold text-main flex items-center justify-center gap-2">
        <Flag className="h-6 w-6" /> Race Results
      </h2>
      <p className="mb-8 text-center text-xs text-sub">Final standings</p>

      <div className="space-y-3">
        {sorted.map((p, idx) => {
          const isSelf = p.id === socketId;
          const isWinner = idx === 0 && p.position === 1;
          return (
            <div
              key={p.id}
              className={`card flex flex-col gap-3 px-5 py-4 transition-all sm:flex-row sm:items-center sm:justify-between animate-fade-in animate-delay-${Math.min(idx, 5)}00`}
              style={{
                borderColor: isWinner
                  ? "var(--main-color)"
                  : isSelf
                    ? "rgba(226, 183, 20, 0.4)"
                    : undefined,
                boxShadow: isWinner ? "0 0 20px rgba(226, 183, 20, 0.1)" : undefined,
              }}
            >
              <div className="flex items-center gap-3">
                {/* Position indicator */}
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold shadow-sm"
                  style={{
                    background: idx < 3 && p.position
                      ? `${positionColors[idx]}20`
                      : "var(--sub-alt-color)",
                  }}
                >
                  {p.position && idx < 3 ? (
                    React.createElement(medalIcons[idx], { className: "h-5 w-5", style: { color: medalColors[idx] } })
                  ) : (
                    <span className="text-sub">#{p.position || "–"}</span>
                  )}
                </span>
                <div className="flex flex-col">
                  <span className={`font-semibold leading-tight ${isSelf ? "text-main" : "text-text"}`}>
                    {p.username}
                    {isSelf && <span className="ml-1 text-xs font-normal text-sub">(you)</span>}
                  </span>
                  {p.finishTime != null && (
                    <span className="text-[11px] tabular-nums text-sub">
                      <Clock className="inline h-3 w-3 mr-0.5" /> {(p.finishTime / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-4">
                <div className="rounded-lg bg-sub-alt px-3 py-1.5 text-center">
                  <p className="font-mono text-lg font-bold tabular-nums text-main">{p.wpm}</p>
                  <p className="text-[10px] uppercase tracking-wider text-sub">wpm</p>
                </div>
                <div className="rounded-lg bg-sub-alt px-3 py-1.5 text-center">
                  <p className="font-mono text-lg font-bold tabular-nums text-text">{p.accuracy}%</p>
                  <p className="text-[10px] uppercase tracking-wider text-sub">acc</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center gap-3">
        {isHost && (
          <button type="button" onClick={onPlayAgain} className="btn btn-primary">
            <RotateCcw className="h-4 w-4" /> Play Again
          </button>
        )}
        <button type="button" onClick={onLeave} className="btn btn-secondary">
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
      <Layout>
        <div className="flex flex-1 flex-col items-center justify-center">
          <h1 className="mb-2 text-2xl font-bold text-text sm:text-3xl">
            Multiplayer Race
          </h1>
          <p className="mb-10 text-sm text-sub">
            Compete with friends in real-time typing races
          </p>

          {/* Username input */}
          <div className="mb-8 w-full max-w-md">
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-sub">
              <User className="inline h-3 w-3 mr-1" /> Your Name
            </label>
            <input
              type="text"
              maxLength={16}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              className="input-field w-full"
            />
          </div>

          {!connected && (
            <div className="mb-4 rounded-lg bg-error/10 px-4 py-2.5 text-center text-sm text-error">
              Connecting to server...
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg bg-error/10 px-4 py-2.5 text-center text-sm text-error">
              {error}
            </div>
          )}

          {/* Two-column: Create Room | Join Room */}
          <div className="flex w-full max-w-md flex-col gap-4 sm:flex-row">
            {/* Create Room card */}
            <div className="card flex flex-1 flex-col items-center p-6 transition-all hover:border-main/20">
              <Sparkles className="mb-3 h-6 w-6 text-main" />
              <h2 className="mb-1 text-sm font-semibold text-text">
                Create Room
              </h2>
              <p className="mb-5 text-center text-xs text-sub">
                Start a new race and invite friends
              </p>
              <button
                type="button"
                disabled={!connected || !username.trim()}
                onClick={() => createRoom(username.trim())}
                className="btn btn-primary w-full"
              >
                Create
              </button>
            </div>

            {/* Join Room card */}
            <div className="card flex flex-1 flex-col items-center p-6 transition-all hover:border-main/20">
              <Link className="mb-3 h-6 w-6 text-main" />
              <h2 className="mb-1 text-sm font-semibold text-text">
                Join Room
              </h2>
              <p className="mb-5 text-center text-xs text-sub">
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
                  className="input-field w-0 flex-1 text-center uppercase tracking-widest"
                />
                <button
                  type="button"
                  disabled={!connected || !username.trim() || joinCode.length < 4}
                  onClick={() => joinRoom(joinCode, username.trim())}
                  className="btn btn-primary"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  /* ── In a room ── */
  return (
    <Layout>
      <div className="flex flex-1 flex-col justify-center">
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
            {/* Timer + Live WPM bar */}
            <div className="mb-5 flex items-center justify-between rounded-xl bg-sub-alt px-5 py-3">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-xs uppercase tracking-widest text-sub"><Timer className="h-3 w-3" /> Time</span>
                <span
                  className={`text-2xl font-bold tabular-nums sm:text-3xl ${
                    roomState.timeLeft <= 5 ? "text-error timer-urgent" : "text-main"
                  }`}
                  role="timer"
                  aria-label={`${roomState.timeLeft} seconds remaining`}
                >
                  {roomState.timeLeft ?? ""}
                  <span className="text-sm font-normal text-sub">s</span>
                </span>
              </div>
            </div>

            {/* Player progress bars */}
            <div className="mb-6 rounded-xl bg-sub-alt/50 px-4 py-4">
              {roomState.players.map((p) => (
                <PlayerProgress
                  key={p.id}
                  player={p}
                  isSelf={p.id === socketId}
                  showStats={false}
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
              <div className="overflow-visible pt-6 text-xl leading-[1.75] sm:text-2xl">
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
    </Layout>
  );
};

export default MultiplayerPage;
