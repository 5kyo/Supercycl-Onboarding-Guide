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
  'scr-401', // Markets
  'scr-301', // Signal Intro (시그널 안내)
  'scr-303', // Signals (시그널 목록)
  'scr-402', // Portfolio
  'scr-410', // PnL Analysis (Portfolio 손익 분석)
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
await page.waitForTimeout(2200); // 디자인 모드 진입 애니메이션 (scr-001 로고 reveal 1800ms) 완료 대기

// 5. 화면별 캡처
const frame = page.locator('#app');
for (const id of SCREENS) {
  await page.evaluate((sid) => navigateTo(sid), id);
  await page.waitForTimeout(2200); // 화면 전환 + 진입 애니메이션(최장 1800ms) 완료 대기
  const out = path.join(OUT_DIR, `${id}.png`);
  await frame.screenshot({ path: out });
  console.log(`[capture] images/${id}.png`);
}

await browser.close();
console.log(`[capture] 완료 — ${SCREENS.length}장`);
