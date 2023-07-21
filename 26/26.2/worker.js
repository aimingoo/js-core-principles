const { parentPort, workerData: {name, seq} } = require('worker_threads');

const RATE = 3; // 0 .. n seconds
let actions = Object.defineProperty(new Object, 'tick', {
  get() { return Math.round(Math.random() * RATE * 1000) }
});

class Philosopher {
  pick() {
    // pick left and pick right, success always.
  }

  drop() {
    // drop left and pick right, success always.
  }

  doThatAndThen(action, f) {
    console.log(` - ${name} ${action}`);
    setTimeout(f, actions.tick);
  }

  eat() {
    this.pick();
    this.doThatAndThen('eating...', ()=> { // a finally call, and send NOTIFY_FINE
      this.drop();
      parentPort.postMessage('FINE');
      this.think();
    });
  }

  think() { // safe always
    this.doThatAndThen('thinking...', () => { // NOTIFY_REQUIRE
      parentPort.postMessage('REQUIRE');
    });
  }
}

// create instance (with options if you want)
const philosopher = new Philosopher(name);

parentPort.on('message', message => {
  switch (message) {
    case 'accept':
      philosopher.eat(); break;
    case 'reject':
      philosopher.think(); break;
    default:
      console.log('WAF?!');
  }
});

// launch once
const eatOnce = Math.round(Math.random()*1000) > 500;
if (eatOnce) { // try 1st require
  parentPort.postMessage('REQUIRE');
}
else {
  philosopher.think();
}
// system log
console.log(`[START] ${name} ready at ${seq}.`);
