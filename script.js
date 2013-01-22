jQuery(function(){
	
	/**
	* Объект доска
	* Публичный метод addChild(Добавление фигуры на доску)
	* Создает событие addChild
	* Публичный метод removeChild(Удаление фигур с доски)
	* Создает событие removeChild
	* Публичный метод moveChild(Перемещение фигуры по доске) 
	* Создает событие moveChild
	*/
	
	function board(options) {
	
		var self = this;
		var elem = options.elem;
		var figura = new figure({parent: elem});

		elem.on('mousedown', onFigureClick)
			.on('click', onBoardClick)
			.on('dblclick', onFigureDBClick)
			.on('mousedown selectstart', false);
			
		function onBoardClick(e) {
			if ($(e.target).hasClass('board'))
				self.addChild(e);
		}
		
		function onFigureClick(e) {
			if ($(e.target).hasClass('figure'))
				self.moveChild(e);
		};

		function onFigureDBClick(e) {
			if ($(e.target).hasClass('figure'))
				self.removeChild(e);
		};
		
		this.addChild = function(e) {
			elem.triggerHandler({ 
				type: 'addChild',
				left: e.pageX,
				top: e.pageY
			});
		};
		
		this.removeChild = function(e) {
			elem.triggerHandler({ 
				type: 'removeChild',
				figure: $(e.target)
			});
		};
		
		this.moveChild = function(e) {
			var figure = $(e.target);
			var shiftX = e.pageX - figure.offset().left;
			var shiftY = e.pageY - figure.offset().top;
			
			document.onmousemove = function(e) {
				elem.triggerHandler({ 
					type: 'moveChild',
					figure: figure,
					left: e.pageX - shiftX,
					top: e.pageY - shiftY
				});
			};
			
			document.onmouseup = function(e) {
				
				document.onmousemove = null;
				
				var figure = $(e.target);
				var left = e.pageX - shiftX
				var top = e.pageY - shiftY
				
				if (figure.hasClass('figure')) {
				
					if(figure.offset().left < elem.offset().left) {
						left = elem.offset().left;
					}
					
					if(figure.offset().left + figure.width() > elem.offset().left + elem.width()) {
						left = elem.offset().left + elem.width() - figure.width();
					}
					
					if(figure.offset().top < elem.offset().top) {
						top = elem.offset().top;
					}
					
					if(figure.offset().top + figure.height() > elem.offset().top + elem.height()) {
						top = elem.offset().top + elem.height() - figure.height();
					}
					
					elem.triggerHandler({ 
						type: 'overBoard',
						figure: figure,
						left: left,
						top: top
					});
						
					elem.triggerHandler({ 
						type: 'endMoveChild',
						id: figure.attr('id'),
						left: left,
						top: top
					});
				}
			};
		}
	}
	
	/**
	* Объект фигура
	* Приватный метод add(Добавление фигуры)
	* Создает событие addFigure
	* Приватный метод remove(Удаление фигуры) 
	* Приватный метод move(Перемещение фигуры)
	* Приватный метод animateMove(Анимированное перемещение фигуры)
	* Приватный метод changePrimitive(Изменение примитива) 
	* Приватный метод changeColor(Изменение цвета) 
	*/
	
	function figure(options) {
		
		var parent = options.parent;
		var primitive = 'square';
		var color = 'LawnGreen';
		
		parent.on('addChild', add);
		parent.on('removeChild', remove);
		parent.on('moveChild', move);
		parent.on('overBoard', animateMove);
		$('.primitive').on('changePrimitive', changePrimitive);
		$('.palette').on('changeColor', changeColor);

		function add(e) {

			$('<div/>', {id: last_id, class: 'figure'})
			.addClass(primitive)
			.addClass(color)
			.css({left: e.left - $('.'+primitive).width()/2, top: e.top - $('.'+primitive).height()/2})
			.appendTo(parent);
			
			$(parent).triggerHandler({ 
				type: 'addFigure',
				id: last_id,
				left: e.left - $('.'+primitive).width()/2,
				top: e.top - $('.'+primitive).height()/2,
				primitive: primitive,
				color: color
			});
			
			last_id++;
		};
		
		function remove(e) {
			e.figure.remove();
		};

		function move(e) {
			e.figure.css({left: e.left, top: e.top});
		};
		
		function animateMove(e) {
			e.figure.animate({left: e.left, top: e.top});
		};
		
		function changePrimitive(e) {
			primitive = e.primitive;
		};
		
		function changeColor(e) {
			color = e.color;
		};
	}
	
	/**
	* Объект примитив
	* Приватный метод onPrimitiveClick(изменение примитива)
	* Создает событие changePrimitive
	*/
	
	function primitive(options) {
	
		var elem = options.elem;
	
		elem.on('click', onPrimitiveClick);
		
		function onPrimitiveClick(e) {
			elem.triggerHandler({ 
				type: 'changePrimitive',
				primitive: $(e.target).attr('class')
			});
		}
	}
	
	/**
	* Объект палитра
	* Приватный метод onPaletteClick(изменение цвета)
	* Создает событие changeColor
	*/
	
	function palette(options) {
	
		var elem = options.elem;
		
		elem.on('click', onPaletteClick);
		
		function onPaletteClick(e) {
			elem.triggerHandler({ 
				type: 'changeColor',
				color: $(e.target).attr('class')
			});
		}
	}
	
	/**
	* Объект сохранения в базу
	* Приватный метод saveTemp(Сохранение временных фигур)
	* Приватный метод saveMove(Сохранение перемещения фигур)
	* Приватный метод saveRemove(Сохранение удаления фигур)
	* Публичный метод save(Сохранение всех фигур)
	* Публичный метод clear(Очистка всех фигур)
	* Публичный метод clearTemp(Очистка временных фигур)
	* Публичный метод getCoords(Получение координат фигур при загрузке)
	* Приватный метод AddDivLoad(Создание фигур из полученных координат)
	*/
	
	function save(options) {
		
		$('.board').on('addFigure', saveTemp);
		$('.board').on('endMoveChild', saveMove);
		$('.board').on('removeChild', saveRemove);
		
		function saveTemp(e) {
			$.ajax({
				url: 'server.php?id='+e.id+'&left='+e.left+'&top='+e.top+'&primitive='+e.primitive+'&color='+e.color,
				cache: false,
			});
		}
		
		function saveMove(e) {
			$.ajax({
				url: 'server.php?save_move=true'+'&id='+e.id+'&left='+e.left+'&top='+e.top,
				cache: false,	
			});
		}
		
		function saveRemove(e) {	
			$.ajax({
				url: 'server.php?save_remove=true'+'&id='+e.figure.attr('id'),
				cache: false,	
			});
		}
		
		this.save = function(e) {
			$.ajax({
				url: 'server.php?save=true',
				cache: false,	
			});
		}
		
		this.clear = function(e) {
			$.ajax({
				url: 'server.php?clear=true',
				cache: false,
				success: function(answer){
					window.location.reload();
				}
			});
		}
		
		this.clearTemp = function(e) {
			window.location.reload();
		}
		
		this.getCoords = function () {

			$.ajax({
				url: 'server.php?get_coords=true',
				cache: false,
				success: function(answer){
					if(answer !='') {
						var coords = eval(answer);
						for(var count = 0; count < coords.length; count++) {
							AddDivLoad(coords, count);
						}
						last_id = +coords[coords.length-1].id + 1;
					}
				}
			});
		}
		
		function AddDivLoad(coords, count) {
			$('<div/>', {id: coords[count].id, class: 'figure'})
			.addClass(coords[count].primitive)
			.addClass(coords[count].color)
			.css({left: +coords[count].left, top: +coords[count].top})
			.appendTo('.board');
		}
	}
	
	var last_id = 1;
	
	new board({ 
		elem: $('.board'),
	});
	
	new primitive({ 
		elem: $('.primitive')
	});
	
	new palette({ 
		elem: $('.palette')
	});
	
	var save = new save({});
	save.getCoords();
	$('.save').on('click', save.save)
	$('.clear').on('click', save.clear)
	$('.cleartemp').on('click', save.clearTemp)
	
});