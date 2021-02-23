import {AST} from '@solidity-parser/parser/dist/ast-types'
import {Filename} from './feature'


export interface LineColumnLocation {
  line: number
  column: number
}

export interface CodeLocation {
  start: LineColumnLocation
  end: LineColumnLocation
}

export interface CodeInfo {
  filename: Filename
  code: string
  ast: AST
}

export interface PlainCodeInfo {
  filename: Filename,
  code: string
}
