import { Prisma } from "@prisma/client";

export type ApplicationFilterInput = {
  userId: string;
  query?: string;
  status?: string;
  platform?: string;
  from?: string;
  to?: string;
  resumeAssetId?: string;
  referralContactId?: string;
  staleOnly?: boolean;
  dueReminderOnly?: boolean;
};

export function buildApplicationWhere(filters: ApplicationFilterInput): Prisma.ApplicationWhereInput {
  const fromDate = filters.from ? new Date(filters.from) : undefined;
  const toDate = filters.to ? new Date(filters.to) : undefined;

  return {
    userId: filters.userId,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.platform ? { platform: filters.platform } : {}),
    ...(filters.resumeAssetId ? { resumeAssetId: filters.resumeAssetId } : {}),
    ...(filters.referralContactId ? { referralContactId: filters.referralContactId } : {}),
    ...(filters.query
      ? {
          OR: [
            { company: { contains: filters.query } },
            { role: { contains: filters.query } },
            { notes: { contains: filters.query } }
          ]
        }
      : {}),
    ...(fromDate || toDate
      ? {
          createdAt: {
            ...(fromDate ? { gte: fromDate } : {}),
            ...(toDate ? { lte: toDate } : {})
          }
        }
      : {})
  };
}
