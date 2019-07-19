const Log = require('@perform/lambda-powertools-logger')
const axios = require('axios')
const wrap = require('@perform/lambda-powertools-pattern-basic')

module.exports.handler = wrap(async (_, context) => {
  const events = context.parsedKinesisEvents
  for (const event of events) {
    Log.debug('received event', { event })

    const isConfirmationReq = await handleConfirmationRequest(event)

    if (!isConfirmationReq) {
      Log.debug("doing stuff...", { event })
      // do stuff
    }
  }
})

// see https://docs.aws.amazon.com/sns/latest/dg/sns-http-https-endpoint-as-subscriber.html
// this method handles the confirmation request
async function handleConfirmationRequest(event) {
  if (event.Type === 'SubscriptionConfirmation') {
    await axios.get(event.SubscribeURL)
    Log.debug('subscribed to SNS topic', { arn: event.TopicArn })
    return true
  } else {
    return false
  }
}