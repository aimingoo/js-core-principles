// NOTE: 死锁（分级解法）
//  - （P209） 另一种称为资源分级（resource hierarchy）的算法相对简单一点，……
//  - 分级解法，最后一名哲学家逆序拾取。
//  - Peers之间可能相互影响，但对全局是无害的。
//  - 使用特定的方式寻获资源，而不是向主线程请求。

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

