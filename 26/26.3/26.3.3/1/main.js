// NOTE: 死锁（奇偶解法）
//  - （P209） 在使用“奇偶资源”算法来解决死锁问题时，……

const { Worker } = require('worker_threads');

let philosophers = ['Aristotle', 'Kant', 'Spinoza', 'Marx', 'Russell'];

// main
var sab = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * philosophers.length);
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
    workerData: {name, seq, sab: data} // swap data beetwen main and this worker
  });

  // forward only (a channel for you, optional)
  worker.on('message', message => process.emit(message, worker));
});

