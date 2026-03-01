import io
import logging
from markitdown import MarkItDown
from typing import Annotated
from fastapi import FastAPI, File, HTTPException
import magic

logger = logging.getLogger(__name__)

app = FastAPI()

MAX_FILE_SIZE = 100 * 1024 * 1024

ALLOWED_MIME_PREFIXES = (
    "application/pdf",
    "application/vnd.openxmlformats",  # docx, xlsx, pptx
    "application/msword",
    "application/vnd.ms-",
    "text/",
    "image/",
)

@app.post("/doc2md")
async def doc2md(file: Annotated[bytes, File(max_length=MAX_FILE_SIZE)]):
    if len(file) == 0:
        raise HTTPException(status_code=400, detail="Empty file.")
    if len(file) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large.")

    mime_type = magic.from_buffer(file, mime=True)
    if not any(mime_type.startswith(prefix) for prefix in ALLOWED_MIME_PREFIXES):
        raise HTTPException(status_code=415, detail="Unsupported file type.")

    try:
        md = MarkItDown()
        logger.info("Processing file of size: %d bytes", len(file))
        result = md.convert_stream(io.BytesIO(file))
        return {"success": True, "markdown": result.markdown}
    except Exception as e:
        logger.exception("Error processing file")
        raise HTTPException(status_code=422, detail="Failed to convert document.")
