# Team4_Placeholder



# SafeFlow AI

SafeFlow AI is a payment and communication protection platform that analyzes messages, emails, URLs, and financial transactions using machine learning models and a rule-based risk engine.

The application provides an explainable risk assessment for every analyzed item.

## Main Features

- User registration and authentication using JWT
- SMS and email spam/phishing analysis
- Malicious URL detection
- Transaction fraud detection
- Rule-based risk engine
- Machine learning predictions
- Explainable risk scores and triggered rules
- Transaction status management
- Dashboard with risk activity and risk distribution
- Email notifications
- PostgreSQL database
- Docker-based local development environment
- Swagger API documentation

## Application Architecture

```text
Frontend
    |
    | HTTP requests
    v
FastAPI Backend
    |
    +-- Authentication
    +-- Message Analysis
    +-- URL Analysis
    +-- Transaction Analysis
    +-- Risk Engine
    +-- Dashboard
    +-- Notifications
    |
    v
PostgreSQL Database

Machine Learning Artifacts
    |
    +-- SMS spam model
    +-- Email spam model
    +-- URL classification model
    +-- Transaction fraud model

  ```
## Technology Stack

  ### Backend

    Python 3.13
    FastAPI
    SQLAlchemy
    PostgreSQL
    Pydantic
    JWT authentication
    Uvicorn
    scikit-learn
    pandas
    NumPy
    joblib 
  
  ### Frontend

    React
    TypeScript
    Vite
    Material UI
    React Router
    Recharts
    React Globe GL
  ### Infrastructure

    Docker
    Docker Compose
    Rancher Desktop
    PostgreSQL
    pgAdmin

  ### Project Structure

  ```text
    backend/
    └── app/
        ├── api/
        │   ├── analyses.py
        │   ├── auth.py
        │   ├── dashboard.py
        │   ├── messages.py
        │   ├── notification.py
        │   ├── risk.py
        │   ├── transaction.py
        │   └── urls.py
        │
        ├── core/
        │   ├── config.py
        │   └── security.py
        │
        ├── database/
        │   └── session.py
        │
        ├── models/
        │   ├── analysis.py
        │   ├── message.py
        │   ├── notification.py
        │   ├── transaction.py
        │   ├── url.py
        │   └── user.py
        │
        ├── repositories/
        ├── risk_engine/
        ├── schemas/
        └── services/

    data/
    ├── evaluation/
    ├── processed/
    └── raw/

    ml/
    └── artifacts/
        ├── email_spam/
        ├── sms_spam/
        └── transactions/

    notebooks/
    ├── Email/
    ├── SMS/
    ├── URLs/
    ├── messages_cleaning.ipynb
    └── transactions/

    pipeline/
    ├── cleaning/
    ├── database/
    ├── dags/
    ├── features/
    ├── ingestion/
    └── config.py

    frontend/
    └── frontend/
        ├── src/
        ├── public/
        ├── Dockerfile
        └── package.json

    tests/

  
  
```

## Requirements

    Git
    Python 3.13
    Docker Desktop or Rancher Desktop
    Node.js and npm
    PostgreSQL is provided through Docker

## Clone the Repository

    git clone https://gitlab.endava.com/techfest/team4_placeholder.git

    cd team4_placeholder

## Environment Configuration

    Create a .env file in the project root.

    Do not commit .env to Git.

    Example:
     ```text
        POSTGRES_DB=safeflow
        POSTGRES_USER=safeflow_user
        POSTGRES_PASSWORD=your_local_database_password
        POSTGRES_PORT=5432

        PGADMIN_EMAIL=admin@safeflow.dev
        PGADMIN_PASSWORD=your_pgadmin_password

        DATABASE_URL=postgresql+psycopg://safeflow_user:your_local_database_password@localhost:5432/safeflow

        JWT_SECRET_KEY=your_jwt_secret_key
        JWT_ALGORITHM=HS256
        ACCESS_TOKEN_EXPIRE_MINUTES=30

        SMTP_HOST=smtp.gmail.com
        SMTP_PORT=587
        SMTP_USERNAME=your_email@gmail.com
        SMTP_PASSWORD=your_app_password
        SMTP_FROM=your_email@gmail.com

        
        
        ```
        
    For team development, create a safe .env.example file containing variable names but no real secrets.

## Start the Application with Docker

    Start Rancher Desktop and make sure that Docker Engine is running.

    Verify Docker:

    docker --version
    docker compose version

    Validate the Docker Compose configuration:

    docker compose config

    Start all services:

    docker compose up -d --build

    Check the running containers:

    docker compose ps

    Expected services:

    safeflow-postgres
    safeflow-backend
    safeflow-frontend
    safeflow-pgadmin

## Application URLs

    Frontend:
    http://localhost:3000

    Backend:
    http://localhost:8000

    Swagger documentation:
    http://localhost:8000/docs

    Health check:
    http://localhost:8000/health

    pgAdmin:
    http://localhost:5050

## PostgreSQL and pgAdmin

Log in to pgAdmin using the values from .env:

    Email: PGADMIN_EMAIL
    Password: PGADMIN_PASSWORD

When registering the PostgreSQL server in pgAdmin, use:

    Name: SafeFlow PostgreSQL
    Host: postgres
    Port: 5432
    Database: safeflow
    Username: safeflow_user
    Password: POSTGRES_PASSWORD

Use postgres as the host inside pgAdmin because pgAdmin and PostgreSQL communicate through the Docker network.

Applications running directly on Windows use:

    localhost:5432

Docker containers use:

    postgres:5432

The backend creates the SQLAlchemy tables during application startup.


## Run the backend Locally

Activate the virtual environment:

    .\.venv\Scripts\activate

Install dependencies:

    pip install -r requirements.txt

Start the backend from the project root:

    $env:PYTHONPATH = (Get-Location).Path

    python -m uvicorn app.main:app --reload --app-dir backend

The backend will be available at:

    http://127.0.0.1:8000

Swagger documentation:

    http://127.0.0.1:8000/docs

## Run the Frontend Locally

Open a second terminal:

    cd frontend\frontend
    npm install
    npm run dev

The frontend will be available at:

    http://localhost:5173

The frontend environment file is:

    frontend/frontend/.env.example

Example:

    VITE_API_BASE_URL=
    VITE_MOCK_ENABLED=false

When running Vite locally, requests are proxied to the FastAPI backend.

## Backend API

All protected endpoints require a JWT bearer token.

   ### Authentication

    POST /api/v1/auth/register
    POST /api/v1/auth/login
    GET  /api/v1/auth/me
    PATCH /api/v1/auth/me/profile
    POST /api/v1/auth/forgot-password
    POST /api/v1/auth/verify-reset-code
    POST /api/v1/auth/reset-password

   ### Message Analysis

    POST /api/v1/messages/analyze
    GET  /api/v1/messages/
    GET  /api/v1/messages/{message_id}

   ### URL Analysis

    POST /api/v1/urls/analyze
    GET  /api/v1/urls/
    GET  /api/v1/urls/{url_id}

   ### Transaction Analysis

    POST /api/v1/transactions/analyze
    GET  /api/v1/transactions/
    GET  /api/v1/transactions/{transaction_id}
    PATCH /api/v1/transactions/{transaction_id}/status


   ### Risk Analysis

    POST /api/v1/risk/analyze

   ### Dashboard

    GET /api/v1/dashboard/summary
    GET /api/v1/dashboard/risk-activity
    GET /api/v1/dashboard/risk-distribution
    GET /api/v1/dashboard/recent-analyses

   ### Risk Engine

    The risk engine combines machine learning predictions with rule-based signals.

    Examples of risk signals include:

        New beneficiary
        Unusually large transaction amount
        Multiple recent transactions
        Unusual destination country
        Risky payment channel
        ML fraud prediction
        Suspicious links in messages
        Requests for sensitive information
        Urgent language
        Suspicious email patterns

    The risk engine returns:

        Risk score
        Risk level
        Triggered rules
        Recommended action

    Recommended actions:

        LOW risk    -> APPROVE
        MEDIUM risk -> REVIEW
        HIGH risk   -> BLOCK

## Machine Learning Models

    The repository contains trained model artifacts for:

    Email spam detection:
        ml/artifacts/email_spam/

    SMS spam detection:
        ml/artifacts/sms_spam/

    Transaction fraud detection:
        ml/artifacts/transactions/

    URL model files are available under:

        notebooks/URLs/

    The notebooks and training scripts are available under:

        notebooks/

    Examples:

        notebooks/Email/email_spam_classification.ipynb
        notebooks/SMS/sms_spam_classification.ipynb
        notebooks/URLs/url_classification.ipynb
        notebooks/transactions/fraud_payment.ipynb

## Data Pipeline

    The data pipeline is organized into the following stages:

        Ingestion
            |
        Cleaning
            |
        PII anonymization
            |
        Feature engineering
            |
        Validation
            |
        Database loading



    The pipeline handles:

        SMS and email ingestion
        SpamAssassin email parsing
        URL loading
        Transaction generation
        Message cleaning
        URL cleaning
        Transaction cleaning
        PII anonymization
        Feature extraction
        Data validation
        Database loading

## Testing

Run the test suite from the project root:

    pytest

Tests cover:

    Content features
    Content rules
    Content scoring
    Email analysis
    SMS analysis
    Transaction features
    Transaction machine learning
    Risk engine
    Model services

## Stop the Application

Stop the containers without deleting database data:

    docker compose down

Stop the containers and delete local database volumes:

    docker compose down -v

Use docker compose down -v only when you intentionally want to delete the local PostgreSQL and pgAdmin data.

## Git Workflow

Create a personal feature branch:

    git switch -c feature/your-feature-name

Check the current status:

    git status

Commit changes:

    git add .
    git commit -m "Describe the change"

Push the branch:

    git push -u origin HEAD

Create a Merge Request from your branch into dev.

Do not commit:

    .env
    .venv/
    __pycache__/
    *.pyc
    node_modules/
    database volumes
    API keys
    passwords
    private credentials