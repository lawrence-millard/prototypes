const hours = (n: number) => new Date(Date.now() - n * 3_600_000).toISOString();

export const previewGroupId = "11111111-1111-4111-8111-111111111111";

export function previewGroups() {
  return [
    { id: previewGroupId, name: "Lisbon", createdAt: hours(6) },
    { id: "22222222-2222-4222-8222-222222222222", name: "Apartment", createdAt: hours(48) },
  ];
}

export function previewGroup(id: string) {
  if (id !== previewGroupId) return null;
  const ada = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const ben = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  return {
    id,
    name: "Lisbon",
    members: [
      { id: ada, name: "Ada" },
      { id: ben, name: "Ben" },
    ],
    expenses: [
      {
        id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        memo: "Dinner",
        amount: 8640,
        payerId: ada,
        createdAt: hours(4),
        shares: [
          { memberId: ada, amount: 4320 },
          { memberId: ben, amount: 4320 },
        ],
      },
      {
        id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        memo: "Train",
        amount: 4200,
        payerId: ben,
        createdAt: hours(20),
        shares: [
          { memberId: ada, amount: 2100 },
          { memberId: ben, amount: 2100 },
        ],
      },
    ],
  };
}
