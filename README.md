
# SolEngine

![SolEngine logo](./logo.png)

SolEngine is an extensible language feature analysis tool for Solidity. 

SolEngine accepts Solidity code and outputs the features the code contains.
By default, it supports many Solidity features, and you can add your own very easily.

## Requirements
- node 10.13.0+
- npm 6.4.1+

## Install it!
```shell
npm i solengine-js
```

## Use it!

### Use default configurations

```javascript
const solEngine = require('solengine-js/lib');

solEngine.buildDefaultEngine().check({
  filename: 'test.sol',
  code: 'contract C { function f() public {} }'
}).then(result => {
  console.log(result);
  // {
  //   FunctionVisibility: [
  //     {
  //       literal: 'function f() public {}',
  //       location: [Object],
  //       index: 13
  //     }
  //   ]
  // }
});
```

SolEngine can also be used in `async`/`await` style. Please refer to `example`.

### Implementing your own checkers

Under the hood, SolEngine runs a series of *checkers* to perform feature analysis.
A *checker* is a function that iterates through Abstract Syntax Trees (AST).
SolEngine provides a special syntax called *structured visitor language* for you
to define the rule of whether a feature exists in the code.

A *structured visitor* is a JavaScript object, with its key as a type name of AST Nodes 
and its value as a handler function. The handler function returns either (1) a smaller 
*structured visitor* object or (2) a boolean value. (1) means SolEngine should continue 
to visit a deeper AST node; (2) means SolEngine should stop at this AST node, and the boolean
value means whether this node contains a feature you concern.

For example, this is a visitor for recursion feature:

```javascript
const recursionStructuredVisitor = {
  'FunctionDefinition': functionDefinition => ({
    'FunctionCall': functionCall => ({
      'Identifier': identifier => {
        return functionDefinition && functionCall && identifier &&
        identifier.name === functionDefinition.name
      }
    })
  })
}
```

When SolEngine encounters a `FunctionDefinition` node, it should continue to go deeper, 
until visiting an `Identifier` within a `FunctionCall`. Then, according to the logic inside 
the `identifier => {}` function, SolEngine checks where the name of `Identifier` node equals that 
of `FunctionDefinition`. If yes, SolEngine will record this site as recursion.

**Note:** Before the actual visiting, SolEngine needs to call the functions one by one in the 
structured visitor to prepare the environment. Therefore, SolEngine will pass `undefined` as 
arguments to these functions, and you should handle them correctly like in the above example 
(`functionDefinition && functionCall && identifier`).

Use the above `recursionStructuredVisitor` to build an engine:

```javascript
solEngine.CheckerEngine.new().addChecker({
  name: 'Recursion',
  check: context => solEngine.util.check(context, recursionStructuredVisitor)
}).check({
  filename: 'test.sol',
  code: 'contract C { function f() public { f(); } }'
}).then(result => {
  console.log(result);
  // { Recursion: [ { literal: 'f', location: [Object], index: 35 } ] }
});
```

<details>
  <summary>How does SolEngine process a structured visitor object?</summary>

  Exmaple – For the given structured visitor object:

  ```javascript
  const structuredVisitor = {
  'FunctionDefinition': functionDefinition => ({
    'FunctionCall': functionCall => ({
      'Identifier': identifier => {
        return true
      }
    }),
    'EnumValue': enumValue => ({
      'Mapping': mapping => {
        return true
      },
      'Identifier': identifier => {
        return true
      }
    })
  })
  }
  ```
  
  SolEngine will turn it into a primitive visitor object like:
  
  ```javascript
  let functionDefinitionNode = null
  let functionCallNode = null
  let enumValueNode = null
  const primitiveVisitor = {
    'FunctionDefinition': node => {
      functionDefinitionNode = node
    },
    'FunctionDefinition:exit': node => {
      functionDefinitionNode = null
    },
    'FunctionCall': node => {
      if (functionDefinitionNode !== null) {
        functionCallNode = node
      }
    },
    'FunctionCall:exit': node => {
      functionCallNode = null
    },
    'EnumValue': node => {
      enumValueNode = node
    },
    'EnumValue:exit': node => {
      enumValueNode = null
    },
    'Identifier': node => {
      if (functionDefinitionNode !== null) {
        if (functionCallNode !== null) {
          if (structuredVisitor.FunctionDefinition(functionDefinitionNode).FunctionCall(functionCallNode).Identifier(node)) {
            // save the feature site
          }
        }
        if (enumValueNode !== null) {
          if (structuredVisitor.FunctionDefinition(functionDefinitionNode).EnumValue(enumValueNode).Identifier(node)) {
            // save the feature site
          }
        }
      }
    },
    'Mapping': node => {
      if (functionDefinitionNode !== null) {
        if (enumValueNode !== null) {
          if (structuredVisitor.FunctionDefinition(functionDefinitionNode).EnumValue(enumValueNode).Mapping(node)) {
            // save the feature site
          }
        }
      }
    },
    'SourceUnit:exit': node => {
      // resolve the promise
    },
  }
  ```
  
  Then, SolEngine hands it over to the underlying AST library.

</details>

## Typing

This library is fully typed with `.d.ts`.

## License

The MIT License
