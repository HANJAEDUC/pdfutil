"use client";

import React from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { IoHeartOutline, IoOpenOutline } from 'react-icons/io5';
import styles from './Footer.module.css';

export default function Footer() {
  const { lang } = useLanguage();

  const renderContent = () => {
    if (lang === 'ko') {
      return {
        title: "소소한 도구지만 오늘 작은 도움이 되셨나요?",
        desc: (
          <>
            부족한 프로그램이지만 유용하게 쓰였기를 바랍니다.<br />
            수많은 이들이 말라리아로 힘들어하는 아프리카에 작은 관심의 눈길을 보내주세요. <strong>말라리아 예방 재단(AMF)</strong>의 이야기를 둘러보시는 것만으로도 큰 힘이 됩니다.
          </>
        ),
        btn: "말라리아 예방 재단 둘러보기",
        subPrivacy: "서버 업로드 없이 100% 내 브라우저에서 안전하게 처리됩니다.",
      };
    }

    if (lang === 'de') {
      return {
        title: "Hat Ihnen dieses kleine Tool heute geholfen?",
        desc: (
          <>
            Wir hoffen, dass Ihnen diese einfache Anwendung nützlich war.<br />
            Nehmen Sie sich gerne einen kurzen Moment Zeit, um sich über die Malaria-Prävention in Afrika zu informieren. Schon ein Besuch der <strong>Against Malaria Foundation (AMF)</strong> schenkt wertvolle Aufmerksamkeit.
          </>
        ),
        btn: "Against Malaria Foundation besuchen",
        subPrivacy: "100 % sicher & private Verarbeitung direkt in Ihrem Browser.",
      };
    }

    // Default to English ('en')
    return {
      title: "Did this modest tool help you today?",
      desc: (
        <>
          We hope this simple tool was useful to you.<br />
          Please take a moment to learn about malaria prevention in Africa. Simply visiting the <strong>Against Malaria Foundation (AMF)</strong> spreads meaningful awareness.
        </>
      ),
      btn: "Learn about AMF Foundation",
      subPrivacy: "100% Secure & Processed Privately In Your Browser.",
    };
  };

  const content = renderContent();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.amfCard}>
          <div className={styles.iconWrapper}>
            <IoHeartOutline className={styles.heartIcon} />
          </div>
          <div className={styles.textContent}>
            <h4 className={styles.title}>{content.title}</h4>
            <p className={styles.description}>{content.desc}</p>
          </div>
          <a
            href="https://www.againstmalaria.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.amfButton}
            data-href="https://www.againstmalaria.com/"
            title="https://www.againstmalaria.com/"
          >
            <span>{content.btn}</span>
            <IoOpenOutline className={styles.launchIcon} />
          </a>
        </div>

        <div className={styles.bottomInfo}>
          <p>© {new Date().getFullYear()} myPDF (mypdf.co.kr). 100% Client-Side & Free for Everyone.</p>
          <p>{content.subPrivacy}</p>
        </div>
      </div>
    </footer>
  );
}
