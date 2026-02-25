import React, { useEffect, useMemo, useRef, useState } from "react";
import TypingGraph from "../components/TypingGraph";
import TypingPrompt from "../components/TypingPrompt";
import TypingStats from "../components/TypingStats";

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
  const [duration, setDuration] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [graphData, setGraphData] = useState([]);
  const [completedTyped, setCompletedTyped] = useState(0);
  const [completedCorrect, setCompletedCorrect] = useState(0);
  const typingBoxRef = useRef(null);
  const totalTypedRef = useRef(0);
  const totalCorrectRef = useRef(0);

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

    return Math.round(totalTyped / 5 / elapsedMinutes);
  }, [timeLeft, totalTyped, duration]);

  const accuracy = useMemo(() => {
    if (!totalTyped) {
      return 0;
    }

    return Math.round((totalCorrect / totalTyped) * 100);
  }, [totalCorrect, totalTyped]);

  useEffect(() => {
    totalTypedRef.current = totalTyped;
    totalCorrectRef.current = totalCorrect;
  }, [totalTyped, totalCorrect]);

  const appendGraphPoint = (elapsedSeconds) => {
    if (elapsedSeconds <= 0) {
      return;
    }

    const currentTotalTyped = totalTypedRef.current;
    const currentTotalCorrect = totalCorrectRef.current;
    const currentErrors = currentTotalTyped - currentTotalCorrect;
    const currentWpm = Math.round((currentTotalCorrect / 5) * (60 / elapsedSeconds));
    const currentRaw = Math.round((currentTotalTyped / 5) * (60 / elapsedSeconds));
    const currentAccuracy =
      currentTotalTyped > 0
        ? Math.round((currentTotalCorrect / currentTotalTyped) * 100)
        : 0;

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
      setUserInput((previousInput) => previousInput.slice(0, -1));
      return;
    }

    if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    if (!isRunning) {
      setIsRunning(true);
    }

    setUserInput((previousInput) => {
      const nextInput = (previousInput + event.key).slice(0, currentText.length);

      if (nextInput.length === currentText.length) {
        setCompletedTyped((previousTotal) => previousTotal + currentText.length);
        setCompletedCorrect((previousTotal) => {
          const correctForPassage = countCorrectCharacters(nextInput, currentText);
          return previousTotal + correctForPassage;
        });
        setCurrentTextIndex((previousIndex) => (previousIndex + 1) % TEST_TEXTS.length);
        return "";
      }

      return nextInput;
    });
  };

  const handleRestart = () => {
    setCurrentTextIndex(0);
    setUserInput("");
    setTimeLeft(duration);
    setIsRunning(false);
    setIsFinished(false);
    setGraphData([]);
    setCompletedTyped(0);
    setCompletedCorrect(0);
    totalTypedRef.current = 0;
    totalCorrectRef.current = 0;
    typingBoxRef.current?.focus();
  };

  const handleDurationChange = (newDuration) => {
    setDuration(newDuration);
    setTimeLeft(newDuration);
    setCurrentTextIndex(0);
    setUserInput("");
    setIsRunning(false);
    setIsFinished(false);
    setGraphData([]);
    setCompletedTyped(0);
    setCompletedCorrect(0);
    totalTypedRef.current = 0;
    totalCorrectRef.current = 0;
    typingBoxRef.current?.focus();
  };

  return (
    <main className="flex min-h-screen flex-col" style={{ background: 'var(--bg-color)' }}>
      {/* ── Header ── */}
      <header className="mx-auto flex w-full max-w-[850px] items-center justify-between px-8 pt-8 pb-2">
        <div className="flex items-center gap-2 select-none">
          <svg className="h-7 w-7" style={{ color: 'var(--main-color)' }} viewBox="0 0 24 24" fill="currentColor">
            <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
          <span className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-color)' }}>
            type<span style={{ color: 'var(--main-color)' }}>nova</span>
          </span>
        </div>

        <nav className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleRestart}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors hover:opacity-80"
            style={{ color: 'var(--sub-color)' }}
            title="Restart test (Tab + Enter)"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.181-3.183" />
            </svg>
          </button>
        </nav>
      </header>

      {/* ── Main content ── */}
      <div className="mx-auto flex w-full max-w-[850px] flex-1 flex-col justify-center px-8">

        {/* ── Mode selector (only when not running / not finished) ── */}
        {!isRunning && !isFinished && (
          <div className="mb-4 flex items-center justify-center gap-2 animate-fade-in">
            <div
              className="flex items-center gap-1 rounded-lg px-3 py-2"
              style={{ background: 'var(--sub-alt-color)' }}
            >
              <span className="mr-2 text-xs" style={{ color: 'var(--sub-color)' }}>time</span>
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleDurationChange(opt)}
                  className="rounded-md px-3 py-1 text-sm font-medium transition-colors"
                  style={{
                    color: duration === opt ? 'var(--main-color)' : 'var(--sub-color)',
                    background: duration === opt ? 'var(--bg-color)' : 'transparent',
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Timer (visible when running) ── */}
        {isRunning && !isFinished && (
          <div className="mb-2">
            <span className="text-2xl font-semibold tabular-nums" style={{ color: 'var(--main-color)' }}>
              {timeLeft}
            </span>
          </div>
        )}

        {/* ── Results (after finish) ── */}
        {isFinished && (
          <div className="mb-6 animate-fade-in">
            <TypingStats
              wpm={wpm}
              accuracy={accuracy}
              time={duration}
              raw={rawWpm}
              characters={totalTyped}
            />
            <TypingGraph data={graphData} showAfterComplete={isFinished} />
          </div>
        )}

        {/* ── Typing area ── */}
        {!isFinished && (
          <div
            ref={typingBoxRef}
            tabIndex={0}
            onKeyDown={handleTyping}
            className="typing-area cursor-text rounded-lg py-4"
          >
            <div className="overflow-hidden text-2xl leading-[1.75]">
              <TypingPrompt text={currentText} userInput={userInput} />
            </div>
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
              className="group flex items-center gap-2.5 rounded-lg px-6 py-3 text-sm font-medium transition-all duration-200"
              style={{
                color: "var(--text-color)",
                background: "var(--sub-alt-color)",
                border: "1px solid rgba(100,102,105,0.12)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(226,183,20,0.1)";
                e.currentTarget.style.borderColor = "rgba(226,183,20,0.25)";
                e.currentTarget.style.color = "var(--main-color)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--sub-alt-color)";
                e.currentTarget.style.borderColor = "rgba(100,102,105,0.12)";
                e.currentTarget.style.color = "var(--text-color)";
              }}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.181-3.183" />
              </svg>
              Next Test
            </button>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="mx-auto w-full max-w-[850px] px-8 py-4">
        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--sub-color)' }}>
          <span>
            <kbd className="rounded px-1 py-0.5 text-[10px]" style={{ background: 'var(--sub-alt-color)', color: 'var(--sub-color)' }}>tab</kbd>
            {" + "}
            <kbd className="rounded px-1 py-0.5 text-[10px]" style={{ background: 'var(--sub-alt-color)', color: 'var(--sub-color)' }}>enter</kbd>
            {" - restart test"}
          </span>
        </div>
      </footer>
    </main>
  );
};

export default HomePage;