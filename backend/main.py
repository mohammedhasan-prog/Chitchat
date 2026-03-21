from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, UploadFile, File, Form
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, and_
from typing import List, Dict
import os, shutil, uuid, json

from .database import engine, Base, get_db
from .models import Message

app = FastAPI(title="Chitchat Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "backend/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


# ─── Connection Manager ────────────────────────────────────────────────────────

class ConnectionManager:
    def __init__(self):
        # username → {"ws": WebSocket, "client_id": str}
        # We index by username_display so DM routing is trivial
        self.by_name: Dict[str, dict] = {}
        # client_id → username (for reverse lookup)
        self.by_id: Dict[str, str] = {}

    async def connect(self, client_id: str, username: str, websocket: WebSocket):
        await websocket.accept()
        self.by_name[username]  = {"ws": websocket, "client_id": client_id}
        self.by_id[client_id]   = username

    def disconnect(self, client_id: str):
        username = self.by_id.pop(client_id, None)
        if username:
            self.by_name.pop(username, None)

    async def send_to_name(self, username: str, message: dict):
        conn = self.by_name.get(username)
        if conn:
            try:
                await conn["ws"].send_json(message)
            except Exception:
                pass

    async def broadcast(self, message: dict, exclude_name: str = None):
        dead = []
        for uname, conn in list(self.by_name.items()):
            if uname == exclude_name:
                continue
            try:
                await conn["ws"].send_json(message)
            except Exception:
                dead.append(uname)
        for u in dead:
            cid = self.by_name.pop(u, {}).get("client_id")
            if cid:
                self.by_id.pop(cid, None)

    def online_users(self):
        return [{"id": c["client_id"], "username": u} for u, c in self.by_name.items()]

    def username_of(self, client_id: str) -> str:
        return self.by_id.get(client_id, "Unknown")


manager = ConnectionManager()


# ─── Startup ───────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup_event():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


# ─── WebSocket ─────────────────────────────────────────────────────────────────

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    client_id: str,
    username: str = "Anonymous",
    db: AsyncSession = Depends(get_db),
):
    await manager.connect(client_id, username, websocket)

    # ── Send global history ──
    result = await db.execute(
        select(Message)
        .where(Message.recipient_username == None)
        .order_by(Message.created_at.desc())
        .limit(50)
    )
    for msg in reversed(result.scalars().all()):
        await websocket.send_json({
            "type": msg.msg_type, "id": msg.id,
            "username": msg.username_display or msg.username,
            "content": msg.content, "file_url": msg.file_url,
            "timestamp": str(msg.created_at), "conversation": "global",
        })

    # ── Online users ──
    await websocket.send_json({"type": "users_update", "users": manager.online_users()})

    # ── Broadcast join ──
    await manager.broadcast({"type": "system", "content": f"{username} joined the chat 👋", "conversation": "global"}, exclude_name=username)
    await manager.broadcast({"type": "users_update", "users": manager.online_users()})

    try:
        while True:
            raw  = await websocket.receive_text()
            data = json.loads(raw)
            mtype = data.get("type", "text")

            # ── Typing indicator ──
            if mtype == "typing":
                to_user = data.get("to")  # None = global typing
                payload = {"type": "typing", "username": username, "typing": data.get("typing", False), "to": to_user}
                if to_user:
                    await manager.send_to_name(to_user, payload)
                else:
                    await manager.broadcast(payload, exclude_name=username)

            # ── DM history request ──
            elif mtype == "dm_history_request":
                with_user = data.get("with_username", "")
                if with_user:
                    result = await db.execute(
                        select(Message).where(
                            or_(
                                and_(Message.username_display == username,   Message.recipient_username == with_user),
                                and_(Message.username_display == with_user,  Message.recipient_username == username),
                            )
                        ).order_by(Message.created_at.asc()).limit(100)
                    )
                    msgs = result.scalars().all()
                    await websocket.send_json({
                        "type": "dm_history",
                        "with_username": with_user,
                        "messages": [{
                            "type": m.msg_type, "id": m.id,
                            "username": m.username_display or m.username,
                            "content": m.content, "file_url": m.file_url,
                            "timestamp": str(m.created_at),
                            "conversation": f"dm_{with_user}",
                        } for m in msgs],
                    })

            # ── Text message ──
            elif mtype == "text":
                content  = data.get("content", "").strip()
                to_user  = data.get("to")        # username_display of recipient (None = global)
                if not content:
                    continue

                new_msg = Message(
                    username=client_id,
                    username_display=username,
                    content=content,
                    msg_type="text",
                    recipient_username=to_user,
                )
                db.add(new_msg)
                await db.commit()
                await db.refresh(new_msg)

                base = {
                    "type": "text", "id": new_msg.id,
                    "username": username, "content": content,
                    "timestamp": str(new_msg.created_at),
                    "to": to_user,
                }

                if to_user:
                    # Private: recipient sees it under dm_{sender}, sender sees it under dm_{recipient}
                    recipient_payload = {**base, "conversation": f"dm_{username}"}
                    sender_payload    = {**base, "conversation": f"dm_{to_user}"}
                    await manager.send_to_name(to_user, recipient_payload)
                    await websocket.send_json(sender_payload)
                else:
                    # Global: broadcast to all + echo to sender
                    global_payload = {**base, "conversation": "global"}
                    await manager.broadcast(global_payload, exclude_name=username)
                    await websocket.send_json(global_payload)

    except WebSocketDisconnect:
        manager.disconnect(client_id)
        await manager.broadcast({"type": "system", "content": f"{username} left the chat", "conversation": "global"})
        await manager.broadcast({"type": "users_update", "users": manager.online_users()})


# ─── File Upload ───────────────────────────────────────────────────────────────

@app.post("/upload/")
async def upload_file(
    client_id: str = Form(...),
    username: str  = Form("Anonymous"),
    to_user: str   = Form(None),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    file_ext      = file.filename.split(".")[-1].lower()
    unique_name   = f"{uuid.uuid4()}.{file_ext}"
    file_path     = os.path.join(UPLOAD_DIR, unique_name)

    with open(file_path, "wb") as buf:
        shutil.copyfileobj(file.file, buf)

    file_url = f"/uploads/{unique_name}"
    msg_type = "image" if file_ext in {"png", "jpg", "jpeg", "gif", "webp"} else "file"

    new_msg = Message(
        username=client_id,
        username_display=username,
        content=file.filename,
        msg_type=msg_type,
        file_url=file_url,
        recipient_username=to_user,
    )
    db.add(new_msg)
    await db.commit()
    await db.refresh(new_msg)

    base = {
        "type": msg_type, "id": new_msg.id,
        "username": username, "content": file.filename,
        "file_url": file_url, "timestamp": str(new_msg.created_at),
        "to": to_user,
    }

    if to_user:
        recipient_payload = {**base, "conversation": f"dm_{username}"}
        sender_payload    = {**base, "conversation": f"dm_{to_user}"}
        await manager.send_to_name(to_user, recipient_payload)
        sender_conn = manager.by_name.get(username)
        if sender_conn:
            await sender_conn["ws"].send_json(sender_payload)
    else:
        await manager.broadcast({**base, "conversation": "global"})

    return {"filename": unique_name, "url": file_url}


# ─── REST helpers ──────────────────────────────────────────────────────────────

@app.get("/users/online")
async def get_online_users():
    return {"users": manager.online_users()}

@app.get("/")
async def root():
    return HTMLResponse("<h1>Chitchat Backend ✅</h1>")
