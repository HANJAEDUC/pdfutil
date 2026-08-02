"use client";

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';
import { Language } from '@/lib/translations';
import styles from './Navbar.module.css';
import { IoChevronBack, IoChevronForward, IoMailOutline } from 'react-icons/io5';

export default function Navbar() {
  const pathname = usePathname();
  const { lang, setLang, t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 2);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <nav className={styles.navbar}>
      {canScrollLeft && (
        <button
          className={`${styles.navArrow} ${styles.leftArrow}`}
          onClick={() => scroll('left')}
          aria-label="Scroll left"
        >
          <IoChevronBack size={20} />
        </button>
      )}

      <div className={styles.scrollContainer} ref={scrollRef} onScroll={checkScroll}>
        <div className={styles.inner}>
          <Link href="/" className={styles.logo}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Image
                src="/logo.png"
                alt="mypdf logo"
                width={32}
                height={32}
                style={{ borderRadius: '8px', objectFit: 'contain' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', letterSpacing: '-0.5px' }}>
                <span style={{ color: '#4285F4', fontWeight: 700 }}>my</span>
                <span style={{ color: '#EA4335', fontWeight: 700 }}>pdf</span>
                <span style={{ color: '#FBBC04', fontSize: '13px', fontWeight: 600, marginLeft: '2px', opacity: 0.9 }}>.co.kr</span>
              </div>
            </div>
          </Link>

          <div className={styles.links}>
            <Link
              href="/pdf-to-jpg"
              className={`${styles.link} ${pathname === '/pdf-to-jpg' || pathname === '/' ? styles.activeLink : ''}`}
            >
              {t.nav.pdf2jpg}
            </Link>
            <Link
              href="/pdf-merge"
              className={`${styles.link} ${pathname === '/pdf-merge' ? styles.activeLink : ''}`}
            >
              {t.nav.pdfmerge}
            </Link>
            <Link
              href="/pdf-extract"
              className={`${styles.link} ${pathname === '/pdf-extract' ? styles.activeLink : ''}`}
            >
              {t.nav.pdfextract}
            </Link>
            <Link
              href="/pdf-passwd"
              className={`${styles.link} ${pathname === '/pdf-passwd' ? styles.activeLink : ''}`}
            >
              {t.nav.pdfpasswd}
            </Link>
            <div className={`${styles.feedbackWrapper} ${styles.desktopOnly}`}>
              <a
                href="mailto:hanjaeduc@gmail.com?subject=Suggestions for Improvement"
                className={styles.iconLink}
                aria-label="Send Feedback"
                title={`${t.nav.feedback} (hanjaeduc@gmail.com)`}
                data-email="hanjaeduc@gmail.com"
              >
                <IoMailOutline size={22} />
              </a>
              <div className={styles.feedbackTooltip}>
                ✉️ {t.nav.feedback} (hanjaeduc@gmail.com)
              </div>
            </div>
            <select
              className={styles.langSelect}
              value={lang}
              onChange={(e) => setLang(e.target.value as Language)}
              aria-label="Select Language"
            >
              <option value="ko">🇰🇷 한국어</option>
              <option value="en">🇺🇸 English</option>
              <option value="de">🇩🇪 Deutsch</option>
            </select>
          </div>
        </div>
      </div>

      {canScrollRight && (
        <button
          className={`${styles.navArrow} ${styles.rightArrow}`}
          onClick={() => scroll('right')}
          aria-label="Scroll right"
        >
          <IoChevronForward size={20} />
        </button>
      )}

      <button
        className={`${styles.iconLink} ${styles.mobileFixedMail}`}
        aria-label="Send Feedback"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          window.location.href = "mailto:hanjaeduc@gmail.com?subject=Suggestions for Improvement";
        }}
      >
        <IoMailOutline size={24} />
      </button>
    </nav>
  );
}
