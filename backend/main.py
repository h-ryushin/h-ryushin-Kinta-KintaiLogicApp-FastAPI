from fastapi import FastAPI, Depends, HTTPException
from sqlmodel import Field, SQLModel, create_engine, Session, select
from fastapi.middleware.cors import CORSMiddleware
import os
from typing import List, Optional

class Kintai(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    shop: str
    date: str
    content: str  # 💡 スタッフ全員分のJSON文字列
    totalHours: float

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session: yield session

@app.post("/kintai/")
def save_kintai(kintai: Kintai, session: Session = Depends(get_session)):
    # 同じ店・日の古いデータ（1人1行版のゴミなど）をすべて削除
    statement = select(Kintai).where(Kintai.shop == kintai.shop, Kintai.date == kintai.date)
    for old in session.exec(statement).all():
        session.delete(old)
    session.commit()
    
    # 新しい集約データを1件だけ保存
    kintai.id = None
    session.add(kintai)
    session.commit()
    return {"ok": True}

@app.get("/kintai/")
def read_kintai(shop: str, date: str, session: Session = Depends(get_session)):
    statement = select(Kintai).where(Kintai.shop == shop, Kintai.date == date)
    return session.exec(statement).all()

@app.get("/kintai/history", response_model=List[Kintai])
def get_history(shop: str, session: Session = Depends(get_session)):
    return session.exec(select(Kintai).where(Kintai.shop == shop)).all()

@app.delete("/kintai/{kintai_id}")
def delete_kintai(kintai_id: int, session: Session = Depends(get_session)):
    kintai = session.get(Kintai, kintai_id)
    if kintai:
        session.delete(kintai)
        session.commit()
    return {"ok": True}