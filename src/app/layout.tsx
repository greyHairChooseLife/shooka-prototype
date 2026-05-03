import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: '슈카 댓글 분석기',
    description: '슈카월드·머니코믹스 YouTube 댓글 잠재 피드백 분석 도구',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ko">
            <body className="min-h-screen bg-gray-950 text-gray-100">
                {children}
            </body>
        </html>
    );
}
