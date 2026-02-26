"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Block, TextBlock, ImageBlock } from "@/types";
import BlockWrapper from "./BlockWrapper";
import BlockRenderer from "./BlockRenderer";
import ImageBlockDialog, { ImageDialogValues } from "@/components/ImageBlockDialog";
import styles from "./PageEditor.module.css";

const DEBOUNCE_MS = 200;

interface PageEditorProps {
  pageId: string;
  pageName: string;
  initialBlocks: Block[];
}

export default function PageEditor({
  pageId,
  pageName,
  initialBlocks,
}: PageEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [focusBlockId, setFocusBlockId] = useState<string | null>(
    initialBlocks[0]?.id ?? null
  );
  const [imageDialogIndex, setImageDialogIndex] = useState<number | null>(null);
  const blocksRef = useRef(blocks);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);
  const pendingSaveRef = useRef(false);
  const dragIdRef = useRef<string | null>(null);

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  const saveBlocks = useCallback(
    async (toSave: Block[]) => {
      if (savingRef.current) {
        pendingSaveRef.current = true;
        return;
      }
      savingRef.current = true;
      try {
        await fetch(`/api/pages/${pageId}/blocks`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blocks: toSave }),
        });
      } finally {
        savingRef.current = false;
        if (pendingSaveRef.current) {
          pendingSaveRef.current = false;
          saveBlocks(blocksRef.current);
        }
      }
    },
    [pageId]
  );

  const scheduleSave = useCallback(
    (updatedBlocks: Block[]) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        saveBlocks(updatedBlocks);
      }, DEBOUNCE_MS);
    },
    [saveBlocks]
  );

  const flushSave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    saveBlocks(blocksRef.current);
  }, [saveBlocks]);

  const handleUpdateBlock = useCallback(
    (index: number, updates: Partial<Block>) => {
      setBlocks((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], ...updates } as Block;
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave]
  );

  const handleAddBlock = useCallback(
    (afterIndex: number) => {
      const newBlock: TextBlock = {
        id: crypto.randomUUID(),
        type: "text",
        content: "",
        style: "p",
      };
      setBlocks((prev) => {
        const next = [...prev];
        next.splice(afterIndex + 1, 0, newBlock);
        scheduleSave(next);
        return next;
      });
      setFocusBlockId(newBlock.id);
    },
    [scheduleSave]
  );

  const handleRequestImage = useCallback((index: number) => {
    setImageDialogIndex(index);
  }, []);

  const handleEditImage = useCallback((index: number) => {
    setImageDialogIndex(index);
  }, []);

  const handleImageConfirm = useCallback(
    (source: string, width: number, height: number) => {
      if (imageDialogIndex === null) return;
      setBlocks((prev) => {
        const next = [...prev];
        const imageBlock: ImageBlock = {
          id: next[imageDialogIndex].id,
          type: "image",
          source,
          width,
          height,
        };
        next[imageDialogIndex] = imageBlock;
        scheduleSave(next);
        return next;
      });
      setImageDialogIndex(null);
    },
    [imageDialogIndex, scheduleSave]
  );

  const imageDialogInitial: ImageDialogValues | null =
    imageDialogIndex !== null &&
    blocks[imageDialogIndex]?.type === "image"
      ? {
          source: (blocks[imageDialogIndex] as ImageBlock).source,
          width: (blocks[imageDialogIndex] as ImageBlock).width,
          height: (blocks[imageDialogIndex] as ImageBlock).height,
        }
      : null;

  const handleDeleteBlock = useCallback(
    (index: number) => {
      setBlocks((prev) => {
        if (prev.length <= 1) return prev;
        const next = [...prev];
        next.splice(index, 1);
        scheduleSave(next);

        let focusIdx = index - 1;
        while (focusIdx >= 0 && next[focusIdx].type !== "text") {
          focusIdx--;
        }
        if (focusIdx >= 0) {
          setFocusBlockId(next[focusIdx].id);
        }
        return next;
      });
    },
    [scheduleSave]
  );

  const handleDragHandleStart = useCallback((blockId: string) => {
    dragIdRef.current = blockId;
  }, []);

  const handleDragOver = useCallback((targetId: string) => {
    const dragId = dragIdRef.current;
    if (!dragId || dragId === targetId) return;
    setBlocks((prev) => {
      const fromIndex = prev.findIndex((b) => b.id === dragId);
      const toIndex = prev.findIndex((b) => b.id === targetId);
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    dragIdRef.current = null;
    saveBlocks(blocksRef.current);
  }, [saveBlocks]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{pageName}</h1>
      <div className={styles.blockList}>
        {blocks.map((block, index) => (

          <BlockWrapper
            key={block.id}
            block={block}
            onUpdate={(updates) => handleUpdateBlock(index, updates)}
            onAddBlock={() => handleAddBlock(index)}
            onDragHandleStart={handleDragHandleStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <BlockRenderer
              block={block}
              shouldFocus={focusBlockId === block.id}
              onUpdate={(updates) => handleUpdateBlock(index, updates)}
              onRequestImage={() => handleRequestImage(index)}
              onEditImage={() => handleEditImage(index)}
              onAddBlock={() => handleAddBlock(index)}
              onDeleteBlock={() => handleDeleteBlock(index)}
              onFocused={() => setFocusBlockId(null)}
              onFocus={() => setFocusBlockId(block.id)}
              onBlur={flushSave}
            />
          </BlockWrapper>
        ))}
      </div>

      <ImageBlockDialog
        open={imageDialogIndex !== null}
        initial={imageDialogInitial}
        onClose={() => setImageDialogIndex(null)}
        onConfirm={handleImageConfirm}
        onDelete={
          imageDialogInitial
            ? () => {
                if (imageDialogIndex !== null) {
                  handleDeleteBlock(imageDialogIndex);
                }
                setImageDialogIndex(null);
              }
            : undefined
        }
      />
    </div>
  );
}
