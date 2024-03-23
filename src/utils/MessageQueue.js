class MessageQueue {
    constructor(interval) {
        this.queue = [];
        this.interval = interval;
        this.timer = null;
    }

    start() {
        if (this.timer) return;
        this.timer = setInterval(() => this.processQueue(), this.interval);
    }

    stop() {
        if (!this.timer) return;
        clearInterval(this.timer);
        this.timer = null;
    }

    enqueue(message) {
        this.queue.push(message);
    }

    processQueue() {
        if (this.queue.length === 0) return;
        const message = this.queue.shift();
        console.log(message)
        //TODO: Send the message to Discord. Also, implement this
    }
}

module.exports = MessageQueue;
