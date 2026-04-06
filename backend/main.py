from fastapi import FastAPI, Depends, Query
from sqlmodel import Field, SQLModel, create_engine, Session, select
from fastapi.middleware.cors import CORSMiddleware
import os
from typing import List, Optional

# --- 1. データの設計図 (フロントのStaffCardに合わせる) ---
class Kintai(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    shop: str            # 'kosai' or 'nishieki'
    date: str            # '2026-04-06'
    name: str            # スタッフ名
    startTime: str       # '17:30'
    endTime: str         # '25:30'
    breakMinutes: int    # 休憩時間
    totalHours: float    # 計算済みの労働時間

# --- 2. データベース接続設定 ---
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

app = FastAPI()

# --- 3. CORS設定 (Next.jsからの通信を許可) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 起動時にテーブル作成
@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

# --- 4. APIエンドポイント (窓口) ---

# 【保存】データを1件ずつ保存する
@app.post("/kintai/")
def create_kintai(kintai: Kintai, session: Session = Depends(get_session)):
    session.add(kintai)
    session.commit()
    session.refresh(kintai)
    return kintai

# 【取得】日付と店舗で絞り込んでリストを返す
@app.get("/kintai/", response_model=List[Kintai])
def read_kintai(
    shop: str, 
    date: str, 
    session: Session = Depends(get_session)
):
    # SQLでいう「WHERE shop = ... AND date = ...」を実行
    statement = select(Kintai).where(Kintai.shop == shop, Kintai.date == date)
    results = session.exec(statement).all()
    return results