export const extractHexColors = (content: string): string[] => {
  const matches = content.match(/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g);
  return matches ?? [];
};

