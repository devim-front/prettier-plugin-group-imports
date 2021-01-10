import * as ts from 'typescript';
import * as path from 'path';

/**
 * Performs a parsing process of a TypeScript configuration file
 * @param configPath Path to the configuration file
 */
export function getTsConfig(configPath: string): ts.ParsedCommandLine | null {
  try {
    const configData = ts.sys.readFile(configPath, 'utf-8');

    if (!configData) {
      return null;
    }

    const json = ts.parseConfigFileTextToJson(configPath, configData);
    const config = ts.parseJsonConfigFileContent(
      json.config,
      ts.sys,
      path.dirname(configPath),
    );

    return config;
  } catch {
    return null;
  }
}
