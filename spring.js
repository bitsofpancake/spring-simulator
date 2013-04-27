function Renderer(canvas, width, height, render) {
	this.canvas = canvas;
	canvas.width = width;
	canvas.height = height;
	
	var context = this.context = canvas.getContext('2d');
	this.render = function () {
		context.clearRect(0, 0, width, height);
		render.apply(context, arguments);
	};
}

function control(id, value, callback) {
	var control = document.getElementById(id).querySelector('input');
	var val = document.getElementById(id).querySelector('span');

	control.onchange = function () {
		val.innerHTML = value(+this.value).toFixed(2);
		callback(value(+this.value));
	};
	control.onchange();
}

window.onload = function () {
	var sin = Math.sin;
	var cos = Math.cos;
	var PI = Math.PI;
	
	var WIDTH = 900;
	var HEIGHT = 700;
	var SPRING_WIDTH = 80;
	var STRING_POS = WIDTH * 4 / 5;
	var BLOCK_WIDTH = 220;
	var BLOCK_HEIGHT = 150;
	var SPRING_BUFFER_HEIGHT = 25;
	var SPRING_EQUIL_Y = (HEIGHT - BLOCK_HEIGHT) / 2;
	var GRAPH_PERIOD = 4000;

	var spring = new Renderer(document.getElementById('spring'), WIDTH, HEIGHT, function (n, height) {
		this.drawImage(graph.canvas, 0, 0);
		
		this.globalAlpha = 0.8;
		this.lineWidth = 5;
		this.beginPath();
		this.moveTo(STRING_POS, 0);
		this.arc(STRING_POS, 0, 12, 0, 2 * PI);
		this.fill();
		
		// omega = 2 pi / "period"
		height -= SPRING_BUFFER_HEIGHT * 2;
		var omega = 2 * PI / (height / n);
		this.beginPath();
		this.moveTo(STRING_POS, 0);
		for (var t = 0; t < height; t += 0.01)
			this.lineTo(STRING_POS + SPRING_WIDTH * sin(omega * t), t + SPRING_BUFFER_HEIGHT);
			
		height += SPRING_BUFFER_HEIGHT * 2;
		this.lineTo(STRING_POS, height);
		this.stroke();
		
		// Draw the block
		this.fillStyle = 'yellow';
		this.beginPath();
		this.rect(STRING_POS - BLOCK_WIDTH / 2, height, BLOCK_WIDTH, BLOCK_HEIGHT);
		this.fill();
		this.stroke();
		this.globalAlpha = 1;	
		
		this.beginPath();
		this.fillStyle = 'black';
		this.arc(STRING_POS, height, 12, 0, 2 * PI);
		this.fill();
	});
	
	// Trace the block as it moves.
	var graph = new Renderer(document.createElement('canvas'), WIDTH, HEIGHT, function (time) {
		// Draw a line at equilibrium position
		this.beginPath();
		this.strokeStyle = '#ccc';
		this.lineWidth = 3;
		this.moveTo(0, SPRING_EQUIL_Y + BLOCK_HEIGHT / 2);
		this.lineTo(WIDTH, SPRING_EQUIL_Y + BLOCK_HEIGHT / 2);
		this.stroke();
		
		// Draw line.
		this.strokeStyle = 'violet';
		this.beginPath();
		for (var i = 0; i < graph.points.length; i++)
			this.lineTo((1 - (time - graph.points[i][0]) / GRAPH_PERIOD) * STRING_POS, graph.points[i][1]);
		this.stroke();
		
	});
	graph.points = [];
	graph.push = function (t, y) {
		if (graph.points.push([t, y + BLOCK_HEIGHT / 2]) > 500)
			graph.points.shift();
	};
	
	var y = 500; // pixels
	var v = 0; // pixels / second
	var t0 = 0;
	
	// Modify our constants
	var m, k, b;
	var f = function (t) { return 0; }; // mass * pixels / second^2
	
	var id = function (x) { return x; };
	control('m', id, function (m_) { m = m_; });
	control('b', id, function (b_) { b = b_; });
	control('k', Math.exp, function (k_) { k = k_; });
	
	requestAnimationFrame(function step(t) {
		graph.push(t, y);
		graph.render(t);
		
		// Spring constant is proportional to number of coils cubed
		spring.render(Math.round(Math.pow(k, 1 / 2)), y);
		
		// Numerically integrate
		var dt = (t - t0) / 1000;
		y += v * dt;
		v += (-b * v - k * (y - SPRING_EQUIL_Y) - f(t)) * dt / m;
		
		t0 = t;
		
		// Uh, we broke something.
		if (Math.abs(y) > HEIGHT * 10 || Math.abs(v) > HEIGHT * 10) {
			y = 500;
			v = 0;
			graph.points = [];
			
			spring.context.fillStyle = 'red';
			spring.context.rect(0, 0, WIDTH, HEIGHT);
			spring.context.fill();
			
			setTimeout(step, 3000);
			return;
		}
		
		requestAnimationFrame(step);
	});
	
	
};