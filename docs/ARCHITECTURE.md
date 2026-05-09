# LOGIST Architecture Document

## 1. System Overview

LOGIST is an enterprise-grade GPS fleet tracking, dispatch, and Security Operations Center (SOC) platform with real-time telemetry, AI analytics, and comprehensive security monitoring.

### Key Features
- **Real-time Fleet Tracking**: Live GPS positioning with WebSocket updates
- **Dispatching**: Route optimization, geo-fencing, and vehicle assignment
- **SOC Operations**: Incident management, threat detection, and SOAR automation
- **AI Analytics**: Driver behavior scoring, anomaly detection, predictive analysis
- **Security**: JWT + 2FA/FIDO2, RBAC, audit logging, threat monitoring
- **High Availability**: Kubernetes, PostgreSQL HA, Redis Cluster

## 2. Architecture Layers

### 2.1 Presentation Layer
```
Mobile App (React Native)      Dispatcher Web (React)
      ↓                               ↓
      └──────── REST API + WebSocket ────────┘
              ↓
        API Gateway
```

### 2.2 Application Layer (Backend)

```
NestJS Application
├── Auth Module (JWT + 2FA + FIDO2 + RBAC)
├── GPS Module (Location tracking, Geofencing)
├── Alert Module (Rules, Scoring, Escalation)
├── SOC Module (Incidents, Playbooks, SOAR)
├── Analytics Module (AI/ML predictions)
├── Audit Module (Immutable logging)
└── Notification Module (Alerts, Broadcasts)
```

### 2.3 Data Layer

```
PostgreSQL (Primary)
├── Users & Authentication
├── Vehicles & Locations
├── Geofences & Routes
├── Alerts & Rules
├── Incidents & Evidence
└── Audit Logs

Redis Cluster
├── Session Cache
├── GPS Location Cache
├── Alert Queue
├── Job Queue (Bull)
└── Real-time Subscriptions
```

### 2.4 Infrastructure Layer

```
Docker
├── Backend Services (NestJS)
├── Mobile API Proxy
├── AI Service (Python FastAPI)
└── Supporting Services

Kubernetes
├── Deployments (Services)
├── StatefulSets (Databases)
├── Services (ClusterIP, LoadBalancer)
├── Ingress (Nginx)
└── PVC (Persistent Volumes)
```

## 3. Technology Stack

| Layer | Technology |
|-------|-----------|
| **Mobile** | React Native, TypeScript, Redux |
| **Backend** | NestJS, Node.js, Passport.js |
| **Web Frontend** | React, TypeScript, Mapbox GL, Material-UI |
| **Database** | PostgreSQL, PostGIS |
| **Cache/Queue** | Redis, Bull |
| **Real-time** | Socket.IO, WebSocket |
| **AI/ML** | Python, FastAPI, Scikit-learn, TensorFlow |
| **Infrastructure** | Docker, Kubernetes, Helm |
| **Monitoring** | Prometheus, Grafana, ELK, Jaeger |
| **CI/CD** | GitHub Actions |
| **Security** | JWT, FIDO2, bcrypt, Vault |

## 4. Module Details

### 4.1 Authentication Module

**Endpoints:**
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login with credentials
- `POST /auth/2fa/setup` - Enable 2FA (TOTP)
- `POST /auth/2fa/verify` - Verify TOTP code
- `POST /auth/webauthn/register` - Register FIDO2 device
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/logout` - Logout & invalidate token

**Database:**
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  two_factor_secret VARCHAR(255),
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  fido2_credentials JSONB,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Audit Logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  timestamp TIMESTAMP DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);
```

### 4.2 GPS Tracking Module

**Endpoints:**
- `POST /gps/location` - Ingest GPS point
- `GET /gps/location/:vehicleId` - Get last known location
- `GET /gps/history/:vehicleId` - Get location history
- `GET /gps/nearby?lat=&lon=&radius=` - Find nearby vehicles

**WebSocket Events:**
```
Client → Server:
  - join:vehicle:123 (subscribe to vehicle updates)
  - leave:vehicle:123 (unsubscribe)

Server → Client:
  - location:update (new GPS point)
  - geofence:enter (vehicle entered geofence)
  - geofence:exit (vehicle exited geofence)
```

**Database:**
```sql
CREATE TABLE vehicles (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  plate VARCHAR(50) UNIQUE NOT NULL,
  driver_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE locations (
  id UUID PRIMARY KEY,
  vehicle_id UUID REFERENCES vehicles(id),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  altitude FLOAT,
  accuracy FLOAT,
  speed FLOAT,
  heading FLOAT,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_locations_vehicle_timestamp 
ON locations(vehicle_id, timestamp DESC);

CREATE TABLE geofences (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  polygon GEOMETRY(Polygon, 4326),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4.3 Alert & Rules Engine

**Alert Rules Structure:**
```json
{
  "id": "rule-123",
  "name": "Speed Violation",
  "condition": {
    "type": "speed_threshold",
    "value": 120,
    "unit": "km/h"
  },
  "action": {
    "type": "create_alert",
    "priority": "high"
  },
  "enabled": true
}
```

**Endpoints:**
- `POST /alerts/rules` - Create rule
- `GET /alerts/rules` - List rules
- `PUT /alerts/rules/:id` - Update rule
- `DELETE /alerts/rules/:id` - Delete rule
- `GET /alerts` - Get active alerts
- `POST /alerts/:id/acknowledge` - Acknowledge alert
- `POST /alerts/:id/resolve` - Resolve alert

### 4.4 SOC Module

**Incident Lifecycle:**
```
Alert → Incident Created → Investigation → Escalation → Resolution
         ↓
    Risk Scoring
         ↓
    Alert Correlation
         ↓
    SOAR Automation (if enabled)
```

**Endpoints:**
- `POST /incidents` - Create incident
- `GET /incidents` - List incidents (with filtering)
- `PUT /incidents/:id` - Update incident
- `POST /incidents/:id/comment` - Add comment
- `POST /incidents/:id/evidence` - Attach evidence
- `POST /incidents/:id/escalate` - Escalate incident

### 4.5 Real-time System

**Architecture:**
```
GPS Location → Backend API
              ↓
         Redis Cache
         Redis Pub/Sub
              ↓
        Socket.IO Gateway
              ↓
    Web + Mobile Clients (WebSocket)
```

**Socket.IO Rooms:**
- `fleet:all` - All vehicles
- `vehicle:${id}` - Specific vehicle
- `user:${id}` - User-specific notifications
- `soc:incident` - SOC incident updates

## 5. Security

### 5.1 Authentication Flow
```
1. User provides email + password
2. Server validates, generates JWT + Refresh Token
3. If 2FA enabled:
   - User enters TOTP code
   - Server validates
4. Return JWT (1h) + Refresh Token (30d)
5. Client stores in secure storage
```

### 5.2 Authorization (RBAC)
```
Roles:
- ADMIN: Full system access
- DISPATCHER: Manage fleet, create incidents
- DRIVER: View own vehicle, trigger SOS
- SOC_ANALYST: Incident analysis
- AUDITOR: View audit logs only
```

### 5.3 Data Protection
- **At Rest**: AES-256 encryption for sensitive data
- **In Transit**: TLS 1.3 for all connections
- **Database**: Row-level security (RLS) for PostgreSQL
- **Audit**: Immutable event logging

## 6. Deployment

### 6.1 Local Development
```bash
docker-compose up -d
# Services start:
# - Backend: http://localhost:3000
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
# - Grafana: http://localhost:3001
```

### 6.2 Kubernetes Production
```bash
kubectl create namespace logist
kubectl apply -f infra/kubernetes/
# Creates:
# - Backend Deployment (replicas: 3)
# - PostgreSQL StatefulSet (replicas: 3)
# - Redis StatefulSet (replicas: 3)
# - Services, Ingress, ConfigMaps, Secrets
```

## 7. Monitoring & Observability

### Metrics
- Request latency (p50, p95, p99)
- GPS ingest rate (events/sec)
- Alert creation rate
- System resource usage (CPU, Memory, Disk)
- Database query performance
- WebSocket connection count

### Logging
- Application logs → ELK Stack
- Audit logs → PostgreSQL + ELK
- Infrastructure logs → ELK
- Alerts → Grafana + Slack

### Tracing
- Distributed tracing with Jaeger
- Trace GPS ingestion flow
- Trace alert creation
- Trace incident escalation

## 8. Performance Targets

| Metric | Target |
|--------|--------|
| API Response Time (p95) | < 200ms |
| GPS Ingest Latency | < 100ms |
| Alert Creation | < 500ms |
| WebSocket Message Delivery | < 50ms |
| Location Query (last location) | < 10ms |
| System Uptime | 99.95% |

## 9. Disaster Recovery

### Backup Strategy
- Database: Daily full + Hourly incremental
- Redis: Persistence (RDB + AOF)
- Backups stored in S3 with replication

### Recovery Time Objectives (RTO)
- Complete system: 4 hours
- Database: 1 hour
- Cache: 15 minutes

### Recovery Point Objectives (RPO)
- Database: 1 hour
- Cache: 5 minutes

## 10. Future Enhancements

- [ ] Multi-language support
- [ ] Mobile app offline playback
- [ ] Advanced predictive analytics
- [ ] Integration with fleet management systems
- [ ] IoT sensor integration
- [ ] Advanced threat intelligence feeds
- [ ] Blockchain for audit logs
