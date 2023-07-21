const EAT = 'eating...', THINK = 'thinking...', RATE = 0.01; // 0 .. n seconds
const actions = Object.defineProperty({EAT, THINK}, 'tick', {
  get() { return Math.round(Math.random() * RATE * 1000) }
});

class Philosopher {
  constructor(name) {
    this.name = name;
  }

  pick() { // all resources locked
    throw new Error('Abatract method call')
  }

  drop() {
    throw new Error('Abatract method call')
  }

  doThatAndThen(action, f) {
    console.log(` - ${this.name} ${action}`);
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

module.exports = Philosopher;