import React, { useCallback, useLayoutEffect, useRef, useEffect } from "react";

const OPPONENT_COLORS = [
  "#e06c75",
  "#61afef",
  "#c678dd",
  "#56b6c2",
];

const TypingPrompt = ({ text, userInput, opponents = [] }) => {
  const containerRef = useRef(null);
  const endRef = useRef(null);
  const charRefs = useRef([]);
  const caretRef = useRef(null);
  const blinkTimeoutRef = useRef(null);
  const slideRef = useRef(null);
  const prevTextRef = useRef(text);

  const cursorIndex = Math.min(userInput.length, text.length);
  const typedText = text.slice(0, userInput.length);

  // Trigger slide-up animation when text passage changes
  useLayoutEffect(() => {
    if (prevTextRef.current !== text) {
      prevTextRef.current = text;
      const el = slideRef.current;
      if (el) {
        el.classList.remove("typing-slide-up");
        // Force reflow to restart animation
        void el.offsetWidth;
        el.classList.add("typing-slide-up");
      }
    }
  }, [text]);

  // Direct DOM caret positioning — no setState, no extra re-render
  useLayoutEffect(() => {
    const containerElement = containerRef.current;
    const caretElement = caretRef.current;
    const targetElement =
      cursorIndex === text.length ? endRef.current : charRefs.current[cursorIndex];

    if (!containerElement || !targetElement || !caretElement) {
      return;
    }

    const x = targetElement.offsetLeft;
    const y = targetElement.offsetTop;
    const h = targetElement.offsetHeight || 40;

    caretElement.style.transform = `translate(${x}px, ${y}px)`;
    caretElement.style.height = `${h}px`;
  }, [cursorIndex, text]);

  // Pause blink while typing — restart after 500ms idle
  useEffect(() => {
    const caret = caretRef.current;
    if (!caret) return;

    caret.classList.add("typing-active");

    clearTimeout(blinkTimeoutRef.current);
    blinkTimeoutRef.current = setTimeout(() => {
      caret.classList.remove("typing-active");
    }, 500);

    return () => clearTimeout(blinkTimeoutRef.current);
  }, [userInput]);

  const setCharRef = useCallback((element, index) => {
    charRefs.current[index] = element;
  }, []);

  return (
    <div ref={containerRef} className="typing-prompt relative select-none">
      <div ref={slideRef} className="typing-slide-wrapper">
        {/* Ghost text — untyped characters in sub color */}
        <p style={{ color: 'var(--sub-color)' }}>
          {text.split("").map((character, index) => (
            <span
              key={index}
              ref={(el) => setCharRef(el, index)}
              className="typing-char"
            >
              {character}
            </span>
          ))}
          <span ref={endRef} className="typing-char" />
        </p>

        {/* Typed overlay */}
        <p className="typing-overlay absolute inset-0" aria-hidden="true">
          {typedText.split("").map((character, index) => {
            const isWrong = userInput[index] !== text[index];

            return (
              <span
                key={index}
                className="typing-char"
                style={{ color: isWrong ? 'var(--error-color)' : 'var(--text-color)' }}
              >
                {character}
              </span>
            );
          })}
        </p>

        {/* Caret — positioned via ref, no state re-render */}
        <span ref={caretRef} className="typing-caret" />

        {/* Opponent cursors */}
        {opponents.map((opp, i) => (
          <OpponentCaret
            key={opp.id}
            charRefs={charRefs}
            endRef={endRef}
            textLength={text.length}
            cursorIndex={Math.min(opp.cursorIndex || 0, text.length)}
            username={opp.username}
            color={OPPONENT_COLORS[i % OPPONENT_COLORS.length]}
          />
        ))}
      </div>
    </div>
  );
};

/* ── Opponent caret rendered via direct DOM positioning ── */
const OpponentCaret = ({ charRefs, endRef, textLength, cursorIndex, username, color }) => {
  const caretEl = useRef(null);

  useLayoutEffect(() => {
    const el = caretEl.current;
    const target =
      cursorIndex >= textLength
        ? endRef.current
        : charRefs.current?.[cursorIndex];

    if (!el || !target) return;

    el.style.transform = `translate(${target.offsetLeft}px, ${target.offsetTop}px)`;
    el.style.height = `${target.offsetHeight || 40}px`;
  }, [cursorIndex, textLength, charRefs, endRef]);

  return (
    <span
      ref={caretEl}
      className="opponent-caret"
      style={{ background: color }}
    >
      <span className="opponent-label" style={{ background: color }}>
        {username}
      </span>
    </span>
  );
};

export default TypingPrompt;