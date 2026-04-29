# Shooka Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 슈카월드·머니코믹스 YouTube 댓글을 온디맨드 분석해 잠재 피드백 분포와 액션 아이템을 보여주는 라이브 웹 서비스를 구축한다.

**Architecture:** Next.js App Router 단일 코드베이스 (API Route 포함), SQLite 카운터·캐시, 사전 분석 결과는 `data/cache/*.json`으로 이미지에 번들. Caddy가 HTTPS·reverse proxy 담당.

**Tech Stack:** Next.js 14+ (App Router, TypeScript), Tailwind CSS, Recharts, better-sqlite3, @anthropic-ai/sdk, googleapis, zod, Docker Compose, Caddy

---

## File Map

```
shooka-prototype/
├── .env.example
├── .env.local                          # gitignore
├── .gitignore
├── package.json
├── next.config.mjs
├── tsconfig.json
├── tailwind.config.ts
├── Dockerfile
├── docker-compose.yml
├── Caddyfile
├── scripts/
│   ├── build-cache.ts                  # CLI: 채널 최신 N개 분석 → data/cache/*.json
│   └── seed-channels.ts               # 채널 ID 확인 유틸리티
├── data/cache/                         # 사전 분석 JSON (커밋됨)
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx                    # 단일 페이지 (영역 A·B·C·D)
    │   ├── globals.css
    │   └── api/
    │       ├── analyze/route.ts        # POST SSE 스트리밍
    │       ├── cases/route.ts          # GET 사전 분석 목록
    │       └── usage/route.ts          # GET 카운터
    ├── components/
    │   ├── Landing.tsx                 # 영역 A: 헤더 + UsageBadge + VideoInput
    │   ├── UsageBadge.tsx
    │   ├── VideoInput.tsx
    │   ├── ProgressStream.tsx          # SSE 단계별 표시
    │   ├── AnalysisResult.tsx          # 영역 B
    │   ├── FeedbackChart.tsx
    │   ├── ActionCards.tsx
    │   ├── CaseCards.tsx               # 영역 C
    │   └── Footer.tsx                  # 영역 D
    ├── lib/
    │   ├── types.ts                    # 공통 타입 (AnalysisResult 등)
    │   ├── youtube.ts                  # YouTube Data API 래퍼
    │   ├── anthropic.ts               # Claude Haiku 래퍼
    │   ├── pipeline.ts                # 6단계 분석 파이프라인
    │   ├── db.ts                      # better-sqlite3 연결 + 마이그레이션
    │   ├── counter.ts                 # 24시간 전역 카운터
    │   └── cache.ts                   # 파일 캐시 + SQLite 캐시
    └── prompts/
        ├── classify-feedback.ts       # 잠재 피드백 분류 프롬프트
        ├── classify-expression.ts     # 표현 방식 분류 프롬프트
        └── generate-actions.ts        # 액션 아이템 생성 프롬프트
```

---

## Task 0: 프로젝트 초기화

**Files:**
- Create: `package.json`, `next.config.mjs`, `tsconfig.json`, `tailwind.config.ts`
- Create: `.env.example`, `.gitignore`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

- [ ] **Step 1: Next.js 프로젝트 생성**

```bash
cd /home/sy/Documents/zk/area/find-job
npx create-next-app@latest shooka-prototype \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*"
```

`--no-src-dir` 없이 생성하면 src/ 구조가 기본. 실제로는 src/ 구조를 쓸 것이므로:

```bash
cd /home/sy/Documents/zk/area/find-job
npx create-next-app@latest shooka-prototype \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --import-alias "@/*"
```

- [ ] **Step 2: 추가 의존성 설치**

```bash
cd shooka-prototype
npm install @anthropic-ai/sdk googleapis better-sqlite3 recharts zod
npm install --save-dev @types/better-sqlite3 tsx
```

- [ ] **Step 3: `.env.example` 작성**

```bash
cat > .env.example << 'EOF'
# YouTube Data API v3
YOUTUBE_API_KEY=

# Anthropic Claude
ANTHROPIC_API_KEY=
CLAUDE_MODEL=claude-haiku-4-5-20251001

# 호출 제한 (24시간)
USAGE_LIMIT_PER_DAY=15

# 채널 ID (seed-channels.ts로 확인)
SHOOKAWORLD_CHANNEL_ID=
MONEYCOMICS_CHANNEL_ID=

# DB 경로
DB_PATH=./data/app.db

# 도메인 (Caddy용, 개발 중 비워둠)
DOMAIN=
EOF
```

- [ ] **Step 4: `.gitignore`에 민감 파일 추가**

`.gitignore`에 아래 항목이 없으면 추가:

```
.env.local
.env
data/app.db
data/*.db
```

- [ ] **Step 5: `data/cache/` 디렉토리 생성 및 `.gitkeep`**

```bash
mkdir -p data/cache
touch data/cache/.gitkeep
```

- [ ] **Step 6: `scripts/` 디렉토리 생성**

```bash
mkdir -p scripts
```

- [ ] **Step 7: `package.json`에 스크립트 추가**

`package.json`의 `scripts` 블록에 추가:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "cache:build": "tsx scripts/build-cache.ts"
  }
}
```

- [ ] **Step 8: 개발 서버 실행 확인**

```bash
npm run dev
```

Expected: `http://localhost:3000` 접속 시 Next.js 기본 페이지 표시. 오류 없이 컴파일됨.

- [ ] **Step 9: 커밋**

```bash
git init
git add -A
git commit -m "feat: initialize Next.js project with dependencies"
```

---

## Task 1: 공통 타입 정의

**Files:**
- Create: `src/lib/types.ts`

- [ ] **Step 1: `src/lib/types.ts` 작성**

```typescript
export type ChannelName = 'shookaworld' | 'moneycomics';

export type SampleComment = {
  text: string;
  likeCount: number;
  author: string;
};

export type FeedbackCategory = {
  category: string;
  weightedScore: number;
  commentCount: number;
  sampleComments: SampleComment[];
};

export type ExpressionCategory = {
  type: string;
  count: number;
};

export type ActionItem = {
  title: string;
  rationale: string;
  sourceFeedback: string;
};

export type AnalysisResult = {
  videoId: string;
  channelId: string;
  channelName: ChannelName;
  videoTitle: string;
  videoUrl: string;
  publishedAt: string;
  thumbnailUrl: string;
  analyzedAt: string;
  commentCount: number;
  feedbackDistribution: FeedbackCategory[];
  expressionDistribution: ExpressionCategory[];
  actionItems: ActionItem[];
};

export type UsageStatus = {
  count: number;
  limit: number;
  resetAt: number;
};

export type CaseMeta = {
  videoId: string;
  channelName: ChannelName;
  videoTitle: string;
  thumbnailUrl: string;
  publishedAt: string;
};

export type PipelineEvent =
  | { stage: 'collecting'; message: string }
  | { stage: 'filtering'; message: string }
  | { stage: 'classifying-feedback'; message: string }
  | { stage: 'classifying-expression'; message: string }
  | { stage: 'aggregating'; message: string }
  | { stage: 'generating-actions'; message: string }
  | { stage: 'done'; result: AnalysisResult }
  | { stage: 'error'; message: string };
```

- [ ] **Step 2: 커밋**

```bash
git add src/lib/types.ts
git commit -m "feat: add shared types"
```

---

## Task 2: YouTube API 래퍼

**Files:**
- Create: `src/lib/youtube.ts`

- [ ] **Step 1: `src/lib/youtube.ts` 작성**

YouTube Data API v3의 `commentThreads.list`는 `order=relevance` (기본값)로 호출하면 관련도 순. 좋아요 상위 50개는 클라이언트에서 재정렬한다.

```typescript
import { google } from 'googleapis';

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

export type RawComment = {
  text: string;
  likeCount: number;
  author: string;
  publishedAt: string;
};

export type VideoMeta = {
  videoId: string;
  channelId: string;
  title: string;
  publishedAt: string;
  thumbnailUrl: string;
};

export function extractVideoId(url: string): string | null {
  const patterns = [
    /[?&]v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export async function getVideoMeta(videoId: string): Promise<VideoMeta> {
  const res = await youtube.videos.list({
    part: ['snippet'],
    id: [videoId],
  });

  const item = res.data.items?.[0];
  if (!item) throw new Error(`Video not found: ${videoId}`);

  const snippet = item.snippet!;
  if (snippet.liveBroadcastContent === 'live') {
    throw new Error('라이브 방송 중인 영상은 분석할 수 없습니다.');
  }

  return {
    videoId,
    channelId: snippet.channelId!,
    title: snippet.title!,
    publishedAt: snippet.publishedAt!,
    thumbnailUrl:
      snippet.thumbnails?.high?.url ||
      snippet.thumbnails?.default?.url ||
      '',
  };
}

export async function fetchComments(videoId: string): Promise<RawComment[]> {
  const allComments: RawComment[] = [];
  let pageToken: string | undefined;

  // 최대 2페이지(200개)까지 수집 후 정렬·샘플링
  for (let page = 0; page < 2; page++) {
    const res = await youtube.commentThreads.list({
      part: ['snippet'],
      videoId,
      maxResults: 100,
      order: 'relevance',
      pageToken,
    });

    const items = res.data.items || [];
    for (const item of items) {
      const top = item.snippet?.topLevelComment?.snippet;
      if (!top) continue;
      allComments.push({
        text: top.textDisplay || '',
        likeCount: top.likeCount || 0,
        author: top.authorDisplayName || '',
        publishedAt: top.publishedAt || '',
      });
    }

    pageToken = res.data.nextPageToken || undefined;
    if (!pageToken) break;
  }

  // 좋아요 상위 50개
  const sorted = [...allComments].sort((a, b) => b.likeCount - a.likeCount);
  const top50 = sorted.slice(0, 50);

  // 무작위 50개 (상위 50과 중복 제거)
  const top50Texts = new Set(top50.map((c) => c.text));
  const rest = allComments.filter((c) => !top50Texts.has(c.text));
  const shuffled = rest.sort(() => Math.random() - 0.5).slice(0, 50);

  return [...top50, ...shuffled];
}
```

- [ ] **Step 2: 환경변수 `.env.local` 작성 (수동)**

아래를 `.env.local`에 직접 채워 넣기:

```
YOUTUBE_API_KEY=<발급한 키>
ANTHROPIC_API_KEY=<발급한 키>
CLAUDE_MODEL=claude-haiku-4-5-20251001
USAGE_LIMIT_PER_DAY=15
SHOOKAWORLD_CHANNEL_ID=<확인 후 입력>
MONEYCOMICS_CHANNEL_ID=<확인 후 입력>
DB_PATH=./data/app.db
```

- [ ] **Step 3: `scripts/seed-channels.ts` 작성 (채널 ID 확인용)**

```typescript
import { google } from 'googleapis';

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

async function findChannel(query: string) {
  const res = await youtube.search.list({
    part: ['snippet'],
    q: query,
    type: ['channel'],
    maxResults: 3,
  });
  for (const item of res.data.items || []) {
    console.log(item.snippet?.channelTitle, '->', item.id?.channelId);
  }
}

findChannel('슈카월드').then(() => findChannel('머니코믹스'));
```

실행:

```bash
YOUTUBE_API_KEY=<키> npx tsx scripts/seed-channels.ts
```

- [ ] **Step 4: 커밋**

```bash
git add src/lib/youtube.ts scripts/seed-channels.ts
git commit -m "feat: add YouTube API wrapper and channel ID helper"
```

---

## Task 3: Claude 래퍼 + 프롬프트

**Files:**
- Create: `src/lib/anthropic.ts`
- Create: `src/prompts/classify-feedback.ts`
- Create: `src/prompts/classify-expression.ts`
- Create: `src/prompts/generate-actions.ts`

- [ ] **Step 1: `src/lib/anthropic.ts` 작성**

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const model = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';

export async function callClaude(prompt: string): Promise<string> {
  const msg = await client.messages.create({
    model,
    max_tokens: 4096,
    temperature: 0.1,
    messages: [{ role: 'user', content: prompt }],
  });
  const block = msg.content[0];
  if (block.type !== 'text') throw new Error('Unexpected response type');
  return block.text;
}

export async function callClaudeJSON<T>(prompt: string): Promise<T> {
  const text = await callClaude(prompt);
  const match = text.match(/```json\s*([\s\S]*?)```/) ||
                text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
  if (!match) throw new Error('No JSON found in response');
  return JSON.parse(match[1]) as T;
}
```

- [ ] **Step 2: `src/prompts/classify-feedback.ts` 작성**

```typescript
import type { RawComment } from '@/lib/youtube';

const FEEDBACK_CATEGORIES = [
  '콘텐츠 길이',
  '주제 깊이',
  '주제 다양성',
  '사실 정확성',
  '출연자 구성',
  '영상 구성',
  '시의성',
  '기타',
];

export type FeedbackClassification = {
  index: number;
  category: string;
};

export function buildFeedbackPrompt(comments: RawComment[]): string {
  const categoriesStr = FEEDBACK_CATEGORIES.map((c, i) => `${i + 1}. ${c}`).join('\n');
  const commentsStr = comments
    .map((c, i) => `[${i}] (좋아요 ${c.likeCount}) ${c.text}`)
    .join('\n');

  return `당신은 YouTube 댓글 분류 전문가입니다. 아래 댓글들을 잠재 피드백 카테고리로 분류하세요.

## 카테고리
${categoriesStr}

## 댓글 (인덱스: 텍스트)
${commentsStr}

## 지시사항
- 각 댓글을 위 카테고리 중 하나로 분류
- 카테고리가 명확히 맞지 않으면 "기타"
- JSON 배열로만 응답 (다른 텍스트 없이)

\`\`\`json
[{"index": 0, "category": "카테고리명"}, ...]
\`\`\``;
}
```

- [ ] **Step 3: `src/prompts/classify-expression.ts` 작성**

```typescript
import type { RawComment } from '@/lib/youtube';

const EXPRESSION_TYPES = ['칭찬형', '비판형', '질문형', '농담·밈형', '정보 보충형'];

export type ExpressionClassification = {
  index: number;
  type: string;
};

export function buildExpressionPrompt(comments: RawComment[]): string {
  const typesStr = EXPRESSION_TYPES.map((t, i) => `${i + 1}. ${t}`).join('\n');
  const commentsStr = comments
    .map((c, i) => `[${i}] ${c.text}`)
    .join('\n');

  return `당신은 YouTube 댓글 분류 전문가입니다. 아래 댓글들을 표현 방식으로 분류하세요.

## 표현 방식 유형
${typesStr}

## 댓글
${commentsStr}

## 지시사항
- 각 댓글을 위 유형 중 하나로 분류
- JSON 배열로만 응답

\`\`\`json
[{"index": 0, "type": "유형명"}, ...]
\`\`\``;
}
```

- [ ] **Step 4: `src/prompts/generate-actions.ts` 작성**

```typescript
import type { FeedbackCategory } from '@/lib/types';

export function buildActionsPrompt(
  videoTitle: string,
  feedbackDistribution: FeedbackCategory[]
): string {
  const feedbackStr = feedbackDistribution
    .slice(0, 6)
    .map(
      (f) =>
        `- ${f.category} (가중점수: ${f.weightedScore}, 댓글수: ${f.commentCount})\n  대표 댓글: ${f.sampleComments.slice(0, 2).map((c) => `"${c.text}"`).join(', ')}`
    )
    .join('\n');

  return `당신은 YouTube 콘텐츠 전략가입니다. 댓글 분석 결과를 바탕으로 다음 영상 기획에 활용할 수 있는 구체적인 액션 아이템을 생성하세요.

## 영상 제목
${videoTitle}

## 잠재 피드백 분포 (좋아요 가중 점수 순)
${feedbackStr}

## 지시사항
- 5~7개의 액션 아이템 생성
- 각 아이템은 즉시 실행 가능한 구체적 제안이어야 함
- 근거가 되는 피드백 카테고리와 대표 댓글을 명시
- JSON 배열로만 응답

\`\`\`json
[
  {
    "title": "액션 제안 (1~2문장)",
    "rationale": "어떤 피드백에 근거한 제안인지 설명",
    "sourceFeedback": "피드백 카테고리명"
  }
]
\`\`\``;
}
```

- [ ] **Step 5: 커밋**

```bash
git add src/lib/anthropic.ts src/prompts/
git commit -m "feat: add Claude wrapper and classification prompts"
```

---

## Task 4: 분석 파이프라인

**Files:**
- Create: `src/lib/pipeline.ts`

- [ ] **Step 1: `src/lib/pipeline.ts` 작성**

```typescript
import { getVideoMeta, fetchComments, type RawComment } from '@/lib/youtube';
import { callClaudeJSON } from '@/lib/anthropic';
import { buildFeedbackPrompt, type FeedbackClassification } from '@/prompts/classify-feedback';
import { buildExpressionPrompt, type ExpressionClassification } from '@/prompts/classify-expression';
import { buildActionsPrompt } from '@/prompts/generate-actions';
import type { AnalysisResult, FeedbackCategory, ExpressionCategory, ActionItem, PipelineEvent } from '@/lib/types';

function filterComments(comments: RawComment[]): RawComment[] {
  return comments.filter((c) => {
    const text = c.text.trim();
    if (text.length < 5) return false;
    // 순수 이모지/특수문자만인 댓글 제거
    if (/^[\p{Emoji}\s]+$/u.test(text)) return false;
    return true;
  });
}

function buildFeedbackDistribution(
  comments: RawComment[],
  classifications: FeedbackClassification[]
): FeedbackCategory[] {
  const map = new Map<string, { weightedScore: number; comments: RawComment[] }>();

  for (const cls of classifications) {
    const comment = comments[cls.index];
    if (!comment) continue;
    const existing = map.get(cls.category) || { weightedScore: 0, comments: [] };
    existing.weightedScore += comment.likeCount + 1;
    existing.comments.push(comment);
    map.set(cls.category, existing);
  }

  return Array.from(map.entries())
    .map(([category, data]) => ({
      category,
      weightedScore: data.weightedScore,
      commentCount: data.comments.length,
      sampleComments: data.comments
        .sort((a, b) => b.likeCount - a.likeCount)
        .slice(0, 3)
        .map((c) => ({ text: c.text, likeCount: c.likeCount, author: c.author })),
    }))
    .sort((a, b) => b.weightedScore - a.weightedScore);
}

function buildExpressionDistribution(
  classifications: ExpressionClassification[]
): ExpressionCategory[] {
  const map = new Map<string, number>();
  for (const cls of classifications) {
    map.set(cls.type, (map.get(cls.type) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

export async function runPipeline(
  videoUrl: string,
  onEvent: (event: PipelineEvent) => void
): Promise<AnalysisResult> {
  // Stage 1: 수집
  onEvent({ stage: 'collecting', message: '영상 메타데이터·댓글 수집 중...' });
  const videoId = videoUrl.match(/[?&]v=([^&]+)/)?.at(1) ||
                  videoUrl.match(/youtu\.be\/([^?]+)/)?.at(1);
  if (!videoId) throw new Error('유효하지 않은 YouTube URL');

  const [meta, rawComments] = await Promise.all([
    getVideoMeta(videoId),
    fetchComments(videoId),
  ]);
  onEvent({ stage: 'collecting', message: `댓글 ${rawComments.length}개 수집 완료` });

  // Stage 2: 정제
  onEvent({ stage: 'filtering', message: '댓글 정제 중...' });
  const comments = filterComments(rawComments);
  onEvent({ stage: 'filtering', message: `${comments.length}개 댓글 정제 완료` });

  // Stage 3: 잠재 피드백 분류
  onEvent({ stage: 'classifying-feedback', message: '잠재 피드백 분류 중...' });
  const feedbackClassifications = await callClaudeJSON<FeedbackClassification[]>(
    buildFeedbackPrompt(comments)
  );
  onEvent({ stage: 'classifying-feedback', message: '잠재 피드백 분류 완료' });

  // Stage 4: 표현 방식 분류
  onEvent({ stage: 'classifying-expression', message: '표현 방식 분류 중...' });
  const expressionClassifications = await callClaudeJSON<ExpressionClassification[]>(
    buildExpressionPrompt(comments)
  );
  onEvent({ stage: 'classifying-expression', message: '표현 방식 분류 완료' });

  // Stage 5: 집계
  onEvent({ stage: 'aggregating', message: '결과 집계 중...' });
  const feedbackDistribution = buildFeedbackDistribution(comments, feedbackClassifications);
  const expressionDistribution = buildExpressionDistribution(expressionClassifications);

  // Stage 6: 액션 아이템
  onEvent({ stage: 'generating-actions', message: '액션 아이템 생성 중...' });
  const actionItems = await callClaudeJSON<ActionItem[]>(
    buildActionsPrompt(meta.title, feedbackDistribution)
  );
  onEvent({ stage: 'generating-actions', message: '액션 아이템 생성 완료' });

  const channelName =
    meta.channelId === process.env.SHOOKAWORLD_CHANNEL_ID
      ? 'shookaworld'
      : 'moneycomics';

  const result: AnalysisResult = {
    videoId,
    channelId: meta.channelId,
    channelName,
    videoTitle: meta.title,
    videoUrl,
    publishedAt: meta.publishedAt,
    thumbnailUrl: meta.thumbnailUrl,
    analyzedAt: new Date().toISOString(),
    commentCount: comments.length,
    feedbackDistribution,
    expressionDistribution,
    actionItems,
  };

  onEvent({ stage: 'done', result });
  return result;
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/lib/pipeline.ts
git commit -m "feat: add 6-stage analysis pipeline"
```

---

## Task 5: 캐시 빌드 스크립트 + 사전 분석

**Files:**
- Create: `scripts/build-cache.ts`

- [ ] **Step 1: `scripts/build-cache.ts` 작성**

```typescript
import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { runPipeline } from '../src/lib/pipeline';

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

async function getLatestVideoIds(channelId: string, count = 2): Promise<string[]> {
  const res = await youtube.search.list({
    part: ['id'],
    channelId,
    maxResults: count,
    order: 'date',
    type: ['video'],
  });
  return (res.data.items || []).map((item) => item.id!.videoId!).filter(Boolean);
}

async function buildCache(channelId: string, channelSlug: string, count = 2) {
  console.log(`\n[${channelSlug}] 최신 ${count}개 영상 분석 시작`);
  const videoIds = await getLatestVideoIds(channelId, count);

  for (const videoId of videoIds) {
    console.log(`  Processing ${videoId}...`);
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const result = await runPipeline(videoUrl, (event) => {
      console.log(`    [${event.stage}]`, 'message' in event ? event.message : '완료');
    });

    const outPath = path.join(process.cwd(), 'data', 'cache', `${channelSlug}-${videoId}.json`);
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
    console.log(`  Saved: ${outPath}`);
  }
}

async function main() {
  const shookaChannelId = process.env.SHOOKAWORLD_CHANNEL_ID;
  const moneyChannelId = process.env.MONEYCOMICS_CHANNEL_ID;

  if (!shookaChannelId || !moneyChannelId) {
    throw new Error('SHOOKAWORLD_CHANNEL_ID 또는 MONEYCOMICS_CHANNEL_ID 환경변수 없음');
  }

  await buildCache(shookaChannelId, 'shookaworld');
  await buildCache(moneyChannelId, 'moneycomics');
  console.log('\n캐시 빌드 완료. data/cache/ 확인.');
}

main().catch(console.error);
```

- [ ] **Step 2: 캐시 빌드 실행 (환경변수 설정 후)**

```bash
# .env.local의 채널 ID가 채워져 있어야 함
npm run cache:build
```

Expected: `data/cache/shookaworld-{id}.json` × 2, `data/cache/moneycomics-{id}.json` × 2 생성

- [ ] **Step 3: 생성된 JSON 수동 확인**

```bash
ls data/cache/*.json | wc -l   # 4 이어야 함
cat data/cache/shookaworld-*.json | python3 -m json.tool | head -50
```

- [ ] **Step 4: 커밋 (JSON 포함)**

```bash
git add scripts/build-cache.ts data/cache/*.json
git commit -m "feat: add cache build script and pre-analyzed results"
```

---

## Task 6: SQLite DB + 카운터 + 캐시 레이어

**Files:**
- Create: `src/lib/db.ts`
- Create: `src/lib/counter.ts`
- Create: `src/lib/cache.ts`

- [ ] **Step 1: `src/lib/db.ts` 작성**

```typescript
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  const dbPath = process.env.DB_PATH || './data/app.db';
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  _db = new Database(dbPath);
  _db.pragma('journal_mode = WAL');

  _db.exec(`
    CREATE TABLE IF NOT EXISTS usage_counter (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      count INTEGER NOT NULL DEFAULT 0,
      reset_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS analysis_cache (
      video_id TEXT PRIMARY KEY,
      result_json TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    INSERT OR IGNORE INTO usage_counter (id, count, reset_at)
    VALUES (1, 0, ${Date.now() + 24 * 60 * 60 * 1000});
  `);

  return _db;
}
```

- [ ] **Step 2: `src/lib/counter.ts` 작성**

```typescript
import { getDb } from '@/lib/db';
import type { UsageStatus } from '@/lib/types';

const LIMIT = parseInt(process.env.USAGE_LIMIT_PER_DAY || '15', 10);
const DAY_MS = 24 * 60 * 60 * 1000;

export function getUsage(): UsageStatus {
  const db = getDb();
  const row = db.prepare('SELECT count, reset_at FROM usage_counter WHERE id = 1').get() as
    | { count: number; reset_at: number }
    | undefined;

  if (!row) return { count: 0, limit: LIMIT, resetAt: Date.now() + DAY_MS };

  if (Date.now() > row.reset_at) {
    const newResetAt = Date.now() + DAY_MS;
    db.prepare('UPDATE usage_counter SET count = 0, reset_at = ? WHERE id = 1').run(newResetAt);
    return { count: 0, limit: LIMIT, resetAt: newResetAt };
  }

  return { count: row.count, limit: LIMIT, resetAt: row.reset_at };
}

// 카운터 +1 시도. 한도 초과 시 false 반환
export function consumeUsage(): boolean {
  const usage = getUsage();
  if (usage.count >= usage.limit) return false;

  const db = getDb();
  db.prepare('UPDATE usage_counter SET count = count + 1 WHERE id = 1').run();
  return true;
}
```

- [ ] **Step 3: `src/lib/cache.ts` 작성**

```typescript
import fs from 'fs';
import path from 'path';
import { getDb } from '@/lib/db';
import type { AnalysisResult } from '@/lib/types';

const CACHE_DIR = path.join(process.cwd(), 'data', 'cache');

// 파일 캐시(사전 분석) 우선 → SQLite 캐시 → null
export function getCached(videoId: string): AnalysisResult | null {
  // 사전 분석 파일 탐색 (채널명 prefix 불문)
  if (fs.existsSync(CACHE_DIR)) {
    const files = fs.readdirSync(CACHE_DIR).filter((f) => f.endsWith(`-${videoId}.json`));
    if (files.length > 0) {
      const raw = fs.readFileSync(path.join(CACHE_DIR, files[0]), 'utf-8');
      return JSON.parse(raw) as AnalysisResult;
    }
  }

  // SQLite 캐시
  const db = getDb();
  const row = db
    .prepare('SELECT result_json FROM analysis_cache WHERE video_id = ?')
    .get(videoId) as { result_json: string } | undefined;
  if (row) return JSON.parse(row.result_json) as AnalysisResult;

  return null;
}

export function setCached(videoId: string, result: AnalysisResult): void {
  const db = getDb();
  db.prepare(
    'INSERT OR REPLACE INTO analysis_cache (video_id, result_json, created_at) VALUES (?, ?, ?)'
  ).run(videoId, JSON.stringify(result), Date.now());
}

export function listCaseMetas() {
  if (!fs.existsSync(CACHE_DIR)) return [];
  const files = fs.readdirSync(CACHE_DIR).filter((f) => f.endsWith('.json'));
  return files.map((file) => {
    const raw = fs.readFileSync(path.join(CACHE_DIR, file), 'utf-8');
    const result = JSON.parse(raw) as AnalysisResult;
    return {
      videoId: result.videoId,
      channelName: result.channelName,
      videoTitle: result.videoTitle,
      thumbnailUrl: result.thumbnailUrl,
      publishedAt: result.publishedAt,
    };
  });
}
```

- [ ] **Step 4: 커밋**

```bash
git add src/lib/db.ts src/lib/counter.ts src/lib/cache.ts
git commit -m "feat: add SQLite db, usage counter, and cache layer"
```

---

## Task 7: API Routes

**Files:**
- Create: `src/app/api/cases/route.ts`
- Create: `src/app/api/usage/route.ts`
- Create: `src/app/api/analyze/route.ts`

- [ ] **Step 1: `src/app/api/cases/route.ts` 작성**

```typescript
import { NextResponse } from 'next/server';
import { listCaseMetas } from '@/lib/cache';

export async function GET() {
  const cases = listCaseMetas();
  return NextResponse.json(cases);
}
```

- [ ] **Step 2: `src/app/api/usage/route.ts` 작성**

```typescript
import { NextResponse } from 'next/server';
import { getUsage } from '@/lib/counter';

export async function GET() {
  const usage = getUsage();
  return NextResponse.json(usage);
}
```

- [ ] **Step 3: `src/app/api/analyze/route.ts` 작성**

```typescript
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { extractVideoId } from '@/lib/youtube';
import { getCached, setCached } from '@/lib/cache';
import { consumeUsage } from '@/lib/counter';
import { runPipeline } from '@/lib/pipeline';
import type { PipelineEvent } from '@/lib/types';

const schema = z.object({ videoUrl: z.string().url() });

const ALLOWED_CHANNELS = [
  process.env.SHOOKAWORLD_CHANNEL_ID,
  process.env.MONEYCOMICS_CHANNEL_ID,
].filter(Boolean);

function encodeSSE(event: PipelineEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: '유효하지 않은 요청' }), { status: 400 });
  }

  const { videoUrl } = parsed.data;
  const videoId = extractVideoId(videoUrl);
  if (!videoId) {
    return new Response(JSON.stringify({ error: '유효하지 않은 YouTube URL' }), { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: PipelineEvent) => {
        controller.enqueue(new TextEncoder().encode(encodeSSE(event)));
      };

      try {
        // 캐시 확인
        const cached = getCached(videoId);
        if (cached) {
          send({ stage: 'done', result: cached });
          controller.close();
          return;
        }

        // 채널 검증은 파이프라인 내 getVideoMeta 후에 수행
        // 카운터 차감 시도
        const allowed = consumeUsage();
        if (!allowed) {
          send({ stage: 'error', message: '오늘 분석 한도에 도달했습니다. 내일 다시 시도해주세요.' });
          controller.close();
          return;
        }

        const result = await runPipeline(videoUrl, send);

        // 채널 검증
        if (ALLOWED_CHANNELS.length > 0 && !ALLOWED_CHANNELS.includes(result.channelId)) {
          send({ stage: 'error', message: '이 도구는 슈카월드 / 머니코믹스 채널 영상만 분석합니다.' });
          controller.close();
          return;
        }

        setCached(videoId, result);
      } catch (err) {
        const message = err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.';
        send({ stage: 'error', message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
```

- [ ] **Step 4: API 동작 확인**

```bash
npm run dev &
sleep 3

curl http://localhost:3000/api/cases | python3 -m json.tool
curl http://localhost:3000/api/usage | python3 -m json.tool
```

Expected: cases는 4개 JSON 배열, usage는 `{count, limit, resetAt}`.

- [ ] **Step 5: 커밋**

```bash
git add src/app/api/
git commit -m "feat: add API routes for cases, usage, and analyze SSE"
```

---

## Task 8: 프론트엔드 컴포넌트

**Files:**
- Modify: `src/app/page.tsx`, `src/app/layout.tsx`
- Create: `src/components/Landing.tsx`
- Create: `src/components/UsageBadge.tsx`
- Create: `src/components/VideoInput.tsx`
- Create: `src/components/ProgressStream.tsx`
- Create: `src/components/AnalysisResult.tsx`
- Create: `src/components/FeedbackChart.tsx`
- Create: `src/components/ActionCards.tsx`
- Create: `src/components/CaseCards.tsx`
- Create: `src/components/Footer.tsx`

- [ ] **Step 1: `src/app/layout.tsx` 수정**

```typescript
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '슈카 댓글 분석기',
  description: '슈카월드·머니코믹스 YouTube 댓글 잠재 피드백 분석 도구',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-gray-950 text-gray-100 min-h-screen">{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: `src/components/UsageBadge.tsx` 작성**

```typescript
'use client';
import { useEffect, useState } from 'react';
import type { UsageStatus } from '@/lib/types';

export default function UsageBadge() {
  const [usage, setUsage] = useState<UsageStatus | null>(null);

  useEffect(() => {
    const fetch_ = () =>
      fetch('/api/usage')
        .then((r) => r.json())
        .then(setUsage)
        .catch(() => null);

    fetch_();
    const id = setInterval(fetch_, 10_000);
    return () => clearInterval(id);
  }, []);

  if (!usage) return null;

  const remaining = usage.limit - usage.count;
  return (
    <div className="text-sm text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 rounded-lg px-4 py-2 text-center">
      이 도구는 24시간 동안 <strong>{usage.limit}회</strong> 분석 가능합니다. 현재{' '}
      <strong>{usage.count}회</strong> 사용 중 ({remaining}회 남음).{' '}
      슈카친구들의 누구든 자유롭게 시도해보세요.
    </div>
  );
}
```

- [ ] **Step 3: `src/components/VideoInput.tsx` 작성**

```typescript
'use client';
import { useState } from 'react';
import type { PipelineEvent, AnalysisResult } from '@/lib/types';

type Props = {
  onEvents: (events: PipelineEvent[]) => void;
  onResult: (result: AnalysisResult) => void;
};

export default function VideoInput({ onEvents, onResult }: Props) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || loading) return;

    setLoading(true);
    onEvents([]);

    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoUrl: url }),
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    const accumulated: PipelineEvent[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const chunk of lines) {
        const dataLine = chunk.replace(/^data: /, '');
        if (!dataLine) continue;
        try {
          const event = JSON.parse(dataLine) as PipelineEvent;
          accumulated.push(event);
          onEvents([...accumulated]);
          if (event.stage === 'done') onResult(event.result);
        } catch {
          // 파싱 실패 무시
        }
      }
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://www.youtube.com/watch?v=..."
        className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading || !url.trim()}
        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-6 py-3 rounded-lg text-sm font-medium transition-colors"
      >
        {loading ? '분석 중...' : '분석 시작'}
      </button>
    </form>
  );
}
```

- [ ] **Step 4: `src/components/ProgressStream.tsx` 작성**

```typescript
import type { PipelineEvent } from '@/lib/types';

const STAGE_LABELS: Record<string, string> = {
  collecting: '댓글 수집',
  filtering: '댓글 정제',
  'classifying-feedback': '잠재 피드백 분류',
  'classifying-expression': '표현 방식 분류',
  aggregating: '집계',
  'generating-actions': '액션 아이템 생성',
  done: '완료',
  error: '오류',
};

export default function ProgressStream({ events }: { events: PipelineEvent[] }) {
  if (!events.length) return null;

  return (
    <div className="space-y-1 text-sm">
      {events.map((event, i) => (
        <div
          key={i}
          className={`flex items-center gap-2 ${
            event.stage === 'error' ? 'text-red-400' : 'text-gray-300'
          }`}
        >
          <span className="text-xs font-mono text-gray-500 w-36">
            [{STAGE_LABELS[event.stage] || event.stage}]
          </span>
          <span>{'message' in event ? event.message : ''}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: `src/components/FeedbackChart.tsx` 작성**

```typescript
'use client';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { FeedbackCategory } from '@/lib/types';

export default function FeedbackChart({ data }: { data: FeedbackCategory[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">잠재 피드백 분포</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ left: 16, right: 16 }}>
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="category" width={100} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value) => [`${value}`, '가중 점수']}
            contentStyle={{ background: '#1f2937', border: 'none', fontSize: 12 }}
          />
          <Bar dataKey="weightedScore" radius={[0, 4, 4, 0]} onClick={(d) => setExpanded(d.category === expanded ? null : d.category)}>
            {data.map((entry) => (
              <Cell
                key={entry.category}
                fill={entry.category === expanded ? '#3b82f6' : '#6366f1'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {expanded && (() => {
        const item = data.find((d) => d.category === expanded);
        if (!item) return null;
        return (
          <div className="mt-4 bg-gray-800 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-blue-400">{item.category} — 대표 댓글</p>
            {item.sampleComments.map((c, i) => (
              <div key={i} className="text-sm text-gray-300 border-l-2 border-gray-600 pl-3">
                <span className="text-yellow-400 text-xs">👍 {c.likeCount}</span> {c.text}
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
```

- [ ] **Step 6: `src/components/ActionCards.tsx` 작성**

```typescript
import type { ActionItem } from '@/lib/types';

export default function ActionCards({ items }: { items: ActionItem[] }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">액션 아이템</h3>
      <div className="grid gap-3">
        {items.map((item, i) => (
          <div key={i} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="font-medium text-sm mb-1">{item.title}</p>
            <p className="text-xs text-gray-400 mb-1">{item.rationale}</p>
            <span className="text-xs bg-indigo-900/50 text-indigo-300 px-2 py-0.5 rounded">
              {item.sourceFeedback}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 7: `src/components/AnalysisResult.tsx` 작성**

```typescript
import type { AnalysisResult } from '@/lib/types';
import FeedbackChart from './FeedbackChart';
import ActionCards from './ActionCards';

export default function AnalysisResultView({ result }: { result: AnalysisResult }) {
  return (
    <div className="space-y-8">
      {/* 영상 정보 */}
      <div className="flex gap-4">
        <img src={result.thumbnailUrl} alt={result.videoTitle} className="w-40 rounded-lg" />
        <div>
          <h2 className="font-semibold text-lg">{result.videoTitle}</h2>
          <p className="text-sm text-gray-400 mt-1">
            {result.channelName === 'shookaworld' ? '슈카월드' : '머니코믹스'} ·{' '}
            {new Date(result.publishedAt).toLocaleDateString('ko-KR')}
          </p>
          <p className="text-sm text-gray-400">댓글 {result.commentCount}개 분석</p>
          <p className="text-xs text-gray-600 mt-1">
            분석 시각: {new Date(result.analyzedAt).toLocaleString('ko-KR')}
          </p>
        </div>
      </div>

      <FeedbackChart data={result.feedbackDistribution} />
      <ActionCards items={result.actionItems} />
    </div>
  );
}
```

- [ ] **Step 8: `src/components/CaseCards.tsx` 작성**

```typescript
'use client';
import { useEffect, useState } from 'react';
import type { CaseMeta, AnalysisResult } from '@/lib/types';

type Props = { onSelect: (result: AnalysisResult) => void };

export default function CaseCards({ onSelect }: Props) {
  const [cases, setCases] = useState<CaseMeta[]>([]);

  useEffect(() => {
    fetch('/api/cases').then((r) => r.json()).then(setCases).catch(() => null);
  }, []);

  async function handleClick(videoId: string) {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoUrl: `https://www.youtube.com/watch?v=${videoId}` }),
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';
      for (const chunk of lines) {
        const dataLine = chunk.replace(/^data: /, '');
        if (!dataLine) continue;
        try {
          const event = JSON.parse(dataLine);
          if (event.stage === 'done') onSelect(event.result);
        } catch { /* ignore */ }
      }
    }
  }

  if (!cases.length) return null;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">이미 분석된 영상</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cases.map((c) => (
          <button
            key={c.videoId}
            onClick={() => handleClick(c.videoId)}
            className="bg-gray-800 rounded-lg overflow-hidden text-left hover:bg-gray-700 transition-colors"
          >
            <img src={c.thumbnailUrl} alt={c.videoTitle} className="w-full aspect-video object-cover" />
            <div className="p-3">
              <p className="text-xs text-indigo-400 mb-1">
                {c.channelName === 'shookaworld' ? '슈카월드' : '머니코믹스'}
              </p>
              <p className="text-sm font-medium line-clamp-2">{c.videoTitle}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 9: `src/components/Footer.tsx` 작성**

```typescript
export default function Footer() {
  return (
    <footer className="border-t border-gray-800 py-8 text-center text-sm text-gray-500">
      <p>이 결과물은 슈카친구들 PD 공고 지원자가 직접 만든 도구입니다.</p>
      <div className="mt-2 flex justify-center gap-4">
        <a href="#" className="hover:text-gray-300 transition-colors">자기소개서</a>
        <a href="#" className="hover:text-gray-300 transition-colors">이력서</a>
      </div>
    </footer>
  );
}
```

- [ ] **Step 10: `src/components/Landing.tsx` 작성**

```typescript
import UsageBadge from './UsageBadge';
import VideoInput from './VideoInput';
import type { PipelineEvent, AnalysisResult } from '@/lib/types';

type Props = {
  onEvents: (events: PipelineEvent[]) => void;
  onResult: (result: AnalysisResult) => void;
};

export default function Landing({ onEvents, onResult }: Props) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">슈카 댓글 분석기</h1>
        <p className="text-gray-400 text-sm">슈카친구들 PD 공고 지원자가 만든 분석 도구</p>
      </div>
      <UsageBadge />
      <VideoInput onEvents={onEvents} onResult={onResult} />
    </div>
  );
}
```

- [ ] **Step 11: `src/app/page.tsx` 작성**

```typescript
'use client';
import { useRef, useState } from 'react';
import Landing from '@/components/Landing';
import ProgressStream from '@/components/ProgressStream';
import AnalysisResultView from '@/components/AnalysisResult';
import CaseCards from '@/components/CaseCards';
import Footer from '@/components/Footer';
import type { PipelineEvent, AnalysisResult } from '@/lib/types';

export default function Page() {
  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  function handleResult(r: AnalysisResult) {
    setResult(r);
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-16">
      <Landing onEvents={setEvents} onResult={handleResult} />

      {events.length > 0 && (
        <div ref={resultRef} className="space-y-8">
          <ProgressStream events={events} />
          {result && <AnalysisResultView result={result} />}
        </div>
      )}

      <CaseCards onSelect={handleResult} />
      <Footer />
    </div>
  );
}
```

- [ ] **Step 12: 브라우저 동작 확인**

```bash
npm run dev
```

- `http://localhost:3000` 접속
- 사례 카드 4개 표시 확인
- 카드 클릭 → 즉시 결과 표시 (캐시)
- URL 입력 → SSE 진행 메시지 → 결과 표시
- 다른 채널 URL 입력 → 오류 메시지 표시
- 모바일 시뮬레이터에서 레이아웃 확인

- [ ] **Step 13: 커밋**

```bash
git add src/app/ src/components/
git commit -m "feat: add frontend components (A/B/C/D areas)"
```

---

## Task 9: Docker 컨테이너화

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`
- Create: `Caddyfile`

- [ ] **Step 1: `Dockerfile` 작성**

```dockerfile
# 의존성 설치
FROM node:20-alpine AS deps
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm ci

# 빌드
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 실행
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system nodejs && adduser --system --ingroup nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# better-sqlite3 native 모듈 복사
COPY --from=builder /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

- [ ] **Step 2: `next.config.mjs` 수정 (standalone 출력 활성화)**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
};

export default nextConfig;
```

- [ ] **Step 3: `Caddyfile` 작성**

```
{
    # 도메인 없으면 HTTP only
}

:80 {
    reverse_proxy app:3000 {
        flush_interval -1
    }
}
```

- [ ] **Step 4: `docker-compose.yml` 작성**

```yaml
services:
  app:
    build: .
    restart: unless-stopped
    env_file: .env
    volumes:
      - app-data:/data
    networks:
      - internal

  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy-data:/data
      - caddy-config:/config
    depends_on:
      - app
    networks:
      - internal

volumes:
  app-data:
  caddy-data:
  caddy-config:

networks:
  internal:
```

- [ ] **Step 5: 로컬 Docker 빌드 테스트**

`.env` 파일 생성 (`.env.local` 내용을 `.env`로 복사, gitignore 확인):

```bash
docker compose up --build
```

Expected: `http://localhost` 접속 시 앱 작동.

- [ ] **Step 6: SQLite 영속성 확인**

```bash
docker compose down && docker compose up -d
# 앱 접속 후 usage 카운터가 리셋되지 않았는지 확인
curl http://localhost/api/usage
```

- [ ] **Step 7: 커밋**

```bash
git add Dockerfile docker-compose.yml Caddyfile next.config.mjs
git commit -m "feat: add Docker multi-stage build and Caddy reverse proxy"
```

---

## Task 10: EC2 배포

**Notes:** 이 태스크는 AWS 콘솔과 SSH를 통한 수동 작업 포함.

- [ ] **Step 1: EC2 인스턴스 시작**

- AWS 콘솔 → EC2 → 인스턴스 시작
- AMI: Ubuntu 24.04 LTS (또는 Amazon Linux 2023)
- 인스턴스 유형: t3.micro (x86) 또는 t4g.small (ARM)
  - t4g 선택 시: `docker buildx build --platform linux/arm64 -t shooka .` 로 빌드
- 보안 그룹: 22 (SSH), 80 (HTTP), 443 (HTTPS) 인바운드 허용
- 키 페어 생성 및 저장

- [ ] **Step 2: 탄력적 IP 할당**

- EC2 → 탄력적 IP → 주소 할당 → 인스턴스 연결

- [ ] **Step 3: 서버 초기 설정**

```bash
ssh -i <key.pem> ubuntu@<탄력적IP>

# Docker 설치 (Ubuntu)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu
newgrp docker

# 레포 클론
git clone https://github.com/<user>/shooka-prototype.git
cd shooka-prototype

# .env 작성 (운영 시크릿)
cp .env.example .env
nano .env   # 실제 키 입력
```

- [ ] **Step 4: 배포 실행**

```bash
docker compose up -d --build
```

- [ ] **Step 5: 검증**

```bash
# 로컬에서:
curl http://<탄력적IP>/api/cases | python3 -m json.tool
# 브라우저에서 http://<탄력적IP> 접속
```

---

## MVP 검증 체크리스트

모든 태스크 완료 후:

- [ ] 채용 담당자가 30초 안에 핵심을 이해하는가? (랜딩 + 사례 카드)
- [ ] 사례 카드 클릭 시 즉시 결과 표시되는가?
- [ ] 영상 URL 입력 시 분석이 30초 내 완료되는가?
- [ ] 액션 아이템이 구체적인가? (즉시 활용 가능한 수준)
- [ ] 호출 카운터 정상 작동, 24시간 후 리셋되는가?
- [ ] 다른 채널 영상 입력 시 안내 메시지 표시되는가?
- [ ] 모바일에서 레이아웃이 깨지지 않는가?
- [ ] Docker 재시작 후 SQLite 데이터 유지되는가?
