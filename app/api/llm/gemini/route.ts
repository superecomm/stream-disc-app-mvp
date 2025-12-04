import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt, model = "gemini-1.5-flash-latest", system } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing GOOGLE_GEMINI_API_KEY" }, { status: 500 });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          ...(system
            ? [{ role: "system", parts: [{ text: system }] }]
            : []),
          { role: "user", parts: [{ text: prompt }] },
        ],
      }),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: "Gemini request failed", details: errorPayload },
        { status: response.status }
      );
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((part: any) => part.text).join(" ").trim() ?? "";

    return NextResponse.json({ text, raw: data });
  } catch (error) {
    console.error("Gemini route error:", error);
    return NextResponse.json({ error: "Unexpected error calling Gemini" }, { status: 500 });
  }
}


