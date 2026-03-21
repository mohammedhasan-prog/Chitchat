from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from .database import Base


class Message(Base):
    __tablename__ = "messages"

    id                 = Column(Integer, primary_key=True, index=True)
    username           = Column(String, index=True)          # connection client_id
    username_display   = Column(String, nullable=True)       # human-readable name
    content            = Column(Text)
    msg_type           = Column(String, default="text")      # text | image | file
    file_url           = Column(String, nullable=True)
    recipient_username = Column(String, nullable=True)       # None = global, else DM target
    group_id           = Column(Integer, nullable=True)      # None = not a group msg
    created_at         = Column(DateTime(timezone=True), server_default=func.now())


class Group(Base):
    __tablename__ = "groups"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String, nullable=False)
    created_by = Column(String, nullable=False)              # username_display of creator
    members    = Column(Text, default="[]")                  # JSON list of usernames
    created_at = Column(DateTime(timezone=True), server_default=func.now())
