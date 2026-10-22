/**
 * SH-07-R9: the decorative "Orbit" mark -- a centre dot with two orbiting rings/satellites.
 * `aria-hidden` throughout. Shared by `AppSidebar`'s wordmark link and the login page's
 * brand header so both show the exact same mark (polish pass: previously defined only inside
 * `AppSidebar`).
 */
export function OrbitMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden="true"
      className={className ?? "shrink-0"}
    >
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
      <ellipse
        cx="12"
        cy="12"
        rx="10"
        ry="4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <ellipse
        cx="12"
        cy="12"
        rx="4.5"
        ry="10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        transform="rotate(35 12 12)"
      />
      <circle cx="21.2" cy="12" r="1.4" fill="currentColor" />
    </svg>
  );
}
