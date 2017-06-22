var express= require('express');
var cfenv = require('cfenv');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var f=1;
var avtar_list=[
	{av:'avtar1',avname:'Samba',bulletimg:'bullet3.png'},
	{av:'avtar2',avname:'Hot',bulletimg:'bullet2.png'},
	{av:'avtar3',avname:'Dragon',bulletimg:'bullet1.png'}
];

//Static resources server

app.use(express.static(__dirname + '/public'));
// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

app.get('/', function(req, res){
  res.sendfile('index.html');
});

http.listen(appEnv.port, '0.0.0.0', function(){
  console.log('listening on *:3000');
});

var SOCKET_LIST=[];


//======================================================================
var Entity = function(){
	var self ={
		x:Math.floor(500*Math.random()),
		y:Math.floor(500*Math.random()),
		spdx:0,
		spdy:0,
		id:""
	}
	self.update = function(){
		self.updatePosition();
	}
	self.updatePosition = function(){
		self.x += self.spdx;
		self.y += self.spdy;

	}	
	self.getDistance = function(pt)	{
		return Math.sqrt(Math.pow(Tgt.tx - pt.x+5,2) + Math.pow(Tgt.ty - pt.y+5,2));
	}
	self.getDistancePlayer = function(pt)	{
		return Math.sqrt(Math.pow(self.x - pt.x,2) + Math.pow(self.y - pt.y,2));
	}
	return self;
}

//======================================================================
var Tgt = {
	tx:250,
	ty:250

}

//======================================================================

var Player = function(id){
	var self = Entity();
	self.id=id;
	self.number = "" + Math.floor(10*Math.random());
	self.playername="None";
	self.avtarname="None";
	self.pressingRight=false;
	self.pressingLeft=false;
	self.pressingUp=false;
	self.pressingDown=false;
	self.pressingAttack=false;
	self.mouseAngle=0;
	self.maxSpd=10;
	self.score=0;
	self.level=1;
	self.bulletimg="";
	var super_update = self.update;
	self.update=function(){
		self.updateSpd();
		super_update();

	if(self.pressingAttack && f==1){
		
		if(self.score > 1000 )
		{
			self.level = self.score/10000;
				for (j=-self.level; j<= self.level;j++){
					self.shootBullet(j * 10 + self.mouseAngle);
			}
		}
		else
			self.shootBullet(self.mouseAngle);
		
	}
		
		if(self.y<10) self.y=450;
		if(self.y>450) self.y=10;
		if(self.x<10) self.x=950;
		if(self.x>950) self.x=10;
	}
	self.shootBullet = function(angle) {
		var b = Bullet(self.id,angle);
		b.x = self.x;
		b.y = self.y;
		b.bulletimg=self.bulletimg;
	}
	self.updateSpd = function(){
		if(self.pressingRight)
			self.spdx = self.maxSpd;
		else if(self.pressingLeft)
			self.spdx -= self.maxSpd;
		else 
			self.spdx = 0;
		if(self.pressingUp)
			self.spdy -= self.maxSpd;
		else if(self.pressingDown)
			self.spdy = self.maxSpd;
		else 
			self.spdy = 0;

	}
	Player.list[id]=self;
	return self;
}
Player.list = {};
Player.update = function(){
	var pack = [];
	for (var i in Player.list) {
		var player = Player.list[i];
		player.update();
		pack.push({
			id:player.id,
			x:player.x,
			y:player.y,
			number:player.number,
			playername:player.playername,
			avtarname:player.avtarname,
			score:player.score,
			bulletimg:player.bulletimg
		});
	}
	return pack;
}
//======================================================================
var Bullet = function(parent, angle){
	var self = Entity();
	self.id = Math.random();
	self.spdx = Math.cos(angle/180*Math.PI) * 10 ;
	self.spdy = Math.sin(angle/180*Math.PI) * 10 ;
	self.bulletimg="";
	self.timer=0;
	self.parent = parent;
	self.toRemove=false;
	var super_update = self.update;
	self.update = function(){
		if(self.timer++ > 1000)
			self.toRemove = true;
		if(self.x > 1000 || self.x < 0 || self.y > 500 || self.y < 0 )
			self.toRemove = true;
		super_update();
		for (var i in Bullet.list) {
			var p = Bullet.list[i];
			var d = self.getDistance(p);
			//bullet hit the target bird
			if(d < 32){
				self.toRemove = true;
				var pl = Player.list[self.parent];
				pl.score += 10;
				var score = Score(p);
				var birdfall = BirdFall(p);
			}
		}
 
		// Bullet hit another player
		for (var i in Player.list ){	
			var p = Player.list[i];
			var d = self.getDistancePlayer(p);
			if(d < 30 && self.parent !== p.id){
				// Logic to handle collision.
				self.toRemove = true;
				p.score -= 100;
				var pl = Player.list[self.parent];
				pl.score += 100;
				var score = Score(p);			
			}
		}			
	}
	Bullet.list[self.id] = self;
f=0;
	return self;
}
Bullet.list={};

Bullet.update = function() {
	var pack = [];
	for (var i in Bullet.list) {
		var bullet = Bullet.list[i];
		bullet.update();
		if(bullet.toRemove)
			delete Bullet.list[i];
		else
			pack.push({
				x:bullet.x,
				y:bullet.y,
				bulletimg:bullet.bulletimg
			});
	}
	
	return pack;
}
//======================================================================
var Score = function(parent){
	var self = Entity();
		self.updatePosition = function(){
		self.x += self.spdx;
		self.y -= self.spdy;

	}
	
	self.id = Math.random();
	self.spdx = 0 ;
	self.spdy = 10 ;
	self.x=parent.x;
	self.y=parent.y;
	self.score="+10";
	self.toRemove=false;
	var super_update = self.update;
	self.update = function(){
		if(self.y < 0 )
			self.toRemove = true;
		super_update();
	}
	Score.list[self.id] = self;
	return self;
}
Score.list={};

Score.update = function() {
	var pack = [];
	for (var i in Score.list) {
		var score = Score.list[i];
		score.update();
		if(score.toRemove)
			delete Score.list[i];
		else
			pack.push({
				x:score.x,
				y:score.y,
				score:score.score
			});
	}
	
	return pack;
}

//======================================================================
var BirdFall = function(parent){
	var self = Entity();

	self.id = Math.random();
	self.spdx = 0 ;
	self.spdy = 10 ;
	self.x=parent.x;
	self.y=parent.y;
	self.toRemove=false;
	var super_update = self.update;
	self.update = function(){
		if(self.y < 0 )
			self.toRemove = true;
		super_update();
	}
	BirdFall.list[self.id] = self;
	return self;
}
BirdFall.list={};

BirdFall.update = function() {
	var pack = [];
	for (var i in BirdFall.list) {
		var birdfall = BirdFall.list[i];
		birdfall.update();
		if(birdfall.toRemove)
			delete BirdFall.list[i];
		else
			pack.push({
				x:birdfall.x,
				y:birdfall.y,
			});
	}
	
	return pack;
}
//======================================================================

Player.onConnect= function(socket,playerdata){
	var player = Player(socket.id);
	player.playername=playerdata.playername;
	player.avtarname=playerdata.avtarname;
	player.bulletimg=playerdata.bulletimg;
	console.log(player.playername + ' Join the game with '+player.avtarname);

	socket.on('keyPress',function(data){
		if(data.inputId=='left')
			player.pressingLeft=data.state;
		else if(data.inputId=='right')
			player.pressingRight=data.state;
		else if(data.inputId=='up')
			player.pressingUp=data.state;
		else if(data.inputId=='down')
			player.pressingDown=data.state;
		else if(data.inputId=='attack'){				
			player.pressingAttack=data.state;
			if(data.state==true && f==0 ) f=1;
		}
		else if(data.inputId=='mouseAngle')
			player.mouseAngle=data.state;

			
	});	
}


Player.onDisconnect = function(socket){
	var pl=Player.list[socket.id];
	if (pl == null)
		console.log("No player connect");
	else{
		var temp={av:pl.avtarname,avname:pl.playername,bulletimg:pl.bulletimg}
		avtar_list.push(temp);
	}

	delete SOCKET_LIST[socket.id];
	delete Player.list[socket.id];

}





//Whenever someone connects this gets executed
io.on('connection',function(socket){
	console.log('A user connected '+ socket.id);
	if (avtar_list.length == 0)
		var gmsg = "Sorry ! no more player allowed now . Wait for sometime and try again.";
	else{
		var gmsg = "Select an Avtar and enter your name. Clck Join to Start the Game";
		var ready = 1;
	}
	var welcomepack={
		avtars:avtar_list,
		msg: gmsg,
		ready:ready
	}
	socket.emit('newplayer',welcomepack);

	socket.on('join',function(playerdata){
		socket.id=Math.random();
		SOCKET_LIST[socket.id]=socket;
		
		for(var i=0;i<avtar_list.length;i++)
			if(avtar_list[i].av == playerdata.avtarname){
				avtar_list.splice(i,1);
				break;
			}
		Player.onConnect(socket,playerdata);

		var startplaypack = {
			player:Player.update(),
			myname:playerdata.playername,
			myavtar:playerdata.avtarname

		}		
		for( var i in SOCKET_LIST){
			var socket1=SOCKET_LIST[i];
			socket1.emit('startplay',startplaypack);
		}
	});

	socket.on('chatmsg',function(chatmsg){
		var chattxt= chatmsg.pname+": " + chatmsg.text;
		for( var i in SOCKET_LIST){
			var socket1=SOCKET_LIST[i];
			socket1.emit('chatmsg',chattxt);
		}

	});
	
	socket.on('disconnect',function(){
		console.log('A user disconnected');
		Player.onDisconnect(socket);
		
		
		var startplaypack = {
			player:Player.update(),
		}

		for( var i in SOCKET_LIST){
			var socket1=SOCKET_LIST[i];
			socket1.emit('startplay',startplaypack);
		}
	
	});	
	
});

setInterval(function(){
	var pack = {
		player:Player.update(),
		bullet:Bullet.update(),
		score:Score.update(),
		birdfall:BirdFall.update(),
		target:Tgt
	}

	for( var i in SOCKET_LIST){
		var socket=SOCKET_LIST[i];
		socket.emit('newPosition',pack);
	}
},1000/25);

setInterval(function(){

	Tgt.tx=Math.floor(500*Math.random())
	Tgt.ty=Math.floor(500*Math.random())

},1000);

setInterval(function(){

	Tgt.tx +=10;
	Tgt.ty +=10;

},10000/25);
