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
        <div className="rounded-lg px-4 py-2 text-sm text-yellow-400">
            <p>
                이 도구는 24시간 마다 <strong>{usage.limit}회</strong> 분석
                가능합니다. (매일 자정 리셋)
            </p>
            <p>
                현재 <strong>{remaining}회</strong> 남음.
            </p>
        </div>
    );
}
