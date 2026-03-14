# Diagrama Entidad-Relación (ER)

## Representación Textual

```
┌─────────────────────────────────────────────────────────────┐
│                          User                               │
├─────────────────────────────────────────────────────────────┤
│ PK  id                       String                        │
│ UK  email                    String                        │
│     name                     String?                       │
│     image                    String?                       │
│     role                     Role (LEADER/AGENT/ADMIN)      │
│     firstName                String?                       │
│     lastName                 String?                       │
│ FK   teamId                  String?                       │
│ FK   leaderId                String?                       │
│     weeklyDayOff             WeekDay?                      │
│     lastLoginAt              DateTime?                     │
│     createdAt                DateTime                      │
│     updatedAt                DateTime                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Has Many:                                                  │
│  ├─ Schedule (userId)                                       │
│  ├─ Break (userId)                                          │
│  ├─ Request as Requester (requesterId)                     │
│  ├─ Request as InvolvedAgent (involvedAgentId)              │
│  ├─ Notification (userId)                                   │
│  └─ AuditLog (userId)                                       │
│                                                             │
│  Belongs To:                                                │
│  ├─ Team (teamId)                                           │
│  └─ User as Leader (leaderId)                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                          Team                               │
├─────────────────────────────────────────────────────────────┤
│ PK  id                       String                        │
│ UK  name                     String                        │
│     description              String?                       │
│ UK  leaderId                 String                        │
│     createdAt                DateTime                      │
│     updatedAt                DateTime                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Has Many:                                                  │
│  ├─ User (teamId) - Members                                │
│  ├─ Schedule (teamId)                                      │
│  └─ Break (teamId)                                          │
│                                                             │
│  Belongs To:                                                │
│  └─ User (leaderId) - Leader                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│                        Schedule                             │
├─────────────────────────────────────────────────────────────┤
│ PK  id                       String                        │
│ FK   userId                  String                        │
│ FK   teamId                  String?                       │
│     timeRange                String                        │
│     validFrom                DateTime                      │
│     validTo                  DateTime?                     │
│     createdAt                DateTime                      │
│     updatedAt                DateTime                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Belongs To:                                                │
│  ├─ User (userId)                                           │
│  └─ Team (teamId)                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│                         Break                               │
├─────────────────────────────────────────────────────────────┤
│ PK  id                       String                        │
│ FK   userId                  String                        │
│ FK   teamId                  String?                       │
│     type                     String (DAILY/WEEKLY)         │
│     timeRange                String?                       │
│     dayOfWeek                WeekDay?                      │
│     weeklyTime               String?                       │
│     duration                 Int?                          │
│     validFrom                DateTime                      │
│     validTo                  DateTime?                     │
│     createdAt                DateTime                      │
│     updatedAt                DateTime                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Belongs To:                                                │
│  ├─ User (userId)                                           │
│  └─ Team (teamId)                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│                        Request                              │
├─────────────────────────────────────────────────────────────┤
│ PK  id                       String                        │
│ FK   requesterId             String                        │
│ FK   involvedAgentId         String?                       │
│ FK   resolvedBy              String?                       │
│     type                     RequestType                   │
│     requestDate              DateTime                      │
│     targetDate               DateTime                      │
│     currentSchedule          String?                       │
│     requestedSchedule        String                        │
│     reason                   String?                       │
│     status                   RequestStatus                 │
│     resolvedAt               DateTime?                     │
│     comment                  String?                       │
│     createdAt                DateTime                      │
│     updatedAt                DateTime                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Belongs To:                                                │
│  ├─ User as Requester (requesterId)                         │
│  ├─ User as InvolvedAgent (involvedAgentId)                 │
│  └─ User as Resolver (resolvedBy)                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│                     Notification                             │
├─────────────────────────────────────────────────────────────┤
│ PK  id                       String                        │
│ FK   userId                  String                        │
│ FK   requestId               String?                       │
│     type                     String                        │
│     title                    String                        │
│     message                  String                        │
│     read                     Boolean                       │
│     createdAt                DateTime                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Belongs To:                                                │
│  ├─ User (userId)                                           │
│  └─ Request (requestId)                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│                      AuditLog                               │
├─────────────────────────────────────────────────────────────┤
│ PK  id                       String                        │
│ FK   userId                  String?                       │
│     action                   String                        │
│     entity                   String                        │
│     entityId                 String?                       │
│     changes                  Json?                         │
│     ipAddress                String?                       │
│     userAgent                String?                       │
│     createdAt                DateTime                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Belongs To:                                                │
│  └─ User (userId)                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Relaciones Principales

### User ↔ Team
- Un User pertenece a un Team (opcional)
- Un Team tiene un User como Leader (obligatorio, 1:1)
- Un Team tiene muchos Users como Members (1:N)

### User ↔ Schedule
- Un User tiene muchos Schedules (histórico)
- Un Schedule pertenece a un User

### User ↔ Break
- Un User tiene muchos Breaks (histórico)
- Un Break pertenece a un User

### User ↔ Request
- Un User puede hacer muchas Requests (como Requester)
- Un User puede estar involucrado en muchas Requests (como InvolvedAgent)
- Un Request tiene un Requester y opcionalmente un InvolvedAgent

### Team ↔ Request
- Relación indirecta a través de Requester.teamId

### User ↔ Notification
- Un User tiene muchas Notifications
- Una Notification pertenece a un User

### User ↔ AuditLog
- Un User tiene muchos AuditLogs
- Un AuditLog pertenece opcionalmente a un User

## Enums

```
Role: LEADER | AGENT | ADMIN
RequestStatus: PENDING | APPROVED | REJECTED
RequestType: SCHEDULE_SWAP | DAY_OFF_SWAP | SCHEDULE_CHANGE
WeekDay: MONDAY | TUESDAY | WEDNESDAY | THURSDAY | FRIDAY | SATURDAY | SUNDAY
```

## Restricciones de Negocio en el Modelo

1. **Team.leaderId** es único y obligatorio - cada equipo tiene exactamente un líder
2. **User.email** es único - no puede haber dos usuarios con el mismo email
3. **Team.name** es único - no puede haber dos equipos con el mismo nombre
4. **Request.resolvedBy** solo se setea cuando status != PENDING
5. **Schedule.validTo** y **Break.validTo** son nullable para horarios sin fecha de fin
