import { GoogleGenAI, Type } from "@google/genai";

import { NextResponse } from "next/server";

const API_KEY = process.env.GOOGLE_API_KEY;

const genAI = new GoogleGenAI({
  apiKey: API_KEY,
});

if (!API_KEY) {
  console.error(
    "Google API Key (GOOGLE_API_KEY) environment variable not found."
  );
  // To prevent the application from erroring out during the build phase, we don't use process.exit(1) here,
  // but we will return an error when a request comes in.
}

export async function POST(request: Request) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: "API Key is not configured on the server." },
      { status: 500 }
    );
  }

  let topic: string;
  try {
    const body = await request.json();
    topic = body.topic;
    if (!topic || typeof topic !== "string") {
      return NextResponse.json(
        { error: "Invalid 'topic' field." },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Could not read request body or it's not in JSON format." },
      { status: 400 }
    );
  }

  try {
    const result = await genAI.models.generateContent({
      model: "gemini-2.5-pro-preview-03-25",
      config: {
        systemInstruction: `
        Generate a mind map about this topic. The response should ONLY be in the following JSON format and contain NO other text:
      `,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING },
                  data: {
                    type: Type.OBJECT,
                    properties: {
                      label: { type: Type.STRING },
                      description: { type: Type.STRING },
                      details: { type: Type.STRING },
                      color: { type: Type.STRING },
                    },
                    required: ["label", "description", "details", "color"],
                  },
                  position: {
                    type: Type.OBJECT,
                    properties: {
                      x: { type: Type.NUMBER },
                      y: { type: Type.NUMBER },
                    },
                    required: ["x", "y"],
                  },
                },
                required: ["id", "type", "data", "position"],
              },
            },
            edges: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  source: { type: Type.STRING },
                  target: { type: Type.STRING },
                  animated: { type: Type.BOOLEAN },
                  label: { type: Type.STRING },
                  color: { type: Type.STRING },
                },
                required: ["id", "source", "target", "animated"],
              },
            },
          },
          required: ["nodes", "edges"],
        },
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Topic: "${topic}"`,
            },
          ],
        },
      ],
    });

    // Parse the JSON string from the response
    const responseText = result.text || "{}";
    let mindMapData;

    try {
      mindMapData = JSON.parse(responseText);

      // Simple structure validation
      if (
        !mindMapData ||
        !Array.isArray(mindMapData.nodes) ||
        !Array.isArray(mindMapData.edges)
      ) {
        throw new Error(
          "API response does not contain the expected nodes/edges structure."
        );
      }
      // If validation succeeds, send the parsed data
      return NextResponse.json(mindMapData);
    } catch (parseError) {
      console.error(
        "API Response Parse Error (Server):",
        parseError,
        "Raw Response:",
        responseText
      );
      // If parsing fails, return the raw response or an error - the client side should also handle this
      // return NextResponse.json({ error: "Could not process API response.", details: (parseError as Error).message, rawResponse: responseText }, { status: 500 });
      // OR Send the raw response and let the client handle it:
      return new NextResponse(responseText, {
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Gemini API Error (Server):", error);
    return NextResponse.json(
      {
        error: "Server error occurred while generating the mind map.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
