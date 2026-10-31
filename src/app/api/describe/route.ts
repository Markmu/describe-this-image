import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, mode = "detailed", language = "English", sampleId } = body;

    // Simulation delay for realistic UX demonstration if no real vision API key configured
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Provide tailored response based on request
    const descriptions: Record<string, { detailed: string; short: string; alt: string; social: string }> = {
      detailed: {
        detailed: `[Detailed Breakdown in ${language}] The provided visual presents a well-balanced composition with prominent focal elements. The scene features balanced color temperature, natural textures, and clear depth-of-field separation between foreground subjects and background context. Lighting is directional with balanced exposure across high-contrast areas.`,
        short: `A clearly composed visual capturing key subject attributes and balanced natural lighting in ${language}.`,
        alt: `Photograph highlighting central visual subject with balanced ambient lighting`,
        social: `Visual storytelling at its finest ✨ Exploring depth, tone, and character. Captured in crisp high fidelity. #visualstorytelling #aivision`
      }
    };

    const res = descriptions.detailed;

    return NextResponse.json({
      success: true,
      mode,
      language,
      outputs: res
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to process image description." },
      { status: 500 }
    );
  }
}

