"use client";

import { Block, TextBlock as TextBlockType } from "@/types";
import TextBlock from "./TextBlock";
import ImageBlock from "./ImageBlock";

interface BlockRendererProps {
  block: Block;
  shouldFocus: boolean;
  onUpdate: (updates: Partial<Block>) => void;
  onRequestImage: () => void;
  onEditImage: () => void;
  onAddBlock: () => void;
  onDeleteBlock: () => void;
  onFocused: () => void;
  onFocus: () => void;
  onBlur: () => void;
}

export default function BlockRenderer({
  block,
  shouldFocus,
  onUpdate,
  onRequestImage,
  onEditImage,
  onAddBlock,
  onDeleteBlock,
  onFocused,
  onFocus,
  onBlur,
}: BlockRendererProps) {
  switch (block.type) {
    case "text":
      return (
        <TextBlock
          block={block}
          shouldFocus={shouldFocus}
          onUpdate={(updates) => onUpdate(updates as Partial<TextBlockType>)}
          onRequestImage={onRequestImage}
          onAddBlock={onAddBlock}
          onDeleteBlock={onDeleteBlock}
          onFocused={onFocused}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      );
    case "image":
      return <ImageBlock block={block} onEdit={onEditImage} />;
    default:
      return null;
  }
}
