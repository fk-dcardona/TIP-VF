  # Supply Chain Intelligence MVP

A modern, modular supply chain management platform built with Next.js and Flask, featuring CSV data processing, analytics dashboards, and AI-powered automation agents.

## 🏗️ Architecture Overview

This application follows a **service-oriented architecture** with clear separation between frontend and backend services:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                      │
│  ┌─────────────────┐ ┌─────────────────┐ ┌──────────────┐  │
│  │   Dashboard     │ │   CSV Upload    │ │  AI Agents   │  │
│  │   Analytics     │ │   Processing    │ │  Management  │  │
│  └─────────────────┘ └─────────────────┘ └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │ HTTP/REST API
┌─────────────────────────────────────────────────────────────┐
│                   Backend Services (Flask)                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌──────────────┐  │
│  │   Upload API    │ │  Analytics API  │ │ Health Check │  │
│  │   File Storage  │ │  Data Processing│ │   Service    │  │
│  └─────────────────┘ └─────────────────┘ └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                              │
│  ┌─────────────────┐ ┌─────────────────┐ ┌──────────────┐  │
│  │    SQLite DB    │ │   File Storage  │ │    Cache     │  │
│  │   (Metadata)    │ │   (CSV Files)   │ │  (Analytics) │  │
│  └─────────────────┘ └─────────────────┘ └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- Git

### 1. Clone and Setup
```bash
git clone <repository-url>
cd mvp-spi-clean
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your Clerk credentials
# Get keys from: https://clerk.com/dashboard
```

### 3. Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Backend Setup
```bash
# Navigate to backend
cd backend-services

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
python src/main.py
```

### 5. Access Application
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## 📁 Project Structure

```
mvp-spi-clean/
├── src/                          # Frontend source code
│   ├── app/                      # Next.js app directory
│   │   ├── dashboard/            # Dashboard pages
│   │   │   ├── upload/           # CSV upload module
│   │   │   ├── analytics/        # Analytics module
│   │   │   └── agents/           # AI agents module
│   │   ├── sign-in/              # Authentication pages
│   │   └── sign-up/
│   ├── components/               # Reusable React components
│   └── lib/                      # Utility functions
├── backend-services/             # Backend service
│   ├── src/
│   │   ├── config/               # Configuration management
│   │   ├── routes/               # API route handlers
│   │   ├── services/             # Business logic services
│   │   ├── utils/                # Utility functions
│   │   └── models/               # Database models
│   └── requirements.txt          # Python dependencies
├── .env.example                  # Environment template
└── README.md                     # This file
```

## 🔧 Service Modules

### Frontend Modules

#### 1. Dashboard Module (`/dashboard`)
- **Purpose**: Main application interface
- **Features**: Overview cards, quick actions, navigation
- **Responsive**: Mobile-first design with Tailwind CSS

#### 2. CSV Upload Module (`/dashboard/upload`)
- **Purpose**: File upload and processing
- **Features**: Drag & drop, template downloads, progress tracking
- **API Integration**: Real-time upload status and validation

#### 3. Analytics Module (`/dashboard/analytics`)
- **Purpose**: Data visualization and insights
- **Features**: Interactive charts, KPI metrics, trend analysis
- **Data Source**: Processed CSV data from backend

#### 4. AI Agents Module (`/dashboard/agents`)
- **Purpose**: Automation management
- **Features**: Agent templates, creation wizard, performance monitoring
- **Templates**: Inventory monitor, supplier evaluator, demand forecaster

### Backend Services

#### 1. Upload Service (`/api/upload`)
- **Purpose**: File processing and storage
- **Features**: CSV validation, data parsing, metadata storage
- **Security**: File type validation, size limits, virus scanning

#### 2. Analytics Service (`/api/analytics`)
- **Purpose**: Data analysis and aggregation
- **Features**: Statistical analysis, trend calculation, KPI generation
- **Performance**: Caching, background processing

#### 3. Health Check Service (`/api/health`)
- **Purpose**: Service monitoring and diagnostics
- **Features**: System metrics, dependency checks, readiness probes
- **Monitoring**: CPU, memory, disk usage, database connectivity

## 🔒 Security Features

### Environment Variables
- **Development**: Uses `.env.local` for local development
- **Production**: Environment variables should be set via deployment platform
- **Secrets**: Never commit API keys or secrets to version control

### API Security
- **CORS**: Configured for cross-origin requests
- **File Upload**: Size limits, type validation
- **Error Handling**: Sanitized error messages in production
- **Logging**: Comprehensive request/response logging

### Authentication
- **Provider**: Clerk.com for robust authentication
- **Features**: Social login, email verification, session management
- **Security**: JWT tokens, secure session handling

## 📊 Monitoring and Debugging

### Health Checks
```bash
# Basic health check
curl http://localhost:5000/api/health

# Readiness check
curl http://localhost:5000/api/ready

# Liveness check
curl http://localhost:5000/api/live
```

### Logging
- **Frontend**: Browser console and Next.js logs
- **Backend**: Structured logging with configurable levels
- **Format**: Timestamp, service, level, message

### Error Handling
- **Frontend**: User-friendly error messages
- **Backend**: Centralized error handling with proper HTTP status codes
- **Debugging**: Detailed error traces in development mode

## 🚀 Deployment

### Frontend Deployment
```bash
# Build for production
npm run build

# Deploy to Vercel, Netlify, or similar
npm run deploy
```

### Backend Deployment
```bash
# Install production dependencies
pip install -r requirements.txt

# Set production environment variables
export NODE_ENV=production
export DEBUG=false

# Run with production WSGI server
gunicorn -w 4 -b 0.0.0.0:5000 src.main:app
```

### Environment Variables for Production
```bash
# Required
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...

# Optional
DATABASE_URL=postgresql://...
UPLOAD_FOLDER=/app/uploads
MAX_FILE_SIZE=52428800
LOG_LEVEL=INFO
```

## 🧪 Testing

### Frontend Testing
```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

### Backend Testing
```bash
# Run tests
python -m pytest

# Run with coverage
python -m pytest --cov=src
```

### API Testing
```bash
# Test upload endpoint
curl -X POST -F "file=@sample.csv" http://localhost:5000/api/upload

# Test health endpoint
curl http://localhost:5000/api/health
```

## 🔄 Development Workflow

### Adding New Features
1. **Frontend**: Create new page/component in appropriate module
2. **Backend**: Add new route in relevant service
3. **Integration**: Update API client and error handling
4. **Testing**: Add tests for new functionality
5. **Documentation**: Update README and API docs

### Debugging Issues
1. **Check Health**: Verify all services are running
2. **Review Logs**: Check both frontend and backend logs
3. **API Testing**: Test endpoints independently
4. **Database**: Verify data integrity and migrations

## 📚 API Documentation

### Upload Endpoints
- `POST /api/upload` - Upload CSV file
- `GET /api/uploads/{user_id}` - Get user uploads
- `GET /api/template/{type}` - Download CSV template

### Analytics Endpoints
- `GET /api/dashboard/{user_id}` - Get dashboard data
- `GET /api/analysis/{upload_id}` - Get detailed analysis

### System Endpoints
- `GET /api/health` - Comprehensive health check
- `GET /api/docs` - API documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes following the modular architecture
4. Add tests for new functionality
5. Update documentation
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the health endpoints for service status
2. Review logs for error details
3. Consult this README for architecture guidance
4. Create an issue with detailed reproduction steps

