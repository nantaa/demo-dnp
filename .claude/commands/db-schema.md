# /db-schema — Database Schema & Migration Design Command

## Purpose
Design relational database schemas, tables, relationships, indexes, constraints, and migration strategies.

## Phase
**Plan** (Part of the Planning Phase)

## When to Use
- Adding or restructuring database entities (e.g. `jobs`, `units`, `inspection_events`, `inspection_units`, `lhpps`, `baps`, `batches`, `batch_units`, `payment_verifications`).
- Planning schema migrations without data loss or downtime.
- Optimizing table indexes, foreign keys, and query performance.

## Workflow & Guidelines
1. **Entity Relationship Modeling**:
   - Define tables, primary keys (UUID vs Auto-increment), and foreign keys with cascading or restrict rules.
   - Enforce proper normalization and define pivot/join tables for many-to-many relationships.
2. **Column Definitions & Types**:
   - Choose explicit column types (e.g. `string`, `text`, `integer`, `date`, `datetime`, `decimal`, `enum` or string with check constraint).
   - Define defaults, nullable flags, and uniqueness constraints.
3. **Indexes & Query Optimization**:
   - Add single and compound indexes for frequently filtered or joined columns (e.g., `[job_id, current_stage]`, `[batch_id, unit_id]`).
4. **Migration Strategy**:
   - Write reversible Laravel migrations (`up()` and `down()`).
   - For existing data, write safe data migration or backfill scripts.
   - Update model relationships (`hasMany`, `belongsTo`, `belongsToMany`) and factories/seeders.
