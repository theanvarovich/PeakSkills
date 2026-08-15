import Link from "next/link";

/**
 * PeakSkills CSS Wordmark Logo
 * Renders a typographic wordmark that is always visible regardless of background.
 * "Peak" in dark foreground, "Skills" in brand primary accent.
 */
export function WordmarkLogo() {
  return (
    <Link href="/" className="flex items-center gap-0 font-semibold text-xl tracking-tight select-none">
      <span className="text-foreground">Peak</span>
      <span className="text-primary">Skills</span>
    </Link>
  );
}
