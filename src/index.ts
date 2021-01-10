import { ParserOptions } from 'prettier';
import { parsers as typescriptParsers } from 'prettier/parser-typescript';
import { sort, Options } from './sort';

const preprocess = (text: string, options: Options & ParserOptions) => {
  const processed = sort(text, options);

  return typescriptParsers.typescript.preprocess
    ? typescriptParsers.typescript.preprocess(processed, options)
    : processed;
};

export const parsers = {
  typescript: {
    ...typescriptParsers.typescript,
    preprocess,
  },
  babel: {
    ...typescriptParsers.typescript,
    preprocess,
  },
  babylon: {
    ...typescriptParsers.typescript,
    preprocess,
  },
};
