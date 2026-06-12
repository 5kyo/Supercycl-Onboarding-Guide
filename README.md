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
node --test tests/i18n.test.mjs
```

번역 사전(`assets/i18n.js`)과 `index.html` 의 `data-i18n` 키가 어긋나면 실패한다.
새 문구를 추가할 때는 HTML 키 + ko/en 사전 양쪽을 함께 갱신할 것.

## 설계 문서

- 스펙: `docs/superpowers/specs/2026-06-12-supercycl-guide-design.md`
- 계획: `docs/superpowers/plans/2026-06-12-supercycl-guide.md`
