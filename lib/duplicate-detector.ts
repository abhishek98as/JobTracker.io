const COMPANY_SUFFIXES = new Set([
  "inc",
  "incorporated",
  "llc",
  "limited",
  "ltd",
  "corp",
  "corporation",
  "co",
  "company",
  "pvt",
  "private"
]);

function cleanToken(token: string) {
  return token.trim().toLowerCase();
}

export function normalizeCompanyName(company: string) {
  const normalized = company
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map(cleanToken)
    .filter((token) => token && !COMPANY_SUFFIXES.has(token));

  return normalized.join(" ").trim();
}

function roleTokens(role: string) {
  return role
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map(cleanToken)
    .filter((token) => token.length > 1);
}

export function jaccardSimilarity(a: string, b: string) {
  const aTokens = new Set(roleTokens(a));
  const bTokens = new Set(roleTokens(b));

  if (!aTokens.size && !bTokens.size) {
    return 1;
  }

  const intersection = [...aTokens].filter((token) => bTokens.has(token)).length;
  const union = new Set([...aTokens, ...bTokens]).size;

  return union ? intersection / union : 0;
}

export type DuplicateCandidate = {
  id: string;
  company: string;
  role: string;
  status: string;
  appliedAt: Date | null;
  createdAt: Date;
};

export type DuplicateWarning = {
  applicationId: string;
  company: string;
  role: string;
  similarity: number;
  status: string;
  message: string;
};

export function detectDuplicateWarnings(params: {
  company: string;
  role: string;
  existingApplications: DuplicateCandidate[];
  threshold?: number;
}) {
  const threshold = params.threshold ?? 0.65;
  const normalizedCompany = normalizeCompanyName(params.company);

  const matches = params.existingApplications
    .filter((application) => normalizeCompanyName(application.company) === normalizedCompany)
    .map((application) => {
      const similarity = jaccardSimilarity(params.role, application.role);
      return {
        application,
        similarity
      };
    })
    .filter((item) => item.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .map(({ application, similarity }) => ({
      applicationId: application.id,
      company: application.company,
      role: application.role,
      similarity,
      status: application.status,
      message: `Possible duplicate: ${application.company} - ${application.role} (${Math.round(similarity * 100)}% role match).`
    }));

  return matches;
}