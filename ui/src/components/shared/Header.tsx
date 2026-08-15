import Link from "next/link";
import { WordmarkLogo } from "./WordmarkLogo";
import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function Header({ role }: { role?: "candidate" | "employer" | "admin" }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4 md:px-6 max-w-7xl mx-auto">
        <WordmarkLogo />
        <div className="flex-1" />
        <nav className="flex items-center gap-4 text-sm font-medium">
          {!role && (
            <>
              {/* Public demo mode - auth nav hidden */}
            </>
          )}

          {role === "candidate" && (
            <>
              <Link
                href="/dashboard"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Overview
              </Link>
              <Link
                href="/dashboard/jobs"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Recommended Jobs
              </Link>
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-xs shrink-0">
                C
              </div>
              <form action={logoutAction}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Log out
                </Button>
              </form>
            </>
          )}

          {role === "employer" && (
            <>
              <Link
                href="/employer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Overview
              </Link>
              <Link
                href="/employer/vacancies"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Vacancies
              </Link>
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-xs shrink-0">
                E
              </div>
              <form action={logoutAction}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Log out
                </Button>
              </form>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
