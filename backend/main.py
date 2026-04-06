from fastapi import FastAPI, Depends
from sqlmodel import Field, SQLModel, create_engine, Session, select
from fastapi.middleware.cors import CORSMiddleware
import os

# 設計図
class Kintai(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_name: str
    start_time: str
    end_time: str

# 接続設定
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

app = FastAPI()

# CORS設定（Next.jsからのアクセスを許可）
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

@app.get("/")
def read_root():
    return {"message": "Backend is running!"}

@app.post("/kintai/")
def create_kintai(kintai: Kintai, session: Session = Depends(get_session)):
    session.add(kintai)
    session.commit()
    session.refresh(kintai)
    return kintai