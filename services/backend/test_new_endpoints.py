#!/usr/bin/env python3
"""
Test suite for new incidents endpoints.
- POST /incidents — create (existing)
- GET /incidents — list with filters (existing)
- GET /incidents/summary — aggregated metrics (NEW)
- PATCH /incidents/{id}/status — state transition with validation (NEW)

Run with the API already running on http://localhost:8000
"""

import requests
import json
from typing import Optional

BASE_URL = "http://localhost:8000"
HEADERS = {"Content-Type": "application/json"}
AUTH_TOKEN: Optional[str] = None

# Test user credentials
TEST_EMAIL = "test-incidents@example.com"
TEST_PASSWORD = "testpassword123"


def get_auth_headers():
    """Return headers with JWT token."""
    headers = HEADERS.copy()
    if AUTH_TOKEN:
        headers["Authorization"] = f"Bearer {AUTH_TOKEN}"
    return headers


def login():
    """Authenticate and get JWT token."""
    global AUTH_TOKEN
    print("\n=== Login ===")
    
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        headers=HEADERS,
    )
    
    if response.status_code == 200:
        data = response.json()
        AUTH_TOKEN = data.get("access_token")
        print(f"✓ Login successful")
        return True
    else:
        print(f"✗ Login failed: {response.status_code}")
        return False


def test_summary():
    """Test GET /incidents/summary"""
    print("\n=== Test GET /incidents/summary ===")
    
    response = requests.get(
        f"{BASE_URL}/api/incidents/summary",
        headers=get_auth_headers(),
    )
    
    if response.status_code == 200:
        metrics = response.json()
        print(f"✓ Summary retrieved")
        print(f"  Total: {metrics['total']}")
        print(f"  By status: {metrics['by_status']}")
        print(f"  By category: {metrics['by_category']}")
        print(f"  By origin: {metrics['by_origin']}")
        print(f"  By branch: {metrics['by_branch']}")
        return True, metrics
    else:
        print(f"✗ Summary failed: {response.status_code}")
        return False, None


def test_create_and_transition():
    """Test creating an incident and transitioning its state"""
    print("\n=== Test Create + Transitions ===")
    
    # Create
    payload = {
        "title": "Test transition incident",
        "description": "Testing state transitions",
        "category": "customer_support",
        "origin": "customer",
        "branch": "central",
    }
    
    response = requests.post(
        f"{BASE_URL}/api/incidents",
        json=payload,
        headers=get_auth_headers(),
    )
    
    if response.status_code != 201:
        print(f"✗ Create failed: {response.status_code}")
        return False
    
    incident = response.json()
    incident_id = incident["id"]
    print(f"✓ Created incident: {incident_id[:8]}...")
    print(f"  Initial status: {incident['status']}")
    
    if incident["status"] != "open":
        print(f"✗ Expected initial status 'open', got '{incident['status']}'")
        return False
    
    # Transition: open → in_progress
    response = requests.patch(
        f"{BASE_URL}/api/incidents/{incident_id}/status",
        json={"status": "in_progress"},
        headers=get_auth_headers(),
    )
    
    if response.status_code == 200:
        incident = response.json()
        if incident["status"] == "in_progress":
            print(f"✓ Transition open → in_progress successful")
        else:
            print(f"✗ Status not updated: got {incident['status']}")
            return False
    else:
        print(f"✗ Transition failed: {response.status_code}")
        return False
    
    # Transition: in_progress → resolved
    response = requests.patch(
        f"{BASE_URL}/api/incidents/{incident_id}/status",
        json={"status": "resolved"},
        headers=get_auth_headers(),
    )
    
    if response.status_code == 200:
        incident = response.json()
        if incident["status"] == "resolved":
            print(f"✓ Transition in_progress → resolved successful")
        else:
            print(f"✗ Status not updated: got {incident['status']}")
            return False
    else:
        print(f"✗ Transition failed: {response.status_code}")
        return False
    
    # Try to transition from terminal state (should fail)
    response = requests.patch(
        f"{BASE_URL}/api/incidents/{incident_id}/status",
        json={"status": "open"},
        headers=get_auth_headers(),
    )
    
    if response.status_code == 400:
        error = response.json()
        print(f"✓ Correctly rejected transition from terminal state (resolved)")
        print(f"  Error: {error['detail'][:100]}...")
        return True
    else:
        print(f"✗ Should have rejected transition from 'resolved', got {response.status_code}")
        return False


def test_invalid_transitions():
    """Test that invalid transitions are rejected"""
    print("\n=== Test Invalid Transitions ===")
    
    # Create
    payload = {
        "title": "Test invalid transitions",
        "description": "Testing invalid state transitions",
        "category": "customer_support",
        "origin": "customer",
        "branch": "central",
    }
    
    response = requests.post(
        f"{BASE_URL}/api/incidents",
        json=payload,
        headers=get_auth_headers(),
    )
    
    if response.status_code != 201:
        print(f"✗ Create failed: {response.status_code}")
        return False
    
    incident_id = response.json()["id"]
    
    # Try invalid transition: open → resolved (should fail)
    response = requests.patch(
        f"{BASE_URL}/api/incidents/{incident_id}/status",
        json={"status": "resolved"},
        headers=get_auth_headers(),
    )
    
    if response.status_code == 400:
        error = response.json()
        print(f"✓ Correctly rejected open → resolved")
        print(f"  Error: {error['detail'][:80]}...")
        return True
    else:
        print(f"✗ Should have rejected open → resolved, got {response.status_code}")
        return False


def test_404_on_nonexistent():
    """Test that nonexistent incidents return 404"""
    print("\n=== Test 404 Handling ===")
    
    # Try to transition nonexistent incident
    response = requests.patch(
        f"{BASE_URL}/api/incidents/nonexistent-id/status",
        json={"status": "in_progress"},
        headers=get_auth_headers(),
    )
    
    if response.status_code == 404:
        print(f"✓ Correctly returned 404 for nonexistent incident")
        return True
    else:
        print(f"✗ Expected 404, got {response.status_code}")
        return False


def main():
    print("=" * 70)
    print("NEW INCIDENTS ENDPOINTS TEST SUITE")
    print("=" * 70)
    
    if not login():
        print("\n✗ Cannot proceed without authentication")
        return 1
    
    results = []
    
    # Test summary (requires some incidents in the DB)
    success, metrics = test_summary()
    results.append(("Summary Metrics", success))
    
    # Test create + valid transitions
    results.append(("Create + Valid Transitions", test_create_and_transition()))
    
    # Test invalid transitions
    results.append(("Invalid Transitions (Rejected)", test_invalid_transitions()))
    
    # Test 404 handling
    results.append(("404 Handling", test_404_on_nonexistent()))
    
    # Summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    for name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{status}: {name}")
    
    all_passed = all(passed for _, passed in results)
    print("=" * 70)
    
    if all_passed:
        print("\n✓ All new endpoint tests passed!")
        return 0
    else:
        print("\n✗ Some tests failed")
        return 1


if __name__ == "__main__":
    exit(main())
