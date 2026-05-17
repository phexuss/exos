import { Transform, type TransformFnParams } from 'class-transformer';

function asString(value: unknown): string | unknown {
  return typeof value === 'string' ? value : value;
}

export const TrimAndLowercase = (): PropertyDecorator =>
  Transform(({ value }: TransformFnParams) => {
    const v = asString(value);
    return typeof v === 'string' ? v.trim().toLowerCase() : v;
  });

export const TrimOnly = (): PropertyDecorator =>
  Transform(({ value }: TransformFnParams) => {
    const v = asString(value);
    return typeof v === 'string' ? v.trim() : v;
  });
