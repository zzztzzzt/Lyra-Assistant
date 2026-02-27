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

type GradientTriple = {
  colorA: OklchState;
  colorM: OklchState;
  colorB: OklchState;
  hexA: string;
  hexM: string;
  hexB: string;
};

const tripletIndices: [number, number, number][] = [
  [0, 1, 2], // 1, 2, 3
  [3, 4, 5], // 4, 5, 6
  [6, 7, 8], // 7, 8, 9
];

const seedIndices = [1, 4, 7];

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
      `http://localhost:8000/lyraassistant/predict?oklch=${color.l},${color.c},${color.h}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to get prediction data");
    }

    return response.json();
  };

  const buildTriples = (
    colors: OklchState[],
    hexes: string[],
  ): GradientTriple[] => {
    const triples: GradientTriple[] = [];

    for (const [a, m, b] of tripletIndices) {
      const colorA = colors[a];
      const colorM = colors[m];
      const colorB = colors[b];
      const hexA = hexes[a];
      const hexM = hexes[m];
      const hexB = hexes[b];

      if (!colorA || !colorM || !colorB || !hexA || !hexM || !hexB) continue;

      triples.push({ colorA, colorM, colorB, hexA, hexM, hexB });
    }

    return triples;
  };

  const handlePredict = async () => {
    try {
      // First fetch: build the original 3 pairs
      const firstResult = await fetchPrediction(colorM);
      const firstPalette = firstResult.palette_oklch.map(arrToOklch);
      const firstHexPalette = firstResult.palette_hex;

      // Seeds are the 2nd, 5th, 8th colors (indices 1, 4, 7)
      const seeds = seedIndices
        .map((index) => firstPalette[index])
        .filter((seed): seed is OklchState => Boolean(seed));

      // Second fetches: each seed returns another 9-color palette -> 3 pairs each
      const secondResults = await Promise.all(seeds.map((seed) => fetchPrediction(seed)));

      const allTriples: GradientTriple[] = [
        ...buildTriples(firstPalette, firstHexPalette),
        ...secondResults.flatMap((result) =>
          buildTriples(
            result.palette_oklch.map(arrToOklch),
            result.palette_hex,
          )
        ),
      ];

      // Flatten into the existing palette/hexPalette states used by UI rendering
      setPalette(
        allTriples.flatMap((triple) => [
          triple.colorA,
          triple.colorM,
          triple.colorB,
        ]),
      );
      setHexPalette(
        allTriples.flatMap((triple) => [triple.hexA, triple.hexM, triple.hexB]),
      );

      console.log("Prediction data fetched successfully");
    } catch (error) {
      console.error("Error fetching prediction data:", error);
    }
  };

  const gradientTriples = useMemo(() => {
    const triples: [number, number, number][] = [];
    for (let i = 0; i < palette.length; i += 3) {
      if (palette[i + 1] && palette[i + 2]) {
        triples.push([i, i + 1, i + 2]);
      }
    }
    return triples;
  }, [palette]);

  const primaryTriples = gradientTriples.slice(0, 3);
  const derivedTriples = gradientTriples.slice(3);

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
        {primaryTriples.map(([a, m, b], i) => {
          const colorA = palette[a];
          const colorM = palette[m];
          const colorB = palette[b];
          const hexA = hexPalette[a];
          const hexM = hexPalette[m];
          const hexB = hexPalette[b];

          if (!colorA || !colorM || !colorB) return null;
          if (!hexA || !hexM || !hexB) return null;

          return (
            <GradientBox
              key={i}
              colorA={colorA}
              colorM={colorM}
              colorB={colorB}
              hexA={hexA}
              hexM={hexM}
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
      {derivedTriples.length > 0 && (
        <div className="mt-20 mb-4 text-center text-2xl md:text-3xl uppercase tracking-[0.2em] font-prosto-one text-default-gray">
          DERIVED COLOR
        </div>
      )}
      <div className="container-for-gradient-boxes pb-22">
        {derivedTriples.map(([a, m, b], i) => {
          const colorA = palette[a];
          const colorM = palette[m];
          const colorB = palette[b];
          const hexA = hexPalette[a];
          const hexM = hexPalette[m];
          const hexB = hexPalette[b];

          if (!colorA || !colorM || !colorB) return null;
          if (!hexA || !hexM || !hexB) return null;

          return (
            <GradientBox
              key={`derived-${i}`}
              colorA={colorA}
              colorM={colorM}
              colorB={colorB}
              hexA={hexA}
              hexM={hexM}
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
