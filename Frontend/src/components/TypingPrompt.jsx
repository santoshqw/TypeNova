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
  const scrollOffsetRef = useRef(0);

  const cursorIndex = Math.min(userInput.length, text.length);
  const typedText = text.slice(0, userInput.length);

  // 1. Fix: Reset charRefs when text changes to prevent stale element references
  if (prevTextRef.current !== text) {
    charRefs.current = [];
  }

  // Trigger slide-up animation when text passage changes & reset scroll offset
  useLayoutEffect(() => {
    if (prevTextRef.current !== text) {
      prevTextRef.current = text;
      scrollOffsetRef.current = 0;
      const el = slideRef.current;
      if (el) {
        el.style.transform = 'translateY(0px)';
        el.classList.remove("typing-slide-up");
        void el.offsetWidth; // Force reflow
        el.classList.add("typing-slide-up");
      }
    }
  }, [text]);

  // Direct DOM caret positioning + auto-scroll to keep focus on current line
  useLayoutEffect(() => {
    const caretElement = caretRef.current;
    const targetElement =
      cursorIndex === text.length ? endRef.current : charRefs.current[cursorIndex];
    const wrapper = slideRef.current;

    if (!targetElement || !caretElement) return;

    const x = targetElement.offsetLeft;
    const y = targetElement.offsetTop;
    const h = targetElement.offsetHeight || 32;
    const lineHeight = h;

    // Scroll: keep the caret on the first visible line (scroll once it passes line 1)
    const targetScrollOffset = Math.max(0, y - lineHeight);
    if (targetScrollOffset !== scrollOffsetRef.current) {
      scrollOffsetRef.current = targetScrollOffset;
      if (wrapper) {
        wrapper.style.transform = `translateY(-${targetScrollOffset}px)`;
      }
    }

    caretElement.style.transform = `translate(${x}px, ${y}px)`;
    caretElement.style.height = `${h}px`;
  }, [cursorIndex, text]);

  // Pause blink while typing
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
    if (element) {
      charRefs.current[index] = element;
    }
  }, []);

  return (
    <div ref={containerRef} className="typing-prompt relative select-none break-all sm:break-normal">
      <div ref={slideRef} className="typing-slide-wrapper relative">
        
        {/* Ghost text — The base layer */}
        <div className="typing-text-base whitespace-pre-wrap" style={{ color: 'var(--sub-color)' }}>
          {text.split("").map((character, index) => (
            <span
              key={`${text.slice(0, 5)}-${index}`} // Unique key per passage
              ref={(el) => setCharRef(el, index)}
              className="typing-char"
            >
              {character}
            </span>
          ))}
          <span ref={endRef} className="typing-char inline-block w-1" />
        </div>

        {/* Typed overlay — Matches the base layer perfectly */}
        <div className="typing-overlay absolute inset-0 whitespace-pre-wrap pointer-events-none" aria-hidden="true">
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
        </div>

        {/* Main Caret */}
        <span ref={caretRef} className="typing-caret absolute top-0 left-0 transition-transform duration-75 ease-out" />

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

const OpponentCaret = ({ charRefs, endRef, textLength, cursorIndex, username, color }) => {
  const caretEl = useRef(null);

  useLayoutEffect(() => {
    const el = caretEl.current;
    const target =
      cursorIndex >= textLength
        ? endRef.current
        : charRefs.current[cursorIndex];

    if (!el || !target) return;

    el.style.transform = `translate(${target.offsetLeft}px, ${target.offsetTop}px)`;
    el.style.height = `${target.offsetHeight || 32}px`;
  }, [cursorIndex, textLength]);

  return (
    <span
      ref={caretEl}
      className="opponent-caret absolute top-0 left-0 pointer-events-none z-10 transition-all duration-200"
      style={{ borderLeft: `2px solid ${color}`, width: '2px' }}
    >
      <span 
        className="opponent-label absolute bottom-full left-0 mb-1 px-1 text-[10px] whitespace-nowrap rounded text-white" 
        style={{ background: color }}
      >
        {username}
      </span>
    </span>
  );
};

export default TypingPrompt;