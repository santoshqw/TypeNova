
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Layout from "../components/Layout";
import TypingGraph from "../components/TypingGraph";
import TypingPrompt from "../components/TypingPrompt";
import TypingStats from "../components/TypingStats";
import { RotateCw, AlertTriangle, MousePointer2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth.jsx";


const FALLBACK_TEXTS = [
  "Typing fast is useful, but typing accurately is what actually makes you productive. Stay calm, keep a steady rhythm, and focus on every character.",
  "Build speed by reducing hesitation between words. Keep your eyes ahead, trust your fingers, and let your rhythm stay consistent.",
  "Great typing comes from smooth movement, not force. Press gently, recover quickly from mistakes, and stay relaxed through every line.",
  "Consistency beats short bursts. Keep a stable pace, breathe normally, and focus on finishing each sentence with clean accuracy.",
];

const DURATION_OPTIONS = [15, 30, 60, 120];


const countCorrectCharacters = (typedText, sourceText) =>
  [...typedText].reduce((total, char, i) => char === sourceText[i] ? total + 1 : total, 0);

const getInitialDuration = () => {
  const saved = localStorage.getItem("typenova-duration");
  const parsed = Number(saved);
  return DURATION_OPTIONS.includes(parsed) ? parsed : 30;
};


const HomePage = () => {
  const { user } = useAuth();
  const [typingTexts, setTypingTexts] = useState(FALLBACK_TEXTS);
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
  const [includePunctuation, setIncludePunctuation] = useState(false);
  const [includeSymbol, setIncludeSymbol] = useState(false);
  const [includeNumber, setIncludeNumber] = useState(false);
  const [visibleLines, setVisibleLines] = useState(3);


  // Utility to filter text based on options
  const filterText = useCallback((text) => {
    let filtered = text;
    if (!includePunctuation) {
      filtered = filtered.replace(/[.,!?;:'"()\[\]{}<>\-]/g, "");
    }
    if (!includeSymbol) {
      filtered = filtered.replace(/[~`@#$%^&*_+=|\\/]/g, "");
    }
    if (!includeNumber) {
      filtered = filtered.replace(/[0-9]/g, "");
    }
    // Remove double spaces from filtering
    filtered = filtered.replace(/  +/g, ' ');
    return filtered.trim();
  }, [includePunctuation, includeSymbol, includeNumber]);

  // Compute the current text based on options
  const currentText = useMemo(() => {
    const base = typingTexts[currentTextIndex] || "";
    return filterText(base);
  }, [typingTexts, currentTextIndex, filterText]);

  const getVisibleText = (fullText) => fullText;


  useEffect(() => {
    Promise.resolve().then(() => setVisibleLines(3));
  }, [currentTextIndex]);

  const typingBoxRef = useRef(null);
  const totalTypedRef = useRef(0);
  const totalCorrectRef = useRef(0);

  const currentCorrectCharacters = useMemo(
    () => countCorrectCharacters(userInput, currentText),
    [userInput, currentText]
  );

  const totalTyped = useMemo(() => completedTyped + userInput.length, [completedTyped, userInput.length]);
  
  const totalCorrect = useMemo(
    () => completedCorrect + currentCorrectCharacters,
    [completedCorrect, currentCorrectCharacters]
  );

  const wpm = useMemo(() => {
    const elapsedMinutes = (duration - timeLeft) / 60;
    if (elapsedMinutes <= 0) return 0;
    return Math.round((totalCorrect / 5) / elapsedMinutes);
  }, [timeLeft, totalCorrect, duration]);

  const rawWpm = useMemo(() => {
    const elapsedMinutes = (duration - timeLeft) / 60;
    if (elapsedMinutes <= 0) return 0;
    return Math.round((totalTyped / 5) / elapsedMinutes);
  }, [timeLeft, totalTyped, duration]);

  const accuracy = useMemo(() => {
    if (totalTyped === 0) return 100;
    return Math.max(0, Math.round((totalCorrect / totalTyped) * 100));
  }, [totalCorrect, totalTyped]);


  useEffect(() => {
    totalTypedRef.current = totalTyped;
    totalCorrectRef.current = totalCorrect;
  }, [totalTyped, totalCorrect]);

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


  useEffect(() => {
    const fetchTexts = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_URL || "";
        const res = await fetch(`${API_BASE}/api/typing-text/list`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
          const data = await res.json();
          // ...existing code...
          if (Array.isArray(data) && data.length > 0) {
            setTypingTexts(data.map(t => t.text || ""));
          }
        } else {
          // ...existing code...
        }
      } catch {
        // silently fail
      }
    };
    fetchTexts();
  }, []);

  const handleTyping = (event) => {
    if (isFinished || event.key === "Tab") return;
    if (event.key.startsWith("F") && event.key.length >= 2) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    event.preventDefault();
    if (event.key === "Backspace") {
      setUserInput((prev) => prev.slice(0, -1));
      return;
    }
    if (event.key.length !== 1) return;
    if (!isRunning) setIsRunning(true);
    const nextInput = (userInput + event.key).slice(0, currentText.length);
    if (nextInput.length === currentText.length) {
      setCompletedTyped((prev) => prev + currentText.length);
      setCompletedCorrect((prev) => prev + countCorrectCharacters(nextInput, currentText));
      setCurrentTextIndex((prev) => (prev + 1) % typingTexts.length);
      setUserInput("");
    } else {
      setUserInput(nextInput);
    }
  };



  const handleRestart = useCallback((overrideDuration) => {
    const dur = typeof overrideDuration === 'number' ? overrideDuration : duration;
    setCurrentTextIndex(Math.floor(Math.random() * typingTexts.length));
    setUserInput("");
    setTimeLeft(dur);
    setIsRunning(false);
    setIsFinished(false);
    setGraphData([]);
    setCompletedTyped(0);
    setCompletedCorrect(0);
    setRestartSpin(true);
    setTimeout(() => setRestartSpin(false), 400);
    setTimeout(() => {
      typingBoxRef.current?.focus();
      setIsFocused(true);
    }, 0);
  }, [duration, typingTexts.length]);

  // When options change, reset typing state and re-filter text
  useEffect(() => {
    setUserInput("");
    setIsRunning(false);
    setIsFinished(false);
    setGraphData([]);
    setCompletedTyped(0);
    setCompletedCorrect(0);
    // Optionally, pick a new random text or keep the same index
    // setCurrentTextIndex(Math.floor(Math.random() * typingTexts.length));
  }, [includePunctuation, includeSymbol, includeNumber, typingTexts, currentTextIndex]);

  const handleDurationChange = (newDuration) => {
    setDuration(newDuration);
    localStorage.setItem("typenova-duration", newDuration);
    handleRestart(newDuration);
  };


  const handleKeyEvent = (event) => setCapsLock(event.getModifierState?.("CapsLock") ?? false);

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

  useEffect(() => {
    if (!isFinished && typingBoxRef.current) {
      typingBoxRef.current.focus();
    }
  }, [isFinished, isRunning, currentTextIndex]);

  useEffect(() => {
    if (isFinished) return;
    function handleDocumentClick(e) {
      // If click is on a button, input, textarea, select, or contenteditable, do not refocus
      const tag = e.target.tagName;
      const isInteractive = ["BUTTON", "INPUT", "TEXTAREA", "SELECT", "A"].includes(tag) || e.target.isContentEditable;
      if (!isInteractive && typingBoxRef.current && document.activeElement !== typingBoxRef.current) {
        typingBoxRef.current.focus();
      }
    }
    document.addEventListener("mousedown", handleDocumentClick, true);
    return () => document.removeEventListener("mousedown", handleDocumentClick, true);
  }, [isFinished]);

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


  useEffect(() => {
    if (isFinished || isFocused) return;
    const refocusOnKey = () => typingBoxRef.current?.focus();
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
      {!isRunning && !isFinished && (
        <>
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
          <div className="mb-4 flex items-center justify-center gap-6 animate-fade-in">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includePunctuation}
                onChange={e => setIncludePunctuation(e.target.checked)}
              />
              <span className="text-sm">Punctuation</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSymbol}
                onChange={e => setIncludeSymbol(e.target.checked)}
              />
              <span className="text-sm">Symbol</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeNumber}
                onChange={e => setIncludeNumber(e.target.checked)}
              />
              <span className="text-sm">Number</span>
            </label>
          </div>
        </>
      )}

      {isRunning && !isFinished && (
        <div className="mb-2 flex items-baseline gap-4">
          <span className={`font-mono text-4xl font-bold tabular-nums sm:text-5xl ${timeLeft <= 5 ? "text-error" : "text-main"}`}>
            {timeLeft}
          </span>
        </div>
      )}

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

      {!isFinished && (
        <div
          ref={typingBoxRef}
          tabIndex={0}
          autoFocus
          onKeyDown={(e) => {
            handleKeyEvent(e);
            handleTyping(e);
          }}
          onClick={() => typingBoxRef.current?.focus()}
          className="typing-area relative cursor-text rounded-lg py-4 outline-none"
        >
          {(() => {
            if (typeof userInput !== 'string' || typeof currentText !== 'string') {
              console.error('userInput or currentText is not a string:', { userInput, currentText });
              return <div style={{color:'red'}}>Error: Invalid input state. Please reload the page.</div>;
            }
            return null;
          })()}
          <div
            className="overflow-hidden text-xl leading-[1.75] sm:text-2xl"
            style={{ maxHeight: `${visibleLines * 1.75}em`, transition: 'max-height 0.2s' }}
          >
            <TypingPrompt
              text={getVisibleText(currentText)}
              userInput={userInput}
              animate={isRunning && !isFinished}
            />
          </div>

          {isRunning && !isFocused && (
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

        </div>
      )}

      {/* Reset scroll position when finished */}
      {isFinished && (
        <script dangerouslySetInnerHTML={{__html: 'window.scrollTo(0,0);'}} />
      )}

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