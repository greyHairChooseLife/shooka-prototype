export default function Footer() {
    return (
        <footer className="border-t border-gray-800 py-8 text-center text-sm text-gray-500">
            <p>이 결과물은 슈카친구들 PD 공고 지원자가 직접 만든 도구입니다.</p>
            <div className="mt-2 flex justify-center gap-4">
                <a href="#" className="transition-colors hover:text-gray-300">
                    자기소개서
                </a>
                <a href="#" className="transition-colors hover:text-gray-300">
                    이력서
                </a>
            </div>
        </footer>
    );
}
