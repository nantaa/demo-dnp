# /performance — Performance Review & Profiling Command

## Purpose
Analyze and optimize backend queries, database indexing, frontend bundle size, rendering performance, and network payload efficiency.

## Phase
**Review** (Part of the Review Phase)

## When to Use
- Evaluating performance of list views, Kanban boards, and complex dashboard queries.
- Auditing database queries for N+1 problems or missing indexes.
- Profiling large datasets (e.g. Jobs with 100+ Units, historical LHPP records, Batch tracking).

## Workflow & Guidelines
1. **Database Query Optimization**:
   - Detect N+1 query problems in Eloquent relationships using eager loading (`with(['units', 'batches', 'latestLhpp'])`).
   - Audit database execution plans (`EXPLAIN`) on slow queries.
   - Verify composite indexes exist for multi-column filters (e.g. `job_id`, `current_stage`, `created_at`).
2. **Aggregations & Computed Fields**:
   - Ensure rollup calculations (e.g., `closed_unit_count`, `job_status`, `durasi_proses_suket`) are computed efficiently using SQL subqueries or database triggers rather than loading thousands of models into memory.
3. **Frontend Rendering & Bundle Size**:
   - Avoid unnecessary re-renders in large lists/Kanban boards using React memoization (`useMemo`, `useCallback`, `React.memo`).
   - Implement pagination or virtualization for very large unit/job lists.
   - Profile Vite build chunks with bundle analyzers.
4. **Caching Strategy**:
   - Cache static lookup tables (categories, locations, standard checklist items) using Redis or file cache.
   - Invalidate cache accurately on model change events.
