import { NextRequest, NextResponse } from "next/server";
import { getPageById, updatePage, deletePage } from "@/lib/pages";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const page = await getPageById(id);

  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  return NextResponse.json(page);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();
  const name = body?.name?.trim();

  if (!name) {
    return NextResponse.json(
      { error: "Page name is required" },
      { status: 400 }
    );
  }

  const updated = await updatePage(id, { name });

  if (!updated) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const deleted = await deletePage(id);

  if (!deleted) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
