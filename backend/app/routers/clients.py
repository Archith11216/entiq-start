from typing import Optional
from datetime import datetime
import random
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..database import get_db
from ..models import ClientEntity, ActivityEvent
from ..schemas import ClientEntitySchema, PaginatedResponse

router = APIRouter(prefix="/clients", tags=["Clients"])

@router.get("", response_model=PaginatedResponse[ClientEntitySchema])
def list_clients(
    search: Optional[str] = None,
    type: Optional[str] = None,
    verification: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100, alias="pageSize"),
    db: Session = Depends(get_db)
):
    query = db.query(ClientEntity)

    if type and type != "All":
        query = query.filter(ClientEntity.type == type)

    if verification and verification != "All":
        query = query.filter(ClientEntity.verified == verification)

    if search:
        pattern = f"%{search.lower()}%"
        query = query.filter(
            or_(
                ClientEntity.name.ilike(pattern),
                ClientEntity.abn.ilike(pattern),
                ClientEntity.acn.ilike(pattern),
                ClientEntity.id.ilike(pattern)
            )
        )

    total = query.count()
    items = query.order_by(ClientEntity.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedResponse[ClientEntitySchema](
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        has_more=(page * page_size) < total
    )

@router.post("", response_model=ClientEntitySchema, status_code=status.HTTP_201_CREATED)
def create_client(client: ClientEntitySchema, db: Session = Depends(get_db)):
    client_id = client.id
    if not client_id:
        prefix = "P" if client.type == "Individual" else "E"
        client_id = f"{prefix}-{random.randint(10000, 99999)}"

    new_client = ClientEntity(
        id=client_id,
        name=client.name,
        type=client.type,
        abn=client.abn or "",
        acn=client.acn or "",
        status=client.status or "Active",
        verified=client.verified or "Document",
        cases=client.cases or 1,
        engagements=client.engagements or 1,
        added=client.added or datetime.utcnow().strftime("%b %Y")
    )
    db.add(new_client)

    db.add(ActivityEvent(
        time="Just now",
        actor="Partner",
        action="Added client entity",
        target=f"{new_client.id} · {new_client.name}",
        type="accept"
    ))

    db.commit()
    db.refresh(new_client)
    return new_client

@router.post("/batch", response_model=list[ClientEntitySchema], status_code=status.HTTP_201_CREATED)
def create_clients_batch(clients_list: list[ClientEntitySchema], db: Session = Depends(get_db)):
    created = []
    for client in clients_list:
        client_id = client.id
        if not client_id:
            prefix = "P" if client.type == "Individual" else "E"
            client_id = f"{prefix}-{random.randint(10000, 99999)}"

        new_client = ClientEntity(
            id=client_id,
            name=client.name,
            type=client.type,
            abn=client.abn or "",
            acn=client.acn or "",
            status=client.status or "Active",
            verified=client.verified or "Document",
            cases=client.cases or 1,
            engagements=client.engagements or 1,
            added=client.added or datetime.utcnow().strftime("%b %Y")
        )
        db.add(new_client)
        created.append(new_client)

    names = ", ".join(c.name for c in created)
    db.add(ActivityEvent(
        time="Just now",
        actor="Partner",
        action=f"Added group of {len(created)} entities",
        target=names,
        type="accept"
    ))

    db.commit()
    for c in created:
        db.refresh(c)
    return created

@router.put("/{client_id}", response_model=ClientEntitySchema)
def update_client(client_id: str, payload: ClientEntitySchema, db: Session = Depends(get_db)):
    client = db.query(ClientEntity).filter(ClientEntity.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client entity not found")

    client.name = payload.name
    client.type = payload.type
    client.abn = payload.abn or ""
    client.acn = payload.acn or ""
    if payload.verified:
        client.verified = payload.verified
    if payload.status:
        client.status = payload.status

    db.add(ActivityEvent(
        time="Just now",
        actor="Partner",
        action="Updated client entity",
        target=f"{client.id} · {client.name}",
        type="accept"
    ))
    db.commit()
    db.refresh(client)
    return client

@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client(client_id: str, db: Session = Depends(get_db)):
    client = db.query(ClientEntity).filter(ClientEntity.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client entity not found")

    client_name = client.name
    db.delete(client)
    db.add(ActivityEvent(
        time="Just now",
        actor="Partner",
        action="Deleted client entity",
        target=f"{client_id} · {client_name}",
        type="reject"
    ))
    db.commit()
    return None
