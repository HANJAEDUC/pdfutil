"use client";

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
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
            <div style={{ display: 'flex', alignItems: 'center', letterSpacing: '-0.5px' }}>
              <span style={{ color: '#4285F4' }}>P</span>
              <span style={{ color: '#EA4335' }}>D</span>
              <span style={{ color: '#FBBC04' }}>F</span>
            </div>
            <span style={{ color: '#e3e3e3', fontWeight: 600, marginLeft: '0px', letterSpacing: '-0.5px' }}>util</span>
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
            <a
              href="mailto:hanjaeduc@gmail.com?subject=Suggestions for Improvement"
              className={`${styles.iconLink} ${styles.desktopOnly}`}
              aria-label="Send Feedback"
              data-email="hanjaeduc@gmail.com"
              title={t.nav.feedback}
            >
              <IoMailOutline size={22} />
            </a>
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
