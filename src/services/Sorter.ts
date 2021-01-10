import { ImportDeclaration } from '@babel/types';
import naturalCompare from 'string-natural-compare';
import { PathResolver } from './PathResolver';
import { Node } from '../types';

/**
 * Sorting algorithm
 */
export type SortAlg = 'natural' | 'persist';

/**
 * Sorting group
 */
export type SortGroup = 'global' | 'local' | 'relative' | 'static' | 'rest';

/**
 * Sorting options
 */
interface Options {
  /**
   * Sorting groups
   */
  groups: Array<[SortGroup, SortAlg]>;

  /**
   * Split relative groups based on deepness
   */
  splitRelativeGroups?: boolean;

  /**
   * Direction of the relative sorting alg
   */
  relativeSortAlg?: 'shallow-first' | 'deepest-first';

  /**
   * RegExp pattern to split local imports
   */
  splitLocalPattern?: string;
}

interface ProcessedNode {
  target: Node<ImportDeclaration>;
  isLocal: boolean;
  isStatic: boolean;
  relativeDepth: number;
  order: number;
}

/**
 * Provides sorting methods
 */
export class Sorter {
  /**
   * Utility class used to resolve paths
   */
  private readonly pathResolver: PathResolver;

  /**
   * Constructs a Sorter for sorting imports
   * @param pathResolver Instance of path resolving class
   */
  public constructor(pathResolver: PathResolver) {
    this.pathResolver = pathResolver;
  }

  /**
   * Calculates the level of relative import deepness
   * @param node Import declaration node instance
   */
  private resolveRelativeDepth = (node: Node<ImportDeclaration>) => {
    const filePath = node.target.source.value;

    const needle = '../';
    let value = 0;
    let lastIndex = 0;

    if (filePath.startsWith('./')) {
      return 1;
    }

    for (;;) {
      const index = filePath.indexOf(needle, lastIndex);

      if (index === lastIndex) {
        value += 2;
        lastIndex = index + needle.length;
      } else {
        break;
      }
    }

    return value;
  };

  /**
   * Calculates import nodes metadata
   * @param nodes Array of import declaration nodes
   */
  private resolveMetadata = (
    nodes: Array<Node<ImportDeclaration>>,
  ): Array<ProcessedNode> =>
    nodes.map((node, order) => {
      const filePath = node.target.source.value;
      const isLocal = this.pathResolver.isLocal(filePath);
      const relativeDepth = this.resolveRelativeDepth(node);
      const isStatic = !!this.pathResolver.getExtension(filePath);

      return {
        target: node,
        order,
        isLocal,
        isStatic,
        relativeDepth,
      };
    });

  /**
   * Sorts a single group of import declaration nodes
   * @param group Group of processed nodes with metadata
   * @param alg Algorithm used to sort
   */
  private sortGroup = (group: Array<ProcessedNode>, alg: SortAlg) => {
    let result: Array<ProcessedNode>;

    switch (alg) {
      case 'natural':
        result = group.sort((a, b) =>
          naturalCompare(
            a.target.target.source.value,
            b.target.target.source.value,
          ),
        );
        break;

      case 'persist':
        result = group.sort((a, b) => a.order - b.order);
        break;

      default:
        result = group;
        break;
    }

    return result.map(processed => processed.target);
  };

  /**
   * Processes array of import declaration nodes and sorts them using provided options
   * @param nodes Array of import declaration nodes
   * @param options Sorting options
   */
  public process = (
    nodes: Array<Node<ImportDeclaration>>,
    options: Options,
  ) => {
    const { splitRelativeGroups, relativeSortAlg, splitLocalPattern } = options;
    const groups = [...options.groups];

    const meta = this.resolveMetadata(nodes);

    const algs: Partial<Record<SortGroup, SortAlg>> = {};

    const hasRest = groups.some(([group]) => group === 'rest');

    if (!hasRest) {
      groups.push(['rest', 'persist']);
    }

    let result = groups.reduce(
      (acc, [group, alg]) => {
        acc[group] = [];
        algs[group] = alg;
        return acc;
      },
      {} as Partial<Record<SortGroup, Array<ProcessedNode>>>,
    );

    result = meta.reduce((acc, value) => {
      if (value.isStatic && acc.static) {
        acc.static.push(value);
      } else if (!value.isLocal && !value.isStatic && acc.global) {
        acc.global.push(value);
      } else if (value.relativeDepth === 0 && acc.local) {
        acc.local.push(value);
      } else if (value.relativeDepth > 0 && acc.relative) {
        acc.relative.push(value);
      } else if (value.relativeDepth > 0 && acc.local) {
        acc.local.push(value);
      } else {
        acc.rest!.push(value);
      }

      return acc;
    }, result);

    const flatResult: Array<Array<Node<ImportDeclaration>>> = [];

    groups.forEach(([group, sortAlg]) => {
      if (group === 'relative' && splitRelativeGroups) {
        const relativeGroups = result[group]!.sort((a, b) => {
          if ('shallow-first' === relativeSortAlg) {
            return a.relativeDepth - b.relativeDepth;
          } else {
            return b.relativeDepth - a.relativeDepth;
          }
        })
          .map(group => group.relativeDepth)
          .filter(
            (relativeGroup, index, arrayRelative) =>
              arrayRelative.indexOf(relativeGroup) === index,
          );

        relativeGroups.forEach(groupNumber => {
          const groupData = result[group]!.filter(
            group => group.relativeDepth === groupNumber,
          );

          const sortedData = this.sortGroup(groupData, sortAlg);

          if (sortedData.length) {
            flatResult.push(sortedData);
          }
        });
      } else if (group === 'local' && splitLocalPattern) {
        const pattern = new RegExp(splitLocalPattern);

        const localGroups = result[group]!.reduce(
          (acc, node) => {
            const matches = pattern.exec(node.target.target.source.value);
            const subGroup = matches
              ? matches[matches.length - 1]
              : '__UNMATCHED';

            if (!(subGroup in acc)) {
              acc[subGroup] = [];
            }

            acc[subGroup].push(node);

            return acc;
          },
          {} as Record<string, Array<ProcessedNode>>,
        );

        Object.keys(localGroups).forEach(key => {
          const sortedData = this.sortGroup(localGroups[key], sortAlg);
          flatResult.push(sortedData);
        });
      } else {
        const sortedData = this.sortGroup(result[group]!, sortAlg);

        if (sortedData.length) {
          flatResult.push(sortedData);
        }
      }
    });

    return flatResult;
  };
}
