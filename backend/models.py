from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from .database import Base


class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    email           = Column(String, unique=True, index=True, nullable=False)
    display_name    = Column(String, nullable=False)
    password_hash   = Column(String, nullable=False)
    profile_pic_url = Column(String, nullable=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())


class Friend(Base):
    __tablename__ = "friends"

    id        = Column(Integer, primary_key=True, index=True)
    user_name = Column(String, index=True, nullable=False)   # who added
    friend_name = Column(String, index=True, nullable=False) # who was added
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Message(Base):
    __tablename__ = "messages"

    id                 = Column(Integer, primary_key=True, index=True)
    username           = Column(String, index=True)
    username_display   = Column(String, nullable=True)
    content            = Column(Text)
    msg_type           = Column(String, default="text")
    file_url           = Column(String, nullable=True)
    recipient_username = Column(String, nullable=True)
    group_id           = Column(Integer, nullable=True)
    created_at         = Column(DateTime(timezone=True), server_default=func.now())


class Group(Base):
    __tablename__ = "groups"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String, nullable=False)
    created_by = Column(String, nullable=False)
    members    = Column(Text, default="[]")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
