import { PED_SAMPLE_ANSWER, peakFitSampleMark } from "@/lib/mock-ai";
import { DEMO_EXAM_DATE, DEMO_NAME, DEMO_USER_ID } from "@/lib/subjects";

export const demoMastery: { topicId: string; pKnown: number }[] = [
  { topicId: "pol-us-scotus", pKnown: 0.39 },
  { topicId: "psy-attachment", pKnown: 0.46 },
  { topicId: "pol-conservatism", pKnown: 0.52 },
  { topicId: "bus-ped", pKnown: 0.67 },
  { topicId: "psy-rm", pKnown: 0.72 },
  { topicId: "pol-parliament", pKnown: 0.81 },
  { topicId: "bus-demand", pKnown: 0.84 },
  { topicId: "pol-pm", pKnown: 0.84 },
  { topicId: "bus-strategy", pKnown: 0.86 },
  { topicId: "pol-liberalism", pKnown: 0.88 },
  { topicId: "psy-memory", pKnown: 0.92 },
  { topicId: "psy-approaches", pKnown: 0.95 },
  { topicId: "psy-ocd", pKnown: 0.96 },
];

export const demoProfile = {
  id: DEMO_USER_ID,
  displayName: DEMO_NAME,
  xp: 2860,
  streak: 9,
  examDate: DEMO_EXAM_DATE,
  onboarded: true,
};

export const demoDraft = {
  questionId: "bus-ped-assess",
  answer: PED_SAMPLE_ANSWER,
};

export const demoAttempt = {
  id: "demo-ped-attempt",
  questionId: "bus-ped-assess",
  answer: PED_SAMPLE_ANSWER,
  feedback: peakFitSampleMark(),
};

export const demoChat = {
  id: "demo-tutor-memory",
  subject: "psychology",
  topicName: "Memory",
  specLabel: "AQA",
  messages: [
    { role: "user", content: "How do I evaluate the multi-store model?" },
    {
      role: "assistant",
      content:
        "Start with evidence. Think of a brain-damaged patient whose STM was impaired but LTM was fine. What does that suggest?",
    },
    { role: "user", content: "KF? So STM and LTM are separate stores?" },
    {
      role: "assistant",
      content:
        "Yes, that supports the MSM. But KF lost verbal STM, not visual. What problem does that create for a single STM store?",
    },
    {
      role: "user",
      content: "STM must have more than one part, like the working memory model says.",
    },
    {
      role: "assistant",
      content: "Exactly, that's a strong AO3 point. Now link it back: strength or limitation?",
    },
  ],
};
