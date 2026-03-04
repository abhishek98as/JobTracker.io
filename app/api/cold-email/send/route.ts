import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/server-auth";
import {
  enforceEmailLimits,
  randomDelayMs,
  renderTemplate,
  sendSafeEmail,
  sleep,
  validateSpamSafety
} from "@/lib/email-sender";

const recipientSchema = z.object({
  companyName: z.string().min(1),
  hrEmail: z.string().email(),
  hrName: z.string().optional(),
  jobTitle: z.string().min(1),
  jobUrl: z.string().url().optional().or(z.literal(""))
});

const sendSchema = z.object({
  templateId: z.string().optional(),
  subject: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  senderProfile: z.object({
    userName: z.string().min(1),
    userSkills: z.string().min(1),
    userPhone: z.string().optional(),
    userLinkedIn: z.string().optional()
  }),
  recipients: z.array(recipientSchema).min(1).max(200),
  dryRun: z.boolean().optional(),
  skipDelay: z.boolean().optional()
});

const queueActionSchema = z.object({
  campaignId: z.string().min(1),
  action: z.enum(["pause", "resume"])
});

type ProcessOptions = {
  userId: string;
  campaignId: string;
  fromName: string;
  dryRun: boolean;
  skipDelay: boolean;
};

async function processCampaignQueue({ userId, campaignId, fromName, dryRun, skipDelay }: ProcessOptions) {
  const campaign = await prisma.emailCampaign.findFirst({
    where: {
      id: campaignId,
      userId
    },
    include: {
      sends: {
        orderBy: {
          createdAt: "asc"
        }
      }
    }
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  let successCount = campaign.successCount;
  let failureCount = campaign.failureCount;
  let processed = campaign.processed;

  const queuedLogs = campaign.sends.filter((log) => log.status === "queued");

  for (const sendLog of queuedLogs) {
    const currentCampaign = await prisma.emailCampaign.findUnique({
      where: { id: campaign.id },
      select: { status: true }
    });

    if (!currentCampaign || currentCampaign.status === "paused") {
      break;
    }

    await prisma.emailSendLog.update({
      where: { id: sendLog.id },
      data: { status: "sending" }
    });

    try {
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const [emailsLastHour, emailsToday] = await Promise.all([
        prisma.emailSendLog.count({
          where: {
            campaign: { userId },
            status: "sent",
            sentAt: {
              gte: hourAgo
            }
          }
        }),
        prisma.emailSendLog.count({
          where: {
            campaign: { userId },
            status: "sent",
            sentAt: {
              gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
            }
          }
        })
      ]);

      enforceEmailLimits(emailsLastHour, emailsToday);

      const safety = validateSpamSafety(sendLog.renderedSubj, sendLog.renderedBody);
      if (!safety.safe) {
        throw new Error(`Spam words detected: ${safety.violations.join(", ")}`);
      }

      if (!dryRun) {
        await sendSafeEmail({
          to: sendLog.hrEmail,
          subject: sendLog.renderedSubj,
          body: sendLog.renderedBody,
          fromName
        });
      }

      await prisma.emailSendLog.update({
        where: { id: sendLog.id },
        data: {
          status: "sent",
          sentAt: new Date(),
          errorMessage: null
        }
      });

      await prisma.application.create({
        data: {
          userId,
          company: sendLog.companyName,
          role: sendLog.jobTitle,
          platform: "cold_email",
          status: "applied",
          jobUrl: sendLog.jobUrl,
          contactName: sendLog.hrName,
          contactEmail: sendLog.hrEmail,
          appliedAt: new Date(),
          notes: "Auto-created from cold email campaign.",
          statusHistory: {
            create: {
              fromStatus: "created",
              toStatus: "applied"
            }
          }
        }
      });

      successCount += 1;
    } catch (error) {
      failureCount += 1;
      await prisma.emailSendLog.update({
        where: { id: sendLog.id },
        data: {
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Unknown send error"
        }
      });
    }

    processed += 1;

    await prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: {
        processed,
        successCount,
        failureCount
      }
    });

    if (!skipDelay && !dryRun && processed < campaign.totalRecipients) {
      await sleep(randomDelayMs());
    }
  }

  const [campaignState, unresolved] = await Promise.all([
    prisma.emailCampaign.findUnique({
      where: { id: campaign.id },
      select: { status: true }
    }),
    prisma.emailSendLog.count({
      where: {
        campaignId: campaign.id,
        status: {
          in: ["queued", "sending"]
        }
      }
    })
  ]);

  const finalStatus =
    campaignState?.status === "paused"
      ? "paused"
      : unresolved > 0
        ? "sending"
        : successCount === 0 && failureCount > 0
          ? "failed"
          : "sent";

  const updatedCampaign = await prisma.emailCampaign.update({
    where: { id: campaign.id },
    data: {
      status: finalStatus,
      finishedAt: finalStatus === "sent" || finalStatus === "failed" ? new Date() : null
    },
    include: {
      sends: true
    }
  });

  return {
    campaign: updatedCampaign,
    summary: {
      processed,
      successCount,
      failureCount
    }
  };
}

export async function GET() {
  try {
    const userId = await requireUserId();

    const campaigns = await prisma.emailCampaign.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        sends: {
          orderBy: {
            createdAt: "asc"
          }
        },
        template: true
      },
      take: 20
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const parsed = queueActionSchema.parse(await request.json());

    const campaign = await prisma.emailCampaign.findFirst({
      where: {
        id: parsed.campaignId,
        userId
      }
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (parsed.action === "pause") {
      const updated = await prisma.emailCampaign.update({
        where: { id: parsed.campaignId },
        data: {
          status: "paused"
        }
      });

      return NextResponse.json({ campaign: updated });
    }

    await prisma.emailCampaign.update({
      where: { id: parsed.campaignId },
      data: {
        status: "sending",
        finishedAt: null
      }
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true }
    });

    const processed = await processCampaignQueue({
      userId,
      campaignId: parsed.campaignId,
      fromName: user?.name || user?.email || "JobTrackr User",
      dryRun: false,
      skipDelay: false
    });

    return NextResponse.json(processed);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload", details: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update campaign status" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const parsed = sendSchema.parse(await request.json());

    let subjectTemplate = parsed.subject;
    let bodyTemplate = parsed.body;

    if (parsed.templateId) {
      const template = await prisma.emailTemplate.findFirst({
        where: {
          id: parsed.templateId,
          userId
        }
      });

      if (!template) {
        return NextResponse.json({ error: "Template not found" }, { status: 404 });
      }

      subjectTemplate = template.subject;
      bodyTemplate = template.body;
    }

    if (!subjectTemplate || !bodyTemplate) {
      return NextResponse.json({ error: "Provide templateId or subject+body." }, { status: 400 });
    }

    const campaign = await prisma.emailCampaign.create({
      data: {
        userId,
        templateId: parsed.templateId,
        totalRecipients: parsed.recipients.length,
        status: "sending",
        startedAt: new Date(),
        sends: {
          create: parsed.recipients.map((recipient) => {
            const renderedSubj = renderTemplate(subjectTemplate!, {
              ...recipient,
              ...parsed.senderProfile
            });
            const renderedBody = renderTemplate(bodyTemplate!, {
              ...recipient,
              ...parsed.senderProfile
            });

            return {
              companyName: recipient.companyName,
              hrEmail: recipient.hrEmail,
              hrName: recipient.hrName,
              jobTitle: recipient.jobTitle,
              jobUrl: recipient.jobUrl,
              renderedBody,
              renderedSubj,
              status: "queued"
            };
          })
        }
      }
    });

    const processed = await processCampaignQueue({
      userId,
      campaignId: campaign.id,
      fromName: parsed.senderProfile.userName,
      dryRun: parsed.dryRun ?? false,
      skipDelay: parsed.skipDelay ?? false
    });

    return NextResponse.json(processed);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload", details: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to process campaign", details: error instanceof Error ? error.message : null }, { status: 500 });
  }
}