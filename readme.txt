OVERVIEW

MediConnect is a healthcare platform built using a microservices architecture. Each service runs independently and communicates through a central API Gateway. The system includes services for user management, appointments, consultations, pharmacy, payments, notifications, telemedicine, and AI-based symptom checking.

---

PREREQUISITES

Ensure the following are installed:

* Operating System: Windows / macOS / Linux
* Git
* Docker Desktop (with Docker Compose running)
* Minimum 8 GB RAM allocated to Docker
* Node.js (only required for local development without Docker)

---
PROJECT STRUCTURE

Services and Ports:

* API Gateway → 5000
* User Service → 5001
* Appointment Service → 5002
* Consultation Service → 5003
* Notification Service → 5004
* Pharmacy Service → 5005
* Payment Service → 5006
* Telemedicine Service → 5007
* AI Symptom Checker → 5008
* MongoDB → 27017
* Frontend → 5173

Access Points:

* Frontend: http://localhost:5173
* API Gateway: http://localhost:5000/api

---

SETUP INSTRUCTIONS

1. Clone Repository:
   git clone <repository-url>
   cd <project-root>

2. Create Environment File:
   Path: backend/.env

   Add:
   JWT_SECRET=your_secret_key
   FRONTEND_URL=http://localhost:5173

3. Ensure Required Ports Are Free:
   5000–5008, 5173, 27017

---

RUNNING THE PROJECT (DOCKER - RECOMMENDED)

Start all services:

cd backend
docker compose up --build

This will:

* Build all services
* Start MongoDB
* Run backend microservices
* Start API Gateway
* Serve frontend

---

STOPPING SERVICES

Stop containers:
docker compose down

Stop and remove data:
docker compose down -v

---

DATABASE

MongoDB runs automatically via Docker.

Databases Used:

* mediconnect_identity
* mediconnect_consultation
* mediconnect_pharmacy

Migration Command:
npm run migrate:split-dbs

Dry Run:
npm run migrate:split-dbs -- --dry-run

---

KUBERNETES DEPLOYMENT (OPTIONAL)

cd backend
kubectl apply -f k8s/

Routing:

* "/" → Frontend
* "/api" → API Gateway

---

LOCAL DEVELOPMENT (WITHOUT DOCKER)

You must:

* Install MongoDB manually
* Run each service individually
* Start API Gateway
* Run frontend using Vite

Important:
Set:
API_GATEWAY_URL=http://localhost:5000

---

TROUBLESHOOTING

Port already in use:

* Stop conflicting apps or change ports

CORS issues:

* Check FRONTEND_URL in .env

Authentication errors:

* Verify JWT_SECRET
* Clear browser storage

Service issues:

* Ensure required service is running

---

LOGS

View logs:

docker compose logs -f api-gateway
docker compose logs -f user-service
docker compose logs -f consultation-service

---

QUICK COMMANDS

Start services:
docker compose up --build

Stop services:
docker compose down

Remove data:
docker compose down -v

View logs:
docker compose logs -f <service-name>

Run migration:
npm run migrate:split-dbs

