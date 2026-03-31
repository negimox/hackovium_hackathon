import { NextRequest, NextResponse } from "next/server";
import { getChatHistory } from "@/lib/db/mongodb";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("user_id");
    if (!userId) {
      return NextResponse.json({ error: "user_id required" }, { status: 400 });
    }

    const chatDoc = await getChatHistory(userId);

    return NextResponse.json({
      user_id: userId,
      messages: chatDoc?.messages || [],
    });
  } catch (error) {
    console.error("Chat history error:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat history" },
      { status: 500 },
    );
  }
}
