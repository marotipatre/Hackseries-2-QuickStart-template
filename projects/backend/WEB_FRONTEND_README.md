# ChainGuardian - Python Web Frontend

This directory contains the complete ChainGuardian web application built with FastAPI and Jinja2 templates. The frontend has been completely rewritten from React to a Python-based web framework for better integration with the backend.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     ChainGuardian Web App                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐      ┌──────────────┐                  │
│  │   Browser    │◄────►│  FastAPI     │                  │
│  │  (HTML/JS)   │      │   Server     │                  │
│  └──────────────┘      └──────┬───────┘                  │
│                                │                          │
│                                ▼                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Jinja2 Templates                       │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐       │   │
│  │  │   Home   │  │Dashboard │  │  Vault   │       │   │
│  │  └──────────┘  └──────────┘  └──────────┘       │   │
│  │  ┌──────────┐  ┌──────────┐                      │   │
│  │  │ Analysis │  │   Audit   │                      │   │
│  │  └──────────┘  └──────────┘                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                │                          │
│                                ▼                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Backend Services                        │   │
│  │  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │ AI Engine    │  │ Blockchain   │              │   │
│  │  │ (OpenRouter) │  │   Service    │              │   │
│  │  └──────────────┘  └──────────────┘              │   │
│  │  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │   Database    │  │   API Routes │              │   │
│  │  │  (SQLite)    │  │              │              │   │
│  │  └──────────────┘  └──────────────┘              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                │                          │
│                                ▼                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         GuardianVault Smart Contract                  │   │
│  │              (Algorand Blockchain)                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
projects/backend/
├── app/
│   ├── main.py                 # FastAPI application entry point
│   ├── config.py               # Configuration settings
│   ├── models/
│   │   ├── database.py         # SQLAlchemy database models
│   │   └── schemas.py         # Pydantic schemas
│   ├── services/
│   │   ├── ai_engine.py       # AI Risk Engine (OpenRouter)
│   │   └── blockchain_service.py  # Blockchain interaction
│   ├── api/
│   │   └── routes/
│   │       ├── analysis.py    # Analysis API endpoints
│   │       ├── vault.py       # Vault management endpoints
│   │       └── audit.py       # Audit log endpoints
│   ├── templates/             # Jinja2 HTML templates
│   │   ├── base.html          # Base template with navigation
│   │   ├── index.html         # Home page
│   │   ├── dashboard.html     # Risk dashboard
│   │   ├── vault.html         # Vault management
│   │   ├── analysis.html      # AI analysis panel
│   │   └── audit.html        # Audit log viewer
│   └── static/
│       └── js/
│           └── main.js        # Common JavaScript utilities
├── requirements.txt           # Python dependencies
├── pyproject.toml            # Project configuration
└── .env.template             # Environment variables template
```

## Features

### 1. Home Page (`/`)
- Hero section with project overview
- Feature highlights (AI Risk Engine, Blockchain Enforcement, Immutable Audit Trail)
- How it works section
- Quick action cards

### 2. Dashboard (`/dashboard`)
- Real-time vault status display
- Risk score visualization with progress bar
- Risk threshold display
- Vault address information
- Freeze/unfreeze vault controls
- Quick action links

### 3. Vault Management (`/vault`)
- Create new Guardian Vault
- Set custom risk threshold (0-100)
- Update existing vault settings
- View vault information
- Wallet address input

### 4. AI Analysis (`/analysis`)
- Transaction analysis form
- Multiple transaction types (Transfer, Swap, Liquidity, Staking, etc.)
- AI-powered risk assessment
- Risk score display with color coding
- Recommendation (ALLOW/WARN/BLOCK)
- AI reasoning display
- Execute transaction button (enabled only for ALLOWED transactions)

### 5. Audit Log (`/audit`)
- Filter by source (On-Chain/Off-Chain)
- Filter by decision (Allowed/Blocked/Frozen)
- Pagination support
- Statistics summary
- Detailed audit entry table
- Load more functionality

## Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **Uvicorn**: ASGI server
- **Pydantic**: Data validation
- **SQLAlchemy**: ORM for database operations
- **aiosqlite**: Async SQLite driver
- **httpx**: HTTP client for OpenRouter API
- **algokit-utils**: Algorand development utilities
- **algosdk**: Algorand Python SDK

### Frontend
- **Jinja2**: Python templating engine
- **Tailwind CSS**: Utility-first CSS framework (via CDN)
- **Vanilla JavaScript**: Client-side interactivity

### AI
- **OpenRouter API**: AI model aggregation platform
- **neuralbase/nemotron-3-nano-30b-a3b**: Free AI model for risk analysis

### Blockchain
- **Algorand TestNet**: Blockchain network
- **GuardianVault Smart Contract**: On-chain enforcement

## Installation

### Prerequisites
- Python 3.9 or higher
- pip package manager
- OpenRouter API key (free)

### Setup Steps

1. **Navigate to the backend directory:**
   ```bash
   cd projects/backend
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment:**
   - Windows:
     ```bash
     venv\Scripts\activate
     ```
   - Linux/Mac:
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Create environment file:**
   ```bash
   cp .env.template .env
   ```

6. **Edit `.env` file with your configuration:**
   ```env
   # OpenRouter API Configuration
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   AI_MODEL=neuralbase/nemotron-3-nano-30b-a3b:free

   # Algorand Configuration
   ALGORAND_NETWORK=testnet
   ALGORAND_NODE_URL=https://testnet-api.algonode.cloud
   ALGORAND_INDEXER_URL=https://testnet-idx.algonode.cloud

   # GuardianVault Contract
   GUARDIAN_VAULT_APP_ID=your_app_id_here

   # API Configuration
   API_HOST=0.0.0.0
   API_PORT=8000
   API_PREFIX=/api

   # CORS Configuration
   CORS_ORIGINS=["http://localhost:8000","http://127.0.0.1:8000"]
   ```

7. **Deploy the GuardianVault smart contract:**
   ```bash
   cd ../contracts
   algokit project run build -- guardian_vault
   algokit project run deploy -- guardian_vault
   ```
   
   Copy the deployed Application ID and add it to your `.env` file.

## Running the Application

### Development Mode
```bash
cd projects/backend
python -m app.main
```

Or using uvicorn directly:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Access the Application
- **Web Interface**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## API Endpoints

### Web Pages
- `GET /` - Home page
- `GET /dashboard` - Risk dashboard
- `GET /vault` - Vault management
- `GET /analysis` - AI analysis
- `GET /audit` - Audit log

### Analysis API
- `POST /api/analysis/analyze` - Analyze a transaction
- `GET /api/analysis/model-info` - Get AI model information

### Vault API
- `POST /api/vault/create` - Create a new vault
- `GET /api/vault/status` - Get vault status
- `POST /api/vault/update` - Update vault settings
- `POST /api/vault/freeze` - Freeze vault
- `POST /api/vault/unfreeze` - Unfreeze vault
- `POST /api/vault/check-transaction` - Check transaction against smart contract

### Audit API
- `GET /api/audit/log` - Get audit log (with pagination)
- `GET /api/audit/onchain/{index}` - Get on-chain audit entry
- `GET /api/audit/onchain/count` - Get on-chain audit count

## How It Works

### End-to-End Workflow

1. **User creates a Guardian Vault**
   - User navigates to `/vault`
   - Enters wallet address and risk threshold
   - Backend creates vault on blockchain
   - Smart contract stores vault settings

2. **User submits a transaction for analysis**
   - User navigates to `/analysis`
   - Fills in transaction details
   - Backend sends data to AI Engine

3. **AI analyzes the transaction**
   - AI Engine calls OpenRouter API
   - Returns risk score (0-100) and recommendation
   - Provides reasoning for the decision

4. **Blockchain enforces the decision**
   - Backend submits risk score to smart contract
   - Smart contract checks against threshold
   - Returns ALLOWED, BLOCKED, or FROZEN

5. **Audit log is updated**
   - Decision is logged on-chain (immutable)
   - Decision is logged off-chain (detailed metadata)
   - User can view audit history at `/audit`

### Security Features

- **AI has no direct asset access**: AI only provides recommendations
- **Blockchain enforces rules**: Smart contract has final authority
- **Immutable audit trail**: All decisions logged on-chain
- **User control**: User can freeze vault at any time
- **Risk threshold enforcement**: High-risk transactions automatically blocked

## Development

### Adding New Pages

1. Create a new template in `app/templates/`
2. Add a route in `app/main.py`:
   ```python
   @app.get("/new-page", response_class=HTMLResponse, tags=["web"])
   async def new_page(request: Request):
       return templates.TemplateResponse("new_page.html", {"request": request})
   ```

### Adding New API Endpoints

1. Create a new route file in `app/api/routes/`
2. Define your endpoints using FastAPI decorators
3. Include the router in `app/main.py`:
   ```python
   from app.api.routes import new_route
   app.include_router(new_route.router, prefix=settings.API_PREFIX)
   ```

### Customizing the UI

- **Tailwind CSS**: Edit classes in HTML templates
- **Custom CSS**: Add styles in `<style>` blocks in templates
- **JavaScript**: Add functionality in `app/static/js/main.js` or inline in templates

## Testing

### Run Tests
```bash
pytest
```

### Run Tests with Coverage
```bash
pytest --cov=app --cov-report=html
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Change `API_PORT` in `.env` file
   - Or kill the process using port 8000

2. **OpenRouter API errors**
   - Verify your API key is correct
   - Check your OpenRouter account has credits

3. **Smart contract not found**
   - Ensure the contract is deployed
   - Verify `GUARDIAN_VAULT_APP_ID` in `.env`

4. **Database errors**
   - Delete `chainguardian.db` and restart the app
   - Check file permissions

## Future Enhancements

- [ ] User authentication and authorization
- [ ] Multi-vault support
- [ ] Real-time WebSocket updates
- [ ] Advanced analytics dashboard
- [ ] Mobile-responsive improvements
- [ ] Dark mode support
- [ ] Multi-language support
- [ ] Integration with more DeFi protocols
- [ ] ML-based anomaly detection
- [ ] Yield prediction models

## License

This project is part of the ChainGuardian DeFi Risk & Compliance Assistant.

## Support

For issues and questions, please refer to the main project documentation.
