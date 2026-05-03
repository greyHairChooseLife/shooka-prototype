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
        setTimeout(
            () => resultRef.current?.scrollIntoView({ behavior: 'smooth' }),
            100,
        );
    }

    return (
        <div className="mx-auto max-w-3xl space-y-16 px-4 py-12">
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
