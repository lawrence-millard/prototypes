import type { Choice, PollItem } from "@/lib/list-state";

const hours = (n: number) => new Date(Date.now() - n * 3_600_000).toISOString();

export const previewPolls: PollItem[] = [
  { id: "11111111-1111-4111-8111-111111111111", question: "Lunch tomorrow?", closed: false, votes: 6, createdAt: hours(3) },
  { id: "22222222-2222-4222-8222-222222222222", question: "Ship Friday?", closed: true, votes: 4, createdAt: hours(30) },
];

export function previewPoll(id: string) {
  if (id !== previewPolls[0].id) return null;
  const options: Choice[] = [
    { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", label: "Soup", votes: 4, mine: true },
    { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", label: "Salad", votes: 2, mine: false },
  ];
  return { question: previewPolls[0].question, closed: false, owner: true, options };
}
