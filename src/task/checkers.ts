import {
  Identifier,
  NameValueExpression,
  StateVariableDeclarationVariable
} from '@solidity-parser/parser/dist/ast-types'

import {CheckerContext, FeatureSite} from '../model/feature'
import {checkPrimitive, check, preserveFeatureSite, checkByRegex} from '../infra/checker-service'


export async function checkReturningMultipleValue(context: CheckerContext): Promise<FeatureSite[]> {
  return await check(context, {
    'FunctionDefinition': functionDefinition => (functionDefinition?.returnParameters?.length ?? 0) > 1
  })
}

export async function checkRecursion(context: CheckerContext): Promise<FeatureSite[]> {
  return await check(context, {
    'FunctionDefinition': functionDefinition => ({
      'FunctionCall': functionCall => ({
        'Identifier': identifier => identifier?.name === functionDefinition?.name
      })
    })
  })
}

export async function checkFirstClassFunction(context: CheckerContext): Promise<FeatureSite[]> {
  return await check(context, 'FunctionTypeName')
}

export async function checkPureFunction(context: CheckerContext): Promise<FeatureSite[]> {
  return await check(context, {
    'FunctionDefinition': functionDefinition => functionDefinition?.stateMutability === 'pure'
  })
}

export async function checkViewFunction(context: CheckerContext): Promise<FeatureSite[]> {
  return await check(context, {
    'FunctionDefinition': functionDefinition => functionDefinition?.stateMutability === 'view'
  })
}

export async function checkConstantFunction(context: CheckerContext): Promise<FeatureSite[]> {
  return await check(context, {
    'FunctionDefinition': functionDefinition => functionDefinition?.stateMutability === 'constant'
  })
}

export async function checkFunctionModifier(context: CheckerContext): Promise<FeatureSite[]> {
  return await check(context, 'ModifierDefinition')
}

export async function checkNamedCall(context: CheckerContext): Promise<FeatureSite[]> {
  return await check(context, {
    'FunctionCall': functionCall => (functionCall?.names?.length ?? 0) > 0
  })
}

export async function checkFreeFunction(context: CheckerContext): Promise<FeatureSite[]> {
  const result: FeatureSite[] = []
  let insideContractDefinition = false
  return new Promise(resolve => {
    checkPrimitive(context, {
      'ContractDefinition': node => {
        insideContractDefinition = true
      },
      'ContractDefinition:exit': node => {
        insideContractDefinition = false
      },
      'FunctionDefinition': node => {
        if (!insideContractDefinition) {
          result.push(preserveFeatureSite(context, node))
        }
      },
      'SourceUnit:exit': node => {
        resolve(result)
      },
    })
  })
}

export async function checkReturnVariable(context: CheckerContext): Promise<FeatureSite[]> {
  return await check(context, {
    'FunctionDefinition': functionDefinition => {
      if (functionDefinition?.returnParameters) {
        for (const item of functionDefinition.returnParameters) {
          if (item.name) {
            return true
          }
        }
      }
      return false
    }
  })
}

export async function checkFallbackFunction(context: CheckerContext): Promise<FeatureSite[]> {
  return await check(context, {
    'FunctionDefinition': functionDefinition => functionDefinition?.isFallback
  })
}

export async function checkReceiveEtherFunction(context: CheckerContext): Promise<FeatureSite[]> {
  return await check(context, {
    'FunctionDefinition': functionDefinition => functionDefinition?.isReceiveEther
  })
}

export async function checkFunctionOverloading(context: CheckerContext): Promise<FeatureSite[]> {
  const functionNames = new Set<string>()
  return await check(context, {
    'ContractDefinition': contractDefinition => ({
      'FunctionDefinition': functionDefinition => {
        if (!contractDefinition || !functionDefinition) { return false }
        const fullName = contractDefinition.name + '.' + functionDefinition.name
        if (functionNames.has(fullName)) {
          return true
        } else {
          functionNames.add(fullName)
          return false
        }
      }
    })
  })
}

export async function checkLoop(context: CheckerContext): Promise<FeatureSite[]> {
  return await check(context, ['ForStatement', 'WhileStatement', 'DoWhileStatement'])
}

export async function checkCrossContractInvocationHighLevel(context: CheckerContext): Promise<FeatureSite[]> {
  return await check(context, {
    'ContractDefinition': contractDefinition => ({
      'FunctionCall': functionCall => ({
        'MemberAccess': memberAccess =>
          contractDefinition && functionCall && memberAccess
          && !['super', 'this', contractDefinition.name].includes((memberAccess.expression as Identifier).name)
          && !['call', 'delegatecall', 'staticcall', 'send', 'transfer', 'gas', 'value'].includes(memberAccess.memberName)
      })
    })
  })
}

export async function checkCrossContractInvocationLowLevel(context: CheckerContext): Promise<FeatureSite[]> {
  return await check(context, {
    'FunctionCall': functionCall => ({
      'MemberAccess': memberAccess => functionCall && memberAccess
        && functionCall.expression === memberAccess
        && ['call', 'delegatecall', 'staticcall'].includes(memberAccess.memberName)
    }),
    'NameValueExpression': nameValueExpression => ({
      'MemberAccess': memberAccess => nameValueExpression && memberAccess
        && nameValueExpression.expression === memberAccess
        && ['call', 'delegatecall', 'staticcall'].includes(memberAccess.memberName)
    })
  })
}

export async function checkSend(context: CheckerContext): Promise<FeatureSite[]> {
  return await check(context, {
    'FunctionCall': functionCall => ({
      'MemberAccess': memberAccess =>
        functionCall && memberAccess && functionCall.expression === memberAccess && memberAccess.memberName === 'send'
    })
  })
}

export async function checkTransfer(context: CheckerContext): Promise<FeatureSite[]> {
  return await check(context, {
    'FunctionCall': functionCall => ({
      'MemberAccess': memberAccess =>
        functionCall && memberAccess && functionCall.expression === memberAccess && memberAccess.memberName === 'transfer'
    })
  })
}

export async function checkCreatingContractViaNew(context: CheckerContext): Promise<FeatureSite[]> {
  return await check(context, {
    'NewExpression': newExpression => newExpression?.typeName.type === 'UserDefinedTypeName'
  })
}

export async function checkExceptionRequireAssertRevertThrow(context: CheckerContext): Promise<FeatureSite[]> {
  return await check(context, {
    'FunctionCall': functionCall => functionCall
      && functionCall.expression.type === 'Identifier'
      && (functionCall.expression.name === 'require'
        || functionCall.expression.name === 'assert'
        || functionCall.expression.name === 'revert'),
    'ThrowStatement': () => true
  })
}

export async function checkExceptionTryCatch(context: CheckerContext): Promise<FeatureSite[]> {
  return await check(context, 'TryStatement')
}

export async function checkSingleInheritance(context: CheckerContext): Promise<FeatureSite[]> {
  return await check(context, {
    'ContractDefinition': contractDefinition => contractDefinition?.baseContracts?.length === 1
  })
}

export async function checkMultipleInheritance(context: CheckerContext): Promise<FeatureSite[]> {
  return await check(context, {
    'ContractDefinition': contractDefinition => (contractDefinition?.baseContracts?.length ?? 0) > 1
  })
}

export async function checkSuperVirtualMethodLookup(context: CheckerContext): Promise<FeatureSite[]> {
  return await check(context, {
    'FunctionCall': functionCall => functionCall
      && functionCall.expression.type === 'MemberAccess'
      && functionCall.expression.expression.type === 'Identifier'
      && functionCall.expression.expression.name === 'super'
  })
}

export async function checkFunctionOverriding(context: CheckerContext): Promise<FeatureSite[]> {
  return await check(context, {
    'FunctionDefinition': functionDefinition => (functionDefinition?.override?.length ?? 0) > 0
  })
}

export async function checkFunctionModifierOverriding(context: CheckerContext): Promise<FeatureSite[]> {
  return await check(context, {
    'ModifierDefinition': modifierDefinition => (modifierDefinition?.override?.length ?? 0) > 0
  })
}

export async function checkAbstractContract(context: CheckerContext): Promise<FeatureSite[]> {
  return await check(context, {
    'ContractDefinition': contractDefinition => contractDefinition?.kind === 'abstract'
  })
}

export async function checkInterface(context: CheckerContext): Promise<FeatureSite[]> {
  return await check(context, {
    'ContractDefinition': contractDefinition => contractDefinition?.kind === 'interface'
  })
}

export async function checkFunctionVisibility(context: CheckerContext): Promise<FeatureSite[]> {
  return await check(context, {
    'FunctionDefinition': functionDefinition => functionDefinition?.visibility !== 'default'
  })
}

export async function checkStateVariableVisibility(context: CheckerContext): Promise<FeatureSite[]> {
  return await check(context, {
    'StateVariableDeclaration': stateVariableDeclaration => {
      if (stateVariableDeclaration?.variables) {
        for (const variable of stateVariableDeclaration.variables) {
          if (variable.visibility !== 'default') {
            return true
          }
        }
      }
      return false
    }
  })
}

export async function checkLibrary(context: CheckerContext): Promise<FeatureSite[]> {
  return await check(context, {
    'ContractDefinition': contractDefinition => contractDefinition?.kind === 'library'
  })
}

export async function checkArray(context: CheckerContext): Promise<FeatureSite[]> {
  return await check(context, {
    'VariableDeclaration': variableDeclaration => variableDeclaration?.typeName?.type === 'ArrayTypeName'
  })
}

export async function checkStruct(context: CheckerContext): Promise<FeatureSite[]> {
  return await check(context, 'StructDefinition')
}

export async function checkNestedArrayOrStruct(context: CheckerContext): Promise<FeatureSite[]> {
  const nestedArrays: FeatureSite[] = await check(context, {
    'ArrayTypeName': arrayTypeName => arrayTypeName
      && (arrayTypeName.baseTypeName.type === 'ArrayTypeName'
      || arrayTypeName.baseTypeName.type === 'UserDefinedTypeName')
  })
  const nestedStructs: FeatureSite[] = await check(context, {
    'StructDefinition': structDefinition => ({
      'VariableDeclaration': variableDeclaration =>
        structDefinition && variableDeclaration && variableDeclaration.typeName.type === 'UserDefinedTypeName'
    })
  })
  return [...nestedArrays, ...nestedStructs]
}

export async function checkEnum(context: CheckerContext): Promise<FeatureSite[]> {
  return await check(context, 'EnumDefinition')
}

export async function checkEvent(context: CheckerContext): Promise<FeatureSite[]> {
  return await check(context, 'EventDefinition')
}

export async function checkConstantAndImmutableStateVariable(context: CheckerContext): Promise<FeatureSite[]> {
  const fileLevelConstants: FeatureSite[] = await check(context, 'FileLevelConstant')
  const constantAndImmutableVariables: FeatureSite[] = await check(context, {
    'VariableDeclaration': variableDeclaration => variableDeclaration
      && (variableDeclaration.isDeclaredConst || (variableDeclaration as StateVariableDeclarationVariable).isImmutable)
  })
  return [...fileLevelConstants, ...constantAndImmutableVariables]
}

export async function checkImportRenaming(context: CheckerContext): Promise<FeatureSite[]> {
  return await check(context, {
    'ImportDirective': importDirective => importDirective
      && (importDirective.unitAlias !== null || importDirective.symbolAliases != null)
  })
}

export async function checkPragmaSolidityVersion(context: CheckerContext): Promise<FeatureSite[]> {
  return await check(context, {
    'PragmaDirective': pragmaDirective => pragmaDirective?.name === 'solidity'
  })
}

export async function checkPragmaSmtChecker(context: CheckerContext): Promise<FeatureSite[]> {
  return await check(context, {
    'PragmaDirective': pragmaDirective => pragmaDirective?.name === 'experimental' && pragmaDirective?.value === 'SMTChecker'
  })
}

export async function checkManualGasControl(context: CheckerContext): Promise<FeatureSite[]> {
  const newStyle: FeatureSite[] = await check(context, {
    'FunctionCall': functionCall => {
      if (functionCall?.expression.type === 'NameValueExpression') {
        const nameValueExpression: any = (functionCall.expression as NameValueExpression)
        if (nameValueExpression.arguments.type === 'NameValueList') {
          const nameValueList = nameValueExpression.arguments
          if (nameValueList.names?.includes('gas')) {
            return true
          }
        }
      }
      return false
    }
  })
  const oldStyle: FeatureSite[] = await check(context, {
    'FunctionCall': functionCall => functionCall
      && functionCall.expression.type === 'MemberAccess' && functionCall.expression.memberName === 'gas'
  })
  return [...newStyle, ...oldStyle]
}

export async function checkInlineAssembly(context: CheckerContext): Promise<FeatureSite[]> {
  return await check(context, 'InlineAssemblyStatement')
}

export async function checkHexadecimalLiteral(context: CheckerContext): Promise<FeatureSite[]> {
  return await check(context, 'HexLiteral')
}

export async function checkEtherUnit(context: CheckerContext): Promise<FeatureSite[]> {
  return await check(context, {
    'NumberLiteral': numberLiteral => ['wei', 'szabo', 'finney', 'ether', 'gwei'].includes(numberLiteral?.subdenomination ?? '')
  })
}

export async function checkTimeUnit(context: CheckerContext): Promise<FeatureSite[]> {
  return await check(context, {
    'NumberLiteral': numberLiteral => ['seconds', 'minutes', 'hours', 'days', 'weeks', 'years'].includes(numberLiteral?.subdenomination ?? '')
  })
}


export async function checkSpdxLicenseIdentifier(context: CheckerContext): Promise<FeatureSite[]> {
  return checkByRegex(context, /\/\/\s*SPDX-License-Identifier:/g)
}

export async function checkNatSpecComment(context: CheckerContext): Promise<FeatureSite[]> {
  return checkByRegex(context, /\/\/\/|\/\*\*/g)
}

export async function checkUnicodeLiteral(context: CheckerContext): Promise<FeatureSite[]> {
  return checkByRegex(context, /unicode["']/g)
}
