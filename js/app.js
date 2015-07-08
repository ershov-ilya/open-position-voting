﻿var sock = new SockJS('http://ershov.pw:8080/vote');

var VOTE=(function(){
	// Private
	var admin=false;
	var countdown=0;
	var channel=1;
	function btnEnable(){
		$('button.btn-vote').removeAttr('disabled');
		$('#countdown').text(countdown).slideUp();
	}
	function tick(){
		if(countdown>0){
			$('#countdown').text(countdown);
			countdown--;
		}
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
			sock.send('{"command":"ask"}');
		},
		parse:function(message){ // Приём сообщений от сервера
			var data=JSON.parse(message);
			console.log(data);
			if(data.channel){
				channel=data.channel;
				$('#channel').text(channel);
			}
			//alert(message);
		}
	};
	return PUBLIC;
})();


sock.onmessage = function(e) {
 //console.log('message', e.data);
 //alert(e.data);
 VOTE.parse(e.data);
};

sock.onclose = function() {
 $('button.btn-vote').attr('disabled','disabled');
 $('#channel-head').text('Нет соединения');
 $('#channel').remove();
};



$(document).ready(function(){
	VOTE.init();
});