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
} from 'react-icons/io5';

const slides = [
  {
    id: 0,
    title: 'PDF ➡️ JPG',
    imgSrc: '/hero-converter.png',
    link: '/pdf-to-jpg',
  },
  {
    id: 1,
    title: 'PDF + PDF',
    imgSrc: '/hero-merge.png',
    link: '/pdf-merge',
  },
  {
    id: 2,
    title: 'PDF-PDF',
    imgSrc: '/hero-extract.png',
    link: '/pdf-extract',
  },
  {
    id: 3,
    title: 'PDF 🔑 PDF',
    imgSrc: '/hero-passwd.png',
    link: '/pdf-passwd',
  },
];

export default function HomePortalClient() {
  const { t } = useLanguage();
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Dynamic automatic slideshow timer (rotates every 3.5s)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={styles.container}>
      {/* Dynamic Animated Hero Carousel Section */}
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

        {/* 3 Point Cards Aligned with Left Edge of Carousel Container */}
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

      {/* 4-Unit Tools Grid Section */}
      <section className={styles.toolsSection}>
        <div className={styles.toolsGrid}>
          {/* Tool 1: PDF ➡️ JPG */}
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

          {/* Tool 2: PDF ➡️ Word */}
          <Link href="/pdf-to-word" className={styles.toolCard}>
            <div>
              <div className={styles.cardIcon}>
                <IoDocumentTextOutline />
              </div>
              <h3 className={styles.cardTitle}>{(t.home.tools as any).pdf2word?.title || 'PDF ➡️ Word'}</h3>
              <p className={styles.cardDesc}>{(t.home.tools as any).pdf2word?.desc || 'PDF 문서를 편집 가능한 Word(.docx) 문서로 변환합니다.'}</p>
            </div>
            <div className={styles.cardBtn}>
              <span>{(t.home.tools as any).pdf2word?.btn || 'Word 변환하러 가기 ➔'}</span>
            </div>
          </Link>

          {/* Tool 2: PDF + PDF */}
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

          {/* Tool 3: PDF - PDF */}
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

          {/* Tool 4: PDF 🔑 PDF */}
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
        </div>
      </section>
    </div>
  );
}
