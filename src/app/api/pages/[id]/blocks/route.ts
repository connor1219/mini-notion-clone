import { NextRequest, NextResponse } from "next/server";
import { updatePage } from "@/lib/pages";
import { Block } from "@/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();
  const blocks: Block[] | undefined = body?.blocks;

  if (!Array.isArray(blocks)) {
    return NextResponse.json(
      { error: "blocks array is required" },
      { status: 400 }
    );
  }

  const updated = await updatePage(id, { blocks });

  if (!updated) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  return NextResponse.json({ blocks: updated.blocks });
}
