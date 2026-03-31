import { NextRequest, NextResponse } from "next/server";
import { getLatestPlan, getLatestPlanByMongoId } from "@/lib/db/mongodb";

/**
 * GET /api/advisor/plan?user_id=xxx
 * Get the latest financial plan for a user.
 * Supports both clerk_user_id (string) and MongoDB ObjectId (24 hex chars).
 */
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json({ error: "user_id required" }, { status: 400 });
    }

    // Determine if it's a MongoDB ObjectId (24 hex chars) or clerk_user_id
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(userId);
    
    const latestPlan = isMongoId 
      ? await getLatestPlanByMongoId(userId)
      : await getLatestPlan(userId);

    if (!latestPlan) {
      return NextResponse.json(
        { success: false, error: "No plan found. Generate one first." },
        { status: 404 },
      );
    }

    // Serialize MongoDB document
    const serializedPlan = {
      _id: latestPlan._id?.toString(),
      user_id: latestPlan.user_id?.toString(),
      clerk_user_id: latestPlan.clerk_user_id,
      version: latestPlan.version,
      trigger: latestPlan.trigger,
      plan: latestPlan.plan,
      created_at: latestPlan.created_at?.toISOString(),
      token_usage: latestPlan.token_usage,
    };

    return NextResponse.json({
      success: true,
      plan: serializedPlan,
    });
  } catch (error) {
    console.error("Error fetching plan:", error);
    return NextResponse.json(
      { error: "Failed to fetch plan" },
      { status: 500 },
    );
  }
}
