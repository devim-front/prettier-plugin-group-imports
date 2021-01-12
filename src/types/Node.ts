import { Statement } from '@babel/types';

/**
 * Represents a node returned from AST
 */
export interface Node<T extends Statement = Statement> {
  /**
   * Native node interface from Babel types
   */
  target: T;

  /**
   * Plaintext representation of a node
   */
  value: string;

  /**
   * Node location in the source code
   */
  innerBounds: {
    /**
     * Start index of a node representation in the source code
     */
    start: number;

    /**
     * End index of a node representation in the source code
     */
    end: number;
  };

  /**
   * Node location including whitespaces
   */
  outerBounds: {
    /**
     * Start index of a node representation in the source code including whitespaces
     */
    start: number;

    /**
     * End index of a node representation in the source code including whitespaces
     */
    end: number;
  };
}
