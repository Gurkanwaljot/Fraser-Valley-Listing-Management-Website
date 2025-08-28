import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import AgentSelectionModal from "./AgentSelectionModal";

export default function ActionsMenu({ listingId, viewHref, onDelete }) {
  const [open, setOpen] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const btnRef = useRef(null);
  const firstRef = useRef(null); // first menu item
  const lastRef  = useRef(null); // last menu item
  const menuRef  = useRef(null);

  const close = useCallback(() => setOpen(false), []);

  // Close on outside click / Esc
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      if (btnRef.current && btnRef.current.contains(e.target)) return;
      close();
    };
    const onEsc = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
        if (btnRef.current) btnRef.current.focus();
      }
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open, close]);

  const openAndFocusFirst = () => {
    setOpen(true);
    requestAnimationFrame(() => {
      if (firstRef.current) firstRef.current.focus();
    });
  };

  const onTriggerKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      openAndFocusFirst();
    }
  };

  // ✅ No bare ternary; use if/else to satisfy ESLint
  const onMenuKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (document.activeElement === lastRef.current) {
        if (firstRef.current) firstRef.current.focus();
      } else {
        if (lastRef.current) lastRef.current.focus();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (document.activeElement === firstRef.current) {
        if (lastRef.current) lastRef.current.focus();
      } else {
        if (firstRef.current) firstRef.current.focus();
      }
    } else if (e.key === "Tab") {
      close();
    }
  };

  const sendToAgentModal = () => {
    console.log("hello")
    setShowAgentModal(true);
    console.log(showAgentModal)
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        title="More actions"
        onClick={() => (open ? close() : openAndFocusFirst())}
        onKeyDown={onTriggerKeyDown}
        className="more-actions"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
        <span className="sr-only">Open actions menu</span>
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Row actions"
          onKeyDown={onMenuKeyDown}
          className=" row-actions fixed z-50 mt-2 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg ring-1 ring-black/5 dark:border-gray-700 dark:bg-gray-800"
        >
          <Link
            to={viewHref}
            role="menuitem"
            ref={firstRef}
            onClick={close}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-800 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none dark:text-gray-100 dark:hover:bg-gray-700 dark:focus:bg-gray-700"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M13.172 12L8.222 7.05l1.414-1.414L16 12l-6.364 6.364-1.414-1.414z" />
              </svg>
            </span>
            View listing
          </Link>
            <button
            type="button"
            role="sendemail"
            onClick={sendToAgentModal}
            ref={firstRef}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-800 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none dark:text-gray-100 dark:hover:bg-gray-700 dark:focus:bg-gray-700">
                <span className="inline-flex h-5 w-5 items-center justify-center">
                     <svg class="send-icon" viewBox="0 0 24 24" fill="none">
                        <path d="M4 12h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        <path d="M12 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </span>
                Send To Agent
          </button>
          <button
            type="button"
            role="menuitem"
            ref={lastRef}
            onClick={() => {
              close();
              if (typeof onDelete === "function") onDelete(); // ✅ no optional-call
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 focus:bg-red-50 focus:outline-none dark:text-red-400 dark:hover:bg-red-900/30 dark:focus:bg-red-900/30"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 7h2v8h-2v-8zm4 0h2v8h-2v-8zM6 10h2v8H6v-8z" />
              </svg>
            </span>
            Delete
          </button>
          <AgentSelectionModal
            open={showAgentModal}
            listingId={listingId}
            onClose={() => setShowAgentModal(false)} />
        </div>
      )}
    </div>
  );
}