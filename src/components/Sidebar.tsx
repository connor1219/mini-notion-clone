"use client";

import { useEffect, useState, useCallback, useSyncExternalStore } from "react";
import { useRouter, usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";

interface PageSummary {
  id: string;
  name: string;
}

const MOBILE_BREAKPOINT = 768;
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT}px)`;

function subscribeToMediaQuery(callback: () => void) {
  const mql = window.matchMedia(MOBILE_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getIsMobileSnapshot() {
  return window.matchMedia(MOBILE_QUERY).matches;
}

function getIsMobileServerSnapshot() {
  return false;
}

function useIsMobile() {
  return useSyncExternalStore(
    subscribeToMediaQuery,
    getIsMobileSnapshot,
    getIsMobileServerSnapshot
  );
}

export default function Sidebar() {
  const [pages, setPages] = useState<PageSummary[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newPageName, setNewPageName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();

  useEffect(() => {
    setCollapsed(isMobile);
  }, [isMobile]);

  const fetchPages = useCallback(async () => {
    const res = await fetch("/api/pages");
    if (res.ok) {
      setPages(await res.json());
    }
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  async function handleCreate() {
    const name = newPageName.trim();
    if (!name) return;

    const res = await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (res.ok) {
      const page = await res.json();
      setNewPageName("");
      setIsCreating(false);
      await fetchPages();
      router.push(`/pages/${page.id}`);
    }
  }

  async function handleRename(id: string) {
    const name = editingName.trim();
    if (!name) return;

    const res = await fetch(`/api/pages/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (res.ok) {
      setEditingId(null);
      setEditingName("");
      await fetchPages();
      router.refresh();
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/pages/${id}`, { method: "DELETE" });
    if (res.ok) {
      await fetchPages();
      if (pathname === `/pages/${id}`) {
        router.push("/");
      }
    }
  }

  function startEditing(page: PageSummary) {
    setEditingId(page.id);
    setEditingName(page.name);
  }

  function handlePageClick(id: string) {
    router.push(`/pages/${id}`);
    if (isMobile) setCollapsed(true);
  }

  return (
    <>
      {!collapsed && isMobile && (
        <div
          className={styles.overlay}
          onClick={() => setCollapsed(true)}
        />
      )}

      <button
        className={`${styles.toggleButton} ${collapsed ? styles.toggleVisible : styles.toggleHidden}`}
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Open sidebar" : "Close sidebar"}
      >
        <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
          {collapsed ? (
            <path d="M1 2.75A.75.75 0 0 1 1.75 2h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 2.75Zm0 5A.75.75 0 0 1 1.75 7h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 7.75ZM1.75 12a.75.75 0 0 0 0 1.5h12.5a.75.75 0 0 0 0-1.5H1.75Z" />
          ) : (
            <path d="M9.78 4.22a.75.75 0 0 1 0 1.06L7.56 7.5h6.69a.75.75 0 0 1 0 1.5H7.56l2.22 2.22a.75.75 0 1 1-1.06 1.06l-3.5-3.5a.75.75 0 0 1 0-1.06l3.5-3.5a.75.75 0 0 1 1.06 0Z" />
          )}
        </svg>
      </button>

      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
        <div className={styles.header}>
          <span className={styles.title}>Pages</span>
          <div className={styles.headerActions}>
            <button
              className={styles.addButton}
              onClick={() => setIsCreating(true)}
              aria-label="New page"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 2a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 8 2Z" />
              </svg>
            </button>
            <button
              className={styles.collapseButton}
              onClick={() => setCollapsed(true)}
              aria-label="Close sidebar"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M9.78 4.22a.75.75 0 0 1 0 1.06L7.56 7.5h6.69a.75.75 0 0 1 0 1.5H7.56l2.22 2.22a.75.75 0 1 1-1.06 1.06l-3.5-3.5a.75.75 0 0 1 0-1.06l3.5-3.5a.75.75 0 0 1 1.06 0Z" />
              </svg>
            </button>
          </div>
        </div>

        <nav className={styles.pageList}>
          {pages.map((page) => {
            const isActive = pathname === `/pages/${page.id}`;

            if (editingId === page.id) {
              return (
                <div key={page.id} className={styles.pageItem}>
                  <input
                    className={styles.renameInput}
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(page.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    onBlur={() => handleRename(page.id)}
                    autoFocus
                  />
                </div>
              );
            }

            return (
              <div
                key={page.id}
                className={`${styles.pageItem} ${isActive ? styles.active : ""}`}
              >
                <button
                  className={styles.pageLink}
                  onClick={() => handlePageClick(page.id)}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className={styles.pageIcon}
                  >
                    <path d="M4.5 2A1.5 1.5 0 0 0 3 3.5v9A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5V6.621a1.5 1.5 0 0 0-.44-1.06L9.44 2.44A1.5 1.5 0 0 0 8.378 2H4.5ZM5 5.75A.75.75 0 0 1 5.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 5 5.75Zm.75 1.75a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5h-4.5Zm0 2.5a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5h-4.5Z" />
                  </svg>
                  <span className={styles.pageName}>{page.name}</span>
                </button>

                <div className={styles.actions}>
                  <button
                    className={styles.actionButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(page);
                    }}
                    aria-label="Rename page"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm1.414 1.06a.25.25 0 0 0-.354 0L3.463 11.1l-.47 1.64 1.64-.47 8.61-8.61a.25.25 0 0 0 0-.354l-1.086-1.086Z" />
                    </svg>
                  </button>
                  <button
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(page.id);
                    }}
                    aria-label="Delete page"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path d="M5.75 1a.75.75 0 0 0-.75.75V3H2a.75.75 0 0 0 0 1.5h.928l.856 9.419A1.5 1.5 0 0 0 5.277 15.5h5.446a1.5 1.5 0 0 0 1.493-1.581L13.072 4.5H14A.75.75 0 0 0 14 3h-3V1.75a.75.75 0 0 0-.75-.75h-4.5Zm-.5 2V2.5h5.5V3h-5.5ZM4.434 4.5l.839 9.227a.25.25 0 0 0 .249.263h5.446a.25.25 0 0 0 .249-.263L12.066 4.5H4.434Z" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </nav>

        {isCreating && (
          <div className={styles.createForm}>
            <input
              className={styles.createInput}
              placeholder="Page name..."
              value={newPageName}
              onChange={(e) => setNewPageName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") {
                  setIsCreating(false);
                  setNewPageName("");
                }
              }}
              autoFocus
            />
          </div>
        )}
      </aside>
    </>
  );
}
