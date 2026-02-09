import "./index.css";
import { useState, useMemo } from "react";
import Header from "./Header";

export interface OklchState {
  l: number;
  c: number;
  h: number;
}

const toStr = (col: OklchState) => `oklch(${(col.l * 100).toFixed(0)}% ${col.c.toFixed(3)} ${col.h})`;

const getMidColor = (colorA: OklchState, colorB: OklchState): OklchState => {
  let h1 = colorA.h;
  let h2 = colorB.h;

  let diff = h2 - h1;
  if (diff > 180) {
    h2 -= 360;
  } else if (diff < -180) {
    h2 += 360;
  }

  let hMid = (h1 + h2) / 2;
  // Ensure the result returns to the positive range of 0-360
  hMid = (hMid + 360) % 360;

  return { l: (colorA.l + colorB.l) / 2, c: (colorA.c + colorB.c) / 2, h: hMid };
};

export function App() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  const [colorM, setColorM] = useState<OklchState>({ l: 0.92, c: 0.141, h: 252 });
  const accentM = useMemo(() => toStr(colorM), [colorM]);

  return (
    <div className={`duration-600 ${ isDarkMode? "bg-black" : "" }`}>
      <Header
        colorM={colorM}
        setColorM={setColorM}
        accentM={accentM}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />


    </div>
  );
}

export default App;
