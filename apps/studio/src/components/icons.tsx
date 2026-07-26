/*
 * Inline SVG icons. One 24×24 box, `currentColor` stroke, no icon font and no asset request — the
 * `.icon` class in app.css supplies fill/stroke/width so every icon inherits its parent's colour and
 * a token-controlled stroke weight.
 *
 * Deliberately hand-rolled rather than a dependency: the whole set is a few hundred bytes and an
 * icon library would be the largest thing in the bundle that isn't the runtime.
 */
import type { ReactNode, SVGProps } from "react";

type IconProps = Omit<SVGProps<SVGSVGElement>, "viewBox" | "children">;

/** A stroke-only icon built from one or more path commands. */
const Icon = ({ paths, className = "icon", ...svg }: IconProps & { readonly paths: string | readonly string[] }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...svg}>
    {(typeof paths === "string" ? [paths] : paths).map((p) => (
      <path key={p} d={p} />
    ))}
  </svg>
);

/** The billet mark — a forged ingot seen end-on. Legible at 16px, scales to the first-run hero. */
export const BrandMark = ({ className = "brand-mark" }: { readonly className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path className="facet-fill" d="M12 22 2.5 12.6 12 10.2l9.5 2.4z" />
    <path className="facet-line" d="M12 2 2.5 12.6 12 22l9.5-9.4z" />
    <path className="facet-line" d="M2.5 12.6 12 10.2l9.5 2.4" />
  </svg>
);

export const MoonIcon = (p: IconProps) => <Icon {...p} paths="M20 14.2A8.2 8.2 0 0 1 9.8 4 8.5 8.5 0 1 0 20 14.2z" />;
export const SunIcon = (p: IconProps) => (
  <svg className={p.className ?? "icon"} viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
  </svg>
);
export const CloseIcon = (p: IconProps) => <Icon {...p} paths={["M6 6l12 12", "M18 6 6 18"]} />;
export const PencilIcon = (p: IconProps) => <Icon {...p} paths={["M4 20h4L19 9l-4-4L4 16z", "M14 6l4 4"]} />;
export const PlayIcon = ({ className = "icon icon-solid", ...p }: IconProps) => <Icon {...p} className={className} paths="M8 5.5v13l11-6.5z" />;
export const SendIcon = (p: IconProps) => <Icon {...p} paths="M5 12h13m0 0-5-5m5 5-5 5" />;
export const ReplayIcon = (p: IconProps) => <Icon {...p} paths={["M4 12a8 8 0 1 0 3-6.2", "M4 4v4h4"]} />;
export const CheckIcon = (p: IconProps) => <Icon {...p} paths="M5 12.5l4.5 4.5L19 7" />;
export const PlusIcon = (p: IconProps) => <Icon {...p} paths="M12 5v14M5 12h14" />;
/** A billet in profile with an antenna — the rail's shorthand for "an agent". */
export const AgentIcon = (p: IconProps) => (
  <svg className={p.className ?? "icon"} viewBox="0 0 24 24" aria-hidden="true">
    <rect x="4" y="8.5" width="16" height="11" rx="3" />
    <path d="M12 4v4.5" />
    <circle cx="12" cy="3" r="1.2" />
    <path d="M9 13.5v1.5M15 13.5v1.5" />
  </svg>
);
/** A spanner — "a tool", matching the rail's `tool` kind chip. */
export const ToolIcon = (p: IconProps) => (
  <Icon {...p} paths="M15.5 3.5a5 5 0 0 0-6.1 6.3L3.6 15.6a2 2 0 0 0 2.8 2.8l5.8-5.8a5 5 0 0 0 6.3-6.1l-2.9 2.9-2.6-.7-.7-2.6z" />
);
export const CrossIcon = (p: IconProps) => <Icon {...p} paths="M6.5 6.5l11 11M17.5 6.5l-11 11" />;
export const LockIcon = (p: IconProps) => (
  <svg className={p.className ?? "icon"} viewBox="0 0 24 24" aria-hidden="true">
    <rect x="4.5" y="10.5" width="15" height="9.5" rx="2" />
    <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
  </svg>
);
export const DeviceIcon = (p: IconProps) => (
  <svg className={p.className ?? "icon"} viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="4.5" width="18" height="12" rx="2" />
    <path d="M9 20h6M12 16.5V20" />
  </svg>
);
export const CloudIcon = (p: IconProps) => <Icon {...p} paths="M7.5 18.5A3.8 3.8 0 0 1 8 11a5.6 5.6 0 0 1 10.7 1.4A3.2 3.2 0 0 1 18 18.5z" />;
export const ShareIcon = (p: IconProps) => <Icon {...p} paths="M12 4v6m0 4v6M4.9 8.1l5.2 3m3.8 2.2 5.2 3M19.1 8.1l-5.2 3m-3.8 2.2-5.2 3" />;
export const ShieldIcon = ({ className = "icon", ...p }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...p}>
    <path d="M12 3.2 19 6v5.2c0 4.4-2.9 7.4-7 8.8-4.1-1.4-7-4.4-7-8.8V6z" />
    <path d="M9 12l2.2 2.2L15.5 10" />
  </svg>
);

/* ── Template glyphs. One per first-run card; `.tpl-glyph` sizes and colours them. ── */
const Glyph = ({ children }: { readonly children: ReactNode }) => (
  <svg className="tpl-glyph" viewBox="0 0 24 24" aria-hidden="true">
    {children}
  </svg>
);

export const ToolGlyph = () => (
  <Glyph>
    <path d="M14.5 6.5a3.5 3.5 0 0 0 4.6 4.6L21 20H3l1.9-8.9a3.5 3.5 0 0 0 4.6-4.6z" />
    <circle cx="12" cy="13" r="2" />
  </Glyph>
);
export const ChatGlyph = () => (
  <Glyph>
    <path d="M4 5.5h16v10H9l-5 4z" />
    <path d="M8 10h8" />
  </Glyph>
);
export const ExtractGlyph = () => (
  <Glyph>
    <path d="M5 4.5h9l5 5v10H5z" />
    <path d="M14 4.5v5h5M8 13h8M8 16h5" />
  </Glyph>
);
export const ApprovalGlyph = () => (
  <Glyph>
    <rect x="4.5" y="10" width="15" height="10" rx="2" />
    <path d="M8 10V7.5a4 4 0 0 1 8 0V10M10 15l1.8 1.8L15 13.5" />
  </Glyph>
);
export const HandoffGlyph = () => (
  <Glyph>
    <circle cx="6.5" cy="7" r="2.5" />
    <circle cx="17.5" cy="17" r="2.5" />
    <path d="M9 7h6.5a2 2 0 0 1 2 2v5M15 12l2.5 2.5L20 12" />
  </Glyph>
);
export const FrontierGlyph = () => (
  <Glyph>
    <path d="M7.5 18.5A3.8 3.8 0 0 1 8 11a5.6 5.6 0 0 1 10.7 1.4A3.2 3.2 0 0 1 18 18.5z" />
    <path d="M12 8V4M9.5 5.5 12 4l2.5 1.5" />
  </Glyph>
);
