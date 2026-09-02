"use server";

import { redirect } from "next/navigation";

import { onboardingSchema } from "@/domain/onboarding";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function checked(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

export async function completeOnboarding(formData: FormData) {
  const parsed = onboardingSchema.safeParse({
    first_name: formData.get("first_name"),
    middle_name: formData.get("middle_name"),
    last_name: formData.get("last_name"),
    individual_line_name: formData.get("individual_line_name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    street_address: formData.get("street_address"),
    city: formData.get("city"),
    state: formData.get("state"),
    postal_code: formData.get("postal_code"),
    profession: formData.get("profession"),
    employer: formData.get("employer"),
    membership_status: formData.get("membership_status"),
    privacy: {
      email: checked(formData, "privacy_email"),
      phone: checked(formData, "privacy_phone"),
      city_state: checked(formData, "privacy_city_state"),
      birthday: checked(formData, "privacy_birthday"),
      profession: checked(formData, "privacy_profession"),
      employer: checked(formData, "privacy_employer"),
    },
  });

  if (!parsed.success) {
    redirect("/onboarding?error=invalid_profile");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/onboarding");
  }

  const { error } = await supabase.rpc("complete_own_onboarding", {
    profile_data: parsed.data,
  });

  if (error) {
    redirect("/onboarding?error=save_failed");
  }

  redirect("/dashboard");
}
