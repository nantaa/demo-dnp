# /api-design — API & Contract Design Command

## Purpose
Design robust API endpoints, HTTP protocols, Inertia.js route contracts, request validation schemas, and response formats.

## Phase
**Plan** (Part of the Planning Phase)

## When to Use
- Adding or modifying routes, controllers, and frontend-backend communication contracts.
- Defining payload validation rules and error responses.
- Structuring Inertia props and JSON response shapes.

## Workflow & Guidelines
1. **Define Endpoints & Methods**:
   - Follow RESTful conventions where applicable: `GET`, `POST`, `PUT`/`PATCH`, `DELETE`.
   - Identify route names, URL patterns, and controller action mappings (e.g. `JobController@updateUnitStatus`, `BatchController@store`).
2. **Specify Request Payloads & Validation Rules**:
   - List required vs optional fields, types, formats, enum constraints, and custom validation rules (e.g., `FormRequest` classes in Laravel).
3. **Specify Response Contracts**:
   - Success payloads: HTTP status codes (200, 201, 204), Inertia page props, flash messages, redirect destinations.
   - Error payloads: Validation error structures (422), forbidden actions (403), not found (404), conflict (409).
4. **Enforce Authorization & Role Access**:
   - Declare required roles/permissions per endpoint (e.g., Marketing for Stage 1/11, Finance for 10/11c, Admin for 2/3/5/7/8/9, INS for 4).
   - Enforce data masking policies (e.g. Price masking for Admin).
