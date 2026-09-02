import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const { data: profile } = await supabase
    .from("brother_profiles")
    .select("first_name,last_verified_at")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/login?error=profile_not_claimed");
  }

  return (
    <main className="dashboard-shell">
      <header className="portal-header">
        <span className="brand-mark" aria-hidden="true">
          ΘΦ
        </span>
        <span>Brother Portal</span>
      </header>
      <section className="dashboard-welcome">
        <p className="eyebrow">Profile confirmed</p>
        <h1>Welcome, {profile.first_name}.</h1>
        <p>
          Your information is now connected to your account and marked as
          verified.
        </p>
        <div className="verified-badge">✓ Profile verified</div>
      </section>
    </main>
  );
}
