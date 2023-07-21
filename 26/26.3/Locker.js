const STATE_UNLOCKED = Number(false);
const STATE_LOCKED = Number(true);

class Locker {
  constructor(sab) {
    this.location = ArrayBuffer.isView(sab) ? x => [sab, x] : x => [sab[x], 0];
  }

  lock(index) {
    let [sab, i] = this.location(index);
    // if is 'not-equal', will non-lock and return immediately
    while (Atomics.wait(sab, i, STATE_LOCKED)) {
      let old = Atomics.compareExchange(sab, i, STATE_UNLOCKED, STATE_LOCKED);
      if (old == STATE_UNLOCKED) return true; // locking: unlocked -> locked
    }
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