// Tests for the money and stock rules in store.js. Run: node store.test.js
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

function load({blockWrites = false, seed = {}} = {}) {
  const data = {...seed};
  const localStorage = {
    getItem: k => (k in data ? data[k] : null),
    setItem: (k, v) => { if (blockWrites) throw new Error('blocked'); data[k] = String(v); },
    removeItem: k => { delete data[k]; },
  };
  const ctx = {window: {}, localStorage, console, Event: function () {},
    addEventListener() {}, dispatchEvent() {},
    document: {querySelector: () => null, querySelectorAll: () => []}};
  vm.runInNewContext(fs.readFileSync(__dirname + '/store.js', 'utf8'), ctx);
  return ctx.window.Store;
}
// arrays from the vm sandbox have their own Array prototype, so compare contents
const same = (a, b) => assert.deepStrictEqual([...a], b);
const customer = {name: 'Test Customer', phone: '03001234567', city: 'Lahore', address: 'House 1, Street 2, Gulberg'};

// placing an order takes stock, charges delivery under Rs 5,000 and empties the bag
{
  const S = load();
  assert.strictEqual(S.qty('tee-white', 'L'), 8);
  same(S.addToBag([{pid: 'tee-white', size: 'L'}, {pid: 'tee-white', size: 'L'}]), []);
  const o = S.placeOrder(customer);
  assert.strictEqual(o.subtotal, 3980);
  assert.strictEqual(o.delivery, 250);
  assert.strictEqual(o.total, 4230);
  assert.strictEqual(S.qty('tee-white', 'L'), 6);
  assert.strictEqual(S.bag().length, 0);
  assert.strictEqual(S.orders()[0].id, 'DH-1001');

  // cancelling puts the stock back, once
  S.setStatus(o.id, 'Cancelled');
  assert.strictEqual(S.qty('tee-white', 'L'), 8);
  S.setStatus(o.id, 'Cancelled');
  assert.strictEqual(S.qty('tee-white', 'L'), 8);
  S.setStatus(o.id, 'Pending'); // a cancelled order cannot be reopened
  assert.strictEqual(S.orders()[0].status, 'Cancelled');
}

// free delivery from Rs 5,000; order numbers keep counting up
{
  const S = load();
  S.addToBag([{pid: 'loafer-brown', size: '42'}]);
  assert.strictEqual(S.placeOrder(customer).delivery, 0);
  S.addToBag([{pid: 'tee-white', size: 'M'}]);
  assert.strictEqual(S.placeOrder(customer).id, 'DH-1002');
}

// the bag never holds more than the stock, and sold-out pieces cannot be added
{
  const S = load();
  same(S.addToBag([{pid: 'sneaker-black', size: '42'}]), ['Black Leather Sneaker']);
  S.setStock('tee-black', 'S', 1);
  same(S.addToBag([{pid: 'tee-black', size: 'S'}, {pid: 'tee-black', size: 'S'}]), ['Essential Tee — Black']);
  assert.strictEqual(S.bag()[0].qty, 1);
}

// an order is refused if stock ran out after the piece went into the bag, and nothing changes
{
  const S = load();
  S.addToBag([{pid: 'denim-blue', size: '32'}]);
  S.setStock('denim-blue', '32', 0);
  assert.throws(() => S.placeOrder(customer), /sold out/);
  assert.strictEqual(S.orders().length, 0);
  assert.strictEqual(S.bag().length, 1);
}

// broken or hand-edited storage is ignored instead of crashing
{
  const S = load();
  S.setStock('tee-white', 'L', -5);
  assert.strictEqual(S.qty('tee-white', 'L'), 0);
}

// a browser that blocks storage gets a clear error, not a fake "added"
{
  const S = load({blockWrites: true});
  assert.throws(() => S.addToBag([{pid: 'tee-white', size: 'L'}]), /blocking storage/);
}

// an old order with a status no longer in the list is kept when a new order is saved
{
  const old = {id: 'DH-1001', num: 1001, items: [], customer, status: 'Dispatched'};
  const S = load({seed: {'dhaaga-orders-v1': JSON.stringify([old])}});
  S.addToBag([{pid: 'tee-white', size: 'S'}]);
  S.placeOrder(customer);
  same(S.orders().map(o => o.id), ['DH-1002', 'DH-1001']);
}

console.log('store.test.js: all passed');
