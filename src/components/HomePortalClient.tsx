"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './HomePortalClient.module.css';
import { useLanguage } from '@/lib/LanguageContext';
import UnlockKeyIcon from './UnlockKeyIcon';
import {
  IoImagesOutline,
  IoLayersOutline,
  IoCutOutline,
  IoLockClosedOutline,
  IoLockOpenOutline,
  IoLockOpen,
  IoKeyOutline,
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
  IoCreateOutline,
} from 'react-icons/io5';

const slides = [
  { id: 0, titleKey: 'pdf2jpg', fallbackTitle: 'PDF ➡️ JPG', imgSrc: '/hero-converter.png', link: '/pdf-to-jpg' },
  { id: 1, titleKey: 'pdf2word', fallbackTitle: 'PDF ➡️ Word', imgSrc: '/hero-word.png', link: '/pdf-to-word' },
  { id: 2, titleKey: 'pdfpng', fallbackTitle: 'PDF ➡️ PNG', imgSrc: '/hero-converter.png', link: '/pdf-to-png' },
  { id: 3, titleKey: 'pdfmerge', fallbackTitle: 'PDF + PDF', imgSrc: '/hero-merge.png', link: '/pdf-merge' },
  { id: 4, titleKey: 'pdfextract', fallbackTitle: 'PDF-PDF', imgSrc: '/hero-extract.png', link: '/pdf-extract' },
  { id: 5, titleKey: 'pdfpasswd', fallbackTitle: 'PDF 🔑 PDF', imgSrc: '/hero-passwd.png', link: '/pdf-passwd' },
  { id: 6, titleKey: 'pdflogo', fallbackTitle: 'PDF + LOGO', imgSrc: '/hero-logo.png', link: '/pdf-logo' },
  { id: 7, titleKey: 'pdfrotate', fallbackTitle: 'PDF 🔄 PDF', imgSrc: '/hero-rotate.png', link: '/pdf-rotate' },
  { id: 8, titleKey: 'pdfunlock', fallbackTitle: 'PDF 🔓 PDF', imgSrc: '/hero-unlock.png', link: '/pdf-unlock' },
  { id: 9, titleKey: 'pdfwatermark', fallbackTitle: 'PDF 💧 PDF', imgSrc: '/hero-watermark.png', link: '/pdf-watermark' },
  { id: 10, titleKey: 'hwp2pdf', fallbackTitle: 'HWP ➡️ PDF', imgSrc: '/hero-word.png', link: '/hwp-to-pdf' },
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

  const getSlideTitle = (slide: (typeof slides)[0]) => {
    return (t.home.tools as any)[slide.titleKey]?.title || slide.fallbackTitle;
  };

  return (
    <div className={styles.container}>
      {/* 1. Dynamic Hero Carousel & Stack Section */}
      <section className={styles.heroSection}>
        <div
          className={styles.carouselContainer}
          onClick={() => router.push(slides[currentSlide].link)}
          title={`${getSlideTitle(slides[currentSlide])} 바로가기`}
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
                alt={getSlideTitle(slide)}
                width={440}
                height={440}
                priority={index === 0}
                className={styles.slideImage}
              />
            </div>
          ))}

          <div className={styles.slideOverlay}>
            <span className={styles.slideTag}>{getSlideTitle(slides[currentSlide])}</span>
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

          {/* Card 6: PDF 🏷️ LOGO */}
          <Link href="/pdf-logo" className={styles.toolCard}>
            <div>
              <div className={styles.cardIcon}>
                <IoImagesOutline />
              </div>
              <h3 className={styles.cardTitle}>{(t.home.tools as any).pdflogo?.title || (t.home.tools as any).pdfxxx?.title || 'PDF 🏷️ 대표로고 삽입'}</h3>
              <p className={styles.cardDesc}>{(t.home.tools as any).pdflogo?.desc || (t.home.tools as any).pdfxxx?.desc || 'PDF 문서 원하는 위치에 대표로고 또는 PNG/JPG 그림을 자유롭게 배치하여 추가합니다.'}</p>
            </div>
            <div className={styles.cardBtn}>
              <span>{(t.home.tools as any).pdflogo?.btn || (t.home.tools as any).pdfxxx?.btn || '대표로고 삽입하러 가기 ➔'}</span>
            </div>
          </Link>

          {/* Card 7: PDF->PNG (/pdf-to-png) */}
          <Link href="/pdf-to-png" className={styles.toolCard}>
            <div>
              <div className={styles.cardIcon}>
                <IoImagesOutline />
              </div>
              <h3 className={styles.cardTitle}>{(t.home.tools as any).pdfpng?.title || (t.home.tools as any).pdfxxxx?.title || 'PDF ➡️ PNG'}</h3>
              <p className={styles.cardDesc}>{(t.home.tools as any).pdfpng?.desc || (t.home.tools as any).pdfxxxx?.desc || 'PDF 문서를 100% 무손실 고화질 PNG 이미지로 변환합니다. 개별 PNG 다운로드, ZIP 압축 및 세로 1장 통합 PNG를 지원합니다.'}</p>
            </div>
            <div className={styles.cardBtn}>
              <span>{(t.home.tools as any).pdfpng?.btn || (t.home.tools as any).pdfxxxx?.btn || 'PNG 변환하러 가기 ➔'}</span>
            </div>
          </Link>

          {/* Card 8: PDF 🔄 PDF (pdfrotate) */}
          <Link href="/pdf-rotate" className={styles.toolCard}>
            <div>
              <div className={styles.cardIcon}>
                <IoRefreshOutline />
              </div>
              <h3 className={styles.cardTitle}>{(t.home.tools as any).pdfxxxxx?.title || 'PDF 🔄 PDF'}</h3>
              <p className={styles.cardDesc}>{(t.home.tools as any).pdfxxxxx?.desc || 'PDF 각 페이지의 방향을 90도/180도 회전시켜 올바른 방향으로 바로잡고 새로 저장합니다.'}</p>
            </div>
            <div className={styles.cardBtn}>
              <span>{(t.home.tools as any).pdfxxxxx?.btn || 'PDF 회전하러 가기 ➔'}</span>
            </div>
          </Link>

          {/* Card 9: PDF 🔓 PDF (pdfunlock) */}
          <Link href="/pdf-unlock" className={styles.toolCard}>
            <div>
              <div className={styles.cardIcon}>
                <UnlockKeyIcon size={24} />
              </div>
              <h3 className={styles.cardTitle}>{(t.home.tools as any).pdfunlock?.title || 'PDF 🔓 PDF'}</h3>
              <p className={styles.cardDesc}>{(t.home.tools as any).pdfunlock?.desc || '알고 있는 PDF 암호를 입력하여 100% 브라우저 내부에서 안전하게 암호를 해제합니다.'}</p>
            </div>
            <div className={styles.cardBtn}>
              <span>{(t.home.tools as any).pdfunlock?.btn || 'PDF 암호 해제하러 가기 ➔'}</span>
            </div>
          </Link>

          {/* Card 10: PDF 💧 PDF (pdfwatermark) */}
          <Link href="/pdf-watermark" className={styles.toolCard}>
            <div>
              <div className={styles.cardIcon}>
                <IoWaterOutline />
              </div>
              <h3 className={styles.cardTitle}>{(t.home.tools as any).pdfxxxxxxx?.title || 'PDF 💧 PDF'}</h3>
              <p className={styles.cardDesc}>{(t.home.tools as any).pdfxxxxxxx?.desc || 'PDF 문서 배경 또는 위에 커스텀 텍스트 워터마크(문구, 크기, 투명도, 회전)를 자유롭게 삽입합니다.'}</p>
            </div>
            <div className={styles.cardBtn}>
              <span>{(t.home.tools as any).pdfxxxxxxx?.btn || 'PDF 워터마크 추가하러 가기 ➔'}</span>
            </div>
          </Link>

          {/* Card 11: PDF ✍️ 서명 추가 (pdfsign) */}
          <Link href="/pdf-sign" className={styles.toolCard}>
            <div>
              <div className={styles.cardIcon}>
                <IoCreateOutline />
              </div>
              <h3 className={styles.cardTitle}>{(t.home.tools as any).pdfsign?.title || (t.home.tools as any).pdfxxxxxxxx?.title || 'PDF ✍️ 서명 추가'}</h3>
              <p className={styles.cardDesc}>{(t.home.tools as any).pdfsign?.desc || (t.home.tools as any).pdfxxxxxxxx?.desc || '마우스나 터치로 직접 그리거나 텍스트를 입력하여 나만의 전자 서명을 만들고 PDF 문서에 삽입합니다.'}</p>
            </div>
            <div className={styles.cardBtn}>
              <span>{(t.home.tools as any).pdfsign?.btn || (t.home.tools as any).pdfxxxxxxxx?.btn || 'PDF 서명 추가하러 가기 ➔'}</span>
            </div>
          </Link>

          {/* Card 12: JPG/PNG ➡️ PDF (img2pdf / image-to-pdf) */}
          <Link href="/image-to-pdf" className={styles.toolCard}>
            <div>
              <div className={styles.cardIcon}>
                <IoImagesOutline />
              </div>
              <h3 className={styles.cardTitle}>{(t.home.tools as any).img2pdf?.title || (t.home.tools as any).pdfxxxxxxxxx?.title || 'JPG/PNG ➡️ PDF'}</h3>
              <p className={styles.cardDesc}>{(t.home.tools as any).img2pdf?.desc || (t.home.tools as any).pdfxxxxxxxxx?.desc || '여러 장의 이미지 파일(JPG, PNG, WebP)을 원하는 순서대로 통합 결합하여 1개의 PDF 문서로 변환합니다.'}</p>
            </div>
            <div className={styles.cardBtn}>
              <span>{(t.home.tools as any).img2pdf?.btn || (t.home.tools as any).pdfxxxxxxxxx?.btn || 'PDF 결합 변환하러 가기 ➔'}</span>
            </div>
          </Link>

          {/* Card 13: PDF 🔢 페이지 번호 (pdfpages / pdf-pages) */}
          <Link href="/pdf-pages" className={styles.toolCard}>
            <div>
              <div className={styles.cardIcon}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
                  <text
                    x="12"
                    y="15.5"
                    fontSize="9.5"
                    fontWeight="800"
                    fontFamily="sans-serif"
                    textAnchor="middle"
                    fill="currentColor"
                    stroke="none"
                    letterSpacing="-0.5"
                  >
                    123
                  </text>
                </svg>
              </div>
              <h3 className={styles.cardTitle}>{(t.home.tools as any).pdfpages?.title || 'PDF 🔢 페이지 번호'}</h3>
              <p className={styles.cardDesc}>{(t.home.tools as any).pdfpages?.desc || 'PDF 문서 각 페이지에 번호(예: 1 / 5, Page 1 of 5, - 1 -)를 원하는 위치와 디자인으로 자동 추가합니다.'}</p>
            </div>
            <div className={styles.cardBtn}>
              <span>{(t.home.tools as any).pdfpages?.btn || '페이지 번호 추가하러 가기 ➔'}</span>
            </div>
          </Link>

          {/* Card 14: HWP ➡️ PDF */}
          <Link href="/hwp-to-pdf" className={styles.toolCard}>
            <div>
              <div className={styles.cardIcon}>
                <IoDocumentTextOutline />
              </div>
              <h3 className={styles.cardTitle}>{(t.home.tools as any).hwp2pdf?.title || 'HWP ➡️ PDF'}</h3>
              <p className={styles.cardDesc}>{(t.home.tools as any).hwp2pdf?.desc || '한글(HWP, HWPX) 문서 내 텍스트, 표, 이미지를 100% 브라우저 내부에서 안전하고 정밀하게 PDF로 변환합니다.'}</p>
            </div>
            <div className={styles.cardBtn}>
              <span>{(t.home.tools as any).hwp2pdf?.btn || 'HWP 변환하러 가기 ➔'}</span>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
