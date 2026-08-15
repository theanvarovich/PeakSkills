import Link from "next/link";
import { Header } from "@/components/shared/Header";
import { Button } from "@/components/ui/button";

export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <Header />
      <div className="flex flex-col flex-1 items-center justify-center p-8">
        <div className="max-w-md w-full bg-card p-8 rounded-xl border border-border space-y-6 shadow-sm text-center">
          {/* Icon */}
          <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5A2.25 2.25 0 012.25 17.25V6.75M21.75 6.75L12 13.5 2.25 6.75M21.75 6.75A2.25 2.25 0 0019.5 4.5H4.5A2.25 2.25 0 002.25 6.75"
              />
            </svg>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We sent a confirmation link to{" "}
              {email ? (
                <span className="font-medium text-foreground">{email}</span>
              ) : (
                "your email address"
              )}
              . Click the link to activate your account.
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground text-left space-y-1">
            <p className="font-medium text-foreground">Didn&apos;t receive the email?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Check your spam or junk folder</li>
              <li>Make sure you entered the correct email</li>
              <li>Wait a few minutes and refresh</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/login">Return to Sign In</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full text-muted-foreground">
              <Link href="/register">Use a different email</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
