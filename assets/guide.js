// Supercycl 사용 가이드 — 언어 토글 + 현재 섹션 표시. 외부 의존성 없음.
// I18N 은 assets/i18n.js (classic script) 가 먼저 로드되어 제공한다.
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
      var on = b.getAttribute('data-lang') === lang;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
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
