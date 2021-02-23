import {buildDefaultEngineWithConfig} from '../src/task/engine-builder'
import {FeatureSite, FeatureType, FeatureTypeName} from '../src/model/feature'

const engine = buildDefaultEngineWithConfig({outputFormat: 'map'})

async function runUnifiedTestcase(featureName: string, code: string) {
  const result = await engine.check({
    filename: makeRandomFilename(),
    code: code
  })
  assertResultValidForSingleFeature(result, featureName)
}

function assertResultValidForSingleFeature(result: Map<FeatureTypeName, FeatureSite[]>, mapKey: string): void {
  expect(result.size).toBe(1)
  expect(result.has(mapKey)).toBe(true)
  expect(result.get(mapKey)).toHaveLength(1)
  assertFeatureSiteValid(result.get(mapKey)![0])
}

function assertFeatureSiteValid(featureSite: FeatureSite): void {
  expect(featureSite.literal?.length).toBeGreaterThan(0)
  expect((featureSite.location !== undefined && featureSite.location !== null)
    || (featureSite.index !== undefined && featureSite.index !== null && featureSite.index >= 0)).toBe(true)
}

function makeRandomFilename(): string {
  return makeId(32) + '.sol'
}

function makeId(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength: number = characters.length
  let result = ''
  for (let i = 0; i < length; i += 1) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}


test('checkReturningMultipleValue', async () => await runUnifiedTestcase(
  FeatureType.ReturningMultipleValue,
  'contract C { function f() returns(uint, uint) { return (1, 2); } }'
))

test('checkRecursion', async () => await runUnifiedTestcase(
  FeatureType.Recursion,
  'contract C { function f() { f(); } }'
))

test('checkFirstClassFunction', async () => await runUnifiedTestcase(
  FeatureType.FirstClassFunction,
  'contract C { function f() { function (uint) pure returns (uint) f; } }'
))

test('checkPureFunction', async () => await runUnifiedTestcase(
  FeatureType.PureFunction,
  'contract C { function f(uint a) pure returns(uint) { return a + 1; } }'
))

test('checkViewFunction', async () => await runUnifiedTestcase(
  FeatureType.ViewFunction,
  'contract C { uint a; function f() view { return a; } }'
))

test('checkConstantFunction', async () => await runUnifiedTestcase(
  FeatureType.ConstantFunction,
  'contract C { uint a; function f() constant { return a; } }'
))

test('checkFunctionModifier', async () => await runUnifiedTestcase(
  FeatureType.FunctionModifier,
  'contract C { modifier m { _; } }'
))

test('checkNamedCall', async () => await runUnifiedTestcase(
  FeatureType.NamedCall,
  'contract C { function f(uint a, uint b) {} function g() { f({b: 2, a: 1}); } }'
))

test('checkFreeFunction', async () => await runUnifiedTestcase(
  FeatureType.FreeFunction,
  'contract C {} function f(uint a) { return a; }'
))

test('checkReturnVariable', async () => await runUnifiedTestcase(
  FeatureType.ReturnVariable,
  'contract C { function f() returns(uint a) { a = 1; } }'
))

test('checkFallbackFunctionOldStyle', async () => await runUnifiedTestcase(
  FeatureType.FallbackFunction,
  'contract C { uint a; function () payable { a += 1; } }'
))

test('checkFallbackFunctionNewStyle', async () => {
  const result = await engine.check({
    filename: makeRandomFilename(),
    code: 'contract C { uint a; fallback () external payable { a += 1; } }'
  })
  const mapKey: string = FeatureType.FallbackFunction
  expect(result.size).toBe(2)
  expect(result.has(FeatureType.FunctionVisibility)).toBe(true)
  expect(result.has(mapKey)).toBe(true)
  expect(result.get(mapKey)).toHaveLength(1)
  assertFeatureSiteValid(result.get(mapKey)![0])
})

test('checkReceiveEtherFunction', async () => {
  const result = await engine.check({
    filename: makeRandomFilename(),
    code: 'contract C { uint a; receive () external payable { a += 1; } }'
  })
  const mapKey: string = FeatureType.ReceiveEtherFunction
  expect(result.size).toBe(2)
  expect(result.has(FeatureType.FunctionVisibility)).toBe(true)
  expect(result.has(mapKey)).toBe(true)
  expect(result.get(mapKey)).toHaveLength(1)
  assertFeatureSiteValid(result.get(mapKey)![0])
})

test('checkFunctionOverloading', async () => await runUnifiedTestcase(
  FeatureType.FunctionOverloading,
  'contract C { function f(uint a) {} function f(uint a, uint b) {} }'
))

test('checkLoopWithFor', async () => await runUnifiedTestcase(
  FeatureType.Loop,
  'contract C { function f() { for (uint i = 0; i < 10; i += 1) {} } }'
))

test('checkLoopWithWhile', async () => await runUnifiedTestcase(
  FeatureType.Loop,
  'contract C { function f() { uint i = 0; while (i < 10) { i += 1; } } }'
))

test('checkLoopWithDoWhile', async () => await runUnifiedTestcase(
  FeatureType.Loop,
  'contract C { function f() { uint i = 0; do { i += 1; } while (i < 10); } }'
))

test('checkCrossContractInvocationHighLevel', async () => await runUnifiedTestcase(
  FeatureType.CrossContractInvocationHighLevel,
  'contract C { function f() { D d; d.g(); } } contract D { function g() {} }'
))

test('checkCrossContractInvocationLowLevelCall', async () => await runUnifiedTestcase(
  FeatureType.CrossContractInvocationLowLevel,
  'contract C { function f() { D d; d.call("0xabcdef"); } } contract D { function g() {} }'
))

test('checkCrossContractInvocationLowLevelStaticCall', async () => await runUnifiedTestcase(
  FeatureType.CrossContractInvocationLowLevel,
  'contract C { function f() { D d; d.staticcall("0xabcdef"); } } contract D { function g() {} }'
))

test('checkCrossContractInvocationLowLevelDelegateCall', async () => await runUnifiedTestcase(
  FeatureType.CrossContractInvocationLowLevel,
  'contract C { function f() { D d; d.delegatecall("0xabcdef"); } } contract D { function g() {} }'
))

test('checkSend', async () => await runUnifiedTestcase(
  FeatureType.Send,
  'contract C { function f() { address payable addr; addr.send(0); } } contract D {}'
))

test('checkTransfer', async () => await runUnifiedTestcase(
  FeatureType.Transfer,
  'contract C { function f() { address payable addr; addr.transfer(0); } } contract D {}'
))

test('checkCreatingContractViaNew', async () => await runUnifiedTestcase(
  FeatureType.CreatingContractViaNew,
  'contract C { function f() { D d = new D(); } } contract D {}'
))

test('checkRequire', async () => await runUnifiedTestcase(
  FeatureType.ExceptionRequireAssertRevertThrow,
  'contract C { function f(uint a) { require(a > 0); } }'
))

test('checkAssert', async () => await runUnifiedTestcase(
  FeatureType.ExceptionRequireAssertRevertThrow,
  'contract C { function f(uint a) { assert(a > 0); } }'
))

test('checkRevert', async () => await runUnifiedTestcase(
  FeatureType.ExceptionRequireAssertRevertThrow,
  'contract C { function f(uint a) { revert(); } }'
))

test('checkThrow', async () => await runUnifiedTestcase(
  FeatureType.ExceptionRequireAssertRevertThrow,
  'contract C { function f(uint a) { throw; } }'
))

test('checkExceptionTryCatch', async () => {
  const result = await engine.check({
    filename: makeRandomFilename(),
    code: 'contract C { function f() { D d; try d.g() {} catch {} } } contract D { function g() {} }'
  })
  const mapKey: string = FeatureType.ExceptionTryCatch
  expect(result.size).toBe(2)
  expect(result.has(FeatureType.CrossContractInvocationHighLevel)).toBe(true)
  expect(result.has(mapKey)).toBe(true)
  expect(result.get(mapKey)).toHaveLength(1)
  assertFeatureSiteValid(result.get(mapKey)![0])
})

test('checkSingleInheritance', async () => await runUnifiedTestcase(
  FeatureType.SingleInheritance,
  'contract C {} contract D is C {}'
))

test('checkMultipleInheritance', async () => await runUnifiedTestcase(
  FeatureType.MultipleInheritance,
  'contract C {} contract D {} contract E is C, D {}'
))

test('checkSuperVirtualMethodLookup', async () => {
  const result = await engine.check({
    filename: makeRandomFilename(),
    code: 'contract C { function f() {} } contract D is C { function g() { super.f();} }'
  })
  const mapKey: string = FeatureType.SuperVirtualMethodLookup
  expect(result.size).toBe(2)
  expect(result.has(FeatureType.SingleInheritance)).toBe(true)
  expect(result.has(mapKey)).toBe(true)
  expect(result.get(mapKey)).toHaveLength(1)
  assertFeatureSiteValid(result.get(mapKey)![0])
})

// unable to recognize unnamed override - bug in @solidity-parser/parser
test('checkFunctionOverriding', async () => {
  const result = await engine.check({
    filename: makeRandomFilename(),
    code: 'contract C { function f(uint a) public virtual { return a + 1; } } contract D is C { function f(uint a) public override(C) { return a + 2; } }'
  })
  const mapKey: string = FeatureType.FunctionOverriding
  expect(result.size).toBe(3)
  expect(result.has(FeatureType.SingleInheritance)).toBe(true)
  expect(result.has(FeatureType.FunctionVisibility)).toBe(true)
  expect(result.has(mapKey)).toBe(true)
  expect(result.get(mapKey)).toHaveLength(1)
  assertFeatureSiteValid(result.get(mapKey)![0])
})

// unable to recognize unnamed override - bug in @solidity-parser/parser
test('checkFunctionModifierOverriding', async () => {
  const result = await engine.check({
    filename: makeRandomFilename(),
    code: 'contract C { modifier m() virtual { _; } } contract D is C { modifier m() override(C) { _; }}'
  })
  const mapKey: string = FeatureType.FunctionModifierOverriding
  expect(result.size).toBe(3)
  expect(result.has(FeatureType.SingleInheritance)).toBe(true)
  expect(result.has(FeatureType.FunctionModifier)).toBe(true)
  expect(result.has(mapKey)).toBe(true)
  expect(result.get(mapKey)).toHaveLength(1)
  assertFeatureSiteValid(result.get(mapKey)![0])
})

test('checkAbstractContract', async () => await runUnifiedTestcase(
  FeatureType.AbstractContract,
  'abstract contract C { function f(uint a); }'
))

test('checkInterface', async () => await runUnifiedTestcase(
  FeatureType.Interface,
  'interface I { function f(uint a); }'
))

test('checkFunctionVisibility', async () => await runUnifiedTestcase(
  FeatureType.FunctionVisibility,
  'contract C { function f(uint a) public { return a; } }'
))

test('checkStateVariableVisibility', async () => await runUnifiedTestcase(
  FeatureType.StateVariableVisibility,
  'contract C { uint public a; function f() { a += 1; } }'
))

test('checkLibrary', async () => await runUnifiedTestcase(
  FeatureType.Library,
  'library L { function f(uint a) { return a; } }'
))

test('checkArray', async () => await runUnifiedTestcase(
  FeatureType.Array,
  'contract C { function f() { uint[] memory a; } }'
))

test('checkStruct', async () => await runUnifiedTestcase(
  FeatureType.Struct,
  'contract C { struct S { uint a; uint b; } S s; function f() { s.a += 1; } }'
))

test('checkNestedArray', async () => {
  const result = await engine.check({
    filename: makeRandomFilename(),
    code: 'contract C { function f() { uint[][] memory a; } }'
  })
  const mapKey: string = FeatureType.NestedArrayOrStruct
  expect(result.size).toBe(2)
  expect(result.has(FeatureType.Array)).toBe(true)
  expect(result.has(mapKey)).toBe(true)
  expect(result.get(mapKey)).toHaveLength(1)
  assertFeatureSiteValid(result.get(mapKey)![0])
})

test('checkNestedStruct', async () => {
  const result = await engine.check({
    filename: makeRandomFilename(),
    code: 'contract C { struct S { uint a; uint b; } struct T { S s; } T t; function f() { t.s.a += 1; } }'
  })
  const mapKey: string = FeatureType.NestedArrayOrStruct
  expect(result.size).toBe(2)
  expect(result.has(FeatureType.Struct)).toBe(true)
  expect(result.has(mapKey)).toBe(true)
  expect(result.get(mapKey)).toHaveLength(1)
  assertFeatureSiteValid(result.get(mapKey)![0])
})

test('checkNestedArrayWithinStruct', async () => {
  const result = await engine.check({
    filename: makeRandomFilename(),
    code: 'contract C { struct S { uint[][] a; uint b; } S s; function f() { s.b += 1; } }'
  })
  const mapKey: string = FeatureType.NestedArrayOrStruct
  expect(result.size).toBe(3)
  expect(result.has(FeatureType.Struct)).toBe(true)
  expect(result.has(FeatureType.Array)).toBe(true)
  expect(result.has(mapKey)).toBe(true)
  expect(result.get(mapKey)).toHaveLength(1)
  assertFeatureSiteValid(result.get(mapKey)![0])
})

test('checkNestedStructWithinArray', async () => {
  const result = await engine.check({
    filename: makeRandomFilename(),
    code: 'contract C { struct S { uint a; uint b; } S[] s; function f() { s.a += 1; } }'
  })
  const mapKey: string = FeatureType.NestedArrayOrStruct
  expect(result.size).toBe(3)
  expect(result.has(FeatureType.Struct)).toBe(true)
  expect(result.has(FeatureType.Array)).toBe(true)
  expect(result.has(mapKey)).toBe(true)
  expect(result.get(mapKey)).toHaveLength(1)
  assertFeatureSiteValid(result.get(mapKey)![0])
})

test('checkEnum', async () => await runUnifiedTestcase(
  FeatureType.Enum,
  'enum E { A, B } contract C { function f() { E e = E.A; } }'
))

test('checkEvent', async () => await runUnifiedTestcase(
  FeatureType.Event,
  'contract C { event Event(uint a); function f() { emit Event(42); } }'
))

test('checkConstantStateVariable', async () => await runUnifiedTestcase(
  FeatureType.ConstantAndImmutableStateVariable,
  'contract C { uint constant a = 1; function f() returns(uint) { return a; } }'
))

test('checkImmutableStateVariable', async () => await runUnifiedTestcase(
  FeatureType.ConstantAndImmutableStateVariable,
  'contract C { uint immutable a; constructor(uint _a) { a = _a; } function f() returns(uint) { return a; } }'
))

test('checkImportRenaming', async () => await runUnifiedTestcase(
  FeatureType.ImportRenaming,
  'import {symbol1 as alias, symbol2} from "contract.sol"; contract C { function f() {} }'
))

test('checkPragmaSolidityVersion', async () => await runUnifiedTestcase(
  FeatureType.PragmaSolidityVersion,
  'pragma solidity ^0.8.0; contract C { function f() {} }'
))

test('checkPragmaSmtChecker', async () => await runUnifiedTestcase(
  FeatureType.PragmaSmtChecker,
  'pragma experimental SMTChecker; contract C { function f() {} }'
))

test('checkManualGasControlNewStyle', async () => {
  const result = await engine.check({
    filename: makeRandomFilename(),
    code: 'contract C { function f(D d) { d.g{value: 10, gas: 10000}(); } } contract D { function g() {} }'
  })
  const mapKey: string = FeatureType.ManualGasControl
  expect(result.size).toBe(2)
  expect(result.has(FeatureType.CrossContractInvocationHighLevel)).toBe(true)
  expect(result.has(mapKey)).toBe(true)
  expect(result.get(mapKey)).toHaveLength(1)
  assertFeatureSiteValid(result.get(mapKey)![0])
})

test('checkManualGasControlOldStyle', async () => {
  const result = await engine.check({
    filename: makeRandomFilename(),
    code: 'contract C { function f(D d) { d.g.value(10).gas(10000)(); } } contract D { function g() {} }'
  })
  const mapKey: string = FeatureType.ManualGasControl
  expect(result.size).toBe(2)
  expect(result.has(FeatureType.CrossContractInvocationHighLevel)).toBe(true)
  expect(result.has(mapKey)).toBe(true)
  expect(result.get(mapKey)).toHaveLength(1)
  assertFeatureSiteValid(result.get(mapKey)![0])
})

test('checkInlineAssembly', async () => await runUnifiedTestcase(
  FeatureType.InlineAssembly,
  'contract C { uint b; function f() { uint a; assembly { a := sload(0x0) } } }'
))

test('checkHexadecimalLiteral', async () => await runUnifiedTestcase(
  FeatureType.HexadecimalLiteral,
  'contract C { function f() { string memory s = hex"abcdef"; } }'
))

test('checkEtherUnit', async () => await runUnifiedTestcase(
  FeatureType.EtherUnit,
  'contract C { function f() { uint a = 1 ether; } }'
))

test('checkTimeUnit', async () => await runUnifiedTestcase(
  FeatureType.TimeUnit,
  'contract C { function f() { uint a = 1 weeks; } }'
))

test('checkSpdxLicenseIdentifier', async () => await runUnifiedTestcase(
  FeatureType.SpdxLicenseIdentifier,
  `
    // SPDX-License-Identifier: UNLICENSED
    contract C { function f() {} }
  `
))

test('checkNatSpecComment', async () => await runUnifiedTestcase(
  FeatureType.NatSpecComment,
  `
    /// @title Some title
    contract C { function f() {} }
  `
))
