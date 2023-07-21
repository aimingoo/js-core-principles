const { parentPort, workerData: {name, sab, sab0} } = require('worker_threads');
const Locker = require('../26.3.2/Locker.js');
const AbstractPhilosopher = require('../Philosopher.js');
const NumberLocker = require('./NumberLocker.js');

const LEFT = 0, RIGHT = 1, SIT = 0;
const locker = new Locker(sab, 1000);
const locker0 = new NumberLocker(sab0);
class Philosopher extends AbstractPhilosopher {
  pick() { // all resources locked
    while (!locker0.lock(SIT)); // 抢座

    let resources = [LEFT, RIGHT];
    while (resources.length > 0) { // 抢占模式
      resources = resources.filter(x => ! locker.lock(x));
    }
  }

  drop() { // release all
    try {
      locker.unlock(LEFT);
      locker.unlock(RIGHT);
    }
    catch {} // mute, or log
    finally {
      locker0.unlock(SIT); // 让座
    }
  }
}

// create instance (with options if you want)
const philosopher = new Philosopher(name);

// launch once
const eatOnce = Math.round(Math.random()*1000) > 500;
philosopher[eatOnce ? "eat" : "think"]();
// system log
console.log(`[START] ${name} ready.`);
