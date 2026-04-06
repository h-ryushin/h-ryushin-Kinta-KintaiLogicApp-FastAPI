from fastapi import FastAPI, Depends, HTTPException
from sqlmodel import Field, SQLModel, create_engine, Session, select
from fastapi.middleware.cors import CORSMiddleware
import os
from typing import List, Optional

# --- データの設計図 ---
class Kintai(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    shop: str
    date: str
    name: str
    startTime: str
    endTime: str
    breakMinutes: int
    totalHours: float

# --- 接続設定 ---
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

app = FastAPI()

# --- CORS設定 ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

# --- エンドポイント ---

# 保存
@app.post("/kintai/")
def create_kintai(kintai: Kintai, session: Session = Depends(get_session)):
    session.add(kintai)
    session.commit()
    session.refresh(kintai)
    return kintai

# 特定の日付のデータ取得
@app.get("/kintai/", response_model=List[Kintai])
def read_kintai(shop: str, date: str, session: Session = Depends(get_session)):
    statement = select(Kintai).where(Kintai.shop == shop, Kintai.date == date)
    return session.exec(statement).all()

# 【🆕追加】履歴用：その店舗の全データ取得
@app.get("/kintai/history", response_model=List[Kintai])
def read_kintai_history(shop: str, session: Session = Depends(get_session)):
    statement = select(Kintai).where(Kintai.shop == shop)
    return session.exec(statement).all()

# 【🆕追加】削除
@app.delete("/kintai/{kintai_id}")
def delete_kintai(kintai_id: int, session: Session = Depends(get_session)):
    kintai = session.get(Kintai, kintai_id)
    if not kintai:
        raise HTTPException(status_code=404, detail="Not found")
    session.delete(kintai)
    session.commit()
    return {"ok": True}