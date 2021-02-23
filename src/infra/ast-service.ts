import parser = require('@solidity-parser/parser')
import {AST} from '@solidity-parser/parser/dist/ast-types'

export function convertCodeToAst(code: string): AST {
  return parser.parse(code, {loc: true}) // may throw errors
}
