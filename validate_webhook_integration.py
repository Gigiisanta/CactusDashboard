#!/usr/bin/env python3
"""
Validation script for CactusDashboard webhook integration
This script validates that all webhook system components are properly integrated
"""

import os
import sys
import json
import subprocess
from pathlib import Path

def print_status(message, status="INFO"):
    """Print status message with color coding"""
    colors = {
        "INFO": "\033[94m",
        "SUCCESS": "\033[92m", 
        "WARNING": "\033[93m",
        "ERROR": "\033[91m",
        "RESET": "\033[0m"
    }
    print(f"{colors.get(status, '')}{status}: {message}{colors['RESET']}")

def check_file_exists(file_path, description):
    """Check if a file exists and print status"""
    if os.path.exists(file_path):
        print_status(f"✓ {description} exists: {file_path}", "SUCCESS")
        return True
    else:
        print_status(f"✗ {description} missing: {file_path}", "ERROR")
        return False

def check_file_content(file_path, search_terms, description):
    """Check if file contains specific terms"""
    try:
        with open(file_path, 'r') as f:
            content = f.read()
            
        found_terms = []
        missing_terms = []
        
        for term in search_terms:
            if term in content:
                found_terms.append(term)
            else:
                missing_terms.append(term)
        
        if missing_terms:
            print_status(f"✗ {description} - Missing: {missing_terms}", "ERROR")
            return False
        else:
            print_status(f"✓ {description} - All terms found", "SUCCESS")
            return True
            
    except Exception as e:
        print_status(f"✗ Error reading {file_path}: {e}", "ERROR")
        return False

def run_tests(test_path, description):
    """Run pytest tests and return status"""
    try:
        result = subprocess.run(
            ["python3", "-m", "pytest", test_path, "-v"],
            capture_output=True,
            text=True,
            cwd="/Users/prueba/Desktop/CactusDashboard"
        )
        
        if result.returncode == 0:
            print_status(f"✓ {description} - All tests passed", "SUCCESS")
            return True
        else:
            print_status(f"✗ {description} - Tests failed", "ERROR")
            print(result.stdout)
            print(result.stderr)
            return False
            
    except Exception as e:
        print_status(f"✗ Error running tests for {description}: {e}", "ERROR")
        return False

def main():
    """Main validation function"""
    print_status("Starting CactusDashboard Webhook Integration Validation", "INFO")
    print("=" * 60)
    
    validation_results = []
    
    # 1. Check webhook system files
    print_status("1. Checking webhook system files...", "INFO")
    webhook_files = [
        ("cactuscrm/webhook_service.py", "Webhook Service"),
        ("cactuscrm/webhook_config.py", "Webhook Configuration"),
        ("tests/test_webhook_service.py", "Webhook Tests"),
        ("data/tests/test_events.py", "Event Tests")
    ]
    
    for file_path, description in webhook_files:
        full_path = f"/Users/prueba/Desktop/CactusDashboard/{file_path}"
        validation_results.append(check_file_exists(full_path, description))
    
    # 2. Check backend integration
    print_status("\n2. Checking backend integration...", "INFO")
    backend_checks = [
        (
            "/Users/prueba/Desktop/CactusDashboard/cactus-wealth-backend/src/cactus_wealth/services.py",
            ["CactusWebhookService", "WebhookService", "webhook_service"],
            "Backend Services Integration"
        ),
        (
            "/Users/prueba/Desktop/CactusDashboard/cactus-wealth-backend/src/cactus_wealth/crud.py", 
            ["webhook_service"],
            "CRUD Operations Integration"
        ),
        (
            "/Users/prueba/Desktop/CactusDashboard/cactus-wealth-backend/src/cactus_wealth/worker.py",
            ["N8N_WEBHOOK_URL"],
            "Worker Configuration"
        )
    ]
    
    for file_path, terms, description in backend_checks:
        validation_results.append(check_file_content(file_path, terms, description))
    
    # 3. Check environment configuration
    print_status("\n3. Checking environment configuration...", "INFO")
    env_checks = [
        (
            "/Users/prueba/Desktop/CactusDashboard/.env.example",
            ["WEBHOOK_RETRY_COUNT", "WEBHOOK_TIMEOUT", "WEBHOOK_SECRET", "N8N_WEBHOOK_URL"],
            "Environment Variables"
        )
    ]
    
    for file_path, terms, description in env_checks:
        validation_results.append(check_file_content(file_path, terms, description))
    
    # 4. Check removed services
    print_status("\n4. Checking removed services...", "INFO")
    removed_services_checks = [
        (
            "/Users/prueba/Desktop/CactusDashboard/.env.example",
            ["TWENTY_CRM_URL", "SYNC_BRIDGE_URL"],
            "Removed Services (should NOT be found)"
        )
    ]
    
    # For removed services, we want to check they are NOT present
    try:
        with open("/Users/prueba/Desktop/CactusDashboard/.env.example", 'r') as f:
            content = f.read()
            
        removed_found = []
        for term in ["TWENTY_CRM_URL", "SYNC_BRIDGE_URL"]:
            if term in content:
                removed_found.append(term)
        
        if removed_found:
            print_status(f"✗ Old services still referenced: {removed_found}", "ERROR")
            validation_results.append(False)
        else:
            print_status("✓ Old services properly removed", "SUCCESS")
            validation_results.append(True)
            
    except Exception as e:
        print_status(f"✗ Error checking removed services: {e}", "ERROR")
        validation_results.append(False)
    
    # 5. Run tests
    print_status("\n5. Running tests...", "INFO")
    test_results = [
        run_tests("tests/test_webhook_service.py", "Webhook Service Tests"),
        run_tests("data/tests/test_events.py", "Event Integration Tests")
    ]
    validation_results.extend(test_results)
    
    # 6. Check documentation
    print_status("\n6. Checking documentation...", "INFO")
    doc_files = [
        ("docs/benchmark.md", "Benchmark Documentation"),
        ("README_OPTIMIZED.md", "Optimized README"),
        ("scripts/update.sh", "Update Script")
    ]
    
    for file_path, description in doc_files:
        full_path = f"/Users/prueba/Desktop/CactusDashboard/{file_path}"
        validation_results.append(check_file_exists(full_path, description))
    
    # Summary
    print("\n" + "=" * 60)
    print_status("VALIDATION SUMMARY", "INFO")
    
    total_checks = len(validation_results)
    passed_checks = sum(validation_results)
    failed_checks = total_checks - passed_checks
    
    print_status(f"Total checks: {total_checks}", "INFO")
    print_status(f"Passed: {passed_checks}", "SUCCESS")
    
    if failed_checks > 0:
        print_status(f"Failed: {failed_checks}", "ERROR")
        print_status("❌ VALIDATION FAILED - Some components need attention", "ERROR")
        return False
    else:
        print_status("✅ VALIDATION PASSED - All webhook integration components are properly configured!", "SUCCESS")
        return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)