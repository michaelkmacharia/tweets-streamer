#!/usr/bin/env node

`use strict` ;

const colors = require ( `colors` ) ;

const dotenv = require ( `dotenv` ) . config () ;

const express = require ( `express` ) ;

const http = require ( `http` ) ;

const moment = require ( `moment` ) ;

const needle = require ( `needle` ) ;

const path = require ( `path` ) ;

const socket_io = require ( `socket.io` ) ;

const TOKEN = process . env . TWITTER_BEARER_TOKEN ;

const rules_url = `https://api.twitter.com/2/tweets/search/stream/rules` ;

const stream_url = `https://api.twitter.com/2/tweets/search/stream?tweet.fields=public_metrics&expansions=author_id` ;

const rules = [ { value : `giveaway` } ] ;

const app = express () ;

const server = http . createServer ( app ) ;

const io = socket_io ( server ) ;

app . get ( `/` , ( request, response ) =>
	{
		response . sendFile ( path . resolve ( __dirname , `.` , `frontend` , `index.html` ) ) ;
		return ;
	}
) ;

const get_rules = ( async () =>
	{
		const response = await needle ( `get` , rules_url , { headers : { Authorization : `Bearer ${ TOKEN }` } } ) ;
		console . log ( response . body . brightWhite ) ;
		return ( response . body ) ;
	}
) ;

const set_rules = ( async () =>
	{
		const data = { add : rules } ;
		const response = await needle ( `post` , rules_url , data , { headers : { `content-type` : `application/json` , Authorization : `Bearer ${ TOKEN }` } } ) ;
		return ( response . body ) ;
	}
) ;

const delete_rules = ( async ( rules ) =>
	{
		if ( ! Array . isArray ( rules . data ) )
		{
			return ( null ) ;
		}
		const ids = rules . data . map ( ( rule ) =>
			{
				rule . id ;
				return ;
			}
		) ;
		const data = { delete : { ids : ids } } ;
		const response = await needle ( `post` , rules_url , data , { headers : { `content-type` : `application/json` , Authorization : `Bearer ${ TOKEN }` } } ) ;
		return ( response . body ) ;
	}
) ;

const stream_tweets = ( ( socket ) =>
	{
		const stream = needle . get ( stream_url , { headers : { Authorization : `Bearer ${ TOKEN }` } } ) ;
		stream . on ( `data` , ( data ) =>
			{
				try
				{
					const json = JSON . parse ( data ) ;
					console . log ( json . brightWhite ) ;
					socket . emit ( `tweet` , json ) ;
					return ;
				}
				catch ( error )
				{
					console . error ( error . message . brightRed ) ;
					return ;
				}
			}
		) ;
		return ( stream ) ;
	}
) ;

io . on ( `connection` , async () =>
	{
		console . log ( `Connected.` . brightGreen ) ;
		let currentRules ;
		try
		{
			currentRules = await get_rules () ;
			await delete_rules ( currentRules ) ;
			await set_rules () ;
		}
		catch ( error )
		{
			console . error ( error . message . brightRed ) ;
			return ;
		}
		const filteredStream = stream_tweets ( io ) ;
		let timeout = 0 ;
		filteredStream . on ( `timeout` , () =>
			{
				console . warn ( `Connection error occurred. Reconnecting...` . brightRed ) ;
				setTimeout ( () =>
					{
						timeout ++ ;
						stream_tweets ( io ) ;
					} , 2 ** timeout ;
				) ;
				stream_tweets ( io ) ;
				return ;
			}
		) ;
	}
) ;

const port = process . env . PORT || 5000 ;

server . listen ( port , () =>
	{
		console . log ( `tweets-streamer listening on port: ` . brightWhite , `${ port }` . brightGreen ) ;
		return ;
	}
) ;
