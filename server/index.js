var http = require('http');
var sockjs = require('sockjs');

var num=0,
RATING=[],
conn_arr=[],
admin_arr=[];

var echo = sockjs.createServer({ sockjs_url: 'http://cdn.jsdelivr.net/sockjs/0.3.4/sockjs.min.js' });
echo.on('connection', function(conn) {
	conn.user_id=num;
	conn.user_type='user';
	conn.user_channel=1;
	conn_arr[num]=conn;
	num++;
	
	conn.write('ID #'+conn.user_id);
	console.log('new connection #'+conn.user_id);
	
    conn.on('data', function(message) {
		// Ты админ?
		var data=JSON.parse(message);
		if(data.command){
			switch(data.command){
				case 'admin':
					admin_arr[num]=conn;
					conn.user_type='admin';
					console.log('admin registered: #'+conn.user_id);
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
					if(conn.user_type=='admin'){
						conn.write('{"rating":"'+RATING[conn.user_channel]+'"}');
					}
				break;
			}
		}
		
		// conn.write(message);
		//console.log(message);
    });
	
    conn.on('close', function() {
		
	});
});

var server = http.createServer();
echo.installHandlers(server, {prefix:'/vote'});
server.listen(8080, '0.0.0.0');