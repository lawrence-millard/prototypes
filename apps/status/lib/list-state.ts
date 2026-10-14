export type Monitor = {
  id: string;
  url: string;
  label: string;
  ok: boolean | null;
  statusCode: number | null;
  latencyMs: number | null;
  error: string | null;
};

export type MonitorAction =
  | { type: "add"; item: Monitor }
  | { type: "edit"; id: string; label: string }
  | { type: "delete"; id: string };

export function reduceMonitors(state: Monitor[], action: MonitorAction): Monitor[] {
  if (action.type === "add") return [action.item, ...state.filter((item) => item.id !== action.item.id)];
  if (action.type === "edit") return state.map((item) => (item.id === action.id ? { ...item, label: action.label } : item));
  return state.filter((item) => item.id !== action.id);
}

export function statusLine(item: Monitor, checking: boolean): string {
  if (checking) return "Checking";
  if (item.error === "blocked") return "Blocked";
  if (item.ok && item.statusCode) return `${item.statusCode} · ${item.latencyMs ?? 0}ms`;
  if (item.ok === false || item.error) return "Down";
  return "";
}
