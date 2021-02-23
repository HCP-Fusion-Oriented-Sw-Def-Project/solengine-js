import lineColumn = require('line-column')
import LruCache = require('lru-cache')

import {CodeInfo, CodeLocation} from './code'


export enum FeatureType {
  // function
  ReturningMultipleValue = "ReturningMultipleValue",
  Recursion = "Recursion",
  FirstClassFunction = "FirstClassFunction",
  PureFunction = "PureFunction",
  ViewFunction = "ViewFunction",
  ConstantFunction = "ConstantFunction",
  FunctionModifier = "FunctionModifier",
  NamedCall = "NamedCall",
  FreeFunction = "FreeFunction",
  ReturnVariable = "ReturnVariable",
  FallbackFunction = "FallbackFunction",
  ReceiveEtherFunction = "ReceiveEtherFunction",
  FunctionOverloading = "FunctionOverloading",

  // control flow
  Loop = "Loop",
  CrossContractInvocationHighLevel = "CrossContractInvocationHighLevel",
  CrossContractInvocationLowLevel = "CrossContractInvocationLowLevel",
  Send = "Send",
  Transfer = "Transfer",
  CreatingContractViaNew = "CreatingContractViaNew",
  ExceptionRequireAssertRevertThrow = "ExceptionRequireAssertRevertThrow",
  ExceptionTryCatch = "ExceptionTryCatch",

  // object-oriented programming
  SingleInheritance = "SingleInheritance",
  MultipleInheritance = "MultipleInheritance",
  SuperVirtualMethodLookup = "SuperVirtualMethodLookup",
  FunctionOverriding = "FunctionOverriding",
  FunctionModifierOverriding = "FunctionModifierOverriding",
  AbstractContract = "AbstractContract",
  Interface = "Interface",
  FunctionVisibility = "FunctionVisibility",
  StateVariableVisibility = "StateVariableVisibility",
  Library = "Library",

  // data structure
  Array = "Array",
  Struct = "Struct",
  NestedArrayOrStruct = "NestedArrayOrStruct",
  Enum = "Enum",
  Event = "Event",
  ConstantAndImmutableStateVariable = "ConstantAndImmutableStateVariable",

  // code style
  SpdxLicenseIdentifier = "SpdxLicenseIdentifier",
  ImportRenaming = "ImportRenaming",
  NatSpecComment = "NatSpecComment",
  PragmaSolidityVersion = "PragmaSolidityVersion",

  // special mechanism
  PragmaSmtChecker = "PragmaSmtChecker",
  ManualGasControl = "ManualGasControl",
  InlineAssembly = "InlineAssembly",
  UnicodeLiteral = "UnicodeLiteral",
  HexadecimalLiteral = "HexadecimalLiteral",
  EtherUnit = "EtherUnit",
  TimeUnit = "TimeUnit",
}

export interface FeatureSite {
  literal?: string
  location?: CodeLocation
  index?: number
}

export type CheckFunction = (context: CheckerContext) => Promise<FeatureSite[]>
export type FeatureTypeName = string

export interface FeatureChecker {
  name: FeatureTypeName
  check: CheckFunction
}

export type LineColumnFinder = ReturnType<typeof lineColumn>
export type Filename = string

export interface CheckerContext {
  codeInfo: CodeInfo
  cache: LruCache<Filename, LineColumnFinder>
}

export type CheckerOutputFormatString =
  | 'map'     // output check result as ES6 Map
  | 'object'  // output check result as plain JS object
  | 'json'    // output check result as a JSON.stringify() string

export interface CheckerConfig<T extends CheckerOutputFormatString> {
  outputFormat: T
}

export type CheckerOutputType<T extends CheckerOutputFormatString> =
  T extends 'map' ? Map<FeatureTypeName, FeatureSite[]> :
  T extends 'object' ? Record<FeatureTypeName, FeatureSite[]> :
  T extends 'json' ? string : never
