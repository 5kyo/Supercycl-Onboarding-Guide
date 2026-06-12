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
