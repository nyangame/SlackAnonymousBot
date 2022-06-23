import { fileTransfar, sendMessage, sendAnonymousMessage } from './lib/slack.js'
import { getThread, register,  } from './dynamo.js'

let SuccessResponse = {
    statusCode: 200,
    headers: {
    },
    body: "",
    isBase64Encoded: false
};

exports.handler = async (event) => {
	
	console.log(event);
	let params = event;
	
	let type = event.eventType;
	
	let BotUserId = event.BotUserId;
	let ChannelId = event.ChannelId;
	
	switch(type)
	{
	case "PostMessage":
		{
			/*
	    	let blocks = [];
	    	for(const b of params.event.blocks)
	    	{
	    		console.log()
	    		switch(b.type)
	    		{
	    			case "plain_text":
	    			case "rich_text":
	    				{
	    					let elm = { "type": "section", "text" : { "type": "plain_text", "text" : "", "emoji": true } };
	    					let elements = b.elements;
	    					while(elements)
	    					{
	    						if(!elements[0]) break;
	    						if(elements[0].text)
	    						{
	    							elm.text.text = elements[0].text;
	    						}
	    						elements = elements[0].elements;
	    					}
			    			blocks.push(elm);
			    		}
	    				break;
	    		}
	    	}
	    	*/
	    	
	    	//画像(ファイル)がついてたら
	    	let links = [];
	    	if(params.event.files)
	    	{
	    		 links = await fileTransfar(params.event.files);
	    	}
			return SuccessResponse;
	    	
	        let result = await sendAnonymousMessage(ChannelId, "質問箱", params.event.text);
	        
	        //ts情報をDBに登録
	        if(result.ok)
	        {
	        	//返信リンクも投稿
	        	let reply_url = "<https://docs.google.com/forms/d/e/1FAIpQLSdiEDBZVjRjG3lB13AvwGZZtknhqloPVG3o9olqejxTlQp0rA/viewform?usp=pp_url&entry.1229285134=" + result.message.ts + ">";
	        	//let rep_block = [{ "type": "section", "text" : { "type": "plain_text", "text" : "この質問への返信はここから" + reply_url, "emoji": true } }];
	        	
	        	await sendAnonymousMessage(ChannelId, "質問箱", "この質問への返信はここから" + reply_url, result.message.ts);
	
	        	await register(result.message, params.event, params.event_id);
	        }
		}
		break;
		
	case "ThreadResponse":
		{
        	let thread = await getThread(params.event.thread_ts);
        	let result = "";
        	if(thread && thread.user)
        	{
        		result = await sendMessage(thread.user, "質問に返信がありました:\n" + params.event.text);
        	}
		}
		break;
	}

	return SuccessResponse;
};
