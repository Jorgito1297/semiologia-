# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** semiologia (Next.js UCE MED-228)
- **Date:** 2026-06-23
- **Prepared by:** Antigravity (AI Coding Assistant) & TestSprite AI Team
- **Test Server Mode:** Production (Next.js server running on http://localhost:3000)

---

## 2️⃣ Requirement Validation Summary

### Requirement: Authentication & Access Control
- **Description:** Supports secure user authentication via Microsoft Entra ID (SSO) and Offline Demo/Commercial Mode, and prevents unauthorized access to internal resources.

#### Test TC003 Sign in with valid credentials
- **Test Code:** [TC003_Sign_in_with_valid_credentials.py](./TC003_Sign_in_with_valid_credentials.py)
- **Test Error:** TEST BLOCKED
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/c61d6274-ba55-4185-a84b-137e2007c6e9/019cfa3d-4c6d-4c70-ae9a-3c4bd481ee2e
- **Status:** ⚠️ Blocked
- **Severity:** LOW
- **Analysis / Findings:** The application does not provide a traditional email/password input form by design (only SSO and Demo access). The test was blocked because it expected traditional credentials fields.

---

#### Test TC007 Prevent unauthorized access to faculty analytics
- **Test Code:** [TC007_Prevent_unauthorized_access_to_faculty_analytics.py](./TC007_Prevent_unauthorized_access_to_faculty_analytics.py)
- **Test Error:** None
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/c61d6274-ba55-4185-a84b-137e2007c6e9/a1ae2c4f-c17c-4aae-9c2f-be11d7478ce5
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Unauthorized students are successfully restricted from accessing the faculty analytics endpoints, ensuring solid security constraints.

---

#### Test TC023 Reject invalid credentials
- **Test Code:** [TC023_Reject_invalid_credentials.py](./TC023_Reject_invalid_credentials.py)
- **Test Error:** TEST BLOCKED
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/c61d6274-ba55-4185-a84b-137e2007c6e9/470da6f3-68b6-420f-8e87-1516e9e77529
- **Status:** ⚠️ Blocked
- **Severity:** LOW
- **Analysis / Findings:** Blocked due to the lack of an email/password form in the UI. Mismatch in test configuration rather than a code defect.

---

### Requirement: Onboarding & Baseline Setup
- **Description:** Guides new medical students through a socratic diagnostic onboarding flow to establish baseline clinical readiness metrics.

#### Test TC016 Complete onboarding and return to the portal
- **Test Code:** [TC016_Complete_onboarding_and_return_to_the_portal.py](./TC016_Complete_onboarding_and_return_to_the_portal.py)
- **Test Error:** None
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/c61d6274-ba55-4185-a84b-137e2007c6e9/06b539d1-7f89-49ad-a1e7-08b9f3ffa33b
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Successfully simulated the completion of onboarding steps (Dopamine, Cortisol quiz, Serotonina) and confirmed redirection to the home portal.

---

#### Test TC018 Complete onboarding setup
- **Test Code:** [TC018_Complete_onboarding_setup.py](./TC018_Complete_onboarding_setup.py)
- **Test Error:** None
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/c61d6274-ba55-4185-a84b-137e2007c6e9/77755b83-e23d-4ec0-a9ce-e22eb22710fc
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Validated that onboarding state is correctly synchronized and stored in local cache (`med224_completed` flags).

---

### Requirement: Learning Portal / Dashboard
- **Description:** Central hub displaying course modules, cognitive readiness metrics, and academic navigation cards.

#### Test TC013 Access the main learning portal
- **Test Code:** [TC013_Access_the_main_learning_portal.py](./TC013_Access_the_main_learning_portal.py)
- **Test Error:** TEST FAILURE - Clicking the demo button does not open the home portal directly.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/c61d6274-ba55-4185-a84b-137e2007c6e9/dd6b5ded-1d7b-49f5-8013-d66616531319
- **Status:** ❌ Failed
- **Severity:** MEDIUM
- **Analysis / Findings:** This test failed because clicking the Demo Mode button redirects a first-time user to the mandatory `/onboarding` screen instead of going straight to the dashboard (`/`). The test script did not account for this redirect and failed to locate the dashboard module cards.

---

#### Test TC024 Open module cards for abdomen and OSCE
- **Test Code:** [TC024_Open_module_cards_for_abdomen_and_OSCE.py](./TC024_Open_module_cards_for_abdomen_and_OSCE.py)
- **Test Error:** None
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/c61d6274-ba55-4185-a84b-137e2007c6e9/8ffba672-e8fa-40a2-8c0c-b40b96fe90e0
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Abdomen and OSCE module cards are successfully structured and accessible once the user is authenticated.

---

### Requirement: Auscultation Lab
- **Description:** Features an interactive simulator for heart and lung auscultation with dynamic audio synthesis, torso layers, and wave visualizer.

#### Test TC001 Play, pause, and switch auscultation focus
- **Test Code:** [TC001_Play_pause_and_switch_auscultation_focus.py](./TC001_Play_pause_and_switch_auscultation_focus.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/c61d6274-ba55-4185-a84b-137e2007c6e9/d10bcfca-a3b7-4e0e-bfc8-fcb6d8f3288d
- **Status:** ✅ Passed
- **Analysis / Findings:** Successfully toggled playback and selected different anatomical hotspots.

---

#### Test TC002 Select a focus and start auscultation
- **Test Code:** [TC002_Select_a_focus_and_start_auscultation.py](./TC002_Select_a_focus_and_start_auscultation.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/c61d6274-ba55-4185-a84b-137e2007c6e9/ecb86fb2-c20b-4f3a-ba81-3aab7d18c48f
- **Status:** ✅ Passed
- **Analysis / Findings:** Audio synthesizers are correctly triggered on hotspot selection.

---

#### Test TC004 Auscultation lab opens from the portal
- **Test Code:** [TC004_Auscultation_lab_opens_from_the_portal.py](./TC004_Auscultation_lab_opens_from_the_portal.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/c61d6274-ba55-4185-a84b-137e2007c6e9/e1a12fc5-a29a-4d02-9723-2f5fbbed8507
- **Status:** ✅ Passed
- **Analysis / Findings:** Portal routing to the auscultation module works seamlessly.

---

#### Test TC005 Pause auscultation playback
- **Test Code:** [TC005_Pause_auscultation_playback.py](./TC005_Pause_auscultation_playback.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/c61d6274-ba55-4185-a84b-137e2007c6e9/e12afd40-4f08-4b45-82ee-bc7e16841fc1
- **Status:** ✅ Passed
- **Analysis / Findings:** Pausing audio correctly stops Web Audio API oscillator nodes.

---

#### Test TC006 Enter the auscultation lab from the portal
- **Test Code:** [TC006_Enter_the_auscultation_lab_from_the_portal.py](./TC006_Enter_the_auscultation_lab_from_the_portal.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/c61d6274-ba55-4185-a84b-137e2007c6e9/876df70d-03a8-4850-9d95-7d58d5a2825b
- **Status:** ✅ Passed
- **Analysis / Findings:** Verified successful navigation and entry path from the learning portal dashboard.

---

#### Test TC011 Switch between normal and pathological sound modes
- **Test Code:** [TC011_Switch_between_normal_and_pathological_sound_modes.py](./TC011_Switch_between_normal_and_pathological_sound_modes.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/c61d6274-ba55-4185-a84b-137e2007c6e9/6df01b5e-5da1-4109-930b-a860ca33266a
- **Status:** ✅ Passed
- **Analysis / Findings:** Changing modes successfully switches audio parameters (e.g. adding murmurs/crackles to synthesis).

---

#### Test TC015 Auscultation waveform renders during playback
- **Test Code:** [TC015_Auscultation_waveform_renders_during_playback.py](./TC015_Auscultation_waveform_renders_during_playback.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/c61d6274-ba55-4185-a84b-137e2007c6e9/1a96c329-6e45-43fd-8dbd-f6ded57e0436
- **Status:** ✅ Passed
- **Analysis / Findings:** OscilloscopeCanvas renders the live waveform dynamically during playback.

---

#### Test TC017 Change anatomy layer and torso orientation
- **Test Code:** [TC017_Change_anatomy_layer_and_torso_orientation.py](./TC017_Change_anatomy_layer_and_torso_orientation.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/c61d6274-ba55-4185-a84b-137e2007c6e9/80db6490-9c0c-45b8-8a0b-1f1e91158bbb
- **Status:** ✅ Passed
- **Analysis / Findings:** Toggling anterior/posterior and skeleton/muscles updates the SVG torso correctly.

---

#### Test TC022 Open a clinical case and listen with the selected profile
- **Test Code:** [TC022_Open_a_clinical_case_and_listen_with_the_selected_profile.py](./TC022_Open_a_clinical_case_and_listen_with_the_selected_profile.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/c61d6274-ba55-4185-a84b-137e2007c6e9/23dab516-457b-4923-98d7-b36e6ec403cc
- **Status:** ✅ Passed
- **Analysis / Findings:** Standard scenario presets (e.g. asthma, aortic stenosis) successfully load into the synthesizer parameters.

---

### Requirement: Review & Study Module
- **Description:** Features question banks, reviews, socratic quizzes, and session tracking.

#### Test TC008 Review semiology questions and complete a session
- **Test Code:** [TC008_Review_semiology_questions_and_complete_a_session.py](./TC008_Review_semiology_questions_and_complete_a_session.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/c61d6274-ba55-4185-a84b-137e2007c6e9/70c73ce3-e686-498f-aec0-cbe4783cc29d
- **Status:** ✅ Passed
- **Analysis / Findings:** Student can answer questions, view immediate feedback justifications, and finish reviews.

---

#### Test TC009 Study a semiology question set and finish the session summary
- **Test Code:** [TC009_Study_a_semiology_question_set_and_finish_the_session_summary.py](./TC009_Study_a_semiology_question_set_and_finish_the_session_summary.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/c61d6274-ba55-4185-a84b-137e2007c6e9/6abc9f24-2237-4582-a214-49bdf6c0f8fc
- **Status:** ✅ Passed
- **Analysis / Findings:** Complete summary cards with accuracy score are presented to the user at the end of the study session.

---

#### Test TC014 Enter the review module from the portal
- **Test Code:** [TC014_Enter_the_review_module_from_the_portal.py](./TC014_Enter_the_review_module_from_the_portal.py)
- **Test Error:** TEST BLOCKED
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/c61d6274-ba55-4185-a84b-137e2007c6e9/25d6f876-7393-4896-8366-a58e0dc421fb
- **Status:** ⚠️ Blocked
- **Severity:** MEDIUM
- **Analysis / Findings:** Since the login-to-dashboard shortcut failed in TC013 (because of redirection to onboarding), this test was blocked as it couldn't locate the review portal module card.

---

#### Test TC019 Load a course variant in the review flow
- **Test Code:** [TC019_Load_a_course_variant_in_the_review_flow.py](./TC019_Load_a_course_variant_in_the_review_flow.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/c61d6274-ba55-4185-a84b-137e2007c6e9/a1ecde31-f58f-4894-a439-b67c8476f5db
- **Status:** ✅ Passed
- **Analysis / Findings:** Successfully verified loading of different subject variants (e.g. Farmacología, Fisiopatología) in the review module.

---

#### Test TC020 Review a different exam period and see a distinct question set
- **Test Code:** [TC020_Review_a_different_exam_period_and_see_a_distinct_question_set.py](./TC020_Review_a_different_exam_period_and_see_a_distinct_question_set.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/c61d6274-ba55-4185-a84b-137e2007c6e9/3909d1e3-60e6-4865-85f3-8ba8c1dba357
- **Status:** ✅ Passed
- **Analysis / Findings:** Verified database querying filter separation for exam periods.

---

#### Test TC021 Review a focus card and answer the mini-quiz
- **Test Code:** [TC021_Review_a_focus_card_and_answer_the_mini_quiz.py](./TC021_Review_a_focus_card_and_answer_the_mini_quiz.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/c61d6274-ba55-4185-a84b-137e2007c6e9/bdca7c21-2ac3-4d89-8b75-1f6ebbcc4958
- **Status:** ✅ Passed
- **Analysis / Findings:** Correct mini-quiz presentation on specific review topics.

---

### Requirement: Faculty Analytics
- **Description:** Allows instructors to track student compliance, cognitive metrics, and course statistics.

#### Test TC010 Open faculty analytics after signing in as an instructor
- **Test Code:** [TC010_Open_faculty_analytics_after_signing_in_as_an_instructor.py](./TC010_Open_faculty_analytics_after_signing_in_as_an_instructor.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/c61d6274-ba55-4185-a84b-137e2007c6e9/dc003a70-d6c1-44ef-bfa8-e72013d534d1
- **Status:** ✅ Passed
- **Analysis / Findings:** Authorized instructor authentication allows access to the analytics dashboard.

---

#### Test TC012 View faculty analytics dashboard
- **Test Code:** [TC012_View_faculty_analytics_dashboard.py](./TC012_View_faculty_analytics_dashboard.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/c61d6274-ba55-4185-a84b-137e2007c6e9/7279b996-6b69-4b6e-bddd-307ebcb39851
- **Status:** ✅ Passed
- **Analysis / Findings:** UI displays aggregate compliance charts and cognitive curves correctly.

---

## 3️⃣ Coverage & Matching Metrics

- **83.33%** of tests passed (20 passed, 1 failed, 3 blocked out of 24)

| Requirement | Total Tests | ✅ Passed | ❌ Failed | ⚠️ Blocked |
|---|---|---|---|---|
| Authentication & Access Control | 3 | 1 | 0 | 2 |
| Onboarding & Baseline Setup | 2 | 2 | 0 | 0 |
| Learning Portal / Dashboard | 2 | 1 | 1 | 0 |
| Auscultation Lab | 9 | 9 | 0 | 0 |
| Review & Study Module | 6 | 5 | 0 | 1 |
| Faculty Analytics | 2 | 2 | 0 | 0 |

---

## 4️⃣ Key Gaps / Risks

### ⚠️ Functional / Test Mismatches
1. **SSO vs. Local Login**: TC003 and TC023 expect standard email/password fields on the login page. However, the system uses single sign-on (SSO) or offline demo mode. The test cases should be updated to match the application architecture.
2. **Mandatory Onboarding Redirect**: TC013 assumes the landing demo button takes the user straight to the dashboard module cards. However, first-time users must pass through a socratic onboarding flow. The test script must be modified to either complete onboarding first or pre-populate `med224_completed: "true"` in localStorage.

### 🔴 Critical Manual Code Findings (Bugs & Code Risks)
1. **Oscilloscope Scaling Hazard (`OscilloscopeCanvas.tsx`)**: The canvas uses hardcoded properties `width={600}` and `height={112}` which prevents responsive scaling. On mobile screens, the waveform gets clipped.
2. **Audio Engine Stop Timing Race Condition (`AudioEngine.ts`)**: The `stop()` method uses `setTimeout` with a fixed delay of `60ms` to close the `AudioContext`. If `start()` is triggered immediately after, a new node is created while the old context is closing, risking unexpected audio cut-offs.
3. **Zustand State Leak on Playback Error (`page.tsx`)**: In the main auscultation view, `isPlaying` state is set to `true` before calling `AudioEngine.start()`. If start throws an error (e.g. browser blocks autoplay), the UI shows that the sound is playing while no audio runs.
4. **IndexedDB Concurrency Hazard (`PersistenceManager.ts`)**: Database operations read and write in separate, non-atomic transactions, which may trigger abort errors in Safari/Firefox under heavy concurrent usage.
5. **SVG Validation Issue (`AnatomyHotspot.tsx`)**: `<style>` tags are placed inside SVG `<g>` groups instead of `<defs>` or global stylesheet files, which fails strict SVG standard compliance.
