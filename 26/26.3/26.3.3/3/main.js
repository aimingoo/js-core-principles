// NOTE: 死锁（分级解法）
//  - 本例仅是对例2代码的简单优化（清理工作线程中的逻辑）

const { Worker } = require('worker_threads');

let philosophers = ['Aristotle', 'Kant', 'Spinoza', 'Marx', 'Russell'];

// main
var sab = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * philosophers.length); // value-0 filled
let workers = philosophers.map((name, seq) => {
  // locker/resource dispatch
  let data;
  if (seq == philosophers.length-1) {
    data = [  // simple reverse order for last item
      new Int32Array(sab, 0, Int32Array.BYTES_PER_ELEMENT, 1),  // right
      new Int32Array(sab, seq*Int32Array.BYTES_PER_ELEMENT, 1)  // left
    ];
  }
  else {
    data = new Int32Array(sab, seq*Int32Array.BYTES_PER_ELEMENT, 2);
  }

  // launch workers
  let worker = new Worker('./worker.js', {
    workerData: {name, sab: data} // swap data beetwen main and this worker
  });

  // forward only (a channel for you, optional)
  worker.on('message', message => process.emit(message, worker));
});
