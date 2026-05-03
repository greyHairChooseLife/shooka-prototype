'use client';
import { useRouter } from 'next/navigation';
import type { AnalysisResult } from '@/lib/types';
import FeedbackChart from './FeedbackChart';
import ActionCards from './ActionCards';

export default function AnalysisResultView({ result }: { result: AnalysisResult }) {
    const router = useRouter();

    function handleReanalyze() {
        try {
            localStorage.setItem('reanalyzeUrl', result.videoUrl);
        } catch {}
        router.push('/');
    }

    return (
        <div className="space-y-8">
            <div className="flex gap-4">
                <img
                    src={result.thumbnailUrl}
                    alt={result.videoTitle}
                    className="w-40 rounded-lg"
                />
                <div className="flex-1">
                    <a
                        href={result.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-semibold hover:underline"
                    >
                        {result.videoTitle}(보러가기)
                    </a>
                    <p className="mt-1 text-sm text-gray-400">
                        {result.channelName === 'shookaworld' ? '슈카월드' : '머니코믹스'}
                        {' · '}
                        {new Date(result.publishedAt).toLocaleDateString('ko-KR')}
                    </p>
                    <p className="text-sm text-gray-400">댓글 {result.commentCount}개 분석</p>
                    <p className="mt-1 text-xs text-gray-600">
                        분석 시각: {new Date(result.analyzedAt).toLocaleString('ko-KR')}
                    </p>
                    <button
                        onClick={handleReanalyze}
                        className="mt-3 rounded border border-gray-600 px-3 py-1 text-xs text-gray-400 transition-colors hover:border-gray-400 hover:text-gray-200"
                    >
                        다시 분석
                    </button>
                </div>
            </div>

            {result.videoSummary && (
                <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                    <p className="mb-1 text-xs font-medium text-gray-400">영상 요약</p>
                    <p className="text-sm leading-relaxed text-gray-300">{result.videoSummary}</p>
                </div>
            )}

            <FeedbackChart data={result.categoryDistribution} />
            <ActionCards
                items={result.actionItems}
                categoryDistribution={result.categoryDistribution}
            />
        </div>
    );
}
