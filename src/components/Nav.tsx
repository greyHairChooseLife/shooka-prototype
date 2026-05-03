'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
    { href: '/about', label: '소개' },
    { href: '/', label: '분석' },
    { href: '/result', label: '결과 보기' },
    { href: '/prompts', label: '프롬프트' },
];

export default function Nav() {
    const pathname = usePathname();
    return (
        <nav className="border-b border-gray-800 px-4">
            <div className="mx-auto flex max-w-4xl gap-6">
                {LINKS.map(({ href, label }) => (
                    <Link
                        key={href}
                        href={href}
                        className={`py-3 text-sm transition-colors ${
                            pathname === href
                                ? 'border-b-2 border-gray-100 text-gray-100'
                                : 'text-gray-400 hover:text-gray-100'
                        }`}
                    >
                        {label}
                    </Link>
                ))}
            </div>
        </nav>
    );
}
