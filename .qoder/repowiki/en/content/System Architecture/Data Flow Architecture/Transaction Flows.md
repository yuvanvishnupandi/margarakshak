# Transaction Flows

<cite>
**Referenced Files in This Document**
- [schema.sql](file://db/schema.sql)
- [stored_procedure_process_report.sql](file://db/stored_procedure_process_report.sql)
- [database_triggers.sql](file://db/database_triggers.sql)
- [marga_rakshak_triggers.sql](file://db/marga_rakshak_triggers.sql)
- [reports.js](file://backend/routes/reports.js)
- [police.js](file://backend/routes/police.js)
- [challans.js](file://backend/routes/challans.js)
- [db.js](file://backend/db.js)
- [auth.js](file://backend/middleware/auth.js)
- [SubmitReport.jsx](file://frontend/src/pages/SubmitReport.jsx)
- [ReviewReports.jsx](file://frontend/src/pages/ReviewReports.jsx)
- [deploy_stored_procedure.bat](file://scripts/deploy_stored_procedure.bat)
- [install_triggers.bat](file://scripts/install_triggers.bat)
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
This document explains the transaction flow patterns across the Traffic Violation Management System. It covers the complete report processing pipeline from citizen submission through police verification to challan generation, the multi-stage approval workflow, trigger-based automation for trust score updates, stored procedure-driven business logic, concurrent payment processing with row-level locking, audit trails via temporal versioning, and the integration between frontend user actions and backend database transactions.

## Project Structure
The system comprises:
- Frontend (React) pages for citizen and police interactions
- Backend (Node.js/Express) routes implementing REST endpoints
- Database (MySQL) with stored procedures, triggers, views, and temporal tables

```mermaid
graph TB
subgraph "Frontend"
SR["SubmitReport.jsx"]
RR["ReviewReports.jsx"]
end
subgraph "Backend"
AUTH["auth.js"]
DB["db.js"]
RPT["routes/reports.js"]
POL["routes/police.js"]
CH["routes/challans.js"]
end
subgraph "Database"
SCH["schema.sql"]
TRG["database_triggers.sql"]
SPR["stored_procedure_process_report.sql"]
end
SR --> RPT
RR --> POL
RPT --> AUTH
POL --> AUTH
CH --> AUTH
RPT --> DB
POL --> DB
CH --> DB
DB --> SCH
SCH --> TRG
SCH --> SPR
```

**Diagram sources**
- [SubmitReport.jsx](file://frontend/src/pages/SubmitReport.jsx)
- [ReviewReports.jsx](file://frontend/src/pages/ReviewReports.jsx)
- [auth.js](file://backend/middleware/auth.js)
- [db.js](file://backend/db.js)
- [reports.js](file://backend/routes/reports.js)
- [police.js](file://backend/routes/police.js)
- [challans.js](file://backend/routes/challans.js)
- [schema.sql](file://db/schema.sql)
- [database_triggers.sql](file://db/database_triggers.sql)
- [stored_procedure_process_report.sql](file://db/stored_procedure_process_report.sql)

**Section sources**
- [schema.sql](file://db/schema.sql)
- [reports.js](file://backend/routes/reports.js)
- [police.js](file://backend/routes/police.js)
- [challans.js](file://backend/routes/challans.js)
- [db.js](file://backend/db.js)
- [auth.js](file://backend/middleware/auth.js)

## Core Components
- Reports lifecycle: Pending → Verified/Rejected → Challan Issued
- Trust score automation via triggers on report status changes
- Stored procedures for ACID-compliant report processing and challan issuance
- Concurrent-safe payment processing with row-level locks
- Audit trails using temporal tables (CITIZENS_HISTORY, CHALLANS_HISTORY)

Key transactional building blocks:
- ACID-compliant stored procedures with explicit rollback on errors
- Row-level locking (SELECT ... FOR UPDATE) to prevent race conditions
- Database triggers to maintain data consistency and automate business rules
- Temporal versioning to preserve historical state

**Section sources**
- [schema.sql](file://db/schema.sql)
- [stored_procedure_process_report.sql](file://db/stored_procedure_process_report.sql)
- [database_triggers.sql](file://db/database_triggers.sql)
- [marga_rakshak_triggers.sql](file://db/marga_rakshak_triggers.sql)

## Architecture Overview
The system enforces strict transaction boundaries at the database level while exposing REST endpoints for frontend interactions. The backend validates roles and delegates complex workflows to stored procedures and triggers.

```mermaid
sequenceDiagram
participant U as "Citizen User"
participant FE as "Frontend"
participant BE as "Backend Routes"
participant DB as "MySQL Database"
U->>FE : "Submit report with evidence"
FE->>BE : "POST /api/reports"
BE->>DB : "Insert REPORTS row (Pending)"
DB-->>BE : "report_id"
BE-->>FE : "{message, report_id}"
Note over FE,DB : "Evidence upload handled separately"
U->>FE : "View pending reports"
FE->>BE : "GET /api/police/pending"
BE->>DB : "SELECT Pending_Reports_Dashboard"
DB-->>BE : "Pending reports dataset"
BE-->>FE : "List of reports"
U->>FE : "Verify report (assign rule)"
FE->>BE : "PATCH /api/police/verify/ : id"
BE->>DB : "UPDATE REPORTS SET Verified"
DB-->>BE : "Trigger updates trust score"
BE->>DB : "CALL sp_issue_challan(...)"
DB-->>BE : "VIOLATION_EVENTS + CHALLANS created"
BE-->>FE : "Success response"
U->>FE : "Pay challan"
FE->>BE : "POST /api/challans/pay"
BE->>DB : "SELECT ... FOR UPDATE (row-level lock)"
DB-->>BE : "Lock and validate"
BE->>DB : "UPDATE CHALLANS SET Paid"
DB-->>BE : "Temporal versioning via triggers"
BE-->>FE : "Payment confirmed"
```

**Diagram sources**
- [reports.js](file://backend/routes/reports.js)
- [police.js](file://backend/routes/police.js)
- [challans.js](file://backend/routes/challans.js)
- [schema.sql](file://db/schema.sql)
- [database_triggers.sql](file://db/database_triggers.sql)

## Detailed Component Analysis

### Report Submission Pipeline (Citizen → Pending)
- Frontend collects plate number, violation type, location, description, and evidence.
- Backend route validates presence of required fields and inserts a new report with status Pending.
- Evidence upload is handled via a separate endpoint (not shown here) and linked to the report.

```mermaid
sequenceDiagram
participant F as "SubmitReport.jsx"
participant R as "routes/reports.js"
participant D as "MySQL"
F->>R : "POST /api/reports"
R->>D : "INSERT REPORTS (Pending)"
D-->>R : "report_id"
R-->>F : "{message, report_id}"
```

**Diagram sources**
- [SubmitReport.jsx](file://frontend/src/pages/SubmitReport.jsx)
- [reports.js](file://backend/routes/reports.js)

**Section sources**
- [reports.js](file://backend/routes/reports.js)
- [SubmitReport.jsx](file://frontend/src/pages/SubmitReport.jsx)

### Multi-Stage Approval Workflow (Pending → Verified/Rejected)
- Police dashboard lists pending reports via a view.
- Verification updates report status to Verified and triggers trust score increase.
- Rejection updates status to Rejected and triggers trust score decrease.

```mermaid
flowchart TD
Start(["Report in Pending"]) --> Verify{"Verify?"}
Verify --> |Yes| SetVerified["UPDATE REPORTS SET Verified"]
SetVerified --> TrustUp["Trigger increases trust score"]
TrustUp --> CreateEvent["Create VIOLATION_EVENTS"]
CreateEvent --> CreateChallan["Create CHALLANS"]
CreateChallan --> End(["Challan Issued"])
Verify --> |No| Reject{"Reject?"}
Reject --> |Yes| SetRejected["UPDATE REPORTS SET Rejected"]
SetRejected --> TrustDown["Trigger decreases trust score"]
TrustDown --> End
Reject --> |No| Hold["Remain Pending"]
```

**Diagram sources**
- [police.js](file://backend/routes/police.js)
- [schema.sql](file://db/schema.sql)
- [database_triggers.sql](file://db/database_triggers.sql)
- [marga_rakshak_triggers.sql](file://db/marga_rakshak_triggers.sql)

**Section sources**
- [police.js](file://backend/routes/police.js)
- [schema.sql](file://db/schema.sql)
- [database_triggers.sql](file://db/database_triggers.sql)
- [marga_rakshak_triggers.sql](file://db/marga_rakshak_triggers.sql)

### Stored Procedure: ProcessReportAndIssueChallan
- Validates report existence and Pending status with row-level lock.
- Updates report status and, if Verified, creates violation event and challan.
- Returns structured result with report, event, and challan identifiers.

```mermaid
sequenceDiagram
participant P as "police.js"
participant D as "MySQL"
participant SP as "Stored Procedure"
P->>D : "CALL ProcessReportAndIssueChallan(report_id, rule_id, status)"
D->>SP : "Execute"
SP->>D : "SELECT ... FOR UPDATE (report)"
SP->>D : "UPDATE REPORTS SET status"
alt Verified
SP->>D : "INSERT VIOLATION_EVENTS"
SP->>D : "INSERT CHALLANS"
end
SP-->>D : "COMMIT"
SP-->>P : "Result (report_id, status, event_id, challan_id)"
```

**Diagram sources**
- [police.js](file://backend/routes/police.js)
- [stored_procedure_process_report.sql](file://db/stored_procedure_process_report.sql)

**Section sources**
- [stored_procedure_process_report.sql](file://db/stored_procedure_process_report.sql)
- [police.js](file://backend/routes/police.js)

### Payment Processing Flow (Concurrent Safety)
- Frontend initiates payment with challan_id.
- Backend starts a transaction, locks the specific challan row, verifies ownership and status, then marks as Paid.
- Triggers capture temporal changes and update reward points.

```mermaid
sequenceDiagram
participant F as "Frontend"
participant C as "routes/challans.js"
participant D as "MySQL"
participant T as "Triggers"
F->>C : "POST /api/challans/pay"
C->>D : "BEGIN TRANSACTION"
C->>D : "SELECT ... FOR UPDATE (CHALLANS)"
D-->>C : "Row locked"
C->>D : "UPDATE CHALLANS SET Paid"
D->>T : "Capture temporal versioning"
T-->>D : "Updated history"
C->>D : "COMMIT"
C-->>F : "{message, challan_id, amount_paid}"
```

**Diagram sources**
- [challans.js](file://backend/routes/challans.js)
- [schema.sql](file://db/schema.sql)

**Section sources**
- [challans.js](file://backend/routes/challans.js)
- [schema.sql](file://db/schema.sql)

### Audit Trail and Temporal Data Versioning
- CITIZENS_HISTORY captures trust score and profile changes with valid_from/valid_to windows.
- CHALLANS_HISTORY captures all modifications to challans for auditability.
- Triggers automatically write historical rows on updates and inserts.

```mermaid
erDiagram
CITIZENS {
int citizen_id PK
string full_name
string email UK
int trust_score
int reward_points
enum account_status
datetime valid_from
datetime valid_to
}
CITIZENS_HISTORY {
bigint history_id PK
int citizen_id FK
string full_name
string email
int trust_score
int reward_points
enum account_status
datetime valid_from
datetime valid_to
enum operation_type
datetime changed_at
string changed_by
}
CHALLANS {
int challan_id PK
int event_id FK
int citizen_id FK
string badge_no
decimal total_amount
enum payment_status
date issue_date
date due_date
datetime valid_from
datetime valid_to
}
CHALLANS_HISTORY {
bigint history_id PK
int challan_id FK
int event_id
int citizen_id
string badge_no
decimal total_amount
enum payment_status
date issue_date
date due_date
datetime valid_from
datetime valid_to
enum operation_type
datetime changed_at
string changed_by
}
CITIZENS ||--o{ CITIZENS_HISTORY : "history"
CHALLANS ||--o{ CHALLANS_HISTORY : "history"
```

**Diagram sources**
- [schema.sql](file://db/schema.sql)

**Section sources**
- [schema.sql](file://db/schema.sql)

### Trust Score Automation via Triggers
- Auto-Reward System: On Verified, adds points to reporter’s trust score and reward points.
- Auto-Penalty System: On Rejected, subtracts points (bounded by zero).
- Additional triggers enforce temporal versioning and auto-suspension thresholds.

```mermaid
flowchart TD
A["Report status change"] --> B{"From Pending?"}
B --> |Yes| C{"To Verified?"}
B --> |Yes| D{"To Rejected?"}
B --> |No| E["No action"]
C --> F["Increase trust score +10<br/>Increase reward points +10"]
D --> G["Decrease trust score -10 (min 0)"]
```

**Diagram sources**
- [database_triggers.sql](file://db/database_triggers.sql)
- [marga_rakshak_triggers.sql](file://db/marga_rakshak_triggers.sql)

**Section sources**
- [database_triggers.sql](file://db/database_triggers.sql)
- [marga_rakshak_triggers.sql](file://db/marga_rakshak_triggers.sql)

### Frontend Integration and User Actions
- Citizen submits reports and evidence; backend persists Pending status.
- Police review pending reports, verify with a rule, and trigger challan creation.
- Citizens pay challans; backend ensures concurrency safety with row-level locks.

```mermaid
sequenceDiagram
participant U as "User"
participant FE as "Frontend Pages"
participant BE as "Backend Routes"
participant DB as "MySQL"
U->>FE : "SubmitReport.jsx"
FE->>BE : "POST /api/reports"
BE->>DB : "INSERT REPORTS"
DB-->>BE : "report_id"
BE-->>FE : "Success"
U->>FE : "ReviewReports.jsx"
FE->>BE : "GET /api/police/pending"
BE->>DB : "SELECT Pending_Reports_Dashboard"
DB-->>BE : "Dataset"
BE-->>FE : "Render pending reports"
U->>FE : "Verify/Reject"
FE->>BE : "PATCH /api/police/verify/ : id"
BE->>DB : "UPDATE REPORTS + CALL sp_issue_challan"
DB-->>BE : "Challan created"
BE-->>FE : "Success"
```

**Diagram sources**
- [SubmitReport.jsx](file://frontend/src/pages/SubmitReport.jsx)
- [ReviewReports.jsx](file://frontend/src/pages/ReviewReports.jsx)
- [reports.js](file://backend/routes/reports.js)
- [police.js](file://backend/routes/police.js)

**Section sources**
- [SubmitReport.jsx](file://frontend/src/pages/SubmitReport.jsx)
- [ReviewReports.jsx](file://frontend/src/pages/ReviewReports.jsx)
- [reports.js](file://backend/routes/reports.js)
- [police.js](file://backend/routes/police.js)

## Dependency Analysis
- Backend routes depend on database connection pooling and JWT middleware.
- Stored procedures encapsulate complex workflows and enforce referential integrity.
- Triggers maintain consistency across related entities (CITIZENS, REPORTS, CHALLANS).
- Frontend depends on backend endpoints for all state-changing operations.

```mermaid
graph LR
AUTH["auth.js"] --> RPT["routes/reports.js"]
AUTH --> POL["routes/police.js"]
AUTH --> CH["routes/challans.js"]
DBJS["db.js"] --> RPT
DBJS --> POL
DBJS --> CH
RPT --> DB["MySQL schema.sql"]
POL --> DB
CH --> DB
DB --> TRIG["database_triggers.sql"]
DB --> PROC["stored_procedure_process_report.sql"]
```

**Diagram sources**
- [auth.js](file://backend/middleware/auth.js)
- [db.js](file://backend/db.js)
- [reports.js](file://backend/routes/reports.js)
- [police.js](file://backend/routes/police.js)
- [challans.js](file://backend/routes/challans.js)
- [schema.sql](file://db/schema.sql)
- [database_triggers.sql](file://db/database_triggers.sql)
- [stored_procedure_process_report.sql](file://db/stored_procedure_process_report.sql)

**Section sources**
- [auth.js](file://backend/middleware/auth.js)
- [db.js](file://backend/db.js)
- [reports.js](file://backend/routes/reports.js)
- [police.js](file://backend/routes/police.js)
- [challans.js](file://backend/routes/challans.js)
- [schema.sql](file://db/schema.sql)
- [database_triggers.sql](file://db/database_triggers.sql)
- [stored_procedure_process_report.sql](file://db/stored_procedure_process_report.sql)

## Performance Considerations
- Use row-level locks (SELECT ... FOR UPDATE) to avoid contention during concurrent updates.
- Keep stored procedures minimal and focused to reduce transaction durations.
- Indexes on frequently filtered columns (status, dates, foreign keys) improve query performance.
- Connection pooling reduces overhead for high-throughput endpoints.

## Troubleshooting Guide
Common issues and resolutions:
- Report not found or already processed: Ensure report_id exists and status is Pending before verification.
- Duplicate payment attempts: Row-level lock prevents concurrent payments; backend returns conflict if already Paid.
- Trust score not updating: Verify triggers are installed and firing on report status changes.
- Stored procedure deployment failures: Confirm database connectivity and credentials; use deployment scripts to install procedures and triggers.

Operational scripts:
- [deploy_stored_procedure.bat](file://scripts/deploy_stored_procedure.bat)
- [install_triggers.bat](file://scripts/install_triggers.bat)

**Section sources**
- [deploy_stored_procedure.bat](file://scripts/deploy_stored_procedure.bat)
- [install_triggers.bat](file://scripts/install_triggers.bat)

## Conclusion
The Traffic Violation Management System enforces robust transactional integrity through stored procedures, triggers, and row-level locking. The frontend integrates seamlessly with backend endpoints to support end-to-end workflows from citizen submission to challan payment, with comprehensive audit trails and automated trust score management.