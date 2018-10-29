$(document).ready(function() {

	//初始化
	var scrollnum = 0; //背景滚动数值
	var gravity = 2; //重力
	screenwidth = $(window).width();
	screenheight = $(window).height();
	$canvasbox = $(".gamebox");
	var gamecanvas = $(".gamebox")[0].getContext('2d');
	$(".gamebox").css({
		"width": screenwidth * 0.8 + "px",
		"height": screenheight * 0.8 + "px",
		"left": "10%",
		"top": "10%"
	});
	var canvas_width = screenwidth * 0.8;
	var canvas_height = screenheight * 0.8;

	//加载资源
	var bgpic = new Array(2);
	var manrunpic = new Array(5);
	var stonepic = new Array(4);
	var manjumppic = new Array(7);
	var manfalldownpic = new Array(4);
	for(var i = 0; i < 5; i++) {
		manrunpic[i] = new Image();
		manrunpic[i].src = "img/MatchMan/run/" + i + ".png";
	}
	for(var i = 0; i < 1; i++) {
		bgpic[i] = new Image();
		bgpic[i].src = "img/BG/bg1.png";
	}
	for(var i = 0; i < 4; i++) {
		stonepic[i] = new Image();
		stonepic[i].src = "img/Stone/stone" + i + ".png"

	}
	for(var i = 0; i < 7; i++) {
		manjumppic[i] = new Image();
		manjumppic[i].src = "img/MatchMan/jump/jump" + i + ".png"
	}
	for(var i = 0; i < 4; i++) {
		manfalldownpic[i] = new Image();
		manfalldownpic[i].src = "img/MatchMan/falldown/falldown" + i + ".png";
	}
	//声明对象
	var man1 = new MatchMan(100, 500);
	var stones = new Array();

	//	document.onkeydown = function(event) {
	//
	//		man1.changedirection(event.keyCode);
	//	};
	//	document.onkeyup = function(event) {
	//		man1.status = 0;
	//	}

	var key_pressed = {};

	document.addEventListener("keyup", function(e) {

		key_pressed[e.keyCode] = false;

	});

	document.addEventListener("keydown", function(e) {

		key_pressed[e.keyCode] = true;

	});
	//循环检测组合按键
	setInterval(function() {
		if(key_pressed[68] == true) man1.changedirection(68);
		if(key_pressed[65] == true) man1.changedirection(65);
		if(key_pressed[65] == false && key_pressed[68] == false) man1.status = 0;
		if(key_pressed[75] == true) man1.jump();

	}, 50);

	//火柴人类
	function MatchMan(x, y) {
		this.width;
		this.height;
		this.rundistance = 0;
		this.status = 0; //0站立 1跑动 
		this.isjump = false;
		this.isfalldown = false;
		this.pos_x = x;
		this.pos_y = y;
		this.speed = 5;
		this.speedup = 10;
		this.nowpage = 0;
		this.direction = 68; //68正向，65反向
		this.changedirection = function(direction) {
			//状态设置为跑动
			this.status = 1;
			this.direction = direction;
		}
		this.move = function() {

			if(this.isfalldown == true) {
				this.pos_y-=5;
				this.nowpage++;
				if(this.nowpage > 3) {
					this.nowpage = 3;
					this.pos_y+=5;
					gameover();
				}
				return false;
			}
			//A=65,D=68
			if(this.status == 1) {
				if(this.direction == 68) {
					this.pos_x += this.speed;
				} else if(this.direction == 65) {
					this.pos_x -= this.speed * 1.5;
				}

			}

			if(this.isjump == true) {
				this.pos_y -= this.speedup;
				this.speedup -= gravity;
				if(this.pos_y >= y) {
					this.speedup = y;
					this.isjump = false;
				}
			}

			this.nowpage++;
			this.rundistance += 10;

			if(this.isjump == false) {
				if(this.nowpage > 4) {
					this.nowpage = 0;
					if(man1.status == 1) {
						if(this.direction == 68) this.pos_x += 20;

					}

				}
			} else if(this.isjump == true) {
				if(this.nowpage > 6) {
					this.nowpage = 0;
				}
			}

		}
		this.jump = function() {
			if(this.isjump == false) {
				this.speedup = 10;
				this.isjump = true;
				this.nowpage = 0;
			}

		}

	}
	//石头类
	function Stone() {
		this.mytype=0;
		this.myscrollnum = 0;
		this.pos_x;
		this.pos_y;
	}
	//所有绘制放在一起
	function draw() {
		
		drawbg();
		drawman();
		drawobstacle();
		drawtext();

	}
	//画火柴人
	function drawman() {
		man1.move();
		if(man1.isfalldown == true) {
			gamecanvas.drawImage(manfalldownpic[man1.nowpage], man1.pos_x, man1.pos_y+30);
			man1.width = manfalldownpic[man1.nowpage].width;
			man1.height = manfalldownpic[man1.nowpage].height;
		} else if(man1.isjump == false) {
			gamecanvas.drawImage(manrunpic[man1.nowpage], man1.pos_x, man1.pos_y);
			man1.width = manrunpic[man1.nowpage].width;
			man1.height = manrunpic[man1.nowpage].height;
		} else if(man1.isjump == true) {
			gamecanvas.drawImage(manjumppic[man1.nowpage], man1.pos_x, man1.pos_y);
			man1.width = manjumppic[man1.nowpage].width;
			man1.height = manjumppic[man1.nowpage].height;

		}

	}

	function drawbg() {
		gamecanvas.drawImage(bgpic[0], 0 - scrollnum, 0, screenwidth, screenheight);
		gamecanvas.drawImage(bgpic[0], screenwidth - 0 - scrollnum, 0, screenwidth, screenheight);
		scrollnum += 10;
		if(scrollnum >= screenwidth) scrollnum = 0;
	}

	var stonedistance = 0; //两个石头产生之间的距离
	//随机产生石头
	function producestone() {
		var randnum = Math.floor(Math.random() * 100);

		if(randnum > 0 && randnum <= 5 && stones.length < 5 && stonedistance >= 100) {
			var newstone = new Stone();
			newstone.pos_y = 540;
			newstone.mytype=Math.floor(Math.random()*3);
			stones.push(newstone);
			stonedistance = 0;
		}
		stonedistance += 10;

	}
	//画石头
	function drawobstacle() {
		producestone();
		if(stones.length > 0) {
			var i = 0;
			for(i = 0; i < stones.length; i++) {
				gamecanvas.drawImage(stonepic[stones[i].mytype], screenwidth - 0 - stones[i].myscrollnum, 540);
				stones[i].pos_x = screenwidth - 0 - stones[i].myscrollnum;
				stones[i].myscrollnum += 10;

			}
			if(stones[0].myscrollnum > screenwidth) {
				stones.shift();
			}

		}

	}
	//火柴人和物品进行碰撞检测
	function hittest(man, obj) {
		var judge = 0;
		if(obj.pos_x - man.pos_x > 0 && obj.pos_x - man.pos_x + 20 < man1.width) judge++;
		if(obj.pos_y - man.pos_y > 0 && obj.pos_y - man.pos_y < man1.height) judge++;
		if(obj.pos_x - man.pos_x < 0 && man.pos_x  - obj.pos_x < man1.width) judge++;

		if(judge >= 2) {
			return true;
		} else return false;

	}
	//检测所有碰撞
	function testallhit() {
		var testresult;
		for(var i = 0; i < stones.length; i++) {
			testresult = hittest(man1, stones[i]);
			if(testresult == true) {
				man1.nowpage = 0;
				man1.isfalldown = true;
			}

		}
	}

	function gameover() {
		gamecanvas.font = "100px Georgia";
		gamecanvas.fillText("游戏结束得分:" + man1.rundistance, 150, 150);

	}

	//绘制文本
	function drawtext() {
		gamecanvas.font = "50px Georgia";
		gamecanvas.fillText("跑过的距离:" + man1.rundistance, 50, 50);
		gamecanvas.font = "30px Georgia";
	gamecanvas.fillText("操作方法：A D 控制左右跑动,K跳跃 躲避石头，被石头绊脚摔倒会使游戏结束！",0,700);
	}
	


	//循环动画
	setInterval(function() {
		draw();
		testallhit();
	}, 100);

})