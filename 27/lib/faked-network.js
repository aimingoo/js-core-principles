const { isMainThread, parentPort } = require('worker_threads');
const EventEmitter = require('events');

/*
  proxy event:
    - message     -> peer's data
  socket events:
    - connect     -> from peer's connect require at server node
    - connected   -> revice for peer-server at client node
    - data        -> swap peer's data
*/

// force object mode, and proxy to parentPort
const defaultOptions = { proxy: parentPort, objectMode: true, sessionSupported: false };
function setProcessProxy(handles) {
  /* by default */
  Object.entries(handles).forEach(handle => process.on(...handle)); // proxy handles
}

// for every worker, message from main
//   - parentPort.emit() support 1 argument only!!!
if (! isMainThread) {
  parentPort.on('message', function({message:topic, channel, ...more}) { // message to event
    switch (topic) {
      case 'connect':  // message from parent, and source from `more.peer`, pre-step at net.setProcessProxy() in init_proxy()
        return this.emit('connect', {channel, ...more});  // 4. event 'message' to 'connect' event transfer, need subscribe by server
      case 'data':
        if (more.data.title == "connected") {
          let peer = JSON.parse(more.data.data);
          return this.emit(`${peer} connected`, {channel, peer});
        }
        // port `data` to channel's data
        return this.emit(channel, more.data);  // {title, data}
      default:
        console.log("WTF?!");
    };
  });
}

// a faked socket level
class FakeSocket extends EventEmitter {
  #msg_waiting_list = new Array;

  // peer's data -> proxy's message
  send(title, msg, ...args) {
    let proxy = defaultOptions.proxy;
    let data = JSON.stringify(msg); // when options.objectMode is true

    // WARNNING: unimplement
    if (defaultOptions.sessionSupported) {
      let cb = args.pop();
      if (typeof cb == 'function') {
        let sessionId = this.#msg_waiting_list.push(cb) - 1;
        data = {sessionId, data};
      }
    }

    // use original interface for the `send` action with <channel>
    //   - the <data> field is a string or a session record
    proxy.postMessage({message:'data', channel: this.channel, data: {title, data}});
  }
}
FakeSocket.prototype.readyState = 'opening';

function createServer() {
  let Server = class extends FakeSocket {
    #channels = {};

    constructor(...args) {
      super(...args);

      let proxy = defaultOptions.proxy;

      // subscrib `connect` envent from parent, pre-step at parentPort.on() in current module
      proxy.on('connect', ({channel, peer}) => {  // 5. 'connect' event subscribed
        this.emit('connect', channel, peer); // 6. redirect to server self
      });

      // accept connect
      this.on('connect', function(channel, peer) { // 7. got connect require
        let recv = Object.assign(new FakeSocket, {channel, readyState: 'open'}); // creat and opened
        this.#channels[channel] = { peer, recv }; // (verify the `peer` if you want, and) maped
        proxy.on(channel, msg => {
          msg.data = JSON.parse(msg.data);
          this.emit('data', channel, msg, recv); // by default, redirect all data to server with <recv>
        });
        recv.send('connected', peer); // recived
      });
    }

    listen() {
      this.readyState == 'open';
    }
  }
  return new Server;
}

function createClient() {
  let Client = class extends FakeSocket {
    connect(peer) {
      let proxy = defaultOptions.proxy;

      // subscribe connected message
      proxy.once(`${peer} connected`, ({channel, peer:recv}) => {
        // assert(recv == peer);
        this.channel = channel;
        this.readyState = 'open'; // opened
        proxy.on(channel, ({title, data, ...more}) => {
          this.emit('data', title, JSON.parse(data), more); // 'data' event @channel, subscribed
        });
        this.queue && this.queue.forEach(q => this.send.apply(this, q)); // cache flushed
        delete this.queue;
      });

      // use original interface for the `connnect`, will create <channel> for this client
      proxy.postMessage({message: 'connect', peer});
    }

    send(...args) {
      if (this.readyState == 'opening') {
        if (! this.queue) this.queue = new Array;
        return this.queue.push(args);
      }
      return super.send(...args);
    }
  };

  return new Client;
}

module.exports = {
  setProcessProxy,
  createServer,
  createClient
}