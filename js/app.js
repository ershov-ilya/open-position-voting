var sock = new SockJS('http://efe.bz:8080/vote');

var VOTE=(function(){
	// Private
	var admin=false;
	countdown=0,
	channel=1,
	RATING=0,
	history_max=360,
	peak_max=100,
	peak_min=-100,
	HISTORY=[];
	for(var i=0; i<history_max; i++){
		HISTORY.push([0,0]);
	}
	//console.log(HISTORY);
	
	
	function btnEnable(){
		$('button.btn-vote').removeAttr('disabled');
		$('#countdown').text(countdown).slideUp();
	}
	function tick(){
		if(countdown>0){
			$('#countdown').text(countdown);
			countdown--;
		}
		/*
		if(admin){
			sock.send('{"command":"ask","channel":"'+channel+'"}');
		}
		*/
	}
	
	function listenButtons(){
		$("button").click(function(e){
			var vote_action=$(this).data('vote');
			var channel_action=$(this).data('channel');
			if(vote_action){
				PUBLIC.btnDisable();
				sock.send('{"command":"vote","channel":"'+channel+'","vote":"'+vote_action+'"}');
			}
			if(channel_action){
				if(channel_action=="+1") channel++;
				if(channel_action=="-1") channel--;
				if(channel<1) channel=1;
				if(channel>100) channel=100;
				$('#channel').text(channel);
			}
		});
	}
		
	// Public
	var PUBLIC = {
		init:function(config){
			//console.log('VOTE init()');
			setInterval(tick,1000);
			listenButtons();
		},
		btnDisable: function(){
			$('button.btn-vote').attr('disabled','disabled');
			countdown=10;
			$('#countdown').text(countdown).slideDown();
			setTimeout(btnEnable, 10000);
		},
		ask: function(){
			sock.send('{"command":"ask","channel":"'+channel+'"}');
		},
		parse:function(message){ // Приём сообщений от сервера
			//alert(message);
			var data=JSON.parse(message);
			//console.log(data);
			if(data.channel){
				channel=data.channel;
				$('#channel').text('#'+channel);
			}
			
			if(data.answer=='admin'){
				admin=true;
			}
			
			if(typeof data.rating != 'undefined' && data.rating != 'undefined'){
				RATING=data.rating;
				if(RATING>peak_max) peak_max=RATING;
				if(RATING<peak_min) peak_min=RATING;
				
				HISTORY=HISTORY.slice(1);
				HISTORY.push([0,+RATING]);
				$('#rating').text(RATING);
			}
		},
		get:function(){
			var res=HISTORY;
			for(var i=0; i<history_max; i++){
				res[i][0]=i;
			}
			return res;
		},
		getAxisY:function(){
			return {min: +peak_min-10, max: +peak_max+10};
		}
	};
	return PUBLIC;
})();

/* End of VOTE
---------------------------------------------------------------*/

sock.onmessage = function(e) {
 //console.log('message', e.data);
 //alert(e.data);
 VOTE.parse(e.data);
};

sock.onclose = function() {
 $('button.btn-vote').attr('disabled','disabled');
 $('#channel-head').html('<a href="/vote/">Нет соединения</a>');
 $('.channel-kbd').text('Соединение разорвано');
 $('#channel').remove();
};



$(document).ready(function(){
	VOTE.init();
});