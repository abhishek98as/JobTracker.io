import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type LogEventArgs = {
  userId: string;
  eventType: string;
  title: string;
  description?: string | null;
  applicationId?: string | null;
  occurredAt?: Date;
  meta?: Record<string, unknown> | null;
  tx?: Prisma.TransactionClient;
};

export async function logActivityEvent(args: LogEventArgs) {
  const client = args.tx ?? prisma;
  return client.activityEvent.create({
    data: {
      userId: args.userId,
      eventType: args.eventType,
      title: args.title,
      description: args.description ?? null,
      applicationId: args.applicationId ?? null,
      occurredAt: args.occurredAt ?? new Date(),
      metaJson: args.meta ? JSON.stringify(args.meta) : null
    }
  });
}