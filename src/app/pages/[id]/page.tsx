import { getPageById } from "@/lib/pages";
import { notFound } from "next/navigation";
import PageEditor from "@/components/blocks/PageEditor";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PageView({ params }: PageProps) {
  const { id } = await params;
  const page = await getPageById(id);

  if (!page) {
    notFound();
  }

  return (
    <PageEditor
      pageId={page.id}
      pageName={page.name}
      initialBlocks={page.blocks}
    />
  );
}
