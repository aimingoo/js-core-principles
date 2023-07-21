const { parentPort, workerData: {name, sab} } = require('worker_threads');
const Locker = require('../26.3.2/Locker.js');
const AbstractPhilosopher = require('./Philosopher.js');

const LEFT = 0, RIGHT = 1;
const locker = new Locker(sab);
class Philosopher extends AbstractPhilosopher {
  pick() { // all resources locked
    [LEFT, RIGHT].forEach(x => { while (!locker.lock(x)); }); // 有序加锁
  }

  drop() {
    try { // release all
      [RIGHT, LEFT].forEach(x => locker.unlock(x)); // 反转释放
    }
    catch {}; // mute, or log
  }
}

// create instance (with options if you want)
const philosopher = new Philosopher(name);

// launch once
const eatOnce = Math.round(Math.random()*1000) > 500;
philosopher[eatOnce ? "eat" : "think"]();
// system log
console.log(`[START] ${name} ready.`);
