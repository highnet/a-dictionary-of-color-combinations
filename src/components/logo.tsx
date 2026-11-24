/** Plate 001 — English Red · Cerulian Blue — registered with kentō marks. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <rect x="8" y="10" width="22" height="38" fill="#d96629" />
      <rect x="30" y="10" width="22" height="38" fill="#0093a5" />
      <path d="M57 46v9h-9" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path d="M9 55h14" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}
