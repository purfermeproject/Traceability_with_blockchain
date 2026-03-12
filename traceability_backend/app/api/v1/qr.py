"""
QR Code Generation Route
Generates a QR code PNG for a LOCKED batch.
Returns the PNG as a streaming response.
"""
import io
import qrcode
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.batches import get_batch_by_code
from app.db.session import get_async_session
from app.models.batch import BatchStatus
from app.core.config import settings

router = APIRouter(prefix="/qr", tags=["QR Codes"])


@router.get("/{batch_code}", summary="Generate QR code PNG for a LOCKED batch")
async def generate_qr(
    batch_code: str,
    db: AsyncSession = Depends(get_async_session),
):
    batch = await get_batch_by_code(db, batch_code)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found.")
    if batch.status != BatchStatus.LOCKED:
        raise HTTPException(
            status_code=400,
            detail="QR codes can only be generated for LOCKED batches.",
        )

    # The QR encodes a public consumer URL
    consumer_url = f"https://trace.purferme.com/batch/{batch.batch_code}"

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(consumer_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="image/png",
        headers={
            "Content-Disposition": f'attachment; filename="qr_{batch.batch_code}.png"'
        },
    )
