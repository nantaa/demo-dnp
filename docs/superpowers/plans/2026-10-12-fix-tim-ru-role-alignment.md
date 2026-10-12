# Comprehensive Tim RU Role Parity & Security Gating Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish complete role parity and security gating for `tim_ru` across all frontend components (Kanban, JobDetailSheet, Layout, NotificationBell) and backend controllers/services (DashboardController, JobController, DailyDigestService, InspectorRecommendationService), resolving kanban board access, document gating, and PO/pricing masking.

**Architecture:** 
1. Define a centralized source of truth in `Constants.js` (`RU_ROLES = ['inspektur', 'inspector', 'tim_ru']` and helper `isRURole(role)`), replacing all fragmented, hardcoded arrays in frontend code.
2. Update backend controllers (`DashboardController.php`, `JobController.php`, `DailyDigestService.php`, `InspectorRecommendationService.php`, `User.php`) so that `tim_ru` is recognized across document filtering, authorization, and recommendation queries.
3. Close the security/pricing loophole in `JobDetailSheet.jsx` where `canSeeNilai = !isINS` permitted `tim_ru` to view client pricing and download PO/SPK documents.

**Tech Stack:** React 18, Inertia.js, TailwindCSS, Laravel 10 / PHP 8.2, Node.js test runner (`node --test`).

## Global Constraints
- Follow TDD order: Plan → Test → Implement → Review → Verify → Document.
- No regression on existing roles (`admin`, `marketing`, `finance`, `manager`, `superadmin`).
- Preserves backward compatibility for users with legacy role strings (`inspektur`, `inspector`) as well as `tim_ru`.

---

### Task 1: Write TDD Automated Tests for Tim RU Role Parity

**Files:**
- Create: `tests/tim_ru_comprehensive_parity.test.js`

**Interfaces:**
- Consumes: `Constants.js`, `Kanban/Index.jsx`, `JobDetailSheet.jsx`, `DashboardController.php`, `JobController.php`, `DailyDigestService.php`, `InspectorRecommendationService.php`, `AppLayout.jsx`, `NotificationBell.jsx`
- Produces: Test assertions verifying that `tim_ru` is included in all inspector role checks and pricing gates.

- [ ] **Step 1: Write the failing test**
Create `tests/tim_ru_comprehensive_parity.test.js` checking:
1. `Constants.js` exports `RU_ROLES` containing `'inspektur'`, `'inspector'`, and `'tim_ru'`.
2. `Kanban/Index.jsx` recognizes `tim_ru` in `isINS`, `canManageStage`, and `canViewStage`.
3. `JobDetailSheet.jsx` recognizes `tim_ru` in `isInspector` and `isINS`, masking pricing (`canSeeNilai` is false).
4. `DashboardController.php` masks PO/SPK documents for `tim_ru`.
5. `JobController.php` restricts PO/SPK download and authorizes Stage 4 & 5 uploads for `tim_ru`.
6. `InspectorRecommendationService.php` and `DailyDigestService.php` include `tim_ru`.
7. `AppLayout.jsx` and `NotificationBell.jsx` include `tim_ru`.

- [ ] **Step 2: Run test to verify failure**
Run: `node --test tests/tim_ru_comprehensive_parity.test.js`
Expected: FAIL on missing `tim_ru` assertions.

---

### Task 2: Standardize Frontend Role Definitions & Kanban Access

**Files:**
- Modify: `dnp-rework/resources/js/Constants.js:25-38`
- Modify: `dnp-rework/resources/js/Pages/Kanban/Index.jsx:10-25, 105-130`
- Modify: `dnp-rework/resources/js/Components/NotificationBell.jsx:8`
- Modify: `dnp-rework/resources/js/Layouts/AppLayout.jsx:95`

**Interfaces:**
- Consumes: `auth.user.role`
- Produces: Normalized `isINS` evaluation supporting `tim_ru`.

- [ ] **Step 1: Export `RU_ROLES` and `isRURole` in `Constants.js`**
Add:
```javascript
export const RU_ROLES = ['inspektur', 'inspector', 'tim_ru'];
export const isRURole = (role) => RU_ROLES.includes(String(role || '').toLowerCase());
```

- [ ] **Step 2: Update `Kanban/Index.jsx`**
In `Kanban/Index.jsx`:
```javascript
const isINS = ['inspektur', 'inspector', 'tim_ru'].includes(auth?.user?.role);
```
In `canManageStage`:
```javascript
if (['inspektur', 'inspector', 'tim_ru'].includes(auth.user?.role) && [4, 5].includes(sId)) return true;
```
In `canViewStage`:
```javascript
if (['inspektur', 'inspector', 'tim_ru'].includes(auth.user?.role)) return true;
```

- [ ] **Step 3: Update `NotificationBell.jsx` & `AppLayout.jsx`**
In `NotificationBell.jsx:8`:
```javascript
const isINS = ['inspektur', 'inspector', 'tim_ru'].includes(auth?.user?.role);
```
In `AppLayout.jsx:95`:
```javascript
{ href: '/inventory', label: 'Alat & SKP', icon: Boxes, roles: ['admin', 'manager', 'inspektur', 'inspector', 'tim_ru', 'superadmin'] },
```

---

### Task 3: Secure JobDetailSheet & Backend Controllers for `tim_ru`

**Files:**
- Modify: `dnp-rework/resources/js/Components/JobDetailSheet.jsx:705-720`
- Modify: `dnp-rework/app/Http/Controllers/DashboardController.php:18`
- Modify: `dnp-rework/app/Http/Controllers/JobController.php:1214, 1287`
- Modify: `dnp-rework/app/Services/InspectorRecommendationService.php:26`
- Modify: `dnp-rework/app/Services/DailyDigestService.php:83`

**Interfaces:**
- Consumes: User model and authentication context
- Produces: Robust permission gating and confidentiality masking for `tim_ru`.

- [ ] **Step 1: Update `JobDetailSheet.jsx`**
Lines 705 and 716:
```javascript
const isInspector = ['inspektur', 'inspector', 'tim_ru'].includes(user?.role);
...
const isINS = ['inspektur', 'inspector', 'tim_ru'].includes(user?.role);
const canSeeNilai = !isINS;
```

- [ ] **Step 2: Update `DashboardController.php`**
Line 18:
```php
$isIns = $user && in_array($user->role, ['inspektur', 'inspector', 'tim_ru']);
```

- [ ] **Step 3: Update `JobController.php`**
Line 1214:
```php
$isInspector = in_array($user->role, ['inspektur', 'inspector', 'tim_ru'])
    || $job->inspectors()->where('users.id', $user->id)->exists()
    || (int)$job->report_writer_id === (int)$user->id;
```
Line 1287:
```php
$isIns = $user && in_array($user->role, ['inspektur', 'inspector', 'tim_ru']);
```

- [ ] **Step 4: Update Backend Services**
In `InspectorRecommendationService.php:26`:
```php
$query->whereIn('role', ['inspektur', 'inspector', 'tim_ru', 'manager'])
```
In `DailyDigestService.php:83`:
```php
if (in_array($role, ['inspektur', 'inspector', 'tim_ru'])) {
```

---

### Task 4: Verification, Test Runner & Build

**Files:**
- Test: All tests in `tests/`
- Build: `npm run build`

- [ ] **Step 1: Run automated tests**
Run: `node --test tests/tim_ru_comprehensive_parity.test.js`
Run: `node --test tests/*.test.js`
Expected: All tests PASS with 0 failures.

- [ ] **Step 2: Run production build**
Run: `npm run build`
Expected: Build compiles successfully with 0 errors.
