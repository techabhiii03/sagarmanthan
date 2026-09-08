"""
SagarManthan API — Intelligent Freight Forecasting & Vessel Chartering Decision Platform
SIH 2026 — Problem Statement SIH26006
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.api.routes import router

app = FastAPI(
    title="SagarManthan API",
    description="Intelligent Freight Forecasting Model for Optimized Vessel Chartering and Bulk Cargo Procurement — East Coast of India (SIH26006)",
    version="1.0.0-sih2026",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/api/info")
def api_info():
    return {
        "name": "SagarManthan",
        "tagline": "From Reactive Spot Chartering to Predictive Multi-Voyage Intelligence",
        "problem": "SIH26006",
        "organization": "Ministry of Steel / SAIL",
        "docs": "/docs",
    }


# The production container places the compiled React application here. API
# routes are registered first, so they continue to take precedence.
static_dir = Path(__file__).resolve().parent / "static"
if static_dir.exists():
    assets_dir = static_dir / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def frontend(full_path: str):
        requested = static_dir / full_path
        if full_path and requested.is_file() and static_dir in requested.resolve().parents:
            return FileResponse(requested)
        return FileResponse(static_dir / "index.html")
