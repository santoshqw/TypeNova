import React from "react";
import confetti from "canvas-confetti";

export default function ConfettiExplosion({ trigger }) {
  React.useEffect(() => {
    if (trigger) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.7 },
        zIndex: 9999,
      });
    }
  }, [trigger]);
  return null;
}
