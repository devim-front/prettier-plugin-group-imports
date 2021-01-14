import { ASTWorker, Sorter, PathResolver } from '../src/services';

describe('Sorter', () => {
  it('Should persist initial order', () => {
    const worker = new ASTWorker(
      [
        'import oneLvl from "./test"',
        'import twoLvl from "../test"',
        'import threeLvl from "../../test"',
        'import oneLvl2 from "./test"',
        'import twoLvl2 from "../test"',
        'import threeLvl2 from "../../test"',
      ].join('\n'),
      {
        importCommentMode: 'same-line',
        endOfLine: 'lf',
      },
    );

    const imports = worker.findImportNodes();
    const resolver = new PathResolver('./', {});
    const sorter = new Sorter(resolver);

    const result = sorter.process(imports, {
      splitRelativeGroups: false,
      relativeSortAlg: 'shallow-first',
      groups: [['relative', 'persist']],
    });

    expect(result.length).toBe(1);

    const relativeGroup = result[0];
    expect(relativeGroup.length).toBe(6);

    const strings = relativeGroup.map(node => node.value);

    expect(strings).toMatchObject([
      'import oneLvl from "./test"',
      'import twoLvl from "../test"',
      'import threeLvl from "../../test"',
      'import oneLvl2 from "./test"',
      'import twoLvl2 from "../test"',
      'import threeLvl2 from "../../test"',
    ]);
  });

  it('Should sort naturally', () => {
    const worker = new ASTWorker(
      [
        'import oneLvl from "./test"',
        'import twoLvl from "../test"',
        'import threeLvl from "../../test"',
        'import oneLvl2 from "./test"',
        'import twoLvl2 from "../test"',
        'import threeLvl2 from "../../test"',
      ].join('\n'),
      {
        importCommentMode: 'same-line',
        endOfLine: 'lf',
      },
    );

    const imports = worker.findImportNodes();
    const resolver = new PathResolver('./', {});
    const sorter = new Sorter(resolver);

    const result = sorter.process(imports, {
      splitRelativeGroups: false,
      relativeSortAlg: 'shallow-first',
      groups: [['relative', 'natural']],
    });

    expect(result.length).toBe(1);

    const relativeGroup = result[0];
    expect(relativeGroup.length).toBe(6);

    const strings = relativeGroup.map(node => node.value);

    expect(strings).toMatchObject([
      'import threeLvl from "../../test"',
      'import threeLvl2 from "../../test"',
      'import twoLvl from "../test"',
      'import twoLvl2 from "../test"',
      'import oneLvl from "./test"',
      'import oneLvl2 from "./test"',
    ]);
  });

  it('Should persist when invalig sorting alg has been specified', () => {
    const worker = new ASTWorker(
      [
        'import oneLvl from "./test"',
        'import twoLvl from "../test"',
        'import threeLvl from "../../test"',
        'import oneLvl2 from "./test"',
        'import twoLvl2 from "../test"',
        'import threeLvl2 from "../../test"',
      ].join('\n'),
      {
        importCommentMode: 'same-line',
        endOfLine: 'lf',
      },
    );

    const imports = worker.findImportNodes();
    const resolver = new PathResolver('./', {});
    const sorter = new Sorter(resolver);

    const result = sorter.process(imports, {
      splitRelativeGroups: false,
      relativeSortAlg: 'shallow-first',
      groups: [['relative', 'UNKNOWN' as any]],
    });

    expect(result.length).toBe(1);

    const relativeGroup = result[0];
    expect(relativeGroup.length).toBe(6);

    const strings = relativeGroup.map(node => node.value);

    expect(strings).toMatchObject([
      'import oneLvl from "./test"',
      'import twoLvl from "../test"',
      'import threeLvl from "../../test"',
      'import oneLvl2 from "./test"',
      'import twoLvl2 from "../test"',
      'import threeLvl2 from "../../test"',
    ]);
  });

  it('Should process all groups', () => {
    const worker = new ASTWorker(
      [
        'import global from "global"',
        'import global2 from "global"',
        'import local from "local/first"',
        'import local2 from "local/second"',
        'import relative from "./file1"',
        'import relativeDeep from "../file2"',
        'import static from "./static.scss"',
        'import staticDeep from "../static.scss"',
      ].join('\n'),
      {
        importCommentMode: 'same-line',
        endOfLine: 'lf',
      },
    );

    const imports = worker.findImportNodes();
    const resolver = new PathResolver('./');

    const isLocalMock = jest.fn((fileName: string) =>
      fileName.startsWith('local'),
    );

    resolver.isLocal = isLocalMock;

    const sorter = new Sorter(resolver);

    const result = sorter.process(imports, {
      splitRelativeGroups: false,
      relativeSortAlg: 'shallow-first',
      groups: [
        ['global', 'persist'],
        ['local', 'persist'],
        ['relative', 'persist'],
        ['static', 'persist'],
      ],
    });

    expect(result.length).toBe(4);

    const [globalGroup, localGroup, relativeGroup, staticGroup] = result;

    expect(globalGroup.length).toBe(2);
    expect(localGroup.length).toBe(2);
    expect(relativeGroup.length).toBe(2);
    expect(staticGroup.length).toBe(2);

    expect(globalGroup.map(node => node.value)).toMatchObject([
      'import global from "global"',
      'import global2 from "global"',
    ]);

    expect(localGroup.map(node => node.value)).toMatchObject([
      'import local from "local/first"',
      'import local2 from "local/second"',
    ]);

    expect(relativeGroup.map(node => node.value)).toMatchObject([
      'import relative from "./file1"',
      'import relativeDeep from "../file2"',
    ]);

    expect(staticGroup.map(node => node.value)).toMatchObject([
      'import static from "./static.scss"',
      'import staticDeep from "../static.scss"',
    ]);
  });

  it('Should treat relative as local if no relative group is present', () => {
    const worker = new ASTWorker(
      [
        'import global from "global"',
        'import global2 from "global"',
        'import local from "local/first"',
        'import local2 from "local/second"',
        'import relative from "./file1"',
        'import relativeDeep from "../file2"',
        'import static from "./static.scss"',
        'import staticDeep from "../static.scss"',
      ].join('\n'),
      {
        importCommentMode: 'same-line',
        endOfLine: 'lf',
      },
    );

    const imports = worker.findImportNodes();
    const resolver = new PathResolver('./');

    const isLocalMock = jest.fn((fileName: string) =>
      fileName.startsWith('local'),
    );

    resolver.isLocal = isLocalMock;

    const sorter = new Sorter(resolver);

    const result = sorter.process(imports, {
      splitRelativeGroups: false,
      relativeSortAlg: 'shallow-first',
      groups: [
        ['global', 'persist'],
        ['local', 'persist'],
        ['static', 'persist'],
      ],
    });

    expect(result.length).toBe(3);

    const [globalGroup, localGroup, staticGroup] = result;

    expect(globalGroup.length).toBe(2);
    expect(localGroup.length).toBe(4);
    expect(staticGroup.length).toBe(2);

    expect(globalGroup.map(node => node.value)).toMatchObject([
      'import global from "global"',
      'import global2 from "global"',
    ]);

    expect(localGroup.map(node => node.value)).toMatchObject([
      'import local from "local/first"',
      'import local2 from "local/second"',
      'import relative from "./file1"',
      'import relativeDeep from "../file2"',
    ]);

    expect(staticGroup.map(node => node.value)).toMatchObject([
      'import static from "./static.scss"',
      'import staticDeep from "../static.scss"',
    ]);
  });

  it("Should put all imports to rest group if they don't match any existing group", () => {
    const worker = new ASTWorker(
      [
        'import global from "global"',
        'import global2 from "global"',
        'import local from "local/first"',
        'import local2 from "local/second"',
        'import relative from "./file1"',
        'import relativeDeep from "../file2"',
        'import static from "./static.scss"',
        'import staticDeep from "../static.scss"',
      ].join('\n'),
      {
        importCommentMode: 'same-line',
        endOfLine: 'lf',
      },
    );

    const imports = worker.findImportNodes();
    const resolver = new PathResolver('./');

    const isLocalMock = jest.fn((fileName: string) =>
      fileName.startsWith('local'),
    );

    resolver.isLocal = isLocalMock;

    const sorter = new Sorter(resolver);

    const result = sorter.process(imports, {
      splitRelativeGroups: false,
      relativeSortAlg: 'shallow-first',
      groups: [['rest', 'persist'], ['static', 'persist']],
    });

    expect(result.length).toBe(2);

    const [restGroup, staticGroup] = result;

    expect(restGroup.length).toBe(6);
    expect(staticGroup.length).toBe(2);

    expect(restGroup.map(node => node.value)).toMatchObject([
      'import global from "global"',
      'import global2 from "global"',
      'import local from "local/first"',
      'import local2 from "local/second"',
      'import relative from "./file1"',
      'import relativeDeep from "../file2"',
    ]);

    expect(staticGroup.map(node => node.value)).toMatchObject([
      'import static from "./static.scss"',
      'import staticDeep from "../static.scss"',
    ]);
  });

  it('Should split relative groups shallow-first', () => {
    const worker = new ASTWorker(
      [
        'import global from "global"',
        'import global2 from "global"',
        'import local from "local/first"',
        'import local2 from "local/second"',
        'import relative from "./file1"',
        'import relative2 from "./file2"',
        'import relativeDeep from "../file2"',
        'import relativeDeep3 from "../../file2"',
        'import relativeDeep4 from "../../file2"',
        'import static from "./static.scss"',
        'import staticDeep from "../static.scss"',
      ].join('\n'),
      {
        importCommentMode: 'same-line',
        endOfLine: 'lf',
      },
    );

    const imports = worker.findImportNodes();
    const resolver = new PathResolver('./');

    const isLocalMock = jest.fn((fileName: string) =>
      fileName.startsWith('local'),
    );

    resolver.isLocal = isLocalMock;

    const sorter = new Sorter(resolver);

    const result = sorter.process(imports, {
      splitRelativeGroups: true,
      relativeSortAlg: 'shallow-first',
      groups: [
        ['global', 'persist'],
        ['local', 'persist'],
        ['relative', 'persist'],
        ['static', 'persist'],
      ],
    });

    expect(result.length).toBe(6);

    const [
      globalGroup,
      localGroup,
      relativeGroup1,
      relativeGroup2,
      relativeGroup3,
      staticGroup,
    ] = result;

    expect(globalGroup.length).toBe(2);
    expect(localGroup.length).toBe(2);
    expect(relativeGroup1.length).toBe(2);
    expect(relativeGroup2.length).toBe(1);
    expect(relativeGroup3.length).toBe(2);
    expect(staticGroup.length).toBe(2);

    expect(globalGroup.map(node => node.value)).toMatchObject([
      'import global from "global"',
      'import global2 from "global"',
    ]);

    expect(localGroup.map(node => node.value)).toMatchObject([
      'import local from "local/first"',
      'import local2 from "local/second"',
    ]);

    expect(relativeGroup1.map(node => node.value)).toMatchObject([
      'import relative from "./file1"',
      'import relative2 from "./file2"',
    ]);

    expect(relativeGroup2.map(node => node.value)).toMatchObject([
      'import relativeDeep from "../file2"',
    ]);

    expect(relativeGroup3.map(node => node.value)).toMatchObject([
      'import relativeDeep3 from "../../file2"',
      'import relativeDeep4 from "../../file2"',
    ]);

    expect(staticGroup.map(node => node.value)).toMatchObject([
      'import static from "./static.scss"',
      'import staticDeep from "../static.scss"',
    ]);
  });

  it('Should split relative groups deepest-first', () => {
    const worker = new ASTWorker(
      [
        'import global from "global"',
        'import global2 from "global"',
        'import local from "local/first"',
        'import local2 from "local/second"',
        'import relative from "./file1"',
        'import relative2 from "./file2"',
        'import relativeDeep from "../file2"',
        'import relativeDeep3 from "../../file2"',
        'import relativeDeep4 from "../../file2"',
        'import static from "./static.scss"',
        'import staticDeep from "../static.scss"',
      ].join('\n'),
      {
        importCommentMode: 'same-line',
        endOfLine: 'lf',
      },
    );

    const imports = worker.findImportNodes();
    const resolver = new PathResolver('./');

    const isLocalMock = jest.fn((fileName: string) =>
      fileName.startsWith('local'),
    );

    resolver.isLocal = isLocalMock;

    const sorter = new Sorter(resolver);

    const result = sorter.process(imports, {
      splitRelativeGroups: true,
      relativeSortAlg: 'deepest-first',
      groups: [
        ['global', 'persist'],
        ['local', 'persist'],
        ['relative', 'persist'],
        ['static', 'persist'],
      ],
    });

    expect(result.length).toBe(6);

    const [
      globalGroup,
      localGroup,
      relativeGroup1,
      relativeGroup2,
      relativeGroup3,
      staticGroup,
    ] = result;

    expect(globalGroup.length).toBe(2);
    expect(localGroup.length).toBe(2);
    expect(relativeGroup1.length).toBe(2);
    expect(relativeGroup2.length).toBe(1);
    expect(relativeGroup3.length).toBe(2);
    expect(staticGroup.length).toBe(2);

    expect(globalGroup.map(node => node.value)).toMatchObject([
      'import global from "global"',
      'import global2 from "global"',
    ]);

    expect(localGroup.map(node => node.value)).toMatchObject([
      'import local from "local/first"',
      'import local2 from "local/second"',
    ]);

    expect(relativeGroup1.map(node => node.value)).toMatchObject([
      'import relativeDeep3 from "../../file2"',
      'import relativeDeep4 from "../../file2"',
    ]);

    expect(relativeGroup2.map(node => node.value)).toMatchObject([
      'import relativeDeep from "../file2"',
    ]);

    expect(relativeGroup3.map(node => node.value)).toMatchObject([
      'import relative from "./file1"',
      'import relative2 from "./file2"',
    ]);

    expect(staticGroup.map(node => node.value)).toMatchObject([
      'import static from "./static.scss"',
      'import staticDeep from "../static.scss"',
    ]);
  });
});
