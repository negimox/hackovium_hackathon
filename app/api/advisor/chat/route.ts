import { NextRequest, NextResponse } from "next/server";
import {
  findUser,
  addChatMessage,
  getRecentMessages,
  patchUserProfile,
  getLatestPlan,
  savePlan,
} from "@/lib/db/mongodb";
import { processChat } from "@/lib/gemini/chat-agent";
import { generateFinancialPlan } from "@/lib/gemini/planning-agent";
import type { UserProfile } from "@/lib/schemas/financial-plan";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id: userId, message } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 },
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 },
      );
    }

    // Fetch user from database (supports both clerk_user_id and MongoDB ObjectId)
    const user = await findUser(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Use clerk_user_id for all operations (the canonical identifier)
    const clerkUserId = user.clerk_user_id;

    // Get latest plan for context (optional for chat)
    const latestPlan = await getLatestPlan(clerkUserId);

    // Get recent chat history for context
    const chatHistory = await getRecentMessages(clerkUserId, 10);

    // Build minimal profile for chat context
    const profile = user.profile as Partial<UserProfile>;

    // Process chat using Gemini
    const result = await processChat({
      message,
      history: chatHistory.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp?.toISOString(),
      })),
      userProfile: {
        name: profile.name || "User",
        age: profile.age || 30,
        annual_income: profile.annual_income || 0,
        monthly_expenses: profile.monthly_expenses || 0,
        risk_appetite: profile.risk_appetite || "moderate",
        primary_goal: profile.primary_goal || "wealth creation",
        target_retirement_age: profile.target_retirement_age || 60,
      },
    });

    if (!result.success || !result.response) {
      return NextResponse.json(
        { error: result.error || "Failed to process chat" },
        { status: 500 },
      );
    }

    // Save user message
    await addChatMessage(clerkUserId, {
      role: "user",
      content: message,
    });

    // Handle profile updates if detected
    if (
      result.response.profile_updates &&
      Object.keys(result.response.profile_updates).length > 0
    ) {
      await patchUserProfile(clerkUserId, result.response.profile_updates);
    }

    // Save assistant response (use 'reply' field from ChatResponse schema)
    await addChatMessage(clerkUserId, {
      role: "assistant",
      content: result.response.reply,
      triggered_replan: result.response.needs_replan,
      profile_updates: result.response.profile_updates,
    });

    // Handle replan if needed
    let newPlan = null;
    if (result.response.needs_replan) {
      try {
        // Fetch updated user profile
        const updatedUser = await findUser(userId);
        const planResult = await generateFinancialPlan({
          profile: updatedUser?.profile as UserProfile,
          casData: updatedUser?.cas_data,
        });

        if (planResult.success && planResult.plan) {
          // Convert token usage keys
          const tokenUsage = planResult.tokenUsage
            ? {
                prompt_tokens: planResult.tokenUsage.promptTokens,
                completion_tokens: planResult.tokenUsage.completionTokens,
                total_tokens: planResult.tokenUsage.totalTokens,
              }
            : undefined;

          const planDoc = await savePlan(
            clerkUserId,
            planResult.plan,
            "chat_replan",
            tokenUsage,
          );
          newPlan = {
            plan: planResult.plan,
            plan_id: planDoc._id?.toString(),
            version: planDoc.version,
          };
        }
      } catch (replanError) {
        console.warn("Replan failed:", replanError);
        // Continue without replan
      }
    }

    return NextResponse.json({
      success: true,
      message: result.response.reply,
      needs_replan: result.response.needs_replan,
      profile_updates: result.response.profile_updates,
      new_plan: newPlan,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to send chat message" },
      { status: 500 },
    );
  }
}
