import type { OklchState } from "../App";

interface Props {
  colorA: OklchState;
  colorB: OklchState;
  accentA: string;
  accentB: string;
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

const GradientBox: React.FC<Props> = ({ colorA, colorB, accentA, accentB, isDarkMode, toStr }) => {
  return (
    <div className="relative flex justify-center h-150 mx-6 mt-16 rounded-gradient-card"
      style={{ boxShadow: `5px 5px 0 10px oklch(from ${ toStr(getMidColor(colorA, colorB)) } l c h / 0.5` }}
    >
      <div className="h-1/2 w-auto mt-16 py-15 px-14 aspect-golden rounded-4xl bg-black"
        style={{ background: `linear-gradient(180deg, ${accentA}, ${accentB})` }}
      >
        <div className={`h-full w-full rounded-2xl duration-600 ${ isDarkMode? "bg-black" : "bg-white" }`}
          style={{ boxShadow: `inset 5px 5px 0 3px oklch(from ${ toStr(getMidColor(colorA, colorB)) } l c h / 0.5` }}
        ></div>
      </div>
    </div>
  );
};

export default GradientBox;