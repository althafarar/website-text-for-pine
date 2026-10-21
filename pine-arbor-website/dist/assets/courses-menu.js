'use strict';

(function initialiseCoursesMenu() {
  const wrapper = document.querySelector('.nav-courses');
  if (!wrapper) return;
  const button = wrapper.querySelector('.courses-toggle');
  const panel = wrapper.querySelector('.courses-dropdown');
  const topLink = wrapper.querySelector('.course-nav-link');
  const navigation = document.querySelector('#primary-navigation');
  const mobileToggle = document.querySelector('.menu-toggle');
  const desktopHover = window.matchMedia('(min-width: 761px) and (hover: hover)');
  function open(value) {
    button.setAttribute('aria-expanded', String(value));
    button.setAttribute('aria-label', value ? 'Hide course subjects' : 'Show course subjects');
    wrapper.dataset.open = String(value);
    panel.hidden = !value;
  }
  button.addEventListener('click', () => open(panel.hidden));
  wrapper.addEventListener('pointerenter', event => {
    if (desktopHover.matches && event.pointerType !== 'touch') open(true);
  });
  wrapper.addEventListener('pointerleave', () => {
    if (desktopHover.matches && !wrapper.contains(document.activeElement)) open(false);
  });
  wrapper.addEventListener('focusout', event => {
    if (!wrapper.contains(event.relatedTarget)) open(false);
  });
  [button, topLink].forEach(element => element.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown') {
      event.preventDefault(); open(true); panel.querySelector('a').focus();
    }
  }));
  // Close this submenu first; a second Escape can close the mobile main menu.
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) {
      event.preventDefault(); event.stopImmediatePropagation(); open(false); button.focus();
    }
  }, true);
  document.addEventListener('click', event => {
    if (!wrapper.contains(event.target)) open(false);
  });
  panel.addEventListener('click', event => {
    if (event.target.closest('a')) open(false);
  });
  mobileToggle.addEventListener('click', () => {
    if (mobileToggle.getAttribute('aria-expanded') !== 'true') open(false);
  });
  navigation.addEventListener('click', event => {
    if (event.target.closest('a')) open(false);
  });
  desktopHover.addEventListener('change', () => open(false));
})();
