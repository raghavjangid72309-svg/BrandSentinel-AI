import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 60;

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
];

type Finding = {
  issue: string;
  severity: "High" | "Medium" | "Low";
  evidence: string;
  recommendation: string;
};

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "AI service is not configured." },
        { status: 500 }
      );
    }

    const formData = await request.formData();

    const image = formData.get("image");
    const guidelines = formData.get("guidelines");
    const findingsRaw = formData.get("findings");

    if (!(image instanceof File)) {
      return NextResponse.json(
        { error: "Please upload an advertisement image." },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(image.type)) {
      return NextResponse.json(
        { error: "Use a PNG, JPG, or WEBP image." },
        { status: 400 }
      );
    }

    if (image.size === 0 || image.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image must be smaller than 5 MB." },
        { status: 400 }
      );
    }

    if (
      typeof guidelines !== "string" ||
      !guidelines.trim() ||
      guidelines.length > 5000
    ) {
      return NextResponse.json(
        { error: "Provide valid brand guidelines." },
        { status: 400 }
      );
    }

    if (typeof findingsRaw !== "string") {
      return NextResponse.json(
        { error: "Review findings are required." },
        { status: 400 }
      );
    }

    let findings: Finding[];

    try {
      const parsed: unknown = JSON.parse(findingsRaw);

      if (!Array.isArray(parsed)) {
        throw new Error("Findings must be an array.");
      }

      findings = parsed.filter((item: unknown) => {
        if (typeof item !== "object" || item === null) {
          return false;
        }

        const finding = item as Record<string, unknown>;

        return (
          typeof finding.issue === "string" &&
          typeof finding.evidence === "string" &&
          typeof finding.recommendation === "string" &&
          ["High", "Medium", "Low"].includes(
            String(finding.severity)
          )
        );
      });

      if (findings.length !== parsed.length) {
        throw new Error("Invalid finding format.");
      }
    } catch {
      return NextResponse.json(
        { error: "Review findings have an invalid format." },
        { status: 400 }
      );
    }

    if (findings.length === 0) {
      return NextResponse.json(
        {
          error:
            "No issues were found. The original image should remain unchanged.",
        },
        { status: 400 }
      );
    }

    if (findings.length > 30) {
      return NextResponse.json(
        { error: "Too many findings to process." },
        { status: 400 }
      );
    }

    const bytes = Buffer.from(await image.arrayBuffer());
    const base64 = bytes.toString("base64");

    const correctionInstructions = findings
      .map(
        (finding, index) =>
          `${index + 1}. Issue: ${finding.issue}\n` +
          `Evidence: ${finding.evidence}\n` +
          `Required correction: ${finding.recommendation}`
      )
      .join("\n\n");

    const prompt = `
Edit the supplied advertisement to address the review findings.

BRAND GUIDELINES:
${guidelines}

REVIEW FINDINGS:
${correctionInstructions}

EDITING REQUIREMENTS:
- Use the supplied image as the visual reference.
- Correct the listed issues while retaining the original brand identity.
- Preserve the product, subject, composition, and overall visual intent.
- Keep compliant design elements unchanged wherever possible.
- Follow the brand guidelines for tone, colours, and visual style.
- Do not invent product features, statistics, endorsements, or guarantees.
- Do not introduce new factual claims.
- If text cannot be reproduced accurately, do not replace it with invented claims.
- Return an edited advertisement image, not a written explanation.
`;

    const ai = new GoogleGenAI({ apiKey });

    const result = await ai.interactions.create({
      model: "gemini-nano-banana-2.1",
      input: [
        {
          type: "image",
          mime_type: image.type,
          data: base64,
        },
        {
          type: "text",
          text: prompt,
        },
      ],
    });

    let generatedImage: string | null = null;
    let generatedMimeType = "image/png";

    // Prefer the final output image when the SDK exposes it.
    const outputImage = result.output_image;

    if (outputImage?.data) {
      generatedImage = outputImage.data;
      generatedMimeType = outputImage.mime_type || "image/png";
    } else {
      // Fallback: inspect model output blocks.
      for (const step of result.steps ?? []) {
        if (step.type !== "model_output") continue;

        for (const block of step.content ?? []) {
          if (block.type === "image" && block.data) {
            generatedImage = block.data;
            generatedMimeType = block.mime_type || "image/png";
          }
        }
      }
    }

    if (!generatedImage) {
      return NextResponse.json(
        {
          error:
            "The image model did not return an edited image. Please try again.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      correctedImage: `data:${generatedMimeType};base64,${generatedImage}`,
      disclaimer:
        "AI-generated correction. Check all text, logos, product details, and claims before publication.",
    });
  } catch (error: unknown) {
    console.error("BrandSentinel image correction failed.");

    const message =
      error instanceof Error ? error.message : "";

    if (
      message.includes("429") ||
      message.includes("RESOURCE_EXHAUSTED")
    ) {
      return NextResponse.json(
        {
          error:
            "The image generation quota may have been reached. Check your API usage and try again later.",
        },
        { status: 429 }
      );
    }

    if (
      message.includes("503") ||
      message.includes("UNAVAILABLE")
    ) {
      return NextResponse.json(
        {
          error: "The AI service is busy. Please try again shortly.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error:
          "Image correction failed. Check the server terminal for details.",
      },
      { status: 500 }
    );
  }
}