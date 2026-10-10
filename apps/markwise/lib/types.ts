export type SubjectId = "business" | "psychology" | "politics";

export type AoCode = "AO1" | "AO2" | "AO3" | "AO4";

export type AoWeight = Partial<Record<AoCode, number>>;

export type LevelBand = {
  level: number;
  min: number;
  max: number;
  descriptor: string;
};

export type QuestionType = "mcq" | "short" | "extended";

export type McqChoice = {
  id: string;
  text: string;
};

export type MarkMode = "levels" | "points" | "mcq";

export type MarkSource = "gemini" | "groq" | "mock" | "rules";

export type MarkAo = {
  code: string;
  name: string;
  awarded: number;
  max: number;
  comment: string;
  evidence?: string;
};

export type MarkResult = {
  mode: MarkMode;
  level: number;
  maxLevel: number;
  total: number;
  marks: number;
  summary: string;
  nextLevelTip: string;
  ao: MarkAo[];
  source: MarkSource;
  cached: boolean;
};

export type TopicSeed = {
  id: string;
  subject: SubjectId;
  specCode: string;
  specRef: string;
  name: string;
  planTitle: string;
  theme: string;
};

export type QuestionSeed = {
  id: string;
  topicId: string;
  specCode: string;
  type: QuestionType;
  commandWord: string | null;
  marks: number;
  stem: string;
  breadcrumb: string;
  choices?: McqChoice[];
  correctChoice?: string;
  shortPoints?: string[];
  pointLabels?: string[];
  aoWeights?: AoWeight;
  levels?: LevelBand[];
  indicativeContent?: string[];
  exemplarKey?: string;
  quizSlug?: string;
  quizOrder?: number;
};

export type ExemplarSeed = {
  id: string;
  exemplarKey: string;
  answer: string;
  level: number;
  marks: number;
  note: string;
};

export type RawMark = {
  level: number;
  summary: string;
  nextLevelTip: string;
  ao: {
    code: string;
    awarded: number;
    comment: string;
    evidence?: string;
  }[];
};
