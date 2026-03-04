export const DEFAULT_TEMPLATE_SUBJECT = "Application for {{jobTitle}} - {{userName}}";

export const DEFAULT_TEMPLATE_BODY = `Hi {{hrName | "Hiring Manager"}},

I came across the {{jobTitle}} opening at {{companyName}} and was excited to apply. With my experience in {{userSkills}}, I believe I can contribute meaningfully to your team.

I have attached my resume for your consideration. I would love the opportunity to discuss how my background aligns with this role.

Looking forward to hearing from you.

Best regards,
{{userName}}
{{userPhone}}
{{userLinkedIn}}`;

export const TEMPLATE_VARIABLES = [
  "companyName",
  "hrName",
  "jobTitle",
  "userName",
  "userSkills",
  "userPhone",
  "userLinkedIn"
];