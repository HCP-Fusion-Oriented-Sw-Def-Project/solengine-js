import {
  CheckerConfig,
  CheckerContext, CheckerOutputFormatString,
  CheckerOutputType,
  FeatureChecker,
  FeatureSite,
  FeatureTypeName
} from '../model/feature'
import {PlainCodeInfo} from '../model/code'
import {makeContext} from './checker-service'
import {convertCodeToAst} from './ast-service'
import {convertMapToObject} from '../util/io'


export class CheckerEngine<T extends CheckerOutputFormatString> {
  private checkers: FeatureChecker[] = []

  constructor(private config: CheckerConfig<T>) {}

  public static new(): CheckerEngine<'object'> {
    return new CheckerEngine({outputFormat: 'object'})
  }

  public static newWithConfig<R extends CheckerOutputFormatString>(config: CheckerConfig<R>): CheckerEngine<R> {
    return new CheckerEngine(config)
  }

  public addChecker(checker: FeatureChecker): CheckerEngine<T> {
    this.checkers.push(checker)
    return this
  }

  public async check(codeInfo: PlainCodeInfo): Promise<CheckerOutputType<T>> {
    const context: CheckerContext = makeContext({...codeInfo, ast: convertCodeToAst(codeInfo.code)})
    const result = new Map<FeatureTypeName, FeatureSite[]>()
    for (const checker of this.checkers) {
      const featureSites: FeatureSite[] = await checker.check(context)
      if (featureSites.length > 0) {
        result.set(checker.name, featureSites)
      }
    }


    if (this.config.outputFormat === 'map') {
      return result as CheckerOutputType<T>
    } else if (this.config.outputFormat === 'object') {
      return convertMapToObject(result) as CheckerOutputType<T>
    } else if (this.config.outputFormat === 'json') {
      return JSON.stringify(convertMapToObject(result)) as CheckerOutputType<T>
    } else {
      throw new Error(`Unexpected CheckerEngine.config.outputFormat: ${this.config.outputFormat}`)
    }
  }
}
