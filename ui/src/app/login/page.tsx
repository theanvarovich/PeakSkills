import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/shared/Header";
import { loginAction } from "@/app/actions/auth";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "Invalid email or password. Please try again.",
  email_not_confirmed:
    "Please confirm your email address before signing in. Check your inbox.",
  missing_fields: "Please fill in all fields.",
  failed: "Something went wrong. Please try again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? "An error occurred. Please try again.") : null;

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <Header />
      <div className="flex flex-col flex-1 items-center justify-center p-8">
        <div className="max-w-md w-full bg-card p-8 rounded-xl border border-border space-y-6 shadow-sm">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to your PeakSkills account</p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive"
            >
              {errorMessage}
            </div>
          )}

          <form action={loginAction} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="login-email" className="text-sm font-medium">
                Email address
              </label>
              <Input
                id="login-email"
                name="email"
                type="email"
                required
                placeholder="name@example.com"
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="login-password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="login-password"
                name="password"
                type="password"
                required
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>
            <Button
              id="login-submit"
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            >
              Sign In
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:underline font-medium">
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
