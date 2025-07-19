# Testing Clerk Organizations Flow

## Step 1: Start the Development Servers

### Terminal 1 - Start Next.js Frontend:
```bash
cd "/Users/helpdesk/Cursor/TIP - Mannus/Supply Chain B2B SaaS Product"
npm run dev
```

### Terminal 2 - Start Python Backend:
```bash
cd "/Users/helpdesk/Cursor/TIP - Mannus/Supply Chain B2B SaaS Product"
python3 main.py
```

## Step 2: Test the Organization Flow

1. **Open browser to http://localhost:3000**
   - You should see the landing page with "Get Started" and "Sign In" buttons

2. **Click "Get Started" (Sign Up)**
   - Create a new account with your email
   - After signup, you'll be redirected to `/onboarding`

3. **On the Onboarding Page:**
   - Enter an organization name (e.g., "Acme Corp")
   - Click "Create Organization"
   - You'll be redirected to the dashboard

4. **On the Dashboard:**
   - You should see your email in the header
   - There's an organization switcher next to "Supply Chain Intelligence"
   - Click on different modules (Upload CSV, Analytics, AI Agents)

## Step 3: Test Multi-User Same Organization

1. **Open an incognito/private browser window**
2. **Sign up with a different email but same domain**
   - e.g., if first user was john@acme.com, use jane@acme.com
3. **On onboarding, you can:**
   - Create a new organization OR
   - Join existing (if invited)

## Step 4: Test Data Isolation

When uploading CSV files or creating data:
- Each organization's data is isolated
- Users can only see data from their organization
- The backend will filter all queries by `org_id`

## API Testing with Organization Context

### Headers Required:
```
X-User-Id: clerk_user_id
X-Org-Id: clerk_org_id
```

### Example API Call:
```bash
curl -X POST http://localhost:5000/api/upload \
  -H "X-User-Id: user_123" \
  -H "X-Org-Id: org_456" \
  -F "file=@sample.csv"
```

## Troubleshooting

### If you see "Organization required" errors:
1. Make sure you created an organization in onboarding
2. Check that Clerk Organizations is enabled in your Clerk dashboard

### If backend fails to start:
1. Install Python dependencies: `pip install -r requirements.txt`
2. Make sure you're using Python 3.8+

### If frontend fails with Clerk errors:
1. Make sure your Clerk keys are in `.env.local`
2. Verify Organizations feature is enabled in Clerk dashboard