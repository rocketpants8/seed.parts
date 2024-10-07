export class EAssertionFailed extends Error {
  constructor(message?: string) {
    super(message);

    // Workaround to fix subclass of built-in classes
    Object.setPrototypeOf(this, EAssertionFailed.prototype);
  }
} 

export function hasValue<T>(value: T | null | undefined): value is NonNullable<T> {
  return <T>value !== undefined && <T>value !== null;
}
