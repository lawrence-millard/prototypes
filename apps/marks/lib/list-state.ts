export type Bookmark = { id: string; url: string; title: string; tags: string[]; createdAt?: string };

export type ListAction =
  | { type: "add"; item: Bookmark }
  | { type: "edit"; item: Bookmark }
  | { type: "delete"; id: string };

export function reduceBookmarks(state: Bookmark[], action: ListAction): Bookmark[] {
  if (action.type === "add") return [action.item, ...state.filter((item) => item.id !== action.item.id)];
  if (action.type === "edit") return state.map((item) => (item.id === action.item.id ? { ...item, ...action.item } : item));
  return state.filter((item) => item.id !== action.id);
}
