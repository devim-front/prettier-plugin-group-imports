import * as ts from 'typescript';
import { ASTWorker } from '../src/services';
import { mocked } from 'ts-jest/utils';

jest.mock('typescript');

const tsMock = mocked(ts, true);

const exampleCode = [
  '// eslint:disable',
  '// prettier:disable',
  'alert(100)',
  '// Test start boundary',
  'import * as all from "ast"',
  '/* Leading comment */ import "index"//comment',
  'alert(200)',
  'import React from "react"',
  'import All from "components"',
  'alert(300)',
  'import All8 from "helpers"',
  'import * as prettier from "prettier"',
  'alert(400)',
  'import All4 from "../components/test"',
  'import All3 from "../../components/test"',
  '// Test end boundary',
  'class Props { test = () => {} }',
].join('\n');

describe('PathResolver', () => {
  beforeEach(() => {
    tsMock.findConfigFile.mockReset();
    tsMock.sys.fileExists.mockReset();
  });

  it('Should handle all line endings', () => {
    let worker = new ASTWorker('import React from "react"', {
      importCommentMode: 'same-line',
      endOfLine: 'cr',
    });
    let imports = worker.findImportNodes();
    worker.removeNodes(...imports);
    worker.insertImports([imports], 'leading');
    expect(worker.compile()).toBe('import React from "react"\r\r');

    worker = new ASTWorker('import React from "react"', {
      importCommentMode: 'same-line',
      endOfLine: 'lf',
    });
    imports = worker.findImportNodes();
    worker.removeNodes(...imports);
    worker.insertImports([imports], 'leading');
    expect(worker.compile()).toBe('import React from "react"\n\n');

    worker = new ASTWorker('import React from "react"', {
      importCommentMode: 'same-line',
      endOfLine: 'crlf',
    });
    imports = worker.findImportNodes();
    worker.removeNodes(...imports);
    worker.insertImports([imports], 'leading');
    expect(worker.compile()).toBe('import React from "react"\r\n\r\n');
  });

  it('Should find imports in the source code', () => {
    const worker = new ASTWorker('import React from "react"', {
      importCommentMode: 'same-line',
      endOfLine: 'auto',
    });

    const nodes = worker.findImportNodes();
    const [node] = nodes;

    expect(nodes.length).toBe(1);

    expect(node.innerBounds).toMatchObject({
      start: 0,
      end: 25,
    });

    expect(node.value).toBe('import React from "react"');
  });

  it('Should omit comments', () => {
    const worker = new ASTWorker(
      [
        '// Leading comment',
        '/* Same-line leading */ import React from "react" // Same-line trailing',
        '// Trailing comment',
      ].join('\n'),
      {
        importCommentMode: 'none',
        endOfLine: 'auto',
      },
    );

    const nodes = worker.findImportNodes();
    const [node] = nodes;

    expect(nodes.length).toBe(1);

    expect(node.innerBounds).toMatchObject({
      start: 43,
      end: 68,
    });

    expect(node.value).toBe('import React from "react"');
  });

  it('Should capture same-line comments', () => {
    const worker = new ASTWorker(
      [
        '// Leading comment',
        '/* Same-line leading */ import React from "react" // Same-line trailing',
        '// Trailing comment',
      ].join('\n'),
      {
        importCommentMode: 'same-line',
        endOfLine: 'auto',
      },
    );

    const nodes = worker.findImportNodes();
    const [node] = nodes;

    expect(nodes.length).toBe(1);

    expect(node.innerBounds).toMatchObject({
      start: 19,
      end: 90,
    });

    expect(node.value).toBe(
      '/* Same-line leading */ import React from "react" // Same-line trailing',
    );
  });

  it('Should capture prev-line comments', () => {
    const worker = new ASTWorker(
      [
        '// Leading comment',
        '/* Same-line leading */ import React from "react" // Same-line trailing',
        '// Trailing comment',
      ].join('\n'),
      {
        importCommentMode: 'prev-line',
        endOfLine: 'auto',
      },
    );

    const nodes = worker.findImportNodes();
    const [node] = nodes;

    expect(nodes.length).toBe(1);

    expect(node.innerBounds).toMatchObject({
      start: 0,
      end: 90,
    });

    expect(node.value).toBe(
      '// Leading comment\n/* Same-line leading */ import React from "react" // Same-line trailing',
    );
  });

  it('Should capture prev-line comments no further than 1 line', () => {
    const worker = new ASTWorker(
      [
        '// Leading comment',
        '',
        '/* Same-line leading */ import React from "react" // Same-line trailing',
        '// Trailing comment',
      ].join('\n'),
      {
        importCommentMode: 'prev-line',
        endOfLine: 'auto',
      },
    );

    const nodes = worker.findImportNodes();
    const [node] = nodes;

    expect(nodes.length).toBe(1);

    expect(node.innerBounds).toMatchObject({
      start: 20,
      end: 91,
    });

    expect(node.value).toBe(
      '/* Same-line leading */ import React from "react" // Same-line trailing',
    );
  });

  it('Should resolve concurrent comment conflicts', () => {
    const worker = new ASTWorker(
      [
        '// Leading comment',
        '/* Same-line leading */ import React from "react" // Same-line trailing',
        'import * as prettier from "prettier"',
        '// Trailing comment',
      ].join('\n'),
      {
        importCommentMode: 'prev-line',
        endOfLine: 'auto',
      },
    );

    const nodes = worker.findImportNodes();
    const [first, second] = nodes;

    expect(nodes.length).toBe(2);

    expect(first.innerBounds).toMatchObject({
      start: 0,
      end: 90,
    });

    expect(first.value).toBe(
      '// Leading comment\n/* Same-line leading */ import React from "react" // Same-line trailing',
    );

    expect(second.innerBounds).toMatchObject({
      start: 91,
      end: 127,
    });

    expect(second.value).toBe('import * as prettier from "prettier"');
  });

  it('Should remove nodes', () => {
    const worker = new ASTWorker(exampleCode, {
      importCommentMode: 'none',
      endOfLine: 'auto',
    });

    const nodes = worker.findImportNodes();
    worker.removeNodes(...nodes);

    expect(worker.compile()).toBe(
      [
        '// eslint:disable',
        '// prettier:disable',
        'alert(100)',
        '// Test start boundary',
        '/* Leading comment */ //comment',
        'alert(200)',
        'alert(300)',
        'alert(400)',
        '// Test end boundary',
        'class Props { test = () => {} }',
      ].join('\n'),
    );
  });

  it('Should not remove nodes if none provided', () => {
    const worker = new ASTWorker(exampleCode, {
      importCommentMode: 'none',
      endOfLine: 'auto',
    });

    worker.removeNodes();

    expect(worker.compile()).toBe(exampleCode);
  });

  it('Should insert nodes to start of the source code', () => {
    const worker = new ASTWorker(
      [
        '// Leading comment',
        'import React from "react"',
        '// Trailing comment',
      ].join('\n'),
      {
        importCommentMode: 'none',
        endOfLine: 'auto',
      },
    );

    const nodes = worker.findImportNodes();
    worker.removeNodes(...nodes);
    worker.insertImports([nodes], 'leading');

    expect(worker.compile()).toBe(
      [
        'import React from "react"',
        '',
        '// Leading comment',
        '// Trailing comment',
      ].join('\n'),
    );
  });

  it('Should insert nodes to previous location using auto', () => {
    const worker = new ASTWorker(
      [
        '// Leading comment',
        'import React from "react"',
        '// Trailing comment',
        'import * as prettier from "prettier"',
        '// End comment',
      ].join('\n'),
      {
        importCommentMode: 'none',
        endOfLine: 'auto',
      },
    );

    const nodes = worker.findImportNodes();
    worker.removeNodes(...nodes);
    worker.insertImports([nodes], 'auto');

    expect(worker.compile()).toBe(
      [
        '// Leading comment',
        'import React from "react"',
        'import * as prettier from "prettier"',
        '',
        '// Trailing comment',
        '// End comment',
      ].join('\n'),
    );
  });

  it('Should insert nodes to previous location using auto in groups', () => {
    const worker = new ASTWorker(
      [
        '// Leading comment',
        'import React from "react"',
        '// Trailing comment',
        'import * as prettier from "prettier"',
        '// End comment',
      ].join('\n'),
      {
        importCommentMode: 'none',
        endOfLine: 'auto',
      },
    );

    const [first, second] = worker.findImportNodes();
    worker.removeNodes(first, second);
    worker.insertImports([[first], [second]], 'auto');

    expect(worker.compile()).toBe(
      [
        '// Leading comment',
        'import React from "react"',
        '',
        'import * as prettier from "prettier"',
        '',
        '// Trailing comment',
        '// End comment',
      ].join('\n'),
    );
  });
});
