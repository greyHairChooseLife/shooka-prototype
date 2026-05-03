import type { AnalysisResult } from '@/lib/types';
import FeedbackChart from './FeedbackChart';
import ActionCards from './ActionCards';

export default function AnalysisResultView({
    result,
}: {
    result: AnalysisResult;
}) {
    return (
        <div className="space-y-8">
            <div className="flex gap-4">
                <img
                    src={result.thumbnailUrl}
                    alt={result.videoTitle}
                    className="w-40 rounded-lg"
                />
                <div>
                    <h2 className="text-lg font-semibold">
                        {result.videoTitle}
                    </h2>
                    <p className="mt-1 text-sm text-gray-400">
                        {result.channelName === 'shookaworld'
                            ? '슈카월드'
                            : '머니코믹스'}{' '}
                        ·{' '}
                        {new Date(result.publishedAt).toLocaleDateString(
                            'ko-KR',
                        )}
                    </p>
                    <p className="text-sm text-gray-400">
                        댓글 {result.commentCount}개 분석
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                        분석 시각:{' '}
                        {new Date(result.analyzedAt).toLocaleString('ko-KR')}
                    </p>
                </div>
            </div>

            <FeedbackChart data={result.categoryDistribution} />
            <ActionCards items={result.actionItems} />
        </div>
    );
}
