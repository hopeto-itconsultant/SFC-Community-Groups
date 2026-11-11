"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

const PENDING_MS = 12_000;

let pendingTimer = 0;
let seenUrl = "";

function clearNavigationPending() {
  window.clearTimeout(pendingTimer);
  pendingTimer = 0;
  delete document.documentElement.dataset.nav;
  document.querySelectorAll("a[data-nav-pending]").forEach((anchor) => {
    anchor.removeAttribute("data-nav-pending");
    anchor.removeAttribute("aria-busy");
    anchor.removeAttribute("aria-disabled");
  });
  const status = document.getElementById("nav-pending-status");
  if (status) status.textContent = "";
}

function isModifiedClick(event: MouseEvent) {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

/** In-app navigations only. Downloads, new tabs, and same-page hashes stay as they are. */
function isInAppNavigation(anchor: HTMLAnchorElement) {
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;
  const raw = anchor.getAttribute("href");
  if (!raw || raw.startsWith("#")) return false;
  let url: URL;
  try {
    url = new URL(anchor.href);
  } catch {
    return false;
  }
  if (url.origin !== window.location.origin) return false;
  if (url.pathname.endsWith("/download")) return false;
  return url.pathname !== window.location.pathname || url.search !== window.location.search;
}

function markPending(anchor: HTMLAnchorElement) {
  document.querySelectorAll("a[data-nav-pending]").forEach((other) => {
    if (other !== anchor) {
      other.removeAttribute("data-nav-pending");
      other.removeAttribute("aria-busy");
      other.removeAttribute("aria-disabled");
    }
  });
  anchor.dataset.navPending = "true";
  anchor.setAttribute("aria-busy", "true");
  anchor.setAttribute("aria-disabled", "true");
  document.documentElement.dataset.nav = "pending";
  const status = document.getElementById("nav-pending-status");
  if (status) status.textContent = "Loading";
  window.clearTimeout(pendingTimer);
  pendingTimer = window.setTimeout(clearNavigationPending, PENDING_MS);
}

function onDocumentClick(event: MouseEvent) {
  const node = event.target;
  const element = node instanceof Element ? node : node instanceof Node ? node.parentElement : null;
  if (!element) return;
  const anchor = element.closest("a");
  if (!(anchor instanceof HTMLAnchorElement)) return;

  if (anchor.dataset.navPending === "true" && !isModifiedClick(event)) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  if (event.defaultPrevented || isModifiedClick(event) || !isInAppNavigation(anchor)) return;
  markPending(anchor);
}

/**
 * Drops the indicator once the next screen is actually showing.
 * A route's `loading.tsx` placeholder (`data-app-loading`) keeps it up so a
 * slow page doesn't look idle after the URL changes.
 */
function NavigationReset() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const url = `${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    if (!seenUrl) {
      seenUrl = url;
      return;
    }
    if (seenUrl === url) return;
    seenUrl = url;
    if (document.documentElement.dataset.nav !== "pending") return;

    let observer: MutationObserver | null = null;
    const finish = () => {
      if (document.querySelector("[data-app-loading]")) return false;
      observer?.disconnect();
      clearNavigationPending();
      return true;
    };
    if (finish()) return;

    observer = new MutationObserver(() => {
      finish();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer?.disconnect();
  }, [url]);

  return null;
}

/**
 * Instant feedback for every in-app link, including server-rendered cards.
 * The marker is set in the click's capture phase, before the next paint, and
 * stays up through the route's loading placeholder until the next page is showing.
 */
export function NavigationFeedback() {
  useEffect(() => {
    document.addEventListener("click", onDocumentClick, true);
    window.addEventListener("pageshow", clearNavigationPending);
    return () => {
      document.removeEventListener("click", onDocumentClick, true);
      window.removeEventListener("pageshow", clearNavigationPending);
      window.clearTimeout(pendingTimer);
    };
  }, []);

  return (
    <>
      <div className="nav-progress" aria-hidden="true">
        <span />
      </div>
      <p id="nav-pending-status" className="sr-only" aria-live="polite" />
      <Suspense fallback={null}>
        <NavigationReset />
      </Suspense>
    </>
  );
}
