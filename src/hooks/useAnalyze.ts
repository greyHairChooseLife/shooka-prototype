'use client';
import { useState } from 'react';
import type { PipelineEvent, AnalysisResult } from '@/lib/types';

export function useAnalyze(
    onEvents: (events: PipelineEvent[]) => void,
    onResult: (result: AnalysisResult) => void,
) {
    const [loading, setLoading] = useState(false);

    async function analyze(videoUrl: string) {
        if (loading) return;
        setLoading(true);
        onEvents([]);

        const res = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoUrl }),
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

    return { analyze, loading };
}
