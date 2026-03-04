import { EMAIL_BLACKLIST_WORDS } from "@/lib/constants";

export function findSpamWords(content: string) {
  const lowered = content.toLowerCase();
  return EMAIL_BLACKLIST_WORDS.filter((word) => lowered.includes(word));
}

export function buildSafeUnsubscribeLine(content: string) {
  const line = "If this is not relevant, please let me know and I will not follow up.";
  if (content.includes(line)) {
    return content;
  }
  return `${content.trim()}\n\n${line}`;
}