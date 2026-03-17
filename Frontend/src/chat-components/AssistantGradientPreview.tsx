import HeartIcon from "../components/HeartIcon";

const extractHexColors = (content: string): string[] => {
  const matches = content.match(/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g);
  return matches ?? [];
};

const toGradientTriples = (hexColors: string[]): [string, string, string][] => {
  const triples: [string, string, string][] = [];
  for (let i = 0; i + 2 < hexColors.length && triples.length < 3; i += 3) {
    const a = hexColors[i];
    const b = hexColors[i + 1];
    const c = hexColors[i + 2];
    if (!a || !b || !c) break;
    triples.push([a, b, c]);
  }
  return triples;
};

const AssistantGradientPreview = ({ content }: { content: string }) => {
  const triples = toGradientTriples(extractHexColors(content));
  if (triples.length === 0) return null;

  return (
    <div className="mt-8 grid grid-cols-3 gap-6">
      {triples.map(([a, b, c], index) => (
        <div key={`${a}-${b}-${c}-${index}`} className="flex flex-col items-center gap-2">
          <div className="group/gradient relative h-32 w-32">
            <div
              className="h-32 w-32 rounded-full transition-opacity duration-200"
              style={{
                backgroundImage: `linear-gradient(45deg in oklab, ${a}, ${b}, ${c})`,
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center rounded-full opacity-0 transition-opacity duration-200 group-hover/gradient:opacity-100 cursor-pointer">
              <HeartIcon className="size-10 text-white" />
            </div>
          </div>
          <p className="mt-2 text-chat-lyra-gradient text-slate-500">{`${a} > ${b} > ${c}`}</p>
        </div>
      ))}
    </div>
  );
};

export default AssistantGradientPreview;