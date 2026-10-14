import "server-only";

import { cache } from "react";
import { db } from "@/lib/db";
import { equalShares } from "@/lib/money";

export type Member = { id: string; name: string };
export type ExpenseRow = { id: string; memo: string; amount: number; payerId: string; shares: { memberId: string; amount: number }[] };
export type GroupView = { id: string; name: string; members: Member[]; expenses: ExpenseRow[] };
export type GroupItem = { id: string; name: string };

export const listGroups = cache(async (userId: string): Promise<GroupItem[]> => {
  const sql = await db();
  const rows = await sql`
    SELECT id, name FROM split_groups
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 20
  `;
  return rows.map((row) => ({ id: String(row.id), name: String(row.name) }));
});

export const getGroup = cache(async (userId: string, groupId: string): Promise<GroupView | null> => {
  const sql = await db();
  const rows = await sql`
    SELECT g.name,
      coalesce((
        SELECT json_agg(json_build_object('id', m.id, 'name', m.name) ORDER BY m.created_at)
        FROM split_members m
        WHERE m.group_id = g.id AND m.user_id = ${userId}
      ), '[]'::json) AS members,
      coalesce((
        SELECT json_agg(json_build_object(
          'id', e.id,
          'memo', e.memo,
          'amount', e.amount_cents,
          'payerId', e.payer_id,
          'shares', coalesce((
            SELECT json_agg(json_build_object('memberId', s.member_id, 'amount', s.amount_cents))
            FROM split_shares s
            WHERE s.expense_id = e.id AND s.user_id = ${userId}
          ), '[]'::json)
        ) ORDER BY e.created_at)
        FROM split_expenses e
        WHERE e.group_id = g.id AND e.user_id = ${userId}
      ), '[]'::json) AS expenses
    FROM split_groups g
    WHERE g.id = ${groupId} AND g.user_id = ${userId}
  `;
  const row = rows[0];
  if (!row) return null;
  return {
    id: groupId,
    name: String(row.name),
    members: asArray<Member>(row.members).map((member) => ({ id: String(member.id), name: String(member.name) })),
    expenses: asArray<ExpenseRow>(row.expenses).map((expense) => ({
      id: String(expense.id),
      memo: String(expense.memo),
      amount: Number(expense.amount),
      payerId: String(expense.payerId),
      shares: asArray<{ memberId: string; amount: number }>(expense.shares).map((share) => ({
        memberId: String(share.memberId),
        amount: Number(share.amount),
      })),
    })),
  };
});

export async function insertGroup(userId: string, name: string): Promise<string | null> {
  const sql = await db();
  const id = crypto.randomUUID();
  const rows = await sql`
    INSERT INTO split_groups (id, user_id, name)
    SELECT ${id}, ${userId}, ${name}
    WHERE (SELECT count(*) FROM split_groups WHERE user_id = ${userId}) < 20
    RETURNING id
  `;
  return rows[0]?.id ? String(rows[0].id) : null;
}

export async function renameGroup(userId: string, groupId: string, name: string): Promise<boolean> {
  const sql = await db();
  const rows = await sql`
    UPDATE split_groups SET name = ${name}
    WHERE id = ${groupId} AND user_id = ${userId}
    RETURNING id
  `;
  return rows.length === 1;
}

export async function deleteGroup(userId: string, groupId: string): Promise<void> {
  const sql = await db();
  await sql`DELETE FROM split_groups WHERE id = ${groupId} AND user_id = ${userId}`;
}

export async function insertMember(userId: string, groupId: string, name: string): Promise<"ok" | "limit" | "exists" | "missing"> {
  const sql = await db();
  const id = crypto.randomUUID();
  const rows = await sql`
    INSERT INTO split_members (id, group_id, user_id, name)
    SELECT ${id}, ${groupId}, ${userId}, ${name}
    WHERE EXISTS (SELECT 1 FROM split_groups WHERE id = ${groupId} AND user_id = ${userId})
      AND (SELECT count(*) FROM split_members WHERE group_id = ${groupId} AND user_id = ${userId}) < 12
      AND NOT EXISTS (
        SELECT 1 FROM split_members
        WHERE group_id = ${groupId} AND user_id = ${userId} AND lower(name) = lower(${name})
      )
    RETURNING id
  `;
  if (rows.length === 1) return "ok";
  const state = await sql`
    SELECT
      EXISTS (SELECT 1 FROM split_groups WHERE id = ${groupId} AND user_id = ${userId}) AS found,
      EXISTS (
        SELECT 1 FROM split_members
        WHERE group_id = ${groupId} AND user_id = ${userId} AND lower(name) = lower(${name})
      ) AS taken
  `;
  if (!state[0]?.found) return "missing";
  if (state[0]?.taken) return "exists";
  return "limit";
}

export async function deleteMember(userId: string, groupId: string, memberId: string): Promise<"ok" | "used" | "missing"> {
  const sql = await db();
  const rows = await sql`
    WITH target AS (
      SELECT id FROM split_members WHERE id = ${memberId} AND group_id = ${groupId} AND user_id = ${userId}
    ),
    used AS (
      SELECT 1 FROM split_expenses e JOIN target ON e.payer_id = target.id AND e.user_id = ${userId}
      UNION ALL
      SELECT 1 FROM split_shares s JOIN target ON s.member_id = target.id AND s.user_id = ${userId}
    ),
    removed AS (
      DELETE FROM split_members m
      USING target
      WHERE m.id = target.id AND NOT EXISTS (SELECT 1 FROM used)
      RETURNING m.id
    )
    SELECT
      (SELECT count(*)::int FROM target) AS found,
      (SELECT count(*)::int FROM used) AS used,
      (SELECT count(*)::int FROM removed) AS removed
  `;
  if (Number(rows[0]?.removed ?? 0) === 1) return "ok";
  if (Number(rows[0]?.used ?? 0) > 0) return "used";
  return "missing";
}

export async function insertExpense(
  userId: string,
  groupId: string,
  payerId: string,
  memo: string,
  amount: number,
  memberIds: string[],
): Promise<boolean> {
  const shares = equalShares(amount, memberIds.length);
  if (shares.reduce((sum, part) => sum + part, 0) !== amount) return false;
  const sql = await db();
  const expenseId = crypto.randomUUID();
  const rows = await sql`
    WITH grp AS (
      SELECT id FROM split_groups WHERE id = ${groupId} AND user_id = ${userId}
    ),
    payer AS (
      SELECT id FROM split_members WHERE id = ${payerId} AND group_id = ${groupId} AND user_id = ${userId}
    ),
    exp AS (
      INSERT INTO split_expenses (id, group_id, user_id, payer_id, memo, amount_cents)
      SELECT ${expenseId}, grp.id, ${userId}, payer.id, ${memo}, ${amount}
      FROM grp, payer
      RETURNING id
    )
    INSERT INTO split_shares (expense_id, member_id, user_id, amount_cents)
    SELECT exp.id, m.id, ${userId}, pair.amount::int
    FROM exp
    JOIN unnest(string_to_array(${memberIds.join(",")}, ','), string_to_array(${shares.join(",")}, ',')) AS pair(member_id, amount) ON true
    JOIN split_members m ON m.id = pair.member_id AND m.group_id = ${groupId} AND m.user_id = ${userId}
    RETURNING member_id
  `;
  if (rows.length === memberIds.length) return true;
  await sql`DELETE FROM split_expenses WHERE id = ${expenseId} AND user_id = ${userId}`;
  return false;
}

export async function updateExpense(
  userId: string,
  groupId: string,
  expenseId: string,
  memo: string,
  amount: number,
): Promise<boolean> {
  const sql = await db();
  const current = await sql`
    SELECT member_id FROM split_shares
    WHERE expense_id = ${expenseId} AND user_id = ${userId}
    ORDER BY member_id
  `;
  const memberIds = current.map((row) => String(row.member_id));
  const shares = equalShares(amount, memberIds.length);
  if (!memberIds.length || shares.reduce((sum, part) => sum + part, 0) !== amount) return false;
  const rows = await sql`
    WITH exp AS (
      UPDATE split_expenses
      SET memo = ${memo}, amount_cents = ${amount}
      WHERE id = ${expenseId} AND group_id = ${groupId} AND user_id = ${userId}
      RETURNING id
    ),
    cleared AS (
      DELETE FROM split_shares
      WHERE expense_id = ${expenseId} AND user_id = ${userId} AND EXISTS (SELECT 1 FROM exp)
      RETURNING member_id
    )
    INSERT INTO split_shares (expense_id, member_id, user_id, amount_cents)
    SELECT exp.id, m.id, ${userId}, pair.amount::int
    FROM exp
    JOIN unnest(string_to_array(${memberIds.join(",")}, ','), string_to_array(${shares.join(",")}, ',')) AS pair(member_id, amount) ON true
    JOIN split_members m ON m.id = pair.member_id AND m.group_id = ${groupId} AND m.user_id = ${userId}
    RETURNING member_id
  `;
  return rows.length === memberIds.length;
}

export async function deleteExpense(userId: string, groupId: string, expenseId: string): Promise<void> {
  const sql = await db();
  await sql`DELETE FROM split_expenses WHERE id = ${expenseId} AND group_id = ${groupId} AND user_id = ${userId}`;
}

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}
