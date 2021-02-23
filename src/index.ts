// SolEngine: An Extensible Language Feature Analysis Tool for Solidity
// Go to https://solengine.github.io for usage and detail

import * as astService from './infra/ast-service'
import * as checkerService from './infra/checker-service'
import * as engine from './infra/engine'
import * as checkers from './task/checkers'
import * as engineBuilder from './task/engine-builder'

export = {
  buildDefaultEngine: engineBuilder.buildDefaultEngine,
  buildDefaultEngineWithConfig: engineBuilder.buildDefaultEngineWithConfig,
  CheckerEngine: engine.CheckerEngine,
  checkers: checkers,
  util: {
    check: checkerService.check,
    checkPrimitive: checkerService.checkPrimitive,
    checkByRegex: checkerService.checkByRegex,
    makeCache: checkerService.makeCache,
    makeContext: checkerService.makeContext,
    preserveFeatureSite: checkerService.preserveFeatureSite,
    convertCodeToAst: astService.convertCodeToAst
  },
}
