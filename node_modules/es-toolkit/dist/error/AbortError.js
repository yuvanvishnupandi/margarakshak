'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

class AbortError extends DOMException {
    constructor(message = 'The operation was aborted') {
        super(message);
    }
}

exports.AbortError = AbortError;
