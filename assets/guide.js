// Supercycl 사용 가이드 — 언어 토글 + 현재 섹션 표시. 외부 의존성 없음.
// I18N 은 assets/i18n.js (classic script) 가 먼저 로드되어 제공한다.
(function () {
  if (typeof I18N === 'undefined') return; // i18n.js 미로드 시 무해하게 종료 (본문은 한국어 인라인 텍스트로 동작)

  var LANG_KEY = 'guide.lang';
  var label = document.getElementById('currentSection');
  var currentSectionEl = null;

  // 섹션 제목 텍스트 — 장식 번호(.sec-num)를 제외한 본문만
  function headingText(section) {
    var h = section.querySelector('h2, h1');
    if (!h) return '';
    var inner = h.querySelector('[data-i18n]');
    return (inner || h).textContent;
  }

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
      var on = b.getAttribute('data-lang') === lang;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    if (label && currentSectionEl) label.textContent = headingText(currentSectionEl); // 라벨도 새 언어로
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* 사생활 보호 모드 등 */ }
  }

  window.setLang = applyLang;

  // 스크롤 시 고정 헤더에 현재 섹션 제목 표시
  var sections = document.querySelectorAll('main section[id]');
  if (label && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          currentSectionEl = e.target;
          label.textContent = headingText(e.target);
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(function (s) { observer.observe(s); });
  }

  var saved = 'ko';
  try { saved = localStorage.getItem(LANG_KEY) || 'ko'; } catch (e) { /* ignore */ }
  applyLang(saved);
})();
