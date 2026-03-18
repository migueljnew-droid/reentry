/**
 * Circuit Breaker pattern for external service calls.
 *
 * State machine: CLOSED -> OPEN -> HALF_OPEN -> CLOSED
 *
 * - CLOSED: requests flow through normally. Failures are counted.
 * - OPEN: requests fail immediately without calling the external service.
 * - HALF_OPEN: one test request is allowed through. Success -> CLOSED, failure -> OPEN.
 *
 * In-memory state — acceptable for serverless (resets on cold start).
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  /** Number of consecutive failures before opening the circuit */
  failureThreshold: number;
  /** Time in ms to wait before transitioning from OPEN to HALF_OPEN */
  resetTimeoutMs: number;
  /** Number of test requests allowed in HALF_OPEN state */
  halfOpenMaxAttempts: number;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 3,
  resetTimeoutMs: 30_000,
  halfOpenMaxAttempts: 1,
};

export class CircuitOpenError extends Error {
  constructor(serviceName: string) {
    super(`Circuit breaker OPEN for service: ${serviceName}`);
    this.name = 'CircuitOpenError';
  }
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private halfOpenAttempts = 0;
  private readonly config: CircuitBreakerConfig;
  private readonly serviceName: string;

  constructor(serviceName: string, config?: Partial<CircuitBreakerConfig>) {
    this.serviceName = serviceName;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  getState(): CircuitState {
    this.checkStateTransition();
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }

  /**
   * Execute a function through the circuit breaker.
   * Throws CircuitOpenError immediately if the circuit is OPEN.
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.checkStateTransition();

    if (this.state === 'OPEN') {
      throw new CircuitOpenError(this.serviceName);
    }

    if (this.state === 'HALF_OPEN' && this.halfOpenAttempts >= this.config.halfOpenMaxAttempts) {
      throw new CircuitOpenError(this.serviceName);
    }

    if (this.state === 'HALF_OPEN') {
      this.halfOpenAttempts++;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Check if the circuit should transition from OPEN to HALF_OPEN
   * based on the reset timeout.
   */
  private checkStateTransition(): void {
    if (
      this.state === 'OPEN' &&
      Date.now() - this.lastFailureTime >= this.config.resetTimeoutMs
    ) {
      this.state = 'HALF_OPEN';
      this.halfOpenAttempts = 0;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.halfOpenAttempts = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      // Any failure in HALF_OPEN transitions back to OPEN
      this.state = 'OPEN';
    } else if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  /** Reset the circuit breaker to CLOSED state. For testing only. */
  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.halfOpenAttempts = 0;
  }
}

/**
 * Pre-configured circuit breaker instances for external services.
 * Module-level singletons — state persists within a serverless invocation.
 */
export const openaiCircuit = new CircuitBreaker('openai');
export const whisperCircuit = new CircuitBreaker('whisper');
