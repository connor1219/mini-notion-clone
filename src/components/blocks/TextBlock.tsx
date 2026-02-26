"use client";

import { useRef, useEffect, useCallback } from "react";
import { TextBlock as TextBlockType, TextBlockStyle } from "@/types";
import styles from "./TextBlock.module.css";

type SlashCommand =
  | { action: "style"; style: TextBlockStyle }
  | { action: "image" };

const SLASH_COMMANDS: Record<string, SlashCommand> = {
  "/h1": { action: "style", style: "h1" },
  "/h2": { action: "style", style: "h2" },
  "/h3": { action: "style", style: "h3" },
  "/p": { action: "style", style: "p" },
  "/image": { action: "image" },
};

interface TextBlockProps {
  block: TextBlockType;
  shouldFocus: boolean;
  onUpdate: (updates: Partial<TextBlockType>) => void;
  onRequestImage: () => void;
  onAddBlock: () => void;
  onDeleteBlock: () => void;
  onFocused: () => void;
  onFocus: () => void;
  onBlur: () => void;
}

export default function TextBlock({
  block,
  shouldFocus,
  onUpdate,
  onRequestImage,
  onAddBlock,
  onDeleteBlock,
  onFocused,
  onFocus,
  onBlur,
}: TextBlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isComposing = useRef(false);
  const mountedContent = useRef(block.content);

  useEffect(() => {
    if (ref.current && mountedContent.current) {
      ref.current.textContent = mountedContent.current;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (shouldFocus && ref.current) {
      ref.current.focus();
      const sel = window.getSelection();
      if (sel && ref.current.childNodes.length > 0) {
        sel.selectAllChildren(ref.current);
        sel.collapseToEnd();
      }
      onFocused();
    }
  }, [shouldFocus, onFocused]);

  const handleInput = useCallback(() => {
    if (isComposing.current) return;
    const text = ref.current?.textContent ?? "";
    onUpdate({ content: text });
  }, [onUpdate]);

  const executeCommand = useCallback(
    (command: SlashCommand) => {
      if (ref.current) ref.current.textContent = "";

      if (command.action === "style") {
        onUpdate({ content: "", style: command.style });
        return;
      }

      if (command.action === "image") {
        onUpdate({ content: "" });
        onRequestImage();
      }
    },
    [onUpdate, onRequestImage]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const text = ref.current?.textContent ?? "";

      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();

        const trimmed = text.trim();
        const command = SLASH_COMMANDS[trimmed];
        if (command) {
          executeCommand(command);
          return;
        }

        onAddBlock();
        return;
      }

      if (e.key === " ") {
        const trimmed = text.trim();
        const command = SLASH_COMMANDS[trimmed];
        if (command) {
          e.preventDefault();
          executeCommand(command);
          return;
        }
      }

      if (e.key === "Backspace" && text === "") {
        e.preventDefault();
        onDeleteBlock();
      }
    },
    [onAddBlock, onDeleteBlock, executeCommand]
  );

  const styleClass = styles[block.style] ?? styles.p;

  const isEmpty = (ref.current?.textContent ?? block.content) === "";

  return (
    <div
      ref={ref}
      className={`${styles.textBlock} ${styleClass}`}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      onCompositionStart={() => {
        isComposing.current = true;
      }}
      onCompositionEnd={() => {
        isComposing.current = false;
        handleInput();
      }}
      spellCheck={false}
      autoCorrect="off"
      autoCapitalize="off"
      translate="no"
      data-placeholder="Type '/' for commands..."
      data-empty={isEmpty ? "true" : undefined}
    />
  );
}
