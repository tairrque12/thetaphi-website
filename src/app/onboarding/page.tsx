import { redirect } from "next/navigation";

import { OnboardingForm } from "@/components/onboarding-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { completeOnboarding } from "./actions";

type OnboardingPageProps = {
  searchParams: Promise<{ error?: string }>;
};

type ClaimedProfile = {
  first_name: string;
  middle_name: string | null;
  last_name: string;
  individual_line_name: string | null;
  email: string | null;
  phone: string | null;
  street_address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  profession: string | null;
  employer: string | null;
  membership_status: "on_yard" | "alumni" | null;
};

export default async function OnboardingPage({
  searchParams,
}: OnboardingPageProps) {
  const query = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/onboarding");
  }

  const { data } = await supabase
    .from("brother_profiles")
    .select(
      "first_name,middle_name,last_name,individual_line_name,email,phone,street_address,city,state,postal_code,profession,employer,membership_status",
    )
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!data) {
    redirect("/login?error=profile_not_claimed");
  }

  const profile = data as ClaimedProfile;

  return (
    <main className="onboarding-shell">
      <section className="onboarding-card">
        {query.error ? (
          <div className="notice error" role="alert">
            {query.error === "invalid_profile"
              ? "Review the highlighted information and try again."
              : "Your profile could not be saved. Please try again."}
          </div>
        ) : null}
        <OnboardingForm
          action={completeOnboarding}
          initialProfile={{
            first_name: profile.first_name,
            middle_name: profile.middle_name ?? "",
            last_name: profile.last_name,
            individual_line_name: profile.individual_line_name ?? "",
            email: profile.email ?? user.email ?? "",
            phone: profile.phone ?? "",
            street_address: profile.street_address ?? "",
            city: profile.city ?? "",
            state: profile.state ?? "",
            postal_code: profile.postal_code ?? "",
            profession: profile.profession ?? "",
            employer: profile.employer ?? "",
            membership_status: profile.membership_status,
          }}
        />
      </section>
    </main>
  );
}
