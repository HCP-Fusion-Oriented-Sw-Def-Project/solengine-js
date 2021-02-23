const solEngine = require('../lib');

// write your checker function
function checkRecursion(context) {
  return solEngine.util.check(context, {
    'FunctionDefinition': functionDefinition => ({
      'FunctionCall': functionCall => ({
        'Identifier': identifier =>
          functionDefinition && functionCall && identifier && identifier.name === functionDefinition.name
      })
    })
  });
}

// use your checker (promise style)
solEngine.CheckerEngine.new().addChecker({
  name: 'Recursion',
  check: checkRecursion,
}).check({
  filename: 'test.sol',
  code: 'contract C { function f() public { f(); } }'
}).then(result => {
  console.log(result);
  // { Recursion: [ { literal: 'f', location: [Object], index: 35 } ] }
});

// use your checker (async-await style)
(async function () {
  let result = await solEngine.CheckerEngine.new().addChecker({
    name: 'Recursion',
    check: checkRecursion
  }).check({
    filename: 'test.sol',
    code: 'contract C { function f() public { f(); } }'
  });
  console.log(result);
  // { Recursion: [ { literal: 'f', location: [Object], index: 35 } ] }
})()
