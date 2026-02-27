import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Layout from "../components/Layout";
import TypingGraph from "../components/TypingGraph";
import TypingPrompt from "../components/TypingPrompt";
import TypingStats from "../components/TypingStats";
import { RotateCw, AlertTriangle, MousePointer2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth.jsx";

const TEST_TEXTS = [
  "Typing fast is useful, but typing accurately is what actually makes you productive. Stay calm, keep a steady rhythm, and focus on every character.",
  "Build speed by reducing hesitation between words. Keep your eyes ahead, trust your fingers, and let your rhythm stay consistent.",
  "Great typing comes from smooth movement, not force. Press gently, recover quickly from mistakes, and stay relaxed through every line.",
  "Consistency beats short bursts. Keep a stable pace, breathe normally, and focus on finishing each sentence with clean accuracy.",
];

const DURATION_OPTIONS = [15, 30, 60, 120];

// Helper to count correct characters between typed and source
const countCorrectCharacters = (typedText, sourceText) => {
  return typedText.split("").reduce((total, character, index) => {
    return character === sourceText[index] ? total + 1 : total;
  }, 0);
};

const getInitialDuration = () => {
  const saved = localStorage.getItem("typenova-duration");
  const parsed = Number(saved);
  return DURATION_OPTIONS.includes(parsed) ? parsed : 30;
};

const HomePage = () => {
  const { user } = useAuth();
  // --- State ---
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [duration, setDuration] = useState(getInitialDuration);
  const [timeLeft, setTimeLeft] = useState(getInitialDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [graphData, setGraphData] = useState([]);
  const [completedTyped, setCompletedTyped] = useState(0);
  const [completedCorrect, setCompletedCorrect] = useState(0);
  const [capsLock, setCapsLock] = useState(false);
  const [restartSpin, setRestartSpin] = useState(false);
  const [isFocused, setIsFocused] = useState(true);

  // --- Refs for Real-time access in intervals ---
  const typingBoxRef = useRef(null);
  const totalTypedRef = useRef(0);
  const totalCorrectRef = useRef(0);

  const currentText = TEST_TEXTS[currentTextIndex];

  // --- Derived Metrics ---
  const currentCorrectCharacters = useMemo(
    () => countCorrectCharacters(userInput, currentText),
    [userInput, currentText]
  );

  const totalTyped = useMemo(() => completedTyped + userInput.length, [completedTyped, userInput.length]);
  
  const totalCorrect = useMemo(
    () => completedCorrect + currentCorrectCharacters,
    [completedCorrect, currentCorrectCharacters]
  );

  // MonkeyType-style WPM: (correct chars / 5) / minutes
  const wpm = useMemo(() => {
    const elapsedMinutes = (duration - timeLeft) / 60;
    if (elapsedMinutes <= 0) return 0;
    return Math.round((totalCorrect / 5) / elapsedMinutes);
  }, [timeLeft, totalCorrect, duration]);

  // MonkeyType-style Raw WPM: (all visible typed chars / 5) / minutes
  const rawWpm = useMemo(() => {
    const elapsedMinutes = (duration - timeLeft) / 60;
    if (elapsedMinutes <= 0) return 0;
    return Math.round((totalTyped / 5) / elapsedMinutes);
  }, [timeLeft, totalTyped, duration]);

  // Accuracy: correct / total visible typed chars
  const accuracy = useMemo(() => {
    if (totalTyped === 0) return 100;
    return Math.max(0, Math.round((totalCorrect / totalTyped) * 100));
  }, [totalCorrect, totalTyped]);

  // Sync Refs
  useEffect(() => {
    totalTypedRef.current = totalTyped;
    totalCorrectRef.current = totalCorrect;
  }, [totalTyped, totalCorrect]);

  // --- Logic Functions ---
  const appendGraphPoint = useCallback((elapsedSeconds) => {
    if (elapsedSeconds <= 0) return;

    const currentTotalTyped = totalTypedRef.current;
    const currentTotalCorrect = totalCorrectRef.current;

    const currentWpm = Math.round((currentTotalCorrect / 5) * (60 / elapsedSeconds));
    const currentRaw = Math.round((currentTotalTyped / 5) * (60 / elapsedSeconds));

    setGraphData((prev) => {
      const lastPoint = prev[prev.length - 1];
      if (lastPoint?.second === elapsedSeconds) return prev;

      const totalErrorsSoFar = currentTotalTyped - currentTotalCorrect;
      const prevTotalErrors = lastPoint ? lastPoint.totalErrors : 0;
      const errorsThisSecond = Math.max(0, totalErrorsSoFar - prevTotalErrors);

      return [
        ...prev,
        {
          second: elapsedSeconds,
          wpm: currentWpm,
          raw: currentRaw,
          errors: errorsThisSecond,
          totalErrors: totalErrorsSoFar,
        },
      ];
    });
  }, []);

  // Timer Interval
  useEffect(() => {
    if (!isRunning || isFinished) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsFinished(true);
          setIsRunning(false);
          return 0;
        }
        const nextTime = prev - 1;
        appendGraphPoint(duration - nextTime);
        return nextTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isFinished, duration, appendGraphPoint]);

  // Save test result to backend when test finishes
  const hasSavedRef = useRef(false);
  useEffect(() => {
    if (!isFinished) {
      hasSavedRef.current = false;
      return;
    }
    if (hasSavedRef.current || !user) return;
    hasSavedRef.current = true;
    const saveResult = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_URL || "";
        await fetch(`${API_BASE}/api/stats/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            wpm,
            rawWpm,
            accuracy,
            correct: totalCorrect,
            incorrect: totalTyped - totalCorrect,
            duration,
          }),
        });
      } catch {
        // silently fail — guest or network error
      }
    };
    saveResult();
  }, [isFinished, user, wpm, rawWpm, accuracy, totalCorrect, totalTyped, duration]);

  const handleTyping = (event) => {
    if (isFinished || event.key === "Tab") return;

    // Allow browser shortcuts (F5 refresh, Ctrl+R, etc.)
    if (event.key.startsWith("F") && event.key.length >= 2) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    event.preventDefault();


    if (event.key === "Backspace") {
      setUserInput((prev) => typeof prev === 'string' ? prev.slice(0, -1) : '');
      return;
    }

    // Ignore non-character keys
    if (event.key.length !== 1) return;

    if (!isRunning) setIsRunning(true);

    const safeUserInput = typeof userInput === 'string' ? userInput : '';
    const nextInput = (safeUserInput + event.key).slice(0, currentText.length);

    if (nextInput.length === currentText.length) {
      setCompletedTyped((prev) => prev + currentText.length);
      setCompletedCorrect((prev) => prev + countCorrectCharacters(nextInput, currentText));
      setCurrentTextIndex((prev) => (prev + 1) % TEST_TEXTS.length);
      setUserInput("");
    } else {
      setUserInput(nextInput);
    }
  };

  const handleRestart = useCallback((overrideDuration) => {
    // Defensive: ignore event objects
    let dur = duration;
    if (typeof overrideDuration === 'number') {
      dur = overrideDuration;
    }
    const randomIndex = Math.floor(Math.random() * TEST_TEXTS.length);
    setCurrentTextIndex(randomIndex);
    setUserInput("");
    setTimeLeft(dur);
    setIsRunning(false);
    setIsFinished(false); // Ensure typing area reappears
    setGraphData([]);
    setCompletedTyped(0);
    setCompletedCorrect(0);
    setRestartSpin(true);
    setTimeout(() => setRestartSpin(false), 400);
    setTimeout(() => typingBoxRef.current?.focus(), 0);
  }, [duration]);

  const handleDurationChange = (newDuration) => {
    setDuration(newDuration);
    localStorage.setItem("typenova-duration", newDuration);
    handleRestart(newDuration);
  };

  const handleKeyEvent = (event) => {
    setCapsLock(event.getModifierState?.("CapsLock") ?? false);
  };

  // Global Keyboard Listeners
  useEffect(() => {
    let tabPressed = false;
    const handleGlobalKey = (e) => {
      if (e.key === "Tab") {
        tabPressed = true;
        setTimeout(() => { tabPressed = false; }, 500);
      }
      if (e.key === "Enter" && tabPressed) {
        e.preventDefault();
        handleRestart();
      }
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, [handleRestart]);

  // Track focus state on the typing area
  useEffect(() => {
    if (isFinished) return;
    const box = typingBoxRef.current;
    if (!box) return;
    const onFocus = () => setIsFocused(true);
    const onBlur = () => setIsFocused(false);
    box.addEventListener("focus", onFocus);
    box.addEventListener("blur", onBlur);
    return () => {
      box.removeEventListener("focus", onFocus);
      box.removeEventListener("blur", onBlur);
    };
  }, [isFinished]);

  // Refocus on any keypress when unfocused
  useEffect(() => {
    if (isFinished || isFocused) return;
    const refocusOnKey = () => {
      typingBoxRef.current?.focus();
    };
    window.addEventListener("keydown", refocusOnKey);
    return () => window.removeEventListener("keydown", refocusOnKey);
  }, [isFinished, isFocused]);

  const restartButton = (
    <button
      type="button"
      onClick={handleRestart}
      className="nav-link"
      title="Restart test (Tab + Enter)"
    >
      <RotateCw className={`h-4 w-4 ${restartSpin ? "restart-icon-spin" : ""}`} />
    </button>
  );

  return (
    <Layout rightContent={restartButton} onLogoClick={handleRestart}>
      {/* Mode selector */}
      {!isRunning && !isFinished && (
        <div className="mb-4 flex items-center justify-center animate-fade-in">
          <div className="duration-selector">
            <span className="mr-1 px-2 text-xs text-sub">time</span>
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => handleDurationChange(opt)}
                className={`duration-btn ${duration === opt ? "active" : ""}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Timer */}
      {isRunning && !isFinished && (
        <div className="mb-2 flex items-baseline gap-4">
          <span className={`font-mono text-4xl font-bold tabular-nums sm:text-5xl ${timeLeft <= 5 ? "text-error" : "text-main"}`}>
            {timeLeft}
          </span>
        </div>
      )}

      {/* Results */}
      {isFinished && (
        <div className="mb-6 animate-fade-in">
          <TypingGraph data={graphData} showAfterComplete={isFinished} wpm={wpm} accuracy={accuracy} />
          <TypingStats
            time={duration}
            raw={rawWpm}
            correct={totalCorrect}
            incorrect={totalTyped - totalCorrect}
            extra={0}
            missed={0}
          />
        </div>
      )}

      {/* Typing area */}
      {!isFinished && (
        <div
          ref={typingBoxRef}
          tabIndex={0}
          onKeyDown={(e) => {
            handleKeyEvent(e);
            handleTyping(e);
          }}
          className="typing-area relative cursor-text rounded-lg py-4 outline-none"
        >
          {/* {(() => {
            // console.log('TypingPrompt props:', {
            //   currentText,
            //   userInput,
            //   currentTextType: typeof currentText,
            //   userInputType: typeof userInput,
            // });
            return null;
          })()} */}
          {(() => {
            if (typeof userInput !== 'string' || typeof currentText !== 'string') {
              console.error('userInput or currentText is not a string:', { userInput, currentText });
              return <div style={{color:'red'}}>Error: Invalid input state. Please reload the page.</div>;
            }
            return null;
          })()}
          <div className="overflow-hidden text-xl leading-[1.75] sm:text-2xl" style={{ maxHeight: '7.5em' }}>
            <TypingPrompt text={currentText} userInput={userInput} />
          </div>

          {/* Focus lost overlay */}
          {!isFocused && (
            <div
              className="focus-overlay"
              onClick={() => typingBoxRef.current?.focus()}
            >
              <div className="focus-overlay-content">
                <MousePointer2 className="h-5 w-5" />
                <span>Click here or press any key to focus</span>
              </div>
            </div>
          )}

          {capsLock && isRunning && (
            <div className="caps-warning mt-3 flex items-center gap-2 text-xs text-error">
              <AlertTriangle className="h-3.5 w-3.5" />
              Caps Lock is on
            </div>
          )}
        </div>
      )}

      {/* Bottom actions */}
      {isFinished && (
        <div className="mt-8 flex justify-center animate-fade-in">
          <button onClick={handleRestart} className="btn btn-secondary flex items-center gap-2">
            <RotateCw className={`h-4 w-4 ${restartSpin ? "restart-icon-spin" : ""}`} />
            Next Test
          </button>
        </div>
      )}
    </Layout>
  );
};

export default HomePage;