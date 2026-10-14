export type PollItem = { id: string; question: string; closed: boolean; votes: number };

export type PollAction =
  | { type: "add"; item: PollItem }
  | { type: "edit"; id: string; question: string }
  | { type: "close"; id: string; closed: boolean }
  | { type: "delete"; id: string };

export function reducePolls(state: PollItem[], action: PollAction): PollItem[] {
  if (action.type === "add") return [action.item, ...state.filter((item) => item.id !== action.item.id)];
  if (action.type === "edit") return state.map((item) => (item.id === action.id ? { ...item, question: action.question } : item));
  if (action.type === "close") return state.map((item) => (item.id === action.id ? { ...item, closed: action.closed } : item));
  return state.filter((item) => item.id !== action.id);
}

export type Choice = { id: string; label: string; votes: number; mine: boolean };

export function reduceVote(state: Choice[], optionId: string): Choice[] {
  if (state.some((choice) => choice.mine)) return state;
  return state.map((choice) => (choice.id === optionId ? { ...choice, votes: choice.votes + 1, mine: true } : choice));
}
