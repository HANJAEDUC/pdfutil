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
  IoMailOutline,
  IoCheckmarkOutline,
  IoShieldCheckmarkOutline,
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
  const [copied, setCopied] = useState(false);

  // Dynamic automatic slideshow timer (rotates every 3.5s)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const copyEmail = () => {
    navigator.clipboard.writeText('hanjaeduc@gmail.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

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

        <div className={styles.heroText}>
          <span className={styles.heroBadge}>{t.home.heroBadge}</span>
          <p className={styles.heroSubtitle}>{t.home.heroSubtitle}</p>

          <div className={styles.privacyTag}>
            <IoShieldCheckmarkOutline size={18} />
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

      {/* User Feedback & Suggestions Section */}
      <section className={styles.feedbackBox}>
        <div className={styles.feedbackIcon}>💌</div>
        <h3 className={styles.feedbackTitle}>{t.home.feedbackBox.title}</h3>
        <p className={styles.feedbackDesc}>{t.home.feedbackBox.desc}</p>

        <div className={styles.feedbackActions}>
          <a
            href="mailto:hanjaeduc@gmail.com?subject=PDF Util Feedback & Suggestions"
            className={styles.mailActionBtn}
          >
            <IoMailOutline size={20} />
            <span>{t.home.feedbackBox.emailBtn}</span>
          </a>

          <button onClick={copyEmail} className={styles.copyEmailBtn}>
            {copied ? (
              <span className={styles.copiedText}>
                <IoCheckmarkOutline size={18} /> 복사되었습니다!
              </span>
            ) : (
              <span>{t.home.feedbackBox.copyEmailBtn}</span>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}
