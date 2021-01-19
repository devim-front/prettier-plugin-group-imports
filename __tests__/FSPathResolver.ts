import * as ts from 'typescript';
import * as path from 'path';
import { FSPathResolver } from '../src/services';
import { mocked } from 'ts-jest/utils';

jest.mock('typescript');

const tsMock = mocked(ts, true);

describe('PathResolver', () => {
  beforeEach(() => {
    tsMock.findConfigFile.mockReset();
    tsMock.sys.fileExists.mockReset();
  });

  it('Should return file extensions if present', () => {
    const resolver = new FSPathResolver('./', {});

    expect(resolver.getExtension('index.ts')).toBe('ts');
    expect(resolver.getExtension('src/code/index.ts')).toBe('ts');
    expect(resolver.getExtension('../../index.tsx')).toBe('tsx');
    expect(resolver.getExtension('../../index.test.ts')).toBe('ts');
    expect(resolver.getExtension('./')).toBe('');
    expect(resolver.getExtension('.')).toBe('');
    expect(resolver.getExtension('src/code/index')).toBe('');
    expect(resolver.getExtension('../../')).toBe('');
  });

  it('Should check if file exists', () => {
    const resolver = new FSPathResolver('./', {
      baseUrl: './base',
    });

    tsMock.sys.fileExists.mockReturnValueOnce(false);
    expect(resolver.isLocal('not_exists')).toBe(false);
    expect(tsMock.sys.fileExists).toBeCalledWith(
      path.join('./base/not_exists'),
    );

    tsMock.sys.fileExists.mockReturnValueOnce(true);
    expect(resolver.isLocal('exists')).toBe(true);
    expect(tsMock.sys.fileExists).toBeCalledWith(path.join('./base/exists'));
  });

  it('Should check for all file extensions if provided', () => {
    const resolver = new FSPathResolver('./', {
      baseUrl: './base',
      extensions: ['foo', 'bar'],
    });

    tsMock.sys.fileExists.mockReturnValue(false);
    expect(resolver.isLocal('foo_test')).toBe(false);

    expect(tsMock.sys.fileExists).toHaveBeenCalledWith(
      path.join('./base/foo_test'),
    );
    expect(tsMock.sys.fileExists).toHaveBeenCalledWith(
      path.join('./base/foo_test/index.foo'),
    );
    expect(tsMock.sys.fileExists).toHaveBeenCalledWith(
      path.join('./base/foo_test.foo'),
    );
    expect(tsMock.sys.fileExists).toHaveBeenCalledWith(
      path.join('./base/foo_test/index.bar'),
    );
    expect(tsMock.sys.fileExists).toHaveBeenCalledWith(
      path.join('./base/foo_test.bar'),
    );

    expect(tsMock.sys.fileExists).toBeCalledTimes(5);
  });

  it('Should preserve order of checking extensions', () => {
    const resolver = new FSPathResolver('./', {
      baseUrl: './base',
      extensions: ['foo', 'bar'],
    });

    tsMock.sys.fileExists.mockReturnValueOnce(false).mockReturnValueOnce(true);

    expect(resolver.isLocal('foo_test')).toBe(true);

    expect(tsMock.sys.fileExists).toHaveBeenNthCalledWith(
      1,
      path.join('./base/foo_test'),
    );
    expect(tsMock.sys.fileExists).toHaveBeenNthCalledWith(
      2,
      path.join('./base/foo_test/index.foo'),
    );
    expect(tsMock.sys.fileExists).toBeCalledTimes(2);

    tsMock.sys.fileExists.mockReset();

    tsMock.sys.fileExists
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    expect(resolver.isLocal('foo_test')).toBe(true);

    expect(tsMock.sys.fileExists).toHaveBeenNthCalledWith(
      1,
      path.join('./base/foo_test'),
    );
    expect(tsMock.sys.fileExists).toHaveBeenNthCalledWith(
      2,
      path.join('./base/foo_test/index.foo'),
    );
    expect(tsMock.sys.fileExists).toHaveBeenNthCalledWith(
      3,
      path.join('./base/foo_test.foo'),
    );
    expect(tsMock.sys.fileExists).toBeCalledTimes(3);
  });

  it('Should work with default options', () => {
    const resolver = new FSPathResolver('./');

    expect(resolver.isAliased('src/file')).toBe(false);
    expect(resolver.isLocal('src/file')).toBe(false);
    expect(resolver.isLocal('./src/file')).toBe(true);
    expect(resolver.isLocal('../src/file')).toBe(true);
    expect(resolver.isLocal('..')).toBe(true);
    expect(resolver.isLocal('.')).toBe(true);
  });

  it('Should work with baseUrl', () => {
    const resolver = new FSPathResolver('./', {
      baseUrl: 'src',
    });

    tsMock.sys.fileExists.mockReturnValue(true);

    expect(resolver.isAliased('file')).toBe(false);
    expect(tsMock.sys.fileExists).not.toBeCalled();

    expect(resolver.isLocal('test')).toBe(true);
    expect(tsMock.sys.fileExists).toBeCalledWith(path.join('src/test'));
  });

  it('Should work with path aliases', () => {
    const resolver = new FSPathResolver('./', {
      aliases: {
        components: ['./folder1/components', './folder2/components'],
      },
    });

    tsMock.sys.fileExists.mockReturnValue(true);

    expect(resolver.isAliased('file')).toBe(false);
    expect(tsMock.sys.fileExists).not.toBeCalled();

    expect(resolver.isLocal('components/file1')).toBe(true);
    expect(tsMock.sys.fileExists).toBeCalledWith(
      path.join('./folder1/components/file1'),
    );

    expect(resolver.isAliased('components/file1')).toBe(true);
    expect(tsMock.sys.fileExists).toBeCalledWith(
      path.join('./folder1/components/file1'),
    );
  });
});
