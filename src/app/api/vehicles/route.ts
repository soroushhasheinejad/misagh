import { NextResponse } from "next/server";
import { getModels, getGenerations, getTrims, getMakes } from "@/lib/catalog";

/**
 * منبع داده انتخاب پله‌ای خودرو: برند ← مدل ← نسل ← تیپ
 * /api/vehicles?level=models&makeId=...
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const level = searchParams.get("level") ?? "makes";

  switch (level) {
    case "makes":
      return NextResponse.json(await getMakes());
    case "models": {
      const makeId = searchParams.get("makeId");
      if (!makeId) return NextResponse.json([], { status: 400 });
      return NextResponse.json(await getModels(makeId));
    }
    case "generations": {
      const modelId = searchParams.get("modelId");
      if (!modelId) return NextResponse.json([], { status: 400 });
      return NextResponse.json(await getGenerations(modelId));
    }
    case "trims": {
      const generationId = searchParams.get("generationId");
      if (!generationId) return NextResponse.json([], { status: 400 });
      return NextResponse.json(await getTrims(generationId));
    }
    default:
      return NextResponse.json({ error: "level نامعتبر است" }, { status: 400 });
  }
}
