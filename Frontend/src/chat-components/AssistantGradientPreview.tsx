import HeartIcon from "../components/HeartIcon";
import { extractHexColors } from "../chat-fns/extractHexColors";

const toGradientTriples = (
  hexColors: string[],
  maxTriples: number,
): [string, string, string][] => {
  const triples: [string, string, string][] = [];
  for (let i = 0; i + 2 < hexColors.length && triples.length < maxTriples; i += 3) {
    const a = hexColors[i];
    const b = hexColors[i + 1];
    const c = hexColors[i + 2];
    if (!a || !b || !c) break;
    triples.push([a, b, c]);
  }
  return triples;
};

type ExtraState = "idle" | "loading" | "done" | "error";

const AssistantGradientPreview = ({
  content,
  extraContent,
  extraState = "idle",
}: {
  content: string;
  extraContent?: string;
  extraState?: ExtraState;
}) => {
  const baseTriples = toGradientTriples(extractHexColors(content), 3);
  const extraTriples = extraContent
    ? toGradientTriples(extractHexColors(extraContent), 9)
    : [];

  const showExtraPlaceholders = extraState === "loading" && baseTriples.length === 3;
  const placeholderCount = showExtraPlaceholders ? 9 : 0;

  const allItems: Array<
    | { kind: "baseTriple"; triple: [string, string, string]; key: string }
    | { kind: "extraTriple"; triple: [string, string, string]; key: string }
    | { kind: "extraPlaceholder"; key: string }
  > = [
    ...baseTriples.map((triple, index) => ({
      kind: "baseTriple" as const,
      triple,
      key: `base-${triple.join("-")}-${index}`,
    })),
    ...extraTriples.map((triple, index) => ({
      kind: "extraTriple" as const,
      triple,
      key: `extra-${triple.join("-")}-${index}`,
    })),
    ...Array.from({ length: placeholderCount }, (_, i) => ({
      kind: "extraPlaceholder" as const,
      key: `placeholder-${i}`,
    })),
  ];

  if (allItems.length === 0) return null;

  return (
    <div className="mt-8 grid grid-cols-3 gap-6">
      {allItems.map((item) => {
        if (item.kind === "extraPlaceholder") {
          return (
            <div key={item.key} className="flex flex-col items-center gap-2">
              <div className="relative h-10 w-32 mb-4">
                <div className="h-10 w-32 rounded-full rotate-30 bg-slate-100 animate-pulse" />
              </div>
              <p className="mt-2 mb-2 text-chat-lyra-gradient text-slate-400">Generating…</p>
            </div>
          );
        }

        const [a, b, c] = item.triple;
        const isExtra = item.kind === "extraTriple";
        const swatchClass = isExtra ? "h-10 w-32 rounded-full rotate-30" : "h-32 w-32 rounded-full";
        const iconClass = isExtra ? "size-6" : "size-10";

        return (
          <div key={item.key} className="flex flex-col items-center gap-2">
            <div className={`group/gradient relative ${isExtra ? "h-10 w-32 mb-4" : "h-32 w-32"}`}>
              <div
                className={`${swatchClass} transition-opacity duration-200`}
                style={{
                  backgroundImage: `linear-gradient(${isExtra ? "90" : "45"}deg in oklab, ${a}, ${b}, ${c})`,
                }}
              />
              <div
                className={`absolute inset-0 flex items-center justify-center rounded-full opacity-0 transition-opacity duration-200 group-hover/gradient:opacity-100 cursor-pointer`}
              >
                <HeartIcon className={`${iconClass} text-white`} />
              </div>
            </div>
            <p className="mt-2 mb-2 text-chat-lyra-gradient text-slate-500">{`${a} > ${b} > ${c}`}</p>
          </div>
        );
      })}
    </div>
  );
};

export default AssistantGradientPreview;