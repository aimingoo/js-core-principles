const { parentPort, workerData: {name, sab} } = require('worker_threads');
const Locker = require('../26.3.2/Locker.js');

const EAT = 'eating...', THINK = 'thinking...', RATE = 0.001; // 0 .. n seconds
let actions = Object.defineProperty({EAT, THINK}, 'tick', {
  get() { return Math.round(Math.random() * RATE * 1000) }
});

const locker = new Locker(sab);

let isLastPhilosopher = !ArrayBuffer.isView(sab);
const LEFT = 0, RIGHT = 1;
let ORDERED = isLastPhilosopher ? [RIGHT, LEFT] : [LEFT, RIGHT];
let ORDERED_R = [...ORDERED].reverse();
class Philosopher {
  pick() { // all resources locked
    ORDERED.forEach(x => { while (!locker.lock(x)); });
  }

  drop() { // release all
    try {
      ORDERED_R.forEach(x => locker.unlock(x));
    }
    catch {}; // mute, or log
  }

  doThatAndThen(action, f) {
    console.log(` - ${name} ${action}`);
    setTimeout(f, actions.tick);
  }

  eat() {
    this.pick();
    this.doThatAndThen(actions.EAT, ()=> {
      this.drop();
      this.think();
    });
  }

  think() {
    this.doThatAndThen(actions.THINK, () => {
      this.eat();
    });
  }
}

// create instance (with options if you want)
const philosopher = new Philosopher(name);

// launch once
const eatOnce = Math.round(Math.random()*1000) > 500;
philosopher[eatOnce ? "eat" : "think"]();
// system log
console.log(`[START] ${name} ready.`);
