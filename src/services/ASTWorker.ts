import { loadPartialConfig } from '@babel/core';
import { parse, ParserOptions } from '@babel/parser';
import { Statement, ImportDeclaration } from '@babel/types';
import traverse, { NodePath } from '@babel/traverse';
import { Node } from '../types';

interface Options extends ParserOptions {
  importCommentMode: 'prev-line' | 'same-line' | 'none';
  endOfLine: 'auto' | 'lf' | 'crlf' | 'cr';
}

/**
 * Provides helper methods for working with abstract syntax tree
 */
export class ASTWorker {
  /**
   * Initial source code before any changes were made
   */
  private readonly initialSource: string;

  /**
   * Source code
   */
  private source: string;

  /**
   * Parsing options
   */
  private options: Options;

  private get endOfLine() {
    const { endOfLine } = this.options;

    switch (endOfLine) {
      case 'lf':
        return '\n';
      case 'cr':
        return '\r';
      case 'crlf':
        return '\r\n';
      default:
        return '\n';
    }
  }

  /**
   * Constructs an ASTWorker instance
   * @param source Source code
   * @param options Babel parser options
   */
  public constructor(source: string, options: Options) {
    this.initialSource = source;
    this.source = source;
    this.options = options;
  }

  /**
   * Searches for import nodes in AST
   */
  public findImportNodes = (): Array<Node<ImportDeclaration>> => {
    const { importCommentMode } = this.options;
    const result: Array<Node<ImportDeclaration>> = [];

    const parsedFile = parse(this.source, {
      sourceType: 'module',
      ...loadPartialConfig(),
      ...this.options,
      plugins: [
        'typescript',
        'jsx',
        'estree',
        'asyncGenerators',
        'classProperties',
        'decorators-legacy',
        'doExpressions',
        'functionBind',
        'functionSent',
        'objectRestSpread',
        'dynamicImport',
        'numericSeparator',
        'optionalChaining',
        'importMeta',
        'classPrivateProperties',
        'bigInt',
        'optionalCatchBinding',
      ],
    });

    const visitedComments: Record<string, boolean> = {};

    traverse(parsedFile, {
      ImportDeclaration: ({ node }: NodePath<ImportDeclaration>) => {
        let { start, end } = node;

        if (
          'number' !== typeof start ||
          'number' !== typeof end ||
          null === node.loc
        ) {
          return;
        }

        if (
          'none' !== importCommentMode &&
          Array.isArray(node.leadingComments)
        ) {
          start = node.leadingComments.reduce((value, comment) => {
            const key = `${comment.start}_${comment.end}`;

            if (visitedComments[key]) {
              return value;
            }

            if (
              importCommentMode === 'same-line' &&
              comment.loc.end.line !== node.loc!.start.line
            ) {
              return value;
            }

            if (
              importCommentMode === 'prev-line' &&
              comment.loc.end.line < node.loc!.start.line - 1
            ) {
              return value;
            }

            if (comment.start >= value) {
              return value;
            }

            visitedComments[key] = true;

            return comment.start;
          }, start);
        }

        if (
          'none' !== importCommentMode &&
          Array.isArray(node.trailingComments)
        ) {
          end = node.trailingComments.reduce((value, comment) => {
            const key = `${comment.start}_${comment.end}`;

            if (comment.loc.start.line !== node.loc!.end.line) {
              return value;
            }

            visitedComments[key] = true;

            return comment.end;
          }, end);
        }

        const value = this.initialSource.slice(start, end);

        result.push({
          target: node,
          bounds: {
            start,
            end,
          },
          value,
        });
      },
    });

    return result;
  };

  /**
   * Removes provided nodes from the source code
   * @param nodes Nodes to be removed
   */
  public removeNodes = (...nodes: Array<Node<Statement>>) => {
    if (nodes.length === 0) {
      return;
    }

    const sortedNodes = nodes
      .sort((a, b) => b.bounds.start - a.bounds.start)
      .slice();
    let newSource = this.endOfLine;
    let lastIndex = 0;

    while (sortedNodes.length) {
      const node = sortedNodes.pop()!;

      newSource += this.source.slice(lastIndex, node.bounds.start);
      lastIndex = node.bounds.end;
    }

    newSource += this.source.slice(lastIndex);

    this.source = newSource;
  };

  /**
   * Inserts provided nodes to the specified location
   * @param nodes Nodes to be added
   * @returns End index of insertion procedure
   */
  public insertNodes = (
    nodes: Array<Node<Statement>>,
    insertIndex: number,
  ): number => {
    const importsSource = nodes.reduce((value, node) => {
      return value + node.value + this.endOfLine;
    }, '');

    const newSource =
      this.source.slice(0, insertIndex) + this.endOfLine + importsSource;

    this.source = newSource + this.source.slice(insertIndex);

    return newSource.length;
  };

  /**
   * Inserts provided nodes to the specified location
   * @param nodes Nodes to be added
   */
  public insertImports = (
    nodes: Array<Array<Node<ImportDeclaration>>>,
    location: 'leading' | 'auto',
  ) => {
    let insertIndex: number = 0;

    if ('leading' === location) {
      insertIndex = 0;
    }

    if ('auto' === location) {
      insertIndex = nodes.reduce((allIndex, group) => {
        const groupIndex = group.reduce((value, node) => {
          if (value < node.bounds.start) {
            return value;
          }

          return node.bounds.start;
        }, Infinity);

        if (allIndex < groupIndex) {
          return allIndex;
        }

        return groupIndex;
      }, Infinity);
    }

    nodes.forEach(group => {
      insertIndex = this.insertNodes(group, insertIndex);
    });
  };

  /**
   * Returns resulting source code
   */
  public compile = () => {
    return this.source;
  };
}
