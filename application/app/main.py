from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncpg
import redis.asyncio as redis
import os
from datetime import datetime

app = FastAPI(
    title="Nearest Nice Weather API",
    description="Weather intelligence platform for outdoor enthusiasts",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
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
        DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@postgres:5432/weather_intelligence")
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
        REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")
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
        DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@postgres:5432/weather_intelligence")
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
        DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@postgres:5432/weather_intelligence")
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