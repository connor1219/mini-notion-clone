import fs from "fs/promises";
import path from "path";
import { Page } from "@/types";
import { createFileLock } from "./filelock";

const DATA_DIR = path.join(process.cwd(), "data");
const PAGES_PATH = path.join(DATA_DIR, "pages.json");
const PAGES_TMP_PATH = path.join(DATA_DIR, "pages.json.tmp");

const lock = createFileLock();

async function readPages(): Promise<Page[]> {
  const raw = await fs.readFile(PAGES_PATH, "utf-8");
  const data = JSON.parse(raw);
  return Array.isArray(data) ? data : [];
}

async function writePages(pages: Page[]): Promise<void> {
  const json = JSON.stringify(pages, null, 2);
  await fs.writeFile(PAGES_TMP_PATH, json, "utf-8");
  await fs.rename(PAGES_TMP_PATH, PAGES_PATH);
}

export function getAllPages(): Promise<Page[]> {
  return lock.withLock(() => readPages());
}

export function getPageById(id: string): Promise<Page | undefined> {
  return lock.withLock(async () => {
    const pages = await readPages();
    return pages.find((p) => p.id === id);
  });
}

export function createPage(page: Page): Promise<Page> {
  return lock.withLock(async () => {
    const pages = await readPages();
    pages.push(page);
    await writePages(pages);
    return page;
  });
}

export function updatePage(
  id: string,
  updates: Partial<Pick<Page, "name" | "blocks">>
): Promise<Page | null> {
  return lock.withLock(async () => {
    const pages = await readPages();
    const index = pages.findIndex((p) => p.id === id);
    if (index === -1) return null;
    if (updates.name !== undefined) {
      pages[index].name = updates.name;
    }
    if (updates.blocks !== undefined) {
      pages[index].blocks = updates.blocks;
    }
    await writePages(pages);
    return pages[index];
  });
}

export function deletePage(id: string): Promise<boolean> {
  return lock.withLock(async () => {
    const pages = await readPages();
    const index = pages.findIndex((p) => p.id === id);
    if (index === -1) return false;
    pages.splice(index, 1);
    await writePages(pages);
    return true;
  });
}
