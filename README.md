# P2P Bitcoin Exchange / OTC
This is a prototype for a P2P bitcoin exchange. It was built for a Node.js challenge. The requirements of the challenge can be found in [Backend Node.js Challenge.md](Backend Node.js Challenge.md).

Installing dependencies:

```
npm install
```

Running tests:

```
npm test
```

## What it does
The present code allows peers to match against other peers that want to exchange the exact same number of Bitcoins for the exact same number of dollars.

To do this, I've used one service name per offer (e.g. `offer_BUY_1_60000`). Which is kinda silly and probably doesn't scale but got the job done.

Tests are passing but only work if you run one at the time (because of the memory leaks, see below). So I've left only the last and most complete test enabled (using `.only`).

## Next features
This prototype is still missing quite a few things, including:

- Obviously the actual trade isn't taking place (neither on the Bitcoin nor on the USD side)
- Partial offer matching needs to be built, breaking down big offers into smaller chunks as offers with the same btc/usd ratio shows up online
- We should retry making requests so that we don't end up in a situation where two nodes are announcing the same offer but not finding each other

## Roadblocks I've hit
`grenache` doesn't seem to expose all functions necessary for a graceful shutdown of a node—which has been troublesome when trying to follow Test Driven Development—the "watch tests" mode kept crashing due to memory and socket leaks.

Also, `grenache` doesn't seem to provide a way to wait until connections are established. One possible design would be for `link.start()` and `peer.init()` to return promises that are resolved when the connection is established. This would allow me to remove the `await sleep()` calls throughout the code.

Documentation is lacking a bit. For example, the signature of `.reply()` is not documented anywhere. Also, took me a while to discover that methods such as `client.stop()` and `service.unlisten()` even exist—even though calling them wasn't enough to fix the leaks.

These things required me to add arbitrary delays in the code and yielded brittle, non-deterministic tests.

## Next code improvements
Code-wise, next up I'd try and fix all memory leaks. Fixing the leaks should make tests deterministic again, which in turn would allow for a better TDD flow. From my current understanding this would mean having to dive deeper into the `grenace` dependencies to figure out if the problem can be addressed in userland or if we'd need to open a PR and propose changes.

Also, I'm pretty sure using one service name per offer is unscalable. So we should address that. First idea that comes to mind is having something like bitcoind's "mempool" where we keep track of offers and relay them to our peers.

## Conclusion

This project took me ~5 hours of work throughout the day. I could invest another couple of hours in this project but I feel like the development has come to a natural conclusion and I'd be getting diminishing returns. This was fun!
