'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

class TimeoutError extends DOMException {
    constructor(message = 'The operation was timed out') {
        super(message);
    }
}

exports.TimeoutError = TimeoutError;
