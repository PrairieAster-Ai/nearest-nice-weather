from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import asyncpg
import redis.asyncio as redis
import os
import logging
from datetime import datetime
from typing import Optional

# Environment configuration with validation
def get_required_env(key: str) -> str:
    """Get required environment variable or raise error"""
    value = os.getenv(key)
    if not value:
        raise ValueError(f"Required environment variable {key} is not set")
    return value

def get_cors_origins() -> list[str]:
    """Get CORS origins from environment"""
    origins_str = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3002")
    return [origin.strip() for origin in origins_str.split(",") if origin.strip()]

# Production-ready configuration
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
DEBUG = os.getenv("DEBUG", "false").lower() == "true"
LOG_LEVEL = os.getenv("LOG_LEVEL", "info").upper()
API_PREFIX = os.getenv("API_PREFIX", "")

# Set up logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Database configuration
try:
    DATABASE_URL = get_required_env("DATABASE_URL")
except ValueError as e:
    logger.error(f"Database configuration error: {e}")
    raise

# Redis configuration
try:
    REDIS_URL = get_required_env("REDIS_URL")
except ValueError as e:
    logger.error(f"Redis configuration error: {e}")
    raise

# FastAPI app configuration
app = FastAPI(
    title="Nearest Nice Weather API",
    description="Weather intelligence platform for outdoor enthusiasts",
    version="0.1.0",
    debug=DEBUG,
    root_path=API_PREFIX
)

# CORS configuration
cors_origins = get_cors_origins()
logger.info(f"Configuring CORS for origins: {cors_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "Nearest Nice Weather API",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/infrastructure")
async def infrastructure_status():
    status = {
        "api": "running",
        "database": "unknown",
        "redis": "unknown",
        "timestamp": datetime.now().isoformat()
    }
    
    # Test database connection
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        
        # Test sample query
        result = await conn.fetchval("SELECT COUNT(*) FROM weather.locations")
        await conn.close()
        
        status["database"] = "connected"
        status["sample_locations"] = result
    except Exception as e:
        status["database"] = f"error: {str(e)}"
    
    # Test Redis connection
    try:
        r = redis.from_url(REDIS_URL)
        await r.ping()
        await r.aclose()
        
        status["redis"] = "connected"
    except Exception as e:
        status["redis"] = f"error: {str(e)}"
    
    return status

@app.get("/locations")
async def get_locations():
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        
        query = """
        SELECT 
            name, 
            state,
            ST_X(coordinates) as longitude,
            ST_Y(coordinates) as latitude
        FROM weather.locations 
        ORDER BY name
        """
        
        rows = await conn.fetch(query)
        await conn.close()
        
        locations = [
            {
                "name": row["name"],
                "state": row["state"],
                "longitude": row["longitude"],
                "latitude": row["latitude"]
            }
            for row in rows
        ]
        
        return {"locations": locations}
    except Exception as e:
        return {"error": str(e)}

@app.get("/operators")
async def get_operators():
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        
        query = """
        SELECT 
            business_name,
            business_type,
            contact_email,
            ST_X(coordinates) as longitude,
            ST_Y(coordinates) as latitude
        FROM tourism.operators 
        ORDER BY business_name
        """
        
        rows = await conn.fetch(query)
        await conn.close()
        
        operators = [
            {
                "business_name": row["business_name"],
                "business_type": row["business_type"],
                "contact_email": row["contact_email"],
                "longitude": row["longitude"],
                "latitude": row["latitude"]
            }
            for row in rows
        ]
        
        return {"operators": operators}
    except Exception as e:
        return {"error": str(e)}