import WebClient from '@slack/web-api'
import http from'http'
import https from 'https'
import crypto from 'crypto'
import {fileTypeFromBuffer} from 'file-type';

import { S3 } from '@aws-sdk/client-s3'
const s3 = new S3();

const botUserOAuthToken = process.env.BOT_USER_OAUTH_TOKEN;
const s3BucketName = "vtn-slack-files";

async function download(uri)
{
  let redirect = false;
  let databyte = [];
  let header = {};
  header['Authorization'] = 'Bearer ' + botUserOAuthToken;
  do
  {
    redirect = false;
    await new Promise((resolve, reject) =>
      https
        .request(uri, { headers: header }, (res) => {
          const code = res.statusCode ?? 0
          if (code >= 400) {
            console.log("reject");
            return reject(new Error(res.statusMessage))
          }
    
          // handle redirects
          if (code > 300 && code < 400 && !!res.headers.location) {
            uri = res.headers.location;
            redirect = true;
            console.log("redirect");
            return resolve();
          }
        
          res
            .on("data", function(d){ databyte.push(d);})
            .on("close", resolve)
            .on("error", reject);
        })
        .end()
    );
    //console.log("here");
  }while(redirect);
  return Buffer.concat(databyte);
};

async function upload(filename, fid, data)
{
  let ftype = await fileTypeFromBuffer(data);
  
  let result = await s3.upload({
    Bucket: s3BucketName,
    Key: fid + "." + ftype.ext,
    Body: data,
    ContentType: ftype.mime
  },
  {
    partSize: 100 * 1024 * 1024,
    queueSize: 4
  }).promise();
  /*
  , (err, data) => {
    if (err) {
      console.log(err);
      return;
    }
    console.log(JSON.stringify(data));
  });
  */
  console.log(result);
  return fid + "." + ftype.ext;
}

export async function fileTransfar(files)
{
  if(!files) return;
  let list = [];
  const client = new WebClient(botUserOAuthToken);
  
  for(let f of files)
  {
    //console.log(f);
    let data = await download(f.url_private_download);
    list.push( await upload(f.name, f.id, data) );
    //console.log(data);
  }
  /*
  //slackから消してs3にアップロード
  for(let f of files)
  {
    const params = {
      file: f.id,
    };
    const response = await client.files.delete(params);
    console.log(response);
  }
  */
}

export async function sendAnonymousMessage(ch, username, text, ts)
{
  const client = new WebClient(botUserOAuthToken);
  const params = {
    channel: ch,
    text: text,
    username: username
  };
  
  if(ts)
  {
    params.thread_ts = ts;
  }
  
  const response = await client.chat.postMessage(params);
  console.log(response);
  return response;
}

export async function sendMessage(channel, message, userinfo = null, blocks = null)
{
  const client = new WebClient(botUserOAuthToken);
  const params = {
    channel: channel,
    text: message
  };
  
  if(userinfo) {
    params.icon_url = userinfo.icon_url;
    params.username = userinfo.username;
  }
  
  if(blocks) {
    params.attachments = [ { "blocks" : blocks } ];
  }
  
  const response = await client.chat.postMessage(params);
  console.log(response);
  return response;
};

/*
export async function sendMessageDirect(channel, message, userinfo = null, blocks = null){
  const token = config.botUserOAuthToken;
  const text = 'Hello World';

  const client = new WebClient(token);
  const params = {
    channel: channel,
    text: message
  };
  
  if(userinfo) {
    params.icon_url = userinfo.icon_url;
    params.username = userinfo.username;
  }
  
  if(blocks) {
    params.blocks = blocks;
  }
  
  const response = await client.chat.postMessage(params);
  console.log(response);
  return response;
};

export async function sendEphemeralMessage(channel, message, userId, userinfo = null, blocks = null){
  const token = config.botUserOAuthToken;
  const text = 'Hello World';

  const client = new WebClient(token);
  const params = {
    channel: channel,
    text: message,
    user: userId,
  };
  
  if(userinfo) {
    params.icon_url = userinfo.icon_url;
    params.username = userinfo.username;
  }
  
  if(blocks) {
    params.attachments = [ { "blocks" : blocks } ];
  }
  
  const response = await client.chat.postEphemeral(params);
  console.log(response);
  return response;
};


export async function unfurlsLink(channel, event, blocks = null){
  const token = config.botUserOAuthToken;
  const text = 'Hello World';

  const client = new WebClient(token);
  const params = {
    channel: channel,
    ts: event.event_ts,
    unfurl_id: event.unfurl_id,
    source: event.source,
    unfurls: blocks
  };
  
  const response = await client.chat.unfurl(params);
  console.log(response);
  return response;
};
*/