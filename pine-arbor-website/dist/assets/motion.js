'use strict';

// State and timing are independent of the DOM so pause/resume and wrapping
// can be checked without a browser or a real-time delay.
function createSlideshowController({count, onChange, onState = () => {}, interval = 3000, pauseOnManual = false, reducedMotion = false, timers = globalThis}) {
  let index = 0;
  let paused = reducedMotion;
  let reduced = reducedMotion;
  let busy = false;
  let timer = null;
  const blockers = new Set();
  function state() { return {index, paused, reduced, busy, blocked: blockers.size > 0}; }
  function clear() { if (timer !== null) timers.clearTimeout(timer); timer = null; }
  function schedule() {
    clear();
    if (!paused && !reduced && !blockers.size && count > 1) {
      timer = timers.setTimeout(() => { timer = null; if (!move(1, false)) schedule(); }, interval);
    }
    onState(state());
  }
  function move(direction, manual = true) {
    if (busy || count < 2) return false;
    clear();
    if (manual && pauseOnManual) paused = true;
    index = (index + direction + count) % count;
    onChange(index, direction, manual);
    schedule();
    return true;
  }
  const api = {
    getState: state,
    start: schedule,
    next: (manual = true) => move(1, manual),
    previous: () => move(-1),
    select(next) {
      if (busy || !Number.isInteger(next) || next < 0 || next >= count) return false;
      if (next === index) { if (pauseOnManual) paused = true; schedule(); return true; }
      return move(next - index);
    },
    toggle() { paused = !paused; schedule(); },
    block(reason, value) { value ? blockers.add(reason) : blockers.delete(reason); schedule(); },
    // Finishing the slide transition must not restart the 3-second clock.
    setBusy(value) { busy = value; onState(state()); },
    setReduced(value) { reduced = value; if (value) paused = true; schedule(); },
    destroy: clear
  };
  return api;
}

(function initialiseMotion() {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('#hero-carousel');
  let carousel;
  if (hero) {
    const track = hero.querySelector('.hero-track');
    const slides = Array.from(track.children);
    // End clones let the last-to-first transition keep sliding left naturally.
    const firstClone = slides[0].cloneNode(true);
    const lastClone = slides[slides.length - 1].cloneNode(true);
    [firstClone, lastClone].forEach(clone => {
      clone.setAttribute('aria-hidden', 'true');
      clone.removeAttribute('role');
      clone.removeAttribute('aria-roledescription');
      clone.removeAttribute('aria-label');
      clone.querySelector('img').alt = '';
    });
    track.prepend(lastClone); track.append(firstClone);
    // Fetch the small optimized banner set early to avoid blank transitions
    // on a slower connection; only the original has high fetch priority.
    Array.from(track.querySelectorAll('img')).forEach(image => {
      image.loading = 'eager';
      if (image.getAttribute('fetchpriority') !== 'high') image.fetchPriority = 'low';
    });
    let position = 1;
    let settleTimer = null;
    track.style.transform = 'translate3d(-100%,0,0)';
    function settle() {
      window.clearTimeout(settleTimer);
      track.classList.remove('is-sliding');
      position = carousel.getState().index + 1;
      track.style.transform = `translate3d(-${position * 100}%,0,0)`;
      carousel.setBusy(false);
    }
    carousel = createSlideshowController({
      count: slides.length,
      reducedMotion: preference.matches,
      onChange(index, direction) {
        const animate = !preference.matches;
        // Read the previous visual position before updating it.
        const previous = position - 1;
        position = index + 1;
        if (direction === 1 && previous === slides.length - 1 && index === 0) position = slides.length + 1;
        if (direction === -1 && previous === 0 && index === slides.length - 1) position = 0;
        if (!animate) position = index + 1;
        carousel.setBusy(animate);
        // Ensure a preceding clone reset has been painted before the next move.
        if (animate) void track.offsetWidth;
        track.classList.toggle('is-sliding', animate);
        track.style.transform = `translate3d(-${position * 100}%,0,0)`;
        slides.forEach((slide, i) => slide.setAttribute('aria-hidden', String(i !== index)));
        if (animate) settleTimer = window.setTimeout(settle, 1100);
      }
    });
    track.addEventListener('transitionend', event => {
      if (event.target === track && event.propertyName === 'transform') settle();
    });
    hero.addEventListener('focusin', () => carousel.block('focus', true));
    hero.addEventListener('focusout', event => {
      if (!hero.contains(event.relatedTarget)) carousel.block('focus', false);
    });
    hero.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); carousel.previous(); }
      if (event.key === 'ArrowRight') { event.preventDefault(); carousel.next(); }
    });
    let touchStart = null;
    hero.addEventListener('touchstart', event => {
      if (event.target.closest('a,button') || event.touches.length !== 1) return;
      touchStart = {x: event.touches[0].clientX, y: event.touches[0].clientY};
      carousel.block('touch', true);
    }, {passive: true});
    hero.addEventListener('touchend', event => {
      if (!touchStart) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - touchStart.x;
      const dy = touch.clientY - touchStart.y;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        dx < 0 ? carousel.next() : carousel.previous();
      }
      touchStart = null; carousel.block('touch', false);
    }, {passive: true});
    hero.addEventListener('touchcancel', () => { touchStart = null; carousel.block('touch', false); }, {passive: true});
    document.addEventListener('visibilitychange', () => carousel.block('hidden', document.hidden));
    window.addEventListener('pagehide', () => carousel.block('page', true));
    window.addEventListener('pageshow', () => carousel.block('page', false));
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => carousel.block('offscreen', !entries[0].isIntersecting), {threshold: .08});
      observer.observe(hero);
    }
    carousel.block('hidden', document.hidden);
    carousel.start();
  }

  // Reveal each element once; exclude course cards so filtering never leaves
  // search results invisible while an observer catches up.
  let revealObserver;
  const selector = 'main .section-head, main .intro-grid > div, main .subject-card, main .learning-grid > div, main .journey-grid > li, main .faq-layout > div, main .story-grid > div, main .purpose-grid > article, main .values-grid > article, main .audience-layout > div, main .gallery-item, main .contact-grid > div, main .visit-layout > div, .cta-inner > div, .footer-main > div';
  const elements = Array.from(document.querySelectorAll(selector));
  function revealAll() {
    if (revealObserver) revealObserver.disconnect();
    document.documentElement.classList.remove('motion-ready');
    elements.forEach(element => element.classList.add('is-visible'));
  }
  if (!preference.matches && 'IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {threshold: .06, rootMargin: '0px 0px -20px 0px'});
    elements.forEach(element => {
      element.classList.add('reveal');
      const siblings = Array.from(element.parentElement.children);
      element.style.setProperty('--reveal-delay', `${Math.min(siblings.indexOf(element), 3) * 70}ms`);
      revealObserver.observe(element);
    });
    document.documentElement.classList.add('motion-ready');
    // Keep anchor destinations immediately readable, including course enquiries.
    const hash = window.location.hash.slice(1);
    const target = hash && document.getElementById(hash);
    if (target) elements.forEach(element => {
      if (element === target || element.contains(target) || target.contains(element)) element.classList.add('is-visible');
    });
  }
  preference.addEventListener('change', event => {
    if (carousel) carousel.setReduced(event.matches);
    if (event.matches) revealAll();
  });
})();
