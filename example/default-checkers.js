const solEngine = require('../lib');

// use default checkers
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
