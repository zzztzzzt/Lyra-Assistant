import { useState, useRef, useEffect, memo } from "react";

// Handles smooth typing effects
const TypewriterMessage = memo(({ content }: { content: string }) => {
  const [visibleChars, setVisibleChars] = useState<string[]>([]);
  const index = useRef(0);

  useEffect(() => {
    setVisibleChars([]);
    index.current = 0;

    const timer = setInterval(() => {
      if (index.current < content.length) {
        const nextChar = content.charAt(index.current);
        setVisibleChars((prev) => [...prev, nextChar]);
        index.current += 1;
      } else {
        clearInterval(timer);
      }
    }, 5);

    return () => clearInterval(timer);
  }, [content]);

  return (
    <span>
      {visibleChars.map((char, i) => (
        <span 
          key={i} 
          className="animate-char"
        >
          {char === "\n" ? <br /> : char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
});

export default TypewriterMessage;
