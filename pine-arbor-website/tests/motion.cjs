const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../dist/assets/motion.js'), 'utf8');
const noMotionPreference = {matches: false, addEventListener() {}};
const sandbox = {
  window: {matchMedia: () => noMotionPreference},
  document: {querySelector: () => null, querySelectorAll: () => []}
};
vm.createContext(sandbox);
vm.runInContext(source, sandbox);

function clock() {
  let next = 0;
  let now = 0;
  const jobs = new Map();
  return {
    setTimeout(fn, delay) {const id = ++next; jobs.set(id, {fn, at: now + delay}); return id;},
    clearTimeout(id) {jobs.delete(id);},
    pending() {return jobs.size;},
    now() {return now;},
    tick() {const job = [...jobs].sort((a,b) => a[1].at - b[1].at)[0]; assert(job, 'expected a scheduled slide'); jobs.delete(job[0]); now = job[1].at; job[1].fn();},
    advance(ms) {const until = now + ms; while (jobs.size) {const job = [...jobs].sort((a,b) => a[1].at - b[1].at)[0]; if (job[1].at > until) break; jobs.delete(job[0]); now = job[1].at; job[1].fn();} now = until;}
  };
}
const timers = clock();
const changed = [];
const controller = sandbox.createSlideshowController({count: 5, timers, pauseOnManual: true, onChange: (index, direction, manual) => changed.push({index, direction, manual})});
controller.start();
assert.equal(timers.pending(), 1, 'autoplay starts once');
for (let i = 0; i < 5; i++) timers.tick();
assert.deepEqual(changed.map(x => x.index), [1, 2, 3, 4, 0], 'automatic playback wraps through all five images');
assert(changed.every(x => x.manual === false));
assert.equal(timers.pending(), 1, 'automatic playback keeps one timer');
controller.previous();
assert.equal(controller.getState().index, 4, 'previous wraps from first to last');
assert.equal(controller.getState().paused, true, 'manual navigation pauses autoplay');
assert.equal(timers.pending(), 0);
controller.toggle();
assert.equal(timers.pending(), 1, 'play restarts autoplay');
controller.block('hover', true); controller.block('focus', true);
assert.equal(timers.pending(), 0, 'interaction blocks playback');
controller.block('hover', false);
assert.equal(timers.pending(), 0, 'other active blockers remain effective');
controller.block('focus', false);
assert.equal(timers.pending(), 1, 'leaving all blockers resumes playback');
controller.block('hidden', true); controller.block('offscreen', true);
controller.block('hidden', false);
assert.equal(timers.pending(), 0);
controller.block('offscreen', false);
assert.equal(timers.pending(), 1);
controller.setBusy(true);
assert.equal(controller.next(), false, 'rapid navigation cannot corrupt an in-progress transition');
assert.equal(timers.pending(), 1, 'transition lock preserves the existing autoplay timer');
controller.setBusy(false);
assert.equal(timers.pending(), 1);
controller.select(2);
assert.equal(controller.getState().index, 2, 'indicator navigation chooses the requested image');
assert.equal(timers.pending(), 0);
assert.equal(controller.select(-1), false);
assert.equal(controller.select(5), false);
assert.equal(controller.select(1.2), false);
controller.toggle(); controller.setReduced(true);
assert.equal(timers.pending(), 0, 'reduced motion cancels the timer');
assert.equal(controller.getState().paused, true);
controller.next();
assert.equal(controller.getState().index, 3, 'manual changes remain available with reduced motion');
assert.equal(timers.pending(), 0);
controller.setReduced(false);
assert.equal(timers.pending(), 0, 'preference change does not silently restart motion');
controller.toggle(); assert.equal(timers.pending(), 1);
controller.destroy(); assert.equal(timers.pending(), 0, 'cleanup cancels the active timer');

const staticTimers = clock();
const staticController = sandbox.createSlideshowController({count: 5, timers: staticTimers, reducedMotion: true, onChange() {}});
staticController.start();
assert.equal(staticTimers.pending(), 0, 'reduced-motion visitors never start autoplay');
staticController.next(); assert.equal(staticController.getState().index, 1);
staticController.destroy();

const exactClock = clock();
const starts = [];
let exact;
exact = sandbox.createSlideshowController({count: 5, timers: exactClock, onChange(index) {
  starts.push({index, at: exactClock.now()});
  exact.setBusy(true);
  exactClock.setTimeout(() => exact.setBusy(false), 900);
}});
exact.start(); exactClock.advance(15000);
assert.deepEqual(starts.map(x => x.at), [3000,6000,9000,12000,15000], 'slides start every 3 seconds, including transition time');
assert.deepEqual(starts.map(x => x.index), [1,2,3,4,0], 'five images wrap continuously');
exactClock.advance(900); exact.next();
assert.equal(exact.getState().paused, false, 'swiping does not permanently pause the control-free banner');
exactClock.advance(3000);
assert.equal(starts.at(-1).at, 18900, 'automatic cycling continues after a manual swipe');
exact.destroy();
console.log('Slideshow checks passed: exact 3-second cadence, five-image loop, continued playback after swiping, concurrent blockers, rapid input, reduced motion, and cleanup.');
