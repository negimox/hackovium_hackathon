import { NextRequest, NextResponse } from "next/server";
import { findUserByClerkId, getOrCreateUser } from "@/lib/db/mongodb";

export async function GET(req: NextRequest) {
  try {
    const clerkId = req.nextUrl.searchParams.get("clerk_id");
    if (!clerkId) {
      return NextResponse.json({ error: "clerk_id required" }, { status: 400 });
    }

    // Get or create user
    const user = await getOrCreateUser(clerkId);

    return NextResponse.json({
      user_id: user._id?.toString(),
      clerk_user_id: user.clerk_user_id,
      email: user.email || null,
      onboarding_completed: user.onboarding_completed,
      created_at: user.created_at,
    });
  } catch (error) {
    console.error("User lookup error:", error);
    return NextResponse.json(
      { error: "Failed to lookup user" },
      { status: 500 },
    );
  }
}
