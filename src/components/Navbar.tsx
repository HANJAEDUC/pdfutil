"use client";

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';
import { Language } from '@/lib/translations';
import styles from './Navbar.module.css';
import {
  IoChevronBack,
  IoChevronForward,
  IoMailOutline,
  IoGridOutline,
  IoChevronDown,
  IoSearchOutline,
} from 'react-icons/io5';

interface ToolItem {
  key: string;
  name: string;
  href: string;
  categoryKey: 'catPrimary' | 'catOrganize' | 'catSecurity';
}

const PRIMARY_LINKS = [
  { href: '/pdf-to-jpg', label: 'pdf2jpg' },
  { href: '/pdf-merge', label: 'pdfmerge' },
  { href: '/pdf-extract', label: 'pdfextract' },
  { href: '/pdf-passwd', label: 'pdfpasswd' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { lang, setLang, t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const navContainerRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navContainerRef.current && !navContainerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const getToolDisplayName = (key: string, defaultName: string) => {
    return (t as any).toolNames?.[key] || defaultName;
  };

  const allToolsList: ToolItem[] = [
    // Column 1: Primary
    { key: 'pdf2jpg', name: getToolDisplayName('pdf2jpg', 'pdf2jpg'), href: '/pdf-to-jpg', categoryKey: 'catPrimary' },
    { key: 'pdf2word', name: getToolDisplayName('pdf2word', 'pdf2word'), href: '/pdf-to-word', categoryKey: 'catPrimary' },
    { key: 'pdfmerge', name: getToolDisplayName('pdfmerge', 'pdfmerge'), href: '/pdf-merge', categoryKey: 'catPrimary' },
    { key: 'pdfextract', name: getToolDisplayName('pdfextract', 'pdfextract'), href: '/pdf-extract', categoryKey: 'catPrimary' },
    { key: 'pdfpasswd', name: getToolDisplayName('pdfpasswd', 'pdfpasswd'), href: '/pdf-passwd', categoryKey: 'catPrimary' },

    // Column 2: Organize
    { key: 'pdfxxx', name: getToolDisplayName('pdfxxx', 'pdfxxx'), href: '/pdfxxx', categoryKey: 'catOrganize' },
    { key: 'pdfpng', name: getToolDisplayName('pdfpng', getToolDisplayName('pdfxxxx', 'PDF ➡️ PNG')), href: '/pdf-to-png', categoryKey: 'catPrimary' },
    { key: 'pdfrotate', name: getToolDisplayName('pdfrotate', 'pdfrotate'), href: '/pdf-rotate', categoryKey: 'catOrganize' },

    // Column 3: Security & Utils
    { key: 'pdfunlock', name: getToolDisplayName('pdfunlock', 'pdfunlock'), href: '/pdf-unlock', categoryKey: 'catSecurity' },
    { key: 'pdfwatermark', name: getToolDisplayName('pdfwatermark', 'pdfwatermark'), href: '/pdf-watermark', categoryKey: 'catSecurity' },
    { key: 'pdfsign', name: getToolDisplayName('pdfsign', getToolDisplayName('pdfxxxxxxxx', 'PDF ✍️ 서명 추가')), href: '/pdf-sign', categoryKey: 'catSecurity' },
    { key: 'img2pdf', name: getToolDisplayName('img2pdf', getToolDisplayName('pdfxxxxxxxxx', 'JPG/PNG ➡️ PDF')), href: '/image-to-pdf', categoryKey: 'catSecurity' },
  ];

  const filteredTools = allToolsList.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <nav className={styles.navbar} ref={navContainerRef}>
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
          {/* Logo */}
          <Link href="/" className={styles.logo} onClick={() => setIsOpen(false)}>
            <span style={{ color: '#e3e3e3', fontWeight: 600, letterSpacing: '-0.5px', marginRight: '1px' }}>my</span>
            <div style={{ display: 'flex', alignItems: 'center', letterSpacing: '-0.5px' }}>
              <span style={{ color: '#4285F4' }}>P</span>
              <span style={{ color: '#EA4335' }}>D</span>
              <span style={{ color: '#FBBC04' }}>F</span>
            </div>
          </Link>

          <div className={styles.links}>
            {/* 1. Dropdown Menu (Dynamic Multi-language Label) */}
            <div className={styles.dropdownContainer}>
              <button
                className={`${styles.megaBtn} ${isOpen ? styles.megaBtnActive : ''}`}
                onClick={() => setIsOpen(!isOpen)}
              >
                <IoGridOutline size={18} />
                <span>{(t.nav as any).allToolsBtn || 'All PDF Tools ▾'}</span>
                <IoChevronDown
                  size={14}
                  style={{
                    transform: isOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s',
                  }}
                />
              </button>

              {isOpen && (
                <div className={styles.megaMenuWrapper}>
                  <div className={styles.searchHeader}>
                    <IoSearchOutline size={20} color="#8ab4f8" />
                    <input
                      type="text"
                      className={styles.searchInput}
                      placeholder={(t.nav as any).searchPlaceholder || 'Search PDF tools...'}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <div className={styles.megaMenu}>
                    {/* Column 1: Primary Tools */}
                    <div className={styles.menuColumn}>
                      <div className={styles.columnTitle}>{(t.nav as any).catPrimary || 'Primary Tools'}</div>
                      {filteredTools.filter((t) => t.categoryKey === 'catPrimary').map((t) => (
                        <Link
                          key={t.href}
                          href={t.href}
                          className={`${styles.menuItem} ${pathname === t.href ? styles.menuItemActive : ''}`}
                          onClick={() => setIsOpen(false)}
                        >
                          <span>{t.name}</span>
                        </Link>
                      ))}
                    </div>

                    {/* Column 2: Edit & Organize */}
                    <div className={styles.menuColumn}>
                      <div className={styles.columnTitle}>{(t.nav as any).catOrganize || 'PDF Organize'}</div>
                      {filteredTools.filter((t) => t.categoryKey === 'catOrganize').map((t) => (
                        <Link
                          key={t.href}
                          href={t.href}
                          className={`${styles.menuItem} ${pathname === t.href ? styles.menuItemActive : ''}`}
                          onClick={() => setIsOpen(false)}
                        >
                          <span>{t.name}</span>
                        </Link>
                      ))}
                    </div>

                    {/* Column 3: Security & Utils */}
                    <div className={styles.menuColumn}>
                      <div className={styles.columnTitle}>{(t.nav as any).catSecurity || 'Security & Utils'}</div>
                      {filteredTools.filter((t) => t.categoryKey === 'catSecurity').map((t) => (
                        <Link
                          key={t.href}
                          href={t.href}
                          className={`${styles.menuItem} ${pathname === t.href ? styles.menuItemActive : ''}`}
                          onClick={() => setIsOpen(false)}
                        >
                          <span>{t.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Direct Primary Horizontal Links */}
            {PRIMARY_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.link} ${pathname === item.href ? styles.activeLink : ''}`}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            <div className={`${styles.feedbackWrapper} ${styles.desktopOnly}`}>
              <a
                href="mailto:hanjaeduc@gmail.com?subject=Suggestions for Improvement"
                className={styles.feedbackPill}
                aria-label="Send Feedback"
              >
                <IoMailOutline size={20} />
                <span className={styles.feedbackEmailText}>
                  ✉️ {t.nav.feedback} (hanjaeduc@gmail.com)
                </span>
              </a>
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
