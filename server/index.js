var http = require('http');
var sockjs = require('sockjs');

Array.prototype.remove=function(key){
  for(k in this){
    if(key==this[k]){
      this.splice(k,1);
    }
  }
}

Array.prototype.vacant=function(start){
  if(typeof start == 'undefined') start=0;
  var i;
  for(i=start; i<9999; i++){
    if(typeof this[i] == 'undefined') break;
  }
  return i;
}



var num=0, // номер соединения
last_channel=1,
RATING=[], // Рейтинг канала
HISTORY=[];

var conn_arr=[], // массив соединений
admin_arr=[], // массив админов
channel_arr=[]; // массив каналов

var echo = sockjs.createServer({ sockjs_url: 'http://cdn.jsdelivr.net/sockjs/0.3.4/sockjs.min.js' });
echo.on('connection', function(conn) {
	conn.time={};
	var date=new Date();
	conn.time.open=date.valueOf();
	conn.time.action=date.valueOf();
	console.log('conn time: '+conn.time.action);
	
	conn.user={};
	conn.user.id=num;
	num++;
	conn.user.type='user';
	conn.user.channel=1;
	conn_arr[conn.user.id]=conn;
	
	conn.write('{"id":"'+conn.user.id+'"}');
	console.log('new connection #'+conn.user.id);
	
	// Время жизни канала
	setTimeout(function(){
		var id=conn.user.id;
		console.log('Закрытие соединения по таймеру #'+conn.user.id);
		/*
		channel_arr.remove(id);
		admin_arr.splice(id,1);
		RATING.splice(id,1);
		clearInterval(conn.user.interval);
		*/		
		conn.close();
	},7200000); // 60сек * 60 мин * 2 часа = 7200000
	
    conn.on('data', function(message) {
		function serve(){
			conn.write('{"rating":"'+RATING[conn.user.channel]+'"}');
		}
	
		// Ты админ?
		var data=JSON.parse(message);
		if(data.command){
			switch(data.command){
				case 'user':
					conn.write('{"channel":"'+last_channel+'"}');
				break;
				case 'admin':
					admin_arr[conn.user.id]=conn; // регистрация админа
					conn.user.type='admin';
					console.log('admin registered: #'+conn.user.id);
					
					conn.user.channel=channel_arr.vacant(1); // Поиск свободного канала, начиная с 1
					RATING[conn.user.channel]=0;
					channel_arr[conn.user.channel]=conn.user.id; // Канал админится содинением num
					console.log('admin chanel: #'+conn.user.channel);
					conn.write('{"channel":"'+conn.user.channel+'","answer":"admin"}');
					last_channel=conn.user.channel;
					
					//console.log(channel_arr);
					conn.user.interval=setInterval(serve, 1000);
				break;
				case 'vote':
					if(data.vote && data.channel){
						if(typeof RATING[data.channel]=='undefined') RATING[data.channel]=0;
						
						if(data.vote=='+1') RATING[data.channel]+=1;
						if(data.vote=='-1') RATING[data.channel]-=1;
						console.log('channel #'+data.channel+', Rating: '+RATING[data.channel]);
					}
				break;
				case 'ask':
					if(conn.user.type=='admin'){
						conn.write('{"rating":"'+RATING[data.channel]+'"}');
					}
				break;
			}
		}
		
		// conn.write(message);
		//console.log(message);
    });
	
    conn.on('close', function() {
		if(conn.user.type=='admin'){
			console.log('Закрытие канала #'+channel_arr[conn.user.id]);
			channel_arr.remove(conn.user.id);
			admin_arr.splice(conn.user.id,1);
			RATING.splice(conn.user.id,1);
			clearInterval(conn.user.interval);			
			//console.log(channel_arr);
		}
		
		conn_arr.splice(conn.user.id,1);
		console.log('user Закрыто соединение #'+conn.user.id);
		console.log('Всего соединений: '+conn_arr.length);
	});
});

var server = http.createServer();
echo.installHandlers(server, {prefix:'/vote'});
server.listen(8080, '0.0.0.0');
