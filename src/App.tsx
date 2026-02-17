import "./index.css";
import { useState, useMemo } from "react";
import Header from "./Header";
import ModePanel from "./components/ModePanel";
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
  boldness: number;
}

const arrToOklch = ([l, c, h]: [number, number, number]): OklchState => ({ l, c, h });

const toStr = (col: OklchState) => `oklch(${(col.l * 100).toFixed(0)}% ${col.c.toFixed(3)} ${col.h})`;

type GradientPair = {
  colorA: OklchState;
  colorB: OklchState;
  hexA: string;
  hexB: string;
};

const pairIndices: [number, number][] = [
  [0, 2], // 1 & 3
  [3, 5], // 4 & 6
  [6, 8], // 7 & 9
];

export function App() {
  const [isModePanelOpen, setisModePanelOpen] = useState<boolean>(false);
  const [isDefaultMode, setIsDefaultMode] = useState<boolean>(true);
  const [isCircularMode, setIsCircularMode] = useState<boolean>(false);
  const [isClipMode, setIsClipMode] = useState<boolean>(false);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  const [colorM, setColorM] = useState<OklchState>({ l: 0.92, c: 0.141, h: 252 });
  const accentM = useMemo(() => toStr(colorM), [colorM]);

  const [palette, setPalette] = useState<OklchState[]>([]);
  const [hexPalette, setHexPalette] = useState<string[]>([]);

  const fetchPrediction = async (color: OklchState): Promise<PredictResponse> => {
    const response = await fetch(
      `http://localhost:8000/api/predict?oklch=${color.l},${color.c},${color.h}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to get prediction data");
    }

    return response.json();
  };

  const buildPairs = (colors: OklchState[], hexes: string[]): GradientPair[] => {
    const pairs: GradientPair[] = [];

    for (const [a, b] of pairIndices) {
      const colorA = colors[a];
      const colorB = colors[b];
      const hexA = hexes[a];
      const hexB = hexes[b];

      if (!colorA || !colorB || !hexA || !hexB) continue;

      pairs.push({ colorA, colorB, hexA, hexB });
    }

    return pairs;
  };

  const handlePredict = async () => {
    try {
      // First fetch: build the original 3 pairs from 1/3, 4/6, 7/9
      const firstResult = await fetchPrediction(colorM);
      const firstPalette = firstResult.palette_oklch.map(arrToOklch);
      const firstHexPalette = firstResult.palette_hex;

      // Seeds are the 2nd, 5th, 8th colors (indices 1, 4, 7)
      const seeds = [1, 4, 7]
        .map((index) => firstPalette[index])
        .filter((seed): seed is OklchState => Boolean(seed));

      // Second fetches: each seed returns another 9-color palette -> 3 pairs each
      const secondResults = await Promise.all(seeds.map((seed) => fetchPrediction(seed)));

      const allPairs: GradientPair[] = [
        ...buildPairs(firstPalette, firstHexPalette),
        ...secondResults.flatMap((result) =>
          buildPairs(result.palette_oklch.map(arrToOklch), result.palette_hex)
        ),
      ];

      // Flatten into the existing palette/hexPalette states used by UI rendering
      setPalette(allPairs.flatMap((pair) => [pair.colorA, pair.colorB]));
      setHexPalette(allPairs.flatMap((pair) => [pair.hexA, pair.hexB]));

      console.log("Prediction data fetched successfully");
    } catch (error) {
      console.error("Error fetching prediction data:", error);
    }
  };

  const gradientPairs = useMemo(() => {
    const pairs: [number, number][] = [];
    for (let i = 0; i < palette.length; i += 2) {
      if (palette[i + 1]) pairs.push([i, i + 1]);
    }
    return pairs;
  }, [palette]);

  const primaryPairs = gradientPairs.slice(0, 3);
  const derivedPairs = gradientPairs.slice(3);

  return (
    <div className={`duration-600 ${isDarkMode ? "bg-black" : ""}`}>
      {isModePanelOpen && <ModePanel
        isModePanelOpen={isModePanelOpen}
        setisModePanelOpen={setisModePanelOpen}
        setIsDefaultMode={setIsDefaultMode}
        setIsCircularMode={setIsCircularMode}
        setIsClipMode={setIsClipMode}
      />}

      <Header
        colorM={colorM}
        setColorM={setColorM}
        accentM={accentM}
        setisModePanelOpen={setisModePanelOpen}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        handlePredict={handlePredict}
      />

      <div className="container-for-gradient-boxes">
        {primaryPairs.map(([a, b], i) => {
          const colorA = palette[a];
          const colorB = palette[b];
          const hexA = hexPalette[a];
          const hexB = hexPalette[b];

          if (!colorA || !colorB) return null;
          if (!hexA || !hexB) return null;

          return (
            <GradientBox
              key={i}
              colorA={colorA}
              colorB={colorB}
              hexA={hexA}
              hexB={hexB}
              isDarkMode={isDarkMode}
              isDefaultMode={isDefaultMode}
              isCircularMode={isCircularMode}
              isClipMode={isClipMode}
              toStr={toStr}
            />
          );
        })}
      </div>
      {derivedPairs.length > 0 && (
        <div className="mt-20 mb-4 text-center text-2xl md:text-3xl uppercase tracking-[0.2em] font-prosto-one text-default-gray">
          DERIVED COLOR
        </div>
      )}
      <div className="container-for-gradient-boxes pb-22">
        {derivedPairs.map(([a, b], i) => {
          const colorA = palette[a];
          const colorB = palette[b];
          const hexA = hexPalette[a];
          const hexB = hexPalette[b];

          if (!colorA || !colorB) return null;
          if (!hexA || !hexB) return null;

          return (
            <GradientBox
              key={`derived-${i}`}
              colorA={colorA}
              colorB={colorB}
              hexA={hexA}
              hexB={hexB}
              isDarkMode={isDarkMode}
              isDefaultMode={isDefaultMode}
              isCircularMode={isCircularMode}
              isClipMode={isClipMode}
              toStr={toStr}
            />
          );
        })}
      </div>
    </div>
  );
}

export default App;
