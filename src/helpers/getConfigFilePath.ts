import * as ts from 'typescript';

/**
 * Searches for a configuration file
 * @param fileName Name of the configuration file to search
 * @param searchPath Deepest directory level where to begin searching upwards
 */
export function getConfigFilePath(
  fileName: string,
  searchPath: string,
): string | null {
  const configPath = ts.findConfigFile(searchPath, ts.sys.fileExists, fileName);

  if (!configPath) {
    return null;
  }

  return configPath;
}
