import Link from "next/link";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  promoteRosterRecord,
  reviewRosterRecord,
  uploadRosterReview,
} from "./actions";

type RosterPageProps = {
  searchParams: Promise<{ batch?: string; error?: string; state?: string }>;
};

type StagedData = {
  fullName?: string;
  individualLineName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  crossingSeason?: string | null;
  crossingYear?: number | null;
  groupLineName?: string | null;
  membershipStatus?: string | null;
};

function suggestedName(fullName = "") {
  const parts = fullName.trim().split(/\s+/);
  return {
    first: parts.shift() ?? "",
    last: parts.join(" "),
  };
}

export default async function RosterManagementPage({
  searchParams,
}: RosterPageProps) {
  const params = await searchParams;
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

  const { data: batches } = await supabase
    .from("roster_import_batches")
    .select("id,source_label,state,summary,created_at")
    .order("created_at", { ascending: false });
  const selectedBatch = params.batch ?? batches?.[0]?.id;

  let recordsQuery = supabase
    .from("roster_import_records")
    .select("id,state,review_flags,normalized_data,imported_profile_id")
    .eq("batch_id", selectedBatch ?? "")
    .order("source_row")
    .limit(50);
  if (params.state) recordsQuery = recordsQuery.eq("state", params.state);
  const { data: records } = selectedBatch
    ? await recordsQuery
    : { data: null };

  return (
    <main className="management-shell">
      <header className="management-header">
        <div>
          <p className="eyebrow">Officer tools</p>
          <h1>Roster review</h1>
          <p>
            Correct and approve staged records before creating brother
            profiles.
          </p>
        </div>
        <Link href="/dashboard">Back to dashboard</Link>
      </header>

      <section className="import-panel">
        <h2>Upload private staging file</h2>
        <p>
          Select the ignored <code>staging-records.json</code> produced by the
          review command. Files are stored privately in Supabase.
        </p>
        {params.error ? (
          <div className="notice error" role="alert">
            The staging file could not be accepted. Check the file and try
            again.
          </div>
        ) : null}
        <form action={uploadRosterReview}>
          <input
            accept="application/json,.json"
            name="staging_file"
            required
            type="file"
          />
          <button type="submit">Stage roster for review</button>
        </form>
      </section>

      {selectedBatch ? (
        <>
          <nav className="review-filters" aria-label="Roster review filters">
            {[
              ["", "All"],
              ["needs_review", "Needs correction"],
              ["chapter_invisible", "Chapter Invisible"],
              ["approved", "Approved"],
              ["imported", "Imported"],
            ].map(([state, label]) => (
              <Link
                href={`/management/roster?batch=${selectedBatch}${state ? `&state=${state}` : ""}`}
                key={state}
              >
                {label}
              </Link>
            ))}
          </nav>

          <section className="review-list">
            {records?.map((record) => {
              const data = record.normalized_data as StagedData;
              const names = suggestedName(data.fullName);
              const isInvisible =
                data.membershipStatus === "chapter_invisible";

              return (
                <article className="review-card" key={record.id}>
                  <header>
                    <div>
                      <span className={`record-state ${record.state}`}>
                        {record.state.replaceAll("_", " ")}
                      </span>
                      <h2>{data.fullName ?? "Unnamed record"}</h2>
                    </div>
                    {record.review_flags.length ? (
                      <small>{record.review_flags.join(" · ")}</small>
                    ) : null}
                  </header>

                  {record.state === "approved" ? (
                    <form action={promoteRosterRecord}>
                      <input name="record_id" type="hidden" value={record.id} />
                      <button className="promote-action" type="submit">
                        Create brother profile
                      </button>
                    </form>
                  ) : record.state === "imported" ? (
                    <p className="imported-message">Brother profile created.</p>
                  ) : (
                    <form action={reviewRosterRecord} className="record-form">
                      <input name="record_id" type="hidden" value={record.id} />
                      <input
                        name="membership_status"
                        type="hidden"
                        value={isInvisible ? "chapter_invisible" : ""}
                      />
                      <label>
                        First name
                        <input
                          defaultValue={names.first}
                          name="first_name"
                          required
                        />
                      </label>
                      <label>
                        Last name
                        <input
                          defaultValue={names.last}
                          name="last_name"
                          required
                        />
                      </label>
                      <label>
                        Individual line name
                        <input
                          defaultValue={data.individualLineName ?? ""}
                          name="individual_line_name"
                        />
                      </label>
                      <label>
                        Email
                        <input
                          defaultValue={isInvisible ? "" : (data.email ?? "")}
                          disabled={isInvisible}
                          name="email"
                          type="email"
                        />
                      </label>
                      <label>
                        Phone
                        <input
                          defaultValue={isInvisible ? "" : (data.phone ?? "")}
                          disabled={isInvisible}
                          name="phone"
                        />
                      </label>
                      <label>
                        Crossing season
                        <select
                          defaultValue={data.crossingSeason ?? ""}
                          name="crossing_season"
                        >
                          <option value="">Needs review</option>
                          <option value="winter">Winter</option>
                          <option value="spring">Spring</option>
                          <option value="summer">Summer</option>
                          <option value="fall">Fall</option>
                        </select>
                      </label>
                      <label>
                        Crossing year
                        <input
                          defaultValue={data.crossingYear ?? ""}
                          max="2200"
                          min="1976"
                          name="crossing_year"
                          type="number"
                        />
                      </label>
                      <label>
                        Group line name
                        <input
                          defaultValue={data.groupLineName ?? ""}
                          name="group_line_name"
                        />
                      </label>
                      <div className="record-actions">
                        <button name="decision" type="submit" value="rejected">
                          Reject
                        </button>
                        <button
                          className="approve-action"
                          name="decision"
                          type="submit"
                          value="approved"
                        >
                          Approve corrected record
                        </button>
                      </div>
                    </form>
                  )}
                </article>
              );
            })}
            {!records?.length ? (
              <p className="empty-state">No records match this filter.</p>
            ) : null}
          </section>
        </>
      ) : (
        <p className="empty-state">Upload a staging file to begin review.</p>
      )}
    </main>
  );
}
