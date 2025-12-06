"""
PDF Worker - FastAPI microservice for parsing UP schedule PDFs.

This service wraps the V2 Python PDF parser and exposes it via HTTP API
for use by the NestJS backend.
"""

import os
import tempfile
from typing import Dict, Any

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse

from parser import parse_pdf, process_events

app = FastAPI(
    title="PDF Worker",
    description="Microservice for parsing Tuks schedule PDFs",
    version="1.0.0"
)


@app.get("/health")
async def health_check() -> Dict[str, str]:
    """
    Health check endpoint for container orchestration.
    
    Returns:
        JSON object with status field
    """
    return {"status": "healthy"}


@app.post("/parse")
async def parse_schedule(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Parse a PDF file and return extracted schedule data.
    
    Args:
        file: PDF file upload
        
    Returns:
        JSON object with events array and type field
        
    Raises:
        HTTPException: 400 for invalid PDF, 500 for parsing errors
    """
    # Validate file type
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail={"error": "Invalid file type", "details": "Only PDF files are accepted"}
        )
    
    # Check content type
    if file.content_type and file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail={"error": "Invalid content type", "details": "Expected application/pdf"}
        )
    
    # Save uploaded file to temp location
    temp_file = None
    try:
        # Create temp file with .pdf extension
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
        content = await file.read()
        
        # Check if file is empty
        if len(content) == 0:
            raise HTTPException(
                status_code=400,
                detail={"error": "Empty file", "details": "The uploaded file is empty"}
            )
        
        temp_file.write(content)
        temp_file.close()
        
        # Parse the PDF
        result = parse_pdf(temp_file.name)
        
        # Process events for cleaner output
        processed_events = process_events(result['events'])
        
        return {
            "events": processed_events,
            "type": result['type']
        }
        
    except ValueError as e:
        # Invalid PDF format or unable to determine type
        raise HTTPException(
            status_code=400,
            detail={"error": "Invalid PDF format", "details": str(e)}
        )
    except Exception as e:
        # Unexpected parsing error
        raise HTTPException(
            status_code=500,
            detail={"error": "Parsing failed", "details": str(e)}
        )
    finally:
        # Clean up temp file
        if temp_file and os.path.exists(temp_file.name):
            os.unlink(temp_file.name)


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "5001"))
    uvicorn.run(app, host="0.0.0.0", port=port)
