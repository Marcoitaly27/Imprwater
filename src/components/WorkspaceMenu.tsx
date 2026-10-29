import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
export function WorkspaceMenu({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    function outside(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        ref.current.open = false;
    }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);
  return (
    <details
      className="workspace-menu"
      ref={ref}
      onKeyDown={(e) => {
        if (e.key === "Escape" && ref.current) {
          ref.current.open = false;
          ref.current.querySelector("summary")?.focus();
        }
      }}
    >
      <summary>
        <SlidersHorizontal size={16} />
        <span>Actions</span>
        <ChevronDown size={14} />
      </summary>
      <div
        className="workspace-menu-content"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("button") && ref.current)
            ref.current.open = false;
        }}
      >
        {children}
      </div>
    </details>
  );
}
