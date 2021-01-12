import ts from 'typescript';
import * as path from 'path';

/**
 * Path resolver parameters
 */
interface Params {
  /**
   * Sets base url used for resolution of absolute imports
   */
  baseUrl?: string;

  /**
   * Sets key-based alias dictionary. Each of them must contain an array of relative paths
   */
  aliases?: Record<string, Array<string>>;

  /**
   * Array of extensions that is used for resolving files
   */
  extensions?: Array<string>;
}

/**
 * Provides helper methods for working with paths. Uses TypeScript
 * configuration data to work
 */
export class PathResolver {
  /**
   * Root directory path where source code is located
   */
  private readonly rootPath: string;

  /**
   * Sets base url used for resolution of absolute imports
   */
  private readonly baseUrl?: string;

  /**
   * Sets key-based alias dictionary. Each of them must contain an array of relative paths
   */
  private readonly aliases?: Record<string, Array<string>>;

  /**
   * Array of extensions that is used for resolving files
   */
  private readonly extensions?: Array<string>;

  /**
   * Constructs a PathResolver instance
   * @param rootPath Root directory path where source code is located
   * @param params Additional parameters
   */
  public constructor(rootPath: string, params: Params = {}) {
    const { baseUrl, aliases, extensions } = params;

    this.rootPath = rootPath;
    this.baseUrl = baseUrl;
    this.aliases = aliases;
    this.extensions = extensions;
  }

  /**
   * Resolves path from root directory to the specified relative parts
   * @param parts Path slices to combine
   */
  private resolvePath = (...parts: string[]): string => {
    return path.join(this.rootPath, ...parts);
  };

  /**
   * Checks if file exists at the specified location using provided extensions
   * @param filePath Path to the file to check
   */
  private fileExists = (filePath: string): boolean => {
    const existsPlain = ts.sys.fileExists(filePath);

    if (existsPlain) {
      return true;
    }

    const { ext } = path.parse(filePath);

    if (ext || !this.extensions) {
      return false;
    }

    return this.extensions.some(extension => {
      const indexPath = path.join(filePath, `index.${extension}`);

      if (ts.sys.fileExists(indexPath)) {
        return true;
      }

      const resolvedPath = `${filePath}.${extension}`;

      if (ts.sys.fileExists(resolvedPath)) {
        return true;
      }

      return false;
    });
  };

  /**
   * Performs check if the file is imported locally using specified configuration
   * @param filePath Path to the file to check
   */
  public isLocal = (filePath: string): boolean => {
    if (filePath.startsWith('.')) {
      return true;
    }

    if (this.isAliased(filePath)) {
      return true;
    }

    if (this.baseUrl) {
      const resolvedUrl = path.join(this.baseUrl, filePath);

      if (this.fileExists(resolvedUrl)) {
        return true;
      }
    }

    return false;
  };

  /**
   * Performs check if the file conforms to the specification of configured path aliases
   * @param filePath Path to the file to check
   */
  public isAliased = (filePath: string): boolean => {
    if (!this.aliases) {
      return false;
    }

    return Object.keys(this.aliases).some(alias => {
      if (!filePath.startsWith(alias)) {
        return false;
      }

      const values = this.aliases![alias];
      const isLocal = values.some(aliasPath => {
        const resolvedPath = this.resolvePath(
          aliasPath,
          filePath.slice(alias.length),
        );

        return this.fileExists(resolvedPath);
      });

      return isLocal;
    });
  };

  /**
   * Returns extension of the provided file path
   * @param filePath Path to the file to check
   */
  public getExtension = (filePath: string): string =>
    path.extname(filePath).slice(1);
}
