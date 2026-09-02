import { NextResponse } from "next/server";

import { safeInternalPath } from "@/lib/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeInternalPath(requestUrl.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=missing_code", requestUrl.origin),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL("/login?error=invalid_link", requestUrl.origin),
    );
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
