"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const tokenSchema = z.string().min(32).max(256);

export async function claimProfile(formData: FormData) {
  const token = tokenSchema.safeParse(formData.get("token"));

  if (!token.success) {
    redirect("/login?error=invalid_link");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/claim/${token.data}`)}`);
  }

  const { error } = await supabase.rpc("claim_profile", {
    invitation_token: token.data,
  });

  if (error) {
    redirect(`/claim/${token.data}?error=claim_failed`);
  }

  redirect("/onboarding");
}
