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
const TEST_DURATION = 60;

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
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION);
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
    const elapsedMinutes = (TEST_DURATION - timeLeft) / 60;

    if (!elapsedMinutes) {
      return 0;
    }

    return Math.round(totalTyped / 5 / elapsedMinutes);
  }, [timeLeft, totalTyped]);

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
    const currentWpm = Math.round((currentTotalTyped / 5) * (60 / elapsedSeconds));
    const currentAccuracy =
      currentTotalTyped > 0
        ? Math.round((totalCorrectRef.current / currentTotalTyped) * 100)
        : 0;

    setGraphData((previousData) => {
      const lastPoint = previousData[previousData.length - 1];

      if (lastPoint?.second === elapsedSeconds) {
        return previousData;
      }

      return [
        ...previousData,
        {
          second: elapsedSeconds,
          wpm: currentWpm,
          accuracy: currentAccuracy,
          chars: currentTotalTyped,
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
        const elapsedSeconds = TEST_DURATION - Math.max(0, nextTime);
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

    const elapsedSeconds = TEST_DURATION - timeLeft;
    appendGraphPoint(elapsedSeconds);
  }, [isFinished, totalTyped, timeLeft]);

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
    setTimeLeft(TEST_DURATION);
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
    <main className="min-h-screen bg-zinc-100">
      <div className="flex min-h-screen w-full flex-col gap-6 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">Typing Test</h1>
            <p className="mt-1 text-zinc-600">Type the text below before the timer ends.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-center shadow-sm">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Time</p>
              <p className="text-xl font-semibold text-zinc-900">{timeLeft}s</p>
            </div>
            <button
              type="button"
              onClick={handleRestart}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Restart
            </button>
          </div>
        </div>

        {isFinished && <TypingStats timeLeft={timeLeft} wpm={wpm} accuracy={accuracy} isFinished={isFinished} />}

        <div
          ref={typingBoxRef}
          tabIndex={0}
          onKeyDown={handleTyping}
          className="flex-1 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm outline-none ring-indigo-300 transition focus:ring-2"
        >
          <div className="h-full overflow-y-auto text-5xl leading-[1.6] text-zinc-700">
            <TypingPrompt text={currentText} userInput={userInput} />
          </div>
        </div>

        <TypingGraph data={graphData} showAfterComplete={isFinished} />

        <p className="text-sm text-zinc-600">
          {isFinished
            ? "Test finished. WPM, Accuracy, and Character graph are shown above."
            : "Click the large typing area and keep typing; results will appear after completion."}
        </p>
      </div>
    </main>
  );
};

export default HomePage;