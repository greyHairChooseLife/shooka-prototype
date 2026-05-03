'use client';
import { useEffect, useState, useCallback } from 'react';

type PromptName =
    | 'generate-actions-shookaworld'
    | 'generate-actions-moneycomics';

type PromptEntry = {
    name: PromptName;
    content: string;
    customized: boolean;
};

const LABELS: Record<PromptName, string> = {
    'generate-actions-shookaworld': '슈카월드',
    'generate-actions-moneycomics': '머니코믹스',
};

export default function PromptsPage() {
    const [prompts, setPrompts] = useState<PromptEntry[]>([]);
    const [selected, setSelected] = useState<PromptName>(
        'generate-actions-shookaworld',
    );
    const [draft, setDraft] = useState('');
    const [dirty, setDirty] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch('/api/prompts')
            .then((r) => r.json())
            .then((data: PromptEntry[]) => {
                setPrompts(data);
                const first = data.find((p) => p.name === selected);
                if (first) setDraft(first.content);
            });
    }, []);

    useEffect(() => {
        const current = prompts.find((p) => p.name === selected);
        if (current) {
            setDraft(current.content);
            setDirty(false);
        }
    }, [selected, prompts]);

    useEffect(() => {
        if (!dirty) return;
        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [dirty]);

    const handleTabChange = useCallback(
        (name: PromptName) => {
            if (
                dirty &&
                !confirm('저장하지 않은 변경사항이 있습니다. 이동하시겠습니까?')
            )
                return;
            setSelected(name);
        },
        [dirty],
    );

    const handleSave = useCallback(async () => {
        setSaving(true);
        await fetch(`/api/prompts/${selected}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: draft }),
        });
        setPrompts((prev) =>
            prev.map((p) =>
                p.name === selected
                    ? { ...p, content: draft, customized: true }
                    : p,
            ),
        );
        setDirty(false);
        setSaving(false);
    }, [selected, draft]);

    const handleReset = useCallback(async () => {
        if (!confirm('기본값으로 되돌리시겠습니까?')) return;
        await fetch(`/api/prompts/${selected}`, { method: 'DELETE' });
        const res = await fetch('/api/prompts');
        const data: PromptEntry[] = await res.json();
        setPrompts(data);
        const updated = data.find((p) => p.name === selected);
        if (updated) {
            setDraft(updated.content);
            setDirty(false);
        }
    }, [selected]);

    const current = prompts.find((p) => p.name === selected);

    return (
        <div className="mx-auto max-w-4xl px-4 py-12">
            <h1 className="mb-2 text-2xl font-bold">프롬프트 관리</h1>
            <p className="mb-8 text-sm text-gray-500">
                채널별 액션 아이템 생성 프롬프트를 편집합니다.
                <code className="ml-1 rounded bg-gray-100 px-1 dark:bg-gray-800">{'{{videoTitle}}'}</code>,{' '}
                <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">{'{{videoSummary}}'}</code>,{' '}
                <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">{'{{categoryDistribution}}'}</code>는
                분석 시 자동으로 채워집니다.
            </p>

            <div className="mb-6 flex gap-2 border-b border-gray-200 dark:border-gray-700">
                {prompts.map((p) => (
                    <button
                        key={p.name}
                        onClick={() => handleTabChange(p.name)}
                        className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                            selected === p.name
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        {LABELS[p.name]}
                        {p.customized && (
                            <span className="ml-1.5 text-xs text-orange-500">
                                수정됨
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <textarea
                value={draft}
                onChange={(e) => {
                    setDraft(e.target.value);
                    setDirty(true);
                }}
                className="h-[32rem] w-full resize-y rounded-lg border border-gray-300 bg-white p-4 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900"
                spellCheck={false}
            />

            <div className="mt-4 flex gap-3">
                <button
                    onClick={handleSave}
                    disabled={!dirty || saving}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
                >
                    {saving ? '저장 중...' : '저장'}
                </button>
                {current?.customized && (
                    <button
                        onClick={handleReset}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
                    >
                        기본값으로 리셋
                    </button>
                )}
            </div>
        </div>
    );
}
