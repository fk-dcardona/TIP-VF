# 🔄 Dependency Update Rollback Procedures

## Overview
This document outlines rollback procedures for reverting the Next.js 14.0.0 → 14.2.25 upgrade and removing --legacy-peer-deps.

## 🚨 When to Rollback
Rollback if you encounter:
- Build failures in production
- Runtime errors after deployment
- Clerk authentication issues
- Component rendering problems

## 📋 Rollback Steps

### Option 1: Git Revert (Recommended)
```bash
# Revert the dependency update commit
git revert <commit-hash>
git push origin main

# GitHub Actions will automatically redeploy
```

### Option 2: Manual Rollback
```bash
# 1. Restore backup files
cp package.json.backup package.json
cp package-lock.json.backup package-lock.json

# 2. Restore configuration files
git checkout main -- .github/workflows/deploy-production.yml
git checkout main -- .github/workflows/deploy-preview.yml
git checkout main -- vercel.json
git checkout main -- README.md
git checkout main -- CLAUDE.md

# 3. Reinstall dependencies with legacy flag
rm -rf node_modules
npm install --legacy-peer-deps

# 4. Commit and push
git add .
git commit -m "revert: rollback to Next.js 14.0.0 with --legacy-peer-deps"
git push origin main
```

### Option 3: Vercel Dashboard Rollback
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to "Deployments" tab
4. Find the last working deployment (before dependency update)
5. Click "..." menu → "Promote to Production"

### Option 4: GitHub Branch Rollback
```bash
# Create rollback branch from last known good commit
git checkout -b emergency/rollback <last-good-commit>
git push origin emergency/rollback

# Create PR and merge immediately
gh pr create --title "Emergency: Rollback dependency update" \
  --body "Reverting to Next.js 14.0.0 with --legacy-peer-deps" \
  --base main --head emergency/rollback
```

## 🔍 Verification After Rollback

### 1. Check Build Status
```bash
# Local verification
npm install --legacy-peer-deps
npm run build
npm run type-check
```

### 2. Monitor Production
- Health Check: https://finkargo.ai/api/health
- Application: https://finkargo.ai
- Vercel Dashboard: Check deployment status
- GitHub Actions: Verify workflow success

### 3. Clerk Authentication
- Test login/logout functionality
- Verify organization switching
- Check JWT token validation

## 📝 Post-Rollback Actions

1. **Document Issues**
   - Record exact error messages
   - Note which components failed
   - Save deployment logs

2. **Plan Fix**
   - Investigate root cause
   - Test in development environment
   - Consider gradual migration approach

3. **Communication**
   - Notify team of rollback
   - Update deployment status
   - Schedule retry attempt

## 🛡️ Prevention Strategies

1. **Staging Environment Testing**
   ```bash
   # Test on preview branch first
   git checkout -b test/dependency-update
   # Make changes and deploy to preview
   ```

2. **Gradual Rollout**
   - Deploy to preview environment
   - Test all critical paths
   - Monitor for 24 hours
   - Then deploy to production

3. **Backup Strategy**
   ```bash
   # Always create backups before major updates
   cp package*.json backup/
   git tag pre-dependency-update
   ```

## 📞 Emergency Contacts

- **Vercel Support**: https://vercel.com/support
- **Railway Support**: https://railway.app/support
- **GitHub Actions**: Check workflow logs in repository

## 🔧 Quick Reference Commands

```bash
# Check current Next.js version
npm list next

# Check Clerk version compatibility
npm view @clerk/nextjs peerDependencies

# Verify build without installing
npm install --dry-run

# Force clean install
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --legacy-peer-deps
```

---

**Remember**: Always test rollback procedures in a non-production environment first!