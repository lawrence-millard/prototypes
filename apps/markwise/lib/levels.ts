import type { LevelBand } from "@/lib/types";

export const assess12Levels: LevelBand[] = [
  { level: 1, min: 1, max: 3, descriptor: "Isolated knowledge. The business context is named or missed. No real chain of reasoning." },
  { level: 2, min: 4, max: 6, descriptor: "Some relevant ideas and a partial chain. Context is mentioned but barely used. Judgement is thin or one-sided." },
  { level: 3, min: 7, max: 9, descriptor: "Developed analysis in context. More than one chain, though one may be brief. Some judgement that is not fully weighed." },
  { level: 4, min: 10, max: 12, descriptor: "A coherent, balanced argument using the figures and the situation. A supported, weighted judgement." },
];

export const assess10Levels: LevelBand[] = [
  { level: 1, min: 1, max: 2, descriptor: "A relevant idea with little context or development." },
  { level: 2, min: 3, max: 5, descriptor: "Some application and a short chain. Evaluation is asserted." },
  { level: 3, min: 6, max: 8, descriptor: "Developed points in context and a partial judgement." },
  { level: 4, min: 9, max: 10, descriptor: "Balanced, contextual analysis and a clear supported judgement." },
];

export const evaluate20Levels: LevelBand[] = [
  { level: 1, min: 1, max: 5, descriptor: "Fragments of knowledge. Little sense of the case or of competing arguments." },
  { level: 2, min: 6, max: 10, descriptor: "Some relevant analysis and context, but chains break off and the judgement is one-sided." },
  { level: 3, min: 11, max: 15, descriptor: "Developed arguments on more than one side, using the context. The judgement is present but not fully weighed." },
  { level: 4, min: 16, max: 20, descriptor: "Sustained, balanced evaluation in context, ending in a supported judgement about what matters most." },
];

export const psych16Levels: LevelBand[] = [
  { level: 1, min: 1, max: 4, descriptor: "Limited knowledge. Description is thin and evaluation is missing or generic." },
  { level: 2, min: 5, max: 8, descriptor: "Some accurate knowledge and a brief evaluative point. Elaboration is partial." },
  { level: 3, min: 9, max: 12, descriptor: "Clear knowledge and more than one developed evaluative point, though one side may be stronger." },
  { level: 4, min: 13, max: 16, descriptor: "Detailed, accurate knowledge and well-developed evaluation that reaches a reasoned conclusion." },
];

export const psych8Levels: LevelBand[] = [
  { level: 1, min: 1, max: 2, descriptor: "A relevant idea with little elaboration." },
  { level: 2, min: 3, max: 4, descriptor: "Some accurate detail and a brief evaluative comment." },
  { level: 3, min: 5, max: 6, descriptor: "Clear knowledge and a developed strength or limitation." },
  { level: 4, min: 7, max: 8, descriptor: "Detailed knowledge and a balanced, elaborated evaluation." },
];

export const politics30Levels: LevelBand[] = [
  { level: 1, min: 1, max: 6, descriptor: "General points with little accurate detail or argument." },
  { level: 2, min: 7, max: 12, descriptor: "Some knowledge and a one-sided argument. Examples are thin." },
  { level: 3, min: 13, max: 18, descriptor: "Reasonable knowledge, some analysis, and an attempt to balance the view." },
  { level: 4, min: 19, max: 24, descriptor: "Good knowledge, developed analysis of competing arguments, and a mostly supported judgement." },
  { level: 5, min: 25, max: 30, descriptor: "Precise knowledge, sustained comparative argument, and a clear, supported judgement." },
];

export const politics24Levels: LevelBand[] = [
  { level: 1, min: 1, max: 4, descriptor: "A relevant idea with little conceptual detail." },
  { level: 2, min: 5, max: 9, descriptor: "Some accurate ideas and a limited comparison." },
  { level: 3, min: 10, max: 14, descriptor: "Developed comparison with some thinkers or examples, and a partial judgement." },
  { level: 4, min: 15, max: 19, descriptor: "Clear conceptual comparison and a supported judgement about the extent of disagreement." },
  { level: 5, min: 20, max: 24, descriptor: "Precise, balanced comparison and a well-supported judgement on how far the traditions disagree." },
];

export const compare12Levels: LevelBand[] = [
  { level: 1, min: 1, max: 3, descriptor: "A difference is named with little explanation." },
  { level: 2, min: 4, max: 6, descriptor: "A developed difference, with limited comparison." },
  { level: 3, min: 7, max: 9, descriptor: "More than one explained difference, using both systems." },
  { level: 4, min: 10, max: 12, descriptor: "Sustained comparison with precise examples from both countries." },
];

export function levelForTotal(levels: LevelBand[], total: number) {
  if (total <= 0) return 1;
  const match = levels.find((band) => total >= band.min && total <= band.max);
  if (match) return match.level;
  const top = levels[levels.length - 1];
  return total > top.max ? top.level : 1;
}
