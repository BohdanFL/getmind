import pytest
import os
from app.analytics import AnalyticsManager

@pytest.fixture
def temp_db(tmp_path):
    db_file = tmp_path / "test_usage.db"
    return str(db_file)

def test_analytics_init(temp_db):
    manager = AnalyticsManager(db_path=temp_db)
    assert os.path.exists(temp_db)
    # Check if table exists
    import sqlite3
    with sqlite3.connect(temp_db) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='usage_logs'")
        assert cursor.fetchone() is not None

def test_log_usage(temp_db):
    manager = AnalyticsManager(db_path=temp_db)
    manager.log_usage(
        operation_type="test_op",
        model_id="gemini-3.1-flash-lite-preview",
        input_tokens=100,
        output_tokens=50,
        cached_tokens=10,
        latency_ms=500,
        finish_reason="STOP"
    )
    
    stats = manager.get_total_stats()
    assert stats["total_requests"] == 1
    assert stats["total_tokens"] == 160 # 100 + 50 + 10
    assert stats["total_cost"] > 0

@pytest.mark.asyncio
async def test_log_usage_async(temp_db):
    manager = AnalyticsManager(db_path=temp_db)
    await manager.log_usage_async(
        operation_type="async_op",
        model_id="gemini-3.1-flash-lite-preview",
        input_tokens=1000
    )
    stats = manager.get_total_stats()
    assert stats["total_requests"] == 1
