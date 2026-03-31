import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser, findUserByClerkId } from "@/lib/db/mongodb";

interface InitUserPayload {
  clerk_user_id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}

/**
 * POST /api/advisor/user/init
 * Ensure user exists in DB on first login. Returns found status and ID.
 */
export async function POST(req: NextRequest) {
  try {
    const payload: InitUserPayload = await req.json();

    if (!payload.clerk_user_id) {
      return NextResponse.json(
        { error: "clerk_user_id required" },
        { status: 400 },
      );
    }

    // Check if user already exists
    const existingUser = await findUserByClerkId(payload.clerk_user_id);

    if (existingUser) {
      return NextResponse.json({
        found: true,
        user_id: existingUser._id?.toString(),
        onboarding_completed: existingUser.onboarding_completed,
      });
    }

    // Create new user
    const newUser = await getOrCreateUser(payload.clerk_user_id, payload.email);

    return NextResponse.json({
      found: true,
      user_id: newUser._id?.toString(),
      onboarding_completed: newUser.onboarding_completed,
    });
  } catch (error) {
    console.error("Error initializing user:", error);
    return NextResponse.json(
      { error: "Failed to initialize user session" },
      { status: 500 },
    );
  }
}
