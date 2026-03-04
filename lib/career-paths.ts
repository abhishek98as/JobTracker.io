import careerData from "@/lib/career-paths.json";

type CareerRole = {
  name: string;
  summary: string;
  requiredSkills: string[];
  learningPath: string[];
};

export type CareerRecommendation = CareerRole & {
  score: number;
  missingSkills: string[];
};

function normalizeSkill(skill: string) {
  return skill.trim().toLowerCase();
}

export function recommendCareerPaths(selectedSkills: string[]) {
  const normalized = selectedSkills.map(normalizeSkill);

  return (careerData.roles as CareerRole[])
    .map((role) => {
      const matched = role.requiredSkills.filter((skill) => normalized.includes(normalizeSkill(skill)));
      const score = Math.round((matched.length / role.requiredSkills.length) * 100);
      const missingSkills = role.requiredSkills.filter((skill) => !normalized.includes(normalizeSkill(skill)));
      return {
        ...role,
        score,
        missingSkills
      };
    })
    .sort((a, b) => b.score - a.score);
}