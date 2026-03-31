import { NextRequest, NextResponse } from "next/server";
import { saveUserCASData } from "@/lib/db/mongodb";
import { GoogleGenAI } from "@google/genai";

const client = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || "" });

/**
 * Parse CAS PDF using Gemini's vision capabilities.
 * Note: For production, consider using a specialized CAS parser library
 * or a Python serverless function for more accurate parsing.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const userId = formData.get("user_id") as string | null;
    const password = (formData.get("password") as string) || "";

    if (!file) {
      return NextResponse.json(
        { error: "PDF file is required" },
        { status: 400 },
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 },
      );
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    // Use Gemini to extract mutual fund data from the CAS PDF
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: file.type || "application/pdf",
                data: base64Data,
              },
            },
            {
              text: `This is a Consolidated Account Statement (CAS) PDF from CAMS/KFintech containing mutual fund holdings. 

Extract the following information and return as JSON:

{
  "total_mf_value": <total current value of all mutual funds in INR>,
  "funds": [
    {
      "name": "<scheme name>",
      "value": <current value in INR>,
      "units": <number of units held>,
      "nav": <current NAV if available>,
      "amc": "<AMC name>"
    }
  ],
  "investor_name": "<investor name if visible>",
  "as_on_date": "<statement date>"
}

Return ONLY the JSON, no markdown or explanation.`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "";
    let casData;

    try {
      casData = JSON.parse(text);
    } catch {
      console.error("Failed to parse Gemini response:", text);
      return NextResponse.json(
        { error: "Failed to parse CAS data from PDF" },
        { status: 500 },
      );
    }

    // Save to user profile
    await saveUserCASData(userId, {
      total_mf_value: casData.total_mf_value || 0,
      funds: casData.funds || [],
    });

    return NextResponse.json({
      success: true,
      data: casData,
      message: "CAS PDF parsed and saved successfully",
    });
  } catch (error) {
    console.error("CAS parsing error:", error);
    return NextResponse.json(
      { error: "Failed to parse CAS PDF" },
      { status: 500 },
    );
  }
}
