import ts from 'typescript';

/**
 * Resolves and merges package.json dependencies
 * @param path Path to the package.json file
 */
export function getDependencies(path: string): Array<string> | null {
  try {
    const data = ts.sys.readFile(path, 'utf-8');
    const json = JSON.parse(data!);
    const result = [];

    if (json.dependencies) {
      result.push(...Object.keys(json.dependencies));
    }

    if (json.devDependencies) {
      result.push(...Object.keys(json.devDependencies));
    }

    if (json.peerDependencies) {
      result.push(...Object.keys(json.peerDependencies));
    }

    return result;
  } catch {
    return null;
  }
}
