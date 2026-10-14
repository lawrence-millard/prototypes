import { aboutMinutes } from "@/lib/dates";
import { SUBJECTS } from "@/lib/subjects";
import type { QuestionSeed, SubjectId, TopicSeed } from "@/lib/types";

export type PlanTopic = {
  id: string;
  subject: SubjectId;
  name: string;
  planTitle: string;
  pKnown: number;
  extended: { id: string; marks: number; commandWord: string } | null;
  quiz: { slug: string; count: number } | null;
};

export type DailyTask = {
  href: string;
  title: string;
  meta: string;
  label: "Weak" | "Review" | "New";
  minutes: number;
};

export function topicsForPlan(
  topics: TopicSeed[],
  questions: QuestionSeed[],
  mastery: { topicId: string; pKnown: number }[],
  specBySubject: Partial<Record<SubjectId, string>>,
): PlanTopic[] {
  const known = new Map(mastery.map((row) => [row.topicId, row.pKnown]));
  return topics
    .filter((topic) => specBySubject[topic.subject] === topic.specCode)
    .map((topic) => {
      const quizQuestions = questions.filter((question) => question.topicId === topic.id && question.quizSlug);
      const extendedQuestion = quizQuestions.length
        ? undefined
        : questions
            .filter((question) => question.topicId === topic.id && question.type === "extended")
            .sort((a, b) => b.marks - a.marks)[0];
      return {
        id: topic.id,
        subject: topic.subject,
        name: topic.name,
        planTitle: topic.planTitle,
        pKnown: known.get(topic.id) ?? 0.3,
        extended: extendedQuestion
          ? {
              id: extendedQuestion.id,
              marks: extendedQuestion.marks,
              commandWord: extendedQuestion.commandWord ?? "question",
            }
          : null,
        quiz: quizQuestions.length
          ? { slug: quizQuestions[0].quizSlug!, count: quizQuestions.length }
          : null,
      };
    });
}

export function buildDailyPlan(topics: PlanTopic[]) {
  const extended = topics
    .filter((topic) => topic.extended)
    .sort((a, b) => a.pKnown - b.pKnown || a.planTitle.localeCompare(b.planTitle));
  const weak = extended.find((topic) => topic.pKnown < 0.55);
  const review = extended.find((topic) => topic.pKnown >= 0.55 && topic.pKnown < 0.8);
  const quiz = topics
    .filter((topic) => topic.quiz)
    .sort((a, b) => a.pKnown - b.pKnown || a.planTitle.localeCompare(b.planTitle))[0];

  const tasks: DailyTask[] = [];
  if (weak?.extended) {
    tasks.push({
      href: `/practice/${weak.extended.id}`,
      title: weak.planTitle,
      meta: extendedMeta(weak, "Weak"),
      label: "Weak",
      minutes: weak.extended.marks,
    });
  }
  if (review?.extended) {
    tasks.push({
      href: `/practice/${review.extended.id}`,
      title: review.planTitle,
      meta: extendedMeta(review, "Review"),
      label: "Review",
      minutes: review.extended.marks,
    });
  }
  if (quiz?.quiz) {
    tasks.push({
      href: `/practice/quiz/${quiz.quiz.slug}`,
      title: quiz.planTitle,
      meta: `${SUBJECTS[quiz.subject].label} · ${quiz.quiz.count} questions`,
      label: "New",
      minutes: quiz.quiz.count,
    });
  }

  return {
    tasks,
    minutes: aboutMinutes(tasks.reduce((sum, task) => sum + task.minutes, 0)),
  };
}

function extendedMeta(topic: PlanTopic, label: "Weak" | "Review") {
  const subject = SUBJECTS[topic.subject].label;
  const question = topic.extended!;
  if (label === "Weak" && topic.subject === "psychology" && question.marks >= 16) {
    return `${subject} · ${question.marks}-mark essay · weak topic`;
  }
  return `${subject} · ${question.marks}-mark ‘${question.commandWord}’ question`;
}

export function practiceTarget(topic: PlanTopic) {
  if (topic.quiz) {
    return {
      href: `/practice/quiz/${topic.quiz.slug}`,
      label: `Practise ${topic.name} (${topic.quiz.count} min)`,
    };
  }
  if (topic.extended) {
    return {
      href: `/practice/${topic.extended.id}`,
      label: `Practise ${topic.name} (${topic.extended.marks} min)`,
    };
  }
  return { href: "/home", label: `Practise ${topic.name}` };
}
