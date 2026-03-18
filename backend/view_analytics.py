import os
import sys
from app.analytics import analytics

def main():
    print("-" * 50)
    print("      GOOGLE GENAI USAGE STATISTICS")
    print("-" * 50)
    
    total = analytics.get_total_stats()
    print(f"Total Requests: {total['total_requests']}")
    print(f"Total Tokens:   {total['total_tokens']:,}")
    print(f"Total Cost:     ${total['total_cost']:.6f}")
    print("-" * 50)
    
    print(f"{'Operation':<20} | {'Count':<6} | {'Tokens':<10} | {'Cost':<10} | {'Latency':<8}")
    print("-" * 70)
    
    by_op = analytics.get_stats_by_operation()
    for op, count, tokens, cost, latency in by_op:
        op_display = op.replace("_", " ").title()
        print(f"{op_display:<20} | {count:<6} | {tokens or 0:<10,} | ${cost or 0:<9.6f} | {int(latency or 0):>5}ms")
    
    print("-" * 70)

if __name__ == "__main__":
    # Add parent directory to sys.path to allow imports from app
    sys.path.append(os.getcwd())
    main()
