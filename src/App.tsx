import "./index.css";
import { useState, useMemo } from "react";
import Header from "./Header";
import GradientBox from "./components/GradientBox";

export interface OklchState {
  l: number;
  c: number;
  h: number;
}

interface PredictResponse {
  status: string;
  mode: "oklch";
  input_oklch: [number, number, number];
  palette_hex: string[];
  palette_oklch: [number, number, number][];
}

const arrToOklch = ([l, c, h]: [number, number, number]): OklchState => ({ l, c, h });

const toStr = (col: OklchState) => `oklch(${(col.l * 100).toFixed(0)}% ${col.c.toFixed(3)} ${col.h})`;

export function App() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  const [colorM, setColorM] = useState<OklchState>({ l: 0.92, c: 0.141, h: 252 });
  const accentM = useMemo(() => toStr(colorM), [colorM]);

  const [palette, setPalette] = useState<OklchState[]>([]);

  const handlePredict = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/predict?oklch=${colorM.l},${colorM.c},${colorM.h}`
      );
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get prediction data");
      }
  
      const result: PredictResponse = await response.json();
  
      // palette_oklch → OklchState[]
      const nextPalette = result.palette_oklch.map(arrToOklch);
      setPalette(nextPalette);
  
      console.log("Prediction data fetched successfully:", nextPalette);
    } catch (error) {
      console.error("Error fetching prediction data:", error);
    }
  };

  const paletteStr = useMemo(
    () => palette.map(toStr),
    [palette]
  );

  const gradientPairs: [number, number][] = [
    [0, 2], // 1 & 3
    [3, 5], // 4 & 6
    [6, 8], // 7 & 9
  ];

  return (
    <div className={`duration-600 ${ isDarkMode? "bg-black" : "" }`}>
      <Header
        colorM={colorM}
        setColorM={setColorM}
        accentM={accentM}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        handlePredict={handlePredict}
      />

      <div className="max-w-120 md:max-w-240 xl:max-w-375 mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 xl:gap-16">
        {gradientPairs.map(([a, b], i) => {
          const colorA = palette[a];
          const colorB = palette[b];
          const accentA = paletteStr[a];
          const accentB = paletteStr[b];

          if (!colorA || !colorB) return null;
          if (!accentA || !accentB) return null;

          return (
            <GradientBox
              key={i}
              colorA={colorA}
              colorB={colorB}
              accentA={accentA}
              accentB={accentB}
              isDarkMode={isDarkMode}
              toStr={toStr}
            />
          );
        })}
      </div>
    </div>
  );
}

export default App;
