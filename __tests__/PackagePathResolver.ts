import { PackagePathResolver } from '../src/services';

describe('PathResolver', () => {
  it('Should return file extensions if present', () => {
    const resolver = new PackagePathResolver({});

    expect(resolver.getExtension('index.ts')).toBe('ts');
    expect(resolver.getExtension('src/code/index.ts')).toBe('ts');
    expect(resolver.getExtension('../../index.tsx')).toBe('tsx');
    expect(resolver.getExtension('../../index.test.ts')).toBe('ts');
    expect(resolver.getExtension('./')).toBe('');
    expect(resolver.getExtension('.')).toBe('');
    expect(resolver.getExtension('src/code/index')).toBe('');
    expect(resolver.getExtension('../../')).toBe('');
  });

  it('Should work with default options', () => {
    const resolver = new PackagePathResolver();

    expect(resolver.isLocal('src/file')).toBe(true);
    expect(resolver.isLocal('./src/file')).toBe(true);
    expect(resolver.isLocal('../src/file')).toBe(true);
    expect(resolver.isLocal('..')).toBe(true);
    expect(resolver.isLocal('.')).toBe(true);
  });

  it('Should work with dependencies', () => {
    const resolver = new PackagePathResolver({
      dependencies: ['global', 'global/deep'],
    });

    expect(resolver.isLocal('file')).toBe(true);
    expect(resolver.isLocal('globals')).toBe(true);
    expect(resolver.isLocal('components/file1')).toBe(true);
    expect(resolver.isLocal('components/file1')).toBe(true);

    expect(resolver.isLocal('global')).toBe(false);
    expect(resolver.isLocal('global/file1')).toBe(false);
    expect(resolver.isLocal('global/deep')).toBe(false);
    expect(resolver.isLocal('global/deep/')).toBe(false);
    expect(resolver.isLocal('global/deep/file1')).toBe(false);
  });
});
