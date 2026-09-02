import "server-only";

import { sendProfileClaimEmail } from "@/lib/resend/profile-claim";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { issueProfileInvitation } from "./profile-invitations";

type IssueInvitationInput = {
  profileId: string;
  destinationEmail: string;
  brotherName: string;
  origin: string;
};

export async function issueProfileInvitationWithProviders(
  input: IssueInvitationInput,
) {
  const supabase = await createSupabaseServerClient();
  const supabaseAdmin = createSupabaseAdminClient();
  const { error: accountError } = await supabaseAdmin.auth.admin.createUser({
    email: input.destinationEmail.trim().toLowerCase(),
    email_confirm: true,
  });

  if (
    accountError &&
    accountError.code !== "email_exists" &&
    accountError.code !== "user_already_exists" &&
    !accountError.message.toLowerCase().includes("already registered")
  ) {
    throw new Error(`Account could not be prepared: ${accountError.message}`);
  }

  return issueProfileInvitation(input, {
    async createInvitation(invitation) {
      const { data, error } = await supabase.rpc("create_profile_invitation", {
        target_profile_id: invitation.profileId,
        target_email: invitation.destinationEmail,
        hashed_token: invitation.tokenHash,
        expiration: invitation.expiresAt.toISOString(),
      });

      if (error || !data) {
        throw new Error(error?.message ?? "Invitation could not be created");
      }

      return data as string;
    },
    async revokeInvitation(invitationId) {
      const { error } = await supabase.rpc("revoke_profile_invitation", {
        target_invitation_id: invitationId,
      });

      if (error) {
        throw new Error(error.message);
      }
    },
    sendEmail: sendProfileClaimEmail,
  });
}
