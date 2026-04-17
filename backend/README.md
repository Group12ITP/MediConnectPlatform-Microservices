# MediConnect Backend - Microservices Architecture

This backend is structured as independent microservices behind an API gateway, and is deployable with both Docker Compose and Kubernetes.

## Services

- `user-service` (port `5001`): authentication, patient, doctor, admin APIs
- `appointment-service` (port `5002`): appointments, availability, scheduling APIs
- `consultation-service` (port `5003`): reports, prescriptions, analysis APIs
- `notification-service` (port `5004`): notification endpoints
- `pharmacy-service` (port `5005`): pharmacist auth, pharmacy profile, inventory, finder, medicines
- `payment-service` (port `5006`): Stripe payment intents for consultation fees
- `telemedicine-service` (port `5007`): real-time consultation signaling (Socket.IO)
- `ai-symptom-checker-service` (port `5008`): preliminary suggestions + recommended specialties
- `api-gateway` (port `5000`): single entry point that routes `/api/*` traffic to services
- `mongodb` (port `27017`): shared database

## Run with Docker Compose

From `backend/`:

```bash
docker compose up --build
```

Gateway URL:

- `http://localhost:5000/api/...`

## Split Database Migration

After switching to split databases with a shared identity database, run the one-time migration from `backend/`:

```bash
npm run migrate:split-dbs
```

Preview only:

```bash
npm run migrate:split-dbs -- --dry-run
```

Default migration mapping:

- `mediconnect` -> `mediconnect_identity`: `patients`, `doctors`, `pharmacists`, `admins`, `counters`
- `mediconnect` -> `mediconnect_consultation`: `reports`, `patientreports`, `prescriptions`, `patientappointments`
- `mediconnect` -> `mediconnect_pharmacy`: `pharmacies`, `inventories`, `prescriptions`, `counters`

Optional environment overrides:

- `MIGRATION_SOURCE_URI`
- `MIGRATION_SOURCE_DB`
- `MIGRATION_IDENTITY_DB`
- `MIGRATION_CONSULTATION_DB`
- `MIGRATION_PHARMACY_DB`
- `MIGRATION_BATCH_SIZE`

## Run with Kubernetes

From `backend/`:

```bash
kubectl apply -f k8s/
```

Ingress routes:

- `/` -> frontend service
- `/api` -> api-gateway service
