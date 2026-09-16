import test from 'node:test';
import assert from 'node:assert/strict';
import { getCurrentLocation, locationErrorMessage } from '../app/_home/utils/currentLocation.mjs';

test('uses a fresh position and retries without high accuracy on timeout', async () => {
  const options = [];
  const expected = { coords: { latitude: 41.07, longitude: 49.11 } };
  const result = await getCurrentLocation({ getCurrentPosition(ok, fail, config) {
    options.push(config);
    if (config.enableHighAccuracy) fail({ code: 3 }); else ok(expected);
  } });
  assert.equal(result, expected);
  assert.deepEqual(options.map(o => o.enableHighAccuracy), [true, false]);
  assert.ok(options.every(o => o.maximumAge === 0));
});

test('does not retry permission denial and explains the permission settings', async () => {
  let calls = 0;
  await assert.rejects(getCurrentLocation({ getCurrentPosition(ok, fail) {
    calls++; fail({ code: 1 });
  } }), e => e.code === 1);
  assert.equal(calls, 1);
  assert.match(locationErrorMessage({ code: 1 }), /Location Services/);
  assert.notEqual(locationErrorMessage({ code: 2 }), locationErrorMessage({ code: 3 }));
});

test('only the latest request may update location or report failure', async () => {
  const { readFile } = await import('node:fs/promises');
  const { runInNewContext } = await import('node:vm');
  const source = await readFile(new URL('../app/_home/HomePageClient.jsx', import.meta.url), 'utf8');
  const start = source.indexOf('  async function requestLocationActivation()');
  const end = source.indexOf('\n  async function handleLocationActivation()', start);
  const pending = [];
  let location, error;
  const noop = () => {};
  const ctx = { locationRequestId: {current: 0}, jobsRequestId: {current: 0}, window: {isSecureContext: true}, navigator: {},
    getCurrentLocation: () => new Promise((resolve, reject) => pending.push({resolve,reject})),
    reverseGeocode: async () => 'Siyəzən', locationErrorMessage,
    setLocationLoading: noop, setError: v => {error=v}, setOk: noop,
    setDeviceLocation: v => {location=v}, setJobs: noop, setLat: noop, setLng: noop,
    setLocationText: noop, setLocationPromptOpen: noop };
  const activate = runInNewContext(source.slice(start,end)+';requestLocationActivation', ctx);
  const oldRequest = activate();
  const latest = activate();
  pending[1].resolve({coords:{latitude:41.07,longitude:49.11}});
  await latest;
  pending[0].reject({code:3});
  await oldRequest;
  assert.equal(location.address, 'Siyəzən');
  assert.equal(error, '');
});
