const Log = require('@perform/lambda-powertools-logger')
const axios = require('axios')

module.exports.handler = async (event) => {
  Log.debug('received event', { event })
  const isConfirmationReq = await handleConfirmationRequest(event)

  if (!isConfirmationReq) {
    Log.debug("doing stuff...")
    // do stuff
  }

  return {
    statusCode: 200
  }
}

// see https://docs.aws.amazon.com/sns/latest/dg/sns-http-https-endpoint-as-subscriber.html
// this method handles the confirmation request
async function handleConfirmationRequest(event) {
  const payload = tryParseJson(event.body)
  if (!payload) {
    Log.debug('HTTP body is not a JSON payload, so definitely not a confirmation request!')
    return false
  }

  Log.debug('parsed JSON body', { payload })

  if (payload.Type === 'SubscriptionConfirmation') {
    await axios.get(payload.SubscribeURL)
    Log.debug('subscribed to SNS topic', { arn: payload.TopicArn })
    return true
  } else {
    return false
  }
}

function tryParseJson(str) {
  try {
    return JSON.parse(str)
  } catch (err) {
    return null
  }
}