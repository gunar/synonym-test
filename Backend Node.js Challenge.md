# Backend Node.js Challenge

Your task is to create a P2P Bitcoin Exchange / OTC app based on Grenache, a Bittorrent DHT implementation.

With the Grenache HTTP Client, you should be able to make offers (e.g. buying 100 BTC for 8000$ each). 
If another client accepts the offer, both should establish a P2P connection and send a confirmation, 
that the offer was "done". That means every client needs a small Grenache RPC server. 
The updated orders should get distributed to other connected clients. 
You don't need to connect a wallet - the orders should be JS objects and can be discarded when the P2P trade happened. As already mentioned, two clients should agree on the trade in a P2P way, and update other clients or involved services after a succesful trade.

You should not spend more time than 6-8 hours on the task. If you don't get to the end, just write up what is missing for a complete P2P OTC app. Also, if your implementation has limitation and issues, that's no big deal, just write them down and indicate how you could solve them, given there was more time.

Good luck!

## Tips

 - you don't need to store state in a DB
 - it is possible to solve the task with the node std lib, async and grenache libraries
 - beware of race conditions!
 - don't use typescript

### Setting up the DHT

```
npm i -g grenache-grape
```

```
# boot two grape servers

grape --dp 20001 --aph 30001 --bn '127.0.0.1:20002'
grape --dp 20002 --aph 40001 --bn '127.0.0.1:20001'
```

### Setting up Grenache in your project

```
npm install --save grenache-nodejs-http
npm install --save grenache-nodejs-link
```


### Example RPC server / client with "Hello World"

```js
// This RPC server will announce itself as `rpc_test`
// in our Grape Bittorrent network
// When it receives requests, it will answer with 'world'

'use strict'

const { PeerRPCServer }  = require('grenache-nodejs-http')
const Link = require('grenache-nodejs-link')


const link = new Link({
  grape: 'http://127.0.0.1:30001'
})
link.start()

const peer = new PeerRPCServer(link, {
  timeout: 300000
})
peer.init()

const port = 1024 + Math.floor(Math.random() * 1000)
const service = peer.transport('server')
service.listen(port)

setInterval(function () {
  link.announce('rpc_test', service.port, {})
}, 1000)

service.on('request', (rid, key, payload, handler) => {
  console.log(payload) //  { msg: 'hello' }
  handler.reply(null, { msg: 'world' })
})

```

```js
// This client will as the DHT for a service called `rpc_test`
// and then establishes a P2P connection it.
// It will then send { msg: 'hello' } to the RPC server

'use strict'

const { PeerRPCClient }  = require('grenache-nodejs-http')
const Link = require('grenache-nodejs-link')

const link = new Link({
  grape: 'http://127.0.0.1:30001'
})
link.start()

const peer = new PeerRPCClient(link, {})
peer.init()

peer.request('rpc_test', { msg: 'hello' }, { timeout: 10000 }, (err, data) => {
  if (err) {
    console.error(err)
    process.exit(-1)
  }
  console.log(data) // { msg: 'world' }
})
```

### More Help

 - http://blog.bitfinex.com/tutorial/bitfinex-loves-microservices-grenache/
 - https://github.com/bitfinexcom/grenache-nodejs-example-fib-client
 - https://github.com/bitfinexcom/grenache-nodejs-example-fib-server