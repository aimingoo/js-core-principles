const STATE_LOCKED = 0;

class NumberLocker {
  constructor(sab, timeout) {
    this.location = ArrayBuffer.isView(sab) ? x => [sab, x] : x => [sab[x], 0];
    this.timeout = timeout;
  }

  lock(index) {
    let [sab, i] = this.location(index);
    switch (Atomics.wait(sab, i, STATE_LOCKED, this.timeout)) {
      case 'not-equal':
      case 'ok':
        let old = Atomics.load(sab, i);
        return (old > STATE_LOCKED) && (Atomics.compareExchange(sab, i, old, old-1) == old);
    }
    // assert: is 'timed-out', or unknow/undocumented, etc.
    return false;
  }

  unlock(index) {
    let [sab, i] = this.location(index);
    if (Atomics.add(sab, i, 1) < 0) {
      throw new Error ("The locker crash.");
    }
    Atomics.notify(sab, i, 1); // wake one
  }
}

module.exports = NumberLocker;