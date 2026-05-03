# Shooka Prototype

슈카월드·머니코믹스 YouTube 댓글을 온디맨드 분석해 잠재 피드백 분포와 액션 아이템을 보여주는 웹 서비스.

## 로컬 개발

```bash
npm install
cp .env.example .env.local  # 환경변수 채우기
npm run dev
```

## 환경변수

| 변수                     | 설명                                                            |
| ------------------------ | --------------------------------------------------------------- |
| `YOUTUBE_API_KEY`        | YouTube Data API v3 키                                          |
| `AI_PROVIDER`            | `openai` (기본값) \| `anthropic` \| `gemini`                    |
| `OPENAI_API_KEY`         | OpenAI API 키                                                   |
| `ANTHROPIC_API_KEY`      | Anthropic API 키                                                |
| `GEMINI_API_KEY`         | Google Gemini API 키                                            |
| `SHOOKAWORLD_CHANNEL_ID` | 슈카월드 채널 ID                                                |
| `MONEYCOMICS_CHANNEL_ID` | 머니코믹스 채널 ID                                              |
| `USAGE_LIMIT_PER_DAY`    | 24시간 분석 횟수 제한 (기본값: 15)                              |
| `DB_PATH`                | SQLite DB 경로 (기본값: `./data/app.db`)                        |
| `DOMAIN`                 | 운영 도메인 — 설정 시 Caddy가 HTTPS 자동 발급, 없으면 HTTP only |

## 서버 초기 세팅 (최초 1회)

### 1. EC2 인스턴스 준비

- AMI: Ubuntu 24.04 LTS
- 인스턴스 유형: t3.micro
- 보안 그룹 인바운드: 22 (SSH), 80 (HTTP), 443 (HTTPS)
- 탄력적 IP 할당 및 연결
- Route 53 A 레코드를 탄력적 IP로 설정

### 2. 서버에 Docker 설치

```bash
ssh -i /path/to/key.pem ubuntu@<서버IP>
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu
newgrp docker
```

### 3. 로컬에서 이미지 빌드 및 전송

```bash
# 이미지 빌드
docker build -t shooka-prototype .

# 이미지 저장
docker save shooka-prototype | gzip > shooka-prototype.tar.gz

# 서버에 전송
rsync -avz --progress \
  -e "ssh -i /path/to/key.pem" \
  shooka-prototype.tar.gz .env docker-compose.yml Caddyfile \
  ubuntu@<서버IP>:~/
```

### 4. 서버에서 실행

```bash
ssh -i /path/to/key.pem ubuntu@<서버IP>

docker load < shooka-prototype.tar.gz
docker compose up -d
```

## 운영 서버 업데이트

코드 변경 후 아래 순서로 진행:

```bash
# 1. 로컬에서 이미지 재빌드 및 저장
docker build -t shooka-prototype .
docker save shooka-prototype | gzip > shooka-prototype.tar.gz

# 2. 서버에 전송 (변경된 파일만)
rsync -avz --progress \
  -e "ssh -i /path/to/key.pem" \
  shooka-prototype.tar.gz \
  ubuntu@<서버IP>:~/

# 3. 서버에서 재시작
ssh -i /path/to/key.pem ubuntu@<서버IP> \
  "docker load < shooka-prototype.tar.gz && docker compose down && docker compose up -d"
```

환경변수(`.env`) 또는 `docker-compose.yml`, `Caddyfile`이 변경된 경우 해당 파일도 rsync에 추가.
