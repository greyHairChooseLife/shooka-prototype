'use client';
import { useEffect, useState } from 'react';
import AnalysisResultView from '@/components/AnalysisResult';
import type { AnalysisResult } from '@/lib/types';

export default function ResultPage() {
    const [result, setResult] = useState<AnalysisResult | null>(null);

    useEffect(() => {
        try {
            const raw = localStorage.getItem('lastAnalysisResult');
            if (raw) setResult(JSON.parse(raw));
        } catch {}
    }, []);

    if (!result) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-24 text-center text-gray-500">
                <p>아직 분석 결과가 없습니다.</p>
                <a
                    href="/"
                    className="mt-4 inline-block text-sm text-blue-400 hover:underline"
                >
                    분석 페이지로 이동
                </a>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-12">
            <AnalysisResultView result={result} />
        </div>
    );
}
