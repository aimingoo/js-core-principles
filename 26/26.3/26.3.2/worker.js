const { parentPort, workerData: {name, sab} } = require('worker_threads');
const Locker = require('./Locker.js'); 

const EAT = 'eating...', THINK = 'thinking...', RATE = 0.001; // 0 .. n seconds
let actions = Object.defineProperty({EAT, THINK}, 'tick', {
  get() { return Math.round(Math.random() * RATE * 1000) }
});

const LEFT = 0, RIGHT = 1;
const locker = new Locker(sab, 1000);
class Philosopher {
  pick() { // all resources locked
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
