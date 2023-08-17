const AWS = require('aws-sdk');
var client = new AWS.DynamoDB.DocumentClient({
 region: "ap-northeast-1"
});

export async function getEventId(event_id)
{
    // queryの実行
    var thread = await client.query({
      TableName: "slack_thread_checker", 
      KeyConditionExpression: "#ID = :ID",
      ExpressionAttributeNames: {"#ID": "event_id"},
      ExpressionAttributeValues: {":ID": event_id }
    }).promise();
    
    if(!thread) return null;
    return thread.Items[0];
}

export async function getThread(ts)
{
    // queryの実行
    var thread = await client.query({
      TableName: "slack_thread_checker", 
      KeyConditionExpression: "#ID = :ID",
      ExpressionAttributeNames: {"#ID": "ts"},
      ExpressionAttributeValues: {":ID": ts }
    }).promise();
    
    if(!thread) return null;
    return thread.Items[0];
}

export async function dirtyFlag(ts)
{
    // queryの実行
    let item = {
      ts: ts,
      reply: (new Date()).getTime()
    };
    
    var result = await client.put({
        TableName: "slack_thread_checker", 
        Item: item
    }).promise();
    
    return result;
}

export async function register(message, event, event_id)
{
    // queryの実行
    let item = {
      event_id: event_id,
      ts: message.ts,
      app_id: message.app_id,
      user: event.user,
      block_text: JSON.stringify(event.blocks)
    };
    
    var result = await client.put({
        TableName: "slack_thread_checker", 
        Item: item
    }).promise();
    
    return result;
};


