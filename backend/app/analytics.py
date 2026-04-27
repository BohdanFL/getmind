import sqlite3
import datetime
import json
import os
import asyncio

class AnalyticsManager:
    def __init__(self, db_path: str = None):
        if db_path is None:
            # Set default path relative to this file (backend/app/analytics.py)
            # We want it in the backend root: backend/usage.db
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            self.db_path = os.path.join(base_dir, "usage.db")
        else:
            self.db_path = db_path
        self._init_db()

    def _init_db(self):
        """Initializes the SQLite database and creates the usage_logs table."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS usage_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    operation_type TEXT,
                    model_id TEXT,
                    input_tokens INTEGER,
                    output_tokens INTEGER,
                    cached_tokens INTEGER DEFAULT 0,
                    total_tokens INTEGER,
                    cost_usd REAL,
                    latency_ms INTEGER,
                    finish_reason TEXT,
                    metadata TEXT
                )
            """)
            conn.commit()

    def log_usage(self, 
                  operation_type: str, 
                  model_id: str, 
                  input_tokens: int, 
                  output_tokens: int = 0, 
                  cached_tokens: int = 0,
                  latency_ms: int = None,
                  finish_reason: str = None,
                  extra_metadata: dict = None):
        """
        Logs a usage event and calculates the cost.
        """
        input_tokens = input_tokens or 0
        output_tokens = output_tokens or 0
        cached_tokens = cached_tokens or 0
        total_tokens = input_tokens + output_tokens + cached_tokens
        cost = self._calculate_cost(model_id, input_tokens, output_tokens, cached_tokens)
        
        metadata_str = json.dumps(extra_metadata) if extra_metadata else None

        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO usage_logs (
                    operation_type, model_id, input_tokens, output_tokens, 
                    cached_tokens, total_tokens, cost_usd, latency_ms, finish_reason, metadata
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (operation_type, model_id, input_tokens, output_tokens, 
                  cached_tokens, total_tokens, cost, latency_ms, finish_reason, metadata_str))
            conn.commit()
            
        # Enhanced Console Output
        print("-" * 30)
        print(f"[Analytics] {operation_type.replace('_', ' ').title()}")
        print(f"   Model:   {model_id}")
        print(f"   Tokens:  {total_tokens:,} (In: {input_tokens:,}, Out: {output_tokens:,}, Cached: {cached_tokens:,})")
        print(f"   Cost:    ${cost:.6f}")
        if latency_ms:
            print(f"   Latency: {latency_ms}ms")
        if finish_reason:
            print(f"   Status:  {finish_reason}")
        print("-" * 30)

    async def log_usage_async(self, *args, **kwargs):
        """
        Asynchronously logs usage by running the synchronous log_usage in a separate thread.
        This prevents blocking the main event loop during database I/O.
        """
        return await asyncio.to_thread(self.log_usage, *args, **kwargs)

    def _calculate_cost(self, model_id: str, input_tokens: int, output_tokens: int, cached_tokens: int = 0) -> float:
        """
        Calculates the estimated cost in USD based on model pricing.
        Baseline: Gemini 3.1 Flash-Lite PREVIEW (pricing as of early 2026)
        """
        # Pricing per 1M tokens
        # Gemini 3.1 Flash-Lite PREVIEW
        if ("gemini-3.1-flash-lite-preview" in model_id):
            input_rate = 0.25 / 1_000_000
            output_rate = 1.50 / 1_000_000
            cached_rate = 0.025 / 1_000_000
        else:
            return 0
        # Simple linear calculation
        cost = (input_tokens * input_rate) + (output_tokens * output_rate) + (cached_tokens * cached_rate)
        return cost

    def get_total_stats(self):
        """Returns aggregated stats from the usage logs."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_requests,
                    SUM(total_tokens) as total_tokens,
                    SUM(cost_usd) as total_cost
                FROM usage_logs
            """)
            result = cursor.fetchone()
            return {
                "total_requests": result[0] or 0,
                "total_tokens": result[1] or 0,
                "total_cost": result[2] or 0.0
            }

    def get_stats_by_operation(self):
        """Returns stats grouped by operation type."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT 
                    operation_type,
                    COUNT(*) as count,
                    SUM(total_tokens) as tokens,
                    SUM(cost_usd) as cost,
                    AVG(latency_ms) as avg_latency
                FROM usage_logs
                GROUP BY operation_type
            """)
            return cursor.fetchall()


analytics = AnalyticsManager()
