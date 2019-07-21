const Log = require('@perform/lambda-powertools-logger')
const axios = require('axios')
const wrap = require('@perform/lambda-powertools-pattern-basic')
const AWS = require('aws-sdk')
const Lambda = new AWS.Lambda()

const EventSourceArn = process.env.KINESIS_ARN
const FunctionName = process.env.AWS_LAMBDA_FUNCTION_NAME

module.exports.handler = wrap(async (_, context) => {
  const events = context.parsedKinesisEvents
  for (const event of events) {
    Log.debug('received event', { event })

    const isConfirmationReq = await handleConfirmationRequest(event)

    if (isConfirmationReq) {
      Log.debug('SNS subscription is confirmed, disabling Kinesis event source mapping...')
      await disable()
    }
  }
})

async function disable() {
  const listResp = await Lambda.listEventSourceMappings({
    EventSourceArn,
    FunctionName,
    MaxItems: 1,
  }).promise()
  const mapping = listResp.EventSourceMappings[0]
  Log.debug('found Kinesis event mapping', { mapping })

  const { UUID } = mapping

  await Lambda.updateEventSourceMapping({
    UUID,
    BatchSize: 1,
    FunctionName,
    Enabled: false
  }).promise()
  Log.debug('disabled event source mapping', { UUID })
}

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