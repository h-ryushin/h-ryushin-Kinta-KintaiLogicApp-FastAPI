FROM node:20-slim

WORKDIR /app

# 依存関係ファイルをコピーしてインストール
COPY package*.json ./
RUN npm install

# 残りのソースコードをコピー
COPY . .

# Next.jsの開発サーバーを起動
CMD ["npm", "run", "dev"]