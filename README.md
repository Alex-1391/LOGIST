# LOGIST - Enterprise Fleet Tracking & SOC Platform

Комплексна система GPS-моніторингу, диспетчеризації, SOC-моніторингу, AI-аналітики та production-інфраструктури.

## 📋 Архітектура

- **Mobile Apps**: React Native + TypeScript
- **Backend**: NestJS + Node.js
- **Web Dispatcher**: React + Mapbox
- **Database**: PostgreSQL
- **Realtime**: WebSocket + Socket.IO + Redis
- **Infrastructure**: Docker + Kubernetes
- **Monitoring**: Prometheus + Grafana + ELK
- **Security**: JWT + 2FA + FIDO2 + Risk Engine

## 📁 Структура Проєкту

```
LOGIST/
├── apps/
│   ├── mobile/              # React Native iOS/Android
│   ├── backend/             # NestJS API
│   └── dispatcher-web/      # React Web Panel
├── infra/
│   ├── docker/              # Docker configurations
│   ├── kubernetes/          # K8s manifests
│   └── terraform/           # Infrastructure as Code
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── SECURITY.md
│   └── DEPLOYMENT.md
├── .github/
│   └── workflows/           # CI/CD
├── docker-compose.yml
├── .env.example
└── package.json
```

## 🚀 Швидкий Старт

### Вимоги
- Node.js 18+
- Docker + Docker Compose
- PostgreSQL 14+
- Redis 7+

### Встановлення

```bash
# Клонування
git clone https://github.com/Alex-1391/LOGIST.git
cd LOGIST

# Встановлення залежностей
npm install

# Конфігурація
cp .env.example .env

# Запуск з Docker Compose
docker-compose up -d
```

## 📦 Компоненти

### 1. **Mobile App** (React Native)
- Background GPS tracking
- Offline-first synchronization
- Encrypted local storage
- SOS button
- Realtime WebSocket updates
- Push notifications

### 2. **Backend API** (NestJS)
- JWT authentication + 2FA + FIDO2
- RBAC authorization
- GPS ingest API
- Realtime Socket.IO gateway
- Alerts engine
- Audit logging
- Redis queue processing

### 3. **Dispatcher Web** (React + Mapbox)
- Live fleet map
- Geo-fencing editor
- SOC dashboard
- Realtime alerts
- Route replay
- PDF/Excel export

### 4. **SOC + Incident Response**
- Risk-score engine
- Alert correlation
- SOAR automation
- Immutable audit logs
- Threat monitoring

### 5. **AI Analytics**
- Driver behavior scoring
- Anomaly detection
- Predictive incident analysis
- ETA prediction
- Threat intelligence

## 🔐 Безпека

- JWT + Refresh tokens
- 2FA (TOTP/SMS)
- FIDO2/WebAuthn
- Root/Jailbreak detection
- Token abuse detection
- TLS 1.3
- Cloud Armor / WAF

## 🐳 DevOps

- Dockerized microservices
- Kubernetes autoscaling
- CI/CD з GitHub Actions
- HA PostgreSQL + Redis Cluster
- Disaster recovery
- Monitoring: Prometheus + Grafana

## 📝 Документація

- [Архітектура](./docs/ARCHITECTURE.md)
- [API Документація](./docs/API.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Security Guide](./docs/SECURITY.md)

## 👨‍💻 Розробка

```bash
# Backend
cd apps/backend
npm install
npm run dev

# Mobile
cd apps/mobile
npm install
npm start

# Web
cd apps/dispatcher-web
npm install
npm start
```

## 📄 Ліцензія

MIT

## 📞 Контакти

GitHub: [@Alex-1391](https://github.com/Alex-1391)
