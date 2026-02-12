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
  // Convert OKLCH to OKLab (a, b)
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const a1 = colorA.c * Math.cos(toRad(colorA.h));
  const b1 = colorA.c * Math.sin(toRad(colorA.h));
  
  const a2 = colorB.c * Math.cos(toRad(colorB.h));
  const b2 = colorB.c * Math.sin(toRad(colorB.h));

  // Linearly interpolate in OKLab space ( matches how CSS linear-gradient(in oklab, ...) )
  const midL = (colorA.l + colorB.l) / 2;
  const midA = (a1 + a2) / 2;
  const midB = (b1 + b2) / 2;

  // Convert back to OKLCH
  const midC = Math.sqrt(midA * midA + midB * midB);
  let midH = toDeg(Math.atan2(midB, midA));
  
  // Normalize hue to the range [0, 360)
  midH = (midH + 360) % 360;

  return { l: midL, c: midC, h: midH };
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
        style={{ background: `linear-gradient(180deg in oklab, ${accentA}, ${accentB})` }}
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