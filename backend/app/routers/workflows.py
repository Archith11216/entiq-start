from typing import Optional, List
from datetime import datetime
import random
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import WorkflowProcess, ActivityEvent
from ..schemas import WorkflowProcessSchema, WorkflowProcessCreate

router = APIRouter(prefix="/workflows", tags=["Process Workflows"])

@router.get("", response_model=List[WorkflowProcessSchema])
def list_workflows(db: Session = Depends(get_db)):
    return db.query(WorkflowProcess).order_by(WorkflowProcess.updated_at.desc()).all()

@router.get("/{workflow_id}", response_model=WorkflowProcessSchema)
def get_workflow(workflow_id: str, db: Session = Depends(get_db)):
    wf = db.query(WorkflowProcess).filter(WorkflowProcess.id == workflow_id).first()
    if not wf:
        # Fallback to first workflow if default
        wf = db.query(WorkflowProcess).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return wf

@router.post("", response_model=WorkflowProcessSchema, status_code=status.HTTP_201_CREATED)
def create_workflow(payload: WorkflowProcessCreate, db: Session = Depends(get_db)):
    wf_id = payload.id or f"WF-{random.randint(100, 999)}"
    new_wf = WorkflowProcess(
        id=wf_id,
        name=payload.name,
        description=payload.description or "",
        nodes_json=payload.nodes_json or "[]",
        edges_json=payload.edges_json or "[]",
        status=payload.status or "Active",
        updated_at=datetime.utcnow(),
        created_at=datetime.utcnow(),
    )
    db.add(new_wf)
    db.add(ActivityEvent(
        time="Just now",
        actor="Partner",
        action="Published workflow process",
        target=f"{new_wf.id} · {new_wf.name}",
        type="accept",
    ))
    db.commit()
    db.refresh(new_wf)
    return new_wf

@router.put("/{workflow_id}", response_model=WorkflowProcessSchema)
def update_workflow(workflow_id: str, payload: WorkflowProcessCreate, db: Session = Depends(get_db)):
    wf = db.query(WorkflowProcess).filter(WorkflowProcess.id == workflow_id).first()
    if not wf:
        # If does not exist, create it with this ID
        wf = WorkflowProcess(
            id=workflow_id,
            name=payload.name,
            description=payload.description or "",
            nodes_json=payload.nodes_json or "[]",
            edges_json=payload.edges_json or "[]",
            status=payload.status or "Active",
            updated_at=datetime.utcnow(),
            created_at=datetime.utcnow(),
        )
        db.add(wf)
    else:
        wf.name = payload.name
        if payload.description:
            wf.description = payload.description
        wf.nodes_json = payload.nodes_json
        wf.edges_json = payload.edges_json
        if payload.status:
            wf.status = payload.status
        wf.updated_at = datetime.utcnow()

    db.add(ActivityEvent(
        time="Just now",
        actor="Partner",
        action="Saved Process Builder canvas",
        target=f"{wf.id} · {wf.name}",
        type="accept",
    ))
    db.commit()
    db.refresh(wf)
    return wf
