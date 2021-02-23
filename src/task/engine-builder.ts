import {CheckerConfig, CheckerOutputFormatString, FeatureChecker, FeatureType} from '../model/feature'
import {CheckerEngine} from '../infra/engine'
import {
  checkAbstractContract,
  checkArray,
  checkConstantAndImmutableStateVariable,
  checkConstantFunction,
  checkCreatingContractViaNew,
  checkCrossContractInvocationHighLevel,
  checkCrossContractInvocationLowLevel,
  checkEnum,
  checkEtherUnit,
  checkEvent,
  checkExceptionRequireAssertRevertThrow,
  checkExceptionTryCatch,
  checkFallbackFunction,
  checkFirstClassFunction,
  checkFreeFunction,
  checkFunctionModifierOverriding,
  checkFunctionModifier,
  checkFunctionOverloading,
  checkFunctionOverriding,
  checkFunctionVisibility,
  checkHexadecimalLiteral,
  checkImportRenaming,
  checkInlineAssembly,
  checkInterface,
  checkLibrary,
  checkLoop,
  checkManualGasControl,
  checkMultipleInheritance,
  checkNamedCall,
  checkNestedArrayOrStruct,
  checkPragmaSmtChecker,
  checkPragmaSolidityVersion,
  checkPureFunction,
  checkReceiveEtherFunction,
  checkRecursion,
  checkReturningMultipleValue,
  checkReturnVariable,
  checkSend,
  checkSingleInheritance,
  checkStateVariableVisibility,
  checkStruct,
  checkSuperVirtualMethodLookup,
  checkTimeUnit,
  checkTransfer,
  checkViewFunction,
  checkSpdxLicenseIdentifier,
  checkNatSpecComment,
  checkUnicodeLiteral
} from './checkers'


const defaultCheckers: FeatureChecker[] = [
  {
    name: FeatureType.ReturningMultipleValue,
    check: checkReturningMultipleValue,
  },
  {
    name: FeatureType.ReturningMultipleValue,
    check: checkReturningMultipleValue,
  },
  {
    name: FeatureType.Recursion,
    check: checkRecursion,
  },
  {
    name: FeatureType.FirstClassFunction,
    check: checkFirstClassFunction,
  },
  {
    name: FeatureType.PureFunction,
    check: checkPureFunction,
  },
  {
    name: FeatureType.ViewFunction,
    check: checkViewFunction,
  },
  {
    name: FeatureType.ConstantFunction,
    check: checkConstantFunction,
  },
  {
    name: FeatureType.FunctionModifier,
    check: checkFunctionModifier,
  },
  {
    name: FeatureType.NamedCall,
    check: checkNamedCall,
  },
  {
    name: FeatureType.FreeFunction,
    check: checkFreeFunction,
  },
  {
    name: FeatureType.ReturnVariable,
    check: checkReturnVariable,
  },
  {
    name: FeatureType.FallbackFunction,
    check: checkFallbackFunction,
  },
  {
    name: FeatureType.ReceiveEtherFunction,
    check: checkReceiveEtherFunction,
  },
  {
    name: FeatureType.FunctionOverloading,
    check: checkFunctionOverloading,
  },
  {
    name: FeatureType.Loop,
    check: checkLoop,
  },
  {
    name: FeatureType.CrossContractInvocationHighLevel,
    check: checkCrossContractInvocationHighLevel,
  },
  {
    name: FeatureType.CrossContractInvocationLowLevel,
    check: checkCrossContractInvocationLowLevel,
  },
  {
    name: FeatureType.Transfer,
    check: checkTransfer,
  },
  {
    name: FeatureType.Send,
    check: checkSend,
  },
  {
    name: FeatureType.CreatingContractViaNew,
    check: checkCreatingContractViaNew,
  },
  {
    name: FeatureType.ExceptionRequireAssertRevertThrow,
    check: checkExceptionRequireAssertRevertThrow,
  },
  {
    name: FeatureType.ExceptionTryCatch,
    check: checkExceptionTryCatch,
  },
  {
    name: FeatureType.SingleInheritance,
    check: checkSingleInheritance,
  },
  {
    name: FeatureType.MultipleInheritance,
    check: checkMultipleInheritance,
  },
  {
    name: FeatureType.SuperVirtualMethodLookup,
    check: checkSuperVirtualMethodLookup,
  },
  {
    name: FeatureType.FunctionOverriding,
    check: checkFunctionOverriding,
  },
  {
    name: FeatureType.FunctionModifierOverriding,
    check: checkFunctionModifierOverriding,
  },
  {
    name: FeatureType.AbstractContract,
    check: checkAbstractContract,
  },
  {
    name: FeatureType.Interface,
    check: checkInterface,
  },
  {
    name: FeatureType.FunctionVisibility,
    check: checkFunctionVisibility,
  },
  {
    name: FeatureType.StateVariableVisibility,
    check: checkStateVariableVisibility,
  },
  {
    name: FeatureType.Library,
    check: checkLibrary,
  },
  {
    name: FeatureType.Array,
    check: checkArray,
  },
  {
    name: FeatureType.Struct,
    check: checkStruct,
  },
  {
    name: FeatureType.NestedArrayOrStruct,
    check: checkNestedArrayOrStruct,
  },
  {
    name: FeatureType.Enum,
    check: checkEnum,
  },
  {
    name: FeatureType.Event,
    check: checkEvent,
  },
  {
    name: FeatureType.ConstantAndImmutableStateVariable,
    check: checkConstantAndImmutableStateVariable,
  },
  {
    name: FeatureType.SpdxLicenseIdentifier,
    check: checkSpdxLicenseIdentifier,
  },
  {
    name: FeatureType.ImportRenaming,
    check: checkImportRenaming,
  },
  {
    name: FeatureType.NatSpecComment,
    check: checkNatSpecComment,
  },
  {
    name: FeatureType.PragmaSolidityVersion,
    check: checkPragmaSolidityVersion,
  },
  {
    name: FeatureType.PragmaSmtChecker,
    check: checkPragmaSmtChecker,
  },
  {
    name: FeatureType.ManualGasControl,
    check: checkManualGasControl,
  },
  {
    name: FeatureType.InlineAssembly,
    check: checkInlineAssembly,
  },
  {
    name: FeatureType.UnicodeLiteral,
    check: checkUnicodeLiteral,
  },
  {
    name: FeatureType.HexadecimalLiteral,
    check: checkHexadecimalLiteral,
  },
  {
    name: FeatureType.EtherUnit,
    check: checkEtherUnit,
  },
  {
    name: FeatureType.TimeUnit,
    check: checkTimeUnit,
  },
]

function addDefaultCheckers<T extends CheckerOutputFormatString>(engine: CheckerEngine<T>): CheckerEngine<T> {
  for (const checker of defaultCheckers) {
    engine.addChecker(checker)
  }
  return engine
}

export function buildDefaultEngine(): CheckerEngine<'object'> {
  return addDefaultCheckers(CheckerEngine.new())
}

export function buildDefaultEngineWithConfig<T extends CheckerOutputFormatString>(config: CheckerConfig<T>): CheckerEngine<T> {
  return addDefaultCheckers(CheckerEngine.newWithConfig(config))
}
