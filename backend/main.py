from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, UploadFile, File, Form, HTTPException, Query
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, and_
from pydantic import BaseModel
from typing import Dict, Optional
import os, shutil, uuid, json, hashlib

from .database import engine, Base, get_db
from .models import User, Friend, Message, Group

app = FastAPI(title="Chitchat Backend")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

UPLOAD_DIR = "backend/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


# ─── Password ─────────────────────────────────────────────────────────────────
def hash_password(pw: str) -> str:
    return hashlib.sha256(f"chitchat_salt_2026{pw}".encode()).hexdigest()
def verify_password(pw: str, h: str) -> bool:
    return hash_password(pw) == h


# ─── Auth schemas ──────────────────────────────────────────────────────────────
class SignupRequest(BaseModel):
    email: str; display_name: str; password: str
class LoginRequest(BaseModel):
    email: str; password: str
class AddFriendRequest(BaseModel):
    username: str; friend_email: str


# ─── Auth endpoints ────────────────────────────────────────────────────────────
@app.post("/auth/signup")
async def signup(req: SignupRequest, db: AsyncSession = Depends(get_db)):
    if not req.email or not req.display_name or not req.password:
        raise HTTPException(400, "All fields required")
    if len(req.password) < 6:
        raise HTTPException(400, "Password must be 6+ chars")
    if len(req.display_name) < 2:
        raise HTTPException(400, "Name must be 2+ chars")
    existing = await db.execute(select(User).where(User.email == req.email.lower().strip()))
    if existing.scalar_one_or_none():
        raise HTTPException(409, "Email already registered")
    user = User(email=req.email.lower().strip(), display_name=req.display_name.strip(), password_hash=hash_password(req.password))
    db.add(user); await db.commit(); await db.refresh(user)
    return {"id": user.id, "email": user.email, "display_name": user.display_name, "profile_pic_url": user.profile_pic_url}

@app.post("/auth/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    if not req.email or not req.password:
        raise HTTPException(400, "Email and password required")
    result = await db.execute(select(User).where(User.email == req.email.lower().strip()))
    user = result.scalar_one_or_none()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password")
    return {"id": user.id, "email": user.email, "display_name": user.display_name, "profile_pic_url": user.profile_pic_url}


# ─── User Search ───────────────────────────────────────────────────────────────
@app.get("/users/search")
async def search_users(q: str = Query("", min_length=1), username: str = Query(""), db: AsyncSession = Depends(get_db)):
    """Search users by name or email. Returns matching users excluding the requester."""
    query = q.lower().strip()
    result = await db.execute(select(User))
    matches = []
    for u in result.scalars().all():
        if u.display_name == username:
            continue  # skip self
        if query in u.display_name.lower() or query in u.email.lower():
            matches.append({"id": u.id, "display_name": u.display_name, "email": u.email, "profile_pic_url": u.profile_pic_url})
    return {"users": matches[:20]}

@app.get("/users/me")
async def get_me(username: str = Query(""), db: AsyncSession = Depends(get_db)):
    """Get user profile details via username."""
    result = await db.execute(select(User).where(User.display_name == username))
    u = result.scalar_one_or_none()
    if not u:
        raise HTTPException(404, "User not found")
    return {"id": u.id, "display_name": u.display_name, "email": u.email, "profile_pic_url": u.profile_pic_url, "created_at": str(u.created_at)}

# ─── Friends ───────────────────────────────────────────────────────────────────
@app.post("/friends/add")
async def add_friend(req: AddFriendRequest, db: AsyncSession = Depends(get_db)):
    """Add a friend by their email."""
    # Find the user to add
    result = await db.execute(select(User).where(User.email == req.friend_email.lower().strip()))
    friend_user = result.scalar_one_or_none()
    if not friend_user:
        raise HTTPException(404, "User not found")
    if friend_user.display_name == req.username:
        raise HTTPException(400, "Cannot add yourself")

    # Check if already friends
    existing = await db.execute(
        select(Friend).where(Friend.user_name == req.username, Friend.friend_name == friend_user.display_name)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(409, "Already friends")

    # Add both directions
    db.add(Friend(user_name=req.username, friend_name=friend_user.display_name))
    db.add(Friend(user_name=friend_user.display_name, friend_name=req.username))
    await db.commit()

    return {"friend": {"display_name": friend_user.display_name, "email": friend_user.email, "profile_pic_url": friend_user.profile_pic_url}}

@app.get("/friends/list")
async def list_friends(username: str = Query(""), db: AsyncSession = Depends(get_db)):
    """Get all friends for a user."""
    result = await db.execute(select(Friend).where(Friend.user_name == username))
    friend_names = [f.friend_name for f in result.scalars().all()]

    # Get full user info for each friend
    friends = []
    for fname in friend_names:
        u_result = await db.execute(select(User).where(User.display_name == fname))
        u = u_result.scalar_one_or_none()
        if u:
            friends.append({"display_name": u.display_name, "email": u.email, "profile_pic_url": u.profile_pic_url})
    return {"friends": friends}

@app.delete("/friends/remove")
async def remove_friend(username: str = Query(""), friend_name: str = Query(""), db: AsyncSession = Depends(get_db)):
    """Remove a friend."""
    # Delete both directions
    result1 = await db.execute(select(Friend).where(Friend.user_name == username, Friend.friend_name == friend_name))
    for f in result1.scalars().all():
        await db.delete(f)
    result2 = await db.execute(select(Friend).where(Friend.user_name == friend_name, Friend.friend_name == username))
    for f in result2.scalars().all():
        await db.delete(f)
    await db.commit()
    return {"ok": True}


# ─── Connection Manager ───────────────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.by_name: Dict[str, dict] = {}
        self.by_id: Dict[str, str] = {}

    async def connect(self, client_id: str, username: str, websocket: WebSocket, profile_pic_url: Optional[str] = None):
        await websocket.accept()
        self.by_name[username] = {"ws": websocket, "client_id": client_id, "profile_pic_url": profile_pic_url}
        self.by_id[client_id] = username

    def disconnect(self, client_id: str):
        username = self.by_id.pop(client_id, None)
        if username: self.by_name.pop(username, None)

    async def send_to_name(self, username: str, message: dict):
        conn = self.by_name.get(username)
        if conn:
            try: await conn["ws"].send_json(message)
            except: pass

    async def send_to_names(self, usernames: list, message: dict, exclude: str = None):
        for u in usernames:
            if u == exclude: continue
            await self.send_to_name(u, message)

    async def broadcast(self, message: dict, exclude_name: str = None):
        dead = []
        for uname, conn in list(self.by_name.items()):
            if uname == exclude_name: continue
            try: await conn["ws"].send_json(message)
            except: dead.append(uname)
        for u in dead:
            cid = self.by_name.pop(u, {}).get("client_id")
            if cid: self.by_id.pop(cid, None)

    def online_users(self):
        return [{"id": c["client_id"], "username": u, "profile_pic_url": c.get("profile_pic_url")} for u, c in self.by_name.items()]

    def is_online(self, username: str) -> bool:
        return username in self.by_name

manager = ConnectionManager()


@app.on_event("startup")
async def startup_event():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_user_groups(db: AsyncSession, username: str):
    result = await db.execute(select(Group))
    groups = []
    for g in result.scalars().all():
        members = json.loads(g.members)
        if username in members:
            groups.append({"id": g.id, "name": g.name, "created_by": g.created_by, "members": members})
    return groups


# ─── WebSocket ─────────────────────────────────────────────────────────────────
@app.websocket("/ws/{client_id}")
async def websocket_endpoint(
    websocket: WebSocket, client_id: str,
    username: str = "Anonymous",
    db: AsyncSession = Depends(get_db),
):
    await manager.connect(client_id, username, websocket)

    # Fetch this user's profile pic from DB after accepting the connection
    user_result = await db.execute(select(User).where(User.display_name == username))
    db_user = user_result.scalars().first()
    if db_user:
        manager.by_name[username]["profile_pic_url"] = db_user.profile_pic_url


    # Global history
    result = await db.execute(
        select(Message).where(Message.recipient_username == None, Message.group_id == None)
        .order_by(Message.created_at.desc()).limit(50)
    )
    for msg in reversed(result.scalars().all()):
        await websocket.send_json({
            "type": msg.msg_type, "id": msg.id,
            "username": msg.username_display or msg.username,
            "content": msg.content, "file_url": msg.file_url,
            "timestamp": str(msg.created_at), "conversation": "global",
        })

    # Groups
    user_groups = await get_user_groups(db, username)
    await websocket.send_json({"type": "groups_list", "groups": user_groups})

    # Online users
    # Include avatar for online badge in Dashboard if needed, but display name often works well enough
    u_list = manager.online_users()
    await websocket.send_json({"type": "users_update", "users": u_list})
    await manager.broadcast({"type": "system", "content": f"{username} joined the chat 👋", "conversation": "global"}, exclude_name=username)
    await manager.broadcast({"type": "users_update", "users": u_list})

    try:
        while True:
            raw = await websocket.receive_text()
            data = json.loads(raw)
            mtype = data.get("type", "text")

            if mtype == "typing":
                to_user = data.get("to")
                group_id = data.get("group_id")
                payload = {"type": "typing", "username": username, "typing": data.get("typing", False)}
                if group_id:
                    g_result = await db.execute(select(Group).where(Group.id == group_id))
                    group = g_result.scalar_one_or_none()
                    if group:
                        payload["group_id"] = group_id
                        await manager.send_to_names(json.loads(group.members), payload, exclude=username)
                elif to_user:
                    payload["to"] = to_user
                    await manager.send_to_name(to_user, payload)
                else:
                    await manager.broadcast(payload, exclude_name=username)

            elif mtype == "dm_history_request":
                with_user = data.get("with_username", "")
                if with_user:
                    result = await db.execute(
                        select(Message).where(or_(
                            and_(Message.username_display == username, Message.recipient_username == with_user),
                            and_(Message.username_display == with_user, Message.recipient_username == username),
                        )).order_by(Message.created_at.asc()).limit(100)
                    )
                    await websocket.send_json({
                        "type": "dm_history", "with_username": with_user,
                        "messages": [{"type": m.msg_type, "id": m.id, "username": m.username_display or m.username,
                            "content": m.content, "file_url": m.file_url, "timestamp": str(m.created_at),
                            "conversation": f"dm_{with_user}"} for m in result.scalars().all()],
                    })

            elif mtype == "group_history_request":
                gid = data.get("group_id")
                if gid:
                    result = await db.execute(select(Message).where(Message.group_id == gid).order_by(Message.created_at.asc()).limit(100))
                    await websocket.send_json({
                        "type": "group_history", "group_id": gid,
                        "messages": [{"type": m.msg_type, "id": m.id, "username": m.username_display or m.username,
                            "content": m.content, "file_url": m.file_url, "timestamp": str(m.created_at),
                            "conversation": f"group_{gid}"} for m in result.scalars().all()],
                    })

            elif mtype == "create_group":
                group_name = data.get("name", "").strip()
                members = data.get("members", [])
                if not group_name or not members: continue
                if username not in members: members.append(username)
                new_group = Group(name=group_name, created_by=username, members=json.dumps(members))
                db.add(new_group); await db.commit(); await db.refresh(new_group)
                group_info = {"id": new_group.id, "name": group_name, "created_by": username, "members": members}
                for member in members:
                    await manager.send_to_name(member, {"type": "group_created", "group": group_info})

            elif mtype == "text":
                content = data.get("content", "").strip()
                to_user = data.get("to")
                group_id = data.get("group_id")
                if not content: continue

                new_msg = Message(username=client_id, username_display=username, content=content,
                    msg_type="text", recipient_username=to_user, group_id=group_id)
                db.add(new_msg); await db.commit(); await db.refresh(new_msg)

                base = {"type": "text", "id": new_msg.id, "username": username,
                    "content": content, "timestamp": str(new_msg.created_at)}

                if group_id:
                    g_result = await db.execute(select(Group).where(Group.id == group_id))
                    group = g_result.scalar_one_or_none()
                    if group:
                        payload = {**base, "conversation": f"group_{group_id}", "group_id": group_id}
                        await manager.send_to_names(json.loads(group.members), payload, exclude=username)
                        await websocket.send_json(payload)
                elif to_user:
                    await manager.send_to_name(to_user, {**base, "conversation": f"dm_{username}", "to": to_user})
                    await websocket.send_json({**base, "conversation": f"dm_{to_user}", "to": to_user})
                else:
                    gp = {**base, "conversation": "global"}
                    await manager.broadcast(gp, exclude_name=username)
                    await websocket.send_json(gp)

    except WebSocketDisconnect:
        manager.disconnect(client_id)
        await manager.broadcast({"type": "system", "content": f"{username} left the chat", "conversation": "global"})
        await manager.broadcast({"type": "users_update", "users": manager.online_users()})


# ─── Http Endpoints ────────────────────────────────────────────────────────────
@app.post("/upload/")
async def upload_file(
    client_id: str = Form(None), username: str = Form(None),
    to_user: str = Form(None), group_id: int = Form(None),
    is_profile_pic: bool = Form(False),
    file: UploadFile = File(...), db: AsyncSession = Depends(get_db),
):
    file_ext = file.filename.split(".")[-1].lower()
    unique_name = f"{uuid.uuid4()}.{file_ext}"
    with open(os.path.join(UPLOAD_DIR, unique_name), "wb") as buf:
        shutil.copyfileobj(file.file, buf)
    file_url = f"/uploads/{unique_name}"
    
    # If the file upload is a profile picture
    if is_profile_pic and username:
        result = await db.execute(select(User).where(User.display_name == username))
        user = result.scalar_one_or_none()
        if user:
            user.profile_pic_url = file_url
            await db.commit()
            return {"profile_pic_url": file_url}
        else:
            raise HTTPException(404, "User not found")

    if not client_id or not username:
        raise HTTPException(400, "Missing client_id or username for message upload")

    msg_type = "image" if file_ext in {"png","jpg","jpeg","gif","webp"} else "file"
    new_msg = Message(username=client_id, username_display=username, content=file.filename,
        msg_type=msg_type, file_url=file_url, recipient_username=to_user, group_id=group_id)
    db.add(new_msg); await db.commit(); await db.refresh(new_msg)
    base = {"type": msg_type, "id": new_msg.id, "username": username,
        "content": file.filename, "file_url": file_url, "timestamp": str(new_msg.created_at)}
    if group_id:
        g_result = await db.execute(select(Group).where(Group.id == group_id))
        group = g_result.scalar_one_or_none()
        if group:
            payload = {**base, "conversation": f"group_{group_id}", "group_id": group_id}
            await manager.send_to_names(json.loads(group.members), payload, exclude=username)
            sc = manager.by_name.get(username)
            if sc: await sc["ws"].send_json(payload)
    elif to_user:
        await manager.send_to_name(to_user, {**base, "conversation": f"dm_{username}", "to": to_user})
        sc = manager.by_name.get(username)
        if sc: await sc["ws"].send_json({**base, "conversation": f"dm_{to_user}", "to": to_user})
    else:
        await manager.broadcast({**base, "conversation": "global"})
    return {"filename": unique_name, "url": file_url}

@app.get("/users/online")
async def get_online_users():
    return {"users": manager.online_users()}

@app.get("/")
async def root():
    return HTMLResponse("<h1>Chitchat Backend ✅</h1>")
