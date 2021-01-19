import * as ts from 'typescript';
import { getConfigFilePath } from '../src/helpers';
import { mocked } from 'ts-jest/utils';

jest.mock('typescript');

const tsMock = mocked(ts, true);

describe('getTsConfig', () => {
  beforeEach(() => {
    tsMock.findConfigFile.mockReset();
  });

  it('Should return null if no tsconfig was present', () => {
    tsMock.findConfigFile.mockReturnValueOnce(undefined);

    const result = getConfigFilePath('tsconfig.json', './');

    expect(result).toBe(null);
    expect(ts.findConfigFile).toHaveBeenCalledTimes(1);
  });

  it('Should return correct path if tsconfig was found', () => {
    tsMock.findConfigFile.mockReturnValueOnce('./tsconfig.json');

    const result = getConfigFilePath('tsconfig.json', './');

    expect(result).toBe('./tsconfig.json');
    expect(ts.findConfigFile).toHaveBeenCalledTimes(1);
  });
});
