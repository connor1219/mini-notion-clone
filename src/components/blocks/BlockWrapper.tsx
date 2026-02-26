"use client";

import { useState, useRef, useEffect } from "react";
import { Block, TextBlockStyle } from "@/types";
import styles from "./BlockWrapper.module.css";

const STYLE_OPTIONS: { value: TextBlockStyle; label: string }[] = [
  { value: "p", label: "Text" },
  { value: "h1", label: "Heading 1" },
  { value: "h2", label: "Heading 2" },
  { value: "h3", label: "Heading 3" },
];

interface BlockWrapperProps {
  block: Block;
  onUpdate: (updates: Partial<Block>) => void;
  onAddBlock: () => void;
  onDragOver: (targetId: string) => void;
  onDragEnd: () => void;
  onDragHandleStart: (blockId: string) => void;
  children: React.ReactNode;
}

export default function BlockWrapper({
  block,
  onUpdate,
  onAddBlock,
  onDragOver,
  onDragEnd,
  onDragHandleStart,
  children,
}: BlockWrapperProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <div
      className={styles.wrapper}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        onDragOver(block.id);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDragEnd();
      }}
    >
      <div className={styles.handleArea}>
        <button
          className={styles.handle}
          draggable
          onClick={() => setMenuOpen((o) => !o)}
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setDragImage(e.currentTarget.parentElement!.parentElement!, 0, 0);
            onDragHandleStart(block.id);
          }}
          onDragEnd={onDragEnd}
          aria-label="Block options"
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="6" cy="4" r="1.5" />
            <circle cx="10" cy="4" r="1.5" />
            <circle cx="6" cy="8" r="1.5" />
            <circle cx="10" cy="8" r="1.5" />
            <circle cx="6" cy="12" r="1.5" />
            <circle cx="10" cy="12" r="1.5" />
          </svg>
        </button>

        {menuOpen && (
          <div ref={menuRef} className={styles.menu}>
            <div className={styles.menuSection}>
              <button
                className={styles.menuItem}
                onClick={() => {
                  onAddBlock();
                  setMenuOpen(false);
                }}
              >
                Add block below
              </button>
            </div>
            <div className={styles.menuDivider} />
            <div className={styles.menuSection}>
              <span className={styles.menuLabel}>Turn into</span>
              {block.type === "text" &&
                STYLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`${styles.menuItem} ${
                      block.style === opt.value ? styles.menuItemActive : ""
                    }`}
                    onClick={() => {
                      onUpdate({ style: opt.value });
                      setMenuOpen(false);
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              {block.type === "image" && (
                <span className={styles.menuHint}>
                  Image blocks cannot change style
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className={styles.content}>{children}</div>
    </div>
  );
}
