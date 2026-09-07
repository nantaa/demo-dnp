# /security — Security Audit & Hardening Command

## Purpose
Perform deep security audits on application code, authentication mechanisms, authorization gates, and data protection policies.

## Phase
**Review** (Part of the Review Phase)

## When to Use
- Reviewing role-based access control (RBAC), policies, and stage-gate permissions.
- Auditing endpoints handling financial, commercial, or sensitive data (e.g. price fields, payment proofs, SUKET files).
- Validating file upload handlers, authentication routes, and input sanitization.

## Workflow & Guidelines
1. **Authorization & RBAC Hardening**:
   - Verify that all stage transitions check the user's role (e.g. only Marketing can advance Stage 1 & 11, only Admin for Stage 2/3/5/7/8/9, only INS for Stage 4, only Finance for Stage 10/11c).
   - Verify data masking rules: Ensure Admin cannot view price (`nilai`) on PO/SPK across all API responses and Inertia props (not just hidden in UI via CSS).
2. **Input Sanitization & Injection Defense**:
   - Check SQL injection risks: ensure all database queries use Eloquent ORM or parameterized bindings.
   - Prevent Cross-Site Scripting (XSS): verify React auto-escaping, avoid `dangerouslySetInnerHTML`.
   - Prevent CSRF: verify Inertia/Laravel CSRF token headers are present on state-modifying requests.
3. **File Upload Security**:
   - Validate uploaded files (BAP, SUKET, Surat Bahan, Bukti Transfer) by MIME type, extension, and max size.
   - Store files on private disks or secure public paths with non-predictable UUIDs.
4. **Audit Logging & Tamper-Proofing**:
   - Ensure critical state changes (reschedule reason, manager approval/rejection, payment verification) write immutable audit logs.
