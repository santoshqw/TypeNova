import React, { useLayoutEffect, useRef, useState } from "react";

const TypingPrompt = ({ text, userInput }) => {
  const containerRef = useRef(null);
  const endRef = useRef(null);
  const charRefs = useRef([]);
  const [caretPosition, setCaretPosition] = useState({ x: 0, y: 0, height: 40 });

  const cursorIndex = Math.min(userInput.length, text.length);
  const typedText = text.slice(0, userInput.length);

  useLayoutEffect(() => {
    const containerElement = containerRef.current;
    const targetElement =
      cursorIndex === text.length ? endRef.current : charRefs.current[cursorIndex];

    if (!containerElement || !targetElement) {
      return;
    }

    setCaretPosition({
      x: targetElement.offsetLeft,
      y: targetElement.offsetTop,
      height: targetElement.offsetHeight || 40,
    });
  }, [cursorIndex, text]);

  return (
    <div ref={containerRef} className="typing-prompt relative select-none">
      {/* Ghost text — untyped characters in sub color */}
      <p style={{ color: 'var(--sub-color)' }}>
        {text.split("").map((character, index) => (
          <span
            key={`${character}-${index}`}
            ref={(element) => {
              charRefs.current[index] = element;
            }}
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
              key={`${character}-${index}`}
              className="typing-char"
              style={{ color: isWrong ? 'var(--error-color)' : 'var(--text-color)' }}
            >
              {character}
            </span>
          );
        })}
      </p>

      {/* Caret */}
      <span
        className="typing-caret"
        style={{
          transform: `translate(${caretPosition.x}px, ${caretPosition.y}px)`,
          height: `${caretPosition.height}px`,
        }}
      />
    </div>
  );
};

export default TypingPrompt;