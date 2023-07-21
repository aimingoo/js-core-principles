// NOTE: 使用工作线程间通讯用的消息队列，就可以完成主线程对工作线程的控制。
//  - 通过工作线程调度来决定让哪一个工作线程（哲学家）持有资源。
//  - 使用工作线程间通讯用的消息队列。
//  - 使用main+workers模型。
const { Worker } = require('worker_threads');

let philosophers = ['Aristotle', 'Kant', 'Spinoza', 'Marx', 'Russell'];
const resources = Array(philosophers.length).fill(0);
const RIGHT_HANDLE = i => (i + 1) % resources.length;

process.on('REQUIRE', function(worker, i) {
  let ref = RIGHT_HANDLE(i);
  if ((resources[i] == 0) && (resources[ref] == 0)) {
    resources[i] == 1;
    resources[ref] == 2;
    worker.postMessage('accept');
    console.log(`[ENTER] ${philosophers[i]} to eat mode`);
  }
  else {
    worker.postMessage('reject');
  }
});

process.on('FINE', function(worker, i) {
  let ref = RIGHT_HANDLE(i);
  // assert(resources[ref] == 2, "Resource manger crash.");
  resources[i] = resources[ref] = 0;
  console.log(`[LEAVE] ${philosophers[i]} to think mode`);
});

// main
let workers = philosophers.map((name, seq) => {
  let worker = new Worker('./worker.js', {
    workerData: {name, seq} // swap data beetwen main and this worker
  });
  worker.on('message', message => process.emit(message, worker, seq));
});
