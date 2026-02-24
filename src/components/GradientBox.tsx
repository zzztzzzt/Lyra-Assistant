import { useMemo } from "react";
import type { OklchState } from "../App";
import LyraAssistantIcon from "./LyraAssistantIcon";

interface Props {
  colorA: OklchState;
  colorM: OklchState;
  colorB: OklchState;
  hexA: string;
  hexM: string;
  hexB: string;
  isDarkMode: boolean;
  isDefaultMode: boolean;
  isCircularMode: boolean;
  isClipMode: boolean;
  toStr: (col: OklchState) => string;
}

const GradientBox: React.FC<Props> = ({
  colorA,
  colorM,
  colorB,
  hexA,
  hexM,
  hexB,
  isDarkMode,
  isDefaultMode,
  isCircularMode,
  isClipMode,
  toStr,
}) => {
  const accentA = useMemo(() => toStr(colorA), [colorA]);
  const accentM = useMemo(() => toStr(colorM), [colorM]);
  const accentB = useMemo(() => toStr(colorB), [colorB]);

  return (
    <div
      className="relative flex flex-col items-center h-140 xl:h-130 mx-6 mt-16 rounded-gradient-card text-default-gray font-prosto-one"
      style={{
        boxShadow: `3px 3px 0 7px oklch(from ${accentM} l c h / 0.5)`,
      }}
    >
      {isDefaultMode && (
        <div
          className="h-15/32 w-auto mt-14 py-12.5 px-11.5 aspect-golden rounded-3xl"
          style={{
            background: `linear-gradient(180deg in oklab, ${accentA}, ${accentM}, ${accentB})`,
          }}
        >
          <div
            className={`h-full w-full rounded-xl duration-600 ${
              isDarkMode ? "bg-black" : "bg-white"
            }`}
            style={{
              boxShadow: `inset 5px 5px 0 2px oklch(from ${accentM} l c h / 0.5)`,
            }}
          ></div>
        </div>
      )}

      {isCircularMode && (
        <div
          className="h-auto w-17/32 mt-14 aspect-square rounded-full"
          style={{
            background: `linear-gradient(45deg in oklab, ${accentA}, ${accentM}, ${accentB})`,
          }}
        ></div>
      )}

      {isClipMode && (
        <div className="h-1/2 w-auto mt-14 aspect-square">
          <LyraAssistantIcon
            className="w-full h-full"
            gradientStart={accentA}
            gradientEnd={accentB}
          />
        </div>
      )}

      <div className="my-auto flex flex-col items-center">
        <div className="text-base mb-1">{accentA}</div>
        <div className="text-base mb-1">{accentM}</div>
        <div className="text-base">{accentB}</div>

        <div className="text-xl mt-5 px-4 text-center">{`${hexA} > ${hexM} > ${hexB}`}</div>
      </div>
    </div>
  );
};

export default GradientBox;
