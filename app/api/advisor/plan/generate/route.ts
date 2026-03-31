import { NextRequest, NextResponse } from "next/server";
import { findUser, savePlan } from "@/lib/db/mongodb";
import { generateFinancialPlan } from "@/lib/gemini/planning-agent";
import type { UserProfile } from "@/lib/schemas/financial-plan";

export async function POST(req: NextRequest) {
  try {
    let userId = "";
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const json = await req.json();
      userId = json.user_id;
    } else {
      const formData = await req.formData();
      userId = formData.get("user_id") as string;
    }

    if (!userId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 },
      );
    }

    // Fetch user from database (supports both clerk_user_id and MongoDB ObjectId)
    const user = await findUser(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.profile || Object.keys(user.profile).length === 0) {
      return NextResponse.json(
        {
          error:
            "User profile not completed. Please complete onboarding first.",
        },
        { status: 400 },
      );
    }

    // Generate the financial plan using Gemini
    const result = await generateFinancialPlan({
      profile: user.profile as UserProfile,
      casData: user.cas_data,
    });

    if (!result.success || !result.plan) {
      return NextResponse.json(
        { error: result.error || "Failed to generate plan" },
        { status: 500 },
      );
    }

    // Save plan to database - convert token usage keys
    const tokenUsage = result.tokenUsage
      ? {
          prompt_tokens: result.tokenUsage.promptTokens,
          completion_tokens: result.tokenUsage.completionTokens,
          total_tokens: result.tokenUsage.totalTokens,
        }
      : undefined;

    const planDoc = await savePlan(
      user.clerk_user_id,
      result.plan,
      "onboarding",
      tokenUsage,
    );

    return NextResponse.json({
      success: true,
      plan: {
        ...planDoc.plan,
        _id: planDoc._id?.toString(),
        version: planDoc.version,
        created_at: planDoc.created_at?.toISOString(),
      },
      plan_id: planDoc._id?.toString(),
      version: planDoc.version,
    });
  } catch (error) {
    console.error("Plan generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate plan" },
      { status: 500 },
    );
  }
}
