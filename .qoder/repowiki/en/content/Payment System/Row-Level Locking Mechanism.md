# Row-Level Locking Mechanism

<cite>
**Referenced Files in This Document**
- [schema.sql](file://db/schema.sql)
- [stored_procedure_process_report.sql](file://db/stored_procedure_process_report.sql)
- [database_triggers.sql](file://db/database_triggers.sql)
- [marga_rakshak_triggers.sql](file://db/marga_rakshak_triggers.sql)
- [challans.js](file://backend/routes/challans.js)
- [PaymentPage.jsx](file://frontend/src/pages/PaymentPage.jsx)
- [PaymentModal.jsx](file://frontend/src/components/PaymentModal.jsx)
- [db.js](file://backend/db.js)
- [database.py](file://server/database.py)
- [challans.py](file://server/routes/challans.py)
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
This document explains the row-level locking mechanism that prevents double-payment race conditions in the traffic violation management system. It details how SELECT FOR UPDATE statements in stored procedures and triggers ensure atomicity during concurrent payment processing, outlines transaction isolation levels, lock acquisition timing, and deadlock prevention strategies. It also describes the integration with the challan payment workflow, demonstrates rollback scenarios, and provides performance and monitoring guidance.

## Project Structure
The payment workflow spans frontend, backend, and database layers:
- Frontend: PaymentPage and PaymentModal components orchestrate user actions and API calls.
- Backend: Express route (JavaScript) and FastAPI route (Python) handle payment requests and enforce row-level locks.
- Database: Stored procedures and triggers manage ACID guarantees and automatic trust scoring.

```mermaid
graph TB
FE["Frontend<br/>PaymentPage.jsx / PaymentModal.jsx"]
BE_JS["Backend (Express)<br/>routes/challans.js"]
BE_PY["Backend (FastAPI)<br/>server/routes/challans.py"]
DB["Database<br/>MySQL"]
SP["Stored Procedures<br/>schema.sql"]
TR["Triggers<br/>schema.sql"]
FE --> BE_JS
FE --> BE_PY
BE_JS --> DB
BE_PY --> DB
DB --> SP
DB --> TR
```

**Diagram sources**
- [PaymentPage.jsx:1-481](file://frontend/src/pages/PaymentPage.jsx#L1-L481)
- [PaymentModal.jsx:1-99](file://frontend/src/components/PaymentModal.jsx#L1-L99)
- [challans.js:1-101](file://backend/routes/challans.js#L1-L101)
- [challans.py:1-450](file://server/routes/challans.py#L1-L450)
- [schema.sql:440-629](file://db/schema.sql#L440-L629)

**Section sources**
- [PaymentPage.jsx:1-481](file://frontend/src/pages/PaymentPage.jsx#L1-L481)
- [PaymentModal.jsx:1-99](file://frontend/src/components/PaymentModal.jsx#L1-L99)
- [challans.js:1-101](file://backend/routes/challans.js#L1-L101)
- [challans.py:1-450](file://server/routes/challans.py#L1-L450)
- [schema.sql:440-629](file://db/schema.sql#L440-L629)

## Core Components
- Row-level locking via SELECT ... FOR UPDATE in stored procedures and backend routes.
- ACID-compliant transactions with explicit rollback on errors.
- Payment validation checks: existence, ownership, and status transitions.
- Automatic trust score updates via triggers on report status changes.

Key implementation locations:
- Stored procedure for payment: [sp_pay_challan:552-629](file://db/schema.sql#L552-L629)
- Backend Express route with row-level lock: [POST /api/challans/pay:31-98](file://backend/routes/challans.js#L31-L98)
- Backend FastAPI route for payment: [PUT /challans/pay/{challan_id}:336-397](file://server/routes/challans.py#L336-L397)
- Report processing with row-level lock: [ProcessReportAndIssueChallan:8-98](file://db/stored_procedure_process_report.sql#L8-L98)
- Trust score triggers: [trg_report_status_trust:363-382](file://db/schema.sql#L363-L382), [Auto_Reward_System:16-28](file://db/marga_rakshak_triggers.sql#L16-L28), [Auto_Penalty_System:34-44](file://db/marga_rakshak_triggers.sql#L34-L44)

**Section sources**
- [schema.sql:552-629](file://db/schema.sql#L552-L629)
- [challans.js:31-98](file://backend/routes/challans.js#L31-L98)
- [challans.py:336-397](file://server/routes/challans.py#L336-L397)
- [stored_procedure_process_report.sql:8-98](file://db/stored_procedure_process_report.sql#L8-L98)
- [marga_rakshak_triggers.sql:16-44](file://db/marga_rakshak_triggers.sql#L16-L44)

## Architecture Overview
The payment workflow enforces atomicity and prevents race conditions by acquiring an exclusive row-level lock on the target challan before any state changes.

```mermaid
sequenceDiagram
participant Client as "Frontend Client"
participant Route as "Backend Route"
participant DB as "MySQL Database"
participant Proc as "Stored Procedure"
participant Trig as "Triggers"
Client->>Route : "PUT /api/challans/pay/{challan_id}"
Route->>DB : "BEGIN TRANSACTION"
Route->>DB : "SELECT ... FOR UPDATE (CHALLANS)"
DB-->>Route : "Lock acquired + current row"
Route->>Route : "Validate ownership and status"
alt "Valid"
Route->>DB : "UPDATE CHALLANS SET payment_status='Paid'"
DB-->>Route : "OK"
Route->>DB : "COMMIT"
Route-->>Client : "Success"
else "Already paid / unauthorized / not found"
Route->>DB : "ROLLBACK"
Route-->>Client : "Error"
end
DB->>Trig : "Trigger fires on status change"
Trig-->>DB : "Update trust score / counters"
```

**Diagram sources**
- [challans.js:31-98](file://backend/routes/challans.js#L31-L98)
- [schema.sql:363-382](file://db/schema.sql#L363-L382)

## Detailed Component Analysis

### Stored Procedure Payment Lock (sp_pay_challan)
- Acquires a row-level lock using SELECT ... FOR UPDATE on CHALLANS.
- Validates existence, ownership, and non-paid/waived statuses.
- Updates payment_status, paid_at, and transaction_ref atomically within a transaction.
- Uses an exception handler to roll back on errors.

```mermaid
flowchart TD
Start(["Entry: sp_pay_challan"]) --> Lock["SELECT ... FOR UPDATE on CHALLANS"]
Lock --> CheckFound{"Challan exists?"}
CheckFound --> |No| RollbackNotFound["Rollback + Error: Not Found"]
CheckFound --> |Yes| CheckOwner{"Owner matches citizen?"}
CheckOwner --> |No| RollbackUnauthorized["Rollback + Error: Unauthorized"]
CheckOwner --> |Yes| CheckStatus{"Status is Unpaid/Waived?"}
CheckStatus --> |Not Unpaid| RollbackStatus["Rollback + Error: Already Paid/Waived"]
CheckStatus --> |Unpaid| Update["UPDATE CHALLANS to Paid"]
Update --> Commit["COMMIT"]
Commit --> End(["Exit"])
RollbackNotFound --> End
RollbackUnauthorized --> End
RollbackStatus --> End
```

**Diagram sources**
- [schema.sql:552-629](file://db/schema.sql#L552-L629)

**Section sources**
- [schema.sql:552-629](file://db/schema.sql#L552-L629)

### Backend Express Route Payment Lock
- Begins a transaction, acquires a row-level lock via SELECT ... FOR UPDATE, validates ownership and status, updates payment_status, and commits or rolls back accordingly.

```mermaid
sequenceDiagram
participant FE as "Frontend"
participant EX as "Express Route"
participant CN as "Connection"
participant DB as "MySQL"
FE->>EX : "POST /api/challans/pay"
EX->>CN : "beginTransaction()"
EX->>DB : "SELECT ... FOR UPDATE (CHALLANS)"
DB-->>EX : "Row locked"
EX->>EX : "Validate citizen_id and status"
alt "Valid"
EX->>DB : "UPDATE CHALLANS SET status='Paid'"
EX->>DB : "commit()"
EX-->>FE : "Success"
else "Invalid"
EX->>DB : "rollback()"
EX-->>FE : "Error"
end
```

**Diagram sources**
- [challans.js:31-98](file://backend/routes/challans.js#L31-L98)

**Section sources**
- [challans.js:31-98](file://backend/routes/challans.js#L31-L98)

### Backend FastAPI Route Payment Lock
- Similar to Express route, but implemented in Python using pymysql. Retrieves challan, checks status, and updates payment_status.

```mermaid
flowchart TD
Start(["Entry: PUT /challans/pay/{challan_id}"]) --> Fetch["SELECT challan by ID"]
Fetch --> Exists{"Exists?"}
Exists --> |No| Return404["Return 404 Not Found"]
Exists --> |Yes| CheckPaid{"Status == Paid?"}
CheckPaid --> |Yes| Return400["Return 400 Already Paid"]
CheckPaid --> |No| Update["UPDATE to Paid + set paid_at + transaction_ref"]
Update --> Commit["Commit"]
Commit --> Return200["Return Success"]
Return404 --> End(["Exit"])
Return400 --> End
Return200 --> End
```

**Diagram sources**
- [challans.py:336-397](file://server/routes/challans.py#L336-L397)

**Section sources**
- [challans.py:336-397](file://server/routes/challans.py#L336-L397)

### Report Processing and Row-Level Locking
- The stored procedure ProcessReportAndIssueChallan locks the REPORTS row before updating status and creating related records, preventing concurrent verification/rejection races.

```mermaid
flowchart TD
Start(["Entry: ProcessReportAndIssueChallan"]) --> Lock["SELECT ... FOR UPDATE (REPORTS)"]
Lock --> Validate{"Report exists and Pending?"}
Validate --> |No| Rollback["ROLLBACK + Error"]
Validate --> |Yes| UpdateStatus["UPDATE REPORTS to Verified/Rejected"]
UpdateStatus --> CreateEvent["INSERT VIOLATION_EVENTS"]
CreateEvent --> CreateChallan["INSERT CHALLANS"]
CreateChallan --> Commit["COMMIT"]
Commit --> End(["Exit"])
Rollback --> End
```

**Diagram sources**
- [stored_procedure_process_report.sql:8-98](file://db/stored_procedure_process_report.sql#L8-L98)

**Section sources**
- [stored_procedure_process_report.sql:8-98](file://db/stored_procedure_process_report.sql#L8-L98)

### Trigger-Based Payment Validation and Trust Scoring
- While the payment itself is enforced by row-level locks, triggers automatically adjust trust scores when reports change status, reinforcing system integrity.

```mermaid
sequenceDiagram
participant DB as "MySQL"
participant TR as "Triggers"
participant CS as "CITIZENS"
DB->>TR : "AFTER UPDATE on REPORTS"
TR->>CS : "UPDATE trust_score (+10/-10) based on status change"
TR-->>DB : "Trust score adjusted"
```

**Diagram sources**
- [schema.sql:363-382](file://db/schema.sql#L363-L382)
- [marga_rakshak_triggers.sql:16-44](file://db/marga_rakshak_triggers.sql#L16-L44)

**Section sources**
- [schema.sql:363-382](file://db/schema.sql#L363-L382)
- [marga_rakshak_triggers.sql:16-44](file://db/marga_rakshak_triggers.sql#L16-L44)

## Dependency Analysis
- Frontend depends on backend routes for payment operations.
- Backend routes depend on database connectivity and stored procedures/triggers.
- Database relies on stored procedures for atomic payment processing and triggers for trust scoring.

```mermaid
graph LR
FE["Frontend<br/>PaymentPage.jsx / PaymentModal.jsx"] --> BE_JS["Express Route<br/>challans.js"]
FE --> BE_PY["FastAPI Route<br/>challans.py"]
BE_JS --> DB["MySQL"]
BE_PY --> DB
DB --> SP["sp_pay_challan<br/>schema.sql"]
DB --> TR["Triggers<br/>schema.sql"]
```

**Diagram sources**
- [PaymentPage.jsx:1-481](file://frontend/src/pages/PaymentPage.jsx#L1-L481)
- [PaymentModal.jsx:1-99](file://frontend/src/components/PaymentModal.jsx#L1-L99)
- [challans.js:1-101](file://backend/routes/challans.js#L1-L101)
- [challans.py:1-450](file://server/routes/challans.py#L1-L450)
- [schema.sql:552-629](file://db/schema.sql#L552-L629)

**Section sources**
- [PaymentPage.jsx:1-481](file://frontend/src/pages/PaymentPage.jsx#L1-L481)
- [PaymentModal.jsx:1-99](file://frontend/src/components/PaymentModal.jsx#L1-L99)
- [challans.js:1-101](file://backend/routes/challans.js#L1-L101)
- [challans.py:1-450](file://server/routes/challans.py#L1-L450)
- [schema.sql:552-629](file://db/schema.sql#L552-L629)

## Performance Considerations
- Lock duration: Keep SELECT ... FOR UPDATE and UPDATE within minimal transaction scope to reduce lock contention.
- Indexes: Ensure CHALLANS.challan_id is indexed (primary key) and CHALLANS.citizen_id is indexed for efficient filtering.
- Isolation level: Default REPEATABLE READ in MySQL provides consistent reads and prevents dirty reads; SELECT ... FOR UPDATE escalates to an exclusive lock for the targeted row.
- Deadlock prevention:
  - Always acquire locks in a consistent order across all operations.
  - Minimize transaction duration; avoid interactive prompts inside transactions.
  - Retry transient deadlocks with exponential backoff in application code.
- Monitoring:
  - Monitor lock wait timeouts and slow queries.
  - Track transaction latency and lock contention metrics.
  - Use MySQL’s performance schema and slow query log for diagnostics.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Double-payment attempts:
  - Symptom: 409 Conflict or stored procedure error indicating already paid.
  - Resolution: Ensure SELECT ... FOR UPDATE is executed before UPDATE and commit occurs only after validation.
  - References: [challans.js:68-72](file://backend/routes/challans.js#L68-L72), [schema.sql:598-603](file://db/schema.sql#L598-L603)
- Unauthorized access:
  - Symptom: 403 Forbidden when trying to pay another citizen’s challan.
  - Resolution: Validate ownership before acquiring locks.
  - References: [challans.js:62-66](file://backend/routes/challans.js#L62-L66), [schema.sql:591-596](file://db/schema.sql#L591-L596)
- Not found:
  - Symptom: 404 Not Found when challan does not exist.
  - Resolution: Check challan existence before lock acquisition.
  - References: [challans.js:53-57](file://backend/routes/challans.js#L53-L57), [schema.sql:584-589](file://db/schema.sql#L584-L589)
- Deadlocks:
  - Symptom: Transaction rollback with deadlock error.
  - Resolution: Retry with backoff; ensure consistent lock ordering; reduce transaction scope.
  - References: [schema.sql:565-570](file://db/schema.sql#L565-L570), [challans.js:90-97](file://backend/routes/challans.js#L90-L97)
- Waived challans:
  - Symptom: 400 Bad Request indicating no payment required.
  - Resolution: Check payment_status before attempting payment.
  - References: [schema.sql:605-610](file://db/schema.sql#L605-L610)

**Section sources**
- [challans.js:31-98](file://backend/routes/challans.js#L31-L98)
- [schema.sql:552-629](file://db/schema.sql#L552-L629)

## Conclusion
The row-level locking mechanism using SELECT ... FOR UPDATE in stored procedures and backend routes effectively prevents double-payment race conditions. Combined with ACID-compliant transactions, explicit validation, and automatic trust scoring via triggers, the system ensures atomicity, consistency, and integrity across concurrent payment attempts. Proper indexing, isolation levels, and deadlock prevention strategies further enhance reliability and performance.