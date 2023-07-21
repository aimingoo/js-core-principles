const { workerData: {name, group} } = require('worker_threads');
const networking = require('./lib/networking.js');

const LEFT = 0, RIGHT = 1;
const EAT = 'eating...', THINK = 'thinking...', RATE = 0.1; // 0 .. n seconds
const READYRESOURCESCOUNT = [LEFT, RIGHT].length; // all handles
const actions = Object.defineProperty({EAT, THINK}, 'tick', {
  get() { return Math.round(Math.random() * RATE * 1000) }
});

class Philosopher {
  constructor(name) {
    this.name = name;
    this.status = 'none';  // Or, set to 'think'
    this.resources = [];
  }

  get prepared() {
    return Object.keys(this.resources).length == READYRESOURCESCOUNT; // ready
  }

  doThatAndThen(action, f) {
    console.log(` - ${this.name} ${action}`);
    setTimeout(f, actions.tick);
  }

  eat() {
    switch (this.status) {
      case 'eat': return; // dont retry
      case 'waiting': break;
      default: // 'think', or 'none'
        this.status = 'waiting';
    }

    // prepare eat
    if (! this.prepared) {
      return this.pick();
    }

    // eating
    this.resources.fill('using');
    this.status = 'eat';
    this.doThatAndThen(actions.EAT, () => {
      this.think(); // immediately. or not
    });
  }

  think() {
    this.status = 'think';
    this.drop();
    this.doThatAndThen(actions.THINK, () => {
      this.eat(); // immediately. or not
    });
  }

  pick() { // to require all unhandled resources
    let prepareList = [LEFT, RIGHT];
    let unhandled = x => !(x in this.resources);
    prepareList.filter(unhandled).forEach(x => {
      this.channels[x].send('require', x);
    });
  }

  drop() { // to release all handled resources and wake waitings
    this.resources.fill('used');
    let all = this.waitings.splice(0);
    all.forEach(w => {
      delete this.resources[w.target]; // release
      w.peer.send('accept', w.recept); // recept accept
    });
  }
}

// create instance (with options if you want)
//  - and resources initialization
const philosopher = new Philosopher(name);
philosopher.resources[LEFT] = 'used';

function launch_once() {
  const eatOnce = Math.round(Math.random()*1000) > 500;
  philosopher[eatOnce ? "eat" : "think"]();
}

// defer call after all modules loadded
//  - as clients, defered
let init_channels = () => networking.init('clients', group, philosopher);
Promise.resolve('init current node')
  .then(init_channels)
  .then(launch_once);

// as a server
networking.init('server', philosopher);

// system log
console.log(`[START] ${name} ready.`);
