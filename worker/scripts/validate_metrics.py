#!/usr/bin/env python3
"""Check the D1 migrations and settled-revenue report with SQLite."""

from pathlib import Path
import sqlite3


ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def main() -> None:
    database = sqlite3.connect(":memory:")
    database.executescript(read("migrations/0001_verified_calls.sql"))
    database.executescript(read("migrations/0002_add_settlement_receipts.sql"))

    transaction = f"0x{'a' * 64}"
    settled_at = "2026-08-03T21:00:00Z"

    database.execute(
        """
        INSERT INTO verified_calls (
          payment_hash,
          payer_hash,
          agent_hash,
          merchant_origin,
          network,
          observed_at,
          transaction_hash,
          settled_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            "payment-one",
            "payer-one",
            "agent-one",
            "https://merchant.example",
            "eip155:8453",
            "2026-08-03T20:00:00Z",
            transaction,
            settled_at,
        ),
    )

    report = database.execute(read("scripts/settled-revenue-report.sql")).fetchone()
    assert report == (1, 1, 1, settled_at, settled_at), report

    try:
        database.execute(
            """
            INSERT INTO verified_calls (
              payment_hash,
              payer_hash,
              agent_hash,
              merchant_origin,
              network,
              observed_at,
              transaction_hash,
              settled_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                "payment-two",
                "payer-two",
                "agent-two",
                "https://merchant.example",
                "eip155:8453",
                "2026-08-03T20:01:00Z",
                transaction,
                settled_at,
            ),
        )
    except sqlite3.IntegrityError:
        pass
    else:
        raise AssertionError("duplicate settlement transaction was accepted")

    print("Validated settlement migrations and aggregate report.")


if __name__ == "__main__":
    main()
