'use client';
import { useEffect, useState } from 'react';
import AnalysisResultView from '@/components/AnalysisResult';
import { useAnalyze } from '@/hooks/useAnalyze';
import type { CaseMeta, AnalysisResult, PipelineEvent } from '@/lib/types';

export default function ResultPage() {
    const [cases, setCases] = useState<CaseMeta[]>([]);
    const [events, setEvents] = useState<PipelineEvent[]>([]);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const { analyze, loading } = useAnalyze(setEvents, (r) => {
        setResult(r);
        setEvents([]);
    });

    useEffect(() => {
        fetch('/api/cases')
            .then((r) => r.json())
            .then(setCases)
            .catch(() => null);
    }, []);

    async function handleSelect(c: CaseMeta) {
        if (loading || selectedId === c.videoId) return;
        setSelectedId(c.videoId);
        setResult(null);
        await analyze(`https://www.youtube.com/watch?v=${c.videoId}`);
    }

    return (
        <div className="mx-auto flex max-w-6xl gap-0 px-4 py-8">
            {/* 사이드바 — 분석 목록 */}
            <aside className="w-72 shrink-0 border-r border-gray-800 pr-4">
                <h2 className="mb-4 text-sm font-semibold text-gray-400">분석된 영상</h2>
                {cases.length === 0 ? (
                    <p className="text-xs text-gray-600">아직 분석 결과가 없습니다.</p>
                ) : (
                    <ul className="space-y-1">
                        {cases.map((c) => (
                            <li key={c.videoId}>
                                <button
                                    onClick={() => handleSelect(c)}
                                    disabled={loading}
                                    className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors disabled:opacity-50 ${
                                        selectedId === c.videoId
                                            ? 'bg-gray-800 text-white'
                                            : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'
                                    }`}
                                >
                                    <p className="line-clamp-2 text-xs font-medium leading-snug">
                                        {c.videoTitle}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-600">
                                        {c.channelName === 'shookaworld' ? '슈카월드' : '머니코믹스'}
                                        {c.analyzedAt && (
                                            <> · {new Date(c.analyzedAt).toLocaleDateString('ko-KR')}</>
                                        )}
                                    </p>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </aside>

            {/* 메인 — 분석 결과 */}
            <main className="min-w-0 flex-1 pl-8">
                {loading && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                        불러오는 중...
                    </div>
                )}
                {!loading && result && <AnalysisResultView result={result} />}
                {!loading && !result && (
                    <p className="text-sm text-gray-600">
                        왼쪽 목록에서 영상을 선택하세요.
                    </p>
                )}
            </main>
        </div>
    );
}
