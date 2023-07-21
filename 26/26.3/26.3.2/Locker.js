const STATE_UNLOCKED = Number(false);
const STATE_LOCKED = Number(true);

class Locker {
  constructor(sab, timeout) {
    this.location = ArrayBuffer.isView(sab) ? x => [sab, x] : x => [sab[x], 0];
    this.timeout = timeout;
  }

  lock(index) {
    let [sab, i] = this.location(index);
    switch (Atomics.wait(sab, i, STATE_LOCKED, this.timeout)) {
      case 'not-equal':
      case 'ok':
        let old = Atomics.compareExchange(sab, i, STATE_UNLOCKED, STATE_LOCKED);
        return old == STATE_UNLOCKED;
    }
    // assert: is 'timed-out', or unknow/undocumented, etc.
    return false;
  }

  unlock(index) {
    let [sab, i] = this.location(index);
    // (OR, )Atomics.store(sab, i, STATE_UNLOCKED);
    if (Atomics.compareExchange(sab, i, STATE_LOCKED, STATE_UNLOCKED) !== STATE_LOCKED) {
      throw new Error ("Try unlock twice");
    }
    Atomics.notify(sab, i, 1); // wake one
  }
}

module.exports = Locker;