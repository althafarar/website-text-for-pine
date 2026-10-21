'use strict';

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#primary-navigation');
function closeMenu() {
  if (!menuButton || !navigation) return;
  menuButton.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('is-open');
}
if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    navigation.classList.toggle('is-open', open);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      closeMenu(); menuButton.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) closeMenu();
  });
  navigation.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  window.matchMedia('(min-width: 761px)').addEventListener('change', closeMenu);
}
document.querySelectorAll('[data-top]').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    window.scrollTo({top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  });
});

// Kept pure for straightforward course-filter verification.
function matchesCourse(course, duration, subject, query) {
  const words = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return (duration === 'all' || String(course.duration) === duration)
    && (subject === 'all' || course.subject === subject)
    && words.every(word => course.search.toLocaleLowerCase().includes(word));
}
const search = document.querySelector('#course-search');
if (search) {
  const cards = Array.from(document.querySelectorAll('.course-card'));
  const subjectSelect = document.querySelector('#subject-filter');
  const durationButtons = Array.from(document.querySelectorAll('[data-duration-filter]'));
  const count = document.querySelector('#course-count');
  const empty = document.querySelector('#empty-state');
  const params = new URLSearchParams(window.location.search);
  let duration = ['3', '6', '12'].includes(params.get('duration')) ? params.get('duration') : 'all';
  if (['logistics', 'shipping', 'warehouse'].includes(params.get('subject'))) subjectSelect.value = params.get('subject');
  function updateCourses(updateUrl = true) {
    let visible = 0;
    for (const card of cards) {
      const match = matchesCourse(card.dataset, duration, subjectSelect.value, search.value);
      card.hidden = !match;
      if (match) visible++;
    }
    for (const button of durationButtons) button.setAttribute('aria-pressed', String(button.dataset.durationFilter === duration));
    count.textContent = visible === 8 ? 'Showing all 8 programmes' : `Showing ${visible} of 8 programmes`;
    empty.hidden = visible !== 0;
    if (updateUrl) {
      const url = new URL(window.location.href);
      url.search = '';
      if (duration !== 'all') url.searchParams.set('duration', duration);
      if (subjectSelect.value !== 'all') url.searchParams.set('subject', subjectSelect.value);
      // Local file previews cannot always use history.replaceState.
      try { window.history.replaceState({}, '', url); } catch (_) { /* filters still work */ }
    }
  }
  function resetCourses() {
    duration = 'all'; subjectSelect.value = 'all'; search.value = ''; updateCourses(); search.focus();
  }
  durationButtons.forEach(button => button.addEventListener('click', () => {
    duration = button.dataset.durationFilter; updateCourses();
  }));
  search.addEventListener('input', () => updateCourses());
  subjectSelect.addEventListener('change', () => updateCourses());
  document.querySelector('#reset-filters').addEventListener('click', resetCourses);
  document.querySelector('#empty-reset').addEventListener('click', resetCourses);
  // A direct deep link always reveals its requested course.
  const target = cards.find(card => '#' + card.id === window.location.hash);
  if (target) { duration = 'all'; subjectSelect.value = 'all'; }
  updateCourses(false);
}

const galleryDialog = document.querySelector('#gallery-dialog');
if (galleryDialog) {
  const gallery = Array.from(document.querySelectorAll('.gallery-item'));
  const image = document.querySelector('#gallery-full-image');
  const title = document.querySelector('#gallery-title');
  const category = document.querySelector('#gallery-category');
  const counter = document.querySelector('#gallery-counter');
  let active = 0;
  let opener;
  function showImage(index) {
    active = (index + gallery.length) % gallery.length;
    const item = gallery[active];
    const source = item.querySelector('img');
    image.src = source.getAttribute('src');
    image.alt = source.alt;
    image.width = source.width; image.height = source.height;
    title.textContent = item.querySelector('h2').textContent;
    category.textContent = item.querySelector('figcaption > span').textContent;
    counter.textContent = `${active + 1} / ${gallery.length}`;
  }
  document.querySelectorAll('.gallery-open').forEach(button => button.addEventListener('click', () => {
    opener = button; showImage(Number(button.dataset.galleryIndex));
    galleryDialog.showModal(); document.documentElement.style.overflow = 'hidden';
  }));
  galleryDialog.querySelector('.dialog-close').addEventListener('click', () => galleryDialog.close());
  document.querySelector('#gallery-prev').addEventListener('click', () => showImage(active - 1));
  document.querySelector('#gallery-next').addEventListener('click', () => showImage(active + 1));
  galleryDialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); showImage(active - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); showImage(active + 1); }
  });
  galleryDialog.addEventListener('click', event => {
    if (event.target !== galleryDialog) return;
    const rect = galleryDialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) galleryDialog.close();
  });
  galleryDialog.addEventListener('close', () => {
    document.documentElement.style.overflow = '';
    if (opener) opener.focus();
  });
}

function createEnquiryMessage(name, phone, course, question) {
  return `Hello Pine Arbor admissions,\n\nMy name is ${name}.\nPhone: ${phone}\nProgramme: ${course}\n\n${question || 'Please share the current course details, fees, intake dates, and entry requirements.'}`;
}
const enquiryForm = document.querySelector('#enquiry-form');
if (enquiryForm) {
  const course = document.querySelector('#enquiry-course');
  const phone = document.querySelector('#enquiry-phone');
  const name = document.querySelector('#enquiry-name');
  const question = document.querySelector('#enquiry-message');
  const status = document.querySelector('#form-status');
  const selected = new URLSearchParams(window.location.search).get('course');
  if (selected && Array.from(course.options).some(option => option.value === selected)) course.value = selected;
  phone.addEventListener('input', () => phone.setCustomValidity(''));
  name.addEventListener('input', () => name.setCustomValidity(''));
  enquiryForm.addEventListener('submit', event => {
    event.preventDefault();
    const digits = phone.value.replace(/\D/g, '');
    phone.setCustomValidity(digits.length >= 7 && digits.length <= 15 && /^[+\d\s().-]+$/.test(phone.value) ? '' : 'Enter a valid phone number with 7 to 15 digits.');
    name.setCustomValidity(name.value.trim() ? '' : 'Please enter your name.');
    if (!enquiryForm.reportValidity()) return;
    const message = createEnquiryMessage(name.value.trim(), phone.value.trim(), course.options[course.selectedIndex].text, question.value.trim());
    status.textContent = 'Opening WhatsApp. Review the message there, then send it to admissions.';
    window.location.assign('https://wa.me/919077002002?text=' + encodeURIComponent(message));
  });
}
