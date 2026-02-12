# ChainGuardian Backend

AI-Powered DeFi Risk & Compliance Assistant Backend Service

## Overview

This FastAPI backend serves as the bridge between the frontend UI, AI risk engine, and GuardianVault smart contract on Algorand.

## Features

- **AI Risk Analysis**: Integration with OpenRouter API using nemotron-3-nano-30b-a3b model
- **Vault Management**: Create, update, and manage user vaults
- **Blockchain Integration**: Interact with GuardianVault smart contract
- **Audit Logging**: Track all decisions on-chain and off-chain
- **RESTful API**: Clean API design with OpenAPI documentation

## Setup

### Prerequisites

- Python 3.12+
- OpenRouter API key (get from https://openrouter.ai/)
- Algorand TestNet account with ALGO funds

### Installation

1. Clone the repository and navigate to the backend directory:
```bash
cd projects/backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables:
```bash
cp .env.template .env
# Edit .env with your values
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENROUTER_API_KEY` | OpenRouter API key | Yes |
| `ALGORAND_NETWORK` | Network (testnet/mainnet) | Yes |
| `CONTRACT_APP_ID` | GuardianVault app ID | After deployment |
| `AI_AUTHORIZER_ADDRESS` | AI authorizer address | After deployment |

## Running the Server

### Development Mode

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Health Check
- `GET /health` - Service health status

### Risk Analysis
- `POST /api/analysis/risk` - Analyze transaction risk
- `POST /api/analysis/batch` - Batch analyze transactions
- `GET /api/analysis/model-info` - Get AI model information

### Vault Management
- `POST /api/vault/create` - Create a new vault
- `GET /api/vault/{address}` - Get vault information
- `PUT /api/vault/{address}` - Update vault settings
- `POST /api/vault/freeze` - Freeze a vault
- `POST /api/vault/unfreeze` - Unfreeze a vault
- `POST /api/vault/check-transaction` - Check if transaction is allowed

### Audit Logs
- `GET /api/audit/{address}` - Get audit log for user
- `GET /api/audit/onchain/{index}` - Get on-chain audit entry
- `GET /api/audit/onchain/count` - Get total on-chain audit count

## Project Structure

```
projects/backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration settings
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── analysis.py  # Risk analysis endpoints
│   │       ├── vault.py     # Vault management endpoints
│   │       └── audit.py     # Audit log endpoints
│   ├── models/
│   │   ├── __init__.py
│   │   ├── schemas.py       # Pydantic schemas
│   │   └── database.py      # SQLAlchemy models
│   └── services/
│       ├── __init__.py
│       ├── ai_engine.py     # AI risk engine
│       └── blockchain_service.py  # Blockchain interaction
├── requirements.txt
├── pyproject.toml
├── .env.template
└── README.md
```

## Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html
```

## Deployment

### Docker

```bash
docker build -t chainguardian-backend .
docker run -p 8000:8000 --env-file .env chainguardian-backend
```

### Cloud Deployment

The backend can be deployed to:
- AWS Lambda + API Gateway
- Google Cloud Run
- Azure Functions
- Railway
- Render

## Security Considerations

1. **API Keys**: Never commit `.env` files. Use environment variables in production.
2. **CORS**: Configure allowed origins appropriately.
3. **Rate Limiting**: Implement rate limiting for production use.
4. **Authentication**: Add JWT authentication for protected endpoints.

## License

MIT
