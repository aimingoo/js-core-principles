const { parentPort, workerData: {name, sab} } = require('worker_threads');
const Locker = require('./Locker.js'); 

const EAT = 'eating...', THINK = 'thinking...', RATE = 0.01; // 0 .. n seconds
let actions = Object.defineProperty({EAT, THINK}, 'tick', {
  get() { return Math.round(Math.random() * RATE * 1000) }
});

const LEFT = 0, RIGHT = 1;
const locker = new Locker(sab);
class Philosopher {
  pick() { // all resources locked
    if (locker.lock(LEFT) && locker.lock(RIGHT)) {    // <- 这里存在问题，一是可能软死锁，二是顺序等待效率过低（注意使用Atomics.wait()的其它参数）
      // to pick resource, and use it
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
