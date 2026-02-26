"use client";

import { useState, useCallback, useEffect } from "react";
import Dialog from "./Dialog";
import styles from "./ImageBlockDialog.module.css";

function loadImageDimensions(
  src: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

export interface ImageDialogValues {
  source: string;
  width: number;
  height: number;
}

interface ImageBlockDialogProps {
  open: boolean;
  initial?: ImageDialogValues | null;
  onClose: () => void;
  onConfirm: (source: string, width: number, height: number) => void;
  onDelete?: () => void;
}

export default function ImageBlockDialog({
  open,
  initial,
  onClose,
  onConfirm,
  onDelete,
}: ImageBlockDialogProps) {
  const [url, setUrl] = useState("");
  const [width, setWidth] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!initial;

  useEffect(() => {
    if (open && initial) {
      setUrl(initial.source);
      setWidth(String(initial.width));
      setHeight(String(initial.height));
      setLoaded(true);
    } else if (open) {
      setUrl("");
      setWidth("");
      setHeight("");
      setLoaded(false);
    }
  }, [open, initial]);

  const reset = useCallback(() => {
    setUrl("");
    setWidth("");
    setHeight("");
    setLoaded(false);
    setLoading(false);
    setError(null);
  }, []);

  function handleClose() {
    reset();
    onClose();
  }

  async function handleLoadUrl() {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Please enter a URL");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const dims = await loadImageDimensions(trimmed);
      setWidth(String(dims.width));
      setHeight(String(dims.height));
      setLoaded(true);
      setLoading(false);
    } catch {
      setError("Could not load image. Please check the URL and try again.");
      setLoading(false);
    }
  }

  function handleSubmit() {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Please enter a URL");
      return;
    }

    const w = parseInt(width, 10);
    const h = parseInt(height, 10);

    if (!w || w <= 0 || !h || h <= 0) {
      setError("Width and height must be positive numbers");
      return;
    }

    reset();
    onConfirm(trimmed, w, h);
  }

  function handleDelete() {
    reset();
    onDelete?.();
  }

  const title = isEditing ? "Edit Image" : "Insert Image";
  const confirmLabel = isEditing ? "Save" : "Insert";

  return (
    <Dialog open={open} title={title} onClose={handleClose}>
      <div className={styles.form}>
        <label htmlFor="image-url-input">Image URL</label>
        <div className={styles.urlRow}>
          <input
            id="image-url-input"
            type="url"
            placeholder="https://example.com/image.png"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setLoaded(false);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (loaded) handleSubmit();
                else handleLoadUrl();
              }
            }}
            autoFocus
            disabled={loading}
          />
          {!loaded && (
            <button
              className={styles.loadButton}
              onClick={handleLoadUrl}
              disabled={loading || !url.trim()}
            >
              {loading ? "Loading..." : "Load"}
            </button>
          )}
        </div>

        {loaded && (
          <div className={styles.dimensionRow}>
            <div className={styles.dimensionField}>
              <label htmlFor="image-width-input">Width</label>
              <input
                id="image-width-input"
                type="text"
                inputMode="numeric"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              />
            </div>
            <span className={styles.dimensionSeparator}>×</span>
            <div className={styles.dimensionField}>
              <label htmlFor="image-height-input">Height</label>
              <input
                id="image-height-input"
                type="text"
                inputMode="numeric"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              />
            </div>
          </div>
        )}

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          {isEditing && onDelete && (
            <button
              className={styles.deleteButton}
              onClick={handleDelete}
              disabled={loading}
            >
              Delete
            </button>
          )}
          <div className={styles.actionsSpacer} />
          <button
            className={styles.cancelButton}
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className={styles.confirmButton}
            onClick={handleSubmit}
            disabled={loading || !loaded}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
