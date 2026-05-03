# Changelog

## [1.1.0] - 2026-05-03

### 변경

- 댓글 분석 방법론 전면 개편: 기존 잠재피드백/표현방식 이중 분류 → 4개 카테고리 단일 분류
    - **Topic Value** — 주제·내용 만족도 반응
    - **Expertise & Correction** — 전문 지식 보완 및 사실 오류 지적
    - **Future Demand** — 다음 주제 직·간접 요청
    - **Viewer Identity** — 시청자 자기 대입·감정 표출
- 단순 리액션·감탄사 댓글은 분류 시 노이즈로 제외 (null 처리)
- 액션 아이템을 카테고리별 1~2개씩 도출하는 방식으로 변경
- 채널별 액션 프롬프트에 채널 정체성·기획 방향성 섹션 추가
- `feedbackDistribution` → `categoryDistribution`, `sourceFeedback` → `sourceCategory` 필드명 변경

### 제거

- 표현 방식 분류 단계 (classify-expression) 제거

---

## [1.0.0] - 2026-05-03

### 추가

- YouTube URL 입력 → 댓글 수집 → LLM 분석 → 액션 아이템 생성 파이프라인
- SSE(Server-Sent Events) 기반 실시간 진행 상황 스트리밍
- 잠재 피드백 분류 (콘텐츠 길이, 주제 깊이, 사실 정확성 등 8개 카테고리)
- 표현 방식 분류 (비판형, 직접요청형, 농담·밈형 등)
- 좋아요 가중 점수 기반 피드백 분포 집계
- 채널별(슈카월드·머니코믹스) 액션 아이템 생성
- SQLite 기반 분석 결과 캐시 및 일일 사용량 제한
- 사전 분석된 케이스 카드 (`/api/cases`)
- 다중 LLM 프로바이더 지원 (Claude / OpenAI / Gemini, `AI_PROVIDER` 환경변수로 전환)
- 채널별 액션 아이템 프롬프트를 마크다운 파일로 관리 (기본값: `src/prompts/defaults/`)
- `/prompts` 페이지 — 채널별 프롬프트 편집 및 DB 저장, 기본값 리셋
- 상단 탭 네비게이션 (분석 / 프롬프트)
