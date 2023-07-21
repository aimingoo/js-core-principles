// NOTE: 死锁（简单强占式；不可行的解法，仅示例用）
//  - 展示（基于持锁的）“并发访问逻辑”。
//  - 仍然是main/workers模型，需要有main单点来管理分组，亦即是管理工作线程。
//  - 共享数据的管理，例如管理锁本身。
//  - 使用到Atomics.wait()。

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
    workerData: {name, sab: data} // swap data beetwen main and this worker
  });

  // forward only (a channel for you, optional)
  worker.on('message', message => process.emit(message, worker));
});
