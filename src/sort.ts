import * as path from 'path';
import { RequiredOptions } from 'prettier';

import { getTsConfig, getConfigFilePath, getDependencies } from './helpers';
import {
  PathResolver,
  ASTWorker,
  SortAlg,
  Sorter,
  SortGroup,
  FSPathResolver,
  PackagePathResolver,
} from './services';

/**
 * Base configuration
 */
interface BaseOptions extends RequiredOptions {
  /**
   * File resolver type that is used to determine if provided import is local
   * @default { "type": "package" }
   */
  resolver?:
    | {
        type: 'fs';

        /**
         * Custom tsconfig.json name to search
         * @default "tsconfig.json"
         */
        configName?: string;
      }
    | {
        type: 'package';
      };
}

/**
 * Babel parser options and import parsing options
 */
interface ParserOptions {
  /**
   * Import comment attach mode
   * @default 'prev-line'
   */
  importCommentMode?: 'prev-line' | 'same-line' | 'none';

  /**
   * Where to insert sorted imports
   * @default 'auto'
   */
  importLocation?: 'leading' | 'auto';
}

/**
 * Sorting options
 */
interface SorterOptions {
  /**
   * Sorting groups
   * @default [['global','persist'],['local','persist'],['relative','persist'],['static','persist'],['rest','persist']]
   */
  groups?: Array<[SortGroup, SortAlg]>;

  /**
   * Split relative groups based on deepness
   * @default true
   */
  splitRelativeGroups?: boolean;

  /**
   * Direction of the relative sorting alg
   * @default 'deepest-first'
   */
  relativeSortAlg?: 'shallow-first' | 'deepest-first';
}

/**
 * Sorting and parsing options
 */
export interface Options extends BaseOptions, ParserOptions, SorterOptions {}

/**
 * Performs a sorting algorithm using provided options
 * @param text Source code
 * @param options Parsing and sorting options
 */
export function sort(text: string, options: Options) {
  const {
    filepath,
    endOfLine,

    resolver = {
      type: 'package',
    },

    importLocation = 'auto',
    importCommentMode = 'prev-line',

    groups = [
      ['global', 'persist'],
      ['local', 'persist'],
      ['relative', 'persist'],
      ['static', 'persist'],
      ['rest', 'persist'],
    ],
    splitRelativeGroups = true,
    relativeSortAlg = 'deepest-first',
  } = options;

  let pathResolver: PathResolver;

  if ('fs' === resolver.type) {
    path;
  }

  const configSearchPath = filepath || process.cwd();

  switch (resolver.type) {
    case 'fs': {
      const configPath = getConfigFilePath(
        resolver.configName || 'tsconfig.json',
        configSearchPath,
      );

      if (!configPath) {
        return text;
      }

      const configDirectory = path.dirname(configPath);
      const config = getTsConfig(configPath);

      if (!config) {
        return text;
      }

      pathResolver = new FSPathResolver(configDirectory, {
        baseUrl: config.options.baseUrl,
        aliases: config.options.paths,
        extensions: ['ts', 'tsx', 'js', 'jsx'],
      });
      break;
    }

    case 'package': {
      const configPath = getConfigFilePath('package.json', configSearchPath);

      if (!configPath) {
        return text;
      }

      const dependencies = getDependencies(configPath);

      if (!dependencies) {
        return text;
      }

      pathResolver = new PackagePathResolver({
        dependencies,
      });
      break;
    }

    default:
      return text;
  }

  const ast = new ASTWorker(text, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
    importCommentMode,
    endOfLine,
  });

  const importNodes = ast.findImportNodes();

  if (importNodes.length === 0) {
    return text;
  }

  ast.removeNodes(...importNodes);

  const sorter = new Sorter(pathResolver);
  const importGroups = sorter.process(importNodes, {
    groups,
    splitRelativeGroups,
    relativeSortAlg,
  });

  ast.insertImports(importGroups, importLocation);

  const code = ast.compile();

  return code;
}
