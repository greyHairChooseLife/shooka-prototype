import type { ActionItem } from '@/lib/types';

export default function ActionCards({ items }: { items: ActionItem[] }) {
    return (
        <div>
            <h3 className="mb-4 text-lg font-semibold">액션 아이템</h3>
            <div className="grid gap-3">
                {items.map((item, i) => (
                    <div
                        key={i}
                        className="rounded-lg border border-gray-700 bg-gray-800 p-4"
                    >
                        <p className="mb-1 text-sm font-medium">{item.title}</p>
                        <p className="mb-1 text-xs text-gray-400">
                            {item.rationale}
                        </p>
                        <span className="rounded bg-indigo-900/50 px-2 py-0.5 text-xs text-indigo-300">
                            {item.sourceFeedback}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
