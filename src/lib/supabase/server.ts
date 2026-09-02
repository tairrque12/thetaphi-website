import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function requiredEnvironmentValue(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    requiredEnvironmentValue("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnvironmentValue("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot write cookies. Middleware or a Server
            // Action will persist refreshed sessions when needed.
          }
        },
      },
    },
  );
}
