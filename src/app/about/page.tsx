import Link from 'next/link';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-100">{title}</h2>
            {children}
        </section>
    );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
    return (
        <div className="flex gap-4">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-900/60 text-xs font-bold text-indigo-300">
                {n}
            </div>
            <div className="space-y-1">
                <p className="text-sm font-medium text-gray-200">{title}</p>
                <p className="text-sm leading-relaxed text-gray-400">{children}</p>
            </div>
        </div>
    );
}

function Tag({ children }: { children: React.ReactNode }) {
    return (
        <span className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-300">{children}</span>
    );
}

export default function AboutPage() {
    return (
        <div className="mx-auto max-w-2xl space-y-12 px-4 py-12">
            {/* 헤더 */}
            <div className="space-y-3">
                <h1 className="text-3xl font-bold">슈카 댓글 분석기</h1>
                <p className="text-base leading-relaxed text-gray-400">
                    슈카월드·머니코믹스 영상의 YouTube 댓글을 자동으로 수집·분류·분석해
                    다음 콘텐츠 기획에 활용할 수 있는 액션 아이템을 도출하는 도구입니다.
                </p>
                <p className="text-sm text-gray-600">
                    슈카친구들 PD 공고 지원자가 직접 설계하고 구현했습니다.
                </p>
            </div>

            {/* 왜 만들었나 */}
            <Section title="왜 만들었나">
                <p className="text-sm leading-relaxed text-gray-400">
                    콘텐츠 제작자에게 댓글은 시청자 반응을 가장 직접적으로 확인할 수 있는 채널이지만,
                    수백 개의 댓글을 직접 읽고 패턴을 파악하는 일은 시간이 많이 걸립니다.
                    이 도구는 그 과정을 자동화해, 어떤 주제가 시청자에게 잘 닿았는지·
                    어떤 오류가 지적됐는지·다음에 무엇을 다뤄야 하는지를 빠르게 파악할 수 있도록 합니다.
                </p>
            </Section>

            {/* 분석 파이프라인 */}
            <Section title="분석 파이프라인">
                <p className="mb-6 text-sm text-gray-500">
                    YouTube URL 하나를 입력하면 아래 6단계가 순서대로 실행됩니다.
                    각 단계는 실시간 스트리밍(SSE)으로 진행 상황이 화면에 표시됩니다.
                </p>
                <div className="space-y-5">
                    <Step n={1} title="댓글 수집">
                        YouTube Data API v3로 최대 400개 댓글을 가져옵니다.
                        좋아요 수 기준 상위 50개를 우선 확보하고, 나머지는 무작위 샘플링합니다.
                        영상 자막(transcript)도 함께 수집합니다.
                    </Step>
                    <Step n={2} title="댓글 정제">
                        5자 미만 단문, 이모지만으로 구성된 댓글 등 노이즈를 제거합니다.
                        YouTube API가 반환하는 HTML 엔티티(&#39;, &lt;br&gt; 등)도 이 단계에서 디코딩합니다.
                    </Step>
                    <Step n={3} title="영상 요약">
                        자막이 있으면 자막 기반으로, 없으면 영상 설명으로 LLM이 영상 내용을 요약합니다.
                        이 요약은 이후 댓글 분류의 맥락 정보로 사용됩니다.
                    </Step>
                    <Step n={4} title="댓글 분류">
                        LLM이 정제된 댓글 각각을 4개 카테고리 중 하나로 분류합니다.
                        분류 결과는 숫자 인덱스로 응답받아 임의 레이블 생성을 방지합니다.
                    </Step>
                    <Step n={5} title="집계">
                        카테고리별로 좋아요 수 기반 가중 점수를 합산합니다.
                        단순 댓글 수가 아닌 가중 점수를 쓰는 이유는, 공감을 많이 받은 댓글이
                        실제 시청자 반응을 더 대표한다고 보기 때문입니다.
                    </Step>
                    <Step n={6} title="액션 아이템 생성">
                        전체 댓글 분포와 카테고리별 비중을 종합해 LLM이 최대 2개의 액션 아이템을 도출합니다.
                        신호가 강한 카테고리를 우선하며, 근거 댓글 인덱스를 함께 반환해 출처를 추적할 수 있습니다.
                    </Step>
                </div>
            </Section>

            {/* 댓글 분류 카테고리 */}
            <Section title="댓글 분류 카테고리">
                <p className="mb-4 text-sm text-gray-500">
                    모든 댓글은 아래 4개 카테고리 중 하나로 분류되거나, 단순 리액션·밈으로 판단되면 제외됩니다.
                </p>
                <div className="space-y-3">
                    {[
                        {
                            name: '주제 만족도',
                            desc: '영상의 주제나 내용에 대한 만족 또는 불만 반응. 시리즈 확장·전달 방식 조정의 근거가 됩니다.',
                        },
                        {
                            name: '전문성·정정',
                            desc: '전문 지식 보완 또는 사실 오류 지적. 콘텐츠 신뢰도 관리에 직접 연결됩니다.',
                        },
                        {
                            name: '콘텐츠 요청',
                            desc: '다음에 보고 싶은 주제나 기능의 직·간접 요청. 다음 영상 기획 소재로 활용됩니다.',
                        },
                        {
                            name: '시청자 공감',
                            desc: '자신의 상황을 대입하거나 감정을 토로하는 댓글. 썸네일·제목·스토리텔링 방향 설계에 활용됩니다.',
                        },
                    ].map((cat) => (
                        <div key={cat.name} className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-3">
                            <p className="mb-1 text-sm font-medium text-indigo-300">{cat.name}</p>
                            <p className="text-xs leading-relaxed text-gray-400">{cat.desc}</p>
                        </div>
                    ))}
                </div>
            </Section>

            {/* 기술 스택 */}
            <Section title="기술 스택">
                <div className="space-y-3 text-sm text-gray-400">
                    <div className="flex items-start gap-3">
                        <span className="w-24 shrink-0 text-xs text-gray-600">프레임워크</span>
                        <div className="flex flex-wrap gap-1.5">
                            <Tag>Next.js 15 (App Router)</Tag>
                            <Tag>TypeScript</Tag>
                            <Tag>Tailwind CSS</Tag>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="w-24 shrink-0 text-xs text-gray-600">데이터</span>
                        <div className="flex flex-wrap gap-1.5">
                            <Tag>YouTube Data API v3</Tag>
                            <Tag>youtube-transcript</Tag>
                            <Tag>SQLite (better-sqlite3)</Tag>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="w-24 shrink-0 text-xs text-gray-600">LLM</span>
                        <div className="flex flex-wrap gap-1.5">
                            <Tag>Claude (Anthropic)</Tag>
                            <Tag>GPT-4o (OpenAI)</Tag>
                            <Tag>Gemini (Google)</Tag>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="w-24 shrink-0 text-xs text-gray-600">스트리밍</span>
                        <div className="flex flex-wrap gap-1.5">
                            <Tag>Server-Sent Events (SSE)</Tag>
                            <Tag>ReadableStream</Tag>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="w-24 shrink-0 text-xs text-gray-600">시각화</span>
                        <div className="flex flex-wrap gap-1.5">
                            <Tag>Recharts</Tag>
                        </div>
                    </div>
                </div>
            </Section>

            {/* CTA */}
            <div className="border-t border-gray-800 pt-8">
                <Link
                    href="/"
                    className="inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-indigo-500"
                >
                    분석 시작하기
                </Link>
            </div>
        </div>
    );
}
