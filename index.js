"use strict";

const { PeerRPCClient, PeerRPCServer } = require("grenache-nodejs-http");
const Link = require("grenache-nodejs-link");

module.exports = {
  createNode,
  stringifyOffer,
  parseOffer,
};

async function createNode({
  grape,
  onRequest = () => undefined,
  onOfferMatched = () => undefined,
}) {
  const offers = [];

  const link = new Link({
    grape,
  });
  link.start();

  // Server
  const server = new PeerRPCServer(link, {
    timeout: 300000,
  });
  server.init();
  const port = 1024 + Math.floor(Math.random() * 1000);
  const service = server.transport("server");
  service.listen(port);
  service.on("request", (rid, key, payload, handler) => {
    // XXX: Hook created just for testing
    onRequest({ key, payload });

    // Verify that we have an open offer for this amount
    const offer = parseOffer(key);
    const index = offers.findIndex(
      (element) =>
        offer.btc === element.btc &&
        offer.usd === element.usd &&
        offer.side !== element.side
    );
    if (index > -1) {
      // XXX: Beware of race conditions. Nodejs is single-threaded, and we're keeping the state in-memory only, so this should be fine, but any change to this code needs to take race conditions into consideration
      offers.splice(index, 1);
      onOfferMatched();
      handler.reply(null, { msg: "MATCH" });
    } else {
      handler.reply(false, { msg: "NO MATCH" });
    }
  });

  // Client
  const client = new PeerRPCClient(link, {
    timeout: 300000,
  });
  client.init();

  // XXX: Sleep a bit because it takes some time for the node to be fully up
  await sleep(500);

  return { destroy, createOffer };

  async function destroy() {
    client.stop();
    service.unlisten();
    server.stop();
    link.stop();
    // XXX: Sleep a bit because it takes some time for the node to teardown fully
    await sleep(500);
  }

  function createOffer(offer) {
    offers.push(offer);
    // Announce our offer
    const announcement = stringifyOffer(offer);
    link.startAnnouncing(announcement, service.port, {
      interval: 100,
    });
    // Try to match against another peer's offer announcement
    const target = stringifyOffer({
      ...offer,
      side: offer.side === "BUY" ? "SELL" : "BUY",
    });
    client.request(target, {}, { timeout: 10000 }, (err, data) => {
      if (err) {
        // It's okay to not receive a match
        // We'll just sit and wait for someone to reply to our announcement instead
        return;
      }
      const index = offers.findIndex(
        (element) =>
          element.side === offer.side && element.btc === offer.btc && element.usd === offer.usd
      );
      offers.splice(index, 1);
      onOfferMatched();
      link.stopAnnouncing(stringifyOffer(offer), service.port);
    });
  }
}

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function stringifyOffer({ side, btc, usd }) {
  return `offer_${side}_${btc}_${usd}`;
}

function parseOffer(string) {
  const [offer, side, btc, usd] = string.split("_");
  return { side, btc: Number(btc), usd: Number(usd) };
}
