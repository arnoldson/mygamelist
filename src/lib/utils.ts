/**
 * Creates a deep copy of an object, array, or primitive value.
 * Handles nested objects, arrays, dates, and other common types.
 *
 * @param obj - The object to deep copy
 * @returns A deep copy of the input object
 */
export function deepCopy<T>(obj: T): T {
  // Handle null, undefined, and primitive types
  if (obj === null || typeof obj !== "object") {
    return obj
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T
  }

  // Handle Arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => deepCopy(item)) as T
  }

  // Handle Objects
  if (typeof obj === "object") {
    const copiedObj = {} as T

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        copiedObj[key] = deepCopy(obj[key])
      }
    }

    return copiedObj
  }

  return obj
}

/**
 * Alternative: Structured cloning (modern browsers/Node 17+)
 * More performant for complex objects but has limitations
 *
 * @param obj - The object to deep copy
 * @returns A deep copy using structuredClone
 */
export function deepCopyStructured<T>(obj: T): T {
  if (typeof structuredClone !== "undefined") {
    return structuredClone(obj)
  }

  // Fallback to JSON method (limited but widely supported)
  return JSON.parse(JSON.stringify(obj))
}

/**
 * JSON-based deep copy (fastest but limited)
 * ⚠️ Warning: Loses functions, undefined values, symbols, and dates become strings
 *
 * @param obj - The object to deep copy
 * @returns A deep copy using JSON methods
 */
export function deepCopyJSON<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Deep merge two objects (useful for updating nested state)
 *
 * @param target - The target object to merge into
 * @param source - The source object to merge from
 * @returns A new object with merged properties
 */
export function deepMerge<T extends Record<string, any>>(
  target: T,
  source: Partial<T>
): T {
  const result = deepCopy(target)

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key]
      const targetValue = result[key]

      if (
        sourceValue &&
        typeof sourceValue === "object" &&
        !Array.isArray(sourceValue) &&
        targetValue &&
        typeof targetValue === "object" &&
        !Array.isArray(targetValue)
      ) {
        // Recursively merge nested objects
        result[key] = deepMerge(targetValue, sourceValue)
      } else {
        // Overwrite or set the value
        result[key] = deepCopy(sourceValue)
      }
    }
  }

  return result
}
