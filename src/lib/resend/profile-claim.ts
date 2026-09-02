import "server-only";

import { Resend } from "resend";

type ProfileClaimEmail = {
  destinationEmail: string;
  brotherName: string;
  claimUrl: string;
  expiresAt: Date;
};

export async function sendProfileClaimEmail(message: ProfileClaimEmail) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    throw new Error("Resend is not configured");
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: message.destinationEmail,
    subject: "Claim your Theta Phi brother profile",
    text: [
      `Brother ${message.brotherName},`,
      "",
      "A chapter officer invited you to claim and verify your Theta Phi profile.",
      `Claim your profile: ${message.claimUrl}`,
      "",
      `This private, single-use link expires ${message.expiresAt.toUTCString()}.`,
      "If you did not expect this invitation, do not use the link.",
    ].join("\n"),
  });

  if (error) {
    throw new Error(`Resend delivery failed: ${error.message}`);
  }
}
