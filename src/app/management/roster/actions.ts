"use server";

import { createHash } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const stagedRecordSchema = z.object({
  sourceRow: z.number().int().positive(),
  fullName: z.string().min(1),
  individualLineName: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  crossingSeason: z.string().nullable(),
  crossingYear: z.number().int().nullable(),
  groupLineName: z.string().nullable(),
  membershipStatus: z.literal("chapter_invisible").nullable(),
  importState: z.enum([
    "ready_for_review",
    "needs_review",
    "chapter_invisible",
  ]),
  reviewFlags: z.array(z.string()),
});

async function managementContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/management/roster");

  const { data: account } = await supabase
    .from("user_accounts")
    .select("access_role")
    .eq("id", user.id)
    .maybeSingle();

  if (!account || !["officer", "admin"].includes(account.access_role)) {
    redirect("/dashboard");
  }

  return { supabase, user };
}

export async function uploadRosterReview(formData: FormData) {
  const file = formData.get("staging_file");
  if (!(file instanceof File) || file.size === 0 || file.size > 5_000_000) {
    redirect("/management/roster?error=invalid_file");
  }

  let records: z.infer<typeof stagedRecordSchema>[];
  const source = await file.text();
  try {
    records = z.array(stagedRecordSchema).parse(JSON.parse(source));
  } catch {
    redirect("/management/roster?error=invalid_file");
  }

  const { supabase, user } = await managementContext();
  const sourceHash = createHash("sha256").update(source).digest("hex");
  const summary = {
    total: records.length,
    chapterInvisible: records.filter(
      (record) => record.importState === "chapter_invisible",
    ).length,
    needsReview: records.filter(
      (record) => record.importState === "needs_review",
    ).length,
  };
  const { data: batch, error: batchError } = await supabase
    .from("roster_import_batches")
    .insert({
      source_label: file.name,
      source_sha256: sourceHash,
      summary,
      created_by_user_id: user.id,
    })
    .select("id")
    .single();

  if (batchError || !batch) {
    redirect("/management/roster?error=batch_failed");
  }

  for (let index = 0; index < records.length; index += 100) {
    const chunk = records.slice(index, index + 100).map((record) => ({
      batch_id: batch.id,
      source_row: record.sourceRow,
      state: record.importState,
      review_flags: record.reviewFlags,
      normalized_data: record,
    }));
    const { error } = await supabase
      .from("roster_import_records")
      .insert(chunk);

    if (error) {
      throw new Error("A staged roster chunk could not be saved");
    }
  }

  redirect(`/management/roster?batch=${batch.id}`);
}

function value(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export async function reviewRosterRecord(formData: FormData) {
  const recordId = value(formData, "record_id");
  const decision = value(formData, "decision");
  if (!recordId || !["approved", "rejected"].includes(decision)) return;

  const { supabase } = await managementContext();
  const correctedData = {
    first_name: value(formData, "first_name"),
    middle_name: value(formData, "middle_name"),
    last_name: value(formData, "last_name"),
    individual_line_name: value(formData, "individual_line_name"),
    email: value(formData, "email"),
    phone: value(formData, "phone"),
    street_address: value(formData, "street_address"),
    city: value(formData, "city"),
    state: value(formData, "state"),
    postal_code: value(formData, "postal_code"),
    profession: value(formData, "profession"),
    employer: value(formData, "employer"),
    crossing_season: value(formData, "crossing_season") || null,
    crossing_year: value(formData, "crossing_year") || null,
    group_line_name: value(formData, "group_line_name"),
    line_position: value(formData, "line_position"),
    membership_status:
      value(formData, "membership_status") === "chapter_invisible"
        ? "chapter_invisible"
        : null,
  };
  const { error } = await supabase.rpc("review_roster_record", {
    target_record_id: recordId,
    review_decision: decision,
    corrected_data: correctedData,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/management/roster");
}

export async function promoteRosterRecord(formData: FormData) {
  const recordId = value(formData, "record_id");
  if (!recordId) return;

  const { supabase } = await managementContext();
  const { error } = await supabase.rpc("promote_roster_record", {
    target_record_id: recordId,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/management/roster");
}
