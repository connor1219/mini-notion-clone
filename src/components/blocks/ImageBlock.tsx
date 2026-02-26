"use client";

import { ImageBlock as ImageBlockType } from "@/types";
import styles from "./ImageBlock.module.css";

interface ImageBlockProps {
  block: ImageBlockType;
  onEdit: () => void;
}

export default function ImageBlock({ block, onEdit }: ImageBlockProps) {
  return (
    <div className={styles.imageBlock} onClick={onEdit} role="button" tabIndex={0}>
      {block.source ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={block.source}
          alt=""
          width={block.width}
          height={block.height}
          className={styles.image}
        />
      ) : (
        <div className={styles.placeholder}>Click to set image source</div>
      )}
    </div>
  );
}
