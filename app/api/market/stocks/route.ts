import { NextResponse } from "next/server";

const MARKET_API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.MARKET_API_URL ||
  "http://localhost:8000";

export async function GET() {
  try {
    const response = await fetch(`${MARKET_API_URL}/nse`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch stocks from backend");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching stocks:", error);
    return NextResponse.json(
      { error: "Failed to fetch market data" },
      { status: 500 },
    );
  }
}
