# 🚀 TIP-VF-clean-transfer Migration Test Plan

## Context
You are working in the `/Users/helpdesk/Cursor/TIP-VF-clean-transfer` directory. This is the target directory for the migration test. The system has both frontend (Next.js) and backend (Python Flask) components that need to be tested together.

## Current Issue
- Port 5000 is occupied by macOS AirPlay service (ControlCenter)
- Backend needs to run on port 5001 instead
- Frontend needs to be configured to connect to backend on port 5001

## Migration Test Protocol

### Phase 1: Environment Setup
1. **Verify Current Directory**
   ```bash
   pwd
   # Should show: /Users/helpdesk/Cursor/TIP-VF-clean-transfer
   ```

2. **Check Git Branch Status**
   ```bash
   git status
   git branch
   # Ensure we're on the correct branch for migration testing
   ```

3. **Verify Environment Configuration**
   ```bash
   cat .env.local
   # Should show PORT=5001 and NEXT_PUBLIC_API_URL=http://localhost:5001/api
   ```

### Phase 2: Port Configuration Fix
1. **Update Backend Port**
   ```bash
   echo "PORT=5001" >> .env.local
   ```

2. **Update Frontend API URL**
   ```bash
   sed -i '' 's|NEXT_PUBLIC_API_URL=http://localhost:5000/api|NEXT_PUBLIC_API_URL=http://localhost:5001/api|' .env.local
   ```

3. **Verify Changes**
   ```bash
   cat .env.local
   ```

### Phase 3: Clean Startup
1. **Kill Existing Processes**
   ```bash
   pkill -f "start-dev.sh" || true
   pkill -f "python.*main.py" || true
   pkill -f "next dev" || true
   lsof -ti:3001 | xargs kill -9 2>/dev/null
   lsof -ti:5001 | xargs kill -9 2>/dev/null
   ```

2. **Start Development Environment**
   ```bash
   chmod +x scripts/start-dev.sh
   ./scripts/start-dev.sh
   ```

### Phase 4: Server Verification
1. **Wait for Startup** (15-20 seconds)
2. **Test Frontend** (should be on port 3001)
   ```bash
   curl -I http://localhost:3001
   # Expected: HTTP/1.1 200 OK or 500 (Clerk auth issue is expected)
   ```

3. **Test Backend** (should be on port 5001)
   ```bash
   curl -I http://localhost:5001
   # Expected: HTTP/1.1 200 OK
   ```

4. **Test Backend Health Endpoint**
   ```bash
   curl http://localhost:5001/api/health
   # Should return health status
   ```

### Phase 5: Migration Testing
1. **Run Enhanced Models Migration**
   ```bash
   python migrate_enhanced_models.py
   # Should show: ✅ Enhanced models created successfully
   ```

2. **Verify Database Tables**
   ```bash
   ls -la database/
   # Should show app.db file
   ```

3. **Test Upload Flow**
   ```bash
   ./test-upload-flow.sh
   # Should test CSV upload functionality
   ```

### Phase 6: Integration Testing
1. **Test Frontend-Backend Communication**
   ```bash
   curl http://localhost:3001/api/health
   # Should proxy to backend
   ```

2. **Test Decision Intelligence Features**
   - Open http://localhost:3001 in browser
   - Navigate to /dashboard/decisions
   - Test CSV upload functionality
   - Verify decision recommendations

### Phase 7: Validation
1. **Run Test Suite**
   ```bash
   npm run test
   # Should run Jest tests
   ```

2. **Check Logs**
   ```bash
   tail -f logs/*.log 2>/dev/null || echo "No log files found"
   ```

## Success Criteria
- ✅ Frontend running on http://localhost:3001
- ✅ Backend running on http://localhost:5001
- ✅ Database migration completed successfully
- ✅ Upload flow working
- ✅ Decision intelligence features accessible
- ✅ No port conflicts with macOS services

## Troubleshooting
- **Port 5000 conflict**: Use port 5001 for backend
- **Clerk auth errors**: Expected in development, not blocking
- **Database issues**: Check database/app.db exists
- **Python dependencies**: Run `pip install -r requirements.txt`

## Next Steps After Success
1. Test all major user flows
2. Verify data persistence
3. Test multi-country support (CO/MX)
4. Validate decision intelligence algorithms
5. Document any issues found

---

**Use this plan as a step-by-step guide when working with Claude in the TIP-VF-clean-transfer directory.** 