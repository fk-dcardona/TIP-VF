import psutil
import json

# Get current memory usage
memory = psutil.virtual_memory()
stats = {
    "total": memory.total,
    "available": memory.available,
    "percent": memory.percent,
    "used": memory.used
}

with open("memory-stats.json", "w") as f:
    json.dump(stats, f, indent=2)

# Pass if memory usage is reasonable
exit(0 if memory.percent < 90 else 1)
