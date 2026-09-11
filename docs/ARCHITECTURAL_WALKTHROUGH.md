# EnTIQ Start Architectural Boundary Refactoring Walkthrough

## Summary of Completed Changes

We have refactored and aligned **EnTIQ Start** strictly with its architectural boundary: **Client Onboarding Orchestrator and Engagement Gateway**.

---

### 1. EnTIQ Start 11-Stage Lifecycle Pipeline Formalized
EnTIQ Start now explicitly structures and tracks the 11 sequential stages of onboarding:
1. **Stage 1: Invitation** — Lead intake and magic link portal access issuance.
2. **Stage 2: Client / Entity Details** — Company / Individual profile, ABN/ACN registry match, tax residency.
3. **Stage 3: Questionnaire** — Onboarding intake questionnaire and service scope discovery.
4. **Stage 4: Document Requests** — Document intake for prior financials, trust deeds, and ASIC extracts.
5. **Stage 5: Related Parties** — Directors, trustees, and Ultimate Beneficial Owners (UBO) structure.
6. **Stage 6: Service Selection** — Assembling tailored service packages from the pricing catalogue.
7. **Stage 7: Proposal** — Fee proposal quote and terms presentation.
8. **Stage 8: Engagement Preparation** — Compiling Letter of Engagement and dispatching to eSign.
9. **Stage 9: External Module Checks** — Aggregated verification gateway displaying the 4 companion module statuses before internal approval.
10. **Stage 10: Internal Acceptance** — Partner checklist, margin review, and formal sign-off.
11. **Stage 11: Client Activated** — Final client activation triggering the **Downstream Practice Handover** to EnTIQ Practice.

---

### 2. Stage 9 External Module Checks Gateway Implemented
The Case Drawer now includes a dedicated **External Checks (Gateway)** tab displaying clean read-only statuses from companion modules:
- **EnTIQ KYC / Identity**: Status (`Complete`), Method (`Passport NFC & 3D Biometric`), Provider (`EnTIQ KYC / Didit Engine`), Reference (`KYC-2026-9812`).
- **EnTIQ Compliance & AML**: Status (`Cleared`), PEP Screening (`0 Matches`), Sanctions Screening (`0 Matches`), Risk Rating (`Low Risk - Score 18/100`).
- **EnTIQ Documents & eSign**: Status (`Executed & Sealed`), Document (`Letter of Engagement.pdf`), Certificate (`CERT-ESIGN-884920`), Verification (`SHA-256 Validated`).
- **EnTIQ Billing & Payments**: Status (`Mandate Authorised`), Mandate Type (`Direct Debit Mandate`), Billing Cycle (`Monthly in advance`), First Date (`1 Aug 2026`).

---

### 3. Stage 11 Downstream Practice Handover
Upon partner approval in Stage 10:
- Transition to Stage 11 (`Client Activated`).
- Generates and logs the **Downstream Practice Handover** payload to **EnTIQ Practice** (`Client ID`, `Entity`, `Primary Contact`, `Approved Services`, `Engagement Doc ID`, `Provisioned Timestamp`).
- Displays instant visual confirmation on the case file.

---

### 4. Navigation & Settings Streamlining
- **Main Nav Items**:
  - `Start Dashboard`
  - `Onboarding Pipeline (11 Stages)`
  - `Invitations & Intake`
  - `Clients & Entities`
  - `Proposals & Engagements`
  - `Workflow Builder`
  - `Onboarding Activity`
- **Settings Items**:
  - `Proposal Templates`
  - `Services Catalogue`
  - `Module Connectors`
  - `API Keys & DB`
- Removed standalone `Billing & Payments` and global integration administration from Start's primary workflow, replacing them with the **External Checks Gateway** and **Module Connectors**.

---

## Verification Results

### Automated Build Verification
```bash
npm run build
```
- **Result**: `✓ built in 7.32s` with zero errors (`1611 modules transformed`).
