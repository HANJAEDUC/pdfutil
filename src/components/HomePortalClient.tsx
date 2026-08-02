"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './HomePortalClient.module.css';
import { useLanguage } from '@/lib/LanguageContext';
import {
  IoImagesOutline,
  IoLayersOutline,
  IoCutOutline,
  IoLockClosedOutline,
  IoShieldCheckmarkOutline,
  IoCheckmarkCircleOutline,
  IoFlashOutline,
  IoDocumentTextOutline,
  IoGitBranchOutline,
  IoTrashOutline,
  IoRefreshOutline,
  IoArchiveOutline,
  IoWaterOutline,
  IoTextOutline,
  IoScanOutline,
} from 'react-icons/io5';

const slides = [
  { id: 0, title: 'PDF ➡️ JPG', imgSrc: '/hero-converter.png', link: '/pdf-to-jpg' },
  { id: 1, title: 'PDF + PDF', imgSrc: '/hero-merge.png', link: '/pdf-merge' },
  { id: 2, title: 'PDF-PDF', imgSrc: '/hero-extract.png', link: '/pdf-extract' },
  { id: 3, title: 'PDF 🔑 PDF', imgSrc: '/hero-passwd.png', link: '/pdf-passwd' },
];

export default function HomePortalClient() {
  const { t } = useLanguage();
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={styles.container}>
      {/* 1. Dynamic Hero Carousel & Stack Section */}
      <section className={styles.heroSection}>
        <div
          className={styles.carouselContainer}
          onClick={() => router.push(slides[currentSlide].link)}
          title={`${slides[currentSlide].title} 바로가기`}
        >
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={styles.slideItem}
              style={{
                opacity: currentSlide === index ? 1 : 0,
                pointerEvents: currentSlide === index ? 'auto' : 'none',
                transform: currentSlide === index ? 'scale(1)' : 'scale(0.96)',
              }}
            >
              <Image
                src={slide.imgSrc}
                alt={slide.title}
                width={440}
                height={440}
                priority={index === 0}
                className={styles.slideImage}
              />
            </div>
          ))}

          <div className={styles.slideOverlay}>
            <span className={styles.slideTag}>{slides[currentSlide].title}</span>
            <div className={styles.dotsContainer}>
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentSlide(index);
                  }}
                  className={`${styles.dot} ${currentSlide === index ? styles.activeDot : ''}`}
                  aria-label={`Slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className={styles.heroText}>
          <div className={styles.pointCardBlue}>
            <IoCheckmarkCircleOutline size={18} color="#8ab4f8" />
            <span>{t.home.heroBadge}</span>
          </div>

          <div className={styles.pointCardGray}>
            <IoFlashOutline size={18} color="#e3e3e3" />
            <span>{t.home.heroSubtitle}</span>
          </div>

          <div className={styles.privacyTag}>
            <IoShieldCheckmarkOutline size={18} color="#36b27e" />
            <span>{t.privacy.banner}</span>
          </div>
        </div>
      </section>

      {/* 2. Sleek 12-Unit Tools Cards Grid */}
      <section className={styles.toolsSection}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: PDF ➡️ JPG */}
          <Link href="/pdf-to-jpg" className={styles.toolCard}>
            <div>
              <div className={styles.cardIcon}>
                <IoImagesOutline />
              </div>
              <h3 className={styles.cardTitle}>{t.home.tools.pdf2jpg.title}</h3>
              <p className={styles.cardDesc}>{t.home.tools.pdf2jpg.desc}</p>
            </div>
            <div className={styles.cardBtn}>
              <span>{t.home.tools.pdf2jpg.btn}</span>
            </div>
          </Link>

          {/* Card 2: PDF ➡️ Word */}
          <Link href="/pdf-to-word" className={styles.toolCard}>
            <div>
              <div className={styles.cardIcon}>
                <IoDocumentTextOutline />
              </div>
              <h3 className={styles.cardTitle}>{(t.home.tools as any).pdf2word?.title || 'PDF ➡️ Word'}</h3>
              <p className={styles.cardDesc}>{(t.home.tools as any).pdf2word?.desc || 'PDF 문서 내 텍스트와 구조를 분석하여 편집 가능한 Microsoft Word(.docx) 문서로 변환합니다.'}</p>
            </div>
            <div className={styles.cardBtn}>
              <span>{(t.home.tools as any).pdf2word?.btn || 'Word 변환하러 가기 ➔'}</span>
            </div>
          </Link>

          {/* Card 3: PDF + PDF */}
          <Link href="/pdf-merge" className={styles.toolCard}>
            <div>
              <div className={styles.cardIcon}>
                <IoLayersOutline />
              </div>
              <h3 className={styles.cardTitle}>{t.home.tools.pdfmerge.title}</h3>
              <p className={styles.cardDesc}>{t.home.tools.pdfmerge.desc}</p>
            </div>
            <div className={styles.cardBtn}>
              <span>{t.home.tools.pdfmerge.btn}</span>
            </div>
          </Link>

          {/* Card 4: PDF-PDF */}
          <Link href="/pdf-extract" className={styles.toolCard}>
            <div>
              <div className={styles.cardIcon}>
                <IoCutOutline />
              </div>
              <h3 className={styles.cardTitle}>{t.home.tools.pdfextract.title}</h3>
              <p className={styles.cardDesc}>{t.home.tools.pdfextract.desc}</p>
            </div>
            <div className={styles.cardBtn}>
              <span>{t.home.tools.pdfextract.btn}</span>
            </div>
          </Link>

          {/* Card 5: PDF 🔑 PDF */}
          <Link href="/pdf-passwd" className={styles.toolCard}>
            <div>
              <div className={styles.cardIcon}>
                <IoLockClosedOutline />
              </div>
              <h3 className={styles.cardTitle}>{t.home.tools.pdfpasswd.title}</h3>
              <p className={styles.cardDesc}>{t.home.tools.pdfpasswd.desc}</p>
            </div>
            <div className={styles.cardBtn}>
              <span>{t.home.tools.pdfpasswd.btn}</span>
            </div>
          </Link>

          {/* Card 6: pdfxxx */}
          <Link href="/pdfxxx" className={styles.toolCard}>
            <div>
              <div className={styles.cardIcon}>
                <IoGitBranchOutline />
              </div>
              <h3 className={styles.cardTitle}>pdfxxx</h3>
              <p className={styles.cardDesc}>{(t.home.tools as any).pdfxxx?.desc || 'PDF 문서를 원하는 범위나 페이지 단위로 자유롭게 분할합니다.'}</p>
            </div>
            <div className={styles.cardBtn}>
              <span>{(t.home.tools as any).pdfxxx?.btn || '페이지 분할하러 가기 ➔'}</span>
            </div>
          </Link>

          {/* Card 7: pdfxxxx */}
          <Link href="/pdfxxxx" className={styles.toolCard}>
            <div>
              <div className={styles.cardIcon}>
                <IoTrashOutline />
              </div>
              <h3 className={styles.cardTitle}>pdfxxxx</h3>
              <p className={styles.cardDesc}>{(t.home.tools as any).pdfxxxx?.desc || 'PDF 문서에서 불필요한 페이지나 구성을 선택하여 삭제합니다.'}</p>
            </div>
            <div className={styles.cardBtn}>
              <span>{(t.home.tools as any).pdfxxxx?.btn || '페이지 삭제하러 가기 ➔'}</span>
            </div>
          </Link>

          {/* Card 8: pdfxxxxx */}
          <Link href="/pdfxxxxx" className={styles.toolCard}>
            <div>
              <div className={styles.cardIcon}>
                <IoRefreshOutline />
              </div>
              <h3 className={styles.cardTitle}>pdfxxxxx</h3>
              <p className={styles.cardDesc}>{(t.home.tools as any).pdfxxxxx?.desc || 'PDF 각 페이지의 방향을 90도/180도 회전시켜 재정렬합니다.'}</p>
            </div>
            <div className={styles.cardBtn}>
              <span>{(t.home.tools as any).pdfxxxxx?.btn || '페이지 회전하러 가기 ➔'}</span>
            </div>
          </Link>

          {/* Card 9: pdfxxxxxx */}
          <Link href="/pdfxxxxxx" className={styles.toolCard}>
            <div>
              <div className={styles.cardIcon}>
                <IoArchiveOutline />
              </div>
              <h3 className={styles.cardTitle}>pdfxxxxxx</h3>
              <p className={styles.cardDesc}>{(t.home.tools as any).pdfxxxxxx?.desc || '고화질 PDF 파일 용량을 이메일 전송용으로 경량화 압축합니다.'}</p>
            </div>
            <div className={styles.cardBtn}>
              <span>{(t.home.tools as any).pdfxxxxxx?.btn || '용량 압축하러 가기 ➔'}</span>
            </div>
          </Link>

          {/* Card 10: pdfxxxxxxx */}
          <Link href="/pdfxxxxxxx" className={styles.toolCard}>
            <div>
              <div className={styles.cardIcon}>
                <IoWaterOutline />
              </div>
              <h3 className={styles.cardTitle}>pdfxxxxxxx</h3>
              <p className={styles.cardDesc}>{(t.home.tools as any).pdfxxxxxxx?.desc || 'PDF 문서 배경에 워터마크 텍스트나 로고를 지정해 삽입합니다.'}</p>
            </div>
            <div className={styles.cardBtn}>
              <span>{(t.home.tools as any).pdfxxxxxxx?.btn || '워터마크 설정하러 가기 ➔'}</span>
            </div>
          </Link>

          {/* Card 11: pdfxxxxxxxx */}
          <Link href="/pdfxxxxxxxx" className={styles.toolCard}>
            <div>
              <div className={styles.cardIcon}>
                <IoTextOutline />
              </div>
              <h3 className={styles.cardTitle}>pdfxxxxxxxx</h3>
              <p className={styles.cardDesc}>{(t.home.tools as any).pdfxxxxxxxx?.desc || 'PDF 파일 내부의 텍스트와 본문 문장만을 빠르게 추출합니다.'}</p>
            </div>
            <div className={styles.cardBtn}>
              <span>{(t.home.tools as any).pdfxxxxxxxx?.btn || '텍스트 추출하러 가기 ➔'}</span>
            </div>
          </Link>

          {/* Card 12: pdfxxxxxxxxx */}
          <Link href="/pdfxxxxxxxxx" className={styles.toolCard}>
            <div>
              <div className={styles.cardIcon}>
                <IoScanOutline />
              </div>
              <h3 className={styles.cardTitle}>pdfxxxxxxxxx</h3>
              <p className={styles.cardDesc}>{(t.home.tools as any).pdfxxxxxxxxx?.desc || '스캔된 이미지형 PDF에서 문자를 정밀하게 OCR 글자 인식합니다.'}</p>
            </div>
            <div className={styles.cardBtn}>
              <span>{(t.home.tools as any).pdfxxxxxxxxx?.btn || 'OCR 인식하러 가기 ➔'}</span>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
