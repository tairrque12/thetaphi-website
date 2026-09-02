import { createHash, randomBytes } from "node:crypto";

type InvitationInput = {
  profileId: string;
  destinationEmail: string;
  origin: string;
  brotherName: string;
};

type StoredInvitation = {
  profileId: string;
  destinationEmail: string;
  tokenHash: string;
  expiresAt: Date;
};

type InvitationEmail = {
  destinationEmail: string;
  brotherName: string;
  claimUrl: string;
  expiresAt: Date;
};

type InvitationDependencies = {
  createInvitation: (invitation: StoredInvitation) => Promise<string>;
  revokeInvitation: (invitationId: string) => Promise<void>;
  sendEmail: (message: InvitationEmail) => Promise<void>;
};

export async function issueProfileInvitation(
  input: InvitationInput,
  dependencies: InvitationDependencies,
  now = new Date(),
) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const invitationId = await dependencies.createInvitation({
    profileId: input.profileId,
    destinationEmail: input.destinationEmail.trim().toLowerCase(),
    tokenHash,
    expiresAt,
  });

  try {
    await dependencies.sendEmail({
      destinationEmail: input.destinationEmail,
      brotherName: input.brotherName,
      claimUrl: `${input.origin.replace(/\/$/, "")}/claim/${token}`,
      expiresAt,
    });
  } catch (error) {
    await dependencies.revokeInvitation(invitationId);
    throw error;
  }

  return { invitationId, expiresAt };
}
