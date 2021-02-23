import {FeatureSite, FeatureTypeName} from '../model/feature'

export function convertMapToObject(map: Map<string, any>): Record<string, any> {
  return Array.from(map).reduce((obj: Record<string, any>, [key, value]) => {
    if (value instanceof Map) {
      obj[key] = convertMapToObject(value)
    } else {
      obj[key] = value
    }
    return obj
  }, {})
}

export function dumpCheckResult(checkResult: Map<FeatureTypeName, FeatureSite[]>): string {
  return JSON.stringify(convertMapToObject(checkResult))
}
