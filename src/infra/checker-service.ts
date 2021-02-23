import lineColumn = require('line-column')
import LruCache = require('lru-cache')
import parser = require('@solidity-parser/parser')
import {ASTNode, BaseASTNode} from '@solidity-parser/parser/dist/ast-types'

import {CheckerContext, FeatureSite, Filename, LineColumnFinder} from '../model/feature'
import {CodeInfo, CodeLocation} from '../model/code'
import {
  ExtendedASTNodeTypeString,
  PrimitiveVisitor,
  StructuredVisitor, StructuredVisitorFinalHandler, StructuredVisitorHandler,
  StructuredVisitorIntermediateHandler
} from '../model/ast'


export function makeCache(size: number): LruCache<Filename, ReturnType<typeof lineColumn>> {
  return new LruCache<Filename, ReturnType<typeof lineColumn>>(size)
}

export function makeContext(codeInfo: CodeInfo, cacheSize: number = 10): CheckerContext {
  return {
    codeInfo: codeInfo,
    cache: makeCache(cacheSize)
  }
}

export function checkByRegex(context: CheckerContext, regex: RegExp): FeatureSite[] {
  const result: FeatureSite[] = []
  let execArray: RegExpExecArray | null
  while ((execArray = regex.exec(context.codeInfo.code)) != null) {
    result.push({literal: execArray[0], index: execArray.index})
  }
  return result
}

function getLineColumnFinderFromCache(context: CheckerContext): LineColumnFinder {
  if (!context.cache.has(context.codeInfo.filename)) {
    context.cache.set(context.codeInfo.filename, lineColumn(context.codeInfo.code))
  }
  return context.cache.get(context.codeInfo.filename)!
}

export function preserveFeatureSite(context: CheckerContext, node: BaseASTNode): FeatureSite {
  if (node.loc === undefined) { // sometimes location is not given by @solidity-parser/parser
    return {}
  }
  const lineColumnFinder: LineColumnFinder = getLineColumnFinderFromCache(context)
  const location = (node.loc as unknown as CodeLocation)  // node.loc is wrongly typed in @solidity-parser/parser
  const startIndex: number = lineColumnFinder.toIndex({line: location.start.line, column: location.start.column + 1})
  const endIndex: number = lineColumnFinder.toIndex({line: location.end.line, column: location.end.column + 1})
  return {
    literal: context.codeInfo.code.substring(startIndex, endIndex + 1),
    location: location,
    index: startIndex,
  }
}

export function checkPrimitive(context: CheckerContext, primitiveVisitor: PrimitiveVisitor): void {
  parser.visit(context.codeInfo.ast, primitiveVisitor)
}

export function check(context: CheckerContext,
                      structuredVisitorOrNodeName: StructuredVisitor | ExtendedASTNodeTypeString | ExtendedASTNodeTypeString[]): Promise<FeatureSite[]> {
  if (typeof structuredVisitorOrNodeName === 'string') { // structuredVisitorOrNodeName is ExtendedASTNodeTypeString
    return checkByASTNodeName(context, structuredVisitorOrNodeName)
  } else if (Array.isArray(structuredVisitorOrNodeName)) { // structuredVisitorOrNodeName is ExtendedASTNodeTypeString[]
    return checkByASTNodeNames(context, structuredVisitorOrNodeName)
  } else { // structuredVisitorOrNodeName is StructuredVisitor
    return checkByStructuredVisitor(context, structuredVisitorOrNodeName)
  }
}

function checkByASTNodeName(context: CheckerContext, nodeTypeName: ExtendedASTNodeTypeString): Promise<FeatureSite[]> {
  return new Promise(resolve => {
    const result: FeatureSite[] = []
    parser.visit(context.codeInfo.ast, {
      [nodeTypeName]: (node: BaseASTNode) => {
        result.push(preserveFeatureSite(context, node))
      },
      'SourceUnit:exit': () => {
        resolve(result)
      },
    })
  })
}

function checkByASTNodeNames(context: CheckerContext, nodeTypeNames: ExtendedASTNodeTypeString[]): Promise<FeatureSite[]> {
  return new Promise(resolve => {
    const result: FeatureSite[] = []
    const visitor: Record<string, (node: BaseASTNode) => void> = {
      'SourceUnit:exit': () => {
        resolve(result)
      },
    }
    for (const names of nodeTypeNames) {
      visitor[names] = (node => result.push(preserveFeatureSite(context, node)))
    }
    parser.visit(context.codeInfo.ast, visitor)
  })
}

function checkByStructuredVisitor(context: CheckerContext, structuredVisitor: StructuredVisitor): Promise<FeatureSite[]> {
  return new Promise(resolve => {
    const primitiveVisitor: PrimitiveVisitor = buildPrimitiveVisitor(structuredVisitor,
      (node: ASTNode) => preserveFeatureSite(context, node),
      (featureSites: FeatureSite[]) => resolve(featureSites))
    parser.visit(context.codeInfo.ast, primitiveVisitor)
  })
}

function buildPrimitiveVisitor(structuredVisitor: StructuredVisitor,
                               captureSite: (node: ASTNode) => FeatureSite,
                               onComplete: (featureSites: FeatureSite[]) => void): PrimitiveVisitor {
  const runTimeContextNodeRecord: Partial<Record<ExtendedASTNodeTypeString, ASTNode | null>> = {}
  const runTimeContextNodeTypePaths: ExtendedASTNodeTypeString[][] = []
  const buildTimeNodeTypeStack: ExtendedASTNodeTypeString[] = []
  const capturedFeatureSites: FeatureSite[] = []
  const primitiveVisitor: PrimitiveVisitor = {
    'SourceUnit:exit': () => {
      onComplete(capturedFeatureSites)
    },
  }

  function buildPrimitiveVisitor(structuredVisitor: StructuredVisitor, root: StructuredVisitor) {
    for (const [nodeType, handler] of (Object.entries(structuredVisitor) as [ExtendedASTNodeTypeString, StructuredVisitorHandler][])) {
      const probeObject: StructuredVisitor | boolean | undefined = handler!()
      if (typeof probeObject === 'boolean' || typeof probeObject === 'undefined') { // handler is StructuredVisitorFinalHandler
        runTimeContextNodeTypePaths.push(buildTimeNodeTypeStack.slice())
        if (primitiveVisitor[nodeType] === undefined) {
          primitiveVisitor[nodeType] = (finalNode) => {
            for (const contextNodeTypePath of runTimeContextNodeTypePaths) {
              let steppingVisitor: StructuredVisitor | null = root
              for (const contextNodeType of contextNodeTypePath) {
                const contextNode = runTimeContextNodeRecord[contextNodeType]
                if (contextNode === null) {
                  steppingVisitor = null
                  break
                } else {
                  steppingVisitor = (steppingVisitor[contextNodeType] as StructuredVisitorIntermediateHandler)(contextNode)
                }
              }
              if (steppingVisitor !== null) {
                const finalMatch: boolean = (steppingVisitor[nodeType] as StructuredVisitorFinalHandler)(finalNode) ?? false
                if (finalMatch) {
                  capturedFeatureSites.push(captureSite(finalNode))
                  return
                }
              }
            }
          }
        }
      } else { // handler is StructuredVisitorIntermediateHandler
        if (primitiveVisitor[nodeType] === undefined) {
          primitiveVisitor[nodeType] = node => {
            runTimeContextNodeRecord[nodeType] = node
          }
        }
        const exitKey = `${nodeType}:exit`
        if (primitiveVisitor[exitKey] === undefined) {
          primitiveVisitor[exitKey] = () => {
            runTimeContextNodeRecord[nodeType] = null
          }
        }
        buildTimeNodeTypeStack.push(nodeType as ExtendedASTNodeTypeString)
        buildPrimitiveVisitor(probeObject, root)
        buildTimeNodeTypeStack.pop()
      }
    }
  }

  buildPrimitiveVisitor(structuredVisitor, structuredVisitor)
  return primitiveVisitor
}
