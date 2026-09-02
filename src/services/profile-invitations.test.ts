import { createHash } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

import { issueProfileInvitation } from "./profile-invitations";

const input = {
  profileId: "f1674832-4939-46dc-8425-b8e2ed219a34",
  destinationEmail: "brother@example.com",
  origin: "https://thetaphichapter.org",
  brotherName: "John Doe",
};

describe("issueProfileInvitation", () => {
  it("stores only a hash while emailing the single-use secret", async () => {
    const createInvitation = vi.fn().mockResolvedValue("invitation-id");
    const sendEmail = vi.fn().mockResolvedValue(undefined);

    const result = await issueProfileInvitation(input, {
      createInvitation,
      revokeInvitation: vi.fn(),
      sendEmail,
    });

    const storedHash = createInvitation.mock.calls[0][0].tokenHash;
    const claimUrl = sendEmail.mock.calls[0][0].claimUrl as string;
    const token = claimUrl.split("/claim/")[1];

    expect(storedHash).toBe(
      createHash("sha256").update(token).digest("hex"),
    );
    expect(storedHash).not.toContain(token);
    expect(result.invitationId).toBe("invitation-id");
  });

  it("revokes the database invitation when email delivery fails", async () => {
    const revokeInvitation = vi.fn().mockResolvedValue(undefined);

    await expect(
      issueProfileInvitation(input, {
        createInvitation: vi.fn().mockResolvedValue("invitation-id"),
        revokeInvitation,
        sendEmail: vi.fn().mockRejectedValue(new Error("delivery failed")),
      }),
    ).rejects.toThrow("delivery failed");

    expect(revokeInvitation).toHaveBeenCalledWith("invitation-id");
  });
});
