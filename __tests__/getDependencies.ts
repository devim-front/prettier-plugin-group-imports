import * as ts from 'typescript';
import { getDependencies } from '../src/helpers';
import { mocked } from 'ts-jest/utils';

jest.mock('typescript');

const tsMock = mocked(ts, true);

describe('getDependencies', () => {
  beforeEach(() => {
    tsMock.sys.readFile.mockReset();
  });

  it('Should return null if package.json is malformed', () => {
    tsMock.sys.readFile.mockReturnValueOnce('INVALID JSON');

    const result = getDependencies('../');

    expect(result).toBe(null);
    expect(ts.sys.readFile).toHaveBeenCalledTimes(1);
  });

  it('Should return result if all conditions were met', () => {
    tsMock.sys.readFile.mockReturnValueOnce('{}');

    const result = getDependencies('./');

    expect(result).toMatchObject([]);
    expect(tsMock.sys.readFile).toHaveBeenCalledTimes(1);
  });

  it('Should return dependencies', () => {
    tsMock.sys.readFile.mockReturnValueOnce('{"dependencies":{"pkg":"1.0.0"}}');

    const result = getDependencies('./');

    expect(result).toMatchObject(['pkg']);
    expect(tsMock.sys.readFile).toHaveBeenCalledTimes(1);
  });

  it('Should return devDependencies', () => {
    tsMock.sys.readFile.mockReturnValueOnce(
      '{"devDependencies":{"pkg":"1.0.0"}}',
    );

    const result = getDependencies('./');

    expect(result).toMatchObject(['pkg']);
    expect(tsMock.sys.readFile).toHaveBeenCalledTimes(1);
  });

  it('Should return peerDependencies', () => {
    tsMock.sys.readFile.mockReturnValueOnce(
      '{"peerDependencies":{"pkg":"1.0.0"}}',
    );

    const result = getDependencies('./');

    expect(result).toMatchObject(['pkg']);
    expect(tsMock.sys.readFile).toHaveBeenCalledTimes(1);
  });

  it('Should return all at once', () => {
    tsMock.sys.readFile.mockReturnValueOnce(
      '{"dependencies":{"dep":"1"},"devDependencies":{"dev":"2"},"peerDependencies":{"peer":"3"}}',
    );

    const result = getDependencies('./');

    expect(result).toMatchObject(['dep', 'dev', 'peer']);
    expect(tsMock.sys.readFile).toHaveBeenCalledTimes(1);
  });
});
