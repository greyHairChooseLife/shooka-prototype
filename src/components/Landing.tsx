import UsageBadge from './UsageBadge';
import VideoInput from './VideoInput';
import type { PipelineEvent, AnalysisResult } from '@/lib/types';

type Props = {
    onEvents: (events: PipelineEvent[]) => void;
    onResult: (result: AnalysisResult) => void;
};

export default function Landing({ onEvents, onResult }: Props) {
    return (
        <div className="space-y-4">
            <UsageBadge />
            <VideoInput onEvents={onEvents} onResult={onResult} />
        </div>
    );
}
