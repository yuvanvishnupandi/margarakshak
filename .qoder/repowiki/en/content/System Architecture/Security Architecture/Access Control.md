# Access Control

<cite>
**Referenced Files in This Document**
- [backend/middleware/auth.js](file://backend/middleware/auth.js)
- [backend/routes/auth.js](file://backend/routes/auth.js)
- [backend/routes/challans.js](file://backend/routes/challans.js)
- [backend/routes/police.js](file://backend/routes/police.js)
- [backend/db.js](file://backend/db.js)
- [frontend/src/App.jsx](file://frontend/src/App.jsx)
- [frontend/src/pages/Login.jsx](file://frontend/src/pages/Login.jsx)
- [frontend/src/pages/CitizenDashboard.jsx](file://frontend/src/pages/CitizenDashboard.jsx)
- [frontend/src/pages/PoliceCommand.jsx](file://frontend/src/pages/PoliceCommand.jsx)
- [db/schema.sql](file://db/schema.sql)
- [db/stored_procedure_process_report.sql](file://db/stored_procedure_process_report.sql)
- [db/database_triggers.sql](file://db/database_triggers.sql)
- [db/seed_demo_accounts.sql](file://db/seed_demo_accounts.sql)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document provides comprehensive documentation for the role-based access control (RBAC) system in the Traffic Violation Management System. It explains the citizen and police role definitions, permission matrices, and enforcement mechanisms across backend middleware, route protection, and frontend conditional rendering. It also covers session management, security boundaries, privilege escalation prevention, audit trails, and practical guidance for extending the system to support fine-grained permissions.

## Project Structure
The RBAC system spans three layers:
- Backend middleware and routes enforce authentication and role checks.
- Database schema and stored procedures enforce data-level constraints and auditability.
- Frontend routes and components conditionally render UI based on user roles.

```mermaid
graph TB
subgraph "Frontend"
FE_App["App.jsx<br/>Route protection by role"]
FE_Login["Login.jsx<br/>Citizen login flow"]
FE_CitizenDash["CitizenDashboard.jsx<br/>Role-gated data access"]
FE_PoliceDash["PoliceCommand.jsx<br/>Role-gated dashboards"]
end
subgraph "Backend"
MW_Auth["middleware/auth.js<br/>JWT auth + role guards"]
RT_Auth["routes/auth.js<br/>Login + /me"]
RT_Challans["routes/challans.js<br/>Citizen-only endpoints"]
RT_Police["routes/police.js<br/>Police-only endpoints"]
DB_Conn["db.js<br/>MySQL pool"]
end
subgraph "Database"
Schema["schema.sql<br/>Tables, views, triggers"]
Triggers["database_triggers.sql<br/>Trust score automation"]
Proc["stored_procedure_process_report.sql<br/>ACID procedures"]
end
FE_App --> FE_Login
FE_App --> FE_CitizenDash
FE_App --> FE_PoliceDash
FE_CitizenDash --> RT_Challans
FE_PoliceDash --> RT_Police
RT_Auth --> DB_Conn
RT_Challans --> DB_Conn
RT_Police --> DB_Conn
DB_Conn --> Schema
Schema --> Triggers
Schema --> Proc
```

**Diagram sources**
- [frontend/src/App.jsx:1-274](file://frontend/src/App.jsx#L1-L274)
- [frontend/src/pages/Login.jsx:1-186](file://frontend/src/pages/Login.jsx#L1-L186)
- [frontend/src/pages/CitizenDashboard.jsx:1-393](file://frontend/src/pages/CitizenDashboard.jsx#L1-L393)
- [frontend/src/pages/PoliceCommand.jsx:1-207](file://frontend/src/pages/PoliceCommand.jsx#L1-L207)
- [backend/middleware/auth.js:1-37](file://backend/middleware/auth.js#L1-L37)
- [backend/routes/auth.js:1-117](file://backend/routes/auth.js#L1-L117)
- [backend/routes/challans.js:1-101](file://backend/routes/challans.js#L1-L101)
- [backend/routes/police.js:1-109](file://backend/routes/police.js#L1-L109)
- [backend/db.js:1-26](file://backend/db.js#L1-L26)
- [db/schema.sql:1-942](file://db/schema.sql#L1-L942)
- [db/database_triggers.sql:1-48](file://db/database_triggers.sql#L1-L48)
- [db/stored_procedure_process_report.sql:1-115](file://db/stored_procedure_process_report.sql#L1-L115)

**Section sources**
- [frontend/src/App.jsx:1-274](file://frontend/src/App.jsx#L1-L274)
- [backend/middleware/auth.js:1-37](file://backend/middleware/auth.js#L1-L37)
- [backend/routes/auth.js:1-117](file://backend/routes/auth.js#L1-L117)
- [backend/routes/challans.js:1-101](file://backend/routes/challans.js#L1-L101)
- [backend/routes/police.js:1-109](file://backend/routes/police.js#L1-L109)
- [backend/db.js:1-26](file://backend/db.js#L1-L26)
- [db/schema.sql:1-942](file://db/schema.sql#L1-L942)

## Core Components
- Authentication middleware validates JWT and attaches user identity to requests.
- Role guards restrict access to routes based on user role.
- Route handlers enforce ownership and status constraints.
- Database triggers and stored procedures enforce trust scoring, audit trails, and transactional integrity.
- Frontend routes conditionally render content and protect navigation by role.

Key RBAC artifacts:
- Roles: citizen, police.
- Token payload includes id, email, name, role.
- Middleware enforces role gates for protected routes.
- Ownership checks ensure users act only on their data.
- Database-level constraints and triggers prevent privilege escalation and maintain auditability.

**Section sources**
- [backend/middleware/auth.js:1-37](file://backend/middleware/auth.js#L1-L37)
- [backend/routes/auth.js:1-117](file://backend/routes/auth.js#L1-L117)
- [backend/routes/challans.js:1-101](file://backend/routes/challans.js#L1-L101)
- [backend/routes/police.js:1-109](file://backend/routes/police.js#L1-L109)
- [db/schema.sql:1-942](file://db/schema.sql#L1-L942)
- [db/database_triggers.sql:1-48](file://db/database_triggers.sql#L1-L48)
- [db/stored_procedure_process_report.sql:1-115](file://db/stored_procedure_process_report.sql#L1-L115)

## Architecture Overview
The RBAC architecture combines JWT-based session management with layered enforcement:
- Transport-level: Authorization header carries bearer token.
- Application-level: Middleware decodes token and enforces role gates.
- Route-level: Controllers apply ownership and status checks.
- Data-level: Triggers and stored procedures enforce business rules and audit trails.

```mermaid
sequenceDiagram
participant Client as "Client"
participant AuthRT as "routes/auth.js"
participant MW as "middleware/auth.js"
participant ChallansRT as "routes/challans.js"
participant PoliceRT as "routes/police.js"
participant DB as "db.js + schema.sql"
Client->>AuthRT : POST /api/auth/login (email, password, role)
AuthRT-->>Client : {token, user}
Client->>ChallansRT : GET /api/challans/my (Authorization : Bearer <token>)
ChallansRT->>MW : authenticateToken
MW-->>ChallansRT : req.user (id, role)
ChallansRT->>MW : requireCitizen
MW-->>ChallansRT : next()
Client->>PoliceRT : PATCH /api/police/verify/ : id (Authorization : Bearer <token>)
PoliceRT->>MW : authenticateToken
MW-->>PoliceRT : req.user (id, role)
PoliceRT->>MW : requirePolice
MW-->>PoliceRT : next()
PoliceRT->>DB : Update REPORTS + CHALLANS (ACID)
```

**Diagram sources**
- [backend/routes/auth.js:1-117](file://backend/routes/auth.js#L1-L117)
- [backend/middleware/auth.js:1-37](file://backend/middleware/auth.js#L1-L37)
- [backend/routes/challans.js:1-101](file://backend/routes/challans.js#L1-L101)
- [backend/routes/police.js:1-109](file://backend/routes/police.js#L1-L109)
- [backend/db.js:1-26](file://backend/db.js#L1-L26)
- [db/schema.sql:1-942](file://db/schema.sql#L1-L942)

## Detailed Component Analysis

### Backend Middleware: JWT and Role Guards
- authenticateToken extracts Bearer token, verifies signature, and attaches decoded user to req.user.
- requireCitizen and requirePolice compare req.user.role to enforced role and short-circuit with 403 if mismatch.
- JWT_SECRET is loaded from environment; tokens expire after 8 hours.

```mermaid
flowchart TD
Start(["Incoming Request"]) --> HasAuth["Has Authorization header?"]
HasAuth --> |No| Deny401["401 No token provided"]
HasAuth --> |Yes| Verify["jwt.verify(token, JWT_SECRET)"]
Verify --> |Invalid/expired| Deny403["403 Invalid or expired token"]
Verify --> |Valid| Attach["Attach decoded user to req.user"]
Attach --> NextGate{"Route requires role?"}
NextGate --> |Citizen gate| CheckCitizen{"req.user.role == 'citizen'?"}
NextGate --> |Police gate| CheckPolice{"req.user.role == 'police'?"}
CheckCitizen --> |No| Deny403C["403 Citizen access required"]
CheckCitizen --> |Yes| Proceed["next()"]
CheckPolice --> |No| Deny403P["403 Police access required"]
CheckPolice --> |Yes| Proceed
```

**Diagram sources**
- [backend/middleware/auth.js:1-37](file://backend/middleware/auth.js#L1-L37)

**Section sources**
- [backend/middleware/auth.js:1-37](file://backend/middleware/auth.js#L1-L37)

### Authentication Flow: Login and User Info
- POST /api/auth/login accepts email, password, and role, validates credentials against respective tables, and issues a signed JWT with id, email, name, role.
- GET /api/auth/me verifies the token and returns user profile based on role.

```mermaid
sequenceDiagram
participant Client as "Client"
participant AuthRT as "routes/auth.js"
participant DB as "db.js + schema.sql"
Client->>AuthRT : POST /api/auth/login {email, password, role}
AuthRT->>DB : SELECT role-specific table by email
DB-->>AuthRT : User row or none
AuthRT->>AuthRT : Compare password_hash
AuthRT->>AuthRT : Sign JWT {id, email, name, role}
AuthRT-->>Client : {token, user}
Client->>AuthRT : GET /api/auth/me (Bearer token)
AuthRT->>DB : SELECT role-specific profile
DB-->>AuthRT : Profile data
AuthRT-->>Client : {profile, role}
```

**Diagram sources**
- [backend/routes/auth.js:1-117](file://backend/routes/auth.js#L1-L117)
- [backend/db.js:1-26](file://backend/db.js#L1-L26)
- [db/schema.sql:1-942](file://db/schema.sql#L1-L942)

**Section sources**
- [backend/routes/auth.js:1-117](file://backend/routes/auth.js#L1-L117)
- [backend/db.js:1-26](file://backend/db.js#L1-L26)
- [db/schema.sql:1-942](file://db/schema.sql#L1-L942)

### Citizen Access Control: Challans and Payments
- GET /api/challans/my enforces authenticateToken + requireCitizen and filters by req.user.id.
- POST /api/challans/pay enforces authenticateToken + requireCitizen, performs row-level locking, verifies ownership, and updates payment status atomically.

```mermaid
sequenceDiagram
participant Client as "Citizen Client"
participant ChallansRT as "routes/challans.js"
participant MW as "middleware/auth.js"
participant DB as "db.js + schema.sql"
Client->>ChallansRT : GET /api/challans/my
ChallansRT->>MW : authenticateToken
MW-->>ChallansRT : req.user
ChallansRT->>MW : requireCitizen
MW-->>ChallansRT : next()
ChallansRT->>DB : SELECT CHALLANS WHERE citizen_id = req.user.id
DB-->>ChallansRT : Rows
ChallansRT-->>Client : Challans
Client->>ChallansRT : POST /api/challans/pay {challan_id}
ChallansRT->>MW : authenticateToken + requireCitizen
MW-->>ChallansRT : next()
ChallansRT->>DB : SELECT FOR UPDATE CHALLANS WHERE challan_id = ?
DB-->>ChallansRT : Locked row
ChallansRT->>ChallansRT : Verify citizen_id matches req.user.id
ChallansRT->>DB : UPDATE CHALLANS SET status='Paid'
DB-->>ChallansRT : OK
ChallansRT-->>Client : Success
```

**Diagram sources**
- [backend/routes/challans.js:1-101](file://backend/routes/challans.js#L1-L101)
- [backend/middleware/auth.js:1-37](file://backend/middleware/auth.js#L1-L37)
- [backend/db.js:1-26](file://backend/db.js#L1-L26)
- [db/schema.sql:1-942](file://db/schema.sql#L1-L942)

**Section sources**
- [backend/routes/challans.js:1-101](file://backend/routes/challans.js#L1-L101)
- [backend/middleware/auth.js:1-37](file://backend/middleware/auth.js#L1-L37)
- [backend/db.js:1-26](file://backend/db.js#L1-L26)
- [db/schema.sql:1-942](file://db/schema.sql#L1-L942)

### Police Access Control: Reports and Challan Issuance
- GET /api/police/pending enforces authenticateToken + requirePolice and returns a dashboard view of pending reports.
- PATCH /api/police/verify/:id enforces authenticateToken + requirePolice, validates rule_id, and issues a challan via stored procedure with full transaction safety.
- PATCH /api/police/reject/:id enforces authenticateToken + requirePolice and rejects a report.

```mermaid
sequenceDiagram
participant Client as "Police Client"
participant PoliceRT as "routes/police.js"
participant MW as "middleware/auth.js"
participant DB as "db.js + schema.sql"
participant Proc as "stored_procedure_process_report.sql"
Client->>PoliceRT : GET /api/police/pending
PoliceRT->>MW : authenticateToken + requirePolice
MW-->>PoliceRT : next()
PoliceRT->>DB : SELECT Pending_Reports_Dashboard
DB-->>PoliceRT : Rows
PoliceRT-->>Client : Pending reports
Client->>PoliceRT : PATCH /api/police/verify/ : id {rule_id}
PoliceRT->>MW : authenticateToken + requirePolice
MW-->>PoliceRT : next()
PoliceRT->>Proc : CALL ProcessReportAndIssueChallan(...)
Proc-->>PoliceRT : {result, event_id, challan_id}
PoliceRT-->>Client : Success
Client->>PoliceRT : PATCH /api/police/reject/ : id
PoliceRT->>MW : authenticateToken + requirePolice
MW-->>PoliceRT : next()
PoliceRT->>DB : UPDATE REPORTS SET status='Rejected'
DB-->>PoliceRT : OK
PoliceRT-->>Client : Success
```

**Diagram sources**
- [backend/routes/police.js:1-109](file://backend/routes/police.js#L1-L109)
- [backend/middleware/auth.js:1-37](file://backend/middleware/auth.js#L1-L37)
- [backend/db.js:1-26](file://backend/db.js#L1-L26)
- [db/stored_procedure_process_report.sql:1-115](file://db/stored_procedure_process_report.sql#L1-L115)

**Section sources**
- [backend/routes/police.js:1-109](file://backend/routes/police.js#L1-L109)
- [backend/middleware/auth.js:1-37](file://backend/middleware/auth.js#L1-L37)
- [backend/db.js:1-26](file://backend/db.js#L1-L26)
- [db/stored_procedure_process_report.sql:1-115](file://db/stored_procedure_process_report.sql#L1-L115)

### Frontend Access Control: Conditional Rendering and Navigation
- App routes enforce role-based visibility and redirects:
  - Unauthenticated users are redirected to login.
  - Authenticated users are routed to appropriate dashboards.
  - Role-gated routes (e.g., /dashboard for citizens, /police for officers) are protected.
- Login page posts to the backend login endpoint and persists token and user profile in localStorage.
- Dashboard pages fetch role-specific data and render accordingly.

```mermaid
flowchart TD
Start(["App Mount"]) --> CheckAuth["localStorage has token + user?"]
CheckAuth --> |No| RedirectHome["Redirect to '/'"]
CheckAuth --> |Yes| SetUser["Set user state"]
SetUser --> HasRole{"user.role"}
HasRole --> |citizen| RouteCit["Render citizen routes"]
HasRole --> |police| RoutePol["Render police routes"]
RouteCit --> DashCit["CitizenDashboard.jsx"]
RoutePol --> DashPol["PoliceCommand.jsx"]
```

**Diagram sources**
- [frontend/src/App.jsx:1-274](file://frontend/src/App.jsx#L1-L274)
- [frontend/src/pages/Login.jsx:1-186](file://frontend/src/pages/Login.jsx#L1-L186)
- [frontend/src/pages/CitizenDashboard.jsx:1-393](file://frontend/src/pages/CitizenDashboard.jsx#L1-L393)
- [frontend/src/pages/PoliceCommand.jsx:1-207](file://frontend/src/pages/PoliceCommand.jsx#L1-L207)

**Section sources**
- [frontend/src/App.jsx:1-274](file://frontend/src/App.jsx#L1-L274)
- [frontend/src/pages/Login.jsx:1-186](file://frontend/src/pages/Login.jsx#L1-L186)
- [frontend/src/pages/CitizenDashboard.jsx:1-393](file://frontend/src/pages/CitizenDashboard.jsx#L1-L393)
- [frontend/src/pages/PoliceCommand.jsx:1-207](file://frontend/src/pages/PoliceCommand.jsx#L1-L207)

### Database-Level Enforcement: Triggers, Views, and Stored Procedures
- Triggers automatically adjust citizen trust scores on report status changes.
- Views provide role-specific dashboards (e.g., Pending_Reports_Dashboard).
- Stored procedures encapsulate ACID transactions for report processing and challan issuance, preventing race conditions and ensuring audit trails.

```mermaid
erDiagram
REPORTS {
int report_id PK
int citizen_id FK
varchar plate_no
enum status
datetime reviewed_at
}
CITIZENS {
int citizen_id PK
int trust_score
int reward_points
}
CHALLANS {
int challan_id PK
int event_id FK
int citizen_id FK
decimal total_amount
enum payment_status
}
REPORTS }o--|| CITIZENS : "reported_by"
CHALLANS }o--|| CITIZENS : "issued_to"
```

**Diagram sources**
- [db/schema.sql:1-942](file://db/schema.sql#L1-L942)
- [db/database_triggers.sql:1-48](file://db/database_triggers.sql#L1-L48)
- [db/stored_procedure_process_report.sql:1-115](file://db/stored_procedure_process_report.sql#L1-L115)

**Section sources**
- [db/schema.sql:1-942](file://db/schema.sql#L1-L942)
- [db/database_triggers.sql:1-48](file://db/database_triggers.sql#L1-L48)
- [db/stored_procedure_process_report.sql:1-115](file://db/stored_procedure_process_report.sql#L1-L115)

## Dependency Analysis
- Routes depend on middleware for authentication and role enforcement.
- Route handlers depend on the database pool for data access.
- Database operations rely on schema, triggers, and stored procedures for consistency and auditability.
- Frontend depends on backend endpoints and local storage for session persistence.

```mermaid
graph LR
FE_App["App.jsx"] --> FE_Login["Login.jsx"]
FE_App --> FE_CitizenDash["CitizenDashboard.jsx"]
FE_App --> FE_PoliceDash["PoliceCommand.jsx"]
FE_CitizenDash --> RT_Challans["routes/challans.js"]
FE_PoliceDash --> RT_Police["routes/police.js"]
RT_Auth["routes/auth.js"] --> MW_Auth["middleware/auth.js"]
RT_Challans --> MW_Auth
RT_Police --> MW_Auth
RT_Auth --> DB["db.js"]
RT_Challans --> DB
RT_Police --> DB
DB --> Schema["schema.sql"]
Schema --> Triggers["database_triggers.sql"]
Schema --> Proc["stored_procedure_process_report.sql"]
```

**Diagram sources**
- [frontend/src/App.jsx:1-274](file://frontend/src/App.jsx#L1-L274)
- [frontend/src/pages/Login.jsx:1-186](file://frontend/src/pages/Login.jsx#L1-L186)
- [frontend/src/pages/CitizenDashboard.jsx:1-393](file://frontend/src/pages/CitizenDashboard.jsx#L1-L393)
- [frontend/src/pages/PoliceCommand.jsx:1-207](file://frontend/src/pages/PoliceCommand.jsx#L1-L207)
- [backend/routes/auth.js:1-117](file://backend/routes/auth.js#L1-L117)
- [backend/routes/challans.js:1-101](file://backend/routes/challans.js#L1-L101)
- [backend/routes/police.js:1-109](file://backend/routes/police.js#L1-L109)
- [backend/middleware/auth.js:1-37](file://backend/middleware/auth.js#L1-L37)
- [backend/db.js:1-26](file://backend/db.js#L1-L26)
- [db/schema.sql:1-942](file://db/schema.sql#L1-L942)
- [db/database_triggers.sql:1-48](file://db/database_triggers.sql#L1-L48)
- [db/stored_procedure_process_report.sql:1-115](file://db/stored_procedure_process_report.sql#L1-L115)

**Section sources**
- [backend/middleware/auth.js:1-37](file://backend/middleware/auth.js#L1-L37)
- [backend/routes/auth.js:1-117](file://backend/routes/auth.js#L1-L117)
- [backend/routes/challans.js:1-101](file://backend/routes/challans.js#L1-L101)
- [backend/routes/police.js:1-109](file://backend/routes/police.js#L1-L109)
- [backend/db.js:1-26](file://backend/db.js#L1-L26)
- [db/schema.sql:1-942](file://db/schema.sql#L1-L942)
- [db/database_triggers.sql:1-48](file://db/database_triggers.sql#L1-L48)
- [db/stored_procedure_process_report.sql:1-115](file://db/stored_procedure_process_report.sql#L1-L115)

## Performance Considerations
- JWT verification is lightweight; ensure minimal middleware overhead.
- Use database indexes on foreign keys and frequently filtered columns (e.g., citizen_id, status).
- Stored procedures and triggers centralize business logic and reduce client-side branching.
- Row-level locks in payment and report processing minimize contention while preserving correctness.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common access control issues and resolutions:
- 401 Access denied. No token provided:
  - Ensure Authorization header is present and formatted as Bearer <token>.
  - Verify frontend stores token in localStorage after login and attaches it to subsequent requests.
- 403 Invalid or expired token:
  - Confirm JWT_SECRET consistency and token expiration window.
  - Re-authenticate the user to obtain a fresh token.
- 403 Citizen access required / 403 Police access required:
  - Confirm login role matches the route’s required role.
  - Check that the token payload includes the correct role field.
- 403 You are not authorized to pay this challan:
  - Verify ownership check in payment route matches req.user.id with the challan’s citizen_id.
- 404 Report not found or already processed:
  - Ensure report status is Pending before attempting verification or rejection.
- Trust score not updating:
  - Confirm triggers fire on REPORTS status transitions and that the status change path is correct.

**Section sources**
- [backend/middleware/auth.js:1-37](file://backend/middleware/auth.js#L1-L37)
- [backend/routes/challans.js:1-101](file://backend/routes/challans.js#L1-L101)
- [backend/routes/police.js:1-109](file://backend/routes/police.js#L1-L109)
- [db/database_triggers.sql:1-48](file://db/database_triggers.sql#L1-L48)

## Conclusion
The system implements a robust RBAC model combining JWT-based session management, middleware role gates, route-level ownership checks, and database-level triggers and stored procedures. Frontend route protection ensures users only access permitted areas. Together, these layers prevent privilege escalation, maintain auditability, and provide a secure foundation for future extensions.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Permission Matrices
- Citizen
  - Access to own challans and reports.
  - Can pay challans with row-level locking.
  - Cannot access police-only endpoints.
- Police
  - Access to pending reports dashboard.
  - Can verify/reject reports and issue challans via stored procedures.
  - Cannot access citizen-only endpoints.

**Section sources**
- [backend/routes/challans.js:1-101](file://backend/routes/challans.js#L1-L101)
- [backend/routes/police.js:1-109](file://backend/routes/police.js#L1-L109)
- [db/stored_procedure_process_report.sql:1-115](file://db/stored_procedure_process_report.sql#L1-L115)

### Security Boundaries and Audit Trail
- Token-based session boundary separates transport and application layers.
- Database triggers and stored procedures enforce business rules and maintain audit trails.
- Demo seed accounts and schema define baseline entities and constraints.

**Section sources**
- [db/schema.sql:1-942](file://db/schema.sql#L1-L942)
- [db/database_triggers.sql:1-48](file://db/database_triggers.sql#L1-L48)
- [db/stored_procedure_process_report.sql:1-115](file://db/stored_procedure_process_report.sql#L1-L115)
- [db/seed_demo_accounts.sql:1-175](file://db/seed_demo_accounts.sql#L1-L175)

### Extending to Fine-Grained Permissions
Guidelines for extending the RBAC system:
- Introduce permission flags or scopes in the token payload and enforce them in middleware.
- Add resource-level attributes (e.g., department, station) and gate access based on claims.
- Implement policy evaluation functions to combine roles and permissions.
- Centralize permission checks in a shared authorization module.
- Add audit logging for permission decisions and sensitive actions.

[No sources needed since this section provides general guidance]