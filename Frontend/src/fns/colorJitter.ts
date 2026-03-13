import type { OklchState } from "../oklchTypes";

type JitterOptions = {
  l?: number;
  c?: number;
  h?: number;
  cMax?: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const wrapHue = (h: number) => {
  const wrapped = h % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
};

const randBetween = (min: number, max: number) => min + Math.random() * (max - min);

export const jitterOklch = (
  color: OklchState,
  { l = 0.02, c = 0.04, h = 15, cMax = 0.4 }: JitterOptions = {},
): OklchState => ({
  l: clamp(color.l + randBetween(-l, l), 0, 1),
  c: clamp(color.c + randBetween(-c, c), 0, cMax),
  h: wrapHue(color.h + randBetween(-h, h)),
});

export const jitterOklchList = (
  colors: OklchState[],
  options?: JitterOptions,
): OklchState[] => colors.map((color) => jitterOklch(color, options));
