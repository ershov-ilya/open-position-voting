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
	
    conn.on('data', function(message) {
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
					channel_arr[conn.user.channel]=conn.user.id; // Канал админится содинением num
					console.log('admin chanel: #'+conn.user.channel);
					conn.write('{"channel":"'+conn.user.channel+'"}');
					last_channel=conn.user.channel;
				break;
				case 'vote':
					if(data.vote && data.channel){
						if(typeof RATING[data.channel]=='undefined') RATING[data.channel]=0;
						
						if(data.vote=='+1') RATING[data.channel]++;
						if(data.vote=='-1') RATING[data.channel]--;
						console.log('channel #'+data.channel+', Rating: '+RATING[data.channel]);
					}
				break;
				case 'ask':
					if(conn.user.type=='admin'){
						conn.write('{"rating":"'+RATING[conn.user.channel]+'"}');
					}
				break;
			}
		}
		
		// conn.write(message);
		//console.log(message);
    });
	
    conn.on('close', function() {
		if(conn.user.type=='admin'){
			channel_arr.remove(conn.user.id);
			console.log('Закрыт канал #'+conn.user.id);
			admin_arr.splice(conn.user.id,1);
		}
		
		conn_arr.splice(conn.user.id,1);
		console.log('user Закрыто соединение #'+conn.user.id);
		console.log('Всего соединений: '+conn_arr.length);
	});
});

var server = http.createServer();
echo.installHandlers(server, {prefix:'/vote'});
server.listen(8080, '0.0.0.0');