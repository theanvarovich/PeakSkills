import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/shared/Header";
import { registerAction } from "@/app/actions/auth";

const ERROR_MESSAGES: Record<string, string> = {
  missing_fields: "Please fill in all fields.",
  password_too_short: "Password must be at least 6 characters.",
  email_taken: "An account with this email already exists. Please sign in instead.",
  invalid_role: "Invalid account type selected.",
  rate_limited: "Too many registration attempts. Please wait a few minutes and try again.",
  invalid_email: "Please enter a valid email address.",
  failed: "Registration failed. Please try again.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; error?: string }>;
}) {
  const resolved = await searchParams;
  const type = resolved.type === "employer" ? "employer" : "candidate";
  const errorMessage = resolved.error
    ? (ERROR_MESSAGES[resolved.error] ?? "An error occurred. Please try again.")
    : null;

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <Header />
      <div className="flex flex-col flex-1 items-center justify-center p-8">
        <div className="max-w-md w-full bg-card p-8 rounded-xl border border-border space-y-6 shadow-sm">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-semibold tracking-tight">
              Join as {type === "employer" ? "an Employer" : "a Candidate"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Create your account to unlock precision matching.
            </p>
          </div>

          {/* Role Toggle */}
          <div className="flex bg-muted p-1 rounded-md" role="tablist">
            <Link
              href="?type=candidate"
              role="tab"
              aria-selected={type === "candidate"}
              className={`flex-1 text-center py-2 text-sm rounded transition-colors ${
                type === "candidate"
                  ? "bg-background shadow font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Candidate
            </Link>
            <Link
              href="?type=employer"
              role="tab"
              aria-selected={type === "employer"}
              className={`flex-1 text-center py-2 text-sm rounded transition-colors ${
                type === "employer"
                  ? "bg-background shadow font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Employer
            </Link>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive"
            >
              {errorMessage}
            </div>
          )}

          <form action={registerAction} className="space-y-4">
            <input type="hidden" name="type" value={type} />

            <div className="space-y-2">
              <label htmlFor="register-name" className="text-sm font-medium">
                {type === "employer" ? "Company Name" : "Full Name"}
              </label>
              <Input
                id="register-name"
                name="name"
                required
                type="text"
                placeholder={
                  type === "employer" ? "e.g. UzTech Solutions" : "e.g. Aziz Rakhimov"
                }
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="register-email" className="text-sm font-medium">
                Email address
              </label>
              <Input
                id="register-email"
                name="email"
                required
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="register-password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="register-password"
                name="password"
                required
                type="password"
                placeholder="At least 6 characters"
                autoComplete="new-password"
                minLength={6}
              />
            </div>

            <Button
              id="register-submit"
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            >
              Create Account
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
