# Audit: DNP Monitor Documentation vs. Reality

> **Verdict up front:** The three Markdown documents describe a system that does not exist. I checked your actual GitHub repository (`nantaa/monitoring-DNP`), and the live code implements almost none of what Rev6, the "Kirim Dulu/Bayar Dulu" doc, or the V3 Master doc specify. You have a documentation stack that has been drifting further from the codebase with every revision, and the newest document (V3 Master) already contradicts the revision I wrote for you two days ago. This is not a "few gaps" situation — it's a fork between paper architecture and shipped architecture that needs to be resolved before anyone writes another line of Markdown.

**Tools actually used for this audit** (per your instruction to use every relevant tool, stated honestly):
- `github_mcp_direct` — I found and searched your real repository `nantaa/monitoring-DNP` (`search_code` across migrations, models, controllers, TS types, seeders). This is the single most important thing I did — everything below Section 2 is grounded in your actual code, not guesses.
- `search_web` — verified how Indonesian withholding tax (PPh 23 / PPh 4(2)) actually applies to *jasa riksa uji/inspeksi*, to check whether my own "Dengan PPh / Tanpa PPh" design was even correct.
- No dedicated "db-schema" or "security-review" connector exists in this session (I checked Snowflake, Supabase, MySQL, PostgreSQL, MotherDuck, etc. — all disconnected, and none would apply to a Laravel/MySQL local schema anyway). I did not pretend otherwise; I substituted direct code inspection via GitHub, which is more reliable than a generic schema linter here.

---

## 1. The Core Problem: Three Documents, One Codebase, Zero Agreement

| Question | Rev6 (tahap 1) | Kirim Dulu/Bayar Dulu (my Sept 8 doc) | V3 Master Updates | **Actual code (`dnp-app`)** |
|---|---|---|---|---|
| Is there a `Unit` entity? | Yes, proposed (8.5) | Assumes yes | Yes, in ERD | **No.** `units` is an integer count on `jobs`. `units_tracking` is a JSON blob, not a table. |
| Is there a `Batch` entity? | Yes, proposed (8.3) | Assumes yes, adds fields | Yes, in ERD | **No.** No batch table, no `batch_id` anywhere in the codebase. |
| Is there a `LHPP`/`BAP` table? | Yes, proposed (8.5) | Not touched | Yes, in ERD | **No.** No such tables or models exist. |
| Is there a `PaymentVerification` table? | Yes (Stage 11c) | Yes, with PPh fields | Yes, but *without* PPh fields | **No.** Payment is 5 flat columns on `jobs`: `invoice_no`, `payment_status` (`sent/paid/overdue`), `payment_paid_at`, `payment_amount_received`. |
| Is price masking implemented? | Described as Hard-Gate | Not addressed | Described as Hard-Gate, backend serializer | **No.** Zero occurrences of "masking" anywhere in the repo. `nilai` is a required, non-nullable field on the shared TypeScript `Job` type sent to every page. |
| Does Stage 7 = "Verifikasi ke Dinas"? | Yes | Yes | Yes | **No.** Code comment literally says `// Stage 7 — Billing`. Your stage numbering in code and in every doc are different systems. |
| Is there a "Kirim Dulu atau Bayar Dulu?" gateway? | N/A (didn't exist yet) | Yes, core feature | **No — not incorporated** | **No.** |
| Does Stage 11c decide PPh? | N/A | Yes | **No** — still binary Lunas/Partial | **No.** `payment_status` has no PPh concept at all. |
| Does Finance (not System) close the Job? | System auto-close | **Yes, explicitly redesigned for this** | **No — still "Sistem (Rollup)" auto-closes** | **No.** No close action exists; job just accumulates flags. |
| Retry count / loop tracking? | Yes, proposed | Yes, proposed | Yes, proposed | **No** field exists. |
| Escalation reminders (7/14 day)? | Yes, proposed | Not touched | Yes, described in detail | **No** cron/notification logic found; `notification_logs` table exists but nothing ties it to the 7/14-day rule. |

**You're wrong if you think V3 Master is the "latest, most complete" version.** It is actually a *regression* relative to my Sept 8 revision: it dropped the "Kirim Dulu atau Bayar Dulu" gateway entirely, reverted Stage 12 back to automatic System closing (directly contradicting your own instruction from two days ago that Finance must close it), and never added the PPh decision fields to `PaymentVerification`. Whoever or whatever produced the V3 Master doc did not read the revision doc — or ignored it. If you generated V3 Master after our last conversation, it was built without carrying forward the changes you just asked for.

---

## 2. What's Actually Live in the Codebase (Ground Truth)

From `dnp-app/database/migrations/2026_06_12_050655_create_jobs_table.php`, `app/Models/Job.php`, `JobController.php`, and `resources/js/types/index.ts`:

- **One monolithic `jobs` table** carries: `kode, klien, lokasi, owner_marketing, pic_klien, pic_klien_phone, pesawat, units (int), nilai (int, rupiah), no_po, tgl_po, stage (int 1–12), stage_started_at, disnaker_tujuan, inspektur_ids, inspektur, tgl_pelaksanaan, durasi_hari, peer_review_status, peer_review_submitted_at/_by, peer_review_approved_at/_by, laik_status, evaluations, stage2_checklist, units_tracking (JSON), disnaker_followups (JSON), invoice_no, invoice_date, top_days, payment_due_date, payment_status, payment_paid_at, payment_amount_received, tanda_terima_kembali, completed_at, notes, history, created_by`.
- `pesawat` is a **single category per Job** (`LIFT, ESC, PAPA, FIRE, LISTRIK, BOILER, PV, PTP`) — meaning a Job cannot mix equipment types, and "95 units pass, 5 fail" tracking is done inside a JSON array (`units_tracking`), not real rows.
- Stage is a **plain integer**, gated server-side via `$this->authorize('advanceStage', $job)` + `validateStageGate()` — good, this part is real and enforced, unlike price masking.
- Permission-to-stage mapping (`STAGE_PERMISSIONS`) lives in a **frontend TypeScript file** (`resources/js/lib/constants.ts`). I found a real, server-side `authorize()` call for stage advancement, which is reassuring — but I found **no equivalent server-side gate for who can see `nilai`**. If that gate only exists on the frontend, it's cosmetic: any authenticated user can pull the JSON payload for a Job and read `nilai` directly, regardless of role, unless there's a Resource/transform layer I couldn't find (and `search_code` for "masking" returned 0 hits repo-wide).
- Two Laravel app trees exist in the repo: `dnp-app/` and `temp_app/`. That's either leftover scaffolding or an unresolved migration between two setups — worth cleaning up before it causes someone to edit the wrong copy.
- There's a `peer_review_status` / `laik_status` workflow and a "Recommender Algorithm" referenced in `implementation_plan.md` that **none of the three Markdown docs mention at all**. Your code has functionality your documentation doesn't know about, which is just as bad as the reverse.

---

## 3. Rated Findings — Honest, Not Agreeable

| # | Finding | Severity | Rating | Why |
|---|---|---|---|---|
| 1 | Price masking is documented three times as a "Hard-Gate" but has zero code implementation, and `nilai` is a mandatory field on the shared frontend type | **Critical** | 1/10 as currently shipped | This is your single most emphasized security requirement across every doc, and it's the most conspicuously absent thing in the codebase. If Admin/INS accounts exist in production today, they can already see commercial pricing. |
| 2 | Stage numbering mismatch between code (`Stage 7 = Billing`) and every doc (`Stage 7 = Verifikasi ke Dinas`) | **Critical** | 2/10 | You cannot safely implement any of the finance revisions (gateway, PPh, close-by-FIN) on top of code where "Stage 7" means something totally different. Someone will wire the wrong logic to the wrong stage number. |
| 3 | Unit/Batch/LHPP/PaymentVerification entities exist only on paper; real data model uses a monolithic Job row + two JSON blobs | **Critical** | 3/10 as a foundation for the split-batch feature | JSON blobs can't be queried, joined, indexed, or given independent audit trails. The entire "95 units continue, 5 loop back" design (rated 8/10 in Rev6, correctly) is currently unbuildable on the real schema without a genuine migration to normalized tables. |
| 4 | V3 Master doc regressed the Stage 12/close-by-FIN and PPh decisions you explicitly requested on Sept 8 | **High** | — | This isn't a rating, it's a process failure: your latest "master" doc is stale relative to your own most recent explicit instruction. Docs need one canonical owner/version, not three parallel forks. |
| 5 | My own "Kirim Dulu atau Bayar Dulu" framing of PPh as something Finance "decides" | **Medium** | 6/10, needs correction | Real PPh 23 withholding on jasa inspeksi is a function of the *client's* tax-withholding status (their NPWP status and whether they're a corporate/government withholding agent, per DJP rules) — not an internal Finance choice per transaction. My fields (`payment_scheme`, `pph_amount`, `supporting_document_url`) are structurally fine because they let Finance *classify what happened* against evidence (bukti potong), but the word "decide" undersells that this is reconciliation against a client attribute usually known at PO stage, not an arbitrary Stage-11c judgment call. Fix: add a `client.is_pph_withholding_agent` flag captured at Stage 1/client master data, and treat Stage 11c as verification-against-expectation, not free choice. |
| 6 | Dual backend stack in V3 Master ("Laravel 11 (...) + Express Node.js") with zero justification | **Medium** | 3/10 as documented | Nothing in any requirement doc needs a second backend framework. Real code is 100% Laravel (`dnp-app`, `temp_app`). This is either dead documentation or an unexplained architectural decision that should be justified or deleted. |
| 7 | "Infinite ceiling" escalation with no hard cap on retry loops (Stage 11 ⇄ 11c ⇄ Gateway) | **Medium** | 4/10 | Reasonable for units stuck in rework (a physical unit really can sit broken indefinitely), but financially reckless for payment retries — a Job could stay "Partial" forever with no forced legal/collections escalation. Rev6 flags this as open (8.7) but nothing resolves it, and no code exists for it at all. |
| 8 | Manager granted full price visibility in the RBAC table with no stated justification | **Medium** | 4/10 | Manager's documented job (Stage 6, technical LHPP review) has no obvious need for commercial price data. Either justify it (does Manager also do commercial approval?) or narrow it — this is a least-privilege violation as written. |
| 9 | `STAGE_PERMISSIONS` map lives only in frontend TS; no found server-side equivalent | **High** | — | Confirmed real `authorize()` calls exist for `advanceStage`/`update`, which is good — but I found no matching backend policy method for viewing/masking price specifically. This needs direct confirmation from you (check `app/Policies/JobPolicy.php`, which `search_code` did not surface at all — it may not exist as a named policy class, or may be inline in a different file). |
| 10 | Two parallel Laravel trees (`dnp-app/`, `temp_app/`) in one repo | **Low-Medium** | — | Housekeeping risk: future edits could land in the dead tree. Confirm which is canonical and delete/archive the other. |
| 11 | Code has `peer_review_status`/`laik_status`/"Recommender Algorithm" not documented anywhere | **Medium** | — | Undocumented working code is a knowledge-loss risk — if the original author leaves, no one knows this exists or why. |

---

## 4. What Needs to Be Built Next — In Order

Not a wishlist — a dependency-ordered backlog. Nothing below Item 3 is safe to build until Items 1–2 are resolved, because they change the meaning of every stage number and every table your finance revision depends on.

1. **Reconcile stage numbering between code and docs.** Pick one canonical stage list (1–12 with fixed names) and rewrite either the code's `stage` semantics or the docs — right now "Stage 7" means two different things depending on which artifact you're reading. This blocks everything else.
2. **Decide, in writing, whether the Unit/Batch/LHPP/PaymentVerification redesign is actually happening.** If yes: this is a real database migration project (new tables, foreign keys, backfill of existing `units_tracking` JSON into rows), not a documentation exercise. If no: stop writing ERDs for entities that will never exist and redesign the finance/PPh/gateway logic to work against the real JSON-blob-on-Job model instead.
3. **Implement price masking server-side, now, regardless of what else happens.** This is the highest-severity, lowest-effort fix available: add a Laravel API Resource (`JobResource`) that conditionally strips `nilai` (and any other commercial fields) based on `$request->user()->role`, and stop relying on a frontend-only permission map. This should ship before any of the PPh/gateway work, because it's an active data-exposure gap today.
4. **Only after 1–3: implement the "Kirim Dulu atau Bayar Dulu" gateway, Stage 11c PPh classification, and Finance-driven Stage 12 close** — against whichever data model you chose in Item 2. Add the `client.is_pph_withholding_agent` correction from Finding 5.
5. **Add a hard ceiling + mandatory escalation path for payment retries** (distinct from the unit-rework ceiling, which can stay infinite). Suggest: after N retries or M days in Partial, force a Manager/Finance decision (write-off, legal escalation, or manual override with logged reason) rather than looping forever.
6. **Resolve the two-Laravel-tree situation** and document (or delete) `peer_review_status`, `laik_status`, and the "Recommender Algorithm" so the codebase and documentation describe the same system.
7. **Only then**, consolidate Rev6, the Kirim Dulu/Bayar Dulu doc, and V3 Master into one canonical document with a version number and changelog — three parallel Markdown files that silently diverge is how you got the Stage 12 regression in Finding 4.

---

## 5. Honest Uncertainty

I could not directly view the full contents of `JobPolicy.php` (if it exists) or confirm 100% that no backend masking logic exists anywhere in a file `search_code` didn't surface — GitHub's code search can miss content in some edge cases, and I only sampled the repo rather than reading every file byte-for-byte. Treat Finding 1 and 9 as "very likely, strongly evidenced" rather than "absolutely certain," and have a developer grep the codebase directly for `nilai` inside any `Resource`, `Transformer`, or `toArray()` override before you finalize a fix. Everything else in Section 2 (schema fields, stage semantics, absence of Unit/Batch/LHPP tables) I'm confident in — those came from direct migration/model/type file matches, not inference.
