# Authorization Model Context (Supabase + Static Frontend)

## Objective

Implement **per-dashboard authorization** on a static site (GitHub Pages) using **Supabase as the source of truth**, while enforcing access control in the frontend.

Authentication (email OTP / TOTP / magic link) is already implemented and **out of scope** for this document.

---

## 1. Database Schema (Authorization Source of Truth)

### Table: `public.dashboard_access`

This table defines **which authenticated user may access which dashboard**, optionally with expiration.

```sql
create table public.dashboard_access (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  dashboard_id text not null,
  expires_at timestamptz,
  constraint dashboard_access_pkey primary key (id),
  constraint dashboard_access_user_fk
    foreign key (user_id)
    references auth.users (id)
    on delete cascade
);
```

### Column semantics

| Column | Description |
|------|------------|
| user_id | Supabase Auth user UUID |
| dashboard_id | Logical dashboard identifier |
| expires_at | Expiration timestamp (NULL = no expiration) |

---

## 2. Row Level Security (RLS)

### Enable RLS

```sql
alter table public.dashboard_access enable row level security;
```

### SELECT Policy

```sql
create policy "DashboardToUser"
on public.dashboard_access
for select
to authenticated
using (
  auth.uid() = user_id
  and (expires_at is null or expires_at > now())
);
```

---

## 3. Assigning Dashboards

```sql
insert into public.dashboard_access (user_id, dashboard_id, expires_at)
values ('USER_UUID', 'threat-map-v2', null);
```

---

## 4. Frontend Authorization Example

```js
async function loadAuthorization(supabase) {
  const { data } = await supabase
    .from('dashboard_access')
    .select('dashboard_id')

  return data.map(d => d.dashboard_id)
}
```

---

## Summary

Authorization is enforced by Supabase RLS.
Frontend must explicitly render only authorized dashboards.



## LOGICAL FLOW


Dashboard Authentication & Authorization Logic (Conceptual Overview)

This system implements a strict separation between authentication and authorization, using Supabase as the control plane and a static frontend (GitHub Pages) as the delivery layer.

The design is intentionally simple, explicit, and secure by default.

1. Identity and Authentication

Users do not exist beforehand in the business database.

User identity is created and managed exclusively by Supabase Auth.

When a user authenticates (email OTP / TOTP / non-magic-link flow):

Supabase automatically creates a record in auth.users

A globally unique, immutable UUID is assigned to the user

This UUID is the only valid identifier for a user across the system.

No user records are manually created in application tables.

2. What a Dashboard Is

A dashboard is not a Supabase-native entity.

Supabase has no knowledge of dashboards as concepts or resources.

A dashboard is a logical resource defined entirely by the frontend.

Each dashboard is identified by a stable string identifier (dashboard_id), for example:

a route slug

a logical name

a frontend catalog key

The system does not auto-discover or dynamically generate dashboards.

3. Authorization Model

Authorization is expressed as an explicit relationship between:

a user (user_id, from auth.users.id)

a dashboard (dashboard_id, defined by the frontend)

This relationship is stored in a dedicated table (e.g. dashboard_access).

Each row represents:

“This user is allowed to access this specific dashboard (optionally until a given expiration).”

There are:

no implicit permissions

no global roles

no default access

All access is opt-in and explicit.

4. Role of the Database

The database is the single source of truth for authorization.

Row Level Security (RLS) policies ensure:

users can only see their own dashboard assignments

expired access is automatically rejected

dashboards assigned to other users are not enumerable

The database does not render UI or decide UX — it only enforces access rules.

Authorization decisions are enforced server-side, not in JavaScript.

5. Role of the Frontend

The frontend is responsible for:

triggering authentication

querying which dashboards the authenticated user is allowed to access

rendering only authorized dashboards

blocking navigation to unauthorized dashboards

The frontend never decides permissions.

It strictly consumes authorization data returned by the database.

If a dashboard is not explicitly authorized, it must not be rendered or accessible.

6. End-to-End Access Flow

The user opens the static site

The user authenticates via Supabase Auth

Supabase validates identity and issues a session

The frontend queries the database for authorized dashboards

RLS policies filter results by user and expiration

Only permitted dashboards are returned

The frontend renders exclusively those dashboards

At no point does authentication alone grant access to dashboards.

7. Assigning and Revoking Access

Dashboard access is managed outside the user’s runtime flow:

via admin SQL

scripts

or an internal management UI

Granting access means inserting a user–dashboard relationship.

Revoking access means deleting or expiring that relationship.

Changes take effect immediately on the next request.

Users cannot self-assign dashboards.

8. Core Design Principles

Authentication is not authorization

Nothing is accessible by default

All access is explicit and auditable

Security does not rely on frontend trust

Static hosting does not reduce security guarantees

Conclusion

This architecture implements a resource-based authorization model that is minimal, deterministic, and compatible with static deployments.

Supabase is responsible for identity and access control enforcement.
The frontend acts as a constrained execution layer that only presents what is explicitly allowed.

This model is simple to reason about, easy to audit, and scales cleanly as dashboards or users grow.