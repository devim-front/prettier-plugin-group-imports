import * as path from 'path';
import { RequiredOptions } from 'prettier';

import { getTsConfig, getTsConfigPath } from './helpers';
import { PathResolver, ASTWorker } from './services';
import { SortAlg, Sorter, SortGroup } from './services/Sorter';

/**
 * Base configuration
 */
interface BaseOptions extends RequiredOptions {
  /**
   * Custom tsconfig.json name to search
   */
  configName?: string;
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

    configName = 'tsconfig.json',

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

  const configSearchPath = filepath || process.cwd();
  const configPath = getTsConfigPath(configName, configSearchPath);

  if (!configPath) {
    return text;
  }

  const configDirectory = path.dirname(configPath);
  const config = getTsConfig(configPath);

  if (!config) {
    return text;
  }

  const pathResolver = new PathResolver(configDirectory, {
    baseUrl: config.options.baseUrl,
    aliases: config.options.paths,
    extensions: ['ts', 'tsx', 'js', 'jsx'],
  });

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
