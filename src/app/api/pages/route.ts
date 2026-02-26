import { NextRequest, NextResponse } from "next/server";
import { getAllPages, createPage } from "@/lib/pages";
import { Page } from "@/types";

export async function GET() {
  const pages = await getAllPages();
  const summary = pages.map(({ id, name }) => ({ id, name }));
  return NextResponse.json(summary);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const name = body?.name?.trim();

  if (!name) {
    return NextResponse.json(
      { error: "Page name is required" },
      { status: 400 }
    );
  }

  const page: Page = {
    id: crypto.randomUUID(),
    name,
    blocks: [
      {
        id: crypto.randomUUID(),
        type: "text",
        content: "",
        style: "p",
      },
    ],
  };

  const created = await createPage(page);
  return NextResponse.json(created, { status: 201 });
}
