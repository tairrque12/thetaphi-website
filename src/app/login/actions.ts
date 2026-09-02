"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { safeInternalPath } from "@/lib/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.email(),
  next: z.string().optional(),
});

export async function sendMagicLink(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    next: formData.get("next"),
  });

  if (!parsed.success) {
    redirect("/login?error=invalid_email");
  }

  const next = safeInternalPath(parsed.data.next);
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  if (!host) {
    throw new Error("Request host is unavailable");
  }

  const callback = new URL("/auth/callback", `${protocol}://${host}`);
  callback.searchParams.set("next", next);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: callback.toString(),
      shouldCreateUser: false,
    },
  });

  if (error) {
    redirect(`/login?error=sign_in_failed&next=${encodeURIComponent(next)}`);
  }

  redirect(`/login?sent=1&next=${encodeURIComponent(next)}`);
}
