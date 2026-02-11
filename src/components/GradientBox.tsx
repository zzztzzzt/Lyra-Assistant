import { useMemo } from "react";
import type { OklchState } from "../App";

interface Props {
  colorA: OklchState;
  colorB: OklchState;
  hexA: string;
  hexB: string;
  isDarkMode: boolean;
  toStr: (col: OklchState) => string;
}

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

const GradientBox: React.FC<Props> = ({ colorA, colorB, hexA, hexB, isDarkMode, toStr }) => {
  const accentA = useMemo(() => toStr(colorA), [colorA]);
  const accentB = useMemo(() => toStr(colorB), [colorB]);
  const accentMid = useMemo(() => toStr(getMidColor(colorA, colorB)), [colorA, colorB]);

  return (
    <div
      className="relative flex flex-col items-center h-140 xl:h-130 mx-6 mt-16 rounded-gradient-card text-default-gray font-prosto-one"
      style={{ boxShadow: `3px 3px 0 7px oklch(from ${ accentMid } l c h / 0.5)` }}
    >
      <div
        className="h-15/32 w-auto mt-14 py-12.5 px-11.5 aspect-golden rounded-3xl bg-black"
        style={{ background: `linear-gradient(180deg, ${accentA}, ${accentB})` }}
      >
        <div
          className={`h-full w-full rounded-xl duration-600 ${ isDarkMode? "bg-black" : "bg-white" }`}
          style={{ boxShadow: `inset 5px 5px 0 2px oklch(from ${ accentMid } l c h / 0.5)` }}
        ></div>
      </div>

      <div className="my-auto flex flex-col items-center">
        <div className="text-base">{ accentA }</div>
        <div className="text-base">to</div>
        <div className="text-base">{ accentB }</div>

        <div className="text-xl mt-6">{`${ hexA } > ${ hexB }`}</div>
      </div>
    </div>
  );
};

export default GradientBox;