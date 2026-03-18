import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CircuitBreaker,
  CircuitOpenError,
} from '@/lib/circuit-breaker';

// ==========================================
// State transitions
// ==========================================

describe('CircuitBreaker state transitions', () => {
  let cb: CircuitBreaker;

  beforeEach(() => {
    cb = new CircuitBreaker('test-service', {
      failureThreshold: 3,
      resetTimeoutMs: 1000,
      halfOpenMaxAttempts: 1,
    });
  });

  it('starts in CLOSED state', () => {
    expect(cb.getState()).toBe('CLOSED');
    expect(cb.getFailureCount()).toBe(0);
  });

  it('stays CLOSED when calls succeed', async () => {
    await cb.execute(async () => 'ok');
    await cb.execute(async () => 'ok');
    expect(cb.getState()).toBe('CLOSED');
    expect(cb.getFailureCount()).toBe(0);
  });

  it('stays CLOSED below failure threshold', async () => {
    const failingFn = async () => { throw new Error('fail'); };

    // 2 failures — below threshold of 3
    await expect(cb.execute(failingFn)).rejects.toThrow('fail');
    await expect(cb.execute(failingFn)).rejects.toThrow('fail');

    expect(cb.getState()).toBe('CLOSED');
    expect(cb.getFailureCount()).toBe(2);
  });

  it('transitions to OPEN after reaching failure threshold', async () => {
    const failingFn = async () => { throw new Error('fail'); };

    await expect(cb.execute(failingFn)).rejects.toThrow('fail');
    await expect(cb.execute(failingFn)).rejects.toThrow('fail');
    await expect(cb.execute(failingFn)).rejects.toThrow('fail');

    expect(cb.getState()).toBe('OPEN');
    expect(cb.getFailureCount()).toBe(3);
  });

  it('throws CircuitOpenError immediately when OPEN', async () => {
    const failingFn = async () => { throw new Error('fail'); };

    // Trip the circuit
    for (let i = 0; i < 3; i++) {
      await expect(cb.execute(failingFn)).rejects.toThrow('fail');
    }

    // Now it should throw CircuitOpenError without calling the function
    const spy = vi.fn(async () => 'should not be called');
    await expect(cb.execute(spy)).rejects.toThrow(CircuitOpenError);
    expect(spy).not.toHaveBeenCalled();
  });

  it('transitions from OPEN to HALF_OPEN after resetTimeout', async () => {
    const failingFn = async () => { throw new Error('fail'); };
    vi.useFakeTimers();

    // Trip the circuit
    for (let i = 0; i < 3; i++) {
      await expect(cb.execute(failingFn)).rejects.toThrow('fail');
    }
    expect(cb.getState()).toBe('OPEN');

    // Advance time past the reset timeout
    vi.advanceTimersByTime(1001);

    expect(cb.getState()).toBe('HALF_OPEN');
    vi.useRealTimers();
  });

  it('transitions from HALF_OPEN to CLOSED on success', async () => {
    const failingFn = async () => { throw new Error('fail'); };
    vi.useFakeTimers();

    // Trip the circuit
    for (let i = 0; i < 3; i++) {
      await expect(cb.execute(failingFn)).rejects.toThrow('fail');
    }

    // Move to HALF_OPEN
    vi.advanceTimersByTime(1001);
    expect(cb.getState()).toBe('HALF_OPEN');

    // Successful test request
    const result = await cb.execute(async () => 'recovered');
    expect(result).toBe('recovered');
    expect(cb.getState()).toBe('CLOSED');
    expect(cb.getFailureCount()).toBe(0);

    vi.useRealTimers();
  });

  it('transitions from HALF_OPEN to OPEN on failure', async () => {
    const failingFn = async () => { throw new Error('fail'); };
    vi.useFakeTimers();

    // Trip the circuit
    for (let i = 0; i < 3; i++) {
      await expect(cb.execute(failingFn)).rejects.toThrow('fail');
    }

    // Move to HALF_OPEN
    vi.advanceTimersByTime(1001);
    expect(cb.getState()).toBe('HALF_OPEN');

    // Failed test request
    await expect(cb.execute(failingFn)).rejects.toThrow('fail');
    expect(cb.getState()).toBe('OPEN');

    vi.useRealTimers();
  });

  it('limits requests in HALF_OPEN to halfOpenMaxAttempts', async () => {
    const failingFn = async () => { throw new Error('fail'); };
    vi.useFakeTimers();

    // Trip and transition to HALF_OPEN
    for (let i = 0; i < 3; i++) {
      await expect(cb.execute(failingFn)).rejects.toThrow('fail');
    }
    vi.advanceTimersByTime(1001);

    // First attempt in HALF_OPEN succeeds (should be allowed)
    // But if it fails...
    await expect(cb.execute(failingFn)).rejects.toThrow('fail');

    // Second attempt should be blocked (maxAttempts = 1)
    const spy = vi.fn(async () => 'blocked');
    await expect(cb.execute(spy)).rejects.toThrow(CircuitOpenError);
    expect(spy).not.toHaveBeenCalled();

    vi.useRealTimers();
  });
});

// ==========================================
// Success resets failure count
// ==========================================

describe('failure count reset', () => {
  it('resets failure count on success', async () => {
    const cb = new CircuitBreaker('test', { failureThreshold: 3, resetTimeoutMs: 1000, halfOpenMaxAttempts: 1 });
    const failingFn = async () => { throw new Error('fail'); };

    // 2 failures
    await expect(cb.execute(failingFn)).rejects.toThrow();
    await expect(cb.execute(failingFn)).rejects.toThrow();
    expect(cb.getFailureCount()).toBe(2);

    // 1 success resets the count
    await cb.execute(async () => 'ok');
    expect(cb.getFailureCount()).toBe(0);
    expect(cb.getState()).toBe('CLOSED');

    // Need 3 more failures to trip again (not 1)
    await expect(cb.execute(failingFn)).rejects.toThrow();
    expect(cb.getState()).toBe('CLOSED');
  });
});

// ==========================================
// CircuitOpenError
// ==========================================

describe('CircuitOpenError', () => {
  it('includes service name in message', () => {
    const err = new CircuitOpenError('openai');
    expect(err.message).toBe('Circuit breaker OPEN for service: openai');
    expect(err.name).toBe('CircuitOpenError');
  });

  it('is an instance of Error', () => {
    const err = new CircuitOpenError('test');
    expect(err).toBeInstanceOf(Error);
  });
});

// ==========================================
// Reset
// ==========================================

describe('reset', () => {
  it('resets circuit to CLOSED from OPEN', async () => {
    const cb = new CircuitBreaker('test', { failureThreshold: 1, resetTimeoutMs: 60000, halfOpenMaxAttempts: 1 });
    const failingFn = async () => { throw new Error('fail'); };

    await expect(cb.execute(failingFn)).rejects.toThrow();
    expect(cb.getState()).toBe('OPEN');

    cb.reset();
    expect(cb.getState()).toBe('CLOSED');
    expect(cb.getFailureCount()).toBe(0);

    // Should work again
    const result = await cb.execute(async () => 'back');
    expect(result).toBe('back');
  });
});

// ==========================================
// Return value passthrough
// ==========================================

describe('return value', () => {
  it('passes through the return value of the wrapped function', async () => {
    const cb = new CircuitBreaker('test');
    const result = await cb.execute(async () => ({ data: [1, 2, 3] }));
    expect(result).toEqual({ data: [1, 2, 3] });
  });

  it('passes through the original error on failure', async () => {
    const cb = new CircuitBreaker('test');
    const customError = new TypeError('custom error');
    await expect(cb.execute(async () => { throw customError; })).rejects.toThrow(customError);
  });
});
