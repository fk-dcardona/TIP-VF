# 🎮 Quick Commands for Daniel
*Copy-paste these when needed*

## 🚀 Starting Your Project

### Every Morning Routine:
```bash
# Terminal 1: Start the store window
cd "Supply Chain B2B SaaS Product"
npm run dev

# Terminal 2: Start the back room
cd "Supply Chain B2B SaaS Product"
python main.py

# Terminal 3: Check what changed
git status
```

## 🔧 Common Tasks

### "I changed something in the design":
```bash
# Just refresh your browser - changes appear automatically!
```

### "I want to save my work":
```bash
git add .
git commit -m "Describe what you changed"
```

### "Something's not working":
```bash
# Terminal 1: Stop and restart frontend
# Press Ctrl+C to stop, then:
npm run dev

# Terminal 2: Stop and restart backend
# Press Ctrl+C to stop, then:
python main.py
```

### "I need to install something new":
```bash
# For frontend stuff:
npm install [package-name]

# For backend stuff:
pip install [package-name]
```

## 🚨 Emergency Commands

### "Everything is broken!":
```bash
# Stop everything (Ctrl+C in all terminals)
# Then restart:

# Terminal 1:
npm install
npm run dev

# Terminal 2:
pip install -r requirements.txt
python main.py
```

### "I messed up and want to undo":
```bash
# See what you changed:
git status

# Undo all changes (careful!):
git checkout .

# Or undo specific file:
git checkout -- filename
```

## 🌐 Deployment Commands

### "Put the frontend online" (Vercel):
```bash
# First time:
npm install -g vercel
vercel

# Updates:
vercel --prod
```

### "Put the backend online" (Railway):
```bash
# First time:
npm install -g @railway/cli
railway login
railway link
railway up

# Updates:
railway up
```

## 📊 Checking Things

### "Is my frontend working?":
```bash
# Open browser to:
http://localhost:3000
```

### "Is my backend working?":
```bash
# Open browser to:
http://localhost:5000/api/health
```

### "What files did I change?":
```bash
git status
```

### "Show me the differences":
```bash
git diff
```

## 🔐 Environment Variables

### "Set up my secret keys":
```bash
# Copy the template:
cp .env.example .env.local

# Then edit .env.local with your values
```

### "Check if environment is loaded":
```bash
# In your code, console.log it:
console.log(process.env.NEXT_PUBLIC_API_URL)
```

## 💡 Pro Tips

### The "Always Works" Sequence:
```bash
# 1. Save your work
git add .
git commit -m "Save before fixing"

# 2. Stop everything (Ctrl+C)

# 3. Clean restart
npm install
npm run dev

# 4. Check it works
# Open http://localhost:3000
```

### The "Help Me" Command:
```bash
# Copy any error message, then ask:
"I got this error: [paste error here]
I was trying to: [what you did]
The screen shows: [what you see]"
```

## 📝 Notes Section
*Add your own frequently used commands here:*

```bash
# Your command:

# Your command:

# Your command:
```

---

## 🎯 Remember

- **Ctrl+C** = Stop what's running
- **Ctrl+V** = Paste
- **Tab** = Auto-complete file names
- **↑ Arrow** = Previous command
- **Clear** = Clean the terminal screen

---

*Tip: Keep this file open in a separate tab for quick reference!*