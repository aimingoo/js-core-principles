// NOTE: 【协商机制】，要求请求者之间要有成组通讯的能力
//  - 去中心算法的哲学家就餐问题。
//  - no central, no locker

const { Worker } = require('worker_threads');
const networking = require('./lib/networking.js');

// main
const philosophers = ['Aristotle', 'Kant', 'Spinoza', 'Marx', 'Russell'];
const workers = new Map;
const MIN = 0, MAX = philosophers.length-1;
philosophers.forEach((name, seq) => {
  // alloc peers
  let left = seq == MIN ? MAX : seq-1;
  let right = seq == MAX ? MIN : seq+1;
  // launch worker
  let worker = new Worker('./worker.js', {
    workerData: {name, group: {left, seq, right}}
  });
  worker.on('message', ({message:topic, ...more}) => process.emit(topic, worker, seq, more));  
  workers.set(seq, worker);
});

// as proxy
networking.init('proxy', workers);
