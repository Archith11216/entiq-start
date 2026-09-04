Q

EnTIQ Start

Full SaaS Module Product, Functional and Technical Specification

Reusable onboarding, verified identity, entity capture, engagements, pricing, consent, signing and practice acceptance.

Document

Detail

Owner

Grow Advisory Group

Product

EnTIQ SaaS

Module

EnTIQ Start

Version

1.0

Date

29 July 2026

Status

Developer build specification

Purpose

This document defines the complete EnTIQ Start module. It is intended for product managers, designers, developers, testers, security reviewers and implementation teams.


Confidential | Grow Advisory Group | Version 1.0 | 29 July 2026

EnTIQ Start | Product and Development Specification

1. Executive definition

EnTIQ Start is the entry module for every client and entity using EnTIQ. It converts an invitation, referral, QR scan or self-registration into an accepted, priced, signed and auditable professional engagement.

Product outcome

A practice receives a complete client group, verified parties, ownership relationships, required consents, signed engagement, payment authority and risk-based acceptance record without repeatedly requesting the same information.

1.1 Scope

Practice configuration and service catalogue.

Client invitation, self-registration, referral and QR-code entry.

Reusable EnTIQ identity profile and controlled sharing.

Individual and entity information capture.

Document collection, identity verification and public-register enrichment.

Entity relationship and beneficial-owner capture.

Dynamic onboarding questionnaires.

Service selection, proposal, pricing and engagement generation.

Privacy, biometric, third-party, offshore and marketing consents.

Electronic signing and payment-authority collection.

Internal review, acceptance, rejection and escalation.

Client portal, reminders, dashboards, audit trail and integrations.

1.2 Excluded from EnTIQ Start

Full AML/CTF program management and ongoing monitoring, which sit in EnTIQ Compliance.

Accounting jobs, WIP and staff capacity, which sit in EnTIQ Practice.

Tax returns and workpapers, which sit in EnTIQ Accounting.

ASIC lodgements, which sit in EnTIQ Entity Administration.

Complex tax advice, which sits in EnTIQ Advice.

2. Product principles

Principle

Required behaviour

Enter once

Information collected once is reused subject to permission, currency and regulatory requirements.

Client control

The client sees what is shared, why it is needed, who receives it and when access ends.

Entity first

Every service attaches to the correct legal client and related entity group.

Evidence first

Every material answer, check, consent and decision links to its source evidence.

Progressive disclosure

The system asks only questions required by the client type, service and risk rules.

Human accountability

Automation prepares and recommends. Authorised people approve acceptance and exceptions.

Effective dating

Relationships, documents, consents and engagement terms retain effective dates and history.

Portable records

Practices can export their records and clients can share authorised identity information.

3. Target users and roles

Role

Purpose

Key permissions

Client individual

Owns a personal EnTIQ profile.

View, correct, consent, share, upload, sign and revoke.

Client group controller

Coordinates a family or business group.

Invite related parties and manage group requests, without seeing restricted identity data.

Practice administrator

Configures and monitors onboarding.

Invite, assign, request, correct non-verified data and manage templates.

Client coordinator

Supports client completion.

View progress, message clients, validate completeness and escalate.

Accountant or adviser

Defines services and reviews the client.

Review group, amend scope, set pricing and recommend acceptance.

Partner or principal

Accepts higher-risk or material engagements.

Approve, reject, override with reason and sign practice acceptance.

Compliance officer

Reviews identity, consent and risk exceptions.

Approve exceptions, lock evidence and access protected compliance records.

Billing officer

Manages payment setup.

View commercial terms and payment authority, not identity documents unless required.

System administrator

Controls tenancy and integrations.

Manage roles, security, APIs, retention and audit exports.

Auditor

Performs independent review.

Time-limited read-only access to selected evidence and logs.

3.1 Permission rules

Permissions combine role, practice, client group, entity, engagement and data classification.

Identity documents, biometric results, TFNs, payment data and compliance notes require separate access scopes.

A user cannot approve their own material override where segregation rules require two people.

Support impersonation is disabled by default and requires recorded approval and a visible session banner.

All downloads, views, exports, overrides and permission changes create immutable audit events.


Confidential | Grow Advisory Group | Version 1.0 | 29 July 2026

EnTIQ Start | Product and Development Specification

4. Module architecture

Component

Responsibility

Start Configurator

Practice branding, services, rules, templates, pricing, acceptance and integrations.

Entry Gateway

Invitations, QR codes, referrals, public forms, magic links and account creation.

Identity Profile

Reusable verified identity, contact details, documents and sharing controls.

Entity Builder

Entity data, registers, deeds, relationships, ownership and control.

Questionnaire Engine

Conditional questions, validation, evidence and declarations.

Document Hub

Requests, uploads, classification, OCR, expiry and evidence linking.

Service and Pricing Engine

Scope, packages, fee calculations, margin guardrails and approvals.

Engagement Engine

Terms, disclosures, consents, variations, signatures and renewals.

Acceptance Engine

Completeness, conflicts, risk, exceptions, review and decision.

Client Portal

Progress, requests, messages, documents, consents, signatures and status.

Integration Gateway

XPM, FYI, Microsoft 365, identity providers, payments and webhooks.

Audit and Evidence Store

Append-only evidence, event history, hashes, versions and export.

5. Practice setup

5.1 Practice profile

Legal name, trading name, ABN, ACN and registered address.

Tax agent and BAS agent registration numbers.

Professional memberships and licence disclosures.

Offices, service regions and time zones.

Branding, domain, logo, colours and email sender.

Privacy officer, complaints officer and compliance contacts.

Professional indemnity insurance disclosure.

Default retention, consent and security settings.

5.2 Service catalogue

Field

Requirement

Service name and code

Unique within the tenant. Supports versions.

Client type

Individual, company, trust, partnership, SMSF, association or other.

Responsible service line

Tax, accounting, advisory, finance, legal, corporate or custom.

Designated-service flag

Indicates whether additional compliance workflows apply.

Base scope

Included work, exclusions, deliverables and frequency.

Required parties

Client, officeholders, controllers, owners, trustees or authorised persons.

Required data

Questions, documents, declarations and checks.

Pricing method

Fixed, recurring, hourly, volume, tiered or custom.

Approval threshold

Commercial, risk and partner approval rules.

Engagement template

Terms and disclosures selected by jurisdiction and service.

5.3 Configuration wizard

Create the practice and verify the administrator.

Enter legal, regulatory and contact information.

Configure offices, users, roles and approval limits.

Import or create the service catalogue.

Set pricing rules and margin thresholds.

Select identity and register providers.

Configure consent notices and engagement terms.

Connect practice-management, document and payment systems.

Run a test onboarding in sandbox mode.

Approve and publish the configuration.

6. Entry channels

Channel

Process

Controls

Practice invitation

Staff selects service and client type, then sends email or SMS.

Expiry, single-use token, resend controls and duplicate detection.

Client self-registration

Client creates an identity and selects a practice or service.

Email/mobile verification, bot controls and practice acceptance.

Practice QR code

Client scans a practice or service-specific code.

Signed code, expiry option, campaign and location tracking.

Share My EnTIQ

Existing user selects a practice and shares authorised profile fields.

Purpose, field-level consent, expiry and receiving-practice acceptance.

Referral

Another professional sends a structured referral.

Referrer consent, minimum information and no automatic disclosure of restricted data.

Bulk import

Practice imports clients from XPM, APS, MYOB or CSV.

Dry run, matching rules, error file and no invitation until approved.

Embedded form

Practice website hosts an EnTIQ onboarding component.

Allowed domains, tenant branding, rate limits and bot protection.

7. Master onboarding workflow

Create onboarding case from an entry channel.

Match or create the person and intended client entity.

Authenticate the user and capture collection notice acknowledgement.

Determine client type, requested service and required parties.

Collect or reuse identity and contact information.

Collect entity, ownership, control and authority information.

Request documents and run selected verification checks.

Calculate completeness, quality and exception results.

Determine services, scope and recommended price.

Generate proposal, engagement terms and required consents.

Collect signatures and payment authority.

Perform internal commercial, conflict, identity and acceptance review.

Accept, conditionally accept, reject or request more information.

Create or update records in connected practice systems.

Activate the client portal and create downstream jobs.

7.1 Case statuses

Status

Meaning

Allowed next status

Draft

Created but not issued.

Invited, Cancelled

Invited

Invitation issued.

Opened, Expired, Cancelled

Opened

Client authenticated.

In progress, Declined

In progress

Questions or evidence remain.

Client review, Awaiting others, Expired

Awaiting others

Related parties must act.

Client review, In progress

Client review

Client checks compiled information.

Submitted, In progress

Submitted

Client declarations completed.

Internal review, More information

Internal review

Practice performs review.

More information, Proposal issued, Rejected

Proposal issued

Commercial terms sent.

Signed, Negotiation, Expired

Signed

Required signatures obtained.

Acceptance review

Acceptance review

Final checks and approvals.

Accepted, Conditional, Rejected

Accepted

Client and engagement activated.

Active

Conditional

Limited activation subject to conditions.

Accepted, Rejected

Rejected

Practice declined the engagement.

Closed

Closed

Case completed and retained.

Reopen with permission


Confidential | Grow Advisory Group | Version 1.0 | 29 July 2026

EnTIQ Start | Product and Development Specification

8. Individual identity profile

8.1 Core fields

Category

Fields

Names

Legal, previous, preferred, aliases and transliteration.

Birth

Date, place and country of birth.

Contact

Email, mobile, residential, postal and previous addresses.

Residency

Citizenship, tax residency, visa or residence status where relevant.

Government identifiers

Document type, masked number, issuing authority, issue and expiry dates.

Tax

Masked TFN status, tax residency and foreign tax identifiers where authorised.

Employment

Occupation, employer and industry where required by service rules.

Authority

Capacity, power of attorney, guardianship or representative authority.

Preferences

Language, accessibility, communication and signing preference.

8.2 Verification levels

Level

Meaning

Permitted use

Unverified

User-supplied information only.

Draft and low-risk pre-onboarding.

Contact verified

Email and mobile confirmed.

Invitations and basic portal access.

Document verified

Document data validated through an approved provider.

Service-specific identity checks subject to practice rules.

Biometric verified

Document holder matched using liveness and facial comparison.

Higher-assurance onboarding where consent and policy permit.

Manually verified

Authorised staff reviewed original or certified evidence.

Fallback with reason, evidence and reviewer.

Expired

Underlying evidence has expired or assurance window passed.

Review or re-verification required.

8.3 Share My EnTIQ

Show the receiving practice’s legal name, purpose and requested data.

Separate mandatory information from optional information.

Allow sharing by field, document or verification result.

Share verification evidence or an assurance assertion according to policy.

Record the lawful purpose, consent text, version, time and device.

Allow time-limited access and future revocation.

Warn that revocation does not remove records a practice must legally retain.

Notify the receiving practice when shared information changes or expires.

9. Entity and relationship capture

Entity type

Required minimum information

Company

Legal name, ACN/ARBN, ABN, status, addresses, directors, shareholders and controllers.

Trust

Trust name, type, date, jurisdiction, trustee, appointor, guardian, beneficiaries, unit holders and deed.

Partnership

Name, ABN, jurisdiction, partners, agreement and control.

SMSF

Fund name, ABN, establishment date, trustee structure, members and deed.

Association

Registered name, number, jurisdiction, officeholders, members and rules.

Individual group

People, family or commercial relationships and relevant jointly held interests.

Foreign entity

Country, register, identifier, legal form, owners, controllers and translated evidence.

9.1 Relationship record

Source person or entity.

Target person or entity.

Relationship type and legal capacity.

Direct ownership percentage.

Voting percentage.

Economic interest percentage.

Appointment or removal power.

Control indicator and explanation.

Start and end dates.

Source evidence and verification status.

Entered by, reviewed by and last confirmed.

9.2 Beneficial owner determination

Identify direct owners and controllers.

Expand every legal owner that is not a natural person.

Calculate indirect interests through each ownership path.

Aggregate interests held through multiple paths.

Assess voting, appointment and practical control separately.

Identify persons meeting the configured ownership or control threshold.

Flag incomplete, circular, conflicting or unsupported relationships.

Require an authorised reviewer to approve exceptions and final results.

10. Questionnaire engine

10.1 Question definition

Field

Description

Question ID

Permanent unique identifier, independent of displayed wording.

Version

Effective date and retired date.

Answer type

Text, number, date, currency, select, multi-select, address, person, entity, file or declaration.

Visibility rule

Client, service, answer, risk, jurisdiction, entity and relationship conditions.

Required rule

Mandatory conditions and acceptable exemption reasons.

Validation

Format, range, checksum, consistency and cross-record rules.

Evidence rule

Required supporting document, verification or declaration.

Sensitivity

Public, internal, confidential, restricted or highly restricted.

Reuse policy

May be reused, confirmation required, or must be freshly collected.

Review rule

Automatic, staff review, partner approval or compliance approval.

10.2 Questionnaire capabilities

Conditional sections and branching.

Household and group-level questions.

Repeatable persons, entities, assets and relationships.

Prefill from trusted records with source labels.

Client correction without destroying historical values.

Save and resume across devices.

Delegate a section to another person.

Plain-language help and examples.

Accessibility labels and keyboard navigation.

Automatic completeness and inconsistency checks.

11. Document and evidence collection

Function

Required behaviour

Request

Template or ad hoc request with purpose, acceptable formats, due date and responsible party.

Upload

Mobile camera, file upload, email ingestion, connected storage or provider result.

Security

Malware scanning, content-type validation, encryption and restricted preview.

Classification

Document type, entity, period, owner, sensitivity and expiry.

Extraction

OCR and structured extraction with confidence and source coordinates.

Validation

Name, date, identifier and cross-document consistency checks.

Evidence link

Attach one source to questions, relationships, checks, decisions and engagements.

Versioning

Retain replacement history and explain why evidence changed.

Expiry

Notify affected clients and practices before expiry.

Export

Produce a manifest with hashes, versions, sources and access history.


Confidential | Grow Advisory Group | Version 1.0 | 29 July 2026

EnTIQ Start | Product and Development Specification

12. Services, scope and pricing

12.1 Service recommendation

The engine may recommend services from client answers, entity profile, current services, compliance obligations and detected gaps. Recommendations never add a charge without clear client selection or practice approval.

12.2 Pricing variables

Base service price.

Entity type and entity count.

Transaction, employee, payroll and document volumes.

Service frequency and reporting frequency.

Complexity, record quality and urgency.

Required reviewers and specialist involvement.

Identity, register and verification usage costs.

Expected staff hours and standard cost rates.

Target contribution margin.

Discounts, minimums and partner approval thresholds.

12.3 Pricing output

Output

Purpose

Recommended price

Rule-based fee before authorised adjustment.

Price range

Permitted range without approval.

Expected cost

Staff, provider and overhead cost estimate.

Target margin

Practice target contribution margin.

Actual proposed price

Amount offered to the client.

Variance

Difference from recommended price and margin.

Approval

Required approver based on discount or margin.

Payment plan

Upfront, recurring, milestone or deposit.

13. Proposal and engagement engine

13.1 Required document content

Practice legal name and relevant registrations.

Each legal client receiving services.

Services, deliverables, frequency and timeframe.

Express exclusions and assumptions.

Practice and client responsibilities.

Fees, taxes, billing frequency and payment timing.

Information reliance and reasonable-care provisions.

Confidentiality, third-party disclosure and offshore processing.

Privacy, identity and record-retention notices.

Conflicts process and professional obligations.

Complaints, disputes, termination and document return.

Professional indemnity disclosure and any valid liability limitation.

Acceptance, signatures, dates and authority.

13.2 Document generation

Clause library with jurisdiction, service and effective-date rules.

Locked mandatory clauses and approved optional clauses.

Plain-language summary before full terms.

Multiple legal clients and signatories.

Conditional disclosures driven by collected facts.

Unique document ID, version and content hash.

Practice branding and accessible PDF output.

Side-by-side comparison for engagement variations.

Annual review and event-triggered re-engagement.

13.3 Signing rules

Client type

Default signing authority

Individual

The individual or properly authorised representative.

Company

Director, secretary or authorised officer according to practice policy.

Trust

Trustee individual or authorised corporate trustee representative.

Partnership

Required partners or authorised partner under the agreement.

SMSF

Trustees or corporate trustee representative as configured.

Association

Authorised officeholder under rules or resolution.

14. Consent centre

Consent

Required record

Privacy collection

Notice version, purpose, categories, recipients and acknowledgement.

Identity verification

Provider, checks, information disclosed and result use.

Biometric processing

Express consent, purpose, retention and alternative process.

Third-party disclosure

Recipient category, purpose and information categories.

Offshore disclosure

Country or recipient category and safeguards.

Tax identifier handling

Purpose, permitted use and restricted access.

Payment authority

Method, amount or calculation, timing and cancellation.

Marketing

Channel-specific optional consent with withdrawal.

Cross-practice sharing

Receiving practice, fields, purpose, duration and revocation.

14.1 Consent rules

Consent is never bundled where separate choice is required.

Optional consent defaults to off.

The platform stores exact displayed text and interface version.

Withdrawal stops future optional processing and creates downstream notifications.

Required legal retention remains visible after access withdrawal.

A minor or represented person follows configured authority and capacity rules.

15. Payment setup

Card, bank debit, BPAY or invoice-only options by practice configuration.

Provider-hosted fields so EnTIQ does not store full payment credentials.

Deposits, recurring fees, instalments and milestone billing.

Payment schedule displayed before authorisation.

Mandate status, failure and cancellation events.

Practice approval before changing price after signature.

PCI responsibilities documented with the selected provider.

16. Internal acceptance

16.1 Review panels

Panel

Checks

Completeness

Required questions, parties, documents, declarations and signatures.

Identity

Assurance level, expired evidence, mismatches, duplicate people and manual exceptions.

Entity

Register match, status, officeholders, ownership, control, deed and authority.

Conflict

Client, related party, adverse party and staff relationship matches.

Commercial

Scope, price, margin, payment method, debt history and approval limits.

Compliance

Service classification, risk flags and required downstream compliance workflow.

Capacity

Responsible manager, staff availability, competency and due dates.

16.2 Decisions

Decision

Effect

Accept

Create active client, engagement and downstream work.

Conditionally accept

Allow limited work with conditions, owner and due date.

Request information

Return selected issues without reopening completed sections.

Escalate

Send to partner, compliance or specialist review.

Reject

Record reason category, client communication and retention status.

Withdraw

Client declines or practice cancels before acceptance.

16.3 Override requirements

Original rule result.

Override value and reason.

Supporting evidence.

Override authority.

Second approval where configured.

Expiry or review date.

Client-impact assessment.


Confidential | Grow Advisory Group | Version 1.0 | 29 July 2026

EnTIQ Start | Product and Development Specification

17. Screen catalogue

ID

Screen

Primary users

Main content

ST-001

Start dashboard

Practice staff

Cases by stage, overdue work, exceptions, conversion and completion.

ST-002

Create invitation

Administrator

Client, service, channel, owner, due date and message.

ST-003

Onboarding case

Staff

Progress, parties, requests, activity, risk, proposal and decisions.

ST-004

Client welcome

Client

Practice identity, purpose, steps, privacy and time estimate.

ST-005

Account and authentication

Client

Email, mobile, passkey, MFA and recovery.

ST-006

My identity

Client

Personal details, documents, assurance and expiry.

ST-007

My entities

Client

Entities, roles, relationships and missing information.

ST-008

Group builder

Client and staff

Interactive people, entity and ownership map.

ST-009

Questions

Client

Dynamic sections, evidence and delegated questions.

ST-010

Document requests

Client

Outstanding, uploaded, rejected and accepted evidence.

ST-011

Share My EnTIQ

Client

Practice, purpose, fields, documents, duration and consent.

ST-012

Service selection

Client and adviser

Recommended, selected and optional services.

ST-013

Pricing workbench

Adviser

Cost, margin, fee, discount, plan and approval.

ST-014

Proposal review

Client

Summary, services, exclusions, fees and payment schedule.

ST-015

Consent centre

Client

Required and optional permissions with history.

ST-016

Signing

Client

Documents, authority declaration, signature and completion.

ST-017

Payment authority

Client

Method, schedule, mandate and receipt.

ST-018

Acceptance review

Practice reviewers

Panels, exceptions, comments and decision.

ST-019

Client home

Client

Status, requests, messages, documents, practices and access.

ST-020

Template manager

Administrator

Services, questions, clauses, notices, rules and versions.

ST-021

Integration centre

System administrator

Connections, mapping, failures, logs and replay.

ST-022

Audit explorer

Authorised users

Events, evidence, versions, access, export and legal hold.

17.1 Dashboard requirements

Filter by office, service, owner, stage, risk, age and due date.

Show cases stalled by the client, related party, practice or external provider.

Show average completion time and conversion by entry channel.

Show identity failures, document mismatches, pricing exceptions and unsigned proposals.

Allow saved views and role-specific dashboards.

Export visible results without exposing restricted fields.

18. Notifications and communications

Event

Recipient

Default delivery

Invitation issued

Client

Email and optional SMS.

Invitation unopened

Client and case owner

Reminder sequence.

Related party invited

Related party

Email or SMS without unnecessary group details.

Request due

Responsible person

Portal, email and optional SMS.

Evidence rejected

Uploader

Portal and email with reason and correction steps.

Proposal issued

Required signatories

Portal and email.

Signature completed

Client and practice

Portal and email receipt.

Acceptance condition due

Condition owner

Practice task and escalation.

Accepted

Client and service team

Welcome message and next steps.

Access revoked

Receiving practice and client

Immediate security notification.

18.1 Communication controls

Templates support brand, office, service and language variants.

Sensitive details are not placed in SMS or email subjects.

Every communication is retained against the case.

Clients select communication preferences subject to required service messages.

Quiet hours and timezone-aware delivery apply.

Failed delivery creates staff alerts and alternative-contact workflows.

19. Data model

Object

Key relationships

Tenant

Owns practices, offices, users, configuration and integrations.

Practice

Owns services, templates, cases, engagements and staff.

Person

Owns identity profiles, contact methods, documents, roles, consents and signatures.

Entity

Has identifiers, registers, documents, relationships and engagements.

Relationship

Connects person/entity to person/entity with type, percentages, control and dates.

Client group

Groups persons and entities for service delivery without replacing legal clients.

Onboarding case

Coordinates service request, parties, questions, evidence, reviews and status.

Question response

Links question version, subject, answer, evidence, source and confirmation.

Evidence item

Stores document/provider assertion, hash, classification, source and access.

Verification

Stores provider, method, input references, result, assurance and timestamps.

Service

Versioned catalogue item with rules, scope, price and required data.

Proposal

Contains selected service versions, commercial terms and approvals.

Engagement

Links legal clients, practice, services, terms, signatures and lifecycle.

Consent

Links person, purpose, recipient, scope, notice version and lifecycle.

Decision

Stores reviewer, result, reason, evidence, conditions and authority.

Audit event

Append-only actor, action, object, time, device, source and before/after references.

19.1 Data integrity requirements

Global identifiers are opaque UUIDs. External provider IDs are separate attributes.

Historical values are not overwritten when they support a completed decision.

Every versioned object has effective-from, effective-to and superseded-by fields.

Restricted values are encrypted separately and access is logged.

Soft deletion is used where retention applies. Purge requires policy evaluation.

All file evidence has a cryptographic hash and malware-scan result.

Derived ownership and risk results retain the ruleset and input versions used.


Confidential | Grow Advisory Group | Version 1.0 | 29 July 2026

EnTIQ Start | Product and Development Specification

20. API and integration requirements

20.1 Public API domains

Domain

Example operations

People

Create, match, retrieve, update permitted fields and request verification.

Entities

Create, enrich, retrieve, update and add relationships.

Groups

Create, retrieve, add subject and produce structure graph.

Cases

Create, invite, retrieve status, add request, submit and cancel.

Services

List current services and retrieve scope and pricing inputs.

Documents

Create request, upload, retrieve metadata and obtain authorised download.

Proposals

Create, issue, retrieve, vary and expire.

Engagements

Retrieve status, signatures, current terms and renewal date.

Consents

Request, record, retrieve and withdraw.

Decisions

Submit review, approve, reject and add condition.

Audit

Search authorised events and export evidence manifest.

20.2 Webhook events

case.created, case.opened, case.submitted, case.accepted and case.rejected.

person.verified, verification.failed and identity.expiring.

entity.created, entity.updated and relationship.changed.

document.received, document.rejected and document.expiring.

proposal.issued, proposal.viewed, proposal.signed and proposal.expired.

consent.granted, consent.withdrawn and access.revoked.

payment.mandate.created and payment.mandate.failed.

integration.failed and integration.recovered.

20.3 Priority integration mappings

System

Direction

Minimum integration

Xero Practice Manager

Two-way

Clients, groups, contacts, jobs, staff and acceptance status.

FYI

Two-way

Client filing, documents, emails, workflow trigger and links.

Microsoft 365

Two-way

Email, calendar, Teams notification and SharePoint links.

Didit or identity provider

Two-way

Verification session, result, assurance, evidence reference and failure.

ASIC/ABR data

Inbound

Entity identity, status, officeholders, addresses and ownership data where available.

E-sign provider

Two-way

Envelope, signatories, events, signed document and audit certificate.

Payment provider

Two-way

Customer token, mandate, status and failure events.

21. Security and privacy requirements

Control

Requirement

Authentication

MFA for staff, passkey support, risk-based client authentication and secure recovery.

Authorisation

Tenant, role, object, purpose and data-classification checks on every request.

Encryption

TLS in transit, managed encryption at rest and field encryption for highly restricted data.

Secrets

Managed vault, rotation, no secrets in source code or logs.

Sessions

Shorter staff idle timeout for restricted areas and device/session revocation.

Logging

Immutable security, access, export, approval and administration events.

Uploads

Malware scanning, file-type validation, quarantine and safe preview.

Data isolation

Tenant isolation verified through automated tests and architecture review.

Backups

Encrypted backups, tested restoration and documented recovery objectives.

Development

Secure SDLC, peer review, dependency scanning, SAST, DAST and penetration testing.

Incident response

Detection, containment, notification assessment, evidence preservation and lessons learned.

21.1 Prohibited design patterns

No identity documents or full identifiers in application logs.

No public file URLs.

No unrestricted administrator access across tenants.

No use of production client data in development or demonstrations.

No AI provider training on client information without explicit contractual and technical exclusion.

No automatic practice acceptance solely from an AI score.

No silent consent or preselected optional marketing consent.

22. Non-functional requirements

Area

Target

Availability

99.95% monthly availability excluding announced maintenance.

Performance

95% of standard API reads under 500 ms, excluding external providers.

Page load

Core portal screens interactive within 2.5 seconds on a typical Australian mobile connection.

Scale

Support at least 10,000 practice tenants and 10 million people without tenant redesign.

Accessibility

WCAG 2.2 AA for staff and client web interfaces.

Browser

Current and previous major Chrome, Edge, Safari and Firefox releases.

Mobile

Responsive web first, with native wrapper or application where identity capture requires it.

Recovery

Target RPO 15 minutes and RTO 4 hours for core onboarding records.

Audit retention

Configurable retention with seven-year support and legal hold.

Observability

Metrics, traces, structured logs, provider health and tenant-safe diagnostics.

23. Reporting and analytics

Invitations issued, opened, started, submitted, signed and accepted.

Conversion by channel, service, office, adviser and campaign.

Median time per stage and principal delay source.

Outstanding requests and ageing.

Identity pass, retry, manual review and failure rates.

Entity and beneficial-owner completeness.

Proposal value, accepted value, discount and expected margin.

Client acquisition cost and verification usage cost.

Rejection and withdrawal reasons.

Consent withdrawal and access-revocation events.

Integration success, delay and failure rates.

24. Acceptance criteria

ID

Acceptance test

AC-001

A practice can configure and publish a service without developer assistance.

AC-002

A client can start from invitation, QR code, referral or Share My EnTIQ.

AC-003

Duplicate matching prevents avoidable duplicate people and entities.

AC-004

A client can reuse verified details and see their source and currency.

AC-005

The system creates separate legal clients inside one client group.

AC-006

A company onboarding captures directors, shareholders, controllers and evidence.

AC-007

A trust onboarding captures deed details, trustee, appointor, beneficiaries and unit holders where applicable.

AC-008

Indirect ownership calculations aggregate multiple paths and flag incomplete chains.

AC-009

Questions change correctly based on client type, service and previous answers.

AC-010

Related parties can complete assigned sections without seeing unauthorised information.

AC-011

Every extracted value links to its evidence and confidence.

AC-012

The pricing engine shows cost, target margin, fee, variance and required approval.

AC-013

Generated engagement terms identify every legal client and selected service.

AC-014

Required signatories are determined by client type and authority.

AC-015

Optional consent is separate, unselected and withdrawable.

AC-016

The practice cannot accept a case with unresolved mandatory exceptions.

AC-017

An authorised reviewer can override a permitted rule with evidence and reason.

AC-018

Acceptance creates correctly mapped records in XPM and FYI.

AC-019

The client receives a portal showing current requests, documents, practices and sharing.

AC-020

Audit export reproduces key events, versions, evidence hashes and approvals.

AC-021

A practice cannot access another tenant’s records using changed object identifiers.

AC-022

Revoking sharing stops future access and preserves required historical evidence.

AC-023

Failed provider calls retry safely without duplicate charges or records.

AC-024

All client screens pass keyboard, contrast, label and screen-reader testing.


Confidential | Grow Advisory Group | Version 1.0 | 29 July 2026

EnTIQ Start | Product and Development Specification

25. Test plan

25.1 Test layers

Layer

Coverage

Unit

Rules, calculations, validation, permissions and state transitions.

Contract

External providers, API schemas, retries, timeouts and version changes.

Integration

Database, event, storage, signing, payment, XPM and FYI flows.

End-to-end

Complete individual, company, trust, referral and shared-identity journeys.

Security

Tenant isolation, broken access control, injection, upload, secrets and logging.

Privacy

Consent, withdrawal, restricted fields, export, correction and deletion policy.

Performance

Peak invitations, uploads, dashboard queries and provider degradation.

Accessibility

Automated and manual WCAG checks using keyboard and assistive technology.

Recovery

Provider outage, event replay, backup restoration and partial-write recovery.

25.2 Mandatory test personas

Simple individual tax client.

Married couple with separate legal engagements.

Company with one director and shareholder.

Company with layered corporate ownership.

Discretionary trust with corporate trustee.

Unit trust with multiple unit holders.

SMSF with individual trustees.

Foreign person and foreign entity.

Client represented under power of attorney.

Existing EnTIQ user sharing with a second practice.

Client who refuses biometric processing and uses the alternative path.

Client with conflicting identity and register data.

26. Delivery roadmap

Release

Scope

Exit condition

R1 Foundation

Tenant, users, roles, service catalogue, cases, invitations and core audit.

Practice can configure and issue a secure individual onboarding.

R2 Identity

Identity profile, documents, provider verification, consent and Share My EnTIQ.

Verified identity can be reused and shared under permission.

R3 Entities

Companies, trusts, groups, relationships, registers and ownership calculations.

Company and trust groups pass end-to-end tests.

R4 Commercial

Service selection, pricing, proposals, engagements, signing and payment authority.

Signed proposal can proceed to internal acceptance.

R5 Acceptance

Review panels, conflicts, exceptions, decisions, notifications and portal.

Practice accepts or rejects cases with a complete evidence trail.

R6 Integrations

XPM, FYI, Microsoft 365, e-sign, payments and provider monitoring.

Accepted case creates accurate downstream records.

R7 Scale and launch

Reporting, accessibility, penetration test, recovery, support and migration.

Production launch gate approved.

27. Launch gates

Product owner approves scope and all critical user journeys.

Privacy impact assessment completed.

Threat model and security architecture approved.

Legal review completed for engagement and consent templates.

Identity and payment provider contracts approved.

Penetration test has no unresolved critical or high findings.

Tenant-isolation tests pass.

Backup restoration and provider-outage exercises pass.

Accessibility review passes WCAG 2.2 AA requirements.

Support, incident, refund and dispute processes are documented.

Data export and termination process is tested.

Pilot practices complete individual, company and trust cases.

28. Product success measures

Measure

Initial target

Invitation-to-start rate

At least 80% for valid existing-client invitations.

Started-to-submitted rate

At least 75% without staff completing forms for the client.

Simple individual completion

Median under 12 minutes where identity is already verified.

New individual completion

Median under 20 minutes including verification.

Practice handling time

Under 15 minutes for a clean individual onboarding.

Duplicate request reduction

At least 70% for clients sharing an existing EnTIQ profile.

Straight-through acceptance

At least 70% of low-complexity cases require no exception handling.

Downstream data accuracy

At least 99.5% for accepted XPM and FYI mappings.

Support contacts

Below 8% of onboarding cases after the first three months.

29. Open product decisions

Decision

Recommended starting position

Identity provider

Use an abstraction layer supporting Didit first and a second provider later.

Electronic signing

Use Grow E-Sign when production controls are complete; retain a provider fallback.

Payments

Use provider-hosted card and direct-debit fields.

Client mobile app

Responsive web for R1, native identity capture if browser quality is insufficient.

Public registers

Start with licensed ASIC/ABR access and retain evidence of source and date.

Pricing

Practice subscription plus transparent external verification usage.

Existing clients

Bulk-import shells, then invite clients to claim and verify their profile.

Cross-practice sharing

Share assertions and selected fields by default, not unrestricted source documents.

30. Reference obligations

AUSTRAC, AML/CTF obligations factsheet for tranche 2 reporting entities, updated July 2025.

Tax Practitioners Board, TPB(GS) 34/2019 Letters of engagement, updated 30 April 2026.

Australian Taxation Office, Agent client verification methods.

Office of the Australian Information Commissioner, Australian Privacy Principles guidance and facial recognition privacy-risk guidance.

Regulatory content must be reviewed by qualified legal and compliance advisers before production release. EnTIQ must retain effective-dated rule and template versions so a completed case can be reproduced.

Appendix A. Definition of done

Requirements and acceptance tests approved.

Designs cover desktop, mobile, errors, empty states and accessibility.

API and event contracts documented.

Permissions and data classifications implemented.

Automated tests pass at the agreed coverage threshold.

Security, privacy and accessibility checks pass.

Operational metrics and alerts exist.

Support documentation and runbooks exist.

Migration and rollback steps are tested.

Product owner accepts the feature in a production-like environment.

Appendix B. Developer handover checklist

Confirm tenant and identity architecture.

Confirm canonical person, entity and relationship schemas.

Confirm event bus and audit-store design.

Confirm external provider abstraction contracts.

Confirm clause, question, consent and rules versioning.

Confirm file storage, scanning and access model.

Confirm XPM and FYI system-of-record boundaries.

Confirm operational ownership for failed integrations.

Confirm environments, deployment controls and production support.


Confidential | Grow Advisory Group | Version 1.0 | 29 July 2026

EnTIQ Start | Product and Development Specification

31. EnTIQ visual and experience design system

EnTIQ Start must use the exact design system, navigation model and shared React components already used by the EnTIQ Workpaper Automation Platform. Start is a module inside EnTIQ, not a separately branded application.

Non-negotiable rule

Developers must not create a new colour palette, typography system, sidebar, header, button family, table style, form style, modal system or dashboard shell for EnTIQ Start. Extend the existing EnTIQ component library only where a required component does not exist.

31.1 Experience character

Professional Australian fintech and accounting software.

Clean white and light-grey surfaces with clear blue actions.

Simple enough for clients who rarely use business software.

Structured web application, never a spreadsheet copied into a browser.

Quiet visual hierarchy with colour reserved for action, status and risk.

Short instructions, visible progress and immediate validation.

Consistent staff and client experiences using the same design language.

Mobile responsive, touch-friendly and accessible.

31.2 Design tokens

Token

Value

Use

Primary blue

#2855A6

Primary buttons, selected navigation, active controls and links.

Secondary teal

#20BCA4

Progress, supportive accents and verified identity states.

Success green

#2EA843

Completed, accepted, matched and valid.

Warning amber

#F5A623

Attention, expiring, conditional and medium-risk.

Error red

#D0021B

Failed, rejected, blocked and destructive actions.

Ink

#2E2E2E

Primary text.

Muted text

#6F6F6F

Secondary text, metadata and descriptions.

Border

#D1D1D1

Inputs, cards, dividers and tables.

Canvas

#F5F5F5

Application background and quiet section backgrounds.

Surface

#FFFFFF

Cards, panels, forms, drawers and modal surfaces.

Existing implementation tokens are authoritative where the current codebase differs. The values above describe the established EnTIQ palette and must map to semantic variables, not repeated hard-coded values.

31.3 Semantic token names

Category

Required variables

Backgrounds

bg-canvas, bg-surface, bg-subtle, bg-selected, bg-overlay.

Text

text-primary, text-secondary, text-disabled, text-inverse, text-link.

Borders

border-default, border-strong, border-focus, border-error.

Actions

action-primary, action-primary-hover, action-secondary, action-danger.

Status

status-info, status-success, status-warning, status-error, status-neutral.

Risk

risk-low, risk-medium, risk-high, risk-critical.

Focus

focus-ring and focus-offset.

31.4 Typography

Style

Specification

Use

H1

Inter 24px, 700, 32px line height

Page title only.

H2

Inter 20px, 600, 28px line height

Major page sections.

H3

Inter 16-18px, 600, 24px line height

Cards, panels and subsections.

Body

Inter 14px, 400, 20px line height

Normal interface copy.

Body strong

Inter 14px, 600, 20px line height

Labels and emphasis.

Small

Inter 12px, 400-600, 16px line height

Metadata, badges and help text.

Mono

14px monospaced, 20px line height

Identifiers, hashes and technical values only.

31.5 Spacing, radius and elevation

Element

Rule

Spacing

Use an 8px base scale: 4, 8, 16, 24, 32, 40, 48 and 64px.

Grid

1440px reference frame, 12 columns, 24px gutters and responsive margins.

Desktop page

Use existing 80px content padding where the EnTIQ shell applies it.

Card radius

8px, matching existing EnTIQ cards.

Input radius

Use the existing EnTIQ form-control radius.

Shadows

Soft low-elevation shadow only for raised cards, menus, drawers and modals.

Dividers

Use neutral borders. Avoid decorative rules and heavy boxes.

Touch target

Minimum 44 by 44px for client-facing controls.

32. Application shell and page layout

32.1 Staff shell

Reuse the existing EnTIQ left navigation sidebar.

Reuse the existing top header, global search, notifications and user menu.

Place EnTIQ Start under the main product navigation without a separate app switch.

Use breadcrumbs for group, client, entity and case context.

Keep primary page actions in the standard top-right action area.

Keep audit, activity and secondary tools in the existing drawer or side-panel pattern.

32.2 Standard work screen

Region

Grid

Contents

Main workspace

8 columns

Forms, entity data, questions, documents, pricing and decisions.

Review sidebar

4 columns

Review alerts, helper guidance, missing information and strategy tips.

Utility dock

Bottom

Documents, queries, comments, activity, evidence and sign-off.

The 8/4 layout applies to staff work screens. Collapse the review sidebar when it has no useful content. On smaller screens, the sidebar becomes a drawer below the page header.

32.3 Client shell

Use a reduced header with EnTIQ identity, help, save status and secure sign-out.

Remove staff navigation and internal terminology.

Display one clear task per screen.

Show the onboarding stepper at the top on desktop and as a compact progress control on mobile.

Keep Back on the left and Save and continue on the right.

Always show saved, saving or unable-to-save status.

Allow clients to leave and resume without losing completed answers.

32.4 Responsive breakpoints

Viewport

Behaviour

1440px and above

Full sidebar, 12-column content grid and visible review panel.

1024-1439px

Compact sidebar and responsive 8/4 or 7/5 content split.

768-1023px

Collapsed navigation, single main column and drawer-based review tools.

Below 768px

Mobile stack, sticky bottom actions, full-width inputs and no horizontal tables.

33. Shared component library

Developers must reuse the existing EnTIQ UI kit. Any new Start component must use existing tokens, primitives and interaction patterns.

Component family

Required variants

Buttons

Primary, secondary, tertiary, text, danger, icon, loading and disabled.

Inputs

Text, email, phone, date, currency, address, select, multiselect, radio, checkbox and search.

Cards

Standard, selectable, summary, status, action, identity, entity and service.

Tables

Simple, detailed, selectable, editable, expandable, responsive and empty.

Navigation

Sidebar item, tabs, breadcrumbs, stepper and pagination.

Feedback

Inline validation, alert banner, toast, badge, tooltip and empty state.

Overlays

Modal, confirmation modal, side drawer, popover and command menu.

Files

Upload card, document row, PDF viewer, rejected file and evidence attachment.

People and entities

Avatar, person card, entity card, relationship chip and structure node.

Workflow

Task row, progress card, checklist, approval card, review note and sign-off.

Communication

Query thread, comments, message composer and activity timeline.

AI and review

Review alert, guidance card, suggestion, confidence label and source link.

33.1 New EnTIQ Start components

Component

Purpose

Required states

Identity assurance card

Shows identity level, provider, date and expiry.

Unverified, pending, verified, manual, failed, expired.

Share permission card

Shows receiving practice, purpose and information scope.

Draft, active, expiring, revoked.

Onboarding stepper

Shows progress and allows permitted navigation.

Current, complete, incomplete, blocked, optional.

Party completion card

Tracks each related person’s assigned work.

Not invited, invited, opened, submitted, reviewed.

Entity structure node

Displays person or entity and relationship context.

Normal, selected, incomplete, conflict, verified.

Document request card

Explains evidence needed and upload status.

Required, uploaded, checking, accepted, rejected, expired.

Service selection card

Explains scope, frequency and price.

Recommended, selected, optional, excluded.

Proposal summary panel

Summarises clients, services, price and payment.

Draft, approval required, issued, signed, expired.

Consent row

Captures clear purpose-specific permission.

Required, optional, accepted, declined, withdrawn.

Acceptance panel

Combines review checks and final decision.

Ready, blocked, escalated, conditional, accepted, rejected.

33.2 Component state rule

Every interactive component must include default, hover, focus, active, selected, loading, disabled, success, warning and error states where relevant. Figma, Storybook and application code must use the same variant names.

34. Screen design patterns

Pattern

Use

Layout rule

Dashboard

Start overview and reporting.

Summary cards, filter bar, main table and review alerts.

Wizard

Client onboarding, practice setup and configuration.

Stepper, focused content card and fixed actions.

Record detail

Person, entity, group, case and engagement.

Header summary, tabs, 8/4 work area and utility dock.

Workbench

Pricing, matching, ownership and acceptance.

Dense main workspace, review sidebar and explicit save state.

Request centre

Documents, questions and outstanding client actions.

Status filters, grouped requests and clear responsibility.

Review

Client review, proposal review and internal approval.

Read-only summary with edit links and issue banners.

Settings

Services, questions, clauses, rules and integrations.

Left section navigation, editable panels and publish controls.

34.1 Figma frame and route mapping

Frame naming

Route example

SCR-START-001 Dashboard

/start

SCR-START-002 Create Invitation

/start/invitations/new

SCR-START-003 Case Overview

/start/cases/[caseId]

SCR-START-004 Client Welcome

/onboarding/[token]/welcome

SCR-START-006 My Identity

/portal/identity

SCR-START-008 Group Builder

/start/cases/[caseId]/structure

SCR-START-013 Pricing Workbench

/start/cases/[caseId]/pricing

SCR-START-018 Acceptance Review

/start/cases/[caseId]/acceptance

SCR-START-020 Template Manager

/settings/start/templates

Maintain one EnTIQ Figma super-base file.

Use pages 00 Foundations, 01 Atoms, 02 Molecules, 03 Organisms, 04 Layout Templates, Start Flows and Prototypes.

Use Auto Layout, published styles, components and variants.

Map every approved frame to a React/Next route.

Do not detach components in final screen designs.

34.2 Screen consistency checklist

Page title, breadcrumb and primary action use the standard EnTIQ position.

Fields use the same label, help, required and validation patterns.

Status always uses both text and colour.

Tables use existing headers, density, pagination and responsive behaviour.

Drawers, modals and alerts use shared components.

Empty states explain the next action.

Loading uses skeletons that match the final layout.

Errors explain what happened and how to continue.

35. EnTIQ Start page-by-page design direction

Screen

Design direction

Start dashboard

Existing EnTIQ dashboard shell. Four summary cards, filter bar, onboarding table and right review-alert rail.

Create invitation

Single card wizard. Client search first, then service, channel, owner and due date.

Onboarding case

Record-detail header with status and progress. Tabs for Overview, Parties, Information, Documents, Proposal, Acceptance and Activity.

Client welcome

Minimal client shell, practice card, five-step summary, privacy link and one primary Start button.

My identity

Identity assurance card, personal information sections, document cards and verification action.

My entities

Entity cards grouped by client group, with role badge, verification state and Add entity action.

Group builder

Structure canvas in the main workspace, entity inspector in the right panel and issues in the utility dock.

Questions

One logical section at a time, progress summary, inline help and automatic save.

Document requests

Grouped request cards with purpose, acceptable evidence, due date and upload state.

Share My EnTIQ

Three-step flow: select practice, review requested information, approve and share.

Service selection

Service cards with plain scope, frequency, fee and recommended badge.

Pricing workbench

Staff-only 8/4 workbench showing cost and margin in the main panel and approvals on the right.

Proposal review

Plain-language summary before full terms, with edit links and fixed Continue action.

Consent centre

Purpose-based rows with required or optional label, details drawer and current decision.

Signing

PDF viewer or document summary, authority declaration and signature action.

Payment authority

Provider-hosted payment form, fee schedule and mandate summary.

Acceptance review

Seven review panels, issue summary, decision bar and protected override drawer.

Client home

Current actions first, then entities, documents, practices and access permissions.

36. Interaction, language and accessibility

36.1 Interaction rules

Use one primary action per panel.

Confirm destructive, irreversible or high-impact actions.

Use optimistic updates only when rollback is safe and visible.

Keep primary actions visible on long client forms.

Do not clear client answers after validation or provider failures.

Return users to the precise issue requiring correction.

Allow staff to copy deep links only where the recipient has permission.

36.2 Content rules

Use Australian English.

Use client language, not internal accounting codes.

Write labels as nouns and buttons as clear actions.

Explain why sensitive information is requested before the field.

State who receives information and what happens next.

Avoid legal wording in the interface when a plain summary can appear first.

Use consistent terms: practice, client, person, entity, client group, engagement and case.

36.3 Status language

Avoid

Use

Done

Completed

Bad

Needs attention

Failed KYC

Identity verification needs review

Invalid company

Company details do not match the register

Rejected document

Document needs replacement

High risk person

Higher review required

36.4 Accessibility

Meet WCAG 2.2 AA.

Maintain visible keyboard focus on every control.

Do not communicate status using colour alone.

Provide programmatic labels, descriptions and error links.

Support 200% zoom without loss of information or action.

Use correctly ordered headings and semantic landmarks.

Provide text alternatives for structure diagrams and status icons.

Announce saving, errors and background verification results to assistive technology.

37. Developer implementation rules

Audit the existing EnTIQ component library before creating any component.

Map every Figma component to an existing React component or an approved new shared component.

Use semantic design tokens through the existing theme layer.

Build Start routes inside the current React/Next application shell.

Add new variants to shared components rather than cloning components into Start.

Document new components in Storybook with all states and accessibility notes.

Use feature flags for incomplete Start workflows.

Add screenshot regression tests for key desktop and mobile screens.

Test keyboard, screen reader, zoom, error and slow-network states.

Require design-system review before merging any new visual pattern.

37.1 Visual definition of done

The screen is recognisably EnTIQ without a separate logo or product theme.

It uses the existing sidebar, header, spacing, typography and shared components.

Desktop, tablet and mobile layouts are approved.

All interaction states exist in Figma and code.

No hard-coded colour, spacing or typography value bypasses the token system.

Storybook, Figma and production component names agree.

Visual regression, accessibility and responsive tests pass.

Confidential | Grow Advisory Group | Version 1.0 | 29 July 2026