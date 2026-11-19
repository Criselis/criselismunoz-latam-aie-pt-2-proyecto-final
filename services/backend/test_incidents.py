#!/usr/bin/env python3
"""
Manual validation tests for the Incidents API.
Run with: python test_incidents.py
"""

import json
import time
from pydantic import ValidationError
from app.schemas import (
    IncidentCreate,
    IncidentUpdate,
    IncidentStatus,
    IncidentOrigin,
    IncidentCategory,
    IncidentBranch,
)
from app.crud.incidents import (
    create_incident,
    get_incident_by_id,
    get_all_incidents,
    update_incident,
    delete_incident,
    seed_incidents,
)
from app.database import incidents_table


def test_validation():
    """Test that the schema rejects invalid data."""
    print("\n=== Testing Schema Validation ===")

    # Valid incident
    try:
        valid = IncidentCreate(
            title="  Test incident  ",
            description="  Test description  ",
            category=IncidentCategory.customer_support,
            origin=IncidentOrigin.customer,
            branch=IncidentBranch.central,
        )
        assert valid.title == "Test incident"
        assert valid.description == "Test description"
        print("✓ Valid incident accepted and text trimmed")
    except Exception as e:
        print(f"✗ Failed to create valid incident: {e}")
        return False

    # Reject empty title
    try:
        IncidentCreate(
            title="   ",
            description="desc",
            category=IncidentCategory.customer_support,
            origin=IncidentOrigin.customer,
            branch=IncidentBranch.central,
        )
        print("✗ Empty title was accepted (should reject)")
        return False
    except ValidationError:
        print("✓ Empty title correctly rejected")

    # Reject missing title
    try:
        IncidentCreate(
            title="",
            description="desc",
            category=IncidentCategory.customer_support,
            origin=IncidentOrigin.customer,
            branch=IncidentBranch.central,
        )
        print("✗ Missing title was accepted (should reject)")
        return False
    except ValidationError:
        print("✓ Missing title correctly rejected")

    # Reject invalid category
    try:
        IncidentCreate(
            title="Test",
            description="desc",
            category="invalid_category",
            origin=IncidentOrigin.customer,
            branch=IncidentBranch.central,
        )
        print("✗ Invalid category was accepted (should reject)")
        return False
    except ValidationError:
        print("✓ Invalid category correctly rejected")

    # Reject invalid origin
    try:
        IncidentCreate(
            title="Test",
            description="desc",
            category=IncidentCategory.customer_support,
            origin="invalid_origin",
            branch=IncidentBranch.central,
        )
        print("✗ Invalid origin was accepted (should reject)")
        return False
    except ValidationError:
        print("✓ Invalid origin correctly rejected")

    # Reject invalid branch
    try:
        IncidentCreate(
            title="Test",
            description="desc",
            category=IncidentCategory.customer_support,
            origin=IncidentOrigin.customer,
            branch="invalid_branch",
        )
        print("✗ Invalid branch was accepted (should reject)")
        return False
    except ValidationError:
        print("✓ Invalid branch correctly rejected")

    # Test all valid statuses
    valid_statuses = {"open", "in_progress", "resolved", "discarded"}
    actual_statuses = {s.value for s in IncidentStatus}
    if actual_statuses == valid_statuses:
        print(f"✓ Status enum contains all required values: {actual_statuses}")
    else:
        print(f"✗ Status enum mismatch. Expected: {valid_statuses}, Got: {actual_statuses}")
        return False

    # Test all valid categories
    valid_categories = {
        "recruitment_operations",
        "corporate_training",
        "customer_support",
        "sales_business_development",
        "marketing_communications",
        "human_resources",
        "technology_infrastructure",
        "executive_management",
    }
    actual_categories = {c.value for c in IncidentCategory}
    if actual_categories == valid_categories:
        print(f"✓ Category enum contains all required values")
    else:
        print(f"✗ Category enum mismatch")
        return False

    # Test all valid origins
    valid_origins = {"customer", "branch", "internal"}
    actual_origins = {o.value for o in IncidentOrigin}
    if actual_origins == valid_origins:
        print(f"✓ Origin enum contains all required values: {actual_origins}")
    else:
        print(f"✗ Origin enum mismatch")
        return False

    # Test all valid branches
    valid_branches = {"central", "valencia", "miami"}
    actual_branches = {b.value for b in IncidentBranch}
    if actual_branches == valid_branches:
        print(f"✓ Branch enum contains all required values: {actual_branches}")
    else:
        print(f"✗ Branch enum mismatch")
        return False

    return True


def test_crud_operations():
    """Test CRUD operations."""
    print("\n=== Testing CRUD Operations ===")

    # Clear for testing
    incidents_table.truncate()
    
    # Seed initial data
    seed_incidents()
    initial_count = len(incidents_table.all())
    print(f"✓ Seed: {initial_count} incidents loaded")

    # Create
    incident_data = IncidentCreate(
        title="Test Incident",
        description="This is a test incident for validation",
        category=IncidentCategory.customer_support,
        origin=IncidentOrigin.customer,
        branch=IncidentBranch.central,
    )
    incident = create_incident(incident_data)
    assert incident["id"] is not None
    assert incident["title"] == "Test Incident"
    assert incident["description"] == "This is a test incident for validation"
    assert incident["status"] == "open"
    assert incident["created_at"] is not None
    assert incident["updated_at"] is not None
    print(f"✓ Create: incident {incident['id'][:8]}... created with status 'open'")

    # Read by ID
    fetched = get_incident_by_id(incident["id"])
    assert fetched is not None
    assert fetched["id"] == incident["id"]
    print(f"✓ Read: incident retrieved by ID")

    # Read all
    all_incidents = get_all_incidents()
    assert len(all_incidents) >= initial_count + 1
    print(f"✓ Total: {len(all_incidents)} incidents (seed + created)")

    # Filter by status
    open_incidents = get_all_incidents(status="open")
    assert len(open_incidents) > 0
    print(f"✓ Filter by status: found {len(open_incidents)} open incidents")

    # Filter by category
    support_incidents = get_all_incidents(category="customer_support")
    assert len(support_incidents) > 0
    print(f"✓ Filter by category: found {len(support_incidents)} customer_support incidents")

    # Filter by origin
    customer_incidents = get_all_incidents(origin="customer")
    assert len(customer_incidents) > 0
    print(f"✓ Filter by origin: found {len(customer_incidents)} customer incidents")

    # Filter by branch
    central_incidents = get_all_incidents(branch="central")
    assert len(central_incidents) > 0
    print(f"✓ Filter by branch: found {len(central_incidents)} central incidents")

    # Search
    search_results = get_all_incidents(search="portal")
    assert len(search_results) > 0
    print(f"✓ Search: found {len(search_results)} incidents matching 'portal'")

    # Update
    update_data = IncidentUpdate(status=IncidentStatus.in_progress)
    updated = update_incident(incident["id"], update_data)
    assert updated is not None
    assert updated["status"] == "in_progress"
    print(f"✓ Update: incident status changed to 'in_progress'")

    # Update multiple fields
    multi_update = IncidentUpdate(
        status=IncidentStatus.resolved,
        title="Resolved Test Incident",
    )
    resolved = update_incident(incident["id"], multi_update)
    assert resolved["status"] == "resolved"
    assert resolved["title"] == "Resolved Test Incident"
    print(f"✓ Update multiple: status and title updated")

    # Delete
    deleted = delete_incident(incident["id"])
    assert deleted is True
    fetched_after = get_incident_by_id(incident["id"])
    assert fetched_after is None
    print(f"✓ Delete: incident removed from database")

    return True


def test_seed_idempotence():
    """Test that seed doesn't duplicate data."""
    print("\n=== Testing Seed Idempotence ===")

    incidents_table.truncate()

    # First seed
    seed_incidents()
    count_1 = len(incidents_table.all())
    print(f"✓ First seed: {count_1} incidents loaded")

    # Second seed (should not add more)
    seed_incidents()
    count_2 = len(incidents_table.all())
    print(f"✓ Second seed: {count_2} incidents (no duplicates)")

    if count_1 == count_2:
        print("✓ Seed is idempotent")
        return True
    else:
        print(f"✗ Seed duplicated data: {count_1} -> {count_2}")
        return False


def main():
    print("=" * 60)
    print("INCIDENTS API VALIDATION TEST SUITE")
    print("=" * 60)

    results = []
    results.append(("Schema Validation", test_validation()))
    results.append(("CRUD Operations", test_crud_operations()))
    results.append(("Seed Idempotence", test_seed_idempotence()))

    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    for name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{status}: {name}")

    all_passed = all(passed for _, passed in results)
    print("=" * 60)

    if all_passed:
        print("\n✓ All tests passed!")
        return 0
    else:
        print("\n✗ Some tests failed")
        return 1


if __name__ == "__main__":
    exit(main())
