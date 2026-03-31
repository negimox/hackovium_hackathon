import { NextRequest, NextResponse } from "next/server";
import {
  findUserByClerkId,
  getOrCreateUser,
  updateUserProfile,
  getLatestPlan,
} from "@/lib/db/mongodb";

// GET /api/advisor/profile?user_id=xxx
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("user_id");
    if (!userId) {
      return NextResponse.json({ error: "user_id required" }, { status: 400 });
    }

    // Get or create user (ensures user exists)
    const user = await getOrCreateUser(userId);

    // Get latest plan
    const latestPlan = await getLatestPlan(userId);

    return NextResponse.json({
      user_id: userId,
      profile: user.profile || {},
      onboarding_completed: user.onboarding_completed,
      cas_data: user.cas_data || null,
      latest_plan: latestPlan
        ? {
            plan_id: latestPlan._id?.toString(),
            version: latestPlan.version,
            created_at: latestPlan.created_at,
            plan: latestPlan.plan,
          }
        : null,
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}

// PUT /api/advisor/profile?user_id=xxx
export async function PUT(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("user_id");
    if (!userId) {
      return NextResponse.json({ error: "user_id required" }, { status: 400 });
    }

    const body = await req.json();

    // Update profile
    const updatedUser = await updateUserProfile(userId, body);

    if (!updatedUser) {
      // User doesn't exist, create with profile
      await getOrCreateUser(userId);
      const newUser = await updateUserProfile(userId, body);

      return NextResponse.json({
        success: true,
        user_id: userId,
        profile: newUser?.profile || body,
        onboarding_completed: true,
      });
    }

    return NextResponse.json({
      success: true,
      user_id: userId,
      profile: updatedUser.profile,
      onboarding_completed: updatedUser.onboarding_completed,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
