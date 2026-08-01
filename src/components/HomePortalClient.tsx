"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './HomePortalClient.module.css';
import { useLanguage } from '@/lib/LanguageContext';
import {
  IoImagesOutline,
  IoLayersOutline,
  IoCutOutline,
  IoMailOutline,
  IoCheckmarkOutline,
  IoShieldCheckmarkOutline,
} from 'react-icons/io5';

export default function HomePortalClient() {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const copyEmail = () => {
    navigator.clipboard.writeText('hanjaeduc@gmail.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className={styles.container}>
      {/* Centered Clean Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroImgWrapper}>
          <Image
            src="/pdf_util_hero.png"
            alt="PDF Utility Hero Icon"
            width={420}
            height={420}
            priority
            className={styles.heroImg}
          />
        </div>

        <div className={styles.heroText}>
          <span className={styles.heroBadge}>{t.home.heroBadge}</span>
          <h1 className={styles.heroTitle}>{t.home.heroTitle}</h1>
          <p className={styles.heroSubtitle}>{t.home.heroSubtitle}</p>

          <div className={styles.privacyTag}>
            <IoShieldCheckmarkOutline size={18} />
            <span>{t.privacy.banner}</span>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section className={styles.toolsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{t.home.toolSectionTitle}</h2>
          <p className={styles.sectionSub}>{t.home.toolSectionSub}</p>
        </div>

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
