import assert from "node:assert/strict";
import test from "node:test";

import {
  constantTimeEqual,
  hasAttemptsRemaining,
  hmacHex,
  isChallengeExpired,
  randomOpaqueToken,
  randomVerificationCode,
  requireStrongSecret,
} from "../worker/src/security";

test("challenge expiry is inclusive at the exact boundary", () => {
  assert.equal(isChallengeExpired(1_000, 999), false);
  assert.equal(isChallengeExpired(1_000, 1_000), true);
  assert.equal(isChallengeExpired(1_000, 1_001), true);
});

test("attempt availability ends exactly at the configured maximum", () => {
  assert.equal(hasAttemptsRemaining(0, 5), true);
  assert.equal(hasAttemptsRemaining(4, 5), true);
  assert.equal(hasAttemptsRemaining(5, 5), false);
  assert.equal(hasAttemptsRemaining(6, 5), false);
});

test("verification code generation rejects biased values and pads to four digits", (context) => {
  const generatedValues = [0xffff_ffff, 7];
  let calls = 0;

  context.mock.method(
    crypto,
    "getRandomValues",
    ((array: Uint32Array) => {
      const value = generatedValues[calls];
      assert.notEqual(value, undefined);
      array[0] = value;
      calls += 1;
      return array;
    }) as typeof crypto.getRandomValues,
  );

  assert.equal(randomVerificationCode(), "0007");
  assert.equal(calls, 2);
});

test("verification codes always have exactly four ASCII digits", () => {
  for (let index = 0; index < 100; index += 1) {
    assert.match(randomVerificationCode(), /^\d{4}$/);
  }
});

test("HMACs require strong secrets and are deterministic and domain-separated", async () => {
  const firstSecret = "a".repeat(32);
  const secondSecret = "b".repeat(32);

  assert.throws(
    () => requireStrongSecret("x".repeat(31)),
    /missing or too short/,
  );
  assert.equal(requireStrongSecret(firstSecret), firstSecret);

  const signature = await hmacHex(firstSecret, "verification-token", "value");
  assert.match(signature, /^[a-f0-9]{64}$/);
  assert.equal(
    await hmacHex(firstSecret, "verification-token", "value"),
    signature,
  );
  assert.notEqual(
    await hmacHex(firstSecret, "other-domain", "value"),
    signature,
  );
  assert.notEqual(
    await hmacHex(firstSecret, "verification-token", "other-value"),
    signature,
  );
  assert.notEqual(
    await hmacHex(secondSecret, "verification-token", "value"),
    signature,
  );
});

test("opaque tokens are URL-safe and constant-time comparison handles unequal values", () => {
  const token = randomOpaqueToken();

  assert.equal(token.length, 43);
  assert.match(token, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(constantTimeEqual(token, token), true);
  assert.equal(constantTimeEqual(token, `${token.slice(0, -1)}x`), false);
  assert.equal(constantTimeEqual(token, token.slice(1)), false);
});
