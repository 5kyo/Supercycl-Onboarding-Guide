# Supercycl 사용자 가이드 페이지 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Supercycl-Mobile 앱의 온보딩과 주요 기능을 안내하는 한/영 토글 정적 HTML 가이드 페이지를 만든다 (실제 디자인 모드 화면 캡처 포함).

**Architecture:** 빌드 도구 없는 정적 사이트 — `index.html`(한국어 기본 텍스트 + `data-i18n` 키) + `assets/i18n.js`(ko/en 사전) + `assets/guide.js`(토글·스크롤스파이) + `assets/guide.css`(Supercycl 디자인 토큰 차용). 화면 이미지는 Supercycl-Mobile 로컬 서버의 `design-spec.html`을 디자인 모드로 전환해 Playwright로 캡처(`tools/capture.mjs`).

**Tech Stack:** 순수 HTML/CSS/JS (외부 라이브러리 없음), Node.js 내장 `node:test`, Playwright(Supercycl-Mobile의 설치본을 `createRequire`로 차용).

**Spec:** `docs/superpowers/specs/2026-06-12-supercycl-guide-design.md`

---

## 사전 확인된 기술 사실 (조사 완료 — 재확인 불필요)

- Supercycl-Mobile 경로: `/Users/okyokwon/Desktop/Projects/Supercycl-Mobile`
- 로컬 서버: Mobile 레포에서 `npm run dev` → `http://localhost:8080`
- `design-spec.html`은 인증 게이트가 있어 비로그인 시 `landing.html?next=...`로 리다이렉트됨
- 인증 세션: `Supercycl-Mobile/tests/e2e/.auth/default.json` (Playwright storageState 형식, 존재 확인됨)
- Playwright `@playwright/test` 1.59.1 + Chromium이 Mobile 레포에 설치되어 있음
- 목업 구조: `<div class="device-frame" id="app">` 안에 52개 `.screen` div가 절대배치로 겹쳐 있고 한 번에 하나만 `.active`(opacity 1). 전역 JS 함수 `navigateTo('scr-XXX')`로 전환, `switchViewMode('design')`으로 디자인 모드(`<body data-mode="design">`) 전환
- 캡처 대상 11개 화면 ID 전부 존재 확인됨: scr-001, scr-807, scr-812, scr-801, scr-802, scr-102, scr-720, scr-301, scr-401, scr-402, scr-403
- 디자인 토큰 (Mobile `assets/design-spec/styles/tokens-design.css`): 배경 `linear-gradient(160deg, #060610 0%, #0A1510 50%, #050508 100%)`, 액센트 `#00E676`, 그라디언트 `linear-gradient(135deg, #7EF0A8, #00E676)`, 폰트 IBM Plex Sans

## 파일 구조 (최종)

```
Supercycl-Guide/
├── index.html              # 가이드 본문 (한국어 기본 텍스트 + data-i18n 키)
├── README.md               # 프로젝트 안내 + 캡처/테스트 실행법
├── .gitignore
├── assets/
│   ├── guide.css           # 스타일 (디자인 토큰 차용 + 시니어 가독성)
│   ├── i18n.js             # ko/en 번역 사전 (브라우저 전역 + CommonJS 호환)
│   └── guide.js            # 언어 토글 + 현재 섹션 표시
├── images/                 # 캡처 PNG 11장 (git에 커밋)
├── tools/
│   └── capture.mjs         # Playwright 캡처 스크립트 (재실행 가능)
└── tests/
    └── i18n.test.mjs       # 번역 키 커버리지 테스트 (node --test)
```

---

### Task 1: 저장소 골격

**Files:**
- Create: `.gitignore`

- [ ] **Step 1: 디렉토리와 .gitignore 생성**

작업 디렉토리는 항상 `/Users/okyokwon/Desktop/Projects/Supercycl-Guide`.

```bash
mkdir -p assets images tools tests
```

`.gitignore` 내용:

```gitignore
.DS_Store
node_modules/
```

- [ ] **Step 2: 커밋**

```bash
git add .gitignore
git commit -m "chore: 저장소 골격 + .gitignore"
```

---

### Task 2: 화면 캡처 스크립트 + 이미지 11장

**Files:**
- Create: `tools/capture.mjs`
- Create: `images/scr-*.png` (11장, 스크립트 산출물)

- [ ] **Step 1: tools/capture.mjs 작성**

```js
#!/usr/bin/env node
// Supercycl-Mobile design-spec.html 의 디자인 모드 화면을 캡처해 images/ 에 저장한다.
// 전제: Supercycl-Mobile 에서 `npm run dev` 실행 중 (http://localhost:8080)
// 재실행 가능 — 목업이 바뀌면 `node tools/capture.mjs` 로 이미지 갱신.
import { createRequire } from 'node:module';
import { mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const MOBILE_ROOT = '/Users/okyokwon/Desktop/Projects/Supercycl-Mobile';
const requireFromMobile = createRequire(path.join(MOBILE_ROOT, 'package.json'));
const { chromium } = requireFromMobile('@playwright/test');

const GUIDE_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT_DIR = path.join(GUIDE_ROOT, 'images');
const BASE_URL = 'http://localhost:8080';
const STORAGE_STATE = path.join(MOBILE_ROOT, 'tests/e2e/.auth/default.json');

const SCREENS = [
  'scr-001', // 로그인
  'scr-807', // 거래소 연결 게이트 (온보딩)
  'scr-812', // 거래소 목록
  'scr-801', // OAuth 연결 승인
  'scr-802', // 연결 성공
  'scr-102', // Trade (기본 랜딩)
  'scr-720', // PWA 설치 프롬프트
  'scr-301', // Markets
  'scr-401', // Portfolio
  'scr-402', // Portfolio 상세
  'scr-403', // Profile
];

function fail(msg) {
  console.error(`\n[capture] ${msg}\n`);
  process.exit(1);
}

// 1. 서버 살아있는지 확인
try {
  await fetch(`${BASE_URL}/design-spec.html`, { method: 'HEAD' });
} catch {
  fail(
    `${BASE_URL} 에 연결할 수 없습니다.\n` +
    `Supercycl-Mobile 에서 먼저 서버를 실행하세요:\n` +
    `  cd ${MOBILE_ROOT} && npm run dev`
  );
}

// 2. 인증 세션 확인
if (!existsSync(STORAGE_STATE)) {
  fail(
    `인증 세션 파일이 없습니다: ${STORAGE_STATE}\n` +
    `Supercycl-Mobile 에서 E2E 를 1회 실행해 세션을 생성하세요:\n` +
    `  cd ${MOBILE_ROOT} && npx playwright test`
  );
}

mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  storageState: STORAGE_STATE,
  viewport: { width: 1600, height: 1100 },
  deviceScaleFactor: 2, // 고해상도(2x) 캡처
});
const page = await context.newPage();

await page.goto(`${BASE_URL}/design-spec.html`, { waitUntil: 'domcontentloaded' });

// 3. 인증 게이트 통과 확인 — 실패 시 landing.html 로 리다이렉트되어 #app 이 없다
try {
  await page.waitForSelector('#app', { timeout: 15000 });
} catch {
  if (page.url().includes('landing.html')) {
    await browser.close();
    fail(
      '인증 세션이 만료되었습니다.\n' +
      `Supercycl-Mobile 에서 E2E 를 1회 실행해 세션을 갱신하세요:\n` +
      `  cd ${MOBILE_ROOT} && npx playwright test`
    );
  }
  await browser.close();
  fail(`#app 을 찾지 못했습니다. 현재 URL: ${page.url()}`);
}
await page.waitForTimeout(1500); // 폰트/초기 렌더 여유

// 4. 디자인 모드 전환
await page.evaluate(() => switchViewMode('design'));
await page.waitForTimeout(500);

// 5. 화면별 캡처
const frame = page.locator('#app');
for (const id of SCREENS) {
  await page.evaluate((sid) => navigateTo(sid), id);
  await page.waitForTimeout(600); // 화면 전환 + 동적 렌더 여유
  const out = path.join(OUT_DIR, `${id}.png`);
  await frame.screenshot({ path: out });
  console.log(`[capture] images/${id}.png`);
}

await browser.close();
console.log(`[capture] 완료 — ${SCREENS.length}장`);
```

- [ ] **Step 2: Supercycl-Mobile 로컬 서버 실행 (백그라운드)**

```bash
cd /Users/okyokwon/Desktop/Projects/Supercycl-Mobile && npm run dev
```

백그라운드로 실행하고, 준비될 때까지 대기:

```bash
until curl -s -o /dev/null http://localhost:8080/design-spec.html; do sleep 1; done; echo READY
```

Expected: `READY` (수 초 내). 이미 다른 프로세스가 8080을 쓰고 있다면 그대로 사용해도 된다 (같은 Mobile 서버인 경우).

- [ ] **Step 3: 캡처 실행**

```bash
cd /Users/okyokwon/Desktop/Projects/Supercycl-Guide && node tools/capture.mjs
```

Expected: `[capture] images/scr-XXX.png` 11줄 + `[capture] 완료 — 11장`.

인증 만료 메시지가 나오면: `cd /Users/okyokwon/Desktop/Projects/Supercycl-Mobile && npx playwright test -x --project=chromium || true` 로 globalSetup을 1회 돌려 `.auth/default.json`을 재생성한 뒤 재시도.

- [ ] **Step 4: 결과 검증**

```bash
ls -la images/ && file images/scr-001.png
```

Expected: PNG 11개, 각 50KB 이상, `file` 출력에 `PNG image data` + 너비 800px 내외(390×2 + 프레임).

Read 도구로 `images/scr-001.png`, `images/scr-807.png`, `images/scr-102.png` 를 열어 눈으로 확인:
- 다크 배경 + 그린 액센트(디자인 모드)인가? (그레이스케일 와이어프레임이면 `switchViewMode('design')`이 적용 안 된 것)
- 화면이 잘리지 않고 통째로 들어왔는가?

문제가 있으면 대기 시간(waitForTimeout)을 늘리거나 셀렉터를 조정해 재실행.

- [ ] **Step 5: 커밋**

```bash
git add tools/capture.mjs images/
git commit -m "feat: 디자인 모드 화면 캡처 스크립트 + 캡처 이미지 11장"
```

---

### Task 3: index.html — 전체 마크업

**Files:**
- Create: `index.html`

- [ ] **Step 1: index.html 작성**

한국어가 기본 텍스트로 인라인되어 있고, 모든 번역 대상에 `data-i18n`(텍스트) / `data-i18n-alt`(이미지 alt) 키가 붙는다. 키 이름은 Task 5의 `assets/i18n.js` 사전과 정확히 일치해야 한다.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Supercycl 사용 가이드</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&family=Noto+Sans+KR:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/guide.css">
</head>
<body>

<header class="site-header">
  <div class="header-inner">
    <div class="brand">Supercycl <span class="brand-sub" data-i18n="header.title">사용 가이드</span></div>
    <div class="current-section" id="currentSection" aria-live="polite"></div>
    <div class="lang-toggle" role="group" aria-label="언어 선택 / Language">
      <button type="button" class="lang-btn active" data-lang="ko" onclick="setLang('ko')">한국어</button>
      <button type="button" class="lang-btn" data-lang="en" onclick="setLang('en')">English</button>
    </div>
  </div>
</header>

<main>

  <!-- 인트로 -->
  <section class="hero" id="sec-intro">
    <h1 data-i18n="intro.title">Supercycl이 처음이신가요?</h1>
    <p class="lead" data-i18n="intro.body">Supercycl(슈퍼사이클)은 여러 거래소를 한 곳에서 편리하게 거래할 수 있는 서비스입니다. 이 가이드는 처음 시작하는 분도 따라 할 수 있도록 실제 화면과 함께 차근차근 안내해 드립니다.</p>
    <p class="hint" data-i18n="intro.hint">아래 목차에서 궁금한 항목을 누르면 해당 설명으로 바로 이동합니다.</p>
  </section>

  <!-- 목차 -->
  <nav class="toc" aria-label="목차">
    <h2 data-i18n="toc.heading">무엇이 궁금하세요?</h2>
    <div class="toc-grid">
      <a class="toc-card" href="#sec-onboarding">
        <span class="toc-num">1</span>
        <span class="toc-text"><strong data-i18n="toc1.title">시작하기</strong><small data-i18n="toc1.sub">로그인부터 거래소 연결까지</small></span>
      </a>
      <a class="toc-card" href="#sec-markets">
        <span class="toc-num">2</span>
        <span class="toc-text"><strong data-i18n="toc2.title">Markets</strong><small data-i18n="toc2.sub">시세 확인하기</small></span>
      </a>
      <a class="toc-card" href="#sec-trade">
        <span class="toc-num">3</span>
        <span class="toc-text"><strong data-i18n="toc3.title">Trade</strong><small data-i18n="toc3.sub">주문하기</small></span>
      </a>
      <a class="toc-card" href="#sec-portfolio">
        <span class="toc-num">4</span>
        <span class="toc-text"><strong data-i18n="toc4.title">Portfolio</strong><small data-i18n="toc4.sub">내 자산 확인</small></span>
      </a>
      <a class="toc-card" href="#sec-profile">
        <span class="toc-num">5</span>
        <span class="toc-text"><strong data-i18n="toc5.title">Profile</strong><small data-i18n="toc5.sub">설정 관리</small></span>
      </a>
      <a class="toc-card" href="#sec-install">
        <span class="toc-num">6</span>
        <span class="toc-text"><strong data-i18n="toc6.title">앱 설치하기</strong><small data-i18n="toc6.sub">홈 화면에 추가</small></span>
      </a>
    </div>
  </nav>

  <!-- ① 시작하기 (온보딩) -->
  <section id="sec-onboarding">
    <h2><span class="sec-num">1</span> <span data-i18n="ob.heading">시작하기 — 처음 5단계</span></h2>
    <p class="lead" data-i18n="ob.lead">Supercycl을 처음 사용할 때는 아래 5단계만 따라 하면 됩니다. 10분이면 충분해요.</p>

    <article class="step-card">
      <div class="step-head"><span class="step-badge">1</span><h3 data-i18n="s1.title">로그인하기</h3></div>
      <p data-i18n="s1.body">앱을 열면 가장 먼저 로그인 화면이 나타납니다. 세 가지 방법 중 편한 것을 선택하세요.</p>
      <ul>
        <li data-i18n="s1.li1">이메일 — 이메일 주소로 가입하고 로그인합니다.</li>
        <li data-i18n="s1.li2">Google — 구글 계정으로 한 번에 로그인합니다.</li>
        <li data-i18n="s1.li3">QR 코드 — 다른 기기에서 QR을 스캔해 로그인합니다.</li>
      </ul>
      <figure class="phone"><img src="images/scr-001.png" alt="Supercycl 로그인 화면" data-i18n-alt="s1.alt" loading="lazy"></figure>
    </article>

    <article class="step-card">
      <div class="step-head"><span class="step-badge">2</span><h3 data-i18n="s2.title">거래소 연결 안내 화면</h3></div>
      <p data-i18n="s2.body">로그인하면 '거래소를 연결하세요(Connect Your Exchange)' 화면이 나타납니다. Supercycl은 거래소 계정을 연결해야 거래할 수 있는 서비스이기 때문에, 이 단계가 가장 중요합니다. 'Connect Now' 버튼을 눌러주세요.</p>
      <div class="note note-warn"><span class="note-icon">⚠️</span><p data-i18n="s2.warn">'Skip for now(나중에 하기)'를 누르면 화면을 둘러볼 수는 있지만 거래는 할 수 없습니다. 꼭 거래소를 연결해 주세요.</p></div>
      <figure class="phone">
        <img src="images/scr-807.png" alt="거래소 연결 안내 화면" data-i18n-alt="s2.alt" loading="lazy">
        <span class="tap-label" style="--tap-y: 84%" data-i18n="s2.tap">여기를 누르세요</span>
      </figure>
    </article>

    <article class="step-card">
      <div class="step-head"><span class="step-badge">3</span><h3 data-i18n="s3.title">거래소 선택하기</h3></div>
      <p data-i18n="s3.body">연결할 수 있는 거래소 목록이 나타납니다. 지금은 OKX 거래소만 연결할 수 있고, 나머지 거래소는 곧 지원될 예정(Coming Soon)입니다. 목록에서 OKX를 눌러주세요.</p>
      <figure class="phone"><img src="images/scr-812.png" alt="거래소 목록 화면" data-i18n-alt="s3.alt" loading="lazy"></figure>
    </article>

    <article class="step-card">
      <div class="step-head"><span class="step-badge">4</span><h3 data-i18n="s4.title">연결 승인하기</h3></div>
      <p data-i18n="s4.body">Supercycl이 어떤 권한을 사용하는지 보여주는 화면입니다. 내용을 확인한 뒤 'Connect with OKX' 버튼을 누르면 OKX 로그인 페이지로 이동합니다. OKX 계정으로 로그인하고 승인하면 연결이 끝납니다.</p>
      <div class="note note-safe"><span class="note-icon">🔒</span><p data-i18n="s4.safe">안심하세요 — Supercycl은 거래에 필요한 권한만 요청하며, 출금 권한은 요청하지 않습니다. 연결은 언제든지 해제할 수 있습니다.</p></div>
      <figure class="phone">
        <img src="images/scr-801.png" alt="연결 승인 화면" data-i18n-alt="s4.alt" loading="lazy">
        <span class="tap-label" style="--tap-y: 84%" data-i18n="s4.tap">여기를 누르세요</span>
      </figure>
    </article>

    <article class="step-card">
      <div class="step-head"><span class="step-badge">5</span><h3 data-i18n="s5.title">연결 완료 — 이제 시작!</h3></div>
      <p data-i18n="s5.body">연결이 끝나면 완료 화면이 잠시 보였다가 거래(Trade) 화면으로 이동합니다. 이 화면이 Supercycl의 기본 화면입니다. 화면 아래쪽에는 Markets · Trade · Portfolio · Profile 네 개의 탭이 있습니다.</p>
      <div class="note note-info"><span class="note-icon">💡</span><p data-i18n="s5.tip">이때 '홈 화면에 추가' 안내가 자동으로 나타날 수 있어요. 앱처럼 편하게 쓰려면 추가하는 것을 추천합니다. 자세한 방법은 아래 ⑥ 앱 설치하기를 참고하세요.</p></div>
      <div class="phone-pair">
        <figure class="phone"><img src="images/scr-802.png" alt="연결 완료 화면" data-i18n-alt="s5.alt1" loading="lazy"></figure>
        <figure class="phone"><img src="images/scr-102.png" alt="거래 기본 화면" data-i18n-alt="s5.alt2" loading="lazy"></figure>
      </div>
    </article>
  </section>

  <!-- ② Markets -->
  <section id="sec-markets">
    <h2><span class="sec-num">2</span> <span data-i18n="mk.heading">Markets — 시세 확인하기</span></h2>
    <p data-i18n="mk.body">Markets 탭에서는 거래할 수 있는 모든 종목의 실시간 가격을 볼 수 있습니다.</p>
    <ul>
      <li data-i18n="mk.li1">위쪽 검색창에서 종목 이름(예: BTC)을 검색할 수 있습니다.</li>
      <li data-i18n="mk.li2">종목을 누르면 바로 거래 화면으로 이동합니다.</li>
    </ul>
    <figure class="phone"><img src="images/scr-301.png" alt="Markets 시세 화면" data-i18n-alt="mk.alt" loading="lazy"></figure>
  </section>

  <!-- ③ Trade -->
  <section id="sec-trade">
    <h2><span class="sec-num">3</span> <span data-i18n="tr.heading">Trade — 주문하기</span></h2>
    <p data-i18n="tr.body">Trade 탭은 실제로 사고파는 화면입니다. 처음에는 꼭 필요한 것만 보이는 간단한 주문 화면이 표시됩니다.</p>
    <ul>
      <li data-i18n="tr.li1">금액(Amount)과 배율(Leverage)을 정한 뒤 매수(Long) 또는 매도(Short) 버튼을 누릅니다.</li>
      <li data-i18n="tr.li2">주문 전 확인 화면에서 내용을 다시 한 번 확인할 수 있습니다.</li>
    </ul>
    <div class="note note-warn"><span class="note-icon">⚠️</span><p data-i18n="tr.warn">선물 거래는 원금 손실 위험이 있습니다. 처음에는 작은 금액으로 연습해 보세요.</p></div>
    <figure class="phone"><img src="images/scr-102.png" alt="Trade 주문 화면" data-i18n-alt="tr.alt" loading="lazy"></figure>
  </section>

  <!-- ④ Portfolio -->
  <section id="sec-portfolio">
    <h2><span class="sec-num">4</span> <span data-i18n="pf.heading">Portfolio — 내 자산 확인</span></h2>
    <p data-i18n="pf.body">Portfolio 탭에서는 내 자산과 보유 중인 포지션을 한눈에 볼 수 있습니다.</p>
    <ul>
      <li data-i18n="pf.li1">전체 자산과 손익(수익·손실)을 확인할 수 있습니다.</li>
      <li data-i18n="pf.li2">보유 포지션을 누르면 상세 내용을 보거나 종료할 수 있습니다.</li>
    </ul>
    <div class="phone-pair">
      <figure class="phone"><img src="images/scr-401.png" alt="Portfolio 화면" data-i18n-alt="pf.alt1" loading="lazy"></figure>
      <figure class="phone"><img src="images/scr-402.png" alt="Portfolio 상세 화면" data-i18n-alt="pf.alt2" loading="lazy"></figure>
    </div>
  </section>

  <!-- ⑤ Profile -->
  <section id="sec-profile">
    <h2><span class="sec-num">5</span> <span data-i18n="pr.heading">Profile — 설정 관리</span></h2>
    <p data-i18n="pr.body">Profile 탭에서는 계정과 앱 설정을 관리합니다.</p>
    <ul>
      <li data-i18n="pr.li1">Connect Exchange — 거래소를 추가로 연결하거나 관리합니다.</li>
      <li data-i18n="pr.li2">Notifications — 알림을 켜고 끕니다.</li>
      <li data-i18n="pr.li3">앱 설치 메뉴에서 '홈 화면에 추가' 안내를 다시 볼 수 있습니다.</li>
    </ul>
    <figure class="phone"><img src="images/scr-403.png" alt="Profile 설정 화면" data-i18n-alt="pr.alt" loading="lazy"></figure>
  </section>

  <!-- ⑥ 앱 설치하기 (PWA) -->
  <section id="sec-install">
    <h2><span class="sec-num">6</span> <span data-i18n="pwa.heading">앱 설치하기 — 홈 화면에 추가</span></h2>
    <p data-i18n="pwa.body">Supercycl은 앱스토어에서 내려받는 앱이 아닙니다. 인터넷 브라우저에서 열고 '홈 화면에 추가'하면 일반 앱처럼 아이콘이 생기고 똑같이 사용할 수 있습니다. 사용하시는 기기에 맞는 방법을 따라 해 보세요.</p>
    <div class="note note-info"><span class="note-icon">💡</span><p data-i18n="pwa.note">앱스토어나 플레이스토어에서 검색해도 나오지 않아요. 아래 방법으로 설치해 주세요.</p></div>

    <article class="device-card">
      <h3><span class="device-icon">📱</span><span data-i18n="pwa.safari.title">iPhone / iPad — Safari로 여는 경우</span></h3>
      <ol class="install-steps">
        <li data-i18n="pwa.safari.s1">화면 아래쪽 가운데의 공유 버튼(네모에 화살표 ⬆)을 누르세요.</li>
        <li data-i18n="pwa.safari.s2">목록을 아래로 내려 '홈 화면에 추가'를 선택하세요.</li>
        <li data-i18n="pwa.safari.s3">오른쪽 위 '추가'를 누르면 끝! 홈 화면에 Supercycl 아이콘이 생깁니다.</li>
      </ol>
    </article>

    <article class="device-card">
      <h3><span class="device-icon">📱</span><span data-i18n="pwa.ioschrome.title">iPhone / iPad — Chrome으로 여는 경우</span></h3>
      <ol class="install-steps">
        <li data-i18n="pwa.ioschrome.s1">화면 오른쪽 위의 ⋯ 메뉴를 누르고 '공유'를 선택하세요.</li>
        <li data-i18n="pwa.ioschrome.s2">'홈 화면에 추가'를 선택하세요.</li>
        <li data-i18n="pwa.ioschrome.s3">'추가'를 누르면 끝!</li>
      </ol>
      <p class="device-note" data-i18n="pwa.ioschrome.note">Safari와는 첫 단계(공유 버튼의 위치)만 다르고 나머지는 같습니다.</p>
    </article>

    <article class="device-card">
      <h3><span class="device-icon">🤖</span><span data-i18n="pwa.android.title">Android — Chrome으로 여는 경우</span></h3>
      <ol class="install-steps">
        <li data-i18n="pwa.android.s1">화면에 자동으로 나타나는 설치 안내에서 'Install(설치)'을 누르세요.</li>
        <li data-i18n="pwa.android.s2">안내가 보이지 않으면 오른쪽 위 ⋮ 메뉴에서 '앱 설치'(또는 '홈 화면에 추가')를 선택하세요.</li>
      </ol>
      <p class="device-note" data-i18n="pwa.android.note">Android는 버튼 한 번이면 설치됩니다.</p>
    </article>

    <div class="note note-warn"><span class="note-icon">⚠️</span><p data-i18n="pwa.warn">iPhone에서 알림(푸시)을 받으려면 iOS 16.4 이상이어야 하고, 반드시 홈 화면에 추가한 아이콘으로 열어야 합니다.</p></div>

    <figure class="phone"><img src="images/scr-720.png" alt="홈 화면에 추가 안내 화면" data-i18n-alt="pwa.alt" loading="lazy"></figure>
  </section>

  <!-- FAQ -->
  <section id="sec-faq">
    <h2 data-i18n="faq.heading">자주 묻는 질문</h2>
    <dl class="faq">
      <dt data-i18n="faq1.q">거래소 연결을 건너뛰었어요. 다시 연결하려면 어떻게 하나요?</dt>
      <dd data-i18n="faq1.a">화면 아래 Profile 탭 → 'Connect Exchange'를 누르면 언제든지 다시 연결할 수 있습니다. Trade 화면 위쪽의 연결 안내 배너를 눌러도 됩니다.</dd>
      <dt data-i18n="faq2.q">앱스토어에서 Supercycl이 검색되지 않아요.</dt>
      <dd data-i18n="faq2.a">Supercycl은 브라우저에서 바로 쓰는 앱이라 앱스토어에 없습니다. 위의 ⑥ 앱 설치하기 방법으로 홈 화면에 추가해 주세요.</dd>
      <dt data-i18n="faq3.q">알림이 오지 않아요.</dt>
      <dd data-i18n="faq3.a">Profile → Notifications에서 알림이 켜져 있는지 확인하세요. iPhone은 iOS 16.4 이상에서 홈 화면에 추가한 경우에만 알림을 받을 수 있습니다.</dd>
    </dl>
  </section>

  <footer class="site-footer">
    <p data-i18n="footer.help">도움이 필요하시면 Supercycl 고객센터로 문의해 주세요.</p>
    <p class="copy">© Supercycl</p>
  </footer>

</main>

<script src="assets/i18n.js"></script>
<script src="assets/guide.js"></script>
</body>
</html>
```

- [ ] **Step 2: 브라우저 스모크 확인**

```bash
open index.html
```

Expected: 스타일 없는 한국어 본문이 전부 보인다 (CSS/JS는 아직 없어 404 — 정상). 이미지 11장이 표시된다.

- [ ] **Step 3: 커밋**

```bash
git add index.html
git commit -m "feat: 가이드 본문 마크업 (한국어 기본 + data-i18n 키)"
```

---

### Task 4: assets/guide.css — 스타일

**Files:**
- Create: `assets/guide.css`

- [ ] **Step 1: guide.css 작성**

Supercycl 디자인 토큰(다크 그라디언트 + Mono Green) + 시니어 가독성 보정(본문 18px+, 줄간격 1.7, 고대비, 터치 타깃 48px+).

```css
/* Supercycl 사용 가이드 — Dark Pro + Mono Green (Supercycl-Mobile tokens-design.css 차용) */
:root {
  --bg-page: linear-gradient(160deg, #060610 0%, #0A1510 50%, #050508 100%);
  --bg-card: rgba(255, 255, 255, 0.04);
  --bg-elevated: rgba(255, 255, 255, 0.07);
  --border: rgba(255, 255, 255, 0.10);
  --text-primary: #FFFFFF;
  --text-secondary: #B8C0BC;
  --accent: #00E676;
  --accent-light: #7EF0A8;
  --accent-gradient: linear-gradient(135deg, #7EF0A8, #00E676);
  --accent-glow: rgba(0, 230, 118, 0.3);
  --accent-tint: rgba(0, 230, 118, 0.12);
  --accent-border-soft: rgba(0, 230, 118, 0.25);
  --warn: #FFC107;
  --warn-tint: rgba(255, 193, 7, 0.10);
  --font-sans: 'IBM Plex Sans', 'Noto Sans KR', 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
  --header-h: 72px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html { scroll-behavior: smooth; }

body {
  background: var(--bg-page);
  background-attachment: fixed;
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 18px;            /* 시니어 가독성: 본문 18px 이상 */
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
}

main { max-width: 760px; margin: 0 auto; padding: calc(var(--header-h) + 32px) 20px 60px; }

section { scroll-margin-top: calc(var(--header-h) + 16px); margin-bottom: 72px; }

h1 { font-size: 34px; line-height: 1.3; font-weight: 700; }
h2 { font-size: 27px; line-height: 1.35; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 12px; }
h3 { font-size: 21px; line-height: 1.4; font-weight: 600; }
p, li { color: var(--text-primary); }
.lead { font-size: 19px; margin: 14px 0; }
.hint { color: var(--text-secondary); font-size: 17px; }
ul, ol { padding-left: 26px; margin: 12px 0; }
li { margin: 8px 0; }
a { color: var(--accent-light); }

/* ===== 고정 헤더 ===== */
.site-header {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  background: rgba(6, 6, 16, 0.82);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--border);
}
.header-inner {
  max-width: 760px; margin: 0 auto; height: var(--header-h);
  display: flex; align-items: center; gap: 16px; padding: 0 20px;
}
.brand { font-weight: 700; font-size: 20px; white-space: nowrap; }
.brand-sub { color: var(--accent); font-weight: 600; }
.current-section {
  flex: 1; text-align: center; color: var(--text-secondary);
  font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.lang-toggle { display: flex; border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
.lang-btn {
  min-height: 48px; min-width: 88px; padding: 0 16px;   /* 터치 타깃 48px+ */
  background: transparent; color: var(--text-secondary);
  border: none; font: 600 16px var(--font-sans); cursor: pointer;
}
.lang-btn.active { background: var(--accent-gradient); color: #06140C; }

/* ===== 인트로 ===== */
.hero { padding-top: 12px; }

/* ===== 목차 ===== */
.toc { margin-bottom: 72px; }
.toc h2 { margin-bottom: 18px; }
.toc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.toc-card {
  display: flex; align-items: center; gap: 16px; min-height: 84px;
  background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px;
  padding: 16px 18px; text-decoration: none; color: var(--text-primary);
  transition: border-color 0.15s;
}
.toc-card:hover { border-color: var(--accent-border-soft); }
.toc-num {
  flex: none; width: 48px; height: 48px; border-radius: 50%;
  background: var(--accent-tint); border: 1px solid var(--accent-border-soft);
  color: var(--accent); font: 700 22px/46px var(--font-sans); text-align: center;
}
.toc-text { display: flex; flex-direction: column; gap: 2px; }
.toc-text strong { font-size: 19px; }
.toc-text small { color: var(--text-secondary); font-size: 15px; }

/* ===== 섹션 번호 ===== */
.sec-num {
  flex: none; width: 44px; height: 44px; border-radius: 50%;
  background: var(--accent-gradient); color: #06140C;
  font: 700 22px/44px var(--font-sans); text-align: center;
}

/* ===== 온보딩 STEP 카드 ===== */
.step-card {
  background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px;
  padding: 28px 24px; margin: 24px 0;
}
.step-head { display: flex; align-items: center; gap: 16px; margin-bottom: 14px; }
.step-badge {
  flex: none; width: 56px; height: 56px; border-radius: 50%;   /* 스펙: 56px 원형 배지 */
  background: var(--accent-gradient); color: #06140C;
  font: 700 26px/56px var(--font-sans); text-align: center;
  box-shadow: 0 0 24px var(--accent-glow);
}

/* ===== 안내 박스 ===== */
.note {
  display: flex; gap: 12px; align-items: flex-start;
  border-radius: 14px; padding: 16px 18px; margin: 16px 0;
}
.note-icon { font-size: 22px; line-height: 1.4; }
.note p { font-size: 17px; }
.note-warn { background: var(--warn-tint); border: 1px solid rgba(255, 193, 7, 0.35); }
.note-safe { background: var(--accent-tint); border: 1px solid var(--accent-border-soft); }
.note-info { background: var(--bg-elevated); border: 1px solid var(--border); }

/* ===== 화면 캡처 (폰 프레임) ===== */
.phone { margin: 22px auto 6px; text-align: center; position: relative; display: block; }
/* 탭 위치 안내 — 이미지 편집 없이 CSS 오버레이. --tap-y 로 세로 위치 지정 */
.tap-label {
  position: absolute; left: 50%; top: var(--tap-y, 80%);
  transform: translate(-50%, -130%);
  background: var(--accent-gradient); color: #06140C;
  font: 700 15px/1 var(--font-sans);
  padding: 10px 16px; border-radius: 999px; white-space: nowrap;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
  pointer-events: none;
}
.tap-label::after {
  content: ''; position: absolute; left: 50%; top: 100%;
  transform: translateX(-50%);
  border: 8px solid transparent; border-top-color: var(--accent);
}
.phone img {
  width: 100%; max-width: 320px;
  border-radius: 28px; border: 1px solid var(--accent-border-soft);
  box-shadow: 0 0 40px rgba(0, 230, 118, 0.12), 0 12px 32px rgba(0, 0, 0, 0.5);
}
.phone-pair { display: flex; gap: 18px; justify-content: center; flex-wrap: wrap; }
.phone-pair .phone { margin: 22px 0 6px; }
.phone-pair .phone img { max-width: 280px; }

/* ===== 기기별 설치 카드 ===== */
.device-card {
  background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px;
  padding: 24px; margin: 18px 0;
}
.device-card h3 { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.device-icon { font-size: 24px; }
.install-steps { counter-reset: step; list-style: none; padding-left: 0; }
.install-steps li {
  counter-increment: step; position: relative;
  padding-left: 52px; margin: 14px 0; min-height: 38px;
}
.install-steps li::before {
  content: counter(step);
  position: absolute; left: 0; top: 0;
  width: 38px; height: 38px; border-radius: 50%;
  background: var(--accent-tint); border: 1px solid var(--accent-border-soft);
  color: var(--accent); font: 700 18px/36px var(--font-sans); text-align: center;
}
.device-note { color: var(--text-secondary); font-size: 16px; margin-top: 10px; }

/* ===== FAQ ===== */
.faq dt { font-weight: 700; font-size: 19px; margin-top: 22px; color: var(--accent-light); }
.faq dd { margin: 8px 0 0; }

/* ===== 푸터 ===== */
.site-footer {
  border-top: 1px solid var(--border); padding-top: 28px; text-align: center;
  color: var(--text-secondary);
}
.site-footer .copy { margin-top: 10px; font-size: 15px; }

/* ===== 모바일 ===== */
@media (max-width: 640px) {
  .toc-grid { grid-template-columns: 1fr; }
  .current-section { display: none; }
  h1 { font-size: 28px; }
  h2 { font-size: 24px; }
  .header-inner { gap: 10px; }
}
```

- [ ] **Step 2: 브라우저 확인**

```bash
open index.html
```

Expected: 다크 그라디언트 배경 + 그린 액센트, 고정 헤더, 목차 카드 2열(모바일 1열), 캡처 이미지가 폰 프레임(둥근 모서리 + 그린 글로우)으로 표시.

- [ ] **Step 3: 커밋**

```bash
git add assets/guide.css
git commit -m "feat: 가이드 스타일 — 디자인 토큰 차용 + 시니어 가독성"
```

---

### Task 5: 번역 사전 + 커버리지 테스트 (TDD)

**Files:**
- Create: `tests/i18n.test.mjs` (먼저)
- Create: `assets/i18n.js`

- [ ] **Step 1: 실패하는 테스트 작성 — tests/i18n.test.mjs**

```js
// 번역 키 커버리지 테스트: index.html 의 모든 data-i18n / data-i18n-alt 키가
// ko/en 사전에 빠짐없이 존재하는지 검증한다. 실행: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const I18N = require('../assets/i18n.js');

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const keys = [...html.matchAll(/data-i18n(?:-alt)?="([^"]+)"/g)].map((m) => m[1]);

test('index.html 에 data-i18n 키가 충분히 존재한다', () => {
  assert.ok(keys.length > 50, `키가 너무 적습니다: ${keys.length}`);
});

test('HTML 의 모든 키가 ko / en 사전에 존재한다', () => {
  for (const k of keys) {
    assert.ok(k in I18N.ko, `ko 사전에 없는 키: ${k}`);
    assert.ok(k in I18N.en, `en 사전에 없는 키: ${k}`);
  }
});

test('ko / en 사전의 키 집합이 동일하다', () => {
  assert.deepEqual(Object.keys(I18N.ko).sort(), Object.keys(I18N.en).sort());
});

test('빈 번역 값이 없다', () => {
  for (const lang of ['ko', 'en']) {
    for (const [k, v] of Object.entries(I18N[lang])) {
      assert.ok(typeof v === 'string' && v.trim().length > 0, `${lang}.${k} 가 비어 있음`);
    }
  }
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
node --test tests/
```

Expected: FAIL — `Cannot find module '../assets/i18n.js'`

- [ ] **Step 3: assets/i18n.js 작성**

브라우저 전역 + CommonJS 양쪽에서 쓸 수 있는 평범한 스크립트. **키는 Task 3 의 index.html 과 1:1 — 추가/누락 금지.**

```js
// Supercycl 사용 가이드 — 한/영 번역 사전.
// 브라우저: 전역 I18N / Node 테스트: module.exports
const I18N = {
  ko: {
    'header.title': '사용 가이드',
    'intro.title': 'Supercycl이 처음이신가요?',
    'intro.body': 'Supercycl(슈퍼사이클)은 여러 거래소를 한 곳에서 편리하게 거래할 수 있는 서비스입니다. 이 가이드는 처음 시작하는 분도 따라 할 수 있도록 실제 화면과 함께 차근차근 안내해 드립니다.',
    'intro.hint': '아래 목차에서 궁금한 항목을 누르면 해당 설명으로 바로 이동합니다.',
    'toc.heading': '무엇이 궁금하세요?',
    'toc1.title': '시작하기', 'toc1.sub': '로그인부터 거래소 연결까지',
    'toc2.title': 'Markets', 'toc2.sub': '시세 확인하기',
    'toc3.title': 'Trade', 'toc3.sub': '주문하기',
    'toc4.title': 'Portfolio', 'toc4.sub': '내 자산 확인',
    'toc5.title': 'Profile', 'toc5.sub': '설정 관리',
    'toc6.title': '앱 설치하기', 'toc6.sub': '홈 화면에 추가',
    'ob.heading': '시작하기 — 처음 5단계',
    'ob.lead': 'Supercycl을 처음 사용할 때는 아래 5단계만 따라 하면 됩니다. 10분이면 충분해요.',
    's1.title': '로그인하기',
    's1.body': '앱을 열면 가장 먼저 로그인 화면이 나타납니다. 세 가지 방법 중 편한 것을 선택하세요.',
    's1.li1': '이메일 — 이메일 주소로 가입하고 로그인합니다.',
    's1.li2': 'Google — 구글 계정으로 한 번에 로그인합니다.',
    's1.li3': 'QR 코드 — 다른 기기에서 QR을 스캔해 로그인합니다.',
    's1.alt': 'Supercycl 로그인 화면',
    's2.title': '거래소 연결 안내 화면',
    's2.body': "로그인하면 '거래소를 연결하세요(Connect Your Exchange)' 화면이 나타납니다. Supercycl은 거래소 계정을 연결해야 거래할 수 있는 서비스이기 때문에, 이 단계가 가장 중요합니다. 'Connect Now' 버튼을 눌러주세요.",
    's2.warn': "'Skip for now(나중에 하기)'를 누르면 화면을 둘러볼 수는 있지만 거래는 할 수 없습니다. 꼭 거래소를 연결해 주세요.",
    's2.alt': '거래소 연결 안내 화면',
    's2.tap': '여기를 누르세요',
    's3.title': '거래소 선택하기',
    's3.body': '연결할 수 있는 거래소 목록이 나타납니다. 지금은 OKX 거래소만 연결할 수 있고, 나머지 거래소는 곧 지원될 예정(Coming Soon)입니다. 목록에서 OKX를 눌러주세요.',
    's3.alt': '거래소 목록 화면',
    's4.title': '연결 승인하기',
    's4.body': "Supercycl이 어떤 권한을 사용하는지 보여주는 화면입니다. 내용을 확인한 뒤 'Connect with OKX' 버튼을 누르면 OKX 로그인 페이지로 이동합니다. OKX 계정으로 로그인하고 승인하면 연결이 끝납니다.",
    's4.safe': '안심하세요 — Supercycl은 거래에 필요한 권한만 요청하며, 출금 권한은 요청하지 않습니다. 연결은 언제든지 해제할 수 있습니다.',
    's4.alt': '연결 승인 화면',
    's4.tap': '여기를 누르세요',
    's5.title': '연결 완료 — 이제 시작!',
    's5.body': '연결이 끝나면 완료 화면이 잠시 보였다가 거래(Trade) 화면으로 이동합니다. 이 화면이 Supercycl의 기본 화면입니다. 화면 아래쪽에는 Markets · Trade · Portfolio · Profile 네 개의 탭이 있습니다.',
    's5.tip': "이때 '홈 화면에 추가' 안내가 자동으로 나타날 수 있어요. 앱처럼 편하게 쓰려면 추가하는 것을 추천합니다. 자세한 방법은 아래 ⑥ 앱 설치하기를 참고하세요.",
    's5.alt1': '연결 완료 화면',
    's5.alt2': '거래 기본 화면',
    'mk.heading': 'Markets — 시세 확인하기',
    'mk.body': 'Markets 탭에서는 거래할 수 있는 모든 종목의 실시간 가격을 볼 수 있습니다.',
    'mk.li1': '위쪽 검색창에서 종목 이름(예: BTC)을 검색할 수 있습니다.',
    'mk.li2': '종목을 누르면 바로 거래 화면으로 이동합니다.',
    'mk.alt': 'Markets 시세 화면',
    'tr.heading': 'Trade — 주문하기',
    'tr.body': 'Trade 탭은 실제로 사고파는 화면입니다. 처음에는 꼭 필요한 것만 보이는 간단한 주문 화면이 표시됩니다.',
    'tr.li1': '금액(Amount)과 배율(Leverage)을 정한 뒤 매수(Long) 또는 매도(Short) 버튼을 누릅니다.',
    'tr.li2': '주문 전 확인 화면에서 내용을 다시 한 번 확인할 수 있습니다.',
    'tr.warn': '선물 거래는 원금 손실 위험이 있습니다. 처음에는 작은 금액으로 연습해 보세요.',
    'tr.alt': 'Trade 주문 화면',
    'pf.heading': 'Portfolio — 내 자산 확인',
    'pf.body': 'Portfolio 탭에서는 내 자산과 보유 중인 포지션을 한눈에 볼 수 있습니다.',
    'pf.li1': '전체 자산과 손익(수익·손실)을 확인할 수 있습니다.',
    'pf.li2': '보유 포지션을 누르면 상세 내용을 보거나 종료할 수 있습니다.',
    'pf.alt1': 'Portfolio 화면',
    'pf.alt2': 'Portfolio 상세 화면',
    'pr.heading': 'Profile — 설정 관리',
    'pr.body': 'Profile 탭에서는 계정과 앱 설정을 관리합니다.',
    'pr.li1': 'Connect Exchange — 거래소를 추가로 연결하거나 관리합니다.',
    'pr.li2': 'Notifications — 알림을 켜고 끕니다.',
    'pr.li3': "앱 설치 메뉴에서 '홈 화면에 추가' 안내를 다시 볼 수 있습니다.",
    'pr.alt': 'Profile 설정 화면',
    'pwa.heading': '앱 설치하기 — 홈 화면에 추가',
    'pwa.body': "Supercycl은 앱스토어에서 내려받는 앱이 아닙니다. 인터넷 브라우저에서 열고 '홈 화면에 추가'하면 일반 앱처럼 아이콘이 생기고 똑같이 사용할 수 있습니다. 사용하시는 기기에 맞는 방법을 따라 해 보세요.",
    'pwa.note': '앱스토어나 플레이스토어에서 검색해도 나오지 않아요. 아래 방법으로 설치해 주세요.',
    'pwa.safari.title': 'iPhone / iPad — Safari로 여는 경우',
    'pwa.safari.s1': '화면 아래쪽 가운데의 공유 버튼(네모에 화살표 ⬆)을 누르세요.',
    'pwa.safari.s2': "목록을 아래로 내려 '홈 화면에 추가'를 선택하세요.",
    'pwa.safari.s3': "오른쪽 위 '추가'를 누르면 끝! 홈 화면에 Supercycl 아이콘이 생깁니다.",
    'pwa.ioschrome.title': 'iPhone / iPad — Chrome으로 여는 경우',
    'pwa.ioschrome.s1': "화면 오른쪽 위의 ⋯ 메뉴를 누르고 '공유'를 선택하세요.",
    'pwa.ioschrome.s2': "'홈 화면에 추가'를 선택하세요.",
    'pwa.ioschrome.s3': "'추가'를 누르면 끝!",
    'pwa.ioschrome.note': 'Safari와는 첫 단계(공유 버튼의 위치)만 다르고 나머지는 같습니다.',
    'pwa.android.title': 'Android — Chrome으로 여는 경우',
    'pwa.android.s1': "화면에 자동으로 나타나는 설치 안내에서 'Install(설치)'을 누르세요.",
    'pwa.android.s2': "안내가 보이지 않으면 오른쪽 위 ⋮ 메뉴에서 '앱 설치'(또는 '홈 화면에 추가')를 선택하세요.",
    'pwa.android.note': 'Android는 버튼 한 번이면 설치됩니다.',
    'pwa.warn': 'iPhone에서 알림(푸시)을 받으려면 iOS 16.4 이상이어야 하고, 반드시 홈 화면에 추가한 아이콘으로 열어야 합니다.',
    'pwa.alt': '홈 화면에 추가 안내 화면',
    'faq.heading': '자주 묻는 질문',
    'faq1.q': '거래소 연결을 건너뛰었어요. 다시 연결하려면 어떻게 하나요?',
    'faq1.a': "화면 아래 Profile 탭 → 'Connect Exchange'를 누르면 언제든지 다시 연결할 수 있습니다. Trade 화면 위쪽의 연결 안내 배너를 눌러도 됩니다.",
    'faq2.q': '앱스토어에서 Supercycl이 검색되지 않아요.',
    'faq2.a': 'Supercycl은 브라우저에서 바로 쓰는 앱이라 앱스토어에 없습니다. 위의 ⑥ 앱 설치하기 방법으로 홈 화면에 추가해 주세요.',
    'faq3.q': '알림이 오지 않아요.',
    'faq3.a': 'Profile → Notifications에서 알림이 켜져 있는지 확인하세요. iPhone은 iOS 16.4 이상에서 홈 화면에 추가한 경우에만 알림을 받을 수 있습니다.',
    'footer.help': '도움이 필요하시면 Supercycl 고객센터로 문의해 주세요.',
  },
  en: {
    'header.title': 'User Guide',
    'intro.title': 'New to Supercycl?',
    'intro.body': 'Supercycl lets you trade on multiple exchanges from one convenient place. This guide walks you through everything step by step with real screenshots, so even first-time users can follow along.',
    'intro.hint': 'Tap a topic below to jump straight to it.',
    'toc.heading': 'What would you like to learn?',
    'toc1.title': 'Getting Started', 'toc1.sub': 'From login to exchange connection',
    'toc2.title': 'Markets', 'toc2.sub': 'Check live prices',
    'toc3.title': 'Trade', 'toc3.sub': 'Place orders',
    'toc4.title': 'Portfolio', 'toc4.sub': 'Track your assets',
    'toc5.title': 'Profile', 'toc5.sub': 'Manage settings',
    'toc6.title': 'Install the App', 'toc6.sub': 'Add to home screen',
    'ob.heading': 'Getting Started — Your First 5 Steps',
    'ob.lead': 'Just follow these five steps the first time you use Supercycl. It only takes about ten minutes.',
    's1.title': 'Log In',
    's1.body': 'When you open the app, the login screen appears first. Choose whichever method is most comfortable for you.',
    's1.li1': 'Email — sign up and log in with your email address.',
    's1.li2': 'Google — log in instantly with your Google account.',
    's1.li3': 'QR code — scan a QR code from another device.',
    's1.alt': 'Supercycl login screen',
    's2.title': 'The Connect Exchange Screen',
    's2.body': "After logging in you'll see the 'Connect Your Exchange' screen. Supercycl needs a linked exchange account before you can trade, so this is the most important step. Tap the 'Connect Now' button.",
    's2.warn': "If you tap 'Skip for now' you can browse the app, but you cannot trade. Be sure to connect an exchange.",
    's2.alt': 'Connect Your Exchange screen',
    's2.tap': 'Tap here',
    's3.title': 'Choose Your Exchange',
    's3.body': 'A list of available exchanges appears. Right now only OKX can be connected; the others are coming soon. Tap OKX in the list.',
    's3.alt': 'Exchange list screen',
    's4.title': 'Approve the Connection',
    's4.body': "This screen shows which permissions Supercycl will use. Review them, then tap 'Connect with OKX' to open the OKX login page. Log in with your OKX account and approve to finish.",
    's4.safe': 'Rest assured — Supercycl only requests the permissions needed for trading and never asks for withdrawal access. You can disconnect at any time.',
    's4.alt': 'Connection approval screen',
    's4.tap': 'Tap here',
    's5.title': "Connected — You're Ready!",
    's5.body': "Once connected, a success screen appears briefly and you land on the Trade screen — Supercycl's home base. Along the bottom you'll find four tabs: Markets, Trade, Portfolio and Profile.",
    's5.tip': "An 'Add to Home Screen' suggestion may pop up here. We recommend adding it so Supercycl works like a regular app. See ⑥ Install the App below for details.",
    's5.alt1': 'Connection success screen',
    's5.alt2': 'Trade home screen',
    'mk.heading': 'Markets — Check Prices',
    'mk.body': 'The Markets tab shows real-time prices for every tradable instrument.',
    'mk.li1': 'Use the search bar at the top to find an instrument (e.g. BTC).',
    'mk.li2': 'Tap an instrument to go straight to its trading screen.',
    'mk.alt': 'Markets price screen',
    'tr.heading': 'Trade — Place Orders',
    'tr.body': 'The Trade tab is where you actually buy and sell. At first you see a simple order screen with only the essentials.',
    'tr.li1': 'Set the Amount and Leverage, then tap the Long (buy) or Short (sell) button.',
    'tr.li2': 'A confirmation screen lets you double-check everything before the order goes through.',
    'tr.warn': 'Futures trading carries a risk of losing your principal. Start with small amounts while you learn.',
    'tr.alt': 'Trade order screen',
    'pf.heading': 'Portfolio — Track Your Assets',
    'pf.body': 'The Portfolio tab shows your assets and open positions at a glance.',
    'pf.li1': 'Check your total balance and profit & loss.',
    'pf.li2': 'Tap an open position to see details or close it.',
    'pf.alt1': 'Portfolio screen',
    'pf.alt2': 'Portfolio detail screen',
    'pr.heading': 'Profile — Manage Settings',
    'pr.body': 'The Profile tab is where you manage your account and app settings.',
    'pr.li1': 'Connect Exchange — connect additional exchanges or manage existing ones.',
    'pr.li2': 'Notifications — turn alerts on or off.',
    'pr.li3': "The install menu shows the 'Add to Home Screen' guide again whenever you need it.",
    'pr.alt': 'Profile settings screen',
    'pwa.heading': 'Install the App — Add to Home Screen',
    'pwa.body': "Supercycl is not downloaded from an app store. Open it in your web browser and 'Add to Home Screen' — an icon appears and it works just like a regular app. Follow the steps for your device.",
    'pwa.note': "You won't find Supercycl in the App Store or Play Store. Use the steps below instead.",
    'pwa.safari.title': 'iPhone / iPad — using Safari',
    'pwa.safari.s1': 'Tap the Share button (a square with an up arrow ⬆) at the bottom center of the screen.',
    'pwa.safari.s2': "Scroll down the list and choose 'Add to Home Screen'.",
    'pwa.safari.s3': "Tap 'Add' in the top right — done! A Supercycl icon appears on your home screen.",
    'pwa.ioschrome.title': 'iPhone / iPad — using Chrome',
    'pwa.ioschrome.s1': "Tap the ⋯ menu in the top right and choose 'Share'.",
    'pwa.ioschrome.s2': "Choose 'Add to Home Screen'.",
    'pwa.ioschrome.s3': "Tap 'Add' — done!",
    'pwa.ioschrome.note': 'Only the first step (where the Share button is) differs from Safari; the rest is the same.',
    'pwa.android.title': 'Android — using Chrome',
    'pwa.android.s1': "Tap 'Install' on the banner that appears automatically.",
    'pwa.android.s2': "If you don't see the banner, open the ⋮ menu in the top right and choose 'Install app' (or 'Add to Home screen').",
    'pwa.android.note': 'On Android, a single tap installs the app.',
    'pwa.warn': 'To receive notifications on iPhone you need iOS 16.4 or later, and you must open Supercycl from the home-screen icon.',
    'pwa.alt': 'Add to Home Screen prompt',
    'faq.heading': 'Frequently Asked Questions',
    'faq1.q': 'I skipped connecting an exchange. How do I connect later?',
    'faq1.a': "Tap the Profile tab at the bottom, then 'Connect Exchange' — you can connect any time. You can also tap the connection banner at the top of the Trade screen.",
    'faq2.q': "I can't find Supercycl in the app store.",
    'faq2.a': "Supercycl runs right in your browser, so it isn't in the app stores. Add it to your home screen using the steps in ⑥ Install the App above.",
    'faq3.q': "I'm not receiving notifications.",
    'faq3.a': 'Check Profile → Notifications and make sure alerts are enabled. On iPhone, notifications only work on iOS 16.4 or later when Supercycl is opened from the home-screen icon.',
    'footer.help': 'Need help? Contact Supercycl customer support.',
  },
};

if (typeof module !== 'undefined' && module.exports) module.exports = I18N;
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
node --test tests/
```

Expected: `tests 4` / `pass 4` / `fail 0`. 누락 키가 보고되면 사전 또는 HTML 키 오타를 맞춰 수정 후 재실행.

- [ ] **Step 5: 커밋**

```bash
git add tests/i18n.test.mjs assets/i18n.js
git commit -m "feat: 한/영 번역 사전 + 키 커버리지 테스트"
```

---

### Task 6: assets/guide.js — 언어 토글 + 현재 섹션 표시

**Files:**
- Create: `assets/guide.js`

- [ ] **Step 1: guide.js 작성**

```js
// Supercycl 사용 가이드 — 언어 토글 + 현재 섹션 표시. 외부 의존성 없음.
// 전역 I18N 은 assets/i18n.js 가 먼저 로드되어 제공한다.
(function () {
  var LANG_KEY = 'guide.lang';

  function applyLang(lang) {
    var dict = I18N[lang] || I18N.ko;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var t = dict[el.getAttribute('data-i18n')];
      if (t !== undefined) el.textContent = t;
    });
    document.querySelectorAll('[data-i18n-alt]').forEach(function (el) {
      var t = dict[el.getAttribute('data-i18n-alt')];
      if (t !== undefined) el.setAttribute('alt', t);
    });
    document.documentElement.lang = lang;
    document.title = lang === 'en' ? 'Supercycl User Guide' : 'Supercycl 사용 가이드';
    document.querySelectorAll('.lang-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-lang') === lang);
    });
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* 사생활 보호 모드 등 */ }
  }

  window.setLang = applyLang;

  // 스크롤 시 고정 헤더에 현재 섹션 제목 표시
  var label = document.getElementById('currentSection');
  var sections = document.querySelectorAll('main section[id]');
  if (label && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var h = e.target.querySelector('h2, h1');
          label.textContent = h ? h.textContent : '';
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(function (s) { observer.observe(s); });
  }

  var saved = 'ko';
  try { saved = localStorage.getItem(LANG_KEY) || 'ko'; } catch (e) { /* ignore */ }
  applyLang(saved);
})();
```

- [ ] **Step 2: 브라우저에서 동작 확인**

```bash
open index.html
```

확인 항목:
- 기본 언어 한국어, `English` 버튼 클릭 → 모든 텍스트가 영어로 즉시 전환, 버튼 하이라이트 이동
- 새로고침 → 영어 유지 (localStorage), `한국어` 클릭 → 복귀
- 목차 카드 클릭 → 해당 섹션으로 부드럽게 스크롤 (헤더에 가려지지 않음)
- 스크롤 시 헤더 가운데에 현재 섹션 제목 표시 (전환한 언어로 표시됨)

- [ ] **Step 3: 커밋**

```bash
git add assets/guide.js
git commit -m "feat: 언어 토글(localStorage 유지) + 현재 섹션 표시"
```

---

### Task 7: README + 최종 검증

**Files:**
- Create: `README.md`

- [ ] **Step 1: README.md 작성**

```markdown
# Supercycl-Guide

Supercycl-Mobile 앱의 사용자 가이드 페이지 (정적 HTML, 한/영 토글).

## 보기

`index.html` 을 브라우저로 열면 된다. 빌드 불필요.

## 구조

- `index.html` — 가이드 본문 (한국어 기본 + `data-i18n` 키)
- `assets/i18n.js` — ko/en 번역 사전
- `assets/guide.js` — 언어 토글 + 현재 섹션 표시
- `assets/guide.css` — Supercycl Dark Pro + Mono Green 토큰 차용
- `images/` — Supercycl-Mobile 디자인 모드 화면 캡처 (커밋됨)
- `tools/capture.mjs` — 캡처 스크립트
- `tests/i18n.test.mjs` — 번역 키 커버리지 테스트

## 화면 캡처 갱신

Supercycl-Mobile 목업이 바뀌면:

```bash
# 1. Mobile 서버 실행 (별도 터미널)
cd ../Supercycl-Mobile && npm run dev

# 2. 캡처 (이 레포에서)
node tools/capture.mjs
```

인증 만료 시 Mobile 레포에서 `npx playwright test` 를 1회 실행해
`tests/e2e/.auth/default.json` 을 재생성한 뒤 다시 캡처한다.

## 테스트

```bash
node --test tests/
```

번역 사전(`assets/i18n.js`)과 `index.html` 의 `data-i18n` 키가 어긋나면 실패한다.
새 문구를 추가할 때는 HTML 키 + ko/en 사전 양쪽을 함께 갱신할 것.

## 설계 문서

- 스펙: `docs/superpowers/specs/2026-06-12-supercycl-guide-design.md`
- 계획: `docs/superpowers/plans/2026-06-12-supercycl-guide.md`
```

- [ ] **Step 2: 스펙 검증 기준 전체 확인**

```bash
node --test tests/ && ls images/*.png | wc -l
```

Expected: 테스트 4개 통과 + `11`.

브라우저(`open index.html`)에서 스펙의 검증 기준 체크:
- [ ] 한/영 전환이 모든 텍스트에 적용 (영어 전환 후 개발자도구에서 `document.querySelectorAll('[data-i18n]')` 일부 요소의 textContent가 영어인지, img alt 전환 확인)
- [ ] 목차 클릭 → 섹션 스크롤 + 헤더 현재 섹션 표시
- [ ] 캡처 11장이 다크 디자인 모드로 선명하게 표시
- [ ] 창 폭을 375px까지 줄여 레이아웃 확인 (목차 1열, 헤더 줄바꿈 없음)
- [ ] 기본 한국어 + 새로고침 후 언어 유지
- [ ] 설치 섹션에 iOS Safari / iOS Chrome / Android Chrome 3종 카드 존재

- [ ] **Step 3: 커밋**

```bash
git add README.md
git commit -m "docs: README — 보기/캡처 갱신/테스트 안내"
```
