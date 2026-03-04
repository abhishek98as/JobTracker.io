import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/server-auth";

type QuestionEntry = {
  question: string;
  count: number;
  companies: Set<string>;
  roles: Set<string>;
};

function extractQuestions(text: string | null) {
  if (!text) {
    return [] as string[];
  }

  return text
    .split(/\n|\r|\?|\u2022|-/)
    .map((q) => q.trim())
    .filter((q) => q.length >= 8);
}

export async function GET() {
  try {
    const userId = await requireUserId();

    const rounds = await prisma.interviewRound.findMany({
      where: {
        application: {
          userId
        }
      },
      include: {
        application: {
          select: {
            company: true,
            role: true,
            id: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    const map = new Map<string, QuestionEntry>();

    rounds.forEach((round) => {
      extractQuestions(round.questionsAsked).forEach((question) => {
        const normalized = question.toLowerCase();
        if (!map.has(normalized)) {
          map.set(normalized, {
            question,
            count: 0,
            companies: new Set<string>(),
            roles: new Set<string>()
          });
        }

        const entry = map.get(normalized)!;
        entry.count += 1;
        entry.companies.add(round.application.company);
        entry.roles.add(round.application.role);
      });
    });

    const questionBank = [...map.values()]
      .sort((a, b) => b.count - a.count)
      .map((entry) => ({
        question: entry.question,
        count: entry.count,
        companies: [...entry.companies],
        roles: [...entry.roles]
      }));

    return NextResponse.json({
      questionBank,
      totalRounds: rounds.length
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to fetch question bank" }, { status: 500 });
  }
}