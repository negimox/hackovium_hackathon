import { NextResponse } from "next/server";

const MARKET_API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.MARKET_API_URL ||
  "http://localhost:8000";

export async function GET() {
  try {
    const response = await fetch(`${MARKET_API_URL}/mutual-funds`, {
      next: { revalidate: 3600 }, // mutual funds change slowly (daily)
    });

    if (!response.ok) {
      throw new Error("Failed to fetch mutual funds from backend");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching mutual funds:", error);
    return NextResponse.json(
      { error: "Failed to fetch mutual funds data" },
      { status: 500 },
    );
  }
}
