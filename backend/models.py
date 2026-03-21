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
    recipient_username = Column(String, nullable=True)       # None = global, else DM target display-name
    created_at         = Column(DateTime(timezone=True), server_default=func.now())
