module.exports = (topicName, processMessage) => (gcloud, ...other) => {
  const datastore = gcloud.datastore();
  const pubsub = gcloud.pubsub();
  const topic = pubsub.topic(topicName);

  return topic.exists()
    .then(([exists]) => 
      exists ? topic : topic.create().then(([topic]) => topic))
    .then((topic) => {
      pubsub.subscribe(topicName, {
        autoAck: true,
      }, (err, subscription, apiResponse) => {
        if (err) {
          console.error(`${topicName} error:`, err);
          return;
        }

        console.error(`${topicName} subscribed: ${subscription.name}`);
        const pullOne = () => 
          subscription.pull({ maxResults: 1 })
            .then(([messages, apiResponse]) => {
              if (messages && messages.length) {
                console.error(`${topicName} received:`, messages[0].data);
                return processMessage(
                  messages[0].data, {
                    datastore, pubsub,
                  }, ...other);
              }
            })
            .then(pullOne)
            .catch(error => {
              console.error(`${topicName} failed to process message`);
              console.log(`${topicName}`, error);
              return pullOne();
            });
        
        pullOne();
      });
    });
};
