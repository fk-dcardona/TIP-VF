# Backend Structure

## Current Organization

The Flask backend is organized as follows:

```
├── main.py                 # Flask application entry point
├── models.py              # Database models (Organization, Upload, ProcessedData, Agent)
├── supply_chain_engine.py # Analytics engine
├── insights_engine.py     # AI insights generation
├── config/
│   └── settings.py        # Configuration management
├── routes/
│   ├── analytics.py       # Analytics API endpoints
│   ├── insights.py        # Insights API endpoints
│   └── upload_routes.py   # File upload endpoints
├── services/
│   └── health_check.py    # Health check endpoint
└── utils/
    ├── error_handler.py   # Error handling
    └── logger.py          # Logging configuration
```

## API Endpoints

- `POST /api/upload` - Upload CSV/Excel files
- `GET /api/uploads/<user_id>` - Get user's uploads
- `GET /api/upload/<upload_id>` - Get upload details
- `GET /api/template/<data_type>` - Download template files
- `GET /api/dashboard/<user_id>` - Get dashboard data
- `GET /api/insights/<user_id>` - Get AI insights
- `GET /health` - Health check endpoint

## Running the Backend

```bash
# Activate virtual environment
source venv311/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
```

The backend runs on port 5000 by default.