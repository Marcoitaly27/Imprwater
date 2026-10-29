/** Official Imprwater artwork. Keep the supplied PNG and its colors unchanged. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`app-logo ${className}`}>
      <img src="/brand/imprwater-logo.png" alt="Logo Imprwater" width={1334} height={1179} decoding="async" />
    </span>
  );
}
