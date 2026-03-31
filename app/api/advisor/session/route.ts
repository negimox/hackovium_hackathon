import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/db/mongodb";

// Session is no longer needed as we're using Clerk user IDs directly.
// This endpoint now just returns the user info for compatibility.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json({ error: "user_id required" }, { status: 400 });
    }

    // Ensure user exists
    const user = await getOrCreateUser(user_id);

    return NextResponse.json({
      success: true,
      user_id: user.clerk_user_id,
      session_id: user._id?.toString(), // Use MongoDB _id as session ID for compatibility
    });
  } catch (error) {
    console.error("Session creation error:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 },
    );
  }
}
