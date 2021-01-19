import * as path from 'path';

/**
 * Provides helper methods for working with paths
 */
export abstract class PathResolver {
  /**
   * Performs check if the file is imported locally using specified configuration
   * @param filePath Path to the file to check
   */
  abstract isLocal(filePath: string): boolean;

  /**
   * Returns extension of the provided file path
   * @param filePath Path to the file to check
   */
  getExtension = (filePath: string): string => path.extname(filePath).slice(1);
}
