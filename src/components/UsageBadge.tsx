'use client';
import { useEffect, useState } from 'react';
import type { UsageStatus } from '@/lib/types';

export default function UsageBadge() {
    const [usage, setUsage] = useState<UsageStatus | null>(null);

    useEffect(() => {
        const fetchUsage = () =>
            fetch('/api/usage')
                .then((r) => r.json())
                .then(setUsage)
                .catch(() => null);

        fetchUsage();
        const id = setInterval(fetchUsage, 10_000);
        return () => clearInterval(id);
    }, []);

    if (!usage) return null;

    const remaining = usage.limit - usage.count;
    return (
        <div className="rounded-lg border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-center text-sm text-yellow-400">
            이 도구는 24시간 동안 <strong>{usage.limit}회</strong> 분석
            가능합니다. 현재 <strong>{usage.count}회</strong> 사용 중 (
            {remaining}회 남음). 슈카친구들의 누구든 자유롭게 시도해보세요.
        </div>
    );
}
