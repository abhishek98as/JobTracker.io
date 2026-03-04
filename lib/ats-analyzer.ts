export type ATSAnalysisResult = {
  score: number;
  missingKeywords: string[];
  matchedKeywords: string[];
  checklist: Array<{ item: string; passed: boolean; tip: string }>;
};

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "you",
  "your",
  "that",
  "this",
  "from",
  "have",
  "will",
  "are",
  "our",
  "any",
  "all",
  "using"
]);

function normalizeText(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9+.#\s-]/g, " ");
}

function extractKeywords(text: string) {
  const words = normalizeText(text)
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));

  const counts = new Map<string, number>();

  words.forEach((word) => {
    counts.set(word, (counts.get(word) ?? 0) + 1);
  });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 60)
    .map(([word]) => word);
}

export function analyzeATS(resumeText: string, jobDescriptionText: string): ATSAnalysisResult {
  const resumeNormalized = normalizeText(resumeText);
  const jdKeywords = extractKeywords(jobDescriptionText);
  const matchedKeywords = jdKeywords.filter((keyword) => resumeNormalized.includes(keyword));
  const missingKeywords = jdKeywords.filter((keyword) => !resumeNormalized.includes(keyword)).slice(0, 20);

  const keywordScore = jdKeywords.length ? Math.round((matchedKeywords.length / jdKeywords.length) * 65) : 0;

  const checklist = [
    {
      item: "Has Summary section",
      passed: /summary/.test(resumeNormalized),
      tip: "Add a concise 2-3 line summary with relevant domain keywords."
    },
    {
      item: "Has Skills section",
      passed: /skills?/.test(resumeNormalized),
      tip: "Include a dedicated skills section grouped by tools/languages."
    },
    {
      item: "Has Experience section",
      passed: /experience/.test(resumeNormalized),
      tip: "Add quantified bullets under work/projects (e.g. improved X by Y%)."
    },
    {
      item: "Has Education section",
      passed: /education/.test(resumeNormalized),
      tip: "Keep education concise and include completion year."
    },
    {
      item: "Avoid likely ATS formatting issues",
      passed: !/table|\|/.test(resumeText),
      tip: "Avoid complex tables and symbols-heavy layouts. Prefer simple headings."
    }
  ];

  const checklistScore = Math.round((checklist.filter((item) => item.passed).length / checklist.length) * 35);

  return {
    score: Math.min(100, keywordScore + checklistScore),
    missingKeywords,
    matchedKeywords,
    checklist
  };
}