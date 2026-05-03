'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Landing from '@/components/Landing';
import ProgressStream from '@/components/ProgressStream';
import RecentVideos from '@/components/RecentVideos';
import Footer from '@/components/Footer';
import { useAnalyze } from '@/hooks/useAnalyze';
import type { PipelineEvent, AnalysisResult } from '@/lib/types';

export default function Page() {
    const [events, setEvents] = useState<PipelineEvent[]>([]);
    const router = useRouter();

    function handleResult(r: AnalysisResult) {
        try {
            localStorage.setItem('lastAnalysisResult', JSON.stringify(r));
        } catch {}
        router.push('/result');
    }

    const { analyze } = useAnalyze(setEvents, handleResult);

    // 다시 분석 요청이 있으면 force=true로 즉시 분석 시작
    useEffect(() => {
        try {
            const url = localStorage.getItem('reanalyzeUrl');
            if (url) {
                localStorage.removeItem('reanalyzeUrl');
                analyze(url, true);
            }
        } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="mx-auto max-w-3xl space-y-16 px-4 py-12">
            <Landing onEvents={setEvents} onResult={handleResult} />

            {events.length > 0 && (
                <div className="space-y-8">
                    <ProgressStream events={events} />
                </div>
            )}

            <RecentVideos onEvents={setEvents} onResult={handleResult} />
            <Footer />
        </div>
    );
}
