#!/usr/bin/env python3
"""
Backend Agent Performance Validation Script
Tests Flask backend performance and Agent Astra integration
"""

import asyncio
import aiohttp
import time
import json
import statistics
from typing import Dict, List, Any
from datetime import datetime
import concurrent.futures
import psutil
import os

class BackendPerformanceTester:
    def __init__(self, base_url: str = "http://localhost:5000"):
        self.base_url = base_url
        self.results = {}
        
    async def test_health_endpoints(self) -> Dict[str, Any]:
        """Test health check endpoint performance"""
        print("🔍 Testing health endpoints...")
        
        endpoints = ["/api/health", "/api/ready", "/api/live"]
        results = {}
        
        async with aiohttp.ClientSession() as session:
            for endpoint in endpoints:
                times = []
                for i in range(10):
                    start = time.perf_counter()
                    try:
                        async with session.get(f"{self.base_url}{endpoint}") as response:
                            await response.json()
                            duration = (time.perf_counter() - start) * 1000
                            times.append(duration)
                    except Exception as e:
                        print(f"❌ Error testing {endpoint}: {e}")
                        times.append(float('inf'))
                
                if times and all(t != float('inf') for t in times):
                    results[endpoint] = {
                        "avg_ms": round(statistics.mean(times), 2),
                        "min_ms": round(min(times), 2),
                        "max_ms": round(max(times), 2),
                        "p95_ms": round(statistics.quantiles(times, n=20)[18], 2) if len(times) >= 20 else round(max(times), 2),
                        "status": "✅ HEALTHY"
                    }
                else:
                    results[endpoint] = {"status": "❌ FAILED"}
        
        return results
    
    async def test_document_processing_performance(self) -> Dict[str, Any]:
        """Test document processing speed with Agent Astra"""
        print("📄 Testing document processing performance...")
        
        # Create test CSV content
        test_csv = """Company,Product,Quantity,Price,Total
Supplier A,Widget A,100,10.50,1050.00
Supplier B,Widget B,200,15.75,3150.00
Supplier C,Widget C,150,8.25,1237.50"""
        
        results = {}
        processing_times = []
        
        async with aiohttp.ClientSession() as session:
            for i in range(5):  # Test 5 uploads
                start = time.perf_counter()
                
                # Create form data
                data = aiohttp.FormData()
                data.add_field('file', test_csv, filename=f'test_{i}.csv', content_type='text/csv')
                data.add_field('org_id', 'test_org_benchmark')
                
                try:
                    async with session.post(f"{self.base_url}/api/upload", data=data) as response:
                        if response.status == 200:
                            result = await response.json()
                            duration = (time.perf_counter() - start) * 1000
                            processing_times.append(duration)
                        else:
                            print(f"❌ Upload failed with status {response.status}")
                except Exception as e:
                    print(f"❌ Error during upload {i}: {e}")
        
        if processing_times:
            results = {
                "iterations": len(processing_times),
                "avg_ms": round(statistics.mean(processing_times), 2),
                "min_ms": round(min(processing_times), 2),
                "max_ms": round(max(processing_times), 2),
                "p95_ms": round(statistics.quantiles(processing_times, n=20)[18], 2) if len(processing_times) >= 20 else round(max(processing_times), 2),
                "throughput_per_sec": round(1000 / statistics.mean(processing_times), 2),
                "status": "✅ PERFORMING"
            }
        else:
            results = {"status": "❌ NO_DATA"}
        
        return results
    
    async def test_analytics_performance(self) -> Dict[str, Any]:
        """Test analytics engine performance"""
        print("📊 Testing analytics performance...")
        
        analytics_times = []
        
        async with aiohttp.ClientSession() as session:
            for i in range(10):
                start = time.perf_counter()
                
                try:
                    async with session.get(f"{self.base_url}/api/analytics/test_org_benchmark") as response:
                        if response.status == 200:
                            await response.json()
                            duration = (time.perf_counter() - start) * 1000
                            analytics_times.append(duration)
                except Exception as e:
                    print(f"❌ Analytics test {i} failed: {e}")
        
        if analytics_times:
            return {
                "iterations": len(analytics_times),
                "avg_ms": round(statistics.mean(analytics_times), 2),
                "min_ms": round(min(analytics_times), 2),
                "max_ms": round(max(analytics_times), 2),
                "status": "✅ OPTIMAL"
            }
        else:
            return {"status": "❌ FAILED"}
    
    async def test_concurrent_load(self, concurrent_requests: int = 20) -> Dict[str, Any]:
        """Test concurrent request handling"""
        print(f"🚀 Testing concurrent load ({concurrent_requests} requests)...")
        
        start_time = time.perf_counter()
        
        async def make_request(session, req_id):
            try:
                async with session.get(f"{self.base_url}/api/health") as response:
                    return {
                        "request_id": req_id,
                        "status": response.status,
                        "success": response.status == 200
                    }
            except Exception as e:
                return {
                    "request_id": req_id,
                    "status": 0,
                    "success": False,
                    "error": str(e)
                }
        
        async with aiohttp.ClientSession() as session:
            tasks = [make_request(session, i) for i in range(concurrent_requests)]
            responses = await asyncio.gather(*tasks)
        
        total_time = (time.perf_counter() - start_time) * 1000
        successful = sum(1 for r in responses if r["success"])
        
        return {
            "concurrent_requests": concurrent_requests,
            "successful_requests": successful,
            "success_rate": round(successful / concurrent_requests * 100, 1),
            "total_time_ms": round(total_time, 2),
            "requests_per_sec": round(concurrent_requests / (total_time / 1000), 2),
            "status": "✅ SCALABLE" if successful >= concurrent_requests * 0.95 else "⚠️ DEGRADED"
        }
    
    def test_memory_usage(self) -> Dict[str, Any]:
        """Test memory usage of the current process"""
        print("🧠 Testing memory usage...")
        
        process = psutil.Process()
        memory_info = process.memory_info()
        memory_percent = process.memory_percent()
        
        return {
            "rss_mb": round(memory_info.rss / 1024 / 1024, 2),
            "vms_mb": round(memory_info.vms / 1024 / 1024, 2),
            "memory_percent": round(memory_percent, 2),
            "status": "✅ EFFICIENT" if memory_percent < 10 else "⚠️ HIGH_USAGE"
        }
    
    async def run_all_tests(self) -> Dict[str, Any]:
        """Run all performance tests"""
        print("🏁 Starting Backend Performance Benchmark...")
        print("=" * 60)
        
        start_time = datetime.now()
        
        # Test health endpoints
        self.results["health_endpoints"] = await self.test_health_endpoints()
        
        # Test document processing
        self.results["document_processing"] = await self.test_document_processing_performance()
        
        # Test analytics
        self.results["analytics_engine"] = await self.test_analytics_performance()
        
        # Test concurrent load
        self.results["concurrent_load"] = await self.test_concurrent_load()
        
        # Test memory usage
        self.results["memory_usage"] = self.test_memory_usage()
        
        # Calculate overall metrics
        end_time = datetime.now()
        
        self.results["benchmark_summary"] = {
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "duration_seconds": round((end_time - start_time).total_seconds(), 2),
            "tests_completed": len(self.results),
            "overall_status": self._calculate_overall_status()
        }
        
        return self.results
    
    def _calculate_overall_status(self) -> str:
        """Calculate overall benchmark status"""
        statuses = []
        
        for category, data in self.results.items():
            if isinstance(data, dict) and "status" in data:
                if "✅" in data["status"]:
                    statuses.append("pass")
                elif "⚠️" in data["status"]:
                    statuses.append("warning")
                elif "❌" in data["status"]:
                    statuses.append("fail")
        
        if not statuses:
            return "❓ UNKNOWN"
        
        fail_count = statuses.count("fail")
        warning_count = statuses.count("warning")
        
        if fail_count == 0 and warning_count == 0:
            return "✅ EXCELLENT"
        elif fail_count == 0:
            return "⚠️ GOOD_WITH_WARNINGS"
        else:
            return "❌ NEEDS_ATTENTION"
    
    def print_results(self):
        """Print formatted benchmark results"""
        print("\n" + "=" * 60)
        print("🎯 BACKEND PERFORMANCE BENCHMARK RESULTS")
        print("=" * 60)
        
        for category, data in self.results.items():
            print(f"\n📋 {category.upper().replace('_', ' ')}")
            print("-" * 40)
            
            if isinstance(data, dict):
                for key, value in data.items():
                    if key != "status":
                        print(f"  {key}: {value}")
                if "status" in data:
                    print(f"  STATUS: {data['status']}")
            else:
                print(f"  {data}")
        
        print("\n" + "=" * 60)
        print(f"🏆 OVERALL RESULT: {self.results.get('benchmark_summary', {}).get('overall_status', 'UNKNOWN')}")
        print("=" * 60)

def main():
    """Main benchmark execution"""
    tester = BackendPerformanceTester()
    
    # Check if backend is running
    print("🔍 Checking if backend is running on http://localhost:5000...")
    
    try:
        import requests
        response = requests.get("http://localhost:5000/api/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running and healthy!")
        else:
            print(f"⚠️ Backend returned status {response.status_code}")
    except Exception as e:
        print(f"❌ Backend not accessible: {e}")
        print("Please start the backend with: python main.py")
        return
    
    # Run async benchmark
    async def run_benchmark():
        results = await tester.run_all_tests()
        tester.print_results()
        
        # Save results to file
        with open("test-reports/backend-performance-results.json", "w") as f:
            json.dump(results, f, indent=2)
        
        print(f"\n💾 Results saved to test-reports/backend-performance-results.json")
        
        return results
    
    # Execute benchmark
    return asyncio.run(run_benchmark())

if __name__ == "__main__":
    main()