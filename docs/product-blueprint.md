# Theta Phi Chapter Digital Platform Blueprint

Status: Planning review  
Application implementation: Not started

## 1. Product goal

Build a secure, mobile-first website and brother portal for the Theta Phi Chapter of Kappa Alpha Psi Fraternity, Inc. The platform will replace the chapter's spreadsheet as the working source of truth for member information, current undergraduate leadership, lineage, announcements, events, and profile verification.

The initial release is intentionally lean. Each slice must be reviewed and accepted before the next major area is built.

## 2. Confirmed decisions

- The source roster is unverified seed data, not trusted current data.
- Brothers claim a specific imported profile through a secure invitation.
- Brothers may edit only their own claimed profile.
- Officers and administrators may perform member management.
- Platform access has exactly three roles: Brother, Officer, and Admin.
- Current undergraduate leadership positions are:
  - Polemarch
  - Vice Polemarch
  - Keeper of Records
  - Keeper of Exchequer
  - Strategus
- Leadership positions describe current campus responsibility only. Position history and start/end terms are not required.
- All five leadership positions receive Officer access and member-management capabilities.
- Brothers may change their own membership status between On Yard and Alumni.
- Chapter Invisible means the brother is deceased. Existing records marked Chapter Invisible will be imported with that status.
- Brothers cannot mark themselves or others Chapter Invisible.
- Chapter Invisible records do not receive accounts, invitations, reminders, or communications.
- Resend will provide transactional email.
- Design starts with mobile and expands to laptop layouts.
- Behavior is developed test-first. Tests must protect meaningful behavior and avoid testing framework internals or incidental markup.

## 3. Product boundaries

### MVP

- Invitation-only authentication and profile claiming
- Brother profile self-service
- Privacy controls
- Member management
- Current undergraduate leadership
- Searchable brother directory
- Line and lineage management
- Dashboard
- Announcements
- Events and RSVP
- In-app and email notifications
- Automated profile verification
- Public chapter website

### Later

- Direct messaging
- SMS and push notifications
- Dues and payments
- Advanced analytics
- Mentorship
- Awards and recognition
- Multi-chapter SaaS administration

## 4. Information architecture

### Public website

- Home
- About
- Chapter History
- Current Leadership
- Programs and Community Service
- Public Events
- Contact
- Brother Login
- Instagram: `@troynupes`

### Authenticated portal

- Dashboard
- Directory
- Lineage
- Events
- Announcements
- Notifications
- My Profile

### Officer and administrator management

- Members
- Invitations
- Current Leadership
- Lines and Lineage
- Events and Attendance
- Announcements
- Profile Verification
- Reports
- Audit Log
- Access and Settings (Admin only)

## 5. Access and authorization

UI visibility is not security. Every protected read and write must be authorized on the server, and sensitive database access should also be restricted by database policies where practical.

| Capability | Brother | Officer | Admin |
| --- | ---: | ---: | ---: |
| View own complete profile | Yes | Yes | Yes |
| Edit own editable profile fields | Yes | Yes | Yes |
| View privacy-approved directory fields | Yes | Yes | Yes |
| View lineage | Yes | Yes | Yes |
| RSVP to events | Yes | Yes | Yes |
| Manage members | No | Yes | Yes |
| Create and revoke invitations | No | Yes | Yes |
| Manage lines and lineage | No | Yes | Yes |
| Mark a record Chapter Invisible | No | Yes | Yes |
| Create announcements and events | No | Yes | Yes |
| View reports and audit activity | No | Yes | Yes |
| Assign access roles | No | No | Yes |
| Assign current leadership positions | No | No | Yes |
| Manage security and platform settings | No | No | Yes |

Changing membership status or profile information never changes platform access.

## 6. Profile ownership and editing

### Brother-editable fields

- First, middle, and last name
- Individual line name
- Email
- Phone
- Street address
- City, state, and postal code
- Birthday
- Graduation information
- Profession
- Employer
- Social links
- Profile photo
- On Yard or Alumni status
- Field-level privacy preferences

### Management-controlled fields

- Chapter Invisible status
- Crossing semester and year
- Line/group name
- Position within the line
- Big brother and lineage relationships
- Platform access role
- Current leadership position
- Account state
- Profile ownership and claim reset

Management changes must record the actor, target profile, changed fields, and timestamp.

## 7. Profile claim and onboarding

Profiles cannot be claimed through public directory search, name matching, birthday, phone number, or other discoverable personal information.

### Invitation workflow

1. An officer opens an imported brother record.
2. The officer verifies or enters a current email address.
3. The platform creates a random, single-use, expiring invitation tied to that profile.
4. Resend sends the claim link.
5. The recipient authenticates and can claim only the attached profile.
6. Claim completion permanently associates the authenticated user with that profile.
7. The invitation becomes unusable.
8. An officer may revoke an unused invitation.
9. An administrator may reset an incorrect claim, with an audit entry.

An officer can securely deliver an expiring link directly when a brother does not currently have email. Bulk invitations will not be sent to unverified legacy addresses.

### Mobile onboarding wireframe

#### Screen 1 — Confirm identity

```text
┌──────────────────────────┐
│ Theta Phi crest          │
│ Welcome, Brother         │
│                          │
│ Is this your profile?    │
│ [ Photo ]                │
│ John Doe                 │
│ Spring 2018 · Line Name  │
│                          │
│ [ Yes, this is me      ] │
│ [ Report a mismatch    ] │
└──────────────────────────┘
```

#### Screen 2 — Review information

```text
┌──────────────────────────┐
│ Step 2 of 3              │
│ Review your information  │
│                          │
│ Status                   │
│ (•) On Yard  ( ) Alumni  │
│                          │
│ Email      [...........] │
│ Phone      [...........] │
│ City       [...........] │
│ Profession [...........] │
│                          │
│ [ Continue             ] │
└──────────────────────────┘
```

The screen uses short sections and progressive disclosure. A brother may finish required fields first and complete optional fields later.

#### Screen 3 — Privacy and finish

```text
┌──────────────────────────┐
│ Step 3 of 3              │
│ Choose what brothers see │
│                          │
│ Email          [toggle]  │
│ Phone          [toggle]  │
│ City/State     [toggle]  │
│ Birthday       [toggle]  │
│ Employer       [toggle]  │
│                          │
│ [ Save and enter portal] │
└──────────────────────────┘
```

Street address is private by default and is not offered as a general directory field. Completing onboarding records `last_verified_at`.

## 8. Mobile dashboard wireframe

```text
┌──────────────────────────┐
│ ΘΦ  Good evening, John   │
│                    [🔔]  │
├──────────────────────────┤
│ Profile status           │
│ Verified today       ✓   │
├──────────────────────────┤
│ Upcoming events          │
│ Chapter Meeting          │
│ Sep 15 · 6:00 PM         │
│ [ View event ]           │
├──────────────────────────┤
│ Announcements            │
│ Community service event  │
│ [ Read more ]            │
├──────────────────────────┤
│ Your brotherhood         │
│ Big Brother: James Smith │
│ Little Brothers: 2       │
│ [ View lineage ]         │
├──────────────────────────┤
│ Home Directory Events Me │
└──────────────────────────┘
```

Laptop layouts expand the same content into a sidebar and two-column dashboard. They do not introduce a different navigation model.

## 9. Data model

The production database should use PostgreSQL. Names below are conceptual and may be refined when migrations are created.

### `users`

- `id`
- `auth_provider_id`
- `email`
- `access_role`: `brother | officer | admin`
- `account_status`: `invited | active | suspended`
- `created_at`
- `last_login_at`

### `brother_profiles`

- `id`
- `user_id`, nullable until claimed
- `first_name`
- `middle_name`
- `last_name`
- `individual_line_name`
- `email`
- `phone`
- `street_address`
- `city`
- `state`
- `postal_code`
- `birthday`
- `graduation_year`
- `profession`
- `employer`
- `profile_photo_key`
- `membership_status`: `on_yard | alumni | chapter_invisible`
- `current_leadership_position`, nullable
- `last_verified_at`
- `source`: `legacy_import | officer_created`
- `created_at`
- `updated_at`

### `profile_privacy`

- `brother_profile_id`
- `email_visibility`
- `phone_visibility`
- `city_state_visibility`
- `birthday_visibility`
- `profession_visibility`
- `employer_visibility`
- `social_visibility`

Visibility initially supports `brothers | management_only`. More levels should be added only when required.

### `lines`

- `id`
- `crossing_season`
- `crossing_year`
- `group_line_name`

### `line_memberships`

- `line_id`
- `brother_profile_id`
- `line_position`

### `lineage_relationships`

- `big_brother_profile_id`
- `little_brother_profile_id`

The application must reject self-reference, duplicate relationships, and lineage cycles.

### `profile_invitations`

- `id`
- `brother_profile_id`
- `destination_email`
- `token_hash`
- `expires_at`
- `used_at`
- `revoked_at`
- `created_by_user_id`

Only a token hash is stored. The raw invitation token is never logged.

### Engagement and operations

- `announcements`
- `announcement_audiences`
- `events`
- `event_rsvps`
- `event_attendance`
- `notifications`
- `notification_deliveries`
- `verification_campaigns`
- `audit_logs`

## 10. Legacy roster import

The attached PDF includes records from Winter/Spring 1976 through Fall 2023. It also contains missing fields, formatting errors, duplicate-looking entries, graduate chapter material, obsolete contact information, and records marked Chapter Invisible.

The PDF itself and extracted personally identifiable information must not be committed to source control, placed in test fixtures, emitted in logs, or used in screenshots.

### Import pipeline

```text
PDF extraction
  → normalized staging records
  → validation and duplicate report
  → officer review
  → approved production import
  → individual profile claim
  → brother verification
```

### Import classifications

- Ready for officer review
- Missing current email
- Suspected duplicate
- Chapter Invisible
- Ambiguous crossing term or line
- Possible graduate-chapter record
- Malformed contact information

Any source row explicitly marked Chapter Invisible is imported with `membership_status = chapter_invisible`. It receives no invitation or active communication. Its historical and lineage identity is preserved.

No legacy profile is considered verified until the brother completes onboarding or management explicitly verifies it.

## 11. Email through Resend

Initial templates:

- Profile claim invitation
- Invitation revoked or replaced
- Welcome/onboarding complete
- Profile verification reminder
- Announcement notification
- Event invitation
- Event reminder

Delivery records should store provider message ID, status, timestamps, and failure category. Email bodies should avoid unnecessary private information.

## 12. Test-driven development policy

Each behavior begins as a failing test, receives the smallest implementation needed to pass, and is then refactored while tests remain green.

### Test layers

- Domain tests for business rules and normalization
- Integration tests for database constraints, authorization, and workflows
- Component tests only for meaningful interactive behavior
- A small Playwright suite for critical mobile user journeys

### Tests to avoid

- Tests that restate framework behavior
- Assertions on implementation details
- Large snapshots for ordinary UI
- Tests for static styling with no behavioral requirement
- Mocking Resend and then testing the mock itself
- Duplicating the same behavior at every test layer without added value

### Identity and onboarding acceptance tests

1. An uninvited visitor cannot create a brother account.
2. An invitation is tied to one profile and intended destination.
3. Expired, revoked, and reused invitations are rejected.
4. A brother can claim only the profile attached to the invitation.
5. A brother can read and edit only their own private profile.
6. An officer can manage brother profiles.
7. Changing On Yard or Alumni status never changes access role.
8. A brother cannot select Chapter Invisible.
9. A Chapter Invisible record cannot receive an invitation.
10. Completing onboarding records `last_verified_at`.
11. Private fields remain management-only by default.
12. A management edit creates an audit entry.
13. Resend is requested once after a valid invitation transaction.
14. Email failure does not create a second profile or claim.
15. The complete onboarding flow works at the target mobile viewport.

### Directory and lineage acceptance tests

1. Anonymous users cannot access the directory.
2. Directory results expose only fields permitted by privacy settings.
3. Search and supported filters return matching profiles.
4. Chapter Invisible profiles do not expose contact actions.
5. Brothers cannot change official line or lineage fields.
6. Officers can update line and lineage data.
7. Self-links, duplicates, and cycles are rejected.

### Engagement acceptance tests

1. Only Officers and Admins can publish announcements and events.
2. Audience targeting resolves only eligible recipients.
3. RSVP changes are idempotent.
4. Chapter Invisible and suspended accounts receive no deliveries.
5. Verification reminders target only stale, active profiles.
6. Delivery failures are visible to management.

## 13. Reviewable delivery slices

### Slice 1 — Identity and onboarding

- Managed authentication
- Invitation creation and claim
- Imported-profile review
- Own-profile editing
- Privacy defaults
- On Yard/Alumni selection
- Resend integration
- Authorization and audit foundation

Review gate: a brother can securely claim and correct exactly one profile on a phone.

### Slice 2 — Directory

- Search
- Core filters
- Mobile brother cards
- Privacy-aware profile detail
- Stale-information indicator

Review gate: spreadsheet browsing is unnecessary for normal member lookup.

### Slice 3 — Lines and lineage

- Line cohort pages
- Big/little brother relationships
- Mobile lineage exploration
- Officer management
- Integrity protections

Review gate: official lineage changes update every relevant view.

### Slice 4 — Engagement

- Dashboard
- Announcements and audiences
- Events, RSVP, and attendance
- In-app notifications
- Resend notifications
- Scheduled profile verification

Review gate: officers can communicate and track event participation without a separate spreadsheet.

### Slice 5 — Public website

- Branded homepage
- About and chapter history
- Current leadership
- Programs and community service
- Public events
- Contact and Instagram connection
- Brother login

Review gate: public visitors receive a polished chapter experience without access to private member data.

## 14. Definition of MVP success

- Every approved legacy record exists in the database or appears in a documented exception report.
- Existing Chapter Invisible records are correctly classified and excluded from invitations.
- Brothers securely claim and maintain only their own profiles.
- Officers manage membership without changing platform security settings.
- Leadership can identify stale and verified profiles.
- Directory and lineage no longer depend on the PDF or spreadsheet.
- Events, RSVP, announcements, and core email delivery are centralized.
- No private brother information is publicly accessible.

## 15. Approval checklist

Before Slice 1 implementation begins, chapter reviewers should approve:

- Editable versus management-controlled fields
- Default privacy settings
- Officer and administrator permissions
- Three-screen onboarding flow
- Invitation and claim procedure
- Treatment of Chapter Invisible records
- Import exception classifications
- Slice 1 acceptance tests

