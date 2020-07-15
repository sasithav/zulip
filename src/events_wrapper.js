const queues = require('./resources/queues');
const events = require('./resources/events');

function sleep(ms) {
  // TODO add jitter.
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function eventsWrapper(config) {
  const z = {
    queues: queues(config),
    events: events(config),
  };

  function logError(error) {
    console.log('zulip-js: Error while communicating with server:', error); // eslint-disable-line no-console
  }

  async function registerQueue(eventTypes = null) {
    let res;
    while (true) { // eslint-disable-line no-constant-condition
      try {
        const params = { eventTypes };
        res = await z.queues.register(params); // eslint-disable-line no-await-in-loop
        if (res.result === 'error') {
          logError(res.msg);
          await sleep(1000); // eslint-disable-line no-await-in-loop
        } else {
          return {
            queueId: res.queue_id,
            lastEventId: res.last_event_id,
          };
        }
      } catch (e) {
        logError(e);
      }
    }
  }

  async function callOnEachEvent(callback, eventTypes = null) {
    let queueId = null;
    let lastEventId = -1;
    const handleEvent = (event) => {
      lastEventId = Math.max(lastEventId, event.id);
      callback(event);
    };
    while (true) { // eslint-disable-line no-constant-condition
      if (!queueId) {
        const queueData = await registerQueue(eventTypes); // eslint-disable-line no-await-in-loop
        queueId = queueData.queueId;
        lastEventId = queueData.lastEventId;
      }
      try {
        const res = await z.events.retrieve({ // eslint-disable-line no-await-in-loop
          queue_id: queueId,
          last_event_id: lastEventId,
          dont_block: false,
        });
        if (res.events) {
          res.events.forEach(handleEvent);
        }
      } catch (e) {
        logError(e);
      }
      await sleep(1000); // eslint-disable-line no-await-in-loop
    }
  }

  return callOnEachEvent;
}

module.exports = eventsWrapper;
