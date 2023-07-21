const net = require('./faked-network.js');

function init_proxy(workers) {
  const philosophers_length = workers.length;
  const MIN = 0, MAX = philosophers_length-1;
  const debuging = false, self = Array(philosophers_length).fill(1);

  const resources_checker = (...args) => {  // check all `accept` to veryfity system status
    let LEFT = 0, RIGHT = 1, [from, seq, R] = args;
    let left = seq == MIN ? MAX : seq-1;
    let right = seq == MAX ? MIN : seq+1;
    let target = R == LEFT ? left : right;
    if (from != target) throw new Error(`[${args}] `+'E0: sender is not require target peer.');
    if (self[from] <= 0) throw new Error(`[${args}] `+'E1: peer has not resource but accept.');
    self[from]--, self[seq]++;
    if (self[seq] == 2 && (self[left] > 1 || self[right] > 1)) throw Error(`[${args}|${self}] `+'E3: group eating.');
    if (self.reduce((p, x)=>p+x, 0) > self.length) throw new Error(`[${args}|${self}] `+'E4: resources count error.');
  }

  const channels = new Map;
  net.setProcessProxy({
    connect(worker, seq, {peer}) {  // <- topic: connect
      // skip: check daemon service at peerId
      let channel = `:${seq}->${peer}`;  // 1. got connect require from `seq`
      channels.set(channel, {ack: false, from: seq}); // 2. make channel, and waiting ACK
      workers.get(peer).postMessage({message:'connect', channel, peer: seq}); // 3. swap peer id and send to
    },

    data(worker, seq, {channel, data: msg}) { // <- topic: data
      if (msg.title == 'connected') {
        let peer = JSON.parse(msg.data), recvAt = `:${peer}->${seq}`;
        if (recvAt != channel) throw new Error('invalid connected recv.');
        msg.data = JSON.stringify(seq); // n-1. swap peer id again
        Object.assign(channels.get(channel), {ack: true, to: seq}); // n. ACK ready
      }

      let resolved = channels.get(channel);
      if (resolved && resolved.ack) {
        let {from, to} = resolved, peer = seq == from ? to : from;
        if (debuging && msg.title == 'accept') {
          resources_checker(seq, peer, parseInt(msg.data));
        }
        workers.get(peer).postMessage({message: 'data', channel, data: msg}); // to redirect `data`
      }
    }
  }); // main thread as a proxy
}

function init_server(philosopher) {
  let srv = net.createServer(); // for current philosopher
  const LEFT = 0, RIGHT = 1;

  // check the title and data, do something and call recv.send
  srv.on('data', (channel, {title, data}, recv) => {
    // for require of philosopher problem only
    //   - if require 0, check right, else
    //   - if require 1, check left.
    if (title == 'require') {
      let {status, resources, waitings} = philosopher;
      let target = data == LEFT ? RIGHT : LEFT;  // or check resource's uuid
      switch ((status == 'waiting') || resources[target]) {
        case true:
        case 'using':
          return waitings.push({target, recept:data, peer:recv});
        case 'used':
          delete resources[target];
          return recv.send('accept', data);
        default:  // undefined, or unknow
          throw new Error("Resource manger crash.");
      }
    }
  });

  // start the server
  philosopher.waitings = [];
  srv.listen();
}

//  - assert(channels.length === READYRESOURCESCOUNT)
function init_clients(peers, philosopher) {
  philosopher.channels = [peers.left, peers.right].map(peerId => {
    let channel = net.createClient();
    channel.on('data', (title, data, more) => {
      if (title == 'accept') {
        philosopher.resources[data] = 'using';
        philosopher.prepared && philosopher.eat(); // commit again
      }
    }).connect(peerId);
    return channel;
  });
}

module.exports.init = function(nodeType, ...args) {
  switch (nodeType) {
    case 'proxy':
      return init_proxy(...args); // workers
    case 'server':
      return init_server(...args); // philosopher
    case 'clients':
      return init_clients(...args); // group, philosopher
  }
};