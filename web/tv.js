/* Navegação para Smart TV (Navegador) e controles remotos: ativada por botão Modo TV, ?tv=1 ou User-Agent de TV. */
(function () {
  'use strict';
  var params = new URLSearchParams(location.search);
  var forcedOff = params.get('tv') === '0';
  var active = false;

  function syncTvButtons() {
    var btns = document.querySelectorAll('[data-tv-toggle]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('active', active);
      btns[i].setAttribute('aria-pressed', active ? 'true' : 'false');
    }
  }

  function enableTvMode(persist) {
    if (active) return;
    active = true;
    document.documentElement.classList.add('tv-mode');
    if (persist !== false) {
      try { localStorage.setItem('deepflix-tv', '1'); } catch (_) {}
      try { sessionStorage.setItem('deepflix-tv', '1'); } catch (_) {}
    }
    try {
      if (window.tizen && tizen.tvinputdevice) {
        ['MediaPlay', 'MediaPause', 'MediaPlayPause', 'MediaFastForward', 'MediaRewind'].forEach(function (key) {
          try { tizen.tvinputdevice.registerKey(key); } catch (_) {}
        });
      }
    } catch (_) {}
    syncTvButtons();
    window.dispatchEvent(new CustomEvent('deepflix-tv-change', { detail: { active: true } }));
  }

  function disableTvMode() {
    active = false;
    document.documentElement.classList.remove('tv-mode');
    try { localStorage.removeItem('deepflix-tv'); } catch (_) {}
    try { sessionStorage.removeItem('deepflix-tv'); } catch (_) {}
    syncTvButtons();
    window.dispatchEvent(new CustomEvent('deepflix-tv-change', { detail: { active: false } }));
  }

  window.toggleDeepflixTvMode = function (forceState) {
    var next = typeof forceState === 'boolean' ? forceState : !active;
    if (next) enableTvMode(true);
    else disableTvMode();
    return active;
  };

  window.isDeepflixTvMode = function () {
    return active;
  };

  try {
    if (forcedOff) {
      disableTvMode();
    } else if (
      params.get('tv') === '1' ||
      localStorage.getItem('deepflix-tv') === '1' ||
      sessionStorage.getItem('deepflix-tv') === '1' ||
      /Tizen.*(?:TV|SmartTV)|SMART-TV|SamsungBrowser.*TV|Web0S|WebOS|NetCast|SmartTV|BRAVIA|AFT[A-Z0-9]+|Android.*TV|GoogleTV/i.test(navigator.userAgent)
    ) {
      enableTvMode(false);
    }
  } catch (_) {}

  function focusable() {
    var dialog = document.querySelector('dialog[open]');
    return Array.prototype.filter.call((dialog || document).querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), video[controls], [tabindex="0"]'), function (el) {
      var rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && getComputedStyle(el).visibility !== 'hidden' && !el.closest('[hidden]');
    });
  }

  function move(direction) {
    var items = focusable();
    if (!items.length) return;
    var current = document.activeElement;
    if (items.indexOf(current) < 0) { items[0].focus(); return; }
    var rect = current.getBoundingClientRect();
    var x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
    var best = null, bestScore = Infinity;
    items.forEach(function (el) {
      if (el === current) return;
      var r = el.getBoundingClientRect();
      var dx = r.left + r.width / 2 - x, dy = r.top + r.height / 2 - y;
      var primary = direction === 'left' ? -dx : direction === 'right' ? dx : direction === 'up' ? -dy : dy;
      var secondary = direction === 'left' || direction === 'right' ? Math.abs(dy) : Math.abs(dx);
      if (primary <= 1) return;
      var score = primary + secondary * 2.5;
      if (score < bestScore) { bestScore = score; best = el; }
    });
    if (best) { best.focus({ preventScroll: true }); best.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
  }

  document.addEventListener('keydown', function (event) {
    if (forcedOff) return;
    var code = event.keyCode || event.which;
    var key = event.key;
    var target = event.target;
    var tag = target && target.tagName ? target.tagName.toUpperCase() : '';

    if (code === 10009 || code === 461 || (code === 8 && !/^(INPUT|TEXTAREA)$/.test(tag)) || key === 'BrowserBack' || key === 'Back') {
      enableTvMode(true);
      event.preventDefault();
      var dialog = document.querySelector('dialog[open]');
      if (dialog) {
        dialog.querySelectorAll('video').forEach(function (v) { try { v.pause(); v.removeAttribute('src'); v.load(); } catch (_) {} });
        dialog.querySelectorAll('iframe').forEach(function (f) { try { f.src = 'about:blank'; } catch (_) {} });
        dialog.close();
      }
      else if (history.length > 1) history.back();
      else if (window.tizen && tizen.application) { try { tizen.application.getCurrentApplication().exit(); } catch (_) {} }
      else location.href = '/';
      return;
    }

    var video = document.querySelector('dialog[open] video, #watch-video');
    if (video && [415, 19, 10252, 417, 412].indexOf(code) !== -1) {
      enableTvMode(true);
      event.preventDefault();
      if (code === 415) video.play().catch(function () {});
      else if (code === 19) video.pause();
      else if (code === 10252) { if (video.paused) video.play().catch(function () {}); else video.pause(); }
      else if (Number.isFinite(video.duration)) video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + (code === 417 ? 10 : -10)));
      return;
    }

    if (tag === 'VIDEO' && (code === 13 || key === 'Enter')) {
      event.preventDefault();
      if (target.paused) target.play().catch(function () {});
      else target.pause();
      return;
    }

    /* No Desktop normal (sem Modo TV ativo), não rouba as setas do teclado */
    if (!active) return;

    var direction = ({ 37: 'left', 38: 'up', 39: 'right', 40: 'down' })[code];
    if (!direction) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag)) return;
    if (tag === 'VIDEO' && (direction === 'left' || direction === 'right')) return;
    event.preventDefault();
    move(direction);
  });

  document.addEventListener('focusin', function (event) {
    if (!active) return;
    if (event.target && event.target.scrollIntoView) event.target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });

  window.addEventListener('DOMContentLoaded', syncTvButtons);
  window.addEventListener('load', function () {
    syncTvButtons();
    if (!active) return;
    var items = focusable();
    if (items.length) items[0].focus();
  });
}());
