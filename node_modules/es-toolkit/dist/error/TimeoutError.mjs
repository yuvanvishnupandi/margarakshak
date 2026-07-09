class TimeoutError extends DOMException {
    constructor(message = 'The operation was timed out') {
        super(message);
    }
}

export { TimeoutError };
