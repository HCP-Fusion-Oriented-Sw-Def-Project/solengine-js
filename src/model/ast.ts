import {
  ArrayTypeName,
  AssemblyAssignment,
  AssemblyBlock,
  AssemblyCall, AssemblyCase, AssemblyFor, AssemblyFunctionDefinition, AssemblyFunctionReturns, AssemblyIf,
  AssemblyItem, AssemblyLiteral,
  AssemblyLocalDefinition,
  AssemblyStackAssignment, AssemblySwitch, ASTNode,
  ASTNodeTypeString,
  BaseASTNode, BinaryOperation,
  Block, BooleanLiteral,
  Break,
  BreakStatement, Conditional,
  Continue,
  ContinueStatement,
  ContractDefinition, DecimalNumber,
  DoWhileStatement,
  ElementaryTypeName,
  EmitStatement,
  EnumDefinition,
  EnumValue,
  EventDefinition,
  ExpressionStatement,
  ForStatement,
  FunctionCall,
  FunctionDefinition,
  FunctionTypeName, HexLiteral, HexNumber, Identifier,
  IfStatement,
  ImportDirective, IndexAccess, IndexRangeAccess,
  InheritanceSpecifier,
  InlineAssemblyStatement, LabelDefinition,
  Mapping, MemberAccess,
  ModifierDefinition,
  ModifierInvocation, NameValueExpression, NameValueList, NewExpression, NumberLiteral,
  PragmaDirective,
  ReturnStatement,
  SourceUnit,
  StateVariableDeclaration, StringLiteral,
  StructDefinition, SubAssembly,
  ThrowStatement, TupleExpression, TypeNameExpression, UnaryOperation, UncheckedStatement,
  UserDefinedTypeName,
  UsingForDeclaration,
  VariableDeclaration,
  VariableDeclarationStatement,
  WhileStatement
} from '@solidity-parser/parser/dist/ast-types'

// extend the unsound `ASTNodeTypeString` type in @solidity-parser/parser
export type ExtendedASTNodeTypeString = ASTNodeTypeString | 'TryStatement' | 'FileLevelConstant'

export type ASTNodeMapperType<T extends ExtendedASTNodeTypeString> =
  T extends 'SourceUnit' ? SourceUnit :
  T extends 'PragmaDirective' ? PragmaDirective :
  T extends 'PragmaName' ? BaseASTNode :  // too wide (solidity-parser issue)
  T extends 'PragmaValue' ? BaseASTNode :  // too wide (solidity-parser issue)
  T extends 'ImportDirective' ? ImportDirective :
  T extends 'ContractDefinition' ? ContractDefinition :
  T extends 'InheritanceSpecifier' ? InheritanceSpecifier :
  T extends 'StateVariableDeclaration' ? StateVariableDeclaration :
  T extends 'UsingForDeclaration' ? UsingForDeclaration :
  T extends 'StructDefinition' ? StructDefinition :
  T extends 'ModifierDefinition' ? ModifierDefinition :
  T extends 'ModifierInvocation' ? ModifierInvocation :
  T extends 'FunctionDefinition' ? FunctionDefinition :
  T extends 'EventDefinition' ? EventDefinition :
  T extends 'EnumValue' ? EnumValue :
  T extends 'EnumDefinition' ? EnumDefinition :
  T extends 'VariableDeclaration' ? VariableDeclaration :
  T extends 'UserDefinedTypeName' ? UserDefinedTypeName :
  T extends 'Mapping' ? Mapping :
  T extends 'ArrayTypeName' ? ArrayTypeName :
  T extends 'FunctionTypeName' ? FunctionTypeName :
  T extends 'StorageLocation' ? BaseASTNode :  // too wide (solidity-parser issue)
  T extends 'StateMutability' ? BaseASTNode :  // too wide (solidity-parser issue)
  T extends 'Block' ? Block :
  T extends 'ExpressionStatement' ? ExpressionStatement :
  T extends 'IfStatement' ? IfStatement :
  T extends 'WhileStatement' ? WhileStatement :
  T extends 'ForStatement' ? ForStatement :
  T extends 'InlineAssemblyStatement' ? InlineAssemblyStatement :
  T extends 'DoWhileStatement' ? DoWhileStatement :
  T extends 'ContinueStatement' ? ContinueStatement :
  T extends 'Break' ? Break :
  T extends 'Continue' ? Continue :
  T extends 'BreakStatement' ? BreakStatement :
  T extends 'ReturnStatement' ? ReturnStatement :
  T extends 'EmitStatement' ? EmitStatement :
  T extends 'ThrowStatement' ? ThrowStatement :
  T extends 'VariableDeclarationStatement' ? VariableDeclarationStatement :
  T extends 'IdentifierList' ? BaseASTNode :  // too wide (solidity-parser issue)
  T extends 'ElementaryTypeName' ? ElementaryTypeName :
  T extends 'FunctionCall' ? FunctionCall :
  T extends 'AssemblyBlock' ? AssemblyBlock :
  T extends 'AssemblyItem' ? AssemblyItem :
  T extends 'AssemblyCall' ? AssemblyCall :
  T extends 'AssemblyLocalDefinition' ? AssemblyLocalDefinition :
  T extends 'AssemblyAssignment' ? AssemblyAssignment :
  T extends 'AssemblyStackAssignment' ? AssemblyStackAssignment :
  T extends 'LabelDefinition' ? LabelDefinition :
  T extends 'AssemblySwitch' ? AssemblySwitch :
  T extends 'AssemblyCase' ? AssemblyCase :
  T extends 'AssemblyFunctionDefinition' ? AssemblyFunctionDefinition :
  T extends 'AssemblyFunctionReturns' ? AssemblyFunctionReturns :
  T extends 'AssemblyFor' ? AssemblyFor :
  T extends 'AssemblyIf' ? AssemblyIf :
  T extends 'AssemblyLiteral' ? AssemblyLiteral :
  T extends 'SubAssembly' ? SubAssembly :
  T extends 'TupleExpression' ? TupleExpression :
  T extends 'TypeNameExpression' ? TypeNameExpression :
  T extends 'NameValueExpression' ? NameValueExpression :
  T extends 'BooleanLiteral' ? BooleanLiteral :
  T extends 'NumberLiteral' ? NumberLiteral :
  T extends 'Identifier' ? Identifier :
  T extends 'BinaryOperation' ? BinaryOperation :
  T extends 'UnaryOperation' ? UnaryOperation :
  T extends 'NewExpression' ? NewExpression :
  T extends 'Conditional' ? Conditional :
  T extends 'StringLiteral' ? StringLiteral :
  T extends 'HexLiteral' ? HexLiteral :
  T extends 'HexNumber' ? HexNumber :
  T extends 'DecimalNumber' ? DecimalNumber :
  T extends 'MemberAccess' ? MemberAccess :
  T extends 'IndexAccess' ? IndexAccess :
  T extends 'IndexRangeAccess' ? IndexRangeAccess :
  T extends 'NameValueList' ? NameValueList :
  T extends 'UncheckedStatement' ? UncheckedStatement : never

export type ASTNodeHandlerRecord<T extends ExtendedASTNodeTypeString> = { [K in T]: StructuredVisitorHandler<ASTNodeMapperType<K>> }

export interface StructuredVisitorIntermediateHandler<T extends BaseASTNode = BaseASTNode> { (node?: T): StructuredVisitor }
export interface StructuredVisitorFinalHandler<T extends BaseASTNode = BaseASTNode> { (node?: T): boolean | undefined }
export type StructuredVisitorHandler<T extends BaseASTNode = BaseASTNode> = StructuredVisitorIntermediateHandler<T> | StructuredVisitorFinalHandler<T>
export type StructuredVisitor = Partial<ASTNodeHandlerRecord<ExtendedASTNodeTypeString>>

export interface PrimitiveVisitorHandler { (node: ASTNode): void }
export type PrimitiveVisitor = Record<string, PrimitiveVisitorHandler>
