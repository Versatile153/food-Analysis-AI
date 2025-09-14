import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIAnalysisResult, Food } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json({ error: "Server configuration error: Missing API key" }, { status: 500 });
    }

    const { base64Image } = await req.json();
    if (!base64Image) {
      return NextResponse.json({ error: "Missing base64Image" }, { status: 400 });
    }
    if (!base64Image.startsWith("data:image/")) {
      return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a nutrition expert. Analyze the image of food and identify all food items.
Return ONLY valid JSON in this format:
{
  "foods": [
    {"name": "Food Name", "calories": 0, "protein": 0, "carbs": 0, "fats": 0, "portion": "portion description"}
  ],
  "confidence": 0.0
}`;

    // Strip prefix → keep raw base64
    const base64Data = base64Image.split(",")[1];

    // ✅ Correct structure for Gemini SDK
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/jpeg", data: base64Data } }
          ]
        }
      ]
    });

    const content = result.response.text();
    if (!content) {
      return NextResponse.json({ error: "Empty response from Gemini" }, { status: 500 });
    }

    // Try to extract JSON
    const jsonMatch = content.match(/{[\s\S]*}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse AI response: No JSON found" }, { status: 500 });
    }

    let parsed: { foods: Omit<Food, "id">[]; confidence: number };
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (err: any) {
      return NextResponse.json({ error: `Failed to parse AI response: ${err.message}` }, { status: 500 });
    }

    if (!parsed.foods || !Array.isArray(parsed.foods)) {
      return NextResponse.json({ error: "Invalid JSON structure from Gemini" }, { status: 500 });
    }

    const foodsWithIds: Food[] = parsed.foods.map(food => ({
      ...food,
      id: Math.random().toString(36).substring(2, 15)
    }));

    return NextResponse.json({ foods: foodsWithIds, confidence: parsed.confidence });
  } catch (error: any) {
    console.error("Error in /api/analyze-food:", error);
    return NextResponse.json({ error: error.message || "Failed to analyze image" }, { status: 500 });
  }
}
