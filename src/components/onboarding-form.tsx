"use client";

import { useState } from "react";

type InitialProfile = {
  first_name: string;
  middle_name: string;
  last_name: string;
  individual_line_name: string;
  email: string;
  phone: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  profession: string;
  employer: string;
  membership_status: "on_yard" | "alumni" | null;
};

type OnboardingFormProps = {
  initialProfile: InitialProfile;
  action: (formData: FormData) => void | Promise<void>;
};

const privacyOptions = [
  ["email", "Email", false],
  ["phone", "Phone", false],
  ["city_state", "City and state", true],
  ["profession", "Profession", true],
  ["employer", "Employer", false],
] as const;

export function OnboardingForm({
  initialProfile,
  action,
}: OnboardingFormProps) {
  const [step, setStep] = useState<2 | 3>(2);

  return (
    <form action={action} className="onboarding-form">
      <div className="step-label">Step {step} of 3</div>

      <section hidden={step !== 2}>
        <p className="eyebrow auth-eyebrow">Review your information</p>
        <h1>Tell us what is current.</h1>
        <p className="auth-copy">
          This information came from the chapter roster and may be outdated.
          Correct anything that has changed.
        </p>

        <fieldset className="status-options">
          <legend>Current chapter status</legend>
          <label>
            <input
              defaultChecked={initialProfile.membership_status === "on_yard"}
              name="membership_status"
              required
              type="radio"
              value="on_yard"
            />
            <span>
              <strong>On Yard</strong>
              <small>Currently active on campus</small>
            </span>
          </label>
          <label>
            <input
              defaultChecked={initialProfile.membership_status === "alumni"}
              name="membership_status"
              required
              type="radio"
              value="alumni"
            />
            <span>
              <strong>Alumni</strong>
              <small>No longer active on campus</small>
            </span>
          </label>
        </fieldset>

        <div className="field-grid">
          <label>
            First name
            <input
              defaultValue={initialProfile.first_name}
              name="first_name"
              required
            />
          </label>
          <label>
            Middle name
            <input
              defaultValue={initialProfile.middle_name}
              name="middle_name"
            />
          </label>
          <label>
            Last name
            <input
              defaultValue={initialProfile.last_name}
              name="last_name"
              required
            />
          </label>
          <label>
            Individual line name
            <input
              defaultValue={initialProfile.individual_line_name}
              name="individual_line_name"
            />
          </label>
          <label>
            Email
            <input
              defaultValue={initialProfile.email}
              name="email"
              type="email"
            />
          </label>
          <label>
            Phone
            <input
              autoComplete="tel"
              defaultValue={initialProfile.phone}
              name="phone"
              type="tel"
            />
          </label>
          <label className="full-field">
            Street address
            <input
              autoComplete="street-address"
              defaultValue={initialProfile.street_address}
              name="street_address"
            />
            <small>Always private from the brother directory.</small>
          </label>
          <label>
            City
            <input defaultValue={initialProfile.city} name="city" />
          </label>
          <label>
            State
            <input defaultValue={initialProfile.state} name="state" />
          </label>
          <label>
            Postal code
            <input
              autoComplete="postal-code"
              defaultValue={initialProfile.postal_code}
              name="postal_code"
            />
          </label>
          <label>
            Profession
            <input
              defaultValue={initialProfile.profession}
              name="profession"
            />
          </label>
          <label>
            Employer
            <input defaultValue={initialProfile.employer} name="employer" />
          </label>
        </div>

        <button
          className="wide-action"
          onClick={(event) => {
            if (event.currentTarget.form?.reportValidity()) {
              setStep(3);
            }
          }}
          type="button"
        >
          Continue
        </button>
      </section>

      <section hidden={step !== 3}>
        <p className="eyebrow auth-eyebrow">Privacy</p>
        <h1>Choose what brothers see.</h1>
        <p className="auth-copy">
          Officers can access member-management information. These choices
          control what appears to other brothers in the directory.
        </p>

        <div className="privacy-options">
          {privacyOptions.map(([name, label, defaultChecked]) => (
            <label key={name}>
              <span>{label}</span>
              <input
                defaultChecked={defaultChecked}
                name={`privacy_${name}`}
                type="checkbox"
              />
            </label>
          ))}
        </div>

        <div className="onboarding-actions">
          <button
            className="back-action"
            onClick={() => setStep(2)}
            type="button"
          >
            Back
          </button>
          <button className="wide-action" type="submit">
            Save and enter portal
          </button>
        </div>
      </section>
    </form>
  );
}
