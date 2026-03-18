import sqlite3
import datetime
import json
import os

class AnalyticsManager:
    def __init__(self, db_path: str = "usage.db"):
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
                    total_tokens INTEGER,
                    cost_usd REAL,
                    metadata TEXT
                )
            """)
            conn.commit()

    def log_usage(self, operation_type: str, model_id: str, input_tokens: int, output_tokens: int = 0, extra_metadata: dict = None):
        """
        Logs a usage event and calculates the cost.
        """
        total_tokens = input_tokens + output_tokens
        cost = self._calculate_cost(model_id, input_tokens, output_tokens)
        
        metadata_str = json.dumps(extra_metadata) if extra_metadata else None

        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO usage_logs (operation_type, model_id, input_tokens, output_tokens, total_tokens, cost_usd, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (operation_type, model_id, input_tokens, output_tokens, total_tokens, cost, metadata_str))
            conn.commit()
            
        print(f"[Analytics] Logged {operation_type}: {total_tokens} tokens, Cost: ${cost:.6f}")

    def _calculate_cost(self, model_id: str, input_tokens: int, output_tokens: int) -> float:
        """
        Calculates the estimated cost in USD based on model pricing.
        Baseline: Gemini 1.5 Flash (pricing as of early 2025)
        """
        # Pricing per 1M tokens
        # Note: These values can be adjusted or fetched dynamically if needed.
        if "pro" in model_id.lower():
            # Gemini 1.5 Pro
            input_rate = 1.25 / 1_000_000
            output_rate = 5.00 / 1_000_000
        else:
            # Gemini 1.5 Flash / Flash-8B / Flash-Lite
            input_rate = 0.075 / 1_000_000
            output_rate = 0.30 / 1_000_000

        # Simple linear calculation (ignoring context window thresholds for now)
        cost = (input_tokens * input_rate) + (output_tokens * output_rate)
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
            return cursor.fetchone()

# Global instance for easy access
analytics = AnalyticsManager()
