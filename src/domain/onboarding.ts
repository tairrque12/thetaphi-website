import { z } from "zod";

const optionalText = z.string().trim().max(160);
const optionalEmail = z.union([z.literal(""), z.email()]);

export const onboardingSchema = z.object({
  first_name: z.string().trim().min(1).max(80),
  middle_name: optionalText,
  last_name: z.string().trim().min(1).max(80),
  individual_line_name: optionalText,
  email: optionalEmail,
  phone: z.string().trim().max(30),
  street_address: z.string().trim().max(200),
  city: z.string().trim().max(100),
  state: z.string().trim().max(80),
  postal_code: z.string().trim().max(20),
  profession: optionalText,
  employer: optionalText,
  membership_status: z.enum(["on_yard", "alumni"]),
  privacy: z.object({
    email: z.boolean(),
    phone: z.boolean(),
    city_state: z.boolean(),
    birthday: z.boolean(),
    profession: z.boolean(),
    employer: z.boolean(),
  }),
});

export type OnboardingProfile = z.infer<typeof onboardingSchema>;
