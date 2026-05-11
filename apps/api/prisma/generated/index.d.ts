
/**
 * Client
**/

import * as runtime from './runtime/client.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model VerificationCode
 * 
 */
export type VerificationCode = $Result.DefaultSelection<Prisma.$VerificationCodePayload>
/**
 * Model UserLibrary
 * 
 */
export type UserLibrary = $Result.DefaultSelection<Prisma.$UserLibraryPayload>
/**
 * Model UserRecentlyPlayed
 * 
 */
export type UserRecentlyPlayed = $Result.DefaultSelection<Prisma.$UserRecentlyPlayedPayload>
/**
 * Model Session
 * 
 */
export type Session = $Result.DefaultSelection<Prisma.$SessionPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient({
 *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
 * })
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient({
   *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
   * })
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://pris.ly/d/client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/orm/prisma-client/queries/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>

  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.verificationCode`: Exposes CRUD operations for the **VerificationCode** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more VerificationCodes
    * const verificationCodes = await prisma.verificationCode.findMany()
    * ```
    */
  get verificationCode(): Prisma.VerificationCodeDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.userLibrary`: Exposes CRUD operations for the **UserLibrary** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more UserLibraries
    * const userLibraries = await prisma.userLibrary.findMany()
    * ```
    */
  get userLibrary(): Prisma.UserLibraryDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.userRecentlyPlayed`: Exposes CRUD operations for the **UserRecentlyPlayed** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more UserRecentlyPlayeds
    * const userRecentlyPlayeds = await prisma.userRecentlyPlayed.findMany()
    * ```
    */
  get userRecentlyPlayed(): Prisma.UserRecentlyPlayedDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.session`: Exposes CRUD operations for the **Session** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Sessions
    * const sessions = await prisma.session.findMany()
    * ```
    */
  get session(): Prisma.SessionDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 7.8.0
   * Query Engine version: 3c6e192761c0362d496ed980de936e2f3cebcd3a
   */
  export type PrismaVersion = {
    client: string
    engine: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    User: 'User',
    VerificationCode: 'VerificationCode',
    UserLibrary: 'UserLibrary',
    UserRecentlyPlayed: 'UserRecentlyPlayed',
    Session: 'Session'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]



  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "user" | "verificationCode" | "userLibrary" | "userRecentlyPlayed" | "session"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      VerificationCode: {
        payload: Prisma.$VerificationCodePayload<ExtArgs>
        fields: Prisma.VerificationCodeFieldRefs
        operations: {
          findUnique: {
            args: Prisma.VerificationCodeFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationCodePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.VerificationCodeFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationCodePayload>
          }
          findFirst: {
            args: Prisma.VerificationCodeFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationCodePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.VerificationCodeFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationCodePayload>
          }
          findMany: {
            args: Prisma.VerificationCodeFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationCodePayload>[]
          }
          create: {
            args: Prisma.VerificationCodeCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationCodePayload>
          }
          createMany: {
            args: Prisma.VerificationCodeCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.VerificationCodeCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationCodePayload>[]
          }
          delete: {
            args: Prisma.VerificationCodeDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationCodePayload>
          }
          update: {
            args: Prisma.VerificationCodeUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationCodePayload>
          }
          deleteMany: {
            args: Prisma.VerificationCodeDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.VerificationCodeUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.VerificationCodeUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationCodePayload>[]
          }
          upsert: {
            args: Prisma.VerificationCodeUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationCodePayload>
          }
          aggregate: {
            args: Prisma.VerificationCodeAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateVerificationCode>
          }
          groupBy: {
            args: Prisma.VerificationCodeGroupByArgs<ExtArgs>
            result: $Utils.Optional<VerificationCodeGroupByOutputType>[]
          }
          count: {
            args: Prisma.VerificationCodeCountArgs<ExtArgs>
            result: $Utils.Optional<VerificationCodeCountAggregateOutputType> | number
          }
        }
      }
      UserLibrary: {
        payload: Prisma.$UserLibraryPayload<ExtArgs>
        fields: Prisma.UserLibraryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserLibraryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserLibraryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserLibraryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserLibraryPayload>
          }
          findFirst: {
            args: Prisma.UserLibraryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserLibraryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserLibraryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserLibraryPayload>
          }
          findMany: {
            args: Prisma.UserLibraryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserLibraryPayload>[]
          }
          create: {
            args: Prisma.UserLibraryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserLibraryPayload>
          }
          createMany: {
            args: Prisma.UserLibraryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserLibraryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserLibraryPayload>[]
          }
          delete: {
            args: Prisma.UserLibraryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserLibraryPayload>
          }
          update: {
            args: Prisma.UserLibraryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserLibraryPayload>
          }
          deleteMany: {
            args: Prisma.UserLibraryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserLibraryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserLibraryUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserLibraryPayload>[]
          }
          upsert: {
            args: Prisma.UserLibraryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserLibraryPayload>
          }
          aggregate: {
            args: Prisma.UserLibraryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUserLibrary>
          }
          groupBy: {
            args: Prisma.UserLibraryGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserLibraryGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserLibraryCountArgs<ExtArgs>
            result: $Utils.Optional<UserLibraryCountAggregateOutputType> | number
          }
        }
      }
      UserRecentlyPlayed: {
        payload: Prisma.$UserRecentlyPlayedPayload<ExtArgs>
        fields: Prisma.UserRecentlyPlayedFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserRecentlyPlayedFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserRecentlyPlayedPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserRecentlyPlayedFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserRecentlyPlayedPayload>
          }
          findFirst: {
            args: Prisma.UserRecentlyPlayedFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserRecentlyPlayedPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserRecentlyPlayedFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserRecentlyPlayedPayload>
          }
          findMany: {
            args: Prisma.UserRecentlyPlayedFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserRecentlyPlayedPayload>[]
          }
          create: {
            args: Prisma.UserRecentlyPlayedCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserRecentlyPlayedPayload>
          }
          createMany: {
            args: Prisma.UserRecentlyPlayedCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserRecentlyPlayedCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserRecentlyPlayedPayload>[]
          }
          delete: {
            args: Prisma.UserRecentlyPlayedDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserRecentlyPlayedPayload>
          }
          update: {
            args: Prisma.UserRecentlyPlayedUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserRecentlyPlayedPayload>
          }
          deleteMany: {
            args: Prisma.UserRecentlyPlayedDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserRecentlyPlayedUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserRecentlyPlayedUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserRecentlyPlayedPayload>[]
          }
          upsert: {
            args: Prisma.UserRecentlyPlayedUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserRecentlyPlayedPayload>
          }
          aggregate: {
            args: Prisma.UserRecentlyPlayedAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUserRecentlyPlayed>
          }
          groupBy: {
            args: Prisma.UserRecentlyPlayedGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserRecentlyPlayedGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserRecentlyPlayedCountArgs<ExtArgs>
            result: $Utils.Optional<UserRecentlyPlayedCountAggregateOutputType> | number
          }
        }
      }
      Session: {
        payload: Prisma.$SessionPayload<ExtArgs>
        fields: Prisma.SessionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SessionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SessionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          findFirst: {
            args: Prisma.SessionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SessionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          findMany: {
            args: Prisma.SessionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>[]
          }
          create: {
            args: Prisma.SessionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          createMany: {
            args: Prisma.SessionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SessionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>[]
          }
          delete: {
            args: Prisma.SessionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          update: {
            args: Prisma.SessionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          deleteMany: {
            args: Prisma.SessionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SessionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SessionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>[]
          }
          upsert: {
            args: Prisma.SessionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          aggregate: {
            args: Prisma.SessionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSession>
          }
          groupBy: {
            args: Prisma.SessionGroupByArgs<ExtArgs>
            result: $Utils.Optional<SessionGroupByOutputType>[]
          }
          count: {
            args: Prisma.SessionCountArgs<ExtArgs>
            result: $Utils.Optional<SessionCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://pris.ly/d/logging).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory
    /**
     * Prisma Accelerate URL allowing the client to connect through Accelerate instead of a direct database.
     */
    accelerateUrl?: string
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
    /**
     * SQL commenter plugins that add metadata to SQL queries as comments.
     * Comments follow the sqlcommenter format: https://google.github.io/sqlcommenter/
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   adapter,
     *   comments: [
     *     traceContext(),
     *     queryInsights(),
     *   ],
     * })
     * ```
     */
    comments?: runtime.SqlCommenterPlugin[]
  }
  export type GlobalOmitConfig = {
    user?: UserOmit
    verificationCode?: VerificationCodeOmit
    userLibrary?: UserLibraryOmit
    userRecentlyPlayed?: UserRecentlyPlayedOmit
    session?: SessionOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    userLibraries: number
    recentlyPlayed: number
    sessions: number
    codes: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    userLibraries?: boolean | UserCountOutputTypeCountUserLibrariesArgs
    recentlyPlayed?: boolean | UserCountOutputTypeCountRecentlyPlayedArgs
    sessions?: boolean | UserCountOutputTypeCountSessionsArgs
    codes?: boolean | UserCountOutputTypeCountCodesArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountUserLibrariesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserLibraryWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountRecentlyPlayedArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserRecentlyPlayedWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountSessionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SessionWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountCodesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: VerificationCodeWhereInput
  }


  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    name: string | null
    email: string | null
    username: string | null
    passwordHash: string | null
    isVerified: boolean | null
    verifyToken: string | null
    verifyTokenExp: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    name: string | null
    email: string | null
    username: string | null
    passwordHash: string | null
    isVerified: boolean | null
    verifyToken: string | null
    verifyTokenExp: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    name: number
    email: number
    username: number
    passwordHash: number
    isVerified: number
    verifyToken: number
    verifyTokenExp: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type UserMinAggregateInputType = {
    id?: true
    name?: true
    email?: true
    username?: true
    passwordHash?: true
    isVerified?: true
    verifyToken?: true
    verifyTokenExp?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    name?: true
    email?: true
    username?: true
    passwordHash?: true
    isVerified?: true
    verifyToken?: true
    verifyTokenExp?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    name?: true
    email?: true
    username?: true
    passwordHash?: true
    isVerified?: true
    verifyToken?: true
    verifyTokenExp?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    name: string
    email: string
    username: string
    passwordHash: string
    isVerified: boolean
    verifyToken: string | null
    verifyTokenExp: Date | null
    createdAt: Date
    updatedAt: Date
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    email?: boolean
    username?: boolean
    passwordHash?: boolean
    isVerified?: boolean
    verifyToken?: boolean
    verifyTokenExp?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    userLibraries?: boolean | User$userLibrariesArgs<ExtArgs>
    recentlyPlayed?: boolean | User$recentlyPlayedArgs<ExtArgs>
    sessions?: boolean | User$sessionsArgs<ExtArgs>
    codes?: boolean | User$codesArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    email?: boolean
    username?: boolean
    passwordHash?: boolean
    isVerified?: boolean
    verifyToken?: boolean
    verifyTokenExp?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    email?: boolean
    username?: boolean
    passwordHash?: boolean
    isVerified?: boolean
    verifyToken?: boolean
    verifyTokenExp?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    name?: boolean
    email?: boolean
    username?: boolean
    passwordHash?: boolean
    isVerified?: boolean
    verifyToken?: boolean
    verifyTokenExp?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "email" | "username" | "passwordHash" | "isVerified" | "verifyToken" | "verifyTokenExp" | "createdAt" | "updatedAt", ExtArgs["result"]["user"]>
  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    userLibraries?: boolean | User$userLibrariesArgs<ExtArgs>
    recentlyPlayed?: boolean | User$recentlyPlayedArgs<ExtArgs>
    sessions?: boolean | User$sessionsArgs<ExtArgs>
    codes?: boolean | User$codesArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type UserIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      userLibraries: Prisma.$UserLibraryPayload<ExtArgs>[]
      recentlyPlayed: Prisma.$UserRecentlyPlayedPayload<ExtArgs>[]
      sessions: Prisma.$SessionPayload<ExtArgs>[]
      codes: Prisma.$VerificationCodePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      email: string
      username: string
      passwordHash: string
      isVerified: boolean
      verifyToken: string | null
      verifyTokenExp: Date | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users and returns the data updated in the database.
     * @param {UserUpdateManyAndReturnArgs} args - Arguments to update many Users.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Users and only return the `id`
     * const userWithIdOnly = await prisma.user.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UserUpdateManyAndReturnArgs>(args: SelectSubset<T, UserUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    userLibraries<T extends User$userLibrariesArgs<ExtArgs> = {}>(args?: Subset<T, User$userLibrariesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserLibraryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    recentlyPlayed<T extends User$recentlyPlayedArgs<ExtArgs> = {}>(args?: Subset<T, User$recentlyPlayedArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserRecentlyPlayedPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    sessions<T extends User$sessionsArgs<ExtArgs> = {}>(args?: Subset<T, User$sessionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    codes<T extends User$codesArgs<ExtArgs> = {}>(args?: Subset<T, User$codesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VerificationCodePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'String'>
    readonly name: FieldRef<"User", 'String'>
    readonly email: FieldRef<"User", 'String'>
    readonly username: FieldRef<"User", 'String'>
    readonly passwordHash: FieldRef<"User", 'String'>
    readonly isVerified: FieldRef<"User", 'Boolean'>
    readonly verifyToken: FieldRef<"User", 'String'>
    readonly verifyTokenExp: FieldRef<"User", 'DateTime'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
    readonly updatedAt: FieldRef<"User", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User updateManyAndReturn
   */
  export type UserUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to delete.
     */
    limit?: number
  }

  /**
   * User.userLibraries
   */
  export type User$userLibrariesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserLibrary
     */
    select?: UserLibrarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserLibrary
     */
    omit?: UserLibraryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserLibraryInclude<ExtArgs> | null
    where?: UserLibraryWhereInput
    orderBy?: UserLibraryOrderByWithRelationInput | UserLibraryOrderByWithRelationInput[]
    cursor?: UserLibraryWhereUniqueInput
    take?: number
    skip?: number
    distinct?: UserLibraryScalarFieldEnum | UserLibraryScalarFieldEnum[]
  }

  /**
   * User.recentlyPlayed
   */
  export type User$recentlyPlayedArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserRecentlyPlayed
     */
    select?: UserRecentlyPlayedSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserRecentlyPlayed
     */
    omit?: UserRecentlyPlayedOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserRecentlyPlayedInclude<ExtArgs> | null
    where?: UserRecentlyPlayedWhereInput
    orderBy?: UserRecentlyPlayedOrderByWithRelationInput | UserRecentlyPlayedOrderByWithRelationInput[]
    cursor?: UserRecentlyPlayedWhereUniqueInput
    take?: number
    skip?: number
    distinct?: UserRecentlyPlayedScalarFieldEnum | UserRecentlyPlayedScalarFieldEnum[]
  }

  /**
   * User.sessions
   */
  export type User$sessionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    where?: SessionWhereInput
    orderBy?: SessionOrderByWithRelationInput | SessionOrderByWithRelationInput[]
    cursor?: SessionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SessionScalarFieldEnum | SessionScalarFieldEnum[]
  }

  /**
   * User.codes
   */
  export type User$codesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationCode
     */
    select?: VerificationCodeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationCode
     */
    omit?: VerificationCodeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationCodeInclude<ExtArgs> | null
    where?: VerificationCodeWhereInput
    orderBy?: VerificationCodeOrderByWithRelationInput | VerificationCodeOrderByWithRelationInput[]
    cursor?: VerificationCodeWhereUniqueInput
    take?: number
    skip?: number
    distinct?: VerificationCodeScalarFieldEnum | VerificationCodeScalarFieldEnum[]
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model VerificationCode
   */

  export type AggregateVerificationCode = {
    _count: VerificationCodeCountAggregateOutputType | null
    _min: VerificationCodeMinAggregateOutputType | null
    _max: VerificationCodeMaxAggregateOutputType | null
  }

  export type VerificationCodeMinAggregateOutputType = {
    id: string | null
    code: string | null
    userId: string | null
    expiresAt: Date | null
    createdAt: Date | null
  }

  export type VerificationCodeMaxAggregateOutputType = {
    id: string | null
    code: string | null
    userId: string | null
    expiresAt: Date | null
    createdAt: Date | null
  }

  export type VerificationCodeCountAggregateOutputType = {
    id: number
    code: number
    userId: number
    expiresAt: number
    createdAt: number
    _all: number
  }


  export type VerificationCodeMinAggregateInputType = {
    id?: true
    code?: true
    userId?: true
    expiresAt?: true
    createdAt?: true
  }

  export type VerificationCodeMaxAggregateInputType = {
    id?: true
    code?: true
    userId?: true
    expiresAt?: true
    createdAt?: true
  }

  export type VerificationCodeCountAggregateInputType = {
    id?: true
    code?: true
    userId?: true
    expiresAt?: true
    createdAt?: true
    _all?: true
  }

  export type VerificationCodeAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which VerificationCode to aggregate.
     */
    where?: VerificationCodeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VerificationCodes to fetch.
     */
    orderBy?: VerificationCodeOrderByWithRelationInput | VerificationCodeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: VerificationCodeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VerificationCodes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VerificationCodes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned VerificationCodes
    **/
    _count?: true | VerificationCodeCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: VerificationCodeMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: VerificationCodeMaxAggregateInputType
  }

  export type GetVerificationCodeAggregateType<T extends VerificationCodeAggregateArgs> = {
        [P in keyof T & keyof AggregateVerificationCode]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateVerificationCode[P]>
      : GetScalarType<T[P], AggregateVerificationCode[P]>
  }




  export type VerificationCodeGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: VerificationCodeWhereInput
    orderBy?: VerificationCodeOrderByWithAggregationInput | VerificationCodeOrderByWithAggregationInput[]
    by: VerificationCodeScalarFieldEnum[] | VerificationCodeScalarFieldEnum
    having?: VerificationCodeScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: VerificationCodeCountAggregateInputType | true
    _min?: VerificationCodeMinAggregateInputType
    _max?: VerificationCodeMaxAggregateInputType
  }

  export type VerificationCodeGroupByOutputType = {
    id: string
    code: string
    userId: string
    expiresAt: Date
    createdAt: Date
    _count: VerificationCodeCountAggregateOutputType | null
    _min: VerificationCodeMinAggregateOutputType | null
    _max: VerificationCodeMaxAggregateOutputType | null
  }

  type GetVerificationCodeGroupByPayload<T extends VerificationCodeGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<VerificationCodeGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof VerificationCodeGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], VerificationCodeGroupByOutputType[P]>
            : GetScalarType<T[P], VerificationCodeGroupByOutputType[P]>
        }
      >
    >


  export type VerificationCodeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    code?: boolean
    userId?: boolean
    expiresAt?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["verificationCode"]>

  export type VerificationCodeSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    code?: boolean
    userId?: boolean
    expiresAt?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["verificationCode"]>

  export type VerificationCodeSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    code?: boolean
    userId?: boolean
    expiresAt?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["verificationCode"]>

  export type VerificationCodeSelectScalar = {
    id?: boolean
    code?: boolean
    userId?: boolean
    expiresAt?: boolean
    createdAt?: boolean
  }

  export type VerificationCodeOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "code" | "userId" | "expiresAt" | "createdAt", ExtArgs["result"]["verificationCode"]>
  export type VerificationCodeInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type VerificationCodeIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type VerificationCodeIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $VerificationCodePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "VerificationCode"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      code: string
      userId: string
      expiresAt: Date
      createdAt: Date
    }, ExtArgs["result"]["verificationCode"]>
    composites: {}
  }

  type VerificationCodeGetPayload<S extends boolean | null | undefined | VerificationCodeDefaultArgs> = $Result.GetResult<Prisma.$VerificationCodePayload, S>

  type VerificationCodeCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<VerificationCodeFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: VerificationCodeCountAggregateInputType | true
    }

  export interface VerificationCodeDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['VerificationCode'], meta: { name: 'VerificationCode' } }
    /**
     * Find zero or one VerificationCode that matches the filter.
     * @param {VerificationCodeFindUniqueArgs} args - Arguments to find a VerificationCode
     * @example
     * // Get one VerificationCode
     * const verificationCode = await prisma.verificationCode.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends VerificationCodeFindUniqueArgs>(args: SelectSubset<T, VerificationCodeFindUniqueArgs<ExtArgs>>): Prisma__VerificationCodeClient<$Result.GetResult<Prisma.$VerificationCodePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one VerificationCode that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {VerificationCodeFindUniqueOrThrowArgs} args - Arguments to find a VerificationCode
     * @example
     * // Get one VerificationCode
     * const verificationCode = await prisma.verificationCode.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends VerificationCodeFindUniqueOrThrowArgs>(args: SelectSubset<T, VerificationCodeFindUniqueOrThrowArgs<ExtArgs>>): Prisma__VerificationCodeClient<$Result.GetResult<Prisma.$VerificationCodePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first VerificationCode that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationCodeFindFirstArgs} args - Arguments to find a VerificationCode
     * @example
     * // Get one VerificationCode
     * const verificationCode = await prisma.verificationCode.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends VerificationCodeFindFirstArgs>(args?: SelectSubset<T, VerificationCodeFindFirstArgs<ExtArgs>>): Prisma__VerificationCodeClient<$Result.GetResult<Prisma.$VerificationCodePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first VerificationCode that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationCodeFindFirstOrThrowArgs} args - Arguments to find a VerificationCode
     * @example
     * // Get one VerificationCode
     * const verificationCode = await prisma.verificationCode.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends VerificationCodeFindFirstOrThrowArgs>(args?: SelectSubset<T, VerificationCodeFindFirstOrThrowArgs<ExtArgs>>): Prisma__VerificationCodeClient<$Result.GetResult<Prisma.$VerificationCodePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more VerificationCodes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationCodeFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all VerificationCodes
     * const verificationCodes = await prisma.verificationCode.findMany()
     * 
     * // Get first 10 VerificationCodes
     * const verificationCodes = await prisma.verificationCode.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const verificationCodeWithIdOnly = await prisma.verificationCode.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends VerificationCodeFindManyArgs>(args?: SelectSubset<T, VerificationCodeFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VerificationCodePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a VerificationCode.
     * @param {VerificationCodeCreateArgs} args - Arguments to create a VerificationCode.
     * @example
     * // Create one VerificationCode
     * const VerificationCode = await prisma.verificationCode.create({
     *   data: {
     *     // ... data to create a VerificationCode
     *   }
     * })
     * 
     */
    create<T extends VerificationCodeCreateArgs>(args: SelectSubset<T, VerificationCodeCreateArgs<ExtArgs>>): Prisma__VerificationCodeClient<$Result.GetResult<Prisma.$VerificationCodePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many VerificationCodes.
     * @param {VerificationCodeCreateManyArgs} args - Arguments to create many VerificationCodes.
     * @example
     * // Create many VerificationCodes
     * const verificationCode = await prisma.verificationCode.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends VerificationCodeCreateManyArgs>(args?: SelectSubset<T, VerificationCodeCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many VerificationCodes and returns the data saved in the database.
     * @param {VerificationCodeCreateManyAndReturnArgs} args - Arguments to create many VerificationCodes.
     * @example
     * // Create many VerificationCodes
     * const verificationCode = await prisma.verificationCode.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many VerificationCodes and only return the `id`
     * const verificationCodeWithIdOnly = await prisma.verificationCode.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends VerificationCodeCreateManyAndReturnArgs>(args?: SelectSubset<T, VerificationCodeCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VerificationCodePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a VerificationCode.
     * @param {VerificationCodeDeleteArgs} args - Arguments to delete one VerificationCode.
     * @example
     * // Delete one VerificationCode
     * const VerificationCode = await prisma.verificationCode.delete({
     *   where: {
     *     // ... filter to delete one VerificationCode
     *   }
     * })
     * 
     */
    delete<T extends VerificationCodeDeleteArgs>(args: SelectSubset<T, VerificationCodeDeleteArgs<ExtArgs>>): Prisma__VerificationCodeClient<$Result.GetResult<Prisma.$VerificationCodePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one VerificationCode.
     * @param {VerificationCodeUpdateArgs} args - Arguments to update one VerificationCode.
     * @example
     * // Update one VerificationCode
     * const verificationCode = await prisma.verificationCode.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends VerificationCodeUpdateArgs>(args: SelectSubset<T, VerificationCodeUpdateArgs<ExtArgs>>): Prisma__VerificationCodeClient<$Result.GetResult<Prisma.$VerificationCodePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more VerificationCodes.
     * @param {VerificationCodeDeleteManyArgs} args - Arguments to filter VerificationCodes to delete.
     * @example
     * // Delete a few VerificationCodes
     * const { count } = await prisma.verificationCode.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends VerificationCodeDeleteManyArgs>(args?: SelectSubset<T, VerificationCodeDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more VerificationCodes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationCodeUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many VerificationCodes
     * const verificationCode = await prisma.verificationCode.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends VerificationCodeUpdateManyArgs>(args: SelectSubset<T, VerificationCodeUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more VerificationCodes and returns the data updated in the database.
     * @param {VerificationCodeUpdateManyAndReturnArgs} args - Arguments to update many VerificationCodes.
     * @example
     * // Update many VerificationCodes
     * const verificationCode = await prisma.verificationCode.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more VerificationCodes and only return the `id`
     * const verificationCodeWithIdOnly = await prisma.verificationCode.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends VerificationCodeUpdateManyAndReturnArgs>(args: SelectSubset<T, VerificationCodeUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VerificationCodePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one VerificationCode.
     * @param {VerificationCodeUpsertArgs} args - Arguments to update or create a VerificationCode.
     * @example
     * // Update or create a VerificationCode
     * const verificationCode = await prisma.verificationCode.upsert({
     *   create: {
     *     // ... data to create a VerificationCode
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the VerificationCode we want to update
     *   }
     * })
     */
    upsert<T extends VerificationCodeUpsertArgs>(args: SelectSubset<T, VerificationCodeUpsertArgs<ExtArgs>>): Prisma__VerificationCodeClient<$Result.GetResult<Prisma.$VerificationCodePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of VerificationCodes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationCodeCountArgs} args - Arguments to filter VerificationCodes to count.
     * @example
     * // Count the number of VerificationCodes
     * const count = await prisma.verificationCode.count({
     *   where: {
     *     // ... the filter for the VerificationCodes we want to count
     *   }
     * })
    **/
    count<T extends VerificationCodeCountArgs>(
      args?: Subset<T, VerificationCodeCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], VerificationCodeCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a VerificationCode.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationCodeAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends VerificationCodeAggregateArgs>(args: Subset<T, VerificationCodeAggregateArgs>): Prisma.PrismaPromise<GetVerificationCodeAggregateType<T>>

    /**
     * Group by VerificationCode.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationCodeGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends VerificationCodeGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: VerificationCodeGroupByArgs['orderBy'] }
        : { orderBy?: VerificationCodeGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, VerificationCodeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetVerificationCodeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the VerificationCode model
   */
  readonly fields: VerificationCodeFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for VerificationCode.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__VerificationCodeClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the VerificationCode model
   */
  interface VerificationCodeFieldRefs {
    readonly id: FieldRef<"VerificationCode", 'String'>
    readonly code: FieldRef<"VerificationCode", 'String'>
    readonly userId: FieldRef<"VerificationCode", 'String'>
    readonly expiresAt: FieldRef<"VerificationCode", 'DateTime'>
    readonly createdAt: FieldRef<"VerificationCode", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * VerificationCode findUnique
   */
  export type VerificationCodeFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationCode
     */
    select?: VerificationCodeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationCode
     */
    omit?: VerificationCodeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationCodeInclude<ExtArgs> | null
    /**
     * Filter, which VerificationCode to fetch.
     */
    where: VerificationCodeWhereUniqueInput
  }

  /**
   * VerificationCode findUniqueOrThrow
   */
  export type VerificationCodeFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationCode
     */
    select?: VerificationCodeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationCode
     */
    omit?: VerificationCodeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationCodeInclude<ExtArgs> | null
    /**
     * Filter, which VerificationCode to fetch.
     */
    where: VerificationCodeWhereUniqueInput
  }

  /**
   * VerificationCode findFirst
   */
  export type VerificationCodeFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationCode
     */
    select?: VerificationCodeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationCode
     */
    omit?: VerificationCodeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationCodeInclude<ExtArgs> | null
    /**
     * Filter, which VerificationCode to fetch.
     */
    where?: VerificationCodeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VerificationCodes to fetch.
     */
    orderBy?: VerificationCodeOrderByWithRelationInput | VerificationCodeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for VerificationCodes.
     */
    cursor?: VerificationCodeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VerificationCodes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VerificationCodes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of VerificationCodes.
     */
    distinct?: VerificationCodeScalarFieldEnum | VerificationCodeScalarFieldEnum[]
  }

  /**
   * VerificationCode findFirstOrThrow
   */
  export type VerificationCodeFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationCode
     */
    select?: VerificationCodeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationCode
     */
    omit?: VerificationCodeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationCodeInclude<ExtArgs> | null
    /**
     * Filter, which VerificationCode to fetch.
     */
    where?: VerificationCodeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VerificationCodes to fetch.
     */
    orderBy?: VerificationCodeOrderByWithRelationInput | VerificationCodeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for VerificationCodes.
     */
    cursor?: VerificationCodeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VerificationCodes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VerificationCodes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of VerificationCodes.
     */
    distinct?: VerificationCodeScalarFieldEnum | VerificationCodeScalarFieldEnum[]
  }

  /**
   * VerificationCode findMany
   */
  export type VerificationCodeFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationCode
     */
    select?: VerificationCodeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationCode
     */
    omit?: VerificationCodeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationCodeInclude<ExtArgs> | null
    /**
     * Filter, which VerificationCodes to fetch.
     */
    where?: VerificationCodeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VerificationCodes to fetch.
     */
    orderBy?: VerificationCodeOrderByWithRelationInput | VerificationCodeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing VerificationCodes.
     */
    cursor?: VerificationCodeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VerificationCodes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VerificationCodes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of VerificationCodes.
     */
    distinct?: VerificationCodeScalarFieldEnum | VerificationCodeScalarFieldEnum[]
  }

  /**
   * VerificationCode create
   */
  export type VerificationCodeCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationCode
     */
    select?: VerificationCodeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationCode
     */
    omit?: VerificationCodeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationCodeInclude<ExtArgs> | null
    /**
     * The data needed to create a VerificationCode.
     */
    data: XOR<VerificationCodeCreateInput, VerificationCodeUncheckedCreateInput>
  }

  /**
   * VerificationCode createMany
   */
  export type VerificationCodeCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many VerificationCodes.
     */
    data: VerificationCodeCreateManyInput | VerificationCodeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * VerificationCode createManyAndReturn
   */
  export type VerificationCodeCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationCode
     */
    select?: VerificationCodeSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationCode
     */
    omit?: VerificationCodeOmit<ExtArgs> | null
    /**
     * The data used to create many VerificationCodes.
     */
    data: VerificationCodeCreateManyInput | VerificationCodeCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationCodeIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * VerificationCode update
   */
  export type VerificationCodeUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationCode
     */
    select?: VerificationCodeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationCode
     */
    omit?: VerificationCodeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationCodeInclude<ExtArgs> | null
    /**
     * The data needed to update a VerificationCode.
     */
    data: XOR<VerificationCodeUpdateInput, VerificationCodeUncheckedUpdateInput>
    /**
     * Choose, which VerificationCode to update.
     */
    where: VerificationCodeWhereUniqueInput
  }

  /**
   * VerificationCode updateMany
   */
  export type VerificationCodeUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update VerificationCodes.
     */
    data: XOR<VerificationCodeUpdateManyMutationInput, VerificationCodeUncheckedUpdateManyInput>
    /**
     * Filter which VerificationCodes to update
     */
    where?: VerificationCodeWhereInput
    /**
     * Limit how many VerificationCodes to update.
     */
    limit?: number
  }

  /**
   * VerificationCode updateManyAndReturn
   */
  export type VerificationCodeUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationCode
     */
    select?: VerificationCodeSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationCode
     */
    omit?: VerificationCodeOmit<ExtArgs> | null
    /**
     * The data used to update VerificationCodes.
     */
    data: XOR<VerificationCodeUpdateManyMutationInput, VerificationCodeUncheckedUpdateManyInput>
    /**
     * Filter which VerificationCodes to update
     */
    where?: VerificationCodeWhereInput
    /**
     * Limit how many VerificationCodes to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationCodeIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * VerificationCode upsert
   */
  export type VerificationCodeUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationCode
     */
    select?: VerificationCodeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationCode
     */
    omit?: VerificationCodeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationCodeInclude<ExtArgs> | null
    /**
     * The filter to search for the VerificationCode to update in case it exists.
     */
    where: VerificationCodeWhereUniqueInput
    /**
     * In case the VerificationCode found by the `where` argument doesn't exist, create a new VerificationCode with this data.
     */
    create: XOR<VerificationCodeCreateInput, VerificationCodeUncheckedCreateInput>
    /**
     * In case the VerificationCode was found with the provided `where` argument, update it with this data.
     */
    update: XOR<VerificationCodeUpdateInput, VerificationCodeUncheckedUpdateInput>
  }

  /**
   * VerificationCode delete
   */
  export type VerificationCodeDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationCode
     */
    select?: VerificationCodeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationCode
     */
    omit?: VerificationCodeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationCodeInclude<ExtArgs> | null
    /**
     * Filter which VerificationCode to delete.
     */
    where: VerificationCodeWhereUniqueInput
  }

  /**
   * VerificationCode deleteMany
   */
  export type VerificationCodeDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which VerificationCodes to delete
     */
    where?: VerificationCodeWhereInput
    /**
     * Limit how many VerificationCodes to delete.
     */
    limit?: number
  }

  /**
   * VerificationCode without action
   */
  export type VerificationCodeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationCode
     */
    select?: VerificationCodeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationCode
     */
    omit?: VerificationCodeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationCodeInclude<ExtArgs> | null
  }


  /**
   * Model UserLibrary
   */

  export type AggregateUserLibrary = {
    _count: UserLibraryCountAggregateOutputType | null
    _avg: UserLibraryAvgAggregateOutputType | null
    _sum: UserLibrarySumAggregateOutputType | null
    _min: UserLibraryMinAggregateOutputType | null
    _max: UserLibraryMaxAggregateOutputType | null
  }

  export type UserLibraryAvgAggregateOutputType = {
    durationSec: number | null
  }

  export type UserLibrarySumAggregateOutputType = {
    durationSec: number | null
  }

  export type UserLibraryMinAggregateOutputType = {
    id: string | null
    userId: string | null
    trackId: string | null
    deezerId: string | null
    scUrl: string | null
    source: string | null
    title: string | null
    artistName: string | null
    artistId: string | null
    album: string | null
    coverUrl: string | null
    duration: string | null
    durationSec: number | null
    previewUrl: string | null
    isrc: string | null
    addedAt: Date | null
    updatedAt: Date | null
  }

  export type UserLibraryMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    trackId: string | null
    deezerId: string | null
    scUrl: string | null
    source: string | null
    title: string | null
    artistName: string | null
    artistId: string | null
    album: string | null
    coverUrl: string | null
    duration: string | null
    durationSec: number | null
    previewUrl: string | null
    isrc: string | null
    addedAt: Date | null
    updatedAt: Date | null
  }

  export type UserLibraryCountAggregateOutputType = {
    id: number
    userId: number
    trackId: number
    deezerId: number
    scUrl: number
    source: number
    title: number
    artistName: number
    artistId: number
    album: number
    coverUrl: number
    duration: number
    durationSec: number
    previewUrl: number
    isrc: number
    addedAt: number
    updatedAt: number
    _all: number
  }


  export type UserLibraryAvgAggregateInputType = {
    durationSec?: true
  }

  export type UserLibrarySumAggregateInputType = {
    durationSec?: true
  }

  export type UserLibraryMinAggregateInputType = {
    id?: true
    userId?: true
    trackId?: true
    deezerId?: true
    scUrl?: true
    source?: true
    title?: true
    artistName?: true
    artistId?: true
    album?: true
    coverUrl?: true
    duration?: true
    durationSec?: true
    previewUrl?: true
    isrc?: true
    addedAt?: true
    updatedAt?: true
  }

  export type UserLibraryMaxAggregateInputType = {
    id?: true
    userId?: true
    trackId?: true
    deezerId?: true
    scUrl?: true
    source?: true
    title?: true
    artistName?: true
    artistId?: true
    album?: true
    coverUrl?: true
    duration?: true
    durationSec?: true
    previewUrl?: true
    isrc?: true
    addedAt?: true
    updatedAt?: true
  }

  export type UserLibraryCountAggregateInputType = {
    id?: true
    userId?: true
    trackId?: true
    deezerId?: true
    scUrl?: true
    source?: true
    title?: true
    artistName?: true
    artistId?: true
    album?: true
    coverUrl?: true
    duration?: true
    durationSec?: true
    previewUrl?: true
    isrc?: true
    addedAt?: true
    updatedAt?: true
    _all?: true
  }

  export type UserLibraryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which UserLibrary to aggregate.
     */
    where?: UserLibraryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserLibraries to fetch.
     */
    orderBy?: UserLibraryOrderByWithRelationInput | UserLibraryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserLibraryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserLibraries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserLibraries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned UserLibraries
    **/
    _count?: true | UserLibraryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: UserLibraryAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: UserLibrarySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserLibraryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserLibraryMaxAggregateInputType
  }

  export type GetUserLibraryAggregateType<T extends UserLibraryAggregateArgs> = {
        [P in keyof T & keyof AggregateUserLibrary]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUserLibrary[P]>
      : GetScalarType<T[P], AggregateUserLibrary[P]>
  }




  export type UserLibraryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserLibraryWhereInput
    orderBy?: UserLibraryOrderByWithAggregationInput | UserLibraryOrderByWithAggregationInput[]
    by: UserLibraryScalarFieldEnum[] | UserLibraryScalarFieldEnum
    having?: UserLibraryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserLibraryCountAggregateInputType | true
    _avg?: UserLibraryAvgAggregateInputType
    _sum?: UserLibrarySumAggregateInputType
    _min?: UserLibraryMinAggregateInputType
    _max?: UserLibraryMaxAggregateInputType
  }

  export type UserLibraryGroupByOutputType = {
    id: string
    userId: string
    trackId: string | null
    deezerId: string | null
    scUrl: string | null
    source: string
    title: string
    artistName: string
    artistId: string | null
    album: string | null
    coverUrl: string | null
    duration: string
    durationSec: number
    previewUrl: string | null
    isrc: string | null
    addedAt: Date
    updatedAt: Date
    _count: UserLibraryCountAggregateOutputType | null
    _avg: UserLibraryAvgAggregateOutputType | null
    _sum: UserLibrarySumAggregateOutputType | null
    _min: UserLibraryMinAggregateOutputType | null
    _max: UserLibraryMaxAggregateOutputType | null
  }

  type GetUserLibraryGroupByPayload<T extends UserLibraryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserLibraryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserLibraryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserLibraryGroupByOutputType[P]>
            : GetScalarType<T[P], UserLibraryGroupByOutputType[P]>
        }
      >
    >


  export type UserLibrarySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    trackId?: boolean
    deezerId?: boolean
    scUrl?: boolean
    source?: boolean
    title?: boolean
    artistName?: boolean
    artistId?: boolean
    album?: boolean
    coverUrl?: boolean
    duration?: boolean
    durationSec?: boolean
    previewUrl?: boolean
    isrc?: boolean
    addedAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["userLibrary"]>

  export type UserLibrarySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    trackId?: boolean
    deezerId?: boolean
    scUrl?: boolean
    source?: boolean
    title?: boolean
    artistName?: boolean
    artistId?: boolean
    album?: boolean
    coverUrl?: boolean
    duration?: boolean
    durationSec?: boolean
    previewUrl?: boolean
    isrc?: boolean
    addedAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["userLibrary"]>

  export type UserLibrarySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    trackId?: boolean
    deezerId?: boolean
    scUrl?: boolean
    source?: boolean
    title?: boolean
    artistName?: boolean
    artistId?: boolean
    album?: boolean
    coverUrl?: boolean
    duration?: boolean
    durationSec?: boolean
    previewUrl?: boolean
    isrc?: boolean
    addedAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["userLibrary"]>

  export type UserLibrarySelectScalar = {
    id?: boolean
    userId?: boolean
    trackId?: boolean
    deezerId?: boolean
    scUrl?: boolean
    source?: boolean
    title?: boolean
    artistName?: boolean
    artistId?: boolean
    album?: boolean
    coverUrl?: boolean
    duration?: boolean
    durationSec?: boolean
    previewUrl?: boolean
    isrc?: boolean
    addedAt?: boolean
    updatedAt?: boolean
  }

  export type UserLibraryOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "trackId" | "deezerId" | "scUrl" | "source" | "title" | "artistName" | "artistId" | "album" | "coverUrl" | "duration" | "durationSec" | "previewUrl" | "isrc" | "addedAt" | "updatedAt", ExtArgs["result"]["userLibrary"]>
  export type UserLibraryInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type UserLibraryIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type UserLibraryIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $UserLibraryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "UserLibrary"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      trackId: string | null
      deezerId: string | null
      scUrl: string | null
      source: string
      title: string
      artistName: string
      artistId: string | null
      album: string | null
      coverUrl: string | null
      duration: string
      durationSec: number
      previewUrl: string | null
      isrc: string | null
      addedAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["userLibrary"]>
    composites: {}
  }

  type UserLibraryGetPayload<S extends boolean | null | undefined | UserLibraryDefaultArgs> = $Result.GetResult<Prisma.$UserLibraryPayload, S>

  type UserLibraryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserLibraryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserLibraryCountAggregateInputType | true
    }

  export interface UserLibraryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['UserLibrary'], meta: { name: 'UserLibrary' } }
    /**
     * Find zero or one UserLibrary that matches the filter.
     * @param {UserLibraryFindUniqueArgs} args - Arguments to find a UserLibrary
     * @example
     * // Get one UserLibrary
     * const userLibrary = await prisma.userLibrary.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserLibraryFindUniqueArgs>(args: SelectSubset<T, UserLibraryFindUniqueArgs<ExtArgs>>): Prisma__UserLibraryClient<$Result.GetResult<Prisma.$UserLibraryPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one UserLibrary that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserLibraryFindUniqueOrThrowArgs} args - Arguments to find a UserLibrary
     * @example
     * // Get one UserLibrary
     * const userLibrary = await prisma.userLibrary.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserLibraryFindUniqueOrThrowArgs>(args: SelectSubset<T, UserLibraryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserLibraryClient<$Result.GetResult<Prisma.$UserLibraryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first UserLibrary that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserLibraryFindFirstArgs} args - Arguments to find a UserLibrary
     * @example
     * // Get one UserLibrary
     * const userLibrary = await prisma.userLibrary.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserLibraryFindFirstArgs>(args?: SelectSubset<T, UserLibraryFindFirstArgs<ExtArgs>>): Prisma__UserLibraryClient<$Result.GetResult<Prisma.$UserLibraryPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first UserLibrary that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserLibraryFindFirstOrThrowArgs} args - Arguments to find a UserLibrary
     * @example
     * // Get one UserLibrary
     * const userLibrary = await prisma.userLibrary.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserLibraryFindFirstOrThrowArgs>(args?: SelectSubset<T, UserLibraryFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserLibraryClient<$Result.GetResult<Prisma.$UserLibraryPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more UserLibraries that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserLibraryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all UserLibraries
     * const userLibraries = await prisma.userLibrary.findMany()
     * 
     * // Get first 10 UserLibraries
     * const userLibraries = await prisma.userLibrary.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userLibraryWithIdOnly = await prisma.userLibrary.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserLibraryFindManyArgs>(args?: SelectSubset<T, UserLibraryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserLibraryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a UserLibrary.
     * @param {UserLibraryCreateArgs} args - Arguments to create a UserLibrary.
     * @example
     * // Create one UserLibrary
     * const UserLibrary = await prisma.userLibrary.create({
     *   data: {
     *     // ... data to create a UserLibrary
     *   }
     * })
     * 
     */
    create<T extends UserLibraryCreateArgs>(args: SelectSubset<T, UserLibraryCreateArgs<ExtArgs>>): Prisma__UserLibraryClient<$Result.GetResult<Prisma.$UserLibraryPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many UserLibraries.
     * @param {UserLibraryCreateManyArgs} args - Arguments to create many UserLibraries.
     * @example
     * // Create many UserLibraries
     * const userLibrary = await prisma.userLibrary.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserLibraryCreateManyArgs>(args?: SelectSubset<T, UserLibraryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many UserLibraries and returns the data saved in the database.
     * @param {UserLibraryCreateManyAndReturnArgs} args - Arguments to create many UserLibraries.
     * @example
     * // Create many UserLibraries
     * const userLibrary = await prisma.userLibrary.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many UserLibraries and only return the `id`
     * const userLibraryWithIdOnly = await prisma.userLibrary.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserLibraryCreateManyAndReturnArgs>(args?: SelectSubset<T, UserLibraryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserLibraryPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a UserLibrary.
     * @param {UserLibraryDeleteArgs} args - Arguments to delete one UserLibrary.
     * @example
     * // Delete one UserLibrary
     * const UserLibrary = await prisma.userLibrary.delete({
     *   where: {
     *     // ... filter to delete one UserLibrary
     *   }
     * })
     * 
     */
    delete<T extends UserLibraryDeleteArgs>(args: SelectSubset<T, UserLibraryDeleteArgs<ExtArgs>>): Prisma__UserLibraryClient<$Result.GetResult<Prisma.$UserLibraryPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one UserLibrary.
     * @param {UserLibraryUpdateArgs} args - Arguments to update one UserLibrary.
     * @example
     * // Update one UserLibrary
     * const userLibrary = await prisma.userLibrary.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserLibraryUpdateArgs>(args: SelectSubset<T, UserLibraryUpdateArgs<ExtArgs>>): Prisma__UserLibraryClient<$Result.GetResult<Prisma.$UserLibraryPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more UserLibraries.
     * @param {UserLibraryDeleteManyArgs} args - Arguments to filter UserLibraries to delete.
     * @example
     * // Delete a few UserLibraries
     * const { count } = await prisma.userLibrary.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserLibraryDeleteManyArgs>(args?: SelectSubset<T, UserLibraryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more UserLibraries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserLibraryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many UserLibraries
     * const userLibrary = await prisma.userLibrary.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserLibraryUpdateManyArgs>(args: SelectSubset<T, UserLibraryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more UserLibraries and returns the data updated in the database.
     * @param {UserLibraryUpdateManyAndReturnArgs} args - Arguments to update many UserLibraries.
     * @example
     * // Update many UserLibraries
     * const userLibrary = await prisma.userLibrary.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more UserLibraries and only return the `id`
     * const userLibraryWithIdOnly = await prisma.userLibrary.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UserLibraryUpdateManyAndReturnArgs>(args: SelectSubset<T, UserLibraryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserLibraryPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one UserLibrary.
     * @param {UserLibraryUpsertArgs} args - Arguments to update or create a UserLibrary.
     * @example
     * // Update or create a UserLibrary
     * const userLibrary = await prisma.userLibrary.upsert({
     *   create: {
     *     // ... data to create a UserLibrary
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the UserLibrary we want to update
     *   }
     * })
     */
    upsert<T extends UserLibraryUpsertArgs>(args: SelectSubset<T, UserLibraryUpsertArgs<ExtArgs>>): Prisma__UserLibraryClient<$Result.GetResult<Prisma.$UserLibraryPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of UserLibraries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserLibraryCountArgs} args - Arguments to filter UserLibraries to count.
     * @example
     * // Count the number of UserLibraries
     * const count = await prisma.userLibrary.count({
     *   where: {
     *     // ... the filter for the UserLibraries we want to count
     *   }
     * })
    **/
    count<T extends UserLibraryCountArgs>(
      args?: Subset<T, UserLibraryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserLibraryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a UserLibrary.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserLibraryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserLibraryAggregateArgs>(args: Subset<T, UserLibraryAggregateArgs>): Prisma.PrismaPromise<GetUserLibraryAggregateType<T>>

    /**
     * Group by UserLibrary.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserLibraryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserLibraryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserLibraryGroupByArgs['orderBy'] }
        : { orderBy?: UserLibraryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserLibraryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserLibraryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the UserLibrary model
   */
  readonly fields: UserLibraryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for UserLibrary.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserLibraryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the UserLibrary model
   */
  interface UserLibraryFieldRefs {
    readonly id: FieldRef<"UserLibrary", 'String'>
    readonly userId: FieldRef<"UserLibrary", 'String'>
    readonly trackId: FieldRef<"UserLibrary", 'String'>
    readonly deezerId: FieldRef<"UserLibrary", 'String'>
    readonly scUrl: FieldRef<"UserLibrary", 'String'>
    readonly source: FieldRef<"UserLibrary", 'String'>
    readonly title: FieldRef<"UserLibrary", 'String'>
    readonly artistName: FieldRef<"UserLibrary", 'String'>
    readonly artistId: FieldRef<"UserLibrary", 'String'>
    readonly album: FieldRef<"UserLibrary", 'String'>
    readonly coverUrl: FieldRef<"UserLibrary", 'String'>
    readonly duration: FieldRef<"UserLibrary", 'String'>
    readonly durationSec: FieldRef<"UserLibrary", 'Int'>
    readonly previewUrl: FieldRef<"UserLibrary", 'String'>
    readonly isrc: FieldRef<"UserLibrary", 'String'>
    readonly addedAt: FieldRef<"UserLibrary", 'DateTime'>
    readonly updatedAt: FieldRef<"UserLibrary", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * UserLibrary findUnique
   */
  export type UserLibraryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserLibrary
     */
    select?: UserLibrarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserLibrary
     */
    omit?: UserLibraryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserLibraryInclude<ExtArgs> | null
    /**
     * Filter, which UserLibrary to fetch.
     */
    where: UserLibraryWhereUniqueInput
  }

  /**
   * UserLibrary findUniqueOrThrow
   */
  export type UserLibraryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserLibrary
     */
    select?: UserLibrarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserLibrary
     */
    omit?: UserLibraryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserLibraryInclude<ExtArgs> | null
    /**
     * Filter, which UserLibrary to fetch.
     */
    where: UserLibraryWhereUniqueInput
  }

  /**
   * UserLibrary findFirst
   */
  export type UserLibraryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserLibrary
     */
    select?: UserLibrarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserLibrary
     */
    omit?: UserLibraryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserLibraryInclude<ExtArgs> | null
    /**
     * Filter, which UserLibrary to fetch.
     */
    where?: UserLibraryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserLibraries to fetch.
     */
    orderBy?: UserLibraryOrderByWithRelationInput | UserLibraryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for UserLibraries.
     */
    cursor?: UserLibraryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserLibraries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserLibraries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of UserLibraries.
     */
    distinct?: UserLibraryScalarFieldEnum | UserLibraryScalarFieldEnum[]
  }

  /**
   * UserLibrary findFirstOrThrow
   */
  export type UserLibraryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserLibrary
     */
    select?: UserLibrarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserLibrary
     */
    omit?: UserLibraryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserLibraryInclude<ExtArgs> | null
    /**
     * Filter, which UserLibrary to fetch.
     */
    where?: UserLibraryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserLibraries to fetch.
     */
    orderBy?: UserLibraryOrderByWithRelationInput | UserLibraryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for UserLibraries.
     */
    cursor?: UserLibraryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserLibraries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserLibraries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of UserLibraries.
     */
    distinct?: UserLibraryScalarFieldEnum | UserLibraryScalarFieldEnum[]
  }

  /**
   * UserLibrary findMany
   */
  export type UserLibraryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserLibrary
     */
    select?: UserLibrarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserLibrary
     */
    omit?: UserLibraryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserLibraryInclude<ExtArgs> | null
    /**
     * Filter, which UserLibraries to fetch.
     */
    where?: UserLibraryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserLibraries to fetch.
     */
    orderBy?: UserLibraryOrderByWithRelationInput | UserLibraryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing UserLibraries.
     */
    cursor?: UserLibraryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserLibraries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserLibraries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of UserLibraries.
     */
    distinct?: UserLibraryScalarFieldEnum | UserLibraryScalarFieldEnum[]
  }

  /**
   * UserLibrary create
   */
  export type UserLibraryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserLibrary
     */
    select?: UserLibrarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserLibrary
     */
    omit?: UserLibraryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserLibraryInclude<ExtArgs> | null
    /**
     * The data needed to create a UserLibrary.
     */
    data: XOR<UserLibraryCreateInput, UserLibraryUncheckedCreateInput>
  }

  /**
   * UserLibrary createMany
   */
  export type UserLibraryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many UserLibraries.
     */
    data: UserLibraryCreateManyInput | UserLibraryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * UserLibrary createManyAndReturn
   */
  export type UserLibraryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserLibrary
     */
    select?: UserLibrarySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the UserLibrary
     */
    omit?: UserLibraryOmit<ExtArgs> | null
    /**
     * The data used to create many UserLibraries.
     */
    data: UserLibraryCreateManyInput | UserLibraryCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserLibraryIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * UserLibrary update
   */
  export type UserLibraryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserLibrary
     */
    select?: UserLibrarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserLibrary
     */
    omit?: UserLibraryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserLibraryInclude<ExtArgs> | null
    /**
     * The data needed to update a UserLibrary.
     */
    data: XOR<UserLibraryUpdateInput, UserLibraryUncheckedUpdateInput>
    /**
     * Choose, which UserLibrary to update.
     */
    where: UserLibraryWhereUniqueInput
  }

  /**
   * UserLibrary updateMany
   */
  export type UserLibraryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update UserLibraries.
     */
    data: XOR<UserLibraryUpdateManyMutationInput, UserLibraryUncheckedUpdateManyInput>
    /**
     * Filter which UserLibraries to update
     */
    where?: UserLibraryWhereInput
    /**
     * Limit how many UserLibraries to update.
     */
    limit?: number
  }

  /**
   * UserLibrary updateManyAndReturn
   */
  export type UserLibraryUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserLibrary
     */
    select?: UserLibrarySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the UserLibrary
     */
    omit?: UserLibraryOmit<ExtArgs> | null
    /**
     * The data used to update UserLibraries.
     */
    data: XOR<UserLibraryUpdateManyMutationInput, UserLibraryUncheckedUpdateManyInput>
    /**
     * Filter which UserLibraries to update
     */
    where?: UserLibraryWhereInput
    /**
     * Limit how many UserLibraries to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserLibraryIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * UserLibrary upsert
   */
  export type UserLibraryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserLibrary
     */
    select?: UserLibrarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserLibrary
     */
    omit?: UserLibraryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserLibraryInclude<ExtArgs> | null
    /**
     * The filter to search for the UserLibrary to update in case it exists.
     */
    where: UserLibraryWhereUniqueInput
    /**
     * In case the UserLibrary found by the `where` argument doesn't exist, create a new UserLibrary with this data.
     */
    create: XOR<UserLibraryCreateInput, UserLibraryUncheckedCreateInput>
    /**
     * In case the UserLibrary was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserLibraryUpdateInput, UserLibraryUncheckedUpdateInput>
  }

  /**
   * UserLibrary delete
   */
  export type UserLibraryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserLibrary
     */
    select?: UserLibrarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserLibrary
     */
    omit?: UserLibraryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserLibraryInclude<ExtArgs> | null
    /**
     * Filter which UserLibrary to delete.
     */
    where: UserLibraryWhereUniqueInput
  }

  /**
   * UserLibrary deleteMany
   */
  export type UserLibraryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which UserLibraries to delete
     */
    where?: UserLibraryWhereInput
    /**
     * Limit how many UserLibraries to delete.
     */
    limit?: number
  }

  /**
   * UserLibrary without action
   */
  export type UserLibraryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserLibrary
     */
    select?: UserLibrarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserLibrary
     */
    omit?: UserLibraryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserLibraryInclude<ExtArgs> | null
  }


  /**
   * Model UserRecentlyPlayed
   */

  export type AggregateUserRecentlyPlayed = {
    _count: UserRecentlyPlayedCountAggregateOutputType | null
    _avg: UserRecentlyPlayedAvgAggregateOutputType | null
    _sum: UserRecentlyPlayedSumAggregateOutputType | null
    _min: UserRecentlyPlayedMinAggregateOutputType | null
    _max: UserRecentlyPlayedMaxAggregateOutputType | null
  }

  export type UserRecentlyPlayedAvgAggregateOutputType = {
    durationSec: number | null
  }

  export type UserRecentlyPlayedSumAggregateOutputType = {
    durationSec: number | null
  }

  export type UserRecentlyPlayedMinAggregateOutputType = {
    id: string | null
    userId: string | null
    trackId: string | null
    deezerId: string | null
    scUrl: string | null
    source: string | null
    title: string | null
    artistName: string | null
    artistId: string | null
    album: string | null
    coverUrl: string | null
    duration: string | null
    durationSec: number | null
    previewUrl: string | null
    isrc: string | null
    playedAt: Date | null
    updatedAt: Date | null
  }

  export type UserRecentlyPlayedMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    trackId: string | null
    deezerId: string | null
    scUrl: string | null
    source: string | null
    title: string | null
    artistName: string | null
    artistId: string | null
    album: string | null
    coverUrl: string | null
    duration: string | null
    durationSec: number | null
    previewUrl: string | null
    isrc: string | null
    playedAt: Date | null
    updatedAt: Date | null
  }

  export type UserRecentlyPlayedCountAggregateOutputType = {
    id: number
    userId: number
    trackId: number
    deezerId: number
    scUrl: number
    source: number
    title: number
    artistName: number
    artistId: number
    album: number
    coverUrl: number
    duration: number
    durationSec: number
    previewUrl: number
    isrc: number
    playedAt: number
    updatedAt: number
    _all: number
  }


  export type UserRecentlyPlayedAvgAggregateInputType = {
    durationSec?: true
  }

  export type UserRecentlyPlayedSumAggregateInputType = {
    durationSec?: true
  }

  export type UserRecentlyPlayedMinAggregateInputType = {
    id?: true
    userId?: true
    trackId?: true
    deezerId?: true
    scUrl?: true
    source?: true
    title?: true
    artistName?: true
    artistId?: true
    album?: true
    coverUrl?: true
    duration?: true
    durationSec?: true
    previewUrl?: true
    isrc?: true
    playedAt?: true
    updatedAt?: true
  }

  export type UserRecentlyPlayedMaxAggregateInputType = {
    id?: true
    userId?: true
    trackId?: true
    deezerId?: true
    scUrl?: true
    source?: true
    title?: true
    artistName?: true
    artistId?: true
    album?: true
    coverUrl?: true
    duration?: true
    durationSec?: true
    previewUrl?: true
    isrc?: true
    playedAt?: true
    updatedAt?: true
  }

  export type UserRecentlyPlayedCountAggregateInputType = {
    id?: true
    userId?: true
    trackId?: true
    deezerId?: true
    scUrl?: true
    source?: true
    title?: true
    artistName?: true
    artistId?: true
    album?: true
    coverUrl?: true
    duration?: true
    durationSec?: true
    previewUrl?: true
    isrc?: true
    playedAt?: true
    updatedAt?: true
    _all?: true
  }

  export type UserRecentlyPlayedAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which UserRecentlyPlayed to aggregate.
     */
    where?: UserRecentlyPlayedWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserRecentlyPlayeds to fetch.
     */
    orderBy?: UserRecentlyPlayedOrderByWithRelationInput | UserRecentlyPlayedOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserRecentlyPlayedWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserRecentlyPlayeds from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserRecentlyPlayeds.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned UserRecentlyPlayeds
    **/
    _count?: true | UserRecentlyPlayedCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: UserRecentlyPlayedAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: UserRecentlyPlayedSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserRecentlyPlayedMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserRecentlyPlayedMaxAggregateInputType
  }

  export type GetUserRecentlyPlayedAggregateType<T extends UserRecentlyPlayedAggregateArgs> = {
        [P in keyof T & keyof AggregateUserRecentlyPlayed]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUserRecentlyPlayed[P]>
      : GetScalarType<T[P], AggregateUserRecentlyPlayed[P]>
  }




  export type UserRecentlyPlayedGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserRecentlyPlayedWhereInput
    orderBy?: UserRecentlyPlayedOrderByWithAggregationInput | UserRecentlyPlayedOrderByWithAggregationInput[]
    by: UserRecentlyPlayedScalarFieldEnum[] | UserRecentlyPlayedScalarFieldEnum
    having?: UserRecentlyPlayedScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserRecentlyPlayedCountAggregateInputType | true
    _avg?: UserRecentlyPlayedAvgAggregateInputType
    _sum?: UserRecentlyPlayedSumAggregateInputType
    _min?: UserRecentlyPlayedMinAggregateInputType
    _max?: UserRecentlyPlayedMaxAggregateInputType
  }

  export type UserRecentlyPlayedGroupByOutputType = {
    id: string
    userId: string
    trackId: string | null
    deezerId: string | null
    scUrl: string | null
    source: string
    title: string
    artistName: string
    artistId: string | null
    album: string | null
    coverUrl: string | null
    duration: string
    durationSec: number
    previewUrl: string | null
    isrc: string | null
    playedAt: Date
    updatedAt: Date
    _count: UserRecentlyPlayedCountAggregateOutputType | null
    _avg: UserRecentlyPlayedAvgAggregateOutputType | null
    _sum: UserRecentlyPlayedSumAggregateOutputType | null
    _min: UserRecentlyPlayedMinAggregateOutputType | null
    _max: UserRecentlyPlayedMaxAggregateOutputType | null
  }

  type GetUserRecentlyPlayedGroupByPayload<T extends UserRecentlyPlayedGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserRecentlyPlayedGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserRecentlyPlayedGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserRecentlyPlayedGroupByOutputType[P]>
            : GetScalarType<T[P], UserRecentlyPlayedGroupByOutputType[P]>
        }
      >
    >


  export type UserRecentlyPlayedSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    trackId?: boolean
    deezerId?: boolean
    scUrl?: boolean
    source?: boolean
    title?: boolean
    artistName?: boolean
    artistId?: boolean
    album?: boolean
    coverUrl?: boolean
    duration?: boolean
    durationSec?: boolean
    previewUrl?: boolean
    isrc?: boolean
    playedAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["userRecentlyPlayed"]>

  export type UserRecentlyPlayedSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    trackId?: boolean
    deezerId?: boolean
    scUrl?: boolean
    source?: boolean
    title?: boolean
    artistName?: boolean
    artistId?: boolean
    album?: boolean
    coverUrl?: boolean
    duration?: boolean
    durationSec?: boolean
    previewUrl?: boolean
    isrc?: boolean
    playedAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["userRecentlyPlayed"]>

  export type UserRecentlyPlayedSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    trackId?: boolean
    deezerId?: boolean
    scUrl?: boolean
    source?: boolean
    title?: boolean
    artistName?: boolean
    artistId?: boolean
    album?: boolean
    coverUrl?: boolean
    duration?: boolean
    durationSec?: boolean
    previewUrl?: boolean
    isrc?: boolean
    playedAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["userRecentlyPlayed"]>

  export type UserRecentlyPlayedSelectScalar = {
    id?: boolean
    userId?: boolean
    trackId?: boolean
    deezerId?: boolean
    scUrl?: boolean
    source?: boolean
    title?: boolean
    artistName?: boolean
    artistId?: boolean
    album?: boolean
    coverUrl?: boolean
    duration?: boolean
    durationSec?: boolean
    previewUrl?: boolean
    isrc?: boolean
    playedAt?: boolean
    updatedAt?: boolean
  }

  export type UserRecentlyPlayedOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "trackId" | "deezerId" | "scUrl" | "source" | "title" | "artistName" | "artistId" | "album" | "coverUrl" | "duration" | "durationSec" | "previewUrl" | "isrc" | "playedAt" | "updatedAt", ExtArgs["result"]["userRecentlyPlayed"]>
  export type UserRecentlyPlayedInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type UserRecentlyPlayedIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type UserRecentlyPlayedIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $UserRecentlyPlayedPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "UserRecentlyPlayed"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      trackId: string | null
      deezerId: string | null
      scUrl: string | null
      source: string
      title: string
      artistName: string
      artistId: string | null
      album: string | null
      coverUrl: string | null
      duration: string
      durationSec: number
      previewUrl: string | null
      isrc: string | null
      playedAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["userRecentlyPlayed"]>
    composites: {}
  }

  type UserRecentlyPlayedGetPayload<S extends boolean | null | undefined | UserRecentlyPlayedDefaultArgs> = $Result.GetResult<Prisma.$UserRecentlyPlayedPayload, S>

  type UserRecentlyPlayedCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserRecentlyPlayedFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserRecentlyPlayedCountAggregateInputType | true
    }

  export interface UserRecentlyPlayedDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['UserRecentlyPlayed'], meta: { name: 'UserRecentlyPlayed' } }
    /**
     * Find zero or one UserRecentlyPlayed that matches the filter.
     * @param {UserRecentlyPlayedFindUniqueArgs} args - Arguments to find a UserRecentlyPlayed
     * @example
     * // Get one UserRecentlyPlayed
     * const userRecentlyPlayed = await prisma.userRecentlyPlayed.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserRecentlyPlayedFindUniqueArgs>(args: SelectSubset<T, UserRecentlyPlayedFindUniqueArgs<ExtArgs>>): Prisma__UserRecentlyPlayedClient<$Result.GetResult<Prisma.$UserRecentlyPlayedPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one UserRecentlyPlayed that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserRecentlyPlayedFindUniqueOrThrowArgs} args - Arguments to find a UserRecentlyPlayed
     * @example
     * // Get one UserRecentlyPlayed
     * const userRecentlyPlayed = await prisma.userRecentlyPlayed.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserRecentlyPlayedFindUniqueOrThrowArgs>(args: SelectSubset<T, UserRecentlyPlayedFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserRecentlyPlayedClient<$Result.GetResult<Prisma.$UserRecentlyPlayedPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first UserRecentlyPlayed that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserRecentlyPlayedFindFirstArgs} args - Arguments to find a UserRecentlyPlayed
     * @example
     * // Get one UserRecentlyPlayed
     * const userRecentlyPlayed = await prisma.userRecentlyPlayed.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserRecentlyPlayedFindFirstArgs>(args?: SelectSubset<T, UserRecentlyPlayedFindFirstArgs<ExtArgs>>): Prisma__UserRecentlyPlayedClient<$Result.GetResult<Prisma.$UserRecentlyPlayedPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first UserRecentlyPlayed that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserRecentlyPlayedFindFirstOrThrowArgs} args - Arguments to find a UserRecentlyPlayed
     * @example
     * // Get one UserRecentlyPlayed
     * const userRecentlyPlayed = await prisma.userRecentlyPlayed.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserRecentlyPlayedFindFirstOrThrowArgs>(args?: SelectSubset<T, UserRecentlyPlayedFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserRecentlyPlayedClient<$Result.GetResult<Prisma.$UserRecentlyPlayedPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more UserRecentlyPlayeds that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserRecentlyPlayedFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all UserRecentlyPlayeds
     * const userRecentlyPlayeds = await prisma.userRecentlyPlayed.findMany()
     * 
     * // Get first 10 UserRecentlyPlayeds
     * const userRecentlyPlayeds = await prisma.userRecentlyPlayed.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userRecentlyPlayedWithIdOnly = await prisma.userRecentlyPlayed.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserRecentlyPlayedFindManyArgs>(args?: SelectSubset<T, UserRecentlyPlayedFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserRecentlyPlayedPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a UserRecentlyPlayed.
     * @param {UserRecentlyPlayedCreateArgs} args - Arguments to create a UserRecentlyPlayed.
     * @example
     * // Create one UserRecentlyPlayed
     * const UserRecentlyPlayed = await prisma.userRecentlyPlayed.create({
     *   data: {
     *     // ... data to create a UserRecentlyPlayed
     *   }
     * })
     * 
     */
    create<T extends UserRecentlyPlayedCreateArgs>(args: SelectSubset<T, UserRecentlyPlayedCreateArgs<ExtArgs>>): Prisma__UserRecentlyPlayedClient<$Result.GetResult<Prisma.$UserRecentlyPlayedPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many UserRecentlyPlayeds.
     * @param {UserRecentlyPlayedCreateManyArgs} args - Arguments to create many UserRecentlyPlayeds.
     * @example
     * // Create many UserRecentlyPlayeds
     * const userRecentlyPlayed = await prisma.userRecentlyPlayed.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserRecentlyPlayedCreateManyArgs>(args?: SelectSubset<T, UserRecentlyPlayedCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many UserRecentlyPlayeds and returns the data saved in the database.
     * @param {UserRecentlyPlayedCreateManyAndReturnArgs} args - Arguments to create many UserRecentlyPlayeds.
     * @example
     * // Create many UserRecentlyPlayeds
     * const userRecentlyPlayed = await prisma.userRecentlyPlayed.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many UserRecentlyPlayeds and only return the `id`
     * const userRecentlyPlayedWithIdOnly = await prisma.userRecentlyPlayed.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserRecentlyPlayedCreateManyAndReturnArgs>(args?: SelectSubset<T, UserRecentlyPlayedCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserRecentlyPlayedPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a UserRecentlyPlayed.
     * @param {UserRecentlyPlayedDeleteArgs} args - Arguments to delete one UserRecentlyPlayed.
     * @example
     * // Delete one UserRecentlyPlayed
     * const UserRecentlyPlayed = await prisma.userRecentlyPlayed.delete({
     *   where: {
     *     // ... filter to delete one UserRecentlyPlayed
     *   }
     * })
     * 
     */
    delete<T extends UserRecentlyPlayedDeleteArgs>(args: SelectSubset<T, UserRecentlyPlayedDeleteArgs<ExtArgs>>): Prisma__UserRecentlyPlayedClient<$Result.GetResult<Prisma.$UserRecentlyPlayedPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one UserRecentlyPlayed.
     * @param {UserRecentlyPlayedUpdateArgs} args - Arguments to update one UserRecentlyPlayed.
     * @example
     * // Update one UserRecentlyPlayed
     * const userRecentlyPlayed = await prisma.userRecentlyPlayed.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserRecentlyPlayedUpdateArgs>(args: SelectSubset<T, UserRecentlyPlayedUpdateArgs<ExtArgs>>): Prisma__UserRecentlyPlayedClient<$Result.GetResult<Prisma.$UserRecentlyPlayedPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more UserRecentlyPlayeds.
     * @param {UserRecentlyPlayedDeleteManyArgs} args - Arguments to filter UserRecentlyPlayeds to delete.
     * @example
     * // Delete a few UserRecentlyPlayeds
     * const { count } = await prisma.userRecentlyPlayed.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserRecentlyPlayedDeleteManyArgs>(args?: SelectSubset<T, UserRecentlyPlayedDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more UserRecentlyPlayeds.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserRecentlyPlayedUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many UserRecentlyPlayeds
     * const userRecentlyPlayed = await prisma.userRecentlyPlayed.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserRecentlyPlayedUpdateManyArgs>(args: SelectSubset<T, UserRecentlyPlayedUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more UserRecentlyPlayeds and returns the data updated in the database.
     * @param {UserRecentlyPlayedUpdateManyAndReturnArgs} args - Arguments to update many UserRecentlyPlayeds.
     * @example
     * // Update many UserRecentlyPlayeds
     * const userRecentlyPlayed = await prisma.userRecentlyPlayed.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more UserRecentlyPlayeds and only return the `id`
     * const userRecentlyPlayedWithIdOnly = await prisma.userRecentlyPlayed.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UserRecentlyPlayedUpdateManyAndReturnArgs>(args: SelectSubset<T, UserRecentlyPlayedUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserRecentlyPlayedPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one UserRecentlyPlayed.
     * @param {UserRecentlyPlayedUpsertArgs} args - Arguments to update or create a UserRecentlyPlayed.
     * @example
     * // Update or create a UserRecentlyPlayed
     * const userRecentlyPlayed = await prisma.userRecentlyPlayed.upsert({
     *   create: {
     *     // ... data to create a UserRecentlyPlayed
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the UserRecentlyPlayed we want to update
     *   }
     * })
     */
    upsert<T extends UserRecentlyPlayedUpsertArgs>(args: SelectSubset<T, UserRecentlyPlayedUpsertArgs<ExtArgs>>): Prisma__UserRecentlyPlayedClient<$Result.GetResult<Prisma.$UserRecentlyPlayedPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of UserRecentlyPlayeds.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserRecentlyPlayedCountArgs} args - Arguments to filter UserRecentlyPlayeds to count.
     * @example
     * // Count the number of UserRecentlyPlayeds
     * const count = await prisma.userRecentlyPlayed.count({
     *   where: {
     *     // ... the filter for the UserRecentlyPlayeds we want to count
     *   }
     * })
    **/
    count<T extends UserRecentlyPlayedCountArgs>(
      args?: Subset<T, UserRecentlyPlayedCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserRecentlyPlayedCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a UserRecentlyPlayed.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserRecentlyPlayedAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserRecentlyPlayedAggregateArgs>(args: Subset<T, UserRecentlyPlayedAggregateArgs>): Prisma.PrismaPromise<GetUserRecentlyPlayedAggregateType<T>>

    /**
     * Group by UserRecentlyPlayed.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserRecentlyPlayedGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserRecentlyPlayedGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserRecentlyPlayedGroupByArgs['orderBy'] }
        : { orderBy?: UserRecentlyPlayedGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserRecentlyPlayedGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserRecentlyPlayedGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the UserRecentlyPlayed model
   */
  readonly fields: UserRecentlyPlayedFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for UserRecentlyPlayed.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserRecentlyPlayedClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the UserRecentlyPlayed model
   */
  interface UserRecentlyPlayedFieldRefs {
    readonly id: FieldRef<"UserRecentlyPlayed", 'String'>
    readonly userId: FieldRef<"UserRecentlyPlayed", 'String'>
    readonly trackId: FieldRef<"UserRecentlyPlayed", 'String'>
    readonly deezerId: FieldRef<"UserRecentlyPlayed", 'String'>
    readonly scUrl: FieldRef<"UserRecentlyPlayed", 'String'>
    readonly source: FieldRef<"UserRecentlyPlayed", 'String'>
    readonly title: FieldRef<"UserRecentlyPlayed", 'String'>
    readonly artistName: FieldRef<"UserRecentlyPlayed", 'String'>
    readonly artistId: FieldRef<"UserRecentlyPlayed", 'String'>
    readonly album: FieldRef<"UserRecentlyPlayed", 'String'>
    readonly coverUrl: FieldRef<"UserRecentlyPlayed", 'String'>
    readonly duration: FieldRef<"UserRecentlyPlayed", 'String'>
    readonly durationSec: FieldRef<"UserRecentlyPlayed", 'Int'>
    readonly previewUrl: FieldRef<"UserRecentlyPlayed", 'String'>
    readonly isrc: FieldRef<"UserRecentlyPlayed", 'String'>
    readonly playedAt: FieldRef<"UserRecentlyPlayed", 'DateTime'>
    readonly updatedAt: FieldRef<"UserRecentlyPlayed", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * UserRecentlyPlayed findUnique
   */
  export type UserRecentlyPlayedFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserRecentlyPlayed
     */
    select?: UserRecentlyPlayedSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserRecentlyPlayed
     */
    omit?: UserRecentlyPlayedOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserRecentlyPlayedInclude<ExtArgs> | null
    /**
     * Filter, which UserRecentlyPlayed to fetch.
     */
    where: UserRecentlyPlayedWhereUniqueInput
  }

  /**
   * UserRecentlyPlayed findUniqueOrThrow
   */
  export type UserRecentlyPlayedFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserRecentlyPlayed
     */
    select?: UserRecentlyPlayedSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserRecentlyPlayed
     */
    omit?: UserRecentlyPlayedOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserRecentlyPlayedInclude<ExtArgs> | null
    /**
     * Filter, which UserRecentlyPlayed to fetch.
     */
    where: UserRecentlyPlayedWhereUniqueInput
  }

  /**
   * UserRecentlyPlayed findFirst
   */
  export type UserRecentlyPlayedFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserRecentlyPlayed
     */
    select?: UserRecentlyPlayedSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserRecentlyPlayed
     */
    omit?: UserRecentlyPlayedOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserRecentlyPlayedInclude<ExtArgs> | null
    /**
     * Filter, which UserRecentlyPlayed to fetch.
     */
    where?: UserRecentlyPlayedWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserRecentlyPlayeds to fetch.
     */
    orderBy?: UserRecentlyPlayedOrderByWithRelationInput | UserRecentlyPlayedOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for UserRecentlyPlayeds.
     */
    cursor?: UserRecentlyPlayedWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserRecentlyPlayeds from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserRecentlyPlayeds.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of UserRecentlyPlayeds.
     */
    distinct?: UserRecentlyPlayedScalarFieldEnum | UserRecentlyPlayedScalarFieldEnum[]
  }

  /**
   * UserRecentlyPlayed findFirstOrThrow
   */
  export type UserRecentlyPlayedFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserRecentlyPlayed
     */
    select?: UserRecentlyPlayedSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserRecentlyPlayed
     */
    omit?: UserRecentlyPlayedOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserRecentlyPlayedInclude<ExtArgs> | null
    /**
     * Filter, which UserRecentlyPlayed to fetch.
     */
    where?: UserRecentlyPlayedWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserRecentlyPlayeds to fetch.
     */
    orderBy?: UserRecentlyPlayedOrderByWithRelationInput | UserRecentlyPlayedOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for UserRecentlyPlayeds.
     */
    cursor?: UserRecentlyPlayedWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserRecentlyPlayeds from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserRecentlyPlayeds.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of UserRecentlyPlayeds.
     */
    distinct?: UserRecentlyPlayedScalarFieldEnum | UserRecentlyPlayedScalarFieldEnum[]
  }

  /**
   * UserRecentlyPlayed findMany
   */
  export type UserRecentlyPlayedFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserRecentlyPlayed
     */
    select?: UserRecentlyPlayedSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserRecentlyPlayed
     */
    omit?: UserRecentlyPlayedOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserRecentlyPlayedInclude<ExtArgs> | null
    /**
     * Filter, which UserRecentlyPlayeds to fetch.
     */
    where?: UserRecentlyPlayedWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserRecentlyPlayeds to fetch.
     */
    orderBy?: UserRecentlyPlayedOrderByWithRelationInput | UserRecentlyPlayedOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing UserRecentlyPlayeds.
     */
    cursor?: UserRecentlyPlayedWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserRecentlyPlayeds from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserRecentlyPlayeds.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of UserRecentlyPlayeds.
     */
    distinct?: UserRecentlyPlayedScalarFieldEnum | UserRecentlyPlayedScalarFieldEnum[]
  }

  /**
   * UserRecentlyPlayed create
   */
  export type UserRecentlyPlayedCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserRecentlyPlayed
     */
    select?: UserRecentlyPlayedSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserRecentlyPlayed
     */
    omit?: UserRecentlyPlayedOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserRecentlyPlayedInclude<ExtArgs> | null
    /**
     * The data needed to create a UserRecentlyPlayed.
     */
    data: XOR<UserRecentlyPlayedCreateInput, UserRecentlyPlayedUncheckedCreateInput>
  }

  /**
   * UserRecentlyPlayed createMany
   */
  export type UserRecentlyPlayedCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many UserRecentlyPlayeds.
     */
    data: UserRecentlyPlayedCreateManyInput | UserRecentlyPlayedCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * UserRecentlyPlayed createManyAndReturn
   */
  export type UserRecentlyPlayedCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserRecentlyPlayed
     */
    select?: UserRecentlyPlayedSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the UserRecentlyPlayed
     */
    omit?: UserRecentlyPlayedOmit<ExtArgs> | null
    /**
     * The data used to create many UserRecentlyPlayeds.
     */
    data: UserRecentlyPlayedCreateManyInput | UserRecentlyPlayedCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserRecentlyPlayedIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * UserRecentlyPlayed update
   */
  export type UserRecentlyPlayedUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserRecentlyPlayed
     */
    select?: UserRecentlyPlayedSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserRecentlyPlayed
     */
    omit?: UserRecentlyPlayedOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserRecentlyPlayedInclude<ExtArgs> | null
    /**
     * The data needed to update a UserRecentlyPlayed.
     */
    data: XOR<UserRecentlyPlayedUpdateInput, UserRecentlyPlayedUncheckedUpdateInput>
    /**
     * Choose, which UserRecentlyPlayed to update.
     */
    where: UserRecentlyPlayedWhereUniqueInput
  }

  /**
   * UserRecentlyPlayed updateMany
   */
  export type UserRecentlyPlayedUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update UserRecentlyPlayeds.
     */
    data: XOR<UserRecentlyPlayedUpdateManyMutationInput, UserRecentlyPlayedUncheckedUpdateManyInput>
    /**
     * Filter which UserRecentlyPlayeds to update
     */
    where?: UserRecentlyPlayedWhereInput
    /**
     * Limit how many UserRecentlyPlayeds to update.
     */
    limit?: number
  }

  /**
   * UserRecentlyPlayed updateManyAndReturn
   */
  export type UserRecentlyPlayedUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserRecentlyPlayed
     */
    select?: UserRecentlyPlayedSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the UserRecentlyPlayed
     */
    omit?: UserRecentlyPlayedOmit<ExtArgs> | null
    /**
     * The data used to update UserRecentlyPlayeds.
     */
    data: XOR<UserRecentlyPlayedUpdateManyMutationInput, UserRecentlyPlayedUncheckedUpdateManyInput>
    /**
     * Filter which UserRecentlyPlayeds to update
     */
    where?: UserRecentlyPlayedWhereInput
    /**
     * Limit how many UserRecentlyPlayeds to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserRecentlyPlayedIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * UserRecentlyPlayed upsert
   */
  export type UserRecentlyPlayedUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserRecentlyPlayed
     */
    select?: UserRecentlyPlayedSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserRecentlyPlayed
     */
    omit?: UserRecentlyPlayedOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserRecentlyPlayedInclude<ExtArgs> | null
    /**
     * The filter to search for the UserRecentlyPlayed to update in case it exists.
     */
    where: UserRecentlyPlayedWhereUniqueInput
    /**
     * In case the UserRecentlyPlayed found by the `where` argument doesn't exist, create a new UserRecentlyPlayed with this data.
     */
    create: XOR<UserRecentlyPlayedCreateInput, UserRecentlyPlayedUncheckedCreateInput>
    /**
     * In case the UserRecentlyPlayed was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserRecentlyPlayedUpdateInput, UserRecentlyPlayedUncheckedUpdateInput>
  }

  /**
   * UserRecentlyPlayed delete
   */
  export type UserRecentlyPlayedDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserRecentlyPlayed
     */
    select?: UserRecentlyPlayedSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserRecentlyPlayed
     */
    omit?: UserRecentlyPlayedOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserRecentlyPlayedInclude<ExtArgs> | null
    /**
     * Filter which UserRecentlyPlayed to delete.
     */
    where: UserRecentlyPlayedWhereUniqueInput
  }

  /**
   * UserRecentlyPlayed deleteMany
   */
  export type UserRecentlyPlayedDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which UserRecentlyPlayeds to delete
     */
    where?: UserRecentlyPlayedWhereInput
    /**
     * Limit how many UserRecentlyPlayeds to delete.
     */
    limit?: number
  }

  /**
   * UserRecentlyPlayed without action
   */
  export type UserRecentlyPlayedDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserRecentlyPlayed
     */
    select?: UserRecentlyPlayedSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserRecentlyPlayed
     */
    omit?: UserRecentlyPlayedOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserRecentlyPlayedInclude<ExtArgs> | null
  }


  /**
   * Model Session
   */

  export type AggregateSession = {
    _count: SessionCountAggregateOutputType | null
    _min: SessionMinAggregateOutputType | null
    _max: SessionMaxAggregateOutputType | null
  }

  export type SessionMinAggregateOutputType = {
    id: string | null
    userId: string | null
    refreshTokenHash: string | null
    device: string | null
    expiresAt: Date | null
  }

  export type SessionMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    refreshTokenHash: string | null
    device: string | null
    expiresAt: Date | null
  }

  export type SessionCountAggregateOutputType = {
    id: number
    userId: number
    refreshTokenHash: number
    device: number
    expiresAt: number
    _all: number
  }


  export type SessionMinAggregateInputType = {
    id?: true
    userId?: true
    refreshTokenHash?: true
    device?: true
    expiresAt?: true
  }

  export type SessionMaxAggregateInputType = {
    id?: true
    userId?: true
    refreshTokenHash?: true
    device?: true
    expiresAt?: true
  }

  export type SessionCountAggregateInputType = {
    id?: true
    userId?: true
    refreshTokenHash?: true
    device?: true
    expiresAt?: true
    _all?: true
  }

  export type SessionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Session to aggregate.
     */
    where?: SessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Sessions to fetch.
     */
    orderBy?: SessionOrderByWithRelationInput | SessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Sessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Sessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Sessions
    **/
    _count?: true | SessionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SessionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SessionMaxAggregateInputType
  }

  export type GetSessionAggregateType<T extends SessionAggregateArgs> = {
        [P in keyof T & keyof AggregateSession]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSession[P]>
      : GetScalarType<T[P], AggregateSession[P]>
  }




  export type SessionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SessionWhereInput
    orderBy?: SessionOrderByWithAggregationInput | SessionOrderByWithAggregationInput[]
    by: SessionScalarFieldEnum[] | SessionScalarFieldEnum
    having?: SessionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SessionCountAggregateInputType | true
    _min?: SessionMinAggregateInputType
    _max?: SessionMaxAggregateInputType
  }

  export type SessionGroupByOutputType = {
    id: string
    userId: string
    refreshTokenHash: string
    device: string | null
    expiresAt: Date
    _count: SessionCountAggregateOutputType | null
    _min: SessionMinAggregateOutputType | null
    _max: SessionMaxAggregateOutputType | null
  }

  type GetSessionGroupByPayload<T extends SessionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SessionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SessionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SessionGroupByOutputType[P]>
            : GetScalarType<T[P], SessionGroupByOutputType[P]>
        }
      >
    >


  export type SessionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    refreshTokenHash?: boolean
    device?: boolean
    expiresAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["session"]>

  export type SessionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    refreshTokenHash?: boolean
    device?: boolean
    expiresAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["session"]>

  export type SessionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    refreshTokenHash?: boolean
    device?: boolean
    expiresAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["session"]>

  export type SessionSelectScalar = {
    id?: boolean
    userId?: boolean
    refreshTokenHash?: boolean
    device?: boolean
    expiresAt?: boolean
  }

  export type SessionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "refreshTokenHash" | "device" | "expiresAt", ExtArgs["result"]["session"]>
  export type SessionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type SessionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type SessionIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $SessionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Session"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      refreshTokenHash: string
      device: string | null
      expiresAt: Date
    }, ExtArgs["result"]["session"]>
    composites: {}
  }

  type SessionGetPayload<S extends boolean | null | undefined | SessionDefaultArgs> = $Result.GetResult<Prisma.$SessionPayload, S>

  type SessionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SessionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SessionCountAggregateInputType | true
    }

  export interface SessionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Session'], meta: { name: 'Session' } }
    /**
     * Find zero or one Session that matches the filter.
     * @param {SessionFindUniqueArgs} args - Arguments to find a Session
     * @example
     * // Get one Session
     * const session = await prisma.session.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SessionFindUniqueArgs>(args: SelectSubset<T, SessionFindUniqueArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Session that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SessionFindUniqueOrThrowArgs} args - Arguments to find a Session
     * @example
     * // Get one Session
     * const session = await prisma.session.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SessionFindUniqueOrThrowArgs>(args: SelectSubset<T, SessionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Session that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionFindFirstArgs} args - Arguments to find a Session
     * @example
     * // Get one Session
     * const session = await prisma.session.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SessionFindFirstArgs>(args?: SelectSubset<T, SessionFindFirstArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Session that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionFindFirstOrThrowArgs} args - Arguments to find a Session
     * @example
     * // Get one Session
     * const session = await prisma.session.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SessionFindFirstOrThrowArgs>(args?: SelectSubset<T, SessionFindFirstOrThrowArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Sessions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Sessions
     * const sessions = await prisma.session.findMany()
     * 
     * // Get first 10 Sessions
     * const sessions = await prisma.session.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const sessionWithIdOnly = await prisma.session.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SessionFindManyArgs>(args?: SelectSubset<T, SessionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Session.
     * @param {SessionCreateArgs} args - Arguments to create a Session.
     * @example
     * // Create one Session
     * const Session = await prisma.session.create({
     *   data: {
     *     // ... data to create a Session
     *   }
     * })
     * 
     */
    create<T extends SessionCreateArgs>(args: SelectSubset<T, SessionCreateArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Sessions.
     * @param {SessionCreateManyArgs} args - Arguments to create many Sessions.
     * @example
     * // Create many Sessions
     * const session = await prisma.session.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SessionCreateManyArgs>(args?: SelectSubset<T, SessionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Sessions and returns the data saved in the database.
     * @param {SessionCreateManyAndReturnArgs} args - Arguments to create many Sessions.
     * @example
     * // Create many Sessions
     * const session = await prisma.session.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Sessions and only return the `id`
     * const sessionWithIdOnly = await prisma.session.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SessionCreateManyAndReturnArgs>(args?: SelectSubset<T, SessionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Session.
     * @param {SessionDeleteArgs} args - Arguments to delete one Session.
     * @example
     * // Delete one Session
     * const Session = await prisma.session.delete({
     *   where: {
     *     // ... filter to delete one Session
     *   }
     * })
     * 
     */
    delete<T extends SessionDeleteArgs>(args: SelectSubset<T, SessionDeleteArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Session.
     * @param {SessionUpdateArgs} args - Arguments to update one Session.
     * @example
     * // Update one Session
     * const session = await prisma.session.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SessionUpdateArgs>(args: SelectSubset<T, SessionUpdateArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Sessions.
     * @param {SessionDeleteManyArgs} args - Arguments to filter Sessions to delete.
     * @example
     * // Delete a few Sessions
     * const { count } = await prisma.session.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SessionDeleteManyArgs>(args?: SelectSubset<T, SessionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sessions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Sessions
     * const session = await prisma.session.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SessionUpdateManyArgs>(args: SelectSubset<T, SessionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sessions and returns the data updated in the database.
     * @param {SessionUpdateManyAndReturnArgs} args - Arguments to update many Sessions.
     * @example
     * // Update many Sessions
     * const session = await prisma.session.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Sessions and only return the `id`
     * const sessionWithIdOnly = await prisma.session.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SessionUpdateManyAndReturnArgs>(args: SelectSubset<T, SessionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Session.
     * @param {SessionUpsertArgs} args - Arguments to update or create a Session.
     * @example
     * // Update or create a Session
     * const session = await prisma.session.upsert({
     *   create: {
     *     // ... data to create a Session
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Session we want to update
     *   }
     * })
     */
    upsert<T extends SessionUpsertArgs>(args: SelectSubset<T, SessionUpsertArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Sessions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionCountArgs} args - Arguments to filter Sessions to count.
     * @example
     * // Count the number of Sessions
     * const count = await prisma.session.count({
     *   where: {
     *     // ... the filter for the Sessions we want to count
     *   }
     * })
    **/
    count<T extends SessionCountArgs>(
      args?: Subset<T, SessionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SessionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Session.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SessionAggregateArgs>(args: Subset<T, SessionAggregateArgs>): Prisma.PrismaPromise<GetSessionAggregateType<T>>

    /**
     * Group by Session.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SessionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SessionGroupByArgs['orderBy'] }
        : { orderBy?: SessionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SessionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSessionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Session model
   */
  readonly fields: SessionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Session.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SessionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Session model
   */
  interface SessionFieldRefs {
    readonly id: FieldRef<"Session", 'String'>
    readonly userId: FieldRef<"Session", 'String'>
    readonly refreshTokenHash: FieldRef<"Session", 'String'>
    readonly device: FieldRef<"Session", 'String'>
    readonly expiresAt: FieldRef<"Session", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Session findUnique
   */
  export type SessionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * Filter, which Session to fetch.
     */
    where: SessionWhereUniqueInput
  }

  /**
   * Session findUniqueOrThrow
   */
  export type SessionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * Filter, which Session to fetch.
     */
    where: SessionWhereUniqueInput
  }

  /**
   * Session findFirst
   */
  export type SessionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * Filter, which Session to fetch.
     */
    where?: SessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Sessions to fetch.
     */
    orderBy?: SessionOrderByWithRelationInput | SessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Sessions.
     */
    cursor?: SessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Sessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Sessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Sessions.
     */
    distinct?: SessionScalarFieldEnum | SessionScalarFieldEnum[]
  }

  /**
   * Session findFirstOrThrow
   */
  export type SessionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * Filter, which Session to fetch.
     */
    where?: SessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Sessions to fetch.
     */
    orderBy?: SessionOrderByWithRelationInput | SessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Sessions.
     */
    cursor?: SessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Sessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Sessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Sessions.
     */
    distinct?: SessionScalarFieldEnum | SessionScalarFieldEnum[]
  }

  /**
   * Session findMany
   */
  export type SessionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * Filter, which Sessions to fetch.
     */
    where?: SessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Sessions to fetch.
     */
    orderBy?: SessionOrderByWithRelationInput | SessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Sessions.
     */
    cursor?: SessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Sessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Sessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Sessions.
     */
    distinct?: SessionScalarFieldEnum | SessionScalarFieldEnum[]
  }

  /**
   * Session create
   */
  export type SessionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * The data needed to create a Session.
     */
    data: XOR<SessionCreateInput, SessionUncheckedCreateInput>
  }

  /**
   * Session createMany
   */
  export type SessionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Sessions.
     */
    data: SessionCreateManyInput | SessionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Session createManyAndReturn
   */
  export type SessionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * The data used to create many Sessions.
     */
    data: SessionCreateManyInput | SessionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Session update
   */
  export type SessionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * The data needed to update a Session.
     */
    data: XOR<SessionUpdateInput, SessionUncheckedUpdateInput>
    /**
     * Choose, which Session to update.
     */
    where: SessionWhereUniqueInput
  }

  /**
   * Session updateMany
   */
  export type SessionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Sessions.
     */
    data: XOR<SessionUpdateManyMutationInput, SessionUncheckedUpdateManyInput>
    /**
     * Filter which Sessions to update
     */
    where?: SessionWhereInput
    /**
     * Limit how many Sessions to update.
     */
    limit?: number
  }

  /**
   * Session updateManyAndReturn
   */
  export type SessionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * The data used to update Sessions.
     */
    data: XOR<SessionUpdateManyMutationInput, SessionUncheckedUpdateManyInput>
    /**
     * Filter which Sessions to update
     */
    where?: SessionWhereInput
    /**
     * Limit how many Sessions to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Session upsert
   */
  export type SessionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * The filter to search for the Session to update in case it exists.
     */
    where: SessionWhereUniqueInput
    /**
     * In case the Session found by the `where` argument doesn't exist, create a new Session with this data.
     */
    create: XOR<SessionCreateInput, SessionUncheckedCreateInput>
    /**
     * In case the Session was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SessionUpdateInput, SessionUncheckedUpdateInput>
  }

  /**
   * Session delete
   */
  export type SessionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * Filter which Session to delete.
     */
    where: SessionWhereUniqueInput
  }

  /**
   * Session deleteMany
   */
  export type SessionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Sessions to delete
     */
    where?: SessionWhereInput
    /**
     * Limit how many Sessions to delete.
     */
    limit?: number
  }

  /**
   * Session without action
   */
  export type SessionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const UserScalarFieldEnum: {
    id: 'id',
    name: 'name',
    email: 'email',
    username: 'username',
    passwordHash: 'passwordHash',
    isVerified: 'isVerified',
    verifyToken: 'verifyToken',
    verifyTokenExp: 'verifyTokenExp',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const VerificationCodeScalarFieldEnum: {
    id: 'id',
    code: 'code',
    userId: 'userId',
    expiresAt: 'expiresAt',
    createdAt: 'createdAt'
  };

  export type VerificationCodeScalarFieldEnum = (typeof VerificationCodeScalarFieldEnum)[keyof typeof VerificationCodeScalarFieldEnum]


  export const UserLibraryScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    trackId: 'trackId',
    deezerId: 'deezerId',
    scUrl: 'scUrl',
    source: 'source',
    title: 'title',
    artistName: 'artistName',
    artistId: 'artistId',
    album: 'album',
    coverUrl: 'coverUrl',
    duration: 'duration',
    durationSec: 'durationSec',
    previewUrl: 'previewUrl',
    isrc: 'isrc',
    addedAt: 'addedAt',
    updatedAt: 'updatedAt'
  };

  export type UserLibraryScalarFieldEnum = (typeof UserLibraryScalarFieldEnum)[keyof typeof UserLibraryScalarFieldEnum]


  export const UserRecentlyPlayedScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    trackId: 'trackId',
    deezerId: 'deezerId',
    scUrl: 'scUrl',
    source: 'source',
    title: 'title',
    artistName: 'artistName',
    artistId: 'artistId',
    album: 'album',
    coverUrl: 'coverUrl',
    duration: 'duration',
    durationSec: 'durationSec',
    previewUrl: 'previewUrl',
    isrc: 'isrc',
    playedAt: 'playedAt',
    updatedAt: 'updatedAt'
  };

  export type UserRecentlyPlayedScalarFieldEnum = (typeof UserRecentlyPlayedScalarFieldEnum)[keyof typeof UserRecentlyPlayedScalarFieldEnum]


  export const SessionScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    refreshTokenHash: 'refreshTokenHash',
    device: 'device',
    expiresAt: 'expiresAt'
  };

  export type SessionScalarFieldEnum = (typeof SessionScalarFieldEnum)[keyof typeof SessionScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: StringFilter<"User"> | string
    name?: StringFilter<"User"> | string
    email?: StringFilter<"User"> | string
    username?: StringFilter<"User"> | string
    passwordHash?: StringFilter<"User"> | string
    isVerified?: BoolFilter<"User"> | boolean
    verifyToken?: StringNullableFilter<"User"> | string | null
    verifyTokenExp?: DateTimeNullableFilter<"User"> | Date | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    userLibraries?: UserLibraryListRelationFilter
    recentlyPlayed?: UserRecentlyPlayedListRelationFilter
    sessions?: SessionListRelationFilter
    codes?: VerificationCodeListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    username?: SortOrder
    passwordHash?: SortOrder
    isVerified?: SortOrder
    verifyToken?: SortOrderInput | SortOrder
    verifyTokenExp?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    userLibraries?: UserLibraryOrderByRelationAggregateInput
    recentlyPlayed?: UserRecentlyPlayedOrderByRelationAggregateInput
    sessions?: SessionOrderByRelationAggregateInput
    codes?: VerificationCodeOrderByRelationAggregateInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    email?: string
    username?: string
    verifyToken?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    name?: StringFilter<"User"> | string
    passwordHash?: StringFilter<"User"> | string
    isVerified?: BoolFilter<"User"> | boolean
    verifyTokenExp?: DateTimeNullableFilter<"User"> | Date | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    userLibraries?: UserLibraryListRelationFilter
    recentlyPlayed?: UserRecentlyPlayedListRelationFilter
    sessions?: SessionListRelationFilter
    codes?: VerificationCodeListRelationFilter
  }, "id" | "email" | "username" | "verifyToken">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    username?: SortOrder
    passwordHash?: SortOrder
    isVerified?: SortOrder
    verifyToken?: SortOrderInput | SortOrder
    verifyTokenExp?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"User"> | string
    name?: StringWithAggregatesFilter<"User"> | string
    email?: StringWithAggregatesFilter<"User"> | string
    username?: StringWithAggregatesFilter<"User"> | string
    passwordHash?: StringWithAggregatesFilter<"User"> | string
    isVerified?: BoolWithAggregatesFilter<"User"> | boolean
    verifyToken?: StringNullableWithAggregatesFilter<"User"> | string | null
    verifyTokenExp?: DateTimeNullableWithAggregatesFilter<"User"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
  }

  export type VerificationCodeWhereInput = {
    AND?: VerificationCodeWhereInput | VerificationCodeWhereInput[]
    OR?: VerificationCodeWhereInput[]
    NOT?: VerificationCodeWhereInput | VerificationCodeWhereInput[]
    id?: StringFilter<"VerificationCode"> | string
    code?: StringFilter<"VerificationCode"> | string
    userId?: StringFilter<"VerificationCode"> | string
    expiresAt?: DateTimeFilter<"VerificationCode"> | Date | string
    createdAt?: DateTimeFilter<"VerificationCode"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type VerificationCodeOrderByWithRelationInput = {
    id?: SortOrder
    code?: SortOrder
    userId?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type VerificationCodeWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: VerificationCodeWhereInput | VerificationCodeWhereInput[]
    OR?: VerificationCodeWhereInput[]
    NOT?: VerificationCodeWhereInput | VerificationCodeWhereInput[]
    code?: StringFilter<"VerificationCode"> | string
    userId?: StringFilter<"VerificationCode"> | string
    expiresAt?: DateTimeFilter<"VerificationCode"> | Date | string
    createdAt?: DateTimeFilter<"VerificationCode"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id">

  export type VerificationCodeOrderByWithAggregationInput = {
    id?: SortOrder
    code?: SortOrder
    userId?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
    _count?: VerificationCodeCountOrderByAggregateInput
    _max?: VerificationCodeMaxOrderByAggregateInput
    _min?: VerificationCodeMinOrderByAggregateInput
  }

  export type VerificationCodeScalarWhereWithAggregatesInput = {
    AND?: VerificationCodeScalarWhereWithAggregatesInput | VerificationCodeScalarWhereWithAggregatesInput[]
    OR?: VerificationCodeScalarWhereWithAggregatesInput[]
    NOT?: VerificationCodeScalarWhereWithAggregatesInput | VerificationCodeScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"VerificationCode"> | string
    code?: StringWithAggregatesFilter<"VerificationCode"> | string
    userId?: StringWithAggregatesFilter<"VerificationCode"> | string
    expiresAt?: DateTimeWithAggregatesFilter<"VerificationCode"> | Date | string
    createdAt?: DateTimeWithAggregatesFilter<"VerificationCode"> | Date | string
  }

  export type UserLibraryWhereInput = {
    AND?: UserLibraryWhereInput | UserLibraryWhereInput[]
    OR?: UserLibraryWhereInput[]
    NOT?: UserLibraryWhereInput | UserLibraryWhereInput[]
    id?: StringFilter<"UserLibrary"> | string
    userId?: StringFilter<"UserLibrary"> | string
    trackId?: StringNullableFilter<"UserLibrary"> | string | null
    deezerId?: StringNullableFilter<"UserLibrary"> | string | null
    scUrl?: StringNullableFilter<"UserLibrary"> | string | null
    source?: StringFilter<"UserLibrary"> | string
    title?: StringFilter<"UserLibrary"> | string
    artistName?: StringFilter<"UserLibrary"> | string
    artistId?: StringNullableFilter<"UserLibrary"> | string | null
    album?: StringNullableFilter<"UserLibrary"> | string | null
    coverUrl?: StringNullableFilter<"UserLibrary"> | string | null
    duration?: StringFilter<"UserLibrary"> | string
    durationSec?: IntFilter<"UserLibrary"> | number
    previewUrl?: StringNullableFilter<"UserLibrary"> | string | null
    isrc?: StringNullableFilter<"UserLibrary"> | string | null
    addedAt?: DateTimeFilter<"UserLibrary"> | Date | string
    updatedAt?: DateTimeFilter<"UserLibrary"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type UserLibraryOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    trackId?: SortOrderInput | SortOrder
    deezerId?: SortOrderInput | SortOrder
    scUrl?: SortOrderInput | SortOrder
    source?: SortOrder
    title?: SortOrder
    artistName?: SortOrder
    artistId?: SortOrderInput | SortOrder
    album?: SortOrderInput | SortOrder
    coverUrl?: SortOrderInput | SortOrder
    duration?: SortOrder
    durationSec?: SortOrder
    previewUrl?: SortOrderInput | SortOrder
    isrc?: SortOrderInput | SortOrder
    addedAt?: SortOrder
    updatedAt?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type UserLibraryWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    userId_deezerId?: UserLibraryUserIdDeezerIdCompoundUniqueInput
    userId_scUrl?: UserLibraryUserIdScUrlCompoundUniqueInput
    AND?: UserLibraryWhereInput | UserLibraryWhereInput[]
    OR?: UserLibraryWhereInput[]
    NOT?: UserLibraryWhereInput | UserLibraryWhereInput[]
    userId?: StringFilter<"UserLibrary"> | string
    trackId?: StringNullableFilter<"UserLibrary"> | string | null
    deezerId?: StringNullableFilter<"UserLibrary"> | string | null
    scUrl?: StringNullableFilter<"UserLibrary"> | string | null
    source?: StringFilter<"UserLibrary"> | string
    title?: StringFilter<"UserLibrary"> | string
    artistName?: StringFilter<"UserLibrary"> | string
    artistId?: StringNullableFilter<"UserLibrary"> | string | null
    album?: StringNullableFilter<"UserLibrary"> | string | null
    coverUrl?: StringNullableFilter<"UserLibrary"> | string | null
    duration?: StringFilter<"UserLibrary"> | string
    durationSec?: IntFilter<"UserLibrary"> | number
    previewUrl?: StringNullableFilter<"UserLibrary"> | string | null
    isrc?: StringNullableFilter<"UserLibrary"> | string | null
    addedAt?: DateTimeFilter<"UserLibrary"> | Date | string
    updatedAt?: DateTimeFilter<"UserLibrary"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "userId_deezerId" | "userId_scUrl">

  export type UserLibraryOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    trackId?: SortOrderInput | SortOrder
    deezerId?: SortOrderInput | SortOrder
    scUrl?: SortOrderInput | SortOrder
    source?: SortOrder
    title?: SortOrder
    artistName?: SortOrder
    artistId?: SortOrderInput | SortOrder
    album?: SortOrderInput | SortOrder
    coverUrl?: SortOrderInput | SortOrder
    duration?: SortOrder
    durationSec?: SortOrder
    previewUrl?: SortOrderInput | SortOrder
    isrc?: SortOrderInput | SortOrder
    addedAt?: SortOrder
    updatedAt?: SortOrder
    _count?: UserLibraryCountOrderByAggregateInput
    _avg?: UserLibraryAvgOrderByAggregateInput
    _max?: UserLibraryMaxOrderByAggregateInput
    _min?: UserLibraryMinOrderByAggregateInput
    _sum?: UserLibrarySumOrderByAggregateInput
  }

  export type UserLibraryScalarWhereWithAggregatesInput = {
    AND?: UserLibraryScalarWhereWithAggregatesInput | UserLibraryScalarWhereWithAggregatesInput[]
    OR?: UserLibraryScalarWhereWithAggregatesInput[]
    NOT?: UserLibraryScalarWhereWithAggregatesInput | UserLibraryScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"UserLibrary"> | string
    userId?: StringWithAggregatesFilter<"UserLibrary"> | string
    trackId?: StringNullableWithAggregatesFilter<"UserLibrary"> | string | null
    deezerId?: StringNullableWithAggregatesFilter<"UserLibrary"> | string | null
    scUrl?: StringNullableWithAggregatesFilter<"UserLibrary"> | string | null
    source?: StringWithAggregatesFilter<"UserLibrary"> | string
    title?: StringWithAggregatesFilter<"UserLibrary"> | string
    artistName?: StringWithAggregatesFilter<"UserLibrary"> | string
    artistId?: StringNullableWithAggregatesFilter<"UserLibrary"> | string | null
    album?: StringNullableWithAggregatesFilter<"UserLibrary"> | string | null
    coverUrl?: StringNullableWithAggregatesFilter<"UserLibrary"> | string | null
    duration?: StringWithAggregatesFilter<"UserLibrary"> | string
    durationSec?: IntWithAggregatesFilter<"UserLibrary"> | number
    previewUrl?: StringNullableWithAggregatesFilter<"UserLibrary"> | string | null
    isrc?: StringNullableWithAggregatesFilter<"UserLibrary"> | string | null
    addedAt?: DateTimeWithAggregatesFilter<"UserLibrary"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"UserLibrary"> | Date | string
  }

  export type UserRecentlyPlayedWhereInput = {
    AND?: UserRecentlyPlayedWhereInput | UserRecentlyPlayedWhereInput[]
    OR?: UserRecentlyPlayedWhereInput[]
    NOT?: UserRecentlyPlayedWhereInput | UserRecentlyPlayedWhereInput[]
    id?: StringFilter<"UserRecentlyPlayed"> | string
    userId?: StringFilter<"UserRecentlyPlayed"> | string
    trackId?: StringNullableFilter<"UserRecentlyPlayed"> | string | null
    deezerId?: StringNullableFilter<"UserRecentlyPlayed"> | string | null
    scUrl?: StringNullableFilter<"UserRecentlyPlayed"> | string | null
    source?: StringFilter<"UserRecentlyPlayed"> | string
    title?: StringFilter<"UserRecentlyPlayed"> | string
    artistName?: StringFilter<"UserRecentlyPlayed"> | string
    artistId?: StringNullableFilter<"UserRecentlyPlayed"> | string | null
    album?: StringNullableFilter<"UserRecentlyPlayed"> | string | null
    coverUrl?: StringNullableFilter<"UserRecentlyPlayed"> | string | null
    duration?: StringFilter<"UserRecentlyPlayed"> | string
    durationSec?: IntFilter<"UserRecentlyPlayed"> | number
    previewUrl?: StringNullableFilter<"UserRecentlyPlayed"> | string | null
    isrc?: StringNullableFilter<"UserRecentlyPlayed"> | string | null
    playedAt?: DateTimeFilter<"UserRecentlyPlayed"> | Date | string
    updatedAt?: DateTimeFilter<"UserRecentlyPlayed"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type UserRecentlyPlayedOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    trackId?: SortOrderInput | SortOrder
    deezerId?: SortOrderInput | SortOrder
    scUrl?: SortOrderInput | SortOrder
    source?: SortOrder
    title?: SortOrder
    artistName?: SortOrder
    artistId?: SortOrderInput | SortOrder
    album?: SortOrderInput | SortOrder
    coverUrl?: SortOrderInput | SortOrder
    duration?: SortOrder
    durationSec?: SortOrder
    previewUrl?: SortOrderInput | SortOrder
    isrc?: SortOrderInput | SortOrder
    playedAt?: SortOrder
    updatedAt?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type UserRecentlyPlayedWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    userId_deezerId?: UserRecentlyPlayedUserIdDeezerIdCompoundUniqueInput
    userId_scUrl?: UserRecentlyPlayedUserIdScUrlCompoundUniqueInput
    AND?: UserRecentlyPlayedWhereInput | UserRecentlyPlayedWhereInput[]
    OR?: UserRecentlyPlayedWhereInput[]
    NOT?: UserRecentlyPlayedWhereInput | UserRecentlyPlayedWhereInput[]
    userId?: StringFilter<"UserRecentlyPlayed"> | string
    trackId?: StringNullableFilter<"UserRecentlyPlayed"> | string | null
    deezerId?: StringNullableFilter<"UserRecentlyPlayed"> | string | null
    scUrl?: StringNullableFilter<"UserRecentlyPlayed"> | string | null
    source?: StringFilter<"UserRecentlyPlayed"> | string
    title?: StringFilter<"UserRecentlyPlayed"> | string
    artistName?: StringFilter<"UserRecentlyPlayed"> | string
    artistId?: StringNullableFilter<"UserRecentlyPlayed"> | string | null
    album?: StringNullableFilter<"UserRecentlyPlayed"> | string | null
    coverUrl?: StringNullableFilter<"UserRecentlyPlayed"> | string | null
    duration?: StringFilter<"UserRecentlyPlayed"> | string
    durationSec?: IntFilter<"UserRecentlyPlayed"> | number
    previewUrl?: StringNullableFilter<"UserRecentlyPlayed"> | string | null
    isrc?: StringNullableFilter<"UserRecentlyPlayed"> | string | null
    playedAt?: DateTimeFilter<"UserRecentlyPlayed"> | Date | string
    updatedAt?: DateTimeFilter<"UserRecentlyPlayed"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "userId_deezerId" | "userId_scUrl">

  export type UserRecentlyPlayedOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    trackId?: SortOrderInput | SortOrder
    deezerId?: SortOrderInput | SortOrder
    scUrl?: SortOrderInput | SortOrder
    source?: SortOrder
    title?: SortOrder
    artistName?: SortOrder
    artistId?: SortOrderInput | SortOrder
    album?: SortOrderInput | SortOrder
    coverUrl?: SortOrderInput | SortOrder
    duration?: SortOrder
    durationSec?: SortOrder
    previewUrl?: SortOrderInput | SortOrder
    isrc?: SortOrderInput | SortOrder
    playedAt?: SortOrder
    updatedAt?: SortOrder
    _count?: UserRecentlyPlayedCountOrderByAggregateInput
    _avg?: UserRecentlyPlayedAvgOrderByAggregateInput
    _max?: UserRecentlyPlayedMaxOrderByAggregateInput
    _min?: UserRecentlyPlayedMinOrderByAggregateInput
    _sum?: UserRecentlyPlayedSumOrderByAggregateInput
  }

  export type UserRecentlyPlayedScalarWhereWithAggregatesInput = {
    AND?: UserRecentlyPlayedScalarWhereWithAggregatesInput | UserRecentlyPlayedScalarWhereWithAggregatesInput[]
    OR?: UserRecentlyPlayedScalarWhereWithAggregatesInput[]
    NOT?: UserRecentlyPlayedScalarWhereWithAggregatesInput | UserRecentlyPlayedScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"UserRecentlyPlayed"> | string
    userId?: StringWithAggregatesFilter<"UserRecentlyPlayed"> | string
    trackId?: StringNullableWithAggregatesFilter<"UserRecentlyPlayed"> | string | null
    deezerId?: StringNullableWithAggregatesFilter<"UserRecentlyPlayed"> | string | null
    scUrl?: StringNullableWithAggregatesFilter<"UserRecentlyPlayed"> | string | null
    source?: StringWithAggregatesFilter<"UserRecentlyPlayed"> | string
    title?: StringWithAggregatesFilter<"UserRecentlyPlayed"> | string
    artistName?: StringWithAggregatesFilter<"UserRecentlyPlayed"> | string
    artistId?: StringNullableWithAggregatesFilter<"UserRecentlyPlayed"> | string | null
    album?: StringNullableWithAggregatesFilter<"UserRecentlyPlayed"> | string | null
    coverUrl?: StringNullableWithAggregatesFilter<"UserRecentlyPlayed"> | string | null
    duration?: StringWithAggregatesFilter<"UserRecentlyPlayed"> | string
    durationSec?: IntWithAggregatesFilter<"UserRecentlyPlayed"> | number
    previewUrl?: StringNullableWithAggregatesFilter<"UserRecentlyPlayed"> | string | null
    isrc?: StringNullableWithAggregatesFilter<"UserRecentlyPlayed"> | string | null
    playedAt?: DateTimeWithAggregatesFilter<"UserRecentlyPlayed"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"UserRecentlyPlayed"> | Date | string
  }

  export type SessionWhereInput = {
    AND?: SessionWhereInput | SessionWhereInput[]
    OR?: SessionWhereInput[]
    NOT?: SessionWhereInput | SessionWhereInput[]
    id?: StringFilter<"Session"> | string
    userId?: StringFilter<"Session"> | string
    refreshTokenHash?: StringFilter<"Session"> | string
    device?: StringNullableFilter<"Session"> | string | null
    expiresAt?: DateTimeFilter<"Session"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type SessionOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    refreshTokenHash?: SortOrder
    device?: SortOrderInput | SortOrder
    expiresAt?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type SessionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    refreshTokenHash?: string
    AND?: SessionWhereInput | SessionWhereInput[]
    OR?: SessionWhereInput[]
    NOT?: SessionWhereInput | SessionWhereInput[]
    userId?: StringFilter<"Session"> | string
    device?: StringNullableFilter<"Session"> | string | null
    expiresAt?: DateTimeFilter<"Session"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "refreshTokenHash">

  export type SessionOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    refreshTokenHash?: SortOrder
    device?: SortOrderInput | SortOrder
    expiresAt?: SortOrder
    _count?: SessionCountOrderByAggregateInput
    _max?: SessionMaxOrderByAggregateInput
    _min?: SessionMinOrderByAggregateInput
  }

  export type SessionScalarWhereWithAggregatesInput = {
    AND?: SessionScalarWhereWithAggregatesInput | SessionScalarWhereWithAggregatesInput[]
    OR?: SessionScalarWhereWithAggregatesInput[]
    NOT?: SessionScalarWhereWithAggregatesInput | SessionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Session"> | string
    userId?: StringWithAggregatesFilter<"Session"> | string
    refreshTokenHash?: StringWithAggregatesFilter<"Session"> | string
    device?: StringNullableWithAggregatesFilter<"Session"> | string | null
    expiresAt?: DateTimeWithAggregatesFilter<"Session"> | Date | string
  }

  export type UserCreateInput = {
    id?: string
    name: string
    email: string
    username: string
    passwordHash: string
    isVerified?: boolean
    verifyToken?: string | null
    verifyTokenExp?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    userLibraries?: UserLibraryCreateNestedManyWithoutUserInput
    recentlyPlayed?: UserRecentlyPlayedCreateNestedManyWithoutUserInput
    sessions?: SessionCreateNestedManyWithoutUserInput
    codes?: VerificationCodeCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateInput = {
    id?: string
    name: string
    email: string
    username: string
    passwordHash: string
    isVerified?: boolean
    verifyToken?: string | null
    verifyTokenExp?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    userLibraries?: UserLibraryUncheckedCreateNestedManyWithoutUserInput
    recentlyPlayed?: UserRecentlyPlayedUncheckedCreateNestedManyWithoutUserInput
    sessions?: SessionUncheckedCreateNestedManyWithoutUserInput
    codes?: VerificationCodeUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    verifyToken?: NullableStringFieldUpdateOperationsInput | string | null
    verifyTokenExp?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    userLibraries?: UserLibraryUpdateManyWithoutUserNestedInput
    recentlyPlayed?: UserRecentlyPlayedUpdateManyWithoutUserNestedInput
    sessions?: SessionUpdateManyWithoutUserNestedInput
    codes?: VerificationCodeUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    verifyToken?: NullableStringFieldUpdateOperationsInput | string | null
    verifyTokenExp?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    userLibraries?: UserLibraryUncheckedUpdateManyWithoutUserNestedInput
    recentlyPlayed?: UserRecentlyPlayedUncheckedUpdateManyWithoutUserNestedInput
    sessions?: SessionUncheckedUpdateManyWithoutUserNestedInput
    codes?: VerificationCodeUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateManyInput = {
    id?: string
    name: string
    email: string
    username: string
    passwordHash: string
    isVerified?: boolean
    verifyToken?: string | null
    verifyTokenExp?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    verifyToken?: NullableStringFieldUpdateOperationsInput | string | null
    verifyTokenExp?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    verifyToken?: NullableStringFieldUpdateOperationsInput | string | null
    verifyTokenExp?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VerificationCodeCreateInput = {
    id?: string
    code: string
    expiresAt: Date | string
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutCodesInput
  }

  export type VerificationCodeUncheckedCreateInput = {
    id?: string
    code: string
    userId: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type VerificationCodeUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutCodesNestedInput
  }

  export type VerificationCodeUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VerificationCodeCreateManyInput = {
    id?: string
    code: string
    userId: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type VerificationCodeUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VerificationCodeUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserLibraryCreateInput = {
    id?: string
    trackId?: string | null
    deezerId?: string | null
    scUrl?: string | null
    source: string
    title: string
    artistName: string
    artistId?: string | null
    album?: string | null
    coverUrl?: string | null
    duration: string
    durationSec?: number
    previewUrl?: string | null
    isrc?: string | null
    addedAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutUserLibrariesInput
  }

  export type UserLibraryUncheckedCreateInput = {
    id?: string
    userId: string
    trackId?: string | null
    deezerId?: string | null
    scUrl?: string | null
    source: string
    title: string
    artistName: string
    artistId?: string | null
    album?: string | null
    coverUrl?: string | null
    duration: string
    durationSec?: number
    previewUrl?: string | null
    isrc?: string | null
    addedAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserLibraryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    trackId?: NullableStringFieldUpdateOperationsInput | string | null
    deezerId?: NullableStringFieldUpdateOperationsInput | string | null
    scUrl?: NullableStringFieldUpdateOperationsInput | string | null
    source?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    artistName?: StringFieldUpdateOperationsInput | string
    artistId?: NullableStringFieldUpdateOperationsInput | string | null
    album?: NullableStringFieldUpdateOperationsInput | string | null
    coverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    duration?: StringFieldUpdateOperationsInput | string
    durationSec?: IntFieldUpdateOperationsInput | number
    previewUrl?: NullableStringFieldUpdateOperationsInput | string | null
    isrc?: NullableStringFieldUpdateOperationsInput | string | null
    addedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutUserLibrariesNestedInput
  }

  export type UserLibraryUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    trackId?: NullableStringFieldUpdateOperationsInput | string | null
    deezerId?: NullableStringFieldUpdateOperationsInput | string | null
    scUrl?: NullableStringFieldUpdateOperationsInput | string | null
    source?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    artistName?: StringFieldUpdateOperationsInput | string
    artistId?: NullableStringFieldUpdateOperationsInput | string | null
    album?: NullableStringFieldUpdateOperationsInput | string | null
    coverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    duration?: StringFieldUpdateOperationsInput | string
    durationSec?: IntFieldUpdateOperationsInput | number
    previewUrl?: NullableStringFieldUpdateOperationsInput | string | null
    isrc?: NullableStringFieldUpdateOperationsInput | string | null
    addedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserLibraryCreateManyInput = {
    id?: string
    userId: string
    trackId?: string | null
    deezerId?: string | null
    scUrl?: string | null
    source: string
    title: string
    artistName: string
    artistId?: string | null
    album?: string | null
    coverUrl?: string | null
    duration: string
    durationSec?: number
    previewUrl?: string | null
    isrc?: string | null
    addedAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserLibraryUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    trackId?: NullableStringFieldUpdateOperationsInput | string | null
    deezerId?: NullableStringFieldUpdateOperationsInput | string | null
    scUrl?: NullableStringFieldUpdateOperationsInput | string | null
    source?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    artistName?: StringFieldUpdateOperationsInput | string
    artistId?: NullableStringFieldUpdateOperationsInput | string | null
    album?: NullableStringFieldUpdateOperationsInput | string | null
    coverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    duration?: StringFieldUpdateOperationsInput | string
    durationSec?: IntFieldUpdateOperationsInput | number
    previewUrl?: NullableStringFieldUpdateOperationsInput | string | null
    isrc?: NullableStringFieldUpdateOperationsInput | string | null
    addedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserLibraryUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    trackId?: NullableStringFieldUpdateOperationsInput | string | null
    deezerId?: NullableStringFieldUpdateOperationsInput | string | null
    scUrl?: NullableStringFieldUpdateOperationsInput | string | null
    source?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    artistName?: StringFieldUpdateOperationsInput | string
    artistId?: NullableStringFieldUpdateOperationsInput | string | null
    album?: NullableStringFieldUpdateOperationsInput | string | null
    coverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    duration?: StringFieldUpdateOperationsInput | string
    durationSec?: IntFieldUpdateOperationsInput | number
    previewUrl?: NullableStringFieldUpdateOperationsInput | string | null
    isrc?: NullableStringFieldUpdateOperationsInput | string | null
    addedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserRecentlyPlayedCreateInput = {
    id?: string
    trackId?: string | null
    deezerId?: string | null
    scUrl?: string | null
    source: string
    title: string
    artistName: string
    artistId?: string | null
    album?: string | null
    coverUrl?: string | null
    duration: string
    durationSec?: number
    previewUrl?: string | null
    isrc?: string | null
    playedAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutRecentlyPlayedInput
  }

  export type UserRecentlyPlayedUncheckedCreateInput = {
    id?: string
    userId: string
    trackId?: string | null
    deezerId?: string | null
    scUrl?: string | null
    source: string
    title: string
    artistName: string
    artistId?: string | null
    album?: string | null
    coverUrl?: string | null
    duration: string
    durationSec?: number
    previewUrl?: string | null
    isrc?: string | null
    playedAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserRecentlyPlayedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    trackId?: NullableStringFieldUpdateOperationsInput | string | null
    deezerId?: NullableStringFieldUpdateOperationsInput | string | null
    scUrl?: NullableStringFieldUpdateOperationsInput | string | null
    source?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    artistName?: StringFieldUpdateOperationsInput | string
    artistId?: NullableStringFieldUpdateOperationsInput | string | null
    album?: NullableStringFieldUpdateOperationsInput | string | null
    coverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    duration?: StringFieldUpdateOperationsInput | string
    durationSec?: IntFieldUpdateOperationsInput | number
    previewUrl?: NullableStringFieldUpdateOperationsInput | string | null
    isrc?: NullableStringFieldUpdateOperationsInput | string | null
    playedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutRecentlyPlayedNestedInput
  }

  export type UserRecentlyPlayedUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    trackId?: NullableStringFieldUpdateOperationsInput | string | null
    deezerId?: NullableStringFieldUpdateOperationsInput | string | null
    scUrl?: NullableStringFieldUpdateOperationsInput | string | null
    source?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    artistName?: StringFieldUpdateOperationsInput | string
    artistId?: NullableStringFieldUpdateOperationsInput | string | null
    album?: NullableStringFieldUpdateOperationsInput | string | null
    coverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    duration?: StringFieldUpdateOperationsInput | string
    durationSec?: IntFieldUpdateOperationsInput | number
    previewUrl?: NullableStringFieldUpdateOperationsInput | string | null
    isrc?: NullableStringFieldUpdateOperationsInput | string | null
    playedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserRecentlyPlayedCreateManyInput = {
    id?: string
    userId: string
    trackId?: string | null
    deezerId?: string | null
    scUrl?: string | null
    source: string
    title: string
    artistName: string
    artistId?: string | null
    album?: string | null
    coverUrl?: string | null
    duration: string
    durationSec?: number
    previewUrl?: string | null
    isrc?: string | null
    playedAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserRecentlyPlayedUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    trackId?: NullableStringFieldUpdateOperationsInput | string | null
    deezerId?: NullableStringFieldUpdateOperationsInput | string | null
    scUrl?: NullableStringFieldUpdateOperationsInput | string | null
    source?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    artistName?: StringFieldUpdateOperationsInput | string
    artistId?: NullableStringFieldUpdateOperationsInput | string | null
    album?: NullableStringFieldUpdateOperationsInput | string | null
    coverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    duration?: StringFieldUpdateOperationsInput | string
    durationSec?: IntFieldUpdateOperationsInput | number
    previewUrl?: NullableStringFieldUpdateOperationsInput | string | null
    isrc?: NullableStringFieldUpdateOperationsInput | string | null
    playedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserRecentlyPlayedUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    trackId?: NullableStringFieldUpdateOperationsInput | string | null
    deezerId?: NullableStringFieldUpdateOperationsInput | string | null
    scUrl?: NullableStringFieldUpdateOperationsInput | string | null
    source?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    artistName?: StringFieldUpdateOperationsInput | string
    artistId?: NullableStringFieldUpdateOperationsInput | string | null
    album?: NullableStringFieldUpdateOperationsInput | string | null
    coverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    duration?: StringFieldUpdateOperationsInput | string
    durationSec?: IntFieldUpdateOperationsInput | number
    previewUrl?: NullableStringFieldUpdateOperationsInput | string | null
    isrc?: NullableStringFieldUpdateOperationsInput | string | null
    playedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SessionCreateInput = {
    id?: string
    refreshTokenHash: string
    device?: string | null
    expiresAt: Date | string
    user: UserCreateNestedOneWithoutSessionsInput
  }

  export type SessionUncheckedCreateInput = {
    id?: string
    userId: string
    refreshTokenHash: string
    device?: string | null
    expiresAt: Date | string
  }

  export type SessionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    refreshTokenHash?: StringFieldUpdateOperationsInput | string
    device?: NullableStringFieldUpdateOperationsInput | string | null
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutSessionsNestedInput
  }

  export type SessionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    refreshTokenHash?: StringFieldUpdateOperationsInput | string
    device?: NullableStringFieldUpdateOperationsInput | string | null
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SessionCreateManyInput = {
    id?: string
    userId: string
    refreshTokenHash: string
    device?: string | null
    expiresAt: Date | string
  }

  export type SessionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    refreshTokenHash?: StringFieldUpdateOperationsInput | string
    device?: NullableStringFieldUpdateOperationsInput | string | null
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SessionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    refreshTokenHash?: StringFieldUpdateOperationsInput | string
    device?: NullableStringFieldUpdateOperationsInput | string | null
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type UserLibraryListRelationFilter = {
    every?: UserLibraryWhereInput
    some?: UserLibraryWhereInput
    none?: UserLibraryWhereInput
  }

  export type UserRecentlyPlayedListRelationFilter = {
    every?: UserRecentlyPlayedWhereInput
    some?: UserRecentlyPlayedWhereInput
    none?: UserRecentlyPlayedWhereInput
  }

  export type SessionListRelationFilter = {
    every?: SessionWhereInput
    some?: SessionWhereInput
    none?: SessionWhereInput
  }

  export type VerificationCodeListRelationFilter = {
    every?: VerificationCodeWhereInput
    some?: VerificationCodeWhereInput
    none?: VerificationCodeWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type UserLibraryOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserRecentlyPlayedOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type SessionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type VerificationCodeOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    username?: SortOrder
    passwordHash?: SortOrder
    isVerified?: SortOrder
    verifyToken?: SortOrder
    verifyTokenExp?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    username?: SortOrder
    passwordHash?: SortOrder
    isVerified?: SortOrder
    verifyToken?: SortOrder
    verifyTokenExp?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    username?: SortOrder
    passwordHash?: SortOrder
    isVerified?: SortOrder
    verifyToken?: SortOrder
    verifyTokenExp?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type UserScalarRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type VerificationCodeCountOrderByAggregateInput = {
    id?: SortOrder
    code?: SortOrder
    userId?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
  }

  export type VerificationCodeMaxOrderByAggregateInput = {
    id?: SortOrder
    code?: SortOrder
    userId?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
  }

  export type VerificationCodeMinOrderByAggregateInput = {
    id?: SortOrder
    code?: SortOrder
    userId?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type UserLibraryUserIdDeezerIdCompoundUniqueInput = {
    userId: string
    deezerId: string
  }

  export type UserLibraryUserIdScUrlCompoundUniqueInput = {
    userId: string
    scUrl: string
  }

  export type UserLibraryCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    trackId?: SortOrder
    deezerId?: SortOrder
    scUrl?: SortOrder
    source?: SortOrder
    title?: SortOrder
    artistName?: SortOrder
    artistId?: SortOrder
    album?: SortOrder
    coverUrl?: SortOrder
    duration?: SortOrder
    durationSec?: SortOrder
    previewUrl?: SortOrder
    isrc?: SortOrder
    addedAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserLibraryAvgOrderByAggregateInput = {
    durationSec?: SortOrder
  }

  export type UserLibraryMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    trackId?: SortOrder
    deezerId?: SortOrder
    scUrl?: SortOrder
    source?: SortOrder
    title?: SortOrder
    artistName?: SortOrder
    artistId?: SortOrder
    album?: SortOrder
    coverUrl?: SortOrder
    duration?: SortOrder
    durationSec?: SortOrder
    previewUrl?: SortOrder
    isrc?: SortOrder
    addedAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserLibraryMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    trackId?: SortOrder
    deezerId?: SortOrder
    scUrl?: SortOrder
    source?: SortOrder
    title?: SortOrder
    artistName?: SortOrder
    artistId?: SortOrder
    album?: SortOrder
    coverUrl?: SortOrder
    duration?: SortOrder
    durationSec?: SortOrder
    previewUrl?: SortOrder
    isrc?: SortOrder
    addedAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserLibrarySumOrderByAggregateInput = {
    durationSec?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type UserRecentlyPlayedUserIdDeezerIdCompoundUniqueInput = {
    userId: string
    deezerId: string
  }

  export type UserRecentlyPlayedUserIdScUrlCompoundUniqueInput = {
    userId: string
    scUrl: string
  }

  export type UserRecentlyPlayedCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    trackId?: SortOrder
    deezerId?: SortOrder
    scUrl?: SortOrder
    source?: SortOrder
    title?: SortOrder
    artistName?: SortOrder
    artistId?: SortOrder
    album?: SortOrder
    coverUrl?: SortOrder
    duration?: SortOrder
    durationSec?: SortOrder
    previewUrl?: SortOrder
    isrc?: SortOrder
    playedAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserRecentlyPlayedAvgOrderByAggregateInput = {
    durationSec?: SortOrder
  }

  export type UserRecentlyPlayedMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    trackId?: SortOrder
    deezerId?: SortOrder
    scUrl?: SortOrder
    source?: SortOrder
    title?: SortOrder
    artistName?: SortOrder
    artistId?: SortOrder
    album?: SortOrder
    coverUrl?: SortOrder
    duration?: SortOrder
    durationSec?: SortOrder
    previewUrl?: SortOrder
    isrc?: SortOrder
    playedAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserRecentlyPlayedMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    trackId?: SortOrder
    deezerId?: SortOrder
    scUrl?: SortOrder
    source?: SortOrder
    title?: SortOrder
    artistName?: SortOrder
    artistId?: SortOrder
    album?: SortOrder
    coverUrl?: SortOrder
    duration?: SortOrder
    durationSec?: SortOrder
    previewUrl?: SortOrder
    isrc?: SortOrder
    playedAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserRecentlyPlayedSumOrderByAggregateInput = {
    durationSec?: SortOrder
  }

  export type SessionCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    refreshTokenHash?: SortOrder
    device?: SortOrder
    expiresAt?: SortOrder
  }

  export type SessionMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    refreshTokenHash?: SortOrder
    device?: SortOrder
    expiresAt?: SortOrder
  }

  export type SessionMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    refreshTokenHash?: SortOrder
    device?: SortOrder
    expiresAt?: SortOrder
  }

  export type UserLibraryCreateNestedManyWithoutUserInput = {
    create?: XOR<UserLibraryCreateWithoutUserInput, UserLibraryUncheckedCreateWithoutUserInput> | UserLibraryCreateWithoutUserInput[] | UserLibraryUncheckedCreateWithoutUserInput[]
    connectOrCreate?: UserLibraryCreateOrConnectWithoutUserInput | UserLibraryCreateOrConnectWithoutUserInput[]
    createMany?: UserLibraryCreateManyUserInputEnvelope
    connect?: UserLibraryWhereUniqueInput | UserLibraryWhereUniqueInput[]
  }

  export type UserRecentlyPlayedCreateNestedManyWithoutUserInput = {
    create?: XOR<UserRecentlyPlayedCreateWithoutUserInput, UserRecentlyPlayedUncheckedCreateWithoutUserInput> | UserRecentlyPlayedCreateWithoutUserInput[] | UserRecentlyPlayedUncheckedCreateWithoutUserInput[]
    connectOrCreate?: UserRecentlyPlayedCreateOrConnectWithoutUserInput | UserRecentlyPlayedCreateOrConnectWithoutUserInput[]
    createMany?: UserRecentlyPlayedCreateManyUserInputEnvelope
    connect?: UserRecentlyPlayedWhereUniqueInput | UserRecentlyPlayedWhereUniqueInput[]
  }

  export type SessionCreateNestedManyWithoutUserInput = {
    create?: XOR<SessionCreateWithoutUserInput, SessionUncheckedCreateWithoutUserInput> | SessionCreateWithoutUserInput[] | SessionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SessionCreateOrConnectWithoutUserInput | SessionCreateOrConnectWithoutUserInput[]
    createMany?: SessionCreateManyUserInputEnvelope
    connect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
  }

  export type VerificationCodeCreateNestedManyWithoutUserInput = {
    create?: XOR<VerificationCodeCreateWithoutUserInput, VerificationCodeUncheckedCreateWithoutUserInput> | VerificationCodeCreateWithoutUserInput[] | VerificationCodeUncheckedCreateWithoutUserInput[]
    connectOrCreate?: VerificationCodeCreateOrConnectWithoutUserInput | VerificationCodeCreateOrConnectWithoutUserInput[]
    createMany?: VerificationCodeCreateManyUserInputEnvelope
    connect?: VerificationCodeWhereUniqueInput | VerificationCodeWhereUniqueInput[]
  }

  export type UserLibraryUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<UserLibraryCreateWithoutUserInput, UserLibraryUncheckedCreateWithoutUserInput> | UserLibraryCreateWithoutUserInput[] | UserLibraryUncheckedCreateWithoutUserInput[]
    connectOrCreate?: UserLibraryCreateOrConnectWithoutUserInput | UserLibraryCreateOrConnectWithoutUserInput[]
    createMany?: UserLibraryCreateManyUserInputEnvelope
    connect?: UserLibraryWhereUniqueInput | UserLibraryWhereUniqueInput[]
  }

  export type UserRecentlyPlayedUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<UserRecentlyPlayedCreateWithoutUserInput, UserRecentlyPlayedUncheckedCreateWithoutUserInput> | UserRecentlyPlayedCreateWithoutUserInput[] | UserRecentlyPlayedUncheckedCreateWithoutUserInput[]
    connectOrCreate?: UserRecentlyPlayedCreateOrConnectWithoutUserInput | UserRecentlyPlayedCreateOrConnectWithoutUserInput[]
    createMany?: UserRecentlyPlayedCreateManyUserInputEnvelope
    connect?: UserRecentlyPlayedWhereUniqueInput | UserRecentlyPlayedWhereUniqueInput[]
  }

  export type SessionUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<SessionCreateWithoutUserInput, SessionUncheckedCreateWithoutUserInput> | SessionCreateWithoutUserInput[] | SessionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SessionCreateOrConnectWithoutUserInput | SessionCreateOrConnectWithoutUserInput[]
    createMany?: SessionCreateManyUserInputEnvelope
    connect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
  }

  export type VerificationCodeUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<VerificationCodeCreateWithoutUserInput, VerificationCodeUncheckedCreateWithoutUserInput> | VerificationCodeCreateWithoutUserInput[] | VerificationCodeUncheckedCreateWithoutUserInput[]
    connectOrCreate?: VerificationCodeCreateOrConnectWithoutUserInput | VerificationCodeCreateOrConnectWithoutUserInput[]
    createMany?: VerificationCodeCreateManyUserInputEnvelope
    connect?: VerificationCodeWhereUniqueInput | VerificationCodeWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type UserLibraryUpdateManyWithoutUserNestedInput = {
    create?: XOR<UserLibraryCreateWithoutUserInput, UserLibraryUncheckedCreateWithoutUserInput> | UserLibraryCreateWithoutUserInput[] | UserLibraryUncheckedCreateWithoutUserInput[]
    connectOrCreate?: UserLibraryCreateOrConnectWithoutUserInput | UserLibraryCreateOrConnectWithoutUserInput[]
    upsert?: UserLibraryUpsertWithWhereUniqueWithoutUserInput | UserLibraryUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: UserLibraryCreateManyUserInputEnvelope
    set?: UserLibraryWhereUniqueInput | UserLibraryWhereUniqueInput[]
    disconnect?: UserLibraryWhereUniqueInput | UserLibraryWhereUniqueInput[]
    delete?: UserLibraryWhereUniqueInput | UserLibraryWhereUniqueInput[]
    connect?: UserLibraryWhereUniqueInput | UserLibraryWhereUniqueInput[]
    update?: UserLibraryUpdateWithWhereUniqueWithoutUserInput | UserLibraryUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: UserLibraryUpdateManyWithWhereWithoutUserInput | UserLibraryUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: UserLibraryScalarWhereInput | UserLibraryScalarWhereInput[]
  }

  export type UserRecentlyPlayedUpdateManyWithoutUserNestedInput = {
    create?: XOR<UserRecentlyPlayedCreateWithoutUserInput, UserRecentlyPlayedUncheckedCreateWithoutUserInput> | UserRecentlyPlayedCreateWithoutUserInput[] | UserRecentlyPlayedUncheckedCreateWithoutUserInput[]
    connectOrCreate?: UserRecentlyPlayedCreateOrConnectWithoutUserInput | UserRecentlyPlayedCreateOrConnectWithoutUserInput[]
    upsert?: UserRecentlyPlayedUpsertWithWhereUniqueWithoutUserInput | UserRecentlyPlayedUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: UserRecentlyPlayedCreateManyUserInputEnvelope
    set?: UserRecentlyPlayedWhereUniqueInput | UserRecentlyPlayedWhereUniqueInput[]
    disconnect?: UserRecentlyPlayedWhereUniqueInput | UserRecentlyPlayedWhereUniqueInput[]
    delete?: UserRecentlyPlayedWhereUniqueInput | UserRecentlyPlayedWhereUniqueInput[]
    connect?: UserRecentlyPlayedWhereUniqueInput | UserRecentlyPlayedWhereUniqueInput[]
    update?: UserRecentlyPlayedUpdateWithWhereUniqueWithoutUserInput | UserRecentlyPlayedUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: UserRecentlyPlayedUpdateManyWithWhereWithoutUserInput | UserRecentlyPlayedUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: UserRecentlyPlayedScalarWhereInput | UserRecentlyPlayedScalarWhereInput[]
  }

  export type SessionUpdateManyWithoutUserNestedInput = {
    create?: XOR<SessionCreateWithoutUserInput, SessionUncheckedCreateWithoutUserInput> | SessionCreateWithoutUserInput[] | SessionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SessionCreateOrConnectWithoutUserInput | SessionCreateOrConnectWithoutUserInput[]
    upsert?: SessionUpsertWithWhereUniqueWithoutUserInput | SessionUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: SessionCreateManyUserInputEnvelope
    set?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    disconnect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    delete?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    connect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    update?: SessionUpdateWithWhereUniqueWithoutUserInput | SessionUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: SessionUpdateManyWithWhereWithoutUserInput | SessionUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: SessionScalarWhereInput | SessionScalarWhereInput[]
  }

  export type VerificationCodeUpdateManyWithoutUserNestedInput = {
    create?: XOR<VerificationCodeCreateWithoutUserInput, VerificationCodeUncheckedCreateWithoutUserInput> | VerificationCodeCreateWithoutUserInput[] | VerificationCodeUncheckedCreateWithoutUserInput[]
    connectOrCreate?: VerificationCodeCreateOrConnectWithoutUserInput | VerificationCodeCreateOrConnectWithoutUserInput[]
    upsert?: VerificationCodeUpsertWithWhereUniqueWithoutUserInput | VerificationCodeUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: VerificationCodeCreateManyUserInputEnvelope
    set?: VerificationCodeWhereUniqueInput | VerificationCodeWhereUniqueInput[]
    disconnect?: VerificationCodeWhereUniqueInput | VerificationCodeWhereUniqueInput[]
    delete?: VerificationCodeWhereUniqueInput | VerificationCodeWhereUniqueInput[]
    connect?: VerificationCodeWhereUniqueInput | VerificationCodeWhereUniqueInput[]
    update?: VerificationCodeUpdateWithWhereUniqueWithoutUserInput | VerificationCodeUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: VerificationCodeUpdateManyWithWhereWithoutUserInput | VerificationCodeUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: VerificationCodeScalarWhereInput | VerificationCodeScalarWhereInput[]
  }

  export type UserLibraryUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<UserLibraryCreateWithoutUserInput, UserLibraryUncheckedCreateWithoutUserInput> | UserLibraryCreateWithoutUserInput[] | UserLibraryUncheckedCreateWithoutUserInput[]
    connectOrCreate?: UserLibraryCreateOrConnectWithoutUserInput | UserLibraryCreateOrConnectWithoutUserInput[]
    upsert?: UserLibraryUpsertWithWhereUniqueWithoutUserInput | UserLibraryUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: UserLibraryCreateManyUserInputEnvelope
    set?: UserLibraryWhereUniqueInput | UserLibraryWhereUniqueInput[]
    disconnect?: UserLibraryWhereUniqueInput | UserLibraryWhereUniqueInput[]
    delete?: UserLibraryWhereUniqueInput | UserLibraryWhereUniqueInput[]
    connect?: UserLibraryWhereUniqueInput | UserLibraryWhereUniqueInput[]
    update?: UserLibraryUpdateWithWhereUniqueWithoutUserInput | UserLibraryUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: UserLibraryUpdateManyWithWhereWithoutUserInput | UserLibraryUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: UserLibraryScalarWhereInput | UserLibraryScalarWhereInput[]
  }

  export type UserRecentlyPlayedUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<UserRecentlyPlayedCreateWithoutUserInput, UserRecentlyPlayedUncheckedCreateWithoutUserInput> | UserRecentlyPlayedCreateWithoutUserInput[] | UserRecentlyPlayedUncheckedCreateWithoutUserInput[]
    connectOrCreate?: UserRecentlyPlayedCreateOrConnectWithoutUserInput | UserRecentlyPlayedCreateOrConnectWithoutUserInput[]
    upsert?: UserRecentlyPlayedUpsertWithWhereUniqueWithoutUserInput | UserRecentlyPlayedUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: UserRecentlyPlayedCreateManyUserInputEnvelope
    set?: UserRecentlyPlayedWhereUniqueInput | UserRecentlyPlayedWhereUniqueInput[]
    disconnect?: UserRecentlyPlayedWhereUniqueInput | UserRecentlyPlayedWhereUniqueInput[]
    delete?: UserRecentlyPlayedWhereUniqueInput | UserRecentlyPlayedWhereUniqueInput[]
    connect?: UserRecentlyPlayedWhereUniqueInput | UserRecentlyPlayedWhereUniqueInput[]
    update?: UserRecentlyPlayedUpdateWithWhereUniqueWithoutUserInput | UserRecentlyPlayedUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: UserRecentlyPlayedUpdateManyWithWhereWithoutUserInput | UserRecentlyPlayedUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: UserRecentlyPlayedScalarWhereInput | UserRecentlyPlayedScalarWhereInput[]
  }

  export type SessionUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<SessionCreateWithoutUserInput, SessionUncheckedCreateWithoutUserInput> | SessionCreateWithoutUserInput[] | SessionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SessionCreateOrConnectWithoutUserInput | SessionCreateOrConnectWithoutUserInput[]
    upsert?: SessionUpsertWithWhereUniqueWithoutUserInput | SessionUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: SessionCreateManyUserInputEnvelope
    set?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    disconnect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    delete?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    connect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    update?: SessionUpdateWithWhereUniqueWithoutUserInput | SessionUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: SessionUpdateManyWithWhereWithoutUserInput | SessionUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: SessionScalarWhereInput | SessionScalarWhereInput[]
  }

  export type VerificationCodeUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<VerificationCodeCreateWithoutUserInput, VerificationCodeUncheckedCreateWithoutUserInput> | VerificationCodeCreateWithoutUserInput[] | VerificationCodeUncheckedCreateWithoutUserInput[]
    connectOrCreate?: VerificationCodeCreateOrConnectWithoutUserInput | VerificationCodeCreateOrConnectWithoutUserInput[]
    upsert?: VerificationCodeUpsertWithWhereUniqueWithoutUserInput | VerificationCodeUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: VerificationCodeCreateManyUserInputEnvelope
    set?: VerificationCodeWhereUniqueInput | VerificationCodeWhereUniqueInput[]
    disconnect?: VerificationCodeWhereUniqueInput | VerificationCodeWhereUniqueInput[]
    delete?: VerificationCodeWhereUniqueInput | VerificationCodeWhereUniqueInput[]
    connect?: VerificationCodeWhereUniqueInput | VerificationCodeWhereUniqueInput[]
    update?: VerificationCodeUpdateWithWhereUniqueWithoutUserInput | VerificationCodeUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: VerificationCodeUpdateManyWithWhereWithoutUserInput | VerificationCodeUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: VerificationCodeScalarWhereInput | VerificationCodeScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutCodesInput = {
    create?: XOR<UserCreateWithoutCodesInput, UserUncheckedCreateWithoutCodesInput>
    connectOrCreate?: UserCreateOrConnectWithoutCodesInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutCodesNestedInput = {
    create?: XOR<UserCreateWithoutCodesInput, UserUncheckedCreateWithoutCodesInput>
    connectOrCreate?: UserCreateOrConnectWithoutCodesInput
    upsert?: UserUpsertWithoutCodesInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutCodesInput, UserUpdateWithoutCodesInput>, UserUncheckedUpdateWithoutCodesInput>
  }

  export type UserCreateNestedOneWithoutUserLibrariesInput = {
    create?: XOR<UserCreateWithoutUserLibrariesInput, UserUncheckedCreateWithoutUserLibrariesInput>
    connectOrCreate?: UserCreateOrConnectWithoutUserLibrariesInput
    connect?: UserWhereUniqueInput
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type UserUpdateOneRequiredWithoutUserLibrariesNestedInput = {
    create?: XOR<UserCreateWithoutUserLibrariesInput, UserUncheckedCreateWithoutUserLibrariesInput>
    connectOrCreate?: UserCreateOrConnectWithoutUserLibrariesInput
    upsert?: UserUpsertWithoutUserLibrariesInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutUserLibrariesInput, UserUpdateWithoutUserLibrariesInput>, UserUncheckedUpdateWithoutUserLibrariesInput>
  }

  export type UserCreateNestedOneWithoutRecentlyPlayedInput = {
    create?: XOR<UserCreateWithoutRecentlyPlayedInput, UserUncheckedCreateWithoutRecentlyPlayedInput>
    connectOrCreate?: UserCreateOrConnectWithoutRecentlyPlayedInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutRecentlyPlayedNestedInput = {
    create?: XOR<UserCreateWithoutRecentlyPlayedInput, UserUncheckedCreateWithoutRecentlyPlayedInput>
    connectOrCreate?: UserCreateOrConnectWithoutRecentlyPlayedInput
    upsert?: UserUpsertWithoutRecentlyPlayedInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutRecentlyPlayedInput, UserUpdateWithoutRecentlyPlayedInput>, UserUncheckedUpdateWithoutRecentlyPlayedInput>
  }

  export type UserCreateNestedOneWithoutSessionsInput = {
    create?: XOR<UserCreateWithoutSessionsInput, UserUncheckedCreateWithoutSessionsInput>
    connectOrCreate?: UserCreateOrConnectWithoutSessionsInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutSessionsNestedInput = {
    create?: XOR<UserCreateWithoutSessionsInput, UserUncheckedCreateWithoutSessionsInput>
    connectOrCreate?: UserCreateOrConnectWithoutSessionsInput
    upsert?: UserUpsertWithoutSessionsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutSessionsInput, UserUpdateWithoutSessionsInput>, UserUncheckedUpdateWithoutSessionsInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type UserLibraryCreateWithoutUserInput = {
    id?: string
    trackId?: string | null
    deezerId?: string | null
    scUrl?: string | null
    source: string
    title: string
    artistName: string
    artistId?: string | null
    album?: string | null
    coverUrl?: string | null
    duration: string
    durationSec?: number
    previewUrl?: string | null
    isrc?: string | null
    addedAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserLibraryUncheckedCreateWithoutUserInput = {
    id?: string
    trackId?: string | null
    deezerId?: string | null
    scUrl?: string | null
    source: string
    title: string
    artistName: string
    artistId?: string | null
    album?: string | null
    coverUrl?: string | null
    duration: string
    durationSec?: number
    previewUrl?: string | null
    isrc?: string | null
    addedAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserLibraryCreateOrConnectWithoutUserInput = {
    where: UserLibraryWhereUniqueInput
    create: XOR<UserLibraryCreateWithoutUserInput, UserLibraryUncheckedCreateWithoutUserInput>
  }

  export type UserLibraryCreateManyUserInputEnvelope = {
    data: UserLibraryCreateManyUserInput | UserLibraryCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type UserRecentlyPlayedCreateWithoutUserInput = {
    id?: string
    trackId?: string | null
    deezerId?: string | null
    scUrl?: string | null
    source: string
    title: string
    artistName: string
    artistId?: string | null
    album?: string | null
    coverUrl?: string | null
    duration: string
    durationSec?: number
    previewUrl?: string | null
    isrc?: string | null
    playedAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserRecentlyPlayedUncheckedCreateWithoutUserInput = {
    id?: string
    trackId?: string | null
    deezerId?: string | null
    scUrl?: string | null
    source: string
    title: string
    artistName: string
    artistId?: string | null
    album?: string | null
    coverUrl?: string | null
    duration: string
    durationSec?: number
    previewUrl?: string | null
    isrc?: string | null
    playedAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserRecentlyPlayedCreateOrConnectWithoutUserInput = {
    where: UserRecentlyPlayedWhereUniqueInput
    create: XOR<UserRecentlyPlayedCreateWithoutUserInput, UserRecentlyPlayedUncheckedCreateWithoutUserInput>
  }

  export type UserRecentlyPlayedCreateManyUserInputEnvelope = {
    data: UserRecentlyPlayedCreateManyUserInput | UserRecentlyPlayedCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type SessionCreateWithoutUserInput = {
    id?: string
    refreshTokenHash: string
    device?: string | null
    expiresAt: Date | string
  }

  export type SessionUncheckedCreateWithoutUserInput = {
    id?: string
    refreshTokenHash: string
    device?: string | null
    expiresAt: Date | string
  }

  export type SessionCreateOrConnectWithoutUserInput = {
    where: SessionWhereUniqueInput
    create: XOR<SessionCreateWithoutUserInput, SessionUncheckedCreateWithoutUserInput>
  }

  export type SessionCreateManyUserInputEnvelope = {
    data: SessionCreateManyUserInput | SessionCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type VerificationCodeCreateWithoutUserInput = {
    id?: string
    code: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type VerificationCodeUncheckedCreateWithoutUserInput = {
    id?: string
    code: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type VerificationCodeCreateOrConnectWithoutUserInput = {
    where: VerificationCodeWhereUniqueInput
    create: XOR<VerificationCodeCreateWithoutUserInput, VerificationCodeUncheckedCreateWithoutUserInput>
  }

  export type VerificationCodeCreateManyUserInputEnvelope = {
    data: VerificationCodeCreateManyUserInput | VerificationCodeCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type UserLibraryUpsertWithWhereUniqueWithoutUserInput = {
    where: UserLibraryWhereUniqueInput
    update: XOR<UserLibraryUpdateWithoutUserInput, UserLibraryUncheckedUpdateWithoutUserInput>
    create: XOR<UserLibraryCreateWithoutUserInput, UserLibraryUncheckedCreateWithoutUserInput>
  }

  export type UserLibraryUpdateWithWhereUniqueWithoutUserInput = {
    where: UserLibraryWhereUniqueInput
    data: XOR<UserLibraryUpdateWithoutUserInput, UserLibraryUncheckedUpdateWithoutUserInput>
  }

  export type UserLibraryUpdateManyWithWhereWithoutUserInput = {
    where: UserLibraryScalarWhereInput
    data: XOR<UserLibraryUpdateManyMutationInput, UserLibraryUncheckedUpdateManyWithoutUserInput>
  }

  export type UserLibraryScalarWhereInput = {
    AND?: UserLibraryScalarWhereInput | UserLibraryScalarWhereInput[]
    OR?: UserLibraryScalarWhereInput[]
    NOT?: UserLibraryScalarWhereInput | UserLibraryScalarWhereInput[]
    id?: StringFilter<"UserLibrary"> | string
    userId?: StringFilter<"UserLibrary"> | string
    trackId?: StringNullableFilter<"UserLibrary"> | string | null
    deezerId?: StringNullableFilter<"UserLibrary"> | string | null
    scUrl?: StringNullableFilter<"UserLibrary"> | string | null
    source?: StringFilter<"UserLibrary"> | string
    title?: StringFilter<"UserLibrary"> | string
    artistName?: StringFilter<"UserLibrary"> | string
    artistId?: StringNullableFilter<"UserLibrary"> | string | null
    album?: StringNullableFilter<"UserLibrary"> | string | null
    coverUrl?: StringNullableFilter<"UserLibrary"> | string | null
    duration?: StringFilter<"UserLibrary"> | string
    durationSec?: IntFilter<"UserLibrary"> | number
    previewUrl?: StringNullableFilter<"UserLibrary"> | string | null
    isrc?: StringNullableFilter<"UserLibrary"> | string | null
    addedAt?: DateTimeFilter<"UserLibrary"> | Date | string
    updatedAt?: DateTimeFilter<"UserLibrary"> | Date | string
  }

  export type UserRecentlyPlayedUpsertWithWhereUniqueWithoutUserInput = {
    where: UserRecentlyPlayedWhereUniqueInput
    update: XOR<UserRecentlyPlayedUpdateWithoutUserInput, UserRecentlyPlayedUncheckedUpdateWithoutUserInput>
    create: XOR<UserRecentlyPlayedCreateWithoutUserInput, UserRecentlyPlayedUncheckedCreateWithoutUserInput>
  }

  export type UserRecentlyPlayedUpdateWithWhereUniqueWithoutUserInput = {
    where: UserRecentlyPlayedWhereUniqueInput
    data: XOR<UserRecentlyPlayedUpdateWithoutUserInput, UserRecentlyPlayedUncheckedUpdateWithoutUserInput>
  }

  export type UserRecentlyPlayedUpdateManyWithWhereWithoutUserInput = {
    where: UserRecentlyPlayedScalarWhereInput
    data: XOR<UserRecentlyPlayedUpdateManyMutationInput, UserRecentlyPlayedUncheckedUpdateManyWithoutUserInput>
  }

  export type UserRecentlyPlayedScalarWhereInput = {
    AND?: UserRecentlyPlayedScalarWhereInput | UserRecentlyPlayedScalarWhereInput[]
    OR?: UserRecentlyPlayedScalarWhereInput[]
    NOT?: UserRecentlyPlayedScalarWhereInput | UserRecentlyPlayedScalarWhereInput[]
    id?: StringFilter<"UserRecentlyPlayed"> | string
    userId?: StringFilter<"UserRecentlyPlayed"> | string
    trackId?: StringNullableFilter<"UserRecentlyPlayed"> | string | null
    deezerId?: StringNullableFilter<"UserRecentlyPlayed"> | string | null
    scUrl?: StringNullableFilter<"UserRecentlyPlayed"> | string | null
    source?: StringFilter<"UserRecentlyPlayed"> | string
    title?: StringFilter<"UserRecentlyPlayed"> | string
    artistName?: StringFilter<"UserRecentlyPlayed"> | string
    artistId?: StringNullableFilter<"UserRecentlyPlayed"> | string | null
    album?: StringNullableFilter<"UserRecentlyPlayed"> | string | null
    coverUrl?: StringNullableFilter<"UserRecentlyPlayed"> | string | null
    duration?: StringFilter<"UserRecentlyPlayed"> | string
    durationSec?: IntFilter<"UserRecentlyPlayed"> | number
    previewUrl?: StringNullableFilter<"UserRecentlyPlayed"> | string | null
    isrc?: StringNullableFilter<"UserRecentlyPlayed"> | string | null
    playedAt?: DateTimeFilter<"UserRecentlyPlayed"> | Date | string
    updatedAt?: DateTimeFilter<"UserRecentlyPlayed"> | Date | string
  }

  export type SessionUpsertWithWhereUniqueWithoutUserInput = {
    where: SessionWhereUniqueInput
    update: XOR<SessionUpdateWithoutUserInput, SessionUncheckedUpdateWithoutUserInput>
    create: XOR<SessionCreateWithoutUserInput, SessionUncheckedCreateWithoutUserInput>
  }

  export type SessionUpdateWithWhereUniqueWithoutUserInput = {
    where: SessionWhereUniqueInput
    data: XOR<SessionUpdateWithoutUserInput, SessionUncheckedUpdateWithoutUserInput>
  }

  export type SessionUpdateManyWithWhereWithoutUserInput = {
    where: SessionScalarWhereInput
    data: XOR<SessionUpdateManyMutationInput, SessionUncheckedUpdateManyWithoutUserInput>
  }

  export type SessionScalarWhereInput = {
    AND?: SessionScalarWhereInput | SessionScalarWhereInput[]
    OR?: SessionScalarWhereInput[]
    NOT?: SessionScalarWhereInput | SessionScalarWhereInput[]
    id?: StringFilter<"Session"> | string
    userId?: StringFilter<"Session"> | string
    refreshTokenHash?: StringFilter<"Session"> | string
    device?: StringNullableFilter<"Session"> | string | null
    expiresAt?: DateTimeFilter<"Session"> | Date | string
  }

  export type VerificationCodeUpsertWithWhereUniqueWithoutUserInput = {
    where: VerificationCodeWhereUniqueInput
    update: XOR<VerificationCodeUpdateWithoutUserInput, VerificationCodeUncheckedUpdateWithoutUserInput>
    create: XOR<VerificationCodeCreateWithoutUserInput, VerificationCodeUncheckedCreateWithoutUserInput>
  }

  export type VerificationCodeUpdateWithWhereUniqueWithoutUserInput = {
    where: VerificationCodeWhereUniqueInput
    data: XOR<VerificationCodeUpdateWithoutUserInput, VerificationCodeUncheckedUpdateWithoutUserInput>
  }

  export type VerificationCodeUpdateManyWithWhereWithoutUserInput = {
    where: VerificationCodeScalarWhereInput
    data: XOR<VerificationCodeUpdateManyMutationInput, VerificationCodeUncheckedUpdateManyWithoutUserInput>
  }

  export type VerificationCodeScalarWhereInput = {
    AND?: VerificationCodeScalarWhereInput | VerificationCodeScalarWhereInput[]
    OR?: VerificationCodeScalarWhereInput[]
    NOT?: VerificationCodeScalarWhereInput | VerificationCodeScalarWhereInput[]
    id?: StringFilter<"VerificationCode"> | string
    code?: StringFilter<"VerificationCode"> | string
    userId?: StringFilter<"VerificationCode"> | string
    expiresAt?: DateTimeFilter<"VerificationCode"> | Date | string
    createdAt?: DateTimeFilter<"VerificationCode"> | Date | string
  }

  export type UserCreateWithoutCodesInput = {
    id?: string
    name: string
    email: string
    username: string
    passwordHash: string
    isVerified?: boolean
    verifyToken?: string | null
    verifyTokenExp?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    userLibraries?: UserLibraryCreateNestedManyWithoutUserInput
    recentlyPlayed?: UserRecentlyPlayedCreateNestedManyWithoutUserInput
    sessions?: SessionCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutCodesInput = {
    id?: string
    name: string
    email: string
    username: string
    passwordHash: string
    isVerified?: boolean
    verifyToken?: string | null
    verifyTokenExp?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    userLibraries?: UserLibraryUncheckedCreateNestedManyWithoutUserInput
    recentlyPlayed?: UserRecentlyPlayedUncheckedCreateNestedManyWithoutUserInput
    sessions?: SessionUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutCodesInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutCodesInput, UserUncheckedCreateWithoutCodesInput>
  }

  export type UserUpsertWithoutCodesInput = {
    update: XOR<UserUpdateWithoutCodesInput, UserUncheckedUpdateWithoutCodesInput>
    create: XOR<UserCreateWithoutCodesInput, UserUncheckedCreateWithoutCodesInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutCodesInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutCodesInput, UserUncheckedUpdateWithoutCodesInput>
  }

  export type UserUpdateWithoutCodesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    verifyToken?: NullableStringFieldUpdateOperationsInput | string | null
    verifyTokenExp?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    userLibraries?: UserLibraryUpdateManyWithoutUserNestedInput
    recentlyPlayed?: UserRecentlyPlayedUpdateManyWithoutUserNestedInput
    sessions?: SessionUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutCodesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    verifyToken?: NullableStringFieldUpdateOperationsInput | string | null
    verifyTokenExp?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    userLibraries?: UserLibraryUncheckedUpdateManyWithoutUserNestedInput
    recentlyPlayed?: UserRecentlyPlayedUncheckedUpdateManyWithoutUserNestedInput
    sessions?: SessionUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateWithoutUserLibrariesInput = {
    id?: string
    name: string
    email: string
    username: string
    passwordHash: string
    isVerified?: boolean
    verifyToken?: string | null
    verifyTokenExp?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    recentlyPlayed?: UserRecentlyPlayedCreateNestedManyWithoutUserInput
    sessions?: SessionCreateNestedManyWithoutUserInput
    codes?: VerificationCodeCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutUserLibrariesInput = {
    id?: string
    name: string
    email: string
    username: string
    passwordHash: string
    isVerified?: boolean
    verifyToken?: string | null
    verifyTokenExp?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    recentlyPlayed?: UserRecentlyPlayedUncheckedCreateNestedManyWithoutUserInput
    sessions?: SessionUncheckedCreateNestedManyWithoutUserInput
    codes?: VerificationCodeUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutUserLibrariesInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutUserLibrariesInput, UserUncheckedCreateWithoutUserLibrariesInput>
  }

  export type UserUpsertWithoutUserLibrariesInput = {
    update: XOR<UserUpdateWithoutUserLibrariesInput, UserUncheckedUpdateWithoutUserLibrariesInput>
    create: XOR<UserCreateWithoutUserLibrariesInput, UserUncheckedCreateWithoutUserLibrariesInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutUserLibrariesInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutUserLibrariesInput, UserUncheckedUpdateWithoutUserLibrariesInput>
  }

  export type UserUpdateWithoutUserLibrariesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    verifyToken?: NullableStringFieldUpdateOperationsInput | string | null
    verifyTokenExp?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    recentlyPlayed?: UserRecentlyPlayedUpdateManyWithoutUserNestedInput
    sessions?: SessionUpdateManyWithoutUserNestedInput
    codes?: VerificationCodeUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutUserLibrariesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    verifyToken?: NullableStringFieldUpdateOperationsInput | string | null
    verifyTokenExp?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    recentlyPlayed?: UserRecentlyPlayedUncheckedUpdateManyWithoutUserNestedInput
    sessions?: SessionUncheckedUpdateManyWithoutUserNestedInput
    codes?: VerificationCodeUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateWithoutRecentlyPlayedInput = {
    id?: string
    name: string
    email: string
    username: string
    passwordHash: string
    isVerified?: boolean
    verifyToken?: string | null
    verifyTokenExp?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    userLibraries?: UserLibraryCreateNestedManyWithoutUserInput
    sessions?: SessionCreateNestedManyWithoutUserInput
    codes?: VerificationCodeCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutRecentlyPlayedInput = {
    id?: string
    name: string
    email: string
    username: string
    passwordHash: string
    isVerified?: boolean
    verifyToken?: string | null
    verifyTokenExp?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    userLibraries?: UserLibraryUncheckedCreateNestedManyWithoutUserInput
    sessions?: SessionUncheckedCreateNestedManyWithoutUserInput
    codes?: VerificationCodeUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutRecentlyPlayedInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutRecentlyPlayedInput, UserUncheckedCreateWithoutRecentlyPlayedInput>
  }

  export type UserUpsertWithoutRecentlyPlayedInput = {
    update: XOR<UserUpdateWithoutRecentlyPlayedInput, UserUncheckedUpdateWithoutRecentlyPlayedInput>
    create: XOR<UserCreateWithoutRecentlyPlayedInput, UserUncheckedCreateWithoutRecentlyPlayedInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutRecentlyPlayedInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutRecentlyPlayedInput, UserUncheckedUpdateWithoutRecentlyPlayedInput>
  }

  export type UserUpdateWithoutRecentlyPlayedInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    verifyToken?: NullableStringFieldUpdateOperationsInput | string | null
    verifyTokenExp?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    userLibraries?: UserLibraryUpdateManyWithoutUserNestedInput
    sessions?: SessionUpdateManyWithoutUserNestedInput
    codes?: VerificationCodeUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutRecentlyPlayedInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    verifyToken?: NullableStringFieldUpdateOperationsInput | string | null
    verifyTokenExp?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    userLibraries?: UserLibraryUncheckedUpdateManyWithoutUserNestedInput
    sessions?: SessionUncheckedUpdateManyWithoutUserNestedInput
    codes?: VerificationCodeUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateWithoutSessionsInput = {
    id?: string
    name: string
    email: string
    username: string
    passwordHash: string
    isVerified?: boolean
    verifyToken?: string | null
    verifyTokenExp?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    userLibraries?: UserLibraryCreateNestedManyWithoutUserInput
    recentlyPlayed?: UserRecentlyPlayedCreateNestedManyWithoutUserInput
    codes?: VerificationCodeCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutSessionsInput = {
    id?: string
    name: string
    email: string
    username: string
    passwordHash: string
    isVerified?: boolean
    verifyToken?: string | null
    verifyTokenExp?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    userLibraries?: UserLibraryUncheckedCreateNestedManyWithoutUserInput
    recentlyPlayed?: UserRecentlyPlayedUncheckedCreateNestedManyWithoutUserInput
    codes?: VerificationCodeUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutSessionsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutSessionsInput, UserUncheckedCreateWithoutSessionsInput>
  }

  export type UserUpsertWithoutSessionsInput = {
    update: XOR<UserUpdateWithoutSessionsInput, UserUncheckedUpdateWithoutSessionsInput>
    create: XOR<UserCreateWithoutSessionsInput, UserUncheckedCreateWithoutSessionsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutSessionsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutSessionsInput, UserUncheckedUpdateWithoutSessionsInput>
  }

  export type UserUpdateWithoutSessionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    verifyToken?: NullableStringFieldUpdateOperationsInput | string | null
    verifyTokenExp?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    userLibraries?: UserLibraryUpdateManyWithoutUserNestedInput
    recentlyPlayed?: UserRecentlyPlayedUpdateManyWithoutUserNestedInput
    codes?: VerificationCodeUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutSessionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    verifyToken?: NullableStringFieldUpdateOperationsInput | string | null
    verifyTokenExp?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    userLibraries?: UserLibraryUncheckedUpdateManyWithoutUserNestedInput
    recentlyPlayed?: UserRecentlyPlayedUncheckedUpdateManyWithoutUserNestedInput
    codes?: VerificationCodeUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserLibraryCreateManyUserInput = {
    id?: string
    trackId?: string | null
    deezerId?: string | null
    scUrl?: string | null
    source: string
    title: string
    artistName: string
    artistId?: string | null
    album?: string | null
    coverUrl?: string | null
    duration: string
    durationSec?: number
    previewUrl?: string | null
    isrc?: string | null
    addedAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserRecentlyPlayedCreateManyUserInput = {
    id?: string
    trackId?: string | null
    deezerId?: string | null
    scUrl?: string | null
    source: string
    title: string
    artistName: string
    artistId?: string | null
    album?: string | null
    coverUrl?: string | null
    duration: string
    durationSec?: number
    previewUrl?: string | null
    isrc?: string | null
    playedAt?: Date | string
    updatedAt?: Date | string
  }

  export type SessionCreateManyUserInput = {
    id?: string
    refreshTokenHash: string
    device?: string | null
    expiresAt: Date | string
  }

  export type VerificationCodeCreateManyUserInput = {
    id?: string
    code: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type UserLibraryUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    trackId?: NullableStringFieldUpdateOperationsInput | string | null
    deezerId?: NullableStringFieldUpdateOperationsInput | string | null
    scUrl?: NullableStringFieldUpdateOperationsInput | string | null
    source?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    artistName?: StringFieldUpdateOperationsInput | string
    artistId?: NullableStringFieldUpdateOperationsInput | string | null
    album?: NullableStringFieldUpdateOperationsInput | string | null
    coverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    duration?: StringFieldUpdateOperationsInput | string
    durationSec?: IntFieldUpdateOperationsInput | number
    previewUrl?: NullableStringFieldUpdateOperationsInput | string | null
    isrc?: NullableStringFieldUpdateOperationsInput | string | null
    addedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserLibraryUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    trackId?: NullableStringFieldUpdateOperationsInput | string | null
    deezerId?: NullableStringFieldUpdateOperationsInput | string | null
    scUrl?: NullableStringFieldUpdateOperationsInput | string | null
    source?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    artistName?: StringFieldUpdateOperationsInput | string
    artistId?: NullableStringFieldUpdateOperationsInput | string | null
    album?: NullableStringFieldUpdateOperationsInput | string | null
    coverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    duration?: StringFieldUpdateOperationsInput | string
    durationSec?: IntFieldUpdateOperationsInput | number
    previewUrl?: NullableStringFieldUpdateOperationsInput | string | null
    isrc?: NullableStringFieldUpdateOperationsInput | string | null
    addedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserLibraryUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    trackId?: NullableStringFieldUpdateOperationsInput | string | null
    deezerId?: NullableStringFieldUpdateOperationsInput | string | null
    scUrl?: NullableStringFieldUpdateOperationsInput | string | null
    source?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    artistName?: StringFieldUpdateOperationsInput | string
    artistId?: NullableStringFieldUpdateOperationsInput | string | null
    album?: NullableStringFieldUpdateOperationsInput | string | null
    coverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    duration?: StringFieldUpdateOperationsInput | string
    durationSec?: IntFieldUpdateOperationsInput | number
    previewUrl?: NullableStringFieldUpdateOperationsInput | string | null
    isrc?: NullableStringFieldUpdateOperationsInput | string | null
    addedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserRecentlyPlayedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    trackId?: NullableStringFieldUpdateOperationsInput | string | null
    deezerId?: NullableStringFieldUpdateOperationsInput | string | null
    scUrl?: NullableStringFieldUpdateOperationsInput | string | null
    source?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    artistName?: StringFieldUpdateOperationsInput | string
    artistId?: NullableStringFieldUpdateOperationsInput | string | null
    album?: NullableStringFieldUpdateOperationsInput | string | null
    coverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    duration?: StringFieldUpdateOperationsInput | string
    durationSec?: IntFieldUpdateOperationsInput | number
    previewUrl?: NullableStringFieldUpdateOperationsInput | string | null
    isrc?: NullableStringFieldUpdateOperationsInput | string | null
    playedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserRecentlyPlayedUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    trackId?: NullableStringFieldUpdateOperationsInput | string | null
    deezerId?: NullableStringFieldUpdateOperationsInput | string | null
    scUrl?: NullableStringFieldUpdateOperationsInput | string | null
    source?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    artistName?: StringFieldUpdateOperationsInput | string
    artistId?: NullableStringFieldUpdateOperationsInput | string | null
    album?: NullableStringFieldUpdateOperationsInput | string | null
    coverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    duration?: StringFieldUpdateOperationsInput | string
    durationSec?: IntFieldUpdateOperationsInput | number
    previewUrl?: NullableStringFieldUpdateOperationsInput | string | null
    isrc?: NullableStringFieldUpdateOperationsInput | string | null
    playedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserRecentlyPlayedUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    trackId?: NullableStringFieldUpdateOperationsInput | string | null
    deezerId?: NullableStringFieldUpdateOperationsInput | string | null
    scUrl?: NullableStringFieldUpdateOperationsInput | string | null
    source?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    artistName?: StringFieldUpdateOperationsInput | string
    artistId?: NullableStringFieldUpdateOperationsInput | string | null
    album?: NullableStringFieldUpdateOperationsInput | string | null
    coverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    duration?: StringFieldUpdateOperationsInput | string
    durationSec?: IntFieldUpdateOperationsInput | number
    previewUrl?: NullableStringFieldUpdateOperationsInput | string | null
    isrc?: NullableStringFieldUpdateOperationsInput | string | null
    playedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SessionUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    refreshTokenHash?: StringFieldUpdateOperationsInput | string
    device?: NullableStringFieldUpdateOperationsInput | string | null
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SessionUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    refreshTokenHash?: StringFieldUpdateOperationsInput | string
    device?: NullableStringFieldUpdateOperationsInput | string | null
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SessionUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    refreshTokenHash?: StringFieldUpdateOperationsInput | string
    device?: NullableStringFieldUpdateOperationsInput | string | null
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VerificationCodeUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VerificationCodeUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VerificationCodeUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}