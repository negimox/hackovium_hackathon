import { NextRequest, NextResponse } from "next/server";
import { findUser, savePlan } from "@/lib/db/mongodb";
import { generateFinancialPlan } from "@/lib/gemini/planning-agent";
import type { UserProfile } from "@/lib/schemas/financial-plan";

/**
 * POST /api/advisor/plan/regenerate
 * Regenerate plan after profile changes (triggered by chat or manual).
 * Accepts either form data or JSON body.
 */
export async function POST(req: NextRequest) {
  try {
    let userId: string | null = null;

    // Handle both FormData and JSON body
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      userId = formData.get("user_id") as string;
    } else {
      const body = await req.json();
      userId = body.user_id;
    }

    if (!userId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 },
      );
    }

    // Fetch user profile from MongoDB (supports both clerk_user_id and MongoDB ObjectId)
    const user = await findUser(userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.profile || Object.keys(user.profile).length === 0) {
      return NextResponse.json(
        { error: "User profile not found. Complete onboarding first." },
        { status: 400 },
      );
    }

    // Generate new plan using Gemini
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

    // Save the plan to MongoDB - convert token usage keys
    const tokenUsage = result.tokenUsage
      ? {
          prompt_tokens: result.tokenUsage.promptTokens,
          completion_tokens: result.tokenUsage.completionTokens,
          total_tokens: result.tokenUsage.totalTokens,
        }
      : undefined;

    const savedPlan = await savePlan(
      user.clerk_user_id,
      result.plan,
      "chat_replan",
      tokenUsage,
    );

    // Return the saved plan with correct metadata (not the Gemini response)
    return NextResponse.json({
      success: true,
      message: "Plan regenerated with updated profile",
      plan: {
        ...savedPlan.plan,
        _id: savedPlan._id?.toString(),
        version: savedPlan.version,
        created_at: savedPlan.created_at?.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error regenerating plan:", error);
    return NextResponse.json(
      { error: "Failed to regenerate plan" },
      { status: 500 },
    );
  }
}
