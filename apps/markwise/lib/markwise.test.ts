import { describe, expect, it } from "vitest";
import { bktUpdate } from "@/lib/bkt";
import { canSpend } from "@/lib/caps";
import { daysUntil, formatShortDate, greetingFor } from "@/lib/dates";
import { predictGrade } from "@/lib/grades";
import { finalizeMark } from "@/lib/marking";
import { mockMark, mockTutorReply, PED_SAMPLE_ANSWER } from "@/lib/mock-ai";
import { buildDailyPlan, topicsForPlan } from "@/lib/plan";
import { buildMarkPrompt, buildTutorPrompt } from "@/lib/prompts";
import { crisisReply, redactForModel } from "@/lib/redact";
import { businessQuestions, businessTopics } from "@/lib/seed/business";
import { demoMastery } from "@/lib/seed/demo";
import { exemplars } from "@/lib/seed/exemplars";
import { politicsQuestions, politicsTopics } from "@/lib/seed/politics";
import { psychologyQuestions, psychologyTopics } from "@/lib/seed/psychology";
import { DEFAULT_ENROLMENTS } from "@/lib/subjects";
import type { QuestionSeed } from "@/lib/types";

const topics = [...businessTopics, ...psychologyTopics, ...politicsTopics];
const questions = [...businessQuestions, ...psychologyQuestions, ...politicsQuestions];
const noon = new Date("2026-10-10T11:00:00Z");

describe("dates and grades", () => {
  it("counts 216 days from 10 Oct 2026 to 14 May 2027", () => {
    expect(daysUntil("2027-05-14", noon)).toBe(216);
  });

  it("greets in the morning and formats the mock date", () => {
    expect(greetingFor("Aisha", new Date("2026-10-10T07:30:00Z"))).toBe("Good morning, Aisha");
    expect(formatShortDate("2026-10-17")).toBe("Sat 17 Oct");
  });

  it("maps seeded mastery to the demo grades", () => {
    expect(predictGrade([0.67, 0.86, 0.84])).toBe("B");
    expect(predictGrade([0.46, 0.72, 0.92, 0.96, 0.95])).toBe("A");
    expect(predictGrade([0.39, 0.52, 0.81, 0.84, 0.88])).toBe("C");
  });
});

describe("daily plan", () => {
  it("builds the three home tasks from the seeded mastery", () => {
    const specBySubject = {
      business: DEFAULT_ENROLMENTS.business.specCode,
      psychology: DEFAULT_ENROLMENTS.psychology.specCode,
      politics: DEFAULT_ENROLMENTS.politics.specCode,
    };
    const plan = buildDailyPlan(topicsForPlan(topics, questions, demoMastery, specBySubject));
    expect(plan.tasks.map((task) => task.title)).toEqual([
      "Attachment: Strange Situation",
      "Price elasticity of demand",
      "The US Supreme Court",
    ]);
    expect(plan.tasks.map((task) => task.label)).toEqual(["Weak", "Review", "New"]);
    expect(plan.tasks[0].meta).toBe("Psychology · 16-mark essay · weak topic");
    expect(plan.tasks[1].meta).toBe("Business · 12-mark ‘Assess’ question");
    expect(plan.tasks[2].meta).toBe("Politics · 10-question quick quiz");
    expect(plan.minutes).toBe(40);
  });
});

describe("marking", () => {
  it("updates Bayesian knowledge in the direction of the answer", () => {
    expect(bktUpdate(0.4, true)).toBeGreaterThan(0.4);
    expect(bktUpdate(0.4, false)).toBeLessThan(0.4);
  });

  it("enforces the daily caps", () => {
    expect(canSpend({ marks: 24, tutorTurns: 50 }, "mark")).toBe(true);
    expect(canSpend({ marks: 25, tutorTurns: 0 }, "mark")).toBe(false);
    expect(canSpend({ marks: 0, tutorTurns: 50 }, "tutor")).toBe(false);
  });

  it("scores the PeakFit sample as level 3, 8/12", () => {
    const question = questions.find((item) => item.id === "bus-ped-assess")!;
    const mark = mockMark(question, "business", PED_SAMPLE_ANSWER);
    expect(mark.total).toBe(8);
    expect(mark.level).toBe(3);
    expect(mark.ao.map((row) => row.awarded)).toEqual([2, 2, 3, 1]);
  });

  it("clamps assessment objectives and drops invented quotations", () => {
    const question = questions.find((item) => item.id === "bus-ped-assess")!;
    const mark = finalizeMark(
      {
        level: 4,
        summary: "Too generous",
        nextLevelTip: "Add a judgement.",
        ao: [
          { code: "AO1", awarded: 9, comment: "Everything", evidence: "this quote is not in the answer" },
          { code: "AO2", awarded: 2, comment: "Applied" },
          { code: "AO3", awarded: 4, comment: "Analysed" },
          { code: "AO4", awarded: 4, comment: "Judged" },
        ],
      },
      question,
      "business",
      "A short answer with no quotation.",
      "gemini",
    );
    expect(mark.ao.find((row) => row.code === "AO1")?.awarded).toBe(2);
    expect(mark.ao.find((row) => row.code === "AO1")?.evidence).toBeUndefined();
    expect(mark.total).toBeLessThanOrEqual(12);
    expect(mark.total).toBe(mark.ao.reduce((sum, row) => sum + row.awarded, 0));
  });

  it("keeps account details out of the model prompt", () => {
    const question = questions.find((item) => item.id === "bus-ped-assess")!;
    const answer = redactForModel("I am Aisha and my email is aisha@school.test. Call 07123456789.", "Aisha");
    const prompt = buildMarkPrompt({
      subjectLabel: "Business",
      specCode: "9BS0",
      commandWord: "Assess",
      question,
      exemplars: exemplars.filter((item) => item.exemplarKey === "business-assess-12"),
      answer,
    });
    expect(prompt).not.toContain("Aisha");
    expect(prompt).not.toContain("aisha@school.test");
    expect(prompt).not.toContain("07123456789");
    expect(prompt).toContain("[student]");
    expect(prompt).toContain("[email]");
    expect(prompt).toContain("[phone]");
  });
});

describe("tutor safety", () => {
  it("signposts a crisis and refuses to write the essay", () => {
    expect(crisisReply("I want to die")).toMatch(/116 123/);
    expect(crisisReply("Evaluate the multi-store model")).toBeNull();
    expect(mockTutorReply({ subject: "psychology", topic: "Memory", message: "please write my essay" })).toMatch(
      /won't write/i,
    );
    const prompt = buildTutorPrompt({
      subjectLabel: "Psychology",
      specLabel: "AQA",
      topic: "Memory",
      messages: [{ role: "user", content: redactForModel("Aisha here", "Aisha") }],
    });
    expect(prompt).not.toContain("Aisha");
  });
});

describe("catalog", () => {
  it("uses original extended questions whose AO weights sum to the marks", () => {
    const extended = questions.filter((question) => question.type === "extended");
    expect(extended.length).toBeGreaterThanOrEqual(8);
    for (const question of extended) {
      expect(sumWeights(question)).toBe(question.marks);
      expect(question.levels?.length).toBeGreaterThan(0);
      expect(question.indicativeContent?.length).toBeGreaterThan(0);
    }
    const quiz = questions.filter((question) => question.quizSlug === "us-supreme-court");
    expect(quiz).toHaveLength(10);
    for (const question of questions.filter((item) => item.type === "mcq")) {
      expect(question.choices?.some((choice) => choice.id === question.correctChoice)).toBe(true);
    }
    expect(exemplars.filter((item) => item.exemplarKey === "business-assess-12").length).toBeGreaterThanOrEqual(3);
  });
});

function sumWeights(question: QuestionSeed) {
  return Object.values(question.aoWeights ?? {}).reduce((sum, value) => sum + (value ?? 0), 0);
}
