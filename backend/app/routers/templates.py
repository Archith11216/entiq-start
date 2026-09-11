from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..database import get_db
from ..models import Template
from ..schemas import TemplateSchema, PaginatedResponse

router = APIRouter(prefix="/templates", tags=["Templates"])

@router.get("", response_model=PaginatedResponse[TemplateSchema])
def list_templates(
    search: Optional[str] = None,
    type: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100, alias="pageSize"),
    db: Session = Depends(get_db)
):
    query = db.query(Template)

    if type and type != "All":
        query = query.filter(Template.type == type)

    if search:
        pattern = f"%{search.lower()}%"
        query = query.filter(
            or_(
                Template.name.ilike(pattern),
                Template.service.ilike(pattern),
                Template.author.ilike(pattern),
                Template.id.ilike(pattern)
            )
        )

    total = query.count()
    items = query.order_by(Template.id.asc()).offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedResponse[TemplateSchema](
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        has_more=(page * page_size) < total
    )
