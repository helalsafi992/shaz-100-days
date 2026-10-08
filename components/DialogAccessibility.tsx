"use client";
import { useEffect } from "react";
export default function DialogAccessibility() {
  useEffect(() => {
    let active: HTMLElement | null = null,
      previous: HTMLElement | null = null,
      overflow = "";
    const elements = () =>
      active
        ? Array.from(
            active.querySelectorAll<HTMLElement>(
              'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]',
            ),
          ).filter((e) => e.getClientRects().length)
        : [];
    const update = () => {
      const dialogs = document.querySelectorAll<HTMLElement>('[role="dialog"]'),
        next = dialogs[dialogs.length - 1] || null;
      if (next === active) return;
      if (next) {
        if (!active) {
          previous = document.activeElement as HTMLElement;
          overflow = document.body.style.overflow;
          document.body.style.overflow = "hidden";
        }
        active = next;
        elements()[0]?.focus();
      } else {
        active = null;
        document.body.style.overflow = overflow;
        if (previous?.isConnected) previous.focus();
        previous = null;
      }
    };
    const key = (event: KeyboardEvent) => {
      if (!active) return;
      if (event.key === "Escape") {
        const close = active.querySelector<HTMLButtonElement>(
          'button[aria-label^="Luk"]',
        );
        if (close) {
          event.preventDefault();
          close.click();
        }
      }
      if (event.key === "Tab") {
        const list = elements(),
          first = list[0],
          last = list[list.length - 1];
        if (!first) return;
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            !active.contains(document.activeElement))
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          (document.activeElement === last ||
            !active.contains(document.activeElement))
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    const observer = new MutationObserver(update);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("keydown", key);
    update();
    return () => {
      observer.disconnect();
      document.removeEventListener("keydown", key);
      document.body.style.overflow = overflow;
    };
  }, []);
  return null;
}
