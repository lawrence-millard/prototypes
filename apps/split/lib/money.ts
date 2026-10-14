export function parseCents(input: string): number | null {
  const value = input.trim();
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(value)) return null;
  const [whole, frac = ""] = value.split(".");
  const cents = Number(whole) * 100 + Number(frac.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > 100_000_000) return null;
  return cents;
}

export function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

export function equalShares(total: number, count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor(total / count);
  let remainder = total - base * count;
  return Array.from({ length: count }, () => {
    const extra = remainder > 0 ? 1 : 0;
    remainder -= extra;
    return base + extra;
  });
}

export type Share = { memberId: string; amount: number };
export type Expense = { payerId: string; amount: number; shares: Share[] };

export function balances(memberIds: string[], expenses: Expense[]): Map<string, number> {
  const net = new Map(memberIds.map((id) => [id, 0]));
  for (const expense of expenses) {
    net.set(expense.payerId, (net.get(expense.payerId) ?? 0) + expense.amount);
    for (const share of expense.shares) net.set(share.memberId, (net.get(share.memberId) ?? 0) - share.amount);
  }
  return net;
}

export type Transfer = { fromId: string; toId: string; cents: number };

export function settle(entries: { id: string; cents: number }[]): Transfer[] {
  const debtors = entries
    .filter((entry) => entry.cents < 0)
    .map((entry) => ({ id: entry.id, cents: -entry.cents }))
    .sort((a, b) => b.cents - a.cents || a.id.localeCompare(b.id));
  const creditors = entries
    .filter((entry) => entry.cents > 0)
    .map((entry) => ({ ...entry }))
    .sort((a, b) => b.cents - a.cents || a.id.localeCompare(b.id));
  const transfers: Transfer[] = [];
  let debtor = 0;
  let creditor = 0;
  while (debtor < debtors.length && creditor < creditors.length) {
    const pay = Math.min(debtors[debtor].cents, creditors[creditor].cents);
    if (pay > 0) transfers.push({ fromId: debtors[debtor].id, toId: creditors[creditor].id, cents: pay });
    debtors[debtor].cents -= pay;
    creditors[creditor].cents -= pay;
    if (debtors[debtor].cents === 0) debtor += 1;
    if (creditors[creditor].cents === 0) creditor += 1;
  }
  return transfers;
}
