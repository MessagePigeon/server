"""Dump the OpenAPI spec to openapi.json without booting a server.

Run with: `uv run python -m app.export_openapi`
Placeholder env vars are set so it works with zero configuration (and in CI).
"""

import json
import os

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./_export.db")
os.environ.setdefault("JWT_SECRET", "x")
os.environ.setdefault("ADMIN_PASSWORD", "x")
os.environ.setdefault("TEACHER_URL", "http://localhost")

from app.main import app  # noqa: E402

OUTPUT = "openapi.json"


def main() -> None:
    with open(OUTPUT, "w") as f:
        json.dump(app.openapi(), f, indent=2)
        f.write("\n")
    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    main()
