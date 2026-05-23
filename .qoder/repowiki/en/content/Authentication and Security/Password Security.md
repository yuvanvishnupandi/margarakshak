# Password Security

<cite>
**Referenced Files in This Document**
- [auth.js](file://backend/middleware/auth.js)
- [auth.js](file://backend/routes/auth.js)
- [generate_password_hashes.py](file://scripts/generate_password_hashes.py)
- [schema.sql](file://db/schema.sql)
- [seed_demo_accounts.sql](file://db/seed_demo_accounts.sql)
- [auth.py](file://server/routes/auth.py)
- [Register.jsx](file://frontend/src/pages/Register.jsx)
- [PoliceRegister.jsx](file://frontend/src/pages/PoliceRegister.jsx)
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

## Introduction
This document provides comprehensive guidance for password security in the system, focusing on bcrypt-based password hashing, secure storage, validation during login, and robust protection against common threats such as rainbow table attacks, brute force attempts, and timing attacks. It also documents password strength validation, secure storage practices, and operational controls such as account lockout and audit logging.

## Project Structure
The password security implementation spans three layers:
- Frontend: Client-side password validation and submission
- Backend (Node/Express): JWT-based authentication and bcrypt verification for citizen/police login
- Backend (Python/FastAPI): Password hashing and verification for registration and login flows

```mermaid
graph TB
subgraph "Frontend"
FE_Citizen["Citizen Registration Page"]
FE_Police["Police Registration Page"]
end
subgraph "Backend (Node/Express)"
BE_Routes["/api/auth routes<br/>bcrypt compare, JWT sign"]
BE_MW["Auth Middleware<br/>JWT verify"]
end
subgraph "Backend (FastAPI)"
FA_Routes["/auth routes<br/>bcrypt hash/verify, DB ops"]
end
subgraph "Database"
DB_Schema["Schema with password_hash fields"]
DB_Demo["Seed with bcrypt hashes"]
end
FE_Citizen --> BE_Routes
FE_Police --> BE_Routes
FE_Citizen --> FA_Routes
FE_Police --> FA_Routes
BE_Routes --> DB_Schema
BE_MW --> DB_Schema
FA_Routes --> DB_Schema
DB_Demo --> DB_Schema
```

**Diagram sources**
- [auth.js:1-117](file://backend/routes/auth.js#L1-L117)
- [auth.js:1-37](file://backend/middleware/auth.js#L1-L37)
- [auth.py:1-744](file://server/routes/auth.py#L1-L744)
- [schema.sql:26-82](file://db/schema.sql#L26-L82)
- [seed_demo_accounts.sql:17-107](file://db/seed_demo_accounts.sql#L17-L107)

**Section sources**
- [auth.js:1-117](file://backend/routes/auth.js#L1-L117)
- [auth.js:1-37](file://backend/middleware/auth.js#L1-L37)
- [auth.py:1-744](file://server/routes/auth.py#L1-L744)
- [schema.sql:26-82](file://db/schema.sql#L26-L82)
- [seed_demo_accounts.sql:17-107](file://db/seed_demo_accounts.sql#L17-L107)

## Core Components
- bcrypt password hashing and verification
- Secure JWT-based session tokens
- Database schema storing bcrypt hashes
- Client-side password validation rules
- Demo hash generation for seeding

Key implementation highlights:
- bcrypt hashing with per-password salts and adaptive cost factors
- Constant-time comparison via bcrypt during login
- Secure token issuance with expiration and role scoping
- Strong password requirements enforced at registration
- Demo hash generator to produce bcrypt hashes for seed data

**Section sources**
- [auth.js:1-117](file://backend/routes/auth.js#L1-L117)
- [auth.py:77-98](file://server/routes/auth.py#L77-L98)
- [schema.sql:26-82](file://db/schema.sql#L26-L82)
- [generate_password_hashes.py:1-33](file://scripts/generate_password_hashes.py#L1-L33)
- [seed_demo_accounts.sql:17-107](file://db/seed_demo_accounts.sql#L17-L107)
- [PoliceRegister.jsx:24-31](file://frontend/src/pages/PoliceRegister.jsx#L24-L31)
- [Register.jsx:1-221](file://frontend/src/pages/Register.jsx#L1-L221)

## Architecture Overview
The password lifecycle integrates frontend validation, backend hashing/verification, and secure token issuance.

```mermaid
sequenceDiagram
participant U as "User"
participant FE as "Frontend"
participant BE as "Backend (Node/FastAPI)"
participant DB as "Database"
rect rgb(255,255,255)
Note over U,BE : Registration Flow
U->>FE : Submit form (password, confirm)
FE->>BE : POST /api/auth/citizen/register or /auth/citizen/register
BE->>BE : Validate password match and length
BE->>BE : Hash password with bcrypt (salt + cost)
BE->>DB : INSERT user with password_hash
DB-->>BE : OK
BE-->>FE : Success response
end
rect rgb(255,255,255)
Note over U,BE : Login Flow
U->>FE : Submit email + password
FE->>BE : POST /api/auth/login
BE->>DB : SELECT user by email
DB-->>BE : User with password_hash
BE->>BE : bcrypt.compare(password, hash)
alt Match
BE->>BE : Sign JWT with role and expiry
BE-->>FE : {token, user}
else No match
BE-->>FE : 401 Invalid credentials
end
end
```

**Diagram sources**
- [auth.js:9-76](file://backend/routes/auth.js#L9-L76)
- [auth.py:114-216](file://server/routes/auth.py#L114-L216)
- [schema.sql:26-82](file://db/schema.sql#L26-L82)

## Detailed Component Analysis

### bcrypt Password Hashing and Storage
- Hashing: bcrypt generates a unique salt per password and applies a configurable cost factor. The resulting hash is stored in the database.
- Storage: Two tables store bcrypt hashes:
  - CITIZENS.password_hash
  - POLICE_OFFICERS.password_hash
- Demo seeding: A Python script generates bcrypt hashes for demo accounts and prints them for insertion into seed scripts.

Security benefits:
- Per-password salt prevents rainbow table attacks.
- Cost factor increases computational work for attackers.
- Hashes are stored in the database, not plaintext passwords.

**Section sources**
- [schema.sql:26-82](file://db/schema.sql#L26-L82)
- [generate_password_hashes.py:1-33](file://scripts/generate_password_hashes.py#L1-L33)
- [seed_demo_accounts.sql:17-107](file://db/seed_demo_accounts.sql#L17-L107)

### Login Validation and Token Issuance (Node/Express)
- Endpoint: POST /api/auth/login accepts email, password, and role.
- Lookup: Queries the appropriate table (CITIZENS or POLICE) by email.
- Verification: Compares submitted password with stored bcrypt hash using constant-time comparison.
- Token: On success, issues a signed JWT with role-scoped claims and expiry.

```mermaid
sequenceDiagram
participant C as "Client"
participant R as "Backend Routes"
participant DB as "Database"
participant T as "JWT"
C->>R : POST /api/auth/login {email,password,role}
R->>DB : SELECT * FROM role_table WHERE email=?
DB-->>R : User row with password_hash
R->>R : bcrypt.compare(password, password_hash)
alt Match
R->>T : sign({id,email,name,role}, secret, {expiresIn})
T-->>R : token
R-->>C : {token,user}
else No match
R-->>C : 401 Invalid credentials
end
```

**Diagram sources**
- [auth.js:9-76](file://backend/routes/auth.js#L9-L76)

**Section sources**
- [auth.js:9-76](file://backend/routes/auth.js#L9-L76)

### Login Validation and Token Issuance (FastAPI)
- Endpoints: /auth/citizen/login and /auth/police/login.
- Verification: Uses bcrypt.checkpw for constant-time comparison.
- Token: Creates JWT with role-specific subject and expiry.
- Additional checks: Verifies account status (active) before token issuance.

```mermaid
sequenceDiagram
participant C as "Client"
participant R as "FastAPI Routes"
participant DB as "Database"
participant T as "JWT"
C->>R : POST /auth/{role}/login
R->>DB : SELECT * FROM {role}_table WHERE email=?
DB-->>R : User with password_hash
R->>R : verify_password(password, password_hash)
alt Match and active
R->>T : encode({sub,role,...}, secret, HS256, exp)
T-->>R : token
R-->>C : {access_token,user}
else No match or inactive
R-->>C : 401/403
end
```

**Diagram sources**
- [auth.py:218-293](file://server/routes/auth.py#L218-L293)
- [auth.py:399-476](file://server/routes/auth.py#L399-L476)

**Section sources**
- [auth.py:218-293](file://server/routes/auth.py#L218-L293)
- [auth.py:399-476](file://server/routes/auth.py#L399-L476)

### Password Strength Validation
- Frontend (Police registration): Enforces minimum length and character complexity (uppercase, lowercase, digit).
- Backend (FastAPI registration): Enforces password match and minimum length before hashing.

```mermaid
flowchart TD
Start(["Registration Request"]) --> CheckMatch["Check password == confirm_password"]
CheckMatch --> MatchOK{"Match?"}
MatchOK --> |No| ErrMatch["Reject: passwords do not match"]
MatchOK --> |Yes| CheckLen["Check password length >= threshold"]
CheckLen --> LenOK{"Length OK?"}
LenOK --> |No| ErrLen["Reject: too short"]
LenOK --> |Yes| Hash["Hash with bcrypt"]
Hash --> Store["Insert user with password_hash"]
Store --> Done(["Success"])
ErrMatch --> Done
ErrLen --> Done
```

**Diagram sources**
- [auth.py:114-216](file://server/routes/auth.py#L114-L216)
- [PoliceRegister.jsx:24-31](file://frontend/src/pages/PoliceRegister.jsx#L24-L31)

**Section sources**
- [auth.py:114-216](file://server/routes/auth.py#L114-L216)
- [PoliceRegister.jsx:24-31](file://frontend/src/pages/PoliceRegister.jsx#L24-L31)
- [Register.jsx:1-221](file://frontend/src/pages/Register.jsx#L1-L221)

### Secure Storage Practices
- password_hash fields are VARCHAR sized to accommodate bcrypt output.
- Indexes on email columns optimize lookup performance while maintaining security.
- Demo seed data uses precomputed bcrypt hashes to bootstrap test accounts.

**Section sources**
- [schema.sql:26-82](file://db/schema.sql#L26-L82)
- [seed_demo_accounts.sql:17-107](file://db/seed_demo_accounts.sql#L17-L107)

### Recovery Mechanisms
- No password reset or recovery endpoints are present in the analyzed backend routes.
- Recovery would typically involve out-of-band verification and secure password updates; absent here, potential risk if not addressed elsewhere.

**Section sources**
- [auth.js:1-117](file://backend/routes/auth.js#L1-L117)
- [auth.py:1-744](file://server/routes/auth.py#L1-L744)

### Security Measures Against Common Attacks
- Rainbow table attacks: bcrypt salt per password makes precomputation impractical.
- Brute force attempts: bcrypt cost factor increases CPU time; combined with rate limiting and account lockout (see Recommendations), reduces success probability.
- Timing attacks: bcrypt.compare/checkpw are designed to be constant-time; avoid early exits that leak timing information.

[No sources needed since this section provides general guidance]

## Dependency Analysis
```mermaid
graph LR
FE_Police["PoliceRegister.jsx"] --> |submits| BE_Node["/api/auth routes"]
FE_Citizen["Register.jsx"] --> |submits| BE_Node
FE_Police --> |submits| BE_FastAPI["/auth routes"]
FE_Citizen --> |submits| BE_FastAPI
BE_Node --> DB["CITIZENS/POLICE tables"]
BE_FastAPI --> DB
DB --> Schema["schema.sql"]
Seed["seed_demo_accounts.sql"] --> DB
```

**Diagram sources**
- [auth.js:1-117](file://backend/routes/auth.js#L1-L117)
- [auth.py:1-744](file://server/routes/auth.py#L1-L744)
- [schema.sql:26-82](file://db/schema.sql#L26-L82)
- [seed_demo_accounts.sql:17-107](file://db/seed_demo_accounts.sql#L17-L107)
- [PoliceRegister.jsx:1-346](file://frontend/src/pages/PoliceRegister.jsx#L1-L346)
- [Register.jsx:1-221](file://frontend/src/pages/Register.jsx#L1-L221)

**Section sources**
- [auth.js:1-117](file://backend/routes/auth.js#L1-L117)
- [auth.py:1-744](file://server/routes/auth.py#L1-L744)
- [schema.sql:26-82](file://db/schema.sql#L26-L82)
- [seed_demo_accounts.sql:17-107](file://db/seed_demo_accounts.sql#L17-L107)
- [PoliceRegister.jsx:1-346](file://frontend/src/pages/PoliceRegister.jsx#L1-L346)
- [Register.jsx:1-221](file://frontend/src/pages/Register.jsx#L1-L221)

## Performance Considerations
- bcrypt hashing cost: Higher cost improves security but increases latency. Tune cost to acceptable login time.
- Threadpool usage: Offload bcrypt operations to threadpool to avoid blocking the event loop.
- Database indexing: Email indexes improve lookup performance; ensure appropriate indexes exist.
- Token size: Keep JWT payloads minimal to reduce network overhead.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Invalid credentials during login:
  - Verify email exists in the correct table (CITIZENS vs POLICE).
  - Confirm bcrypt hash matches the stored hash after re-hashing with the same salt.
- Password mismatch errors:
  - Ensure frontend and backend enforce consistent password validation rules.
  - Check for accidental trimming or normalization differences.
- Token verification failures:
  - Confirm JWT secret and algorithm match between signing and verifying components.
  - Validate token expiry and role claims.

**Section sources**
- [auth.js:9-76](file://backend/routes/auth.js#L9-L76)
- [auth.py:218-293](file://server/routes/auth.py#L218-L293)
- [auth.py:399-476](file://server/routes/auth.py#L399-L476)

## Conclusion
The system employs bcrypt for secure password hashing and constant-time verification, stores hashes in dedicated database columns, and issues JWT tokens for session management. Frontend validation complements backend enforcement to ensure strong passwords. To further harden security, implement rate limiting, account lockout, and comprehensive audit logging for authentication attempts, along with a secure password recovery mechanism.