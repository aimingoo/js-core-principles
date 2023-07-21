// NOTE：死锁（限制就餐人数解法）
//  - （P208，脚注2） 如果持锁是抢占式的，那么可以适用另一种经典算法，称为“限制就餐人数”。


const { Worker } = require('worker_threads');

let philosophers = ['Aristotle', 'Kant', 'Spinoza', 'Marx', 'Russell'];

// main
var sab = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * (philosophers.length + 1)); // append a slot
var data0 = new Int32Array(sab, Int32Array.BYTES_PER_ELEMENT * philosophers.length, 1); // tail slot
data0[0] = philosophers.length - 1; // Limiting the number of diners in the table
let workers = philosophers.map((name, seq) => {
  // locker/resource dispatch
  let data;
  if (seq == philosophers.length-1) {
    data = [
      new Int32Array(sab, seq*Int32Array.BYTES_PER_ELEMENT, 1),
      new Int32Array(sab, 0, Int32Array.BYTES_PER_ELEMENT, 1)
    ];
  }
  else {
    data = new Int32Array(sab, seq*Int32Array.BYTES_PER_ELEMENT, 2);
  }

  // launch workers
  let worker = new Worker('./worker.js', {
    workerData: {name, sab: data, sab0: data0} // swap data beetwen main and this worker
  });

  // forward only (a channel for you, optional)
  worker.on('message', message => process.emit(message, worker));
});
