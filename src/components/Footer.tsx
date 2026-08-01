import React from 'react';
import { IoLockClosedOutline, IoFlashOutline, IoCheckmarkCircleOutline } from 'react-icons/io5';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--border-color)] bg-[var(--bg-card)]/50 backdrop-blur-sm text-[var(--text-muted)] text-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 pb-8 border-b border-[var(--border-color)]">
          <div className="flex gap-3 items-start">
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
              <IoLockClosedOutline className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-[var(--text-main)] mb-1">완벽한 정보 보호</h4>
              <p className="text-xs leading-relaxed">
                모든 PDF 변환 작업은 사용자의 웹 브라우저 메모리 내에서 직접 수행되며, 파일이 어떤 서버로도 전송되거나 저장되지 않습니다.
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 shrink-0">
              <IoFlashOutline className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-[var(--text-main)] mb-1">초고속 & 무제한 변환</h4>
              <p className="text-xs leading-relaxed">
                서버 대기 시간 없이 즉시 렌더링되며, 용량 제한이나 횟수 제한 없이 100% 무료로 고화질 JPG를 생성합니다.
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 shrink-0">
              <IoCheckmarkCircleOutline className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-[var(--text-main)] mb-1">다양한 옵션 지원</h4>
              <p className="text-xs leading-relaxed">
                페이지별 JPG 개별 저장, ZIP 압축 다운로드는 물론 여러 페이지를 1장의 세로 긴 이미지로 합치는 렌더링 옵션을 지원합니다.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-center sm:text-left">
          <div>
            <p className="font-semibold text-[var(--text-main)]">PDF2JPG.co.kr — 무료 온라인 PDF ➡️ JPG 이미지 변환기</p>
            <p className="mt-1">© {new Date().getFullYear()} pdf2jpg.co.kr. All rights reserved.</p>
          </div>
          <div className="flex items-center gap-4">
            <span>브라우저 전용 로컬 렌더링 웹 앱</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
