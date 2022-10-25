#!/usr/bin/env node

`use strict` ;

const tweet_stream = document . querySelector ( `#tweetStream` ) ;

const socket = io () ;

const tweets = [] ;

socket . on ( `connect` , () =>
	{
		console . log ( `Connected to server...` ) ;
		return ;
	}
) ;

socket . on ( `tweet` , ( tweet ) =>
	{
		const tweet_data = { id : tweet . data . id , text : tweet . data . text , username : `@${ tweet . includes . users [ 0 ] . username }` } ;
		const div = document . createElement ( `div` ) ;
		div . className = `card my-4` ;
		div . innerHTML = `
			<div class="card-body">
				<h5 class="card-title">${ tweet_data . text }</h5>
				<h6 class="card-subtitle mb-2 text-muted">${ tweet_data . username }</h6>
				<a class="btn btn-primary mt-3" href="https://twitter.com/${ tweet_data . username }/status/${ tweet_data . id }"><i class="fab fa-twitter"></i> Go To Tweet</a>
			</div>
		` ;
		tweet_stream . appendChild ( div ) ;
		setTimeout ( () =>
			{
				div . remove () ;
				return ;
			} , 5000
		) ;
		return ;
	}
) ;
