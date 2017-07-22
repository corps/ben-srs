interface Config {
  altertitle: boolean;
  autostart: boolean;
  collapse: boolean;
  current: any;
  filter: string | RegExp
  fixture: string;
  hidepassed: boolean;
  maxDepth: number;
  module: string;
  moduleId: string[];
  notrycatch: boolean;
  noglobals: boolean;
  seed: string;
  reorder: boolean;
  requireExpects: boolean;
  testId: string[];
  testTimeout: number;
  scrolltop: boolean;
  urlConfig: {
    id?: string;
    label?: string;
    tooltip?: string;
    value?: string | string[] | {[key: string]: string}
  }[];
}


interface Hooks {

  /**
   * Runs after the last test. If additional tests are defined after the
   * module's queue has emptied, it will not run this hook again.
   */
  after?: (assert: Assert) => void;

  /**
   * Runs after each test.
   */
  afterEach?: (assert: Assert) => void;

  /**
   * Runs before the first test.
   */
  before?: (assert: Assert) => void;

  /**
   * Runs before each test.
   */
  beforeEach?: (assert: Assert) => void;

}

export interface Assert {
  /**
   * Instruct QUnit to wait for an asynchronous operation.
   *
   * The callback returned from `assert.async()` will throw an Error if it is
   * invoked more than once (or more often than the accepted call count, if
   * provided).
   *
   * This replaces functionality previously provided by `QUnit.stop()` and
   * `QUnit.start()`.
   *
   * @param {number} [acceptCallCount=1] Number of expected callbacks before the test is done.
   */
  async(acceptCallCount?: number): () => void;

  /**
   * A deep recursive comparison, working on primitive types, arrays, objects,
   * regular expressions, dates and functions.
   *
   * The `deepEqual()` assertion can be used just like `equal()` when comparing
   * the value of objects, such that `{ key: value }` is equal to
   * `{ key: value }`. For non-scalar values, identity will be disregarded by
   * deepEqual.
   *
   * `notDeepEqual()` can be used to explicitly test deep, strict inequality.
   *
   * @param actual Object or Expression being tested
   * @param expected Known comparision value
   * @param {string} [message] A short description of the assertion
   */
  deepEqual(actual: any, expected: any, message?: string): void;

  /**
   * A non-strict comparison, roughly equivalent to JUnit's assertEquals.
   *
   * The `equal` assertion uses the simple comparison operator (`==`) to
   * compare the actual and expected arguments. When they are equal, the
   * assertion passes; otherwise, it fails. When it fails, both actual and
   * expected values are displayed in the test result, in addition to a given
   * message.
   *
   *  `notEqual()` can be used to explicitly test inequality.
   *
   * `strictEqual()` can be used to test strict equality.
   *
   * @param actual Expression being tested
   * @param expected Known comparison value
   * @param {string} [message] A short description of the assertion
   */
  equal(actual: any, expected: any, message?: string): void;

  /**
   * Specify how many assertions are expected to run within a test.
   *
   * To ensure that an explicit number of assertions are run within any test,
   * use `assert.expect( number )` to register an expected count. If the
   * number of assertions run does not match the expected count, the test will
   * fail.
   *
   * @param {number} amount Number of assertions in this test.
   */
  expect(amount: number): void;

  /**
   * An inverted deep recursive comparison, working on primitive types,
   * arrays, objects, regular expressions, dates and functions.
   *
   * @param actual Object or Expression being tested
   * @param expected Known comparison value
   * @param {string} [message] A short description of the assertion
   */
  notDeepEqual(actual: any, expected: any, message?: string): void;

  /**
   * A non-strict comparison, checking for inequality.
   *
   * The `notEqual` assertion uses the simple inverted comparison operator
   * (`!=`) to compare the actual and expected arguments. When they aren't
   * equal, the assertion passes; otherwise, it fails. When it fails, both
   * actual and expected values are displayed in the test result, in addition
   * to a given message.
   *
   * `equal()` can be used to test equality.
   *
   * `notStrictEqual()` can be used to test strict inequality.
   *
   * @param actual Object or Expression being tested
   * @param expected Known comparison value
   * @param {string} [message] A short description of the assertion
   */
  notEqual(actual: any, expected: any, message?: string): void;

  /**
   * A boolean check, inverse of `ok()` and CommonJS's `assert.ok()`, and
   * equivalent to JUnit's `assertFalse()`. Passes if the first argument is
   * falsy.
   *
   * `notOk()` requires just one argument. If the argument evaluates to false,
   * the assertion passes; otherwise, it fails. If a second message argument
   * is provided, it will be displayed in place of the result.
   *
   * @param state Expression being tested
   * @param {string} [message] A short description of the assertion
   */
  notOk(state: any, message?: string): void;

  /**
   * A strict comparison of an object's own properties, checking for inequality.
   *
   * The `notPropEqual` assertion uses the strict inverted comparison operator
   * (`!==`) to compare the actual and expected arguments as Objects regarding
   * only their properties but not their constructors.
   *
   * When they aren't equal, the assertion passes; otherwise, it fails. When
   * it fails, both actual and expected values are displayed in the test
   * result, in addition to a given message.
   *
   * `equal()` can be used to test equality.
   *
   * `propEqual()` can be used to test strict equality of an Object properties.
   *
   * @param actual Object or Expression being tested
   * @param expected Known comparison value
   * @param {string} [message] A short description of the assertion
   */
  notPropEqual(actual: any, expected: any, message?: string): void;

  /**
   * A strict comparison, checking for inequality.
   *
   * The `notStrictEqual` assertion uses the strict inverted comparison
   * operator (`!==`) to compare the actual and expected arguments. When they
   * aren't equal, the assertion passes; otherwise, it fails. When it fails,
   * both actual and expected values are displayed in the test result, in
   * addition to a given message.
   *
   * `equal()` can be used to test equality.
   *
   * `strictEqual()` can be used to test strict equality.
   *
   * @param actual Object or Expression being tested
   * @param expected Known comparison value
   * @param {string} [message] A short description of the assertion
   */
  notStrictEqual(actual: any, expected: any, message?: string): void;

  /**
   * A boolean check, equivalent to CommonJS's assert.ok() and JUnit's
   * assertTrue(). Passes if the first argument is truthy.
   *
   * The most basic assertion in QUnit, ok() requires just one argument. If
   * the argument evaluates to true, the assertion passes; otherwise, it
   * fails. If a second message argument is provided, it will be displayed in
   * place of the result.
   *
   * @param state Expression being tested
   * @param {string} message A short description of the assertion
   */
  ok(state: any, message?: string): void;

  /**
   * A strict type and value comparison of an object's own properties.
   *
   * The `propEqual()` assertion provides strictly (`===`) comparison of
   * Object properties. Unlike `deepEqual()`, this assertion can be used to
   * compare two objects made with different constructors and prototype.
   *
   * `strictEqual()` can be used to test strict equality.
   *
   * `notPropEqual()` can be used to explicitly test strict inequality of
   * Object properties.
   *
   * @param actual Object or Expression being tested
   * @param expected Known comparison value
   * @param {string} [message] A short description of the assertion
   */
  propEqual(actual: any, expected: any, message?: string): void;

  /**
   * Report the result of a custom assertion
   *
   * Some test suites may need to express an expectation that is not defined
   * by any of QUnit's built-in assertions. This need may be met by
   * encapsulating the expectation in a JavaScript function which returns a
   * `Boolean` value representing the result; this value can then be passed
   * into QUnit's `ok` assertion.
   *
   * A more readable solution would involve defining a custom assertion. If
   * the expectation function invokes `pushResult`, QUnit will be notified of
   * the result and report it accordingly.
   *
   * @param assertionResult The assertion result
   */
  pushResult(
    assertResult: {
      result: boolean;
      actual: any;
      expected: any;
      message: string;
    }
  ): void;

  /**
   * A strict type and value comparison.
   *
   * The `strictEqual()` assertion provides the most rigid comparison of type
   * and value with the strict equality operator (`===`).
   *
   * `equal()` can be used to test non-strict equality.
   *
   * `notStrictEqual()` can be used to explicitly test strict inequality.
   *
   * @param actual Object or Expression being tested
   * @param expected Known comparison value
   * @param {string} [message] A short description of the assertion
   */
  strictEqual(actual: any, expected: any, message?: string): void;

  /**
   * Test if a callback throws an exception, and optionally compare the thrown
   * error.
   *
   * When testing code that is expected to throw an exception based on a
   * specific set of circumstances, use assert.throws() to catch the error
   * object for testing and comparison.
   *
   * In very few environments, like Closure Compiler, throws is considered a
   * reserved word and will cause an error. For that case, an alias is bundled
   * called `raises`. It has the same signature and behaviour, just a
   * different name.
   */
  throws(block: () => void, expected?: any, message?: any): void;
  raises(block: () => void, expected?: any, message?: any): void;

}

declare var QUnit: {
  assert: Assert;
  config: Config;
  begin: (callback: (details: {totalTests: number}) => void) => void;
  done: (callback: (details: {failed: number, passed: number, total: number, runtime: number}) => void) => void;
  testDone: (callback: (details: {name: string, module: string, failed: number, passed: number, runtime: number, total: number}) => void) => void;
  log: (
    callback: (
      details: {
        result: boolean,
        actual: any;
        expected: any;
        message: string;
        source: string;
        module: string;
        name: string;
        runtime: number;
      }
    ) => void
  ) => void;

  module: (name: string, hooks?: Hooks) => void;
  stack: (offset?: number) => string;
  skip: (name: string, callback?: (assert: Assert) => void) => void;
  test: (name: string, callback?: (assert: Assert) => void) => void;
}

let testWithFinalAsync = QUnit.test;
testWithFinalAsync = function () {
  let f = arguments[1];
  arguments[1] = function (assert: Assert) {
    f.apply(this, arguments);
    let done = assert.async();
    setTimeout(done, 20);
  };

  return QUnit.test.apply(null, arguments);
};

export const test = testWithFinalAsync;
export const skip = QUnit.skip;
export const assert = QUnit.assert;
export const QUnitConfig = QUnit.config;
export const QUnitBegin = QUnit.begin;
export const QUnitDone = QUnit.done;
export const QUnitLog = QUnit.log;
export const QUnitTestDone = QUnit.testDone;
export const testModule = QUnit.module;
export const stack = QUnit.stack;