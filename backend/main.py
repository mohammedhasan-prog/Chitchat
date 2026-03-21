from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
import os
import shutil
import uuid

from .database import engine, Base, get_db
from .models import Message

app = FastAPI(title="Chitchat Backend")
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Ensure uploads directory exists
UPLOAD_DIR = "backend/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
app.mount("/static", StaticFiles(directory="UI"), name="static")


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)


manager = ConnectionManager()

@app.on_event("startup")
async def startup_event():
    async with engine.begin() as conn:
        # Create tables
        await conn.run_sync(Base.metadata.create_all)

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str, db: AsyncSession = Depends(get_db)):
    await manager.connect(websocket)
    try:
        # Fetch initial history on connect
        result = await db.execute(select(Message).order_by(Message.created_at.desc()).limit(50))
        messages = result.scalars().all()
        # Send history (reversed to put oldest first)
        for msg in reversed(messages):
            await websocket.send_json({
                "id": msg.id,
                "username": msg.username,
                "content": msg.content,
                "type": msg.msg_type,
                "file_url": msg.file_url,
                "timestamp": str(msg.created_at)
            })

        while True:
            data = await websocket.receive_text()
            
            # Save to db
            new_message = Message(username=client_id, content=data, msg_type="text")
            db.add(new_message)
            await db.commit()
            await db.refresh(new_message)
            
            # Broadcast
            await manager.broadcast({
                "id": new_message.id,
                "username": new_message.username,
                "content": new_message.content,
                "type": "text",
                "timestamp": str(new_message.created_at)
            })
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.post("/upload/")
async def upload_file(client_id: str = Form(...), file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    file_ext = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    file_url = f"/uploads/{unique_filename}"
    
    # Save to db
    msg_type = "image" if file_ext.lower() in ['png', 'jpg', 'jpeg', 'gif', 'webp'] else "file"
    new_message = Message(username=client_id, content=file.filename, msg_type=msg_type, file_url=file_url)
    db.add(new_message)
    await db.commit()
    await db.refresh(new_message)
    
    # Broadcast notice
    await manager.broadcast({
        "id": new_message.id,
        "username": new_message.username,
        "content": new_message.content,
        "type": new_message.msg_type,
        "file_url": new_message.file_url,
        "timestamp": str(new_message.created_at)
    })
    
    return {"filename": unique_filename, "url": file_url}

@app.get("/")
async def get():
    return HTMLResponse('<h1>Chitchat Backend is running</h1><p>Static UI served at /static/stitch/chat_interface_main/code.html</p>')

