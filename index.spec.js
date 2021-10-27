"use strict";

const assert = require("assert");

const { Grape } = require("grenache-grape");
const until = require("wait-for-expect");
const fc = require("fast-check");
const isEqual = require("lodash.isequal");

const main = require(".");

describe("Offer encoding", () => {
  test("can stringify and parse back", () => {
    // Property-Based Testing to verify that our stringification and parsing works for all values
    fc.assert(
      fc.property(fc.boolean(), fc.float(), fc.float(), (bool, btc, usd) => {
        const side = bool ? "BUY" : "SELL";
        const expected = { side, btc, usd };
        const actual = main.parseOffer(main.stringifyOffer({ side, btc, usd }));
        const result = isEqual(expected, actual);
        if (!result) {
          console.log({ expected, actual });
        }
        return result;
      })
    );
  });
});

describe("P2P Bitcoin Exchange / OTC", () => {
  let grape_a, grape_b;
  beforeAll(async () => {
    jest.setTimeout(10000);
    grape_a = new Grape({
      dht_port: 20001,
      dht_bootstrap: ["127.0.0.1:20002"],
      api_port: 30001,
    });
    grape_a.start();

    grape_b = new Grape({
      dht_port: 20002,
      dht_bootstrap: ["127.0.0.1:20001"],
      api_port: 40001,
    });
    grape_b.start();
    await sleep(1000);
  });
  afterAll(async () => {
    grape_a.stop();
    grape_b.stop();
    await sleep(1000);
  });
  test("creates two nodes", async () => {
    const node_a = await main.createNode({ grape: "http://127.0.0.1:30001" });
    const node_b = await main.createNode({ grape: "http://127.0.0.1:40001" });
    await Promise.all([node_a.destroy(), node_b.destroy()]);
  });
  test("creates and announces offers", async () => {
    jest.setTimeout(10000);
    let count = 0;
    const node_a = await main.createNode({ grape: "http://127.0.0.1:30001" });
    const node_b = await main.createNode({
      grape: "http://127.0.0.1:40001",
      onRequest: () => {
        count++;
      },
    });

    node_a.createOffer({ side: "BUY", btc: 100, usd: 8000 });

    await until(() => expect(count).toBe(1));

    await Promise.all([node_a.destroy(), node_b.destroy()]);
  });
  test.only("matches offers of same amount", async () => {
    jest.setTimeout(10000);
    let count = 0;
    const node_a = await main.createNode({ grape: "http://127.0.0.1:30001" });
    const node_b = await main.createNode({
      grape: "http://127.0.0.1:40001",
      onOfferMatched: () => {
        count++;
      },
    });

    node_a.createOffer({ side: "BUY", btc: 100, usd: 8000 });
    await sleep(1000)
    node_b.createOffer({ side: "SELL", btc: 100, usd: 8000 });

    await until(() => expect(count).toBe(1));

    await Promise.all([node_a.destroy(), node_b.destroy()]);
  });
  test.todo("race conditions");
});

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}
