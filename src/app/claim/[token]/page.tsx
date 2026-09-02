import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { claimProfile } from "./actions";

type ClaimPageProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
};

type InvitationPreview = {
  first_name: string;
  last_name: string;
  individual_line_name: string | null;
  crossing_season: string | null;
  crossing_year: number | null;
  group_line_name: string | null;
};

function formatLine(preview: InvitationPreview) {
  const term =
    preview.crossing_season && preview.crossing_year
      ? `${preview.crossing_season} ${preview.crossing_year}`
      : null;

  return [term, preview.group_line_name].filter(Boolean).join(" · ");
}

export default async function ClaimPage({
  params,
  searchParams,
}: ClaimPageProps) {
  const { token } = await params;
  const query = await searchParams;
  const supabase = await createSupabaseServerClient();
  const [{ data: previewRows }, { data: authData }] = await Promise.all([
    supabase.rpc("get_invitation_preview", { invitation_token: token }),
    supabase.auth.getUser(),
  ]);
  const preview = (previewRows?.[0] ?? null) as InvitationPreview | null;

  if (!preview) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <p className="eyebrow auth-eyebrow">Profile invitation</p>
          <h1>This link is no longer available.</h1>
          <p className="auth-copy">
            It may be expired, revoked, or already used. Ask a chapter officer
            for a new invitation.
          </p>
          <Link className="text-link" href="/login">
            Return to login
          </Link>
        </section>
      </main>
    );
  }

  const line = formatLine(preview);
  const claimPath = `/claim/${token}`;

  return (
    <main className="auth-shell">
      <section className="auth-card claim-card">
        <div className="step-label">Step 1 of 3</div>
        <p className="eyebrow auth-eyebrow">Confirm your identity</p>
        <h1>Is this your profile?</h1>

        <div className="profile-preview">
          <div className="profile-monogram" aria-hidden="true">
            {preview.first_name[0]}
            {preview.last_name[0]}
          </div>
          <strong>
            {preview.first_name} {preview.last_name}
          </strong>
          {preview.individual_line_name ? (
            <span>{preview.individual_line_name}</span>
          ) : null}
          {line ? <small>{line}</small> : null}
        </div>

        {query.error === "claim_failed" ? (
          <div className="notice error" role="alert">
            This profile could not be claimed. Confirm that you signed in with
            the email that received the invitation.
          </div>
        ) : null}

        {authData.user ? (
          <form action={claimProfile}>
            <input name="token" type="hidden" value={token} />
            <button className="wide-action" type="submit">
              Yes, this is me
            </button>
          </form>
        ) : (
          <Link
            className="wide-action"
            href={`/login?next=${encodeURIComponent(claimPath)}`}
          >
            Continue securely
          </Link>
        )}

        <p className="auth-help">
          Not your profile? Do not continue. Contact a chapter officer so the
          invitation can be corrected.
        </p>
      </section>
    </main>
  );
}
