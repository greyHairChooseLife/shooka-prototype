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
            <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold">슈카 댓글 분석기</h1>
                <p className="text-sm text-gray-400">
                    슈카친구들 PD 공고 지원자가 만든 분석 도구
                </p>
            </div>
            <UsageBadge />
            <VideoInput onEvents={onEvents} onResult={onResult} />
        </div>
    );
}
