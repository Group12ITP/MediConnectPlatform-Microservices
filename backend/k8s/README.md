# MediConnect Kubernetes

## Prereqs
- `kubectl` connected to a cluster (Docker Desktop Kubernetes, Minikube, etc.)
- An Ingress controller if you want `ingress.yaml` to work (for example NGINX ingress)

## Build images (tags used by the manifests)
From the repo root:

```bash
docker build -t backend-user-service ./backend/services/user-service
docker build -t backend-appointment-service ./backend/services/appointment-service
docker build -t backend-consultation-service ./backend/services/consultation-service
docker build -t backend-notification-service ./backend/services/notification-service
docker build -t backend-pharmacy-service ./backend/services/pharmacy-service
docker build -t backend-payment-service ./backend/services/payment-service
docker build -t backend-telemedicine-service ./backend/services/telemedicine-service
docker build -t backend-ai-symptom-checker-service ./backend/services/ai-symptom-checker-service
docker build -t backend-api-gateway ./backend/services/api-gateway
docker build -t backend-frontend ./frontend
```

If you're using Minikube, build inside Minikube's Docker daemon first:

```bash
minikube docker-env
```

…then run the `docker build ...` commands in the same shell.

## Configure secrets
Edit `mediconnect-secret.yaml` and set `JWT_SECRET`.

## Deploy

```bash
kubectl apply -k backend/k8s
```

## Access
- **Ingress**: use your ingress controller’s IP/hostname.
- **No ingress controller**: port-forward the gateway:

```bash
kubectl port-forward svc/api-gateway 5000:5000
```
