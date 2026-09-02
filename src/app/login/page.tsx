import Link from "next/link";

import { safeInternalPath } from "@/lib/navigation";

import { sendMagicLink } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
    sent?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  invalid_email: "Enter a valid email address.",
  invalid_link: "That sign-in link is invalid or expired.",
  missing_code: "That sign-in link is incomplete.",
  profile_not_claimed: "Use your invitation link to claim your profile first.",
  sign_in_failed: "We could not send a sign-in link. Please try again.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = safeInternalPath(params.next);
  const error = params.error ? errorMessages[params.error] : undefined;

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <Link className="auth-brand" href="/">
          <span aria-hidden="true">ΘΦ</span>
          Theta Phi
        </Link>
        <p className="eyebrow auth-eyebrow">Private brother portal</p>
        <h1>Welcome, Brother.</h1>
        <p className="auth-copy">
          Enter the email connected to your invitation. We will send you a
          secure, passwordless sign-in link.
        </p>

        {params.sent === "1" ? (
          <div className="notice success" role="status">
            Check your inbox for your secure sign-in link.
          </div>
        ) : null}
        {error ? (
          <div className="notice error" role="alert">
            {error}
          </div>
        ) : null}

        <form action={sendMagicLink} className="auth-form">
          <input name="next" type="hidden" value={next} />
          <label htmlFor="email">Email address</label>
          <input
            autoComplete="email"
            id="email"
            name="email"
            placeholder="you@example.com"
            required
            type="email"
          />
          <button type="submit">Email my sign-in link</button>
        </form>

        <p className="auth-help">
          Do not have an invitation? Contact a chapter officer to confirm your
          profile.
        </p>
      </section>
    </main>
  );
}
