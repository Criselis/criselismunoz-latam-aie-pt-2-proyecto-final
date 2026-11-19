#!/usr/bin/env python3
"""
HTTP API tests for the Incidents endpoints.
Requires the API to be running on http://localhost:8000

Run with: python test_incidents_api.py
"""

import requests
import json
import time
from typing import Optional


BASE_URL = "http://localhost:8000"
HEADERS = {"Content-Type": "application/json"}

# Test user credentials
TEST_EMAIL = "test-incidents@example.com"
TEST_PASSWORD = "testpassword123"

# Token storage
AUTH_TOKEN: Optional[str] = None


def login():
    """Authenticate and get JWT token."""
    global AUTH_TOKEN
    print("\n=== Authentication ===")
    
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        headers=HEADERS,
    )
    
    if response.status_code != 200:
        print(f"✗ Login failed: {response.status_code}")
        print(f"  {response.text[:200]}")
        return False
    
    data = response.json()
    AUTH_TOKEN = data.get("access_token")
    if not AUTH_TOKEN:
        print("✗ No access token in response")
        return False
    
    print(f"✓ Login successful, token obtained")
    return True


def get_auth_headers():
    """Return headers with JWT token."""
    headers = HEADERS.copy()
    if AUTH_TOKEN:
        headers["Authorization"] = f"Bearer {AUTH_TOKEN}"
    return headers


def test_health():
    """Test health endpoint (no auth required)."""
    print("\n=== Testing Health Endpoint ===")
    
    response = requests.get(f"{BASE_URL}/health")
    if response.status_code == 200:
        data = response.json()
        if data.get("status") == "ok":
            print("✓ Health check passed")
            return True
    
    print(f"✗ Health check failed: {response.status_code}")
    return False


def test_list_incidents():
    """Test GET /incidents"""
    print("\n=== Testing List Incidents ===")
    
    response = requests.get(
        f"{BASE_URL}/api/incidents",
        headers=get_auth_headers(),
    )
    
    if response.status_code == 200:
        incidents = response.json()
        if isinstance(incidents, list):
            print(f"✓ List incidents: {len(incidents)} incidents returned")
            return True, incidents
    
    print(f"✗ List incidents failed: {response.status_code}")
    print(f"  {response.text[:200]}")
    return False, []


def test_filter_incidents():
    """Test GET /incidents with filters"""
    print("\n=== Testing Filter Incidents ===")
    
    # Filter by status
    response = requests.get(
        f"{BASE_URL}/api/incidents?status=open",
        headers=get_auth_headers(),
    )
    if response.status_code == 200:
        incidents = response.json()
        if all(i.get("status") == "open" for i in incidents):
            print(f"✓ Filter by status: {len(incidents)} open incidents")
        else:
            print(f"✗ Filter returned wrong status")
            return False
    else:
        print(f"✗ Filter failed: {response.status_code}")
        return False
    
    # Filter by category
    response = requests.get(
        f"{BASE_URL}/api/incidents?category=customer_support",
        headers=get_auth_headers(),
    )
    if response.status_code == 200:
        incidents = response.json()
        if all(i.get("category") == "customer_support" for i in incidents):
            print(f"✓ Filter by category: {len(incidents)} customer_support incidents")
        else:
            print(f"✗ Filter returned wrong category")
            return False
    else:
        print(f"✗ Filter failed: {response.status_code}")
        return False
    
    # Search
    response = requests.get(
        f"{BASE_URL}/api/incidents?search=portal",
        headers=get_auth_headers(),
    )
    if response.status_code == 200:
        incidents = response.json()
        print(f"✓ Search: {len(incidents)} incidents matching 'portal'")
        return True
    else:
        print(f"✗ Search failed: {response.status_code}")
        return False


def test_create_incident():
    """Test POST /incidents"""
    print("\n=== Testing Create Incident ===")
    
    payload = {
        "title": "Test incident from API",
        "description": "This is a test incident created via HTTP API",
        "category": "customer_support",
        "origin": "customer",
        "branch": "central",
    }
    
    response = requests.post(
        f"{BASE_URL}/api/incidents",
        json=payload,
        headers=get_auth_headers(),
    )
    
    if response.status_code == 201:
        incident = response.json()
        incident_id = incident.get("id")
        if incident_id:
            print(f"✓ Create incident: {incident_id[:8]}... created")
            return True, incident_id
    else:
        print(f"✗ Create incident failed: {response.status_code}")
        print(f"  {response.text[:200]}")
        return False, None


def test_invalid_incident():
    """Test validation by creating invalid incidents"""
    print("\n=== Testing Validation ===")
    
    # Empty title
    payload = {
        "title": "   ",
        "description": "This should fail",
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
        print(f"✓ Validation: empty title rejected ({response.status_code})")
    else:
        print(f"✗ Validation: empty title was accepted")
        return False
    
    # Invalid category
    payload = {
        "title": "Test",
        "description": "This should fail",
        "category": "invalid_category",
        "origin": "customer",
        "branch": "central",
    }
    
    response = requests.post(
        f"{BASE_URL}/api/incidents",
        json=payload,
        headers=get_auth_headers(),
    )
    
    if response.status_code != 201:
        print(f"✓ Validation: invalid category rejected ({response.status_code})")
    else:
        print(f"✗ Validation: invalid category was accepted")
        return False
    
    return True


def test_update_incident(incident_id: str):
    """Test PATCH /incidents/{id}"""
    print("\n=== Testing Update Incident ===")
    
    payload = {
        "status": "in_progress",
    }
    
    response = requests.patch(
        f"{BASE_URL}/api/incidents/{incident_id}",
        json=payload,
        headers=get_auth_headers(),
    )
    
    if response.status_code == 200:
        incident = response.json()
        if incident.get("status") == "in_progress":
            print(f"✓ Update incident: status changed to 'in_progress'")
            return True
    
    print(f"✗ Update incident failed: {response.status_code}")
    return False


def test_get_incident(incident_id: str):
    """Test GET /incidents/{id}"""
    print("\n=== Testing Get Single Incident ===")
    
    response = requests.get(
        f"{BASE_URL}/api/incidents/{incident_id}",
        headers=get_auth_headers(),
    )
    
    if response.status_code == 200:
        incident = response.json()
        if incident.get("id") == incident_id:
            print(f"✓ Get incident: {incident['id'][:8]}... retrieved")
            return True
    
    print(f"✗ Get incident failed: {response.status_code}")
    return False


def test_delete_incident(incident_id: str):
    """Test DELETE /incidents/{id}"""
    print("\n=== Testing Delete Incident ===")
    
    response = requests.delete(
        f"{BASE_URL}/api/incidents/{incident_id}",
        headers=get_auth_headers(),
    )
    
    if response.status_code == 204:
        print(f"✓ Delete incident: {incident_id[:8]}... deleted")
        
        # Verify deletion
        response = requests.get(
            f"{BASE_URL}/api/incidents/{incident_id}",
            headers=get_auth_headers(),
        )
        if response.status_code == 404:
            print(f"✓ Verify: incident no longer exists")
            return True
        else:
            print(f"✗ Verify: incident still exists")
            return False
    
    print(f"✗ Delete incident failed: {response.status_code}")
    return False


def test_auth_required():
    """Test that auth is required for protected endpoints"""
    print("\n=== Testing Authentication Requirement ===")
    
    # Try without token
    response = requests.get(f"{BASE_URL}/api/incidents")
    if response.status_code == 401:
        print("✓ Auth required: /incidents returns 401 without token")
        return True
    
    print(f"✗ Auth requirement failed: got {response.status_code} instead of 401")
    return False


def main():
    print("=" * 70)
    print("INCIDENTS API HTTP VALIDATION TEST SUITE")
    print("=" * 70)
    print(f"Target: {BASE_URL}")
    
    results = []
    
    # Test health first (no auth required)
    results.append(("Health Check", test_health()))
    
    # Test auth requirement
    results.append(("Auth Required", test_auth_required()))
    
    # Login
    if not login():
        print("\n✗ Cannot proceed without authentication")
        return 1
    
    # Test endpoints
    results.append(("List Incidents", test_list_incidents()[0]))
    results.append(("Filter Incidents", test_filter_incidents()))
    results.append(("Validate Input", test_invalid_incident()))
    
    # Test CRUD on a new incident
    success, incident_id = test_create_incident()
    results.append(("Create Incident", success))
    
    if success and incident_id:
        results.append(("Get Incident", test_get_incident(incident_id)))
        results.append(("Update Incident", test_update_incident(incident_id)))
        results.append(("Delete Incident", test_delete_incident(incident_id)))
    
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
        print("\n✓ All API tests passed!")
        return 0
    else:
        print("\n✗ Some API tests failed")
        return 1


if __name__ == "__main__":
    exit(main())
