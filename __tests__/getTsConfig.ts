import * as ts from 'typescript';
import { getTsConfig } from '../src/helpers';
import { mocked } from 'ts-jest/utils';

jest.mock('typescript');

const tsMock = mocked(ts, true);

describe('getTsConfig', () => {
  beforeEach(() => {
    tsMock.sys.readFile.mockReset();
    tsMock.parseConfigFileTextToJson.mockReset();
    tsMock.parseJsonConfigFileContent.mockReset();
  });

  it('Should return null if no tsconfig was present', () => {
    tsMock.sys.readFile.mockReturnValueOnce(undefined);

    const result = getTsConfig('../');

    expect(result).toBe(null);
    expect(ts.sys.readFile).toHaveBeenCalledTimes(1);
  });

  it('Should return null if tsconfig is malformed', () => {
    tsMock.sys.readFile.mockReturnValueOnce('INVALID JSON');

    const result = getTsConfig('../');

    expect(result).toBe(null);
    expect(ts.sys.readFile).toHaveBeenCalledTimes(1);
    expect(tsMock.parseConfigFileTextToJson).toHaveBeenCalledTimes(1);
  });

  it('Should return result if all conditions were met', () => {
    tsMock.sys.readFile.mockReturnValueOnce('{}');
    tsMock.parseConfigFileTextToJson.mockReturnValueOnce({});
    tsMock.parseJsonConfigFileContent.mockReturnValueOnce({
      fileNames: [],
      options: {},
      errors: [],
    });

    const result = getTsConfig('./');

    expect(result).toMatchObject({
      fileNames: [],
      options: {},
      errors: [],
    });
    expect(tsMock.sys.readFile).toHaveBeenCalledTimes(1);
    expect(tsMock.parseConfigFileTextToJson).toHaveBeenCalledTimes(1);
    expect(tsMock.parseJsonConfigFileContent).toHaveBeenCalledTimes(1);
  });
});
