'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
    { href: '/', label: '소개' },
    { href: '/analyze', label: '분석', highlight: true },
    { href: '/result', label: '결과 보기' },
    { href: '/prompts', label: '프롬프트' },
];

export default function Nav() {
    const pathname = usePathname();
    return (
        <nav className="border-b border-gray-800 px-4">
            <div className="mx-auto flex max-w-4xl gap-2">
                {LINKS.map(({ href, label, highlight }) => {
                    const isActive = pathname === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`relative py-3 px-3 text-sm transition-colors ${
                                isActive
                                    ? 'border-b-2 border-gray-100 text-gray-100'
                                    : highlight
                                      ? 'text-indigo-400 hover:text-indigo-300'
                                      : 'text-gray-400 hover:text-gray-100'
                            }`}
                        >
                            {highlight && !isActive && (
                                <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-indigo-400 align-middle" />
                            )}
                            {label}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
