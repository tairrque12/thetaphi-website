import "server-only";

import { createClient } from "@supabase/supabase-js";

function requiredEnvironmentValue(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

export function createSupabaseAdminClient() {
  return createClient(
    requiredEnvironmentValue("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnvironmentValue("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
