import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Layout from "../components/Layout";
import TypingGraph from "../components/TypingGraph";
import TypingPrompt from "../components/TypingPrompt";
import TypingStats from "../components/TypingStats";
import { RotateCw, AlertTriangle } from "lucide-react";

const TEST_TEXTS = [
  "Typing fast is useful, but typing accurately is what actually makes you productive. Stay calm, keep a steady rhythm, and focus on every character.",
  "Build speed by reducing hesitation between words. Keep your eyes ahead, trust your fingers, and let your rhythm stay consistent.",
  "Great typing comes from smooth movement, not force. Press gently, recover quickly from mistakes, and stay relaxed through every line.",
  "Consistency beats short bursts. Keep a stable pace, breathe normally, and focus on finishing each sentence with clean accuracy.",
];
const DURATION_OPTIONS = [15, 30, 60, 120];

const countCorrectCharacters = (typedText, sourceText) => {
  return typedText.split("").reduce((total, character, index) => {
    if (character === sourceText[index]) {
      return total + 1;
    }

    return total;
  }, 0);
};

const HomePage = () => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [duration, setDuration] = useState(30);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [graphData, setGraphData] = useState([]);
  const [completedTyped, setCompletedTyped] = useState(0);
  const [completedCorrect, setCompletedCorrect] = useState(0);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [capsLock, setCapsLock] = useState(false);
  const [restartSpin, setRestartSpin] = useState(false);
  const typingBoxRef = useRef(null);
  const totalTypedRef = useRef(0);
  const totalCorrectRef = useRef(0);
  const totalKeystrokesRef = useRef(0);
  const totalMistakesRef = useRef(0);
  const userInputRef = useRef("");

  const currentText = TEST_TEXTS[currentTextIndex];

  useEffect(() => {
    typingBoxRef.current?.focus();
  }, []);

  
  const currentCorrectCharacters = useMemo(
    () => countCorrectCharacters(userInput, currentText),
    [userInput, currentText],
  );

  const totalTyped = useMemo(() => completedTyped + userInput.length, [completedTyped, userInput.length]);
  const totalCorrect = useMemo(
    () => completedCorrect + currentCorrectCharacters,
    [completedCorrect, currentCorrectCharacters],
  );

  const wpm = useMemo(() => {
    const elapsedMinutes = (duration - timeLeft) / 60;

    if (!elapsedMinutes) {
      return 0;
    }

    return Math.round(totalCorrect / 5 / elapsedMinutes);
  }, [timeLeft, totalCorrect, duration]);

  const rawWpm = useMemo(() => {
    const elapsedMinutes = (duration - timeLeft) / 60;

    if (!elapsedMinutes) {
      return 0;
    }

    return Math.round(totalKeystrokes / 5 / elapsedMinutes);
  }, [timeLeft, totalKeystrokes, duration]);

  const accuracy = useMemo(() => {
    if (!totalKeystrokes) {
      return 100;
    }

    return Math.min(
      100,
      Math.round(((totalKeystrokes - totalMistakes) / totalKeystrokes) * 100),
    );
  }, [totalKeystrokes, totalMistakes]);

  useEffect(() => {
    totalTypedRef.current = totalTyped;
    totalCorrectRef.current = totalCorrect;
  }, [totalTyped, totalCorrect]);

  useEffect(() => {
    totalKeystrokesRef.current = totalKeystrokes;
    totalMistakesRef.current = totalMistakes;
  }, [totalKeystrokes, totalMistakes]);

  const appendGraphPoint = (elapsedSeconds) => {
    if (elapsedSeconds <= 0) {
      return;
    }

    const currentTotalTyped = totalTypedRef.current;
    const currentTotalCorrect = totalCorrectRef.current;
    const currentKeystrokes = totalKeystrokesRef.current;
    const currentMistakes = totalMistakesRef.current;
    const currentErrors = currentTotalTyped - currentTotalCorrect;
    const currentWpm = Math.round((currentTotalCorrect / 5) * (60 / elapsedSeconds));
    const currentRaw = Math.round((currentKeystrokes / 5) * (60 / elapsedSeconds));
    const currentAccuracy =
      currentKeystrokes > 0
        ? Math.round(((currentKeystrokes - currentMistakes) / currentKeystrokes) * 100)
        : 100;

    setGraphData((previousData) => {
      const lastPoint = previousData[previousData.length - 1];

      if (lastPoint?.second === elapsedSeconds) {
        return previousData;
      }

      const prevErrors = lastPoint ? lastPoint.totalErrors : 0;
      const errorsThisSecond = Math.max(0, currentErrors - prevErrors);

      return [
        ...previousData,
        {
          second: elapsedSeconds,
          wpm: currentWpm,
          raw: currentRaw,
          accuracy: currentAccuracy,
          errors: errorsThisSecond,
          totalErrors: currentErrors,
        },
      ];
    });
  };

  useEffect(() => {
    if (!isRunning || isFinished) {
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((previousTime) => {
        const nextTime = previousTime - 1;
        const elapsedSeconds = duration - Math.max(0, nextTime);
        appendGraphPoint(elapsedSeconds);

        if (previousTime <= 1) {
          clearInterval(interval);
          setIsFinished(true);
          setIsRunning(false);
          return 0;
        }

        return nextTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isFinished]);

  useEffect(() => {
    if (!isFinished || !totalTyped) {
      return;
    }

    const elapsedSeconds = duration - timeLeft;
    appendGraphPoint(elapsedSeconds);
  }, [isFinished, totalTyped, timeLeft, duration]);

  const handleTyping = (event) => {
    if (isFinished) {
      return;
    }

    if (event.key === "Tab") {
      return;
    }

    event.preventDefault();

    if (event.key === "Backspace") {
      setUserInput((previousInput) => {
        const newInput = previousInput.slice(0, -1);
        userInputRef.current = newInput;
        return newInput;
      });
      return;
    }

    if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    if (!isRunning) {
      setIsRunning(true);
    }

    // Track every keystroke for true accuracy & raw WPM
    const cursorPos = userInputRef.current.length;
    totalKeystrokesRef.current += 1;
    setTotalKeystrokes((prev) => prev + 1);

    if (event.key !== currentText[cursorPos]) {
      totalMistakesRef.current += 1;
      setTotalMistakes((prev) => prev + 1);
    }

    setUserInput((previousInput) => {
      const nextInput = (previousInput + event.key).slice(0, currentText.length);

      if (nextInput.length === currentText.length) {
        userInputRef.current = "";
        setCompletedTyped((previousTotal) => previousTotal + currentText.length);
        setCompletedCorrect((previousTotal) => {
          const correctForPassage = countCorrectCharacters(nextInput, currentText);
          return previousTotal + correctForPassage;
        });
        setCurrentTextIndex((previousIndex) => (previousIndex + 1) % TEST_TEXTS.length);
        return "";
      }

      userInputRef.current = nextInput;
      return nextInput;
    });
  };

  const handleRestart = useCallback(() => {
    setCurrentTextIndex((prev) => {
      let next;
      do { next = Math.floor(Math.random() * TEST_TEXTS.length); } while (next === prev && TEST_TEXTS.length > 1);
      return next;
    });
    setUserInput("");
    setTimeLeft(duration);
    setIsRunning(false);
    setIsFinished(false);
    setGraphData([]);
    setCompletedTyped(0);
    setCompletedCorrect(0);
    setTotalKeystrokes(0);
    setTotalMistakes(0);
    totalTypedRef.current = 0;
    totalCorrectRef.current = 0;
    totalKeystrokesRef.current = 0;
    totalMistakesRef.current = 0;
    userInputRef.current = "";
    setRestartSpin(true);
    setTimeout(() => setRestartSpin(false), 400);
    typingBoxRef.current?.focus();
  }, [duration]);

  const handleDurationChange = (newDuration) => {
    setDuration(newDuration);
    setTimeLeft(newDuration);
    setCurrentTextIndex((prev) => {
      let next;
      do { next = Math.floor(Math.random() * TEST_TEXTS.length); } while (next === prev && TEST_TEXTS.length > 1);
      return next;
    });
    setUserInput("");
    setIsRunning(false);
    setIsFinished(false);
    setGraphData([]);
    setCompletedTyped(0);
    setCompletedCorrect(0);
    setTotalKeystrokes(0);
    setTotalMistakes(0);
    totalTypedRef.current = 0;
    totalCorrectRef.current = 0;
    totalKeystrokesRef.current = 0;
    totalMistakesRef.current = 0;
    userInputRef.current = "";
    typingBoxRef.current?.focus();
  };

  // Live WPM for display while typing
  const liveWpm = useMemo(() => {
    if (!isRunning || isFinished) return 0;
    const elapsed = (duration - timeLeft) / 60;
    if (!elapsed) return 0;
    return Math.round(totalCorrect / 5 / elapsed);
  }, [isRunning, isFinished, duration, timeLeft, totalCorrect]);

  // Capslock detection
  const handleKeyEvent = (event) => {
    setCapsLock(event.getModifierState?.("CapsLock") ?? false);
  };

  // Tab+Enter global restart
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
        tabPressed = false;
      }
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, [handleRestart]);

  /* ── Restart button for navbar ── */
  const restartButton = (
    <button
      type="button"
      onClick={handleRestart}
      className="nav-link"
      title="Restart test (Tab + Enter)"
      aria-label="Restart test"
    >
      <RotateCw className={`h-4 w-4 ${restartSpin ? "restart-icon-spin" : ""}`} />
    </button>
  );

  return (
    <Layout rightContent={restartButton} onLogoClick={handleRestart}>
      {/* ── Mode selector (only when not running / not finished) ── */}
      {!isRunning && !isFinished && (
        <div className="mb-4 flex items-center justify-center animate-fade-in">
          <div className="duration-selector">
            <span className="mr-1 px-2 text-xs text-sub">time</span>
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => handleDurationChange(opt)}
                className={`duration-btn ${duration === opt ? "active" : ""}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Timer (always visible while typing, red in last 5s) ── */}
      {isRunning && !isFinished && (
        <div className="mb-2 flex items-baseline gap-4">
          <span
            className={`font-mono text-4xl font-bold tabular-nums sm:text-5xl ${
              timeLeft <= 5 ? "text-error timer-urgent" : "text-main"
            }`}
            role="timer"
            aria-label={`${timeLeft} seconds remaining`}
          >
            {timeLeft}
          </span>
        </div>
      )}

      {/* ── Results (after finish) ── */}
      {isFinished && (
        <div className="mb-6 animate-fade-in">
          <TypingGraph data={graphData} showAfterComplete={isFinished} wpm={wpm} accuracy={accuracy} />
          <TypingStats
            time={duration}
            raw={rawWpm}
            correct={totalCorrect}
            incorrect={totalTyped - totalCorrect}
            extra={totalKeystrokes - totalTyped}
            missed={0}
          />
        </div>
      )}

      {/* ── Typing area ── */}
      {!isFinished && (
        <div
          ref={typingBoxRef}
          tabIndex={0}
          onKeyDown={(e) => {
            handleKeyEvent(e);
            handleTyping(e);
          }}
          className="typing-area relative cursor-text rounded-lg py-4"
          role="textbox"
          aria-label="Typing area"
        >
          <div className="overflow-hidden text-xl leading-[1.75] sm:text-2xl">
            <TypingPrompt text={currentText} userInput={userInput} />
          </div>

          {/* Capslock warning */}
          {capsLock && isRunning && (
            <div className="caps-warning mt-3 flex items-center gap-2 text-xs text-error">
              <AlertTriangle className="h-3.5 w-3.5" />
              Caps Lock is on
            </div>
          )}
        </div>
      )}

      {/* ── Bottom actions ── */}
      {isFinished && (
        <div
          className="mt-8 flex justify-center animate-fade-in"
          style={{ animationDelay: "400ms", opacity: 0 }}
        >
          <button
            type="button"
            onClick={handleRestart}
            className="btn btn-secondary"
          >
            <RotateCw className={`h-4 w-4 ${restartSpin ? "restart-icon-spin" : ""}`} />
            Next Test
          </button>
        </div>
      )}
    </Layout>
  );
};

export default HomePage;