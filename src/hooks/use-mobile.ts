import * as React from "react";

const MOBILE_BREAKPOINT = 768;

// Rewritten from the shadcn-generated version (which called setState synchronously inside an
// effect, tripping this project's react-hooks/set-state-in-effect lint rule) to subscribe via
// useSyncExternalStore instead -- same public API and behavior, lint-clean, and SSR-safe.
function subscribe(onChange: () => void) {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.innerWidth < MOBILE_BREAKPOINT;
}

function getServerSnapshot() {
  return false;
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
