import { PathResolver } from './PathResolver';

/**
 * Path resolver parameters
 */
interface Params {
  /**
   * Array of package.json dependencies to resolve from
   */
  dependencies?: string[];
}

/**
 * Resolves local paths using dependency array of package.json file
 */
export class PackagePathResolver extends PathResolver {
  /**
   * Array of package.json dependencies to resolve from
   */
  private readonly dependencies: string[];

  /**
   * Constructs a PackagePathResolver instance
   * @param params Parameters
   */
  public constructor(params: Params = {}) {
    super();

    const { dependencies = [] } = params;

    this.dependencies = dependencies;
  }

  /**
   * Checks if path fits the dependencies spec
   * @param filePath Path to the file to check
   */
  private isGlobal = (filePath: string): boolean =>
    this.dependencies.some(dependency => {
      if (dependency === filePath) {
        return true;
      }

      if (filePath.startsWith(`${dependency}/`)) {
        return true;
      }

      return false;
    });

  /**
   * @inheritdoc
   */
  public isLocal = (filePath: string): boolean => {
    if (filePath.startsWith('.')) {
      return true;
    }

    if (this.dependencies.length === 0) {
      return true;
    }

    return !this.isGlobal(filePath);
  };
}
