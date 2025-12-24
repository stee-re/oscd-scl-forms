import { ZodTypeAny } from 'zod';

type FormValue = Record<string, unknown>;

export type FieldState = {
  value: unknown;
  touched: boolean;
  dirty: boolean;
  error?: string;
};

export class FormState<T extends FormValue = FormValue> {
  private initial: T;

  private current: T;

  private errors = new Map<keyof T, string | undefined>();

  private touched = new Set<keyof T>();

  private listeners = new Set<() => void>();

  constructor(
    initial: T,
    private schema: ZodTypeAny,
  ) {
    this.initial = initial;
    this.current = { ...initial };
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  getValue(): T {
    return this.current;
  }

  setValue<K extends keyof T>(key: K, value: T[K]): void {
    this.current = { ...this.current, [key]: value };
    this.touched.add(key);
    this.validate();
    this.publish();
  }

  reset(next?: T): void {
    this.initial = next ?? this.initial;
    this.current = { ...this.initial };
    this.errors.clear();
    this.touched.clear();
    this.publish();
  }

  fieldState<K extends keyof T>(key: K): FieldState {
    const value = this.current[key];
    const error = this.errors.get(key);
    const touched = this.touched.has(key);
    const dirty = value !== this.initial[key];
    return { value, touched, dirty, error };
  }

  validate(): boolean {
    const result = this.schema.safeParse(this.current);
    this.errors.clear();
    if (!result.success) {
      result.error.issues.forEach(issue => {
        const pathKey = issue.path[0] as keyof T;
        if (pathKey !== undefined) {
          this.errors.set(pathKey, issue.message);
        }
      });
    }
    return this.errors.size === 0;
  }

  private publish(): void {
    this.listeners.forEach(listener => listener());
  }
}
