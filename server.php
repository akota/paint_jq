<?php

header("Content-Type: text/html; charset=utf-8"); 
    error_reporting(E_ALL); 
	 
	define('KUV_DBPREFIX', 'kuv_'); 
	define('KUV_DBSERVER', 'localhost'); 
	define('KUV_DBUSER', 'root');     
	define('KUV_DBPASSWORD', '');
	define('KUV_DATABASE', 'paint_jq'); 
   
	$id= isset($_GET['id']) ? $_GET['id'] : '';
	$left= isset($_GET['left']) ? $_GET['left'] : '';
	$top = isset($_GET['top']) ? $_GET['top'] : ''; 
	$primitive = isset($_GET['primitive']) ? $_GET['primitive'] : ''; 
	$color = isset($_GET['color']) ? $_GET['color'] : '';
	$get_coords = isset($_GET['get_coords']) ? $_GET['get_coords'] : '';
	$save_move = isset($_GET['save_move']) ? $_GET['save_move'] : '';
	$save_remove = isset($_GET['save_remove']) ? $_GET['save_remove'] : '';
	$save = isset($_GET['save']) ? $_GET['save'] : '';
	$clear = isset($_GET['clear']) ? $_GET['clear'] : '';

	$create = KUV_DBPREFIX.'create';
	$temp = KUV_DBPREFIX.'temp_create';
	
/**
* Класс для работы с базой данных
*/

	class dataBase {

		static private $exemplar;

		public static function getExemplar() {
			if(empty(self::$exemplar))  
				self::$exemplar = new self;
			
			return self::$exemplar;
		}
		
		private function __construct() {
			$connect = mysql_connect(KUV_DBSERVER, KUV_DBUSER, KUV_DBPASSWORD);  
			define('KUV_CONNECT', $connect);
			mysql_select_db(KUV_DATABASE, KUV_CONNECT);
			mysql_query('SET NAMES utf8');		
		}
		
		public function query($sql, $print = false) { 
			$res = mysql_query($sql);
			$this->res = $res;
			
			if($res === false || $print) 
			{ 
			 
				$error =  mysql_error(); 
				$trace =  debug_backtrace(); 
				
				$head = $error ?'<b style="color:red">MySQL error: </b><br> 
				<b style="color:green">'. $error .'</b><br><br>':NULL;     
				 
				$error_log = date("Y-m-d h:i:s") .' '. $head .' 
				<b>Query: </b><br> 
				<pre><span style="color:#CC0000">'. $trace[0]['args'][0] .'</pre></span><br><br>
				<b>File: </b><b style="color:#660099">'. $trace[0]['file'] .'</b><br> 
				<b>Line: </b><b style="color:#660099">'. $trace[0]['line'] .'</b>'; 
				 
				die($error_log); 

				file_put_contents(KUV_ROOT .'/log/mysql.log', strip_tags($error_log) ."\n\n", FILE_APPEND); 
				header("HTTP/1.1 404 Not Found"); 
				die(file_get_contents(KUV_ROOT .'/404.html')); 
			} 
			else 
			return $res;
		}
		
		public function echoResult() {
			while($div = mysql_fetch_array($this->res)) {
				echo $div["id"].' | '.$div["id_div"].' '.$div["left"].' '.$div["top"].' '.$div["date"].' '.$div["color"].' '.'<br>';
			}
		}
		
		private function __clone() {

		}        
	}

	$db = dataBase::getExemplar();
	
/**
* Функция добавления временных фигур на страницу
*/

	if (!empty($id) && !empty($left) && !empty($top) && !empty($primitive) && !empty($color)) {

		$db->query("INSERT INTO `$temp` (`id_fig`, `left`, `top`, `primitive`, `color`)
					VALUES ('$id', '$left', '$top', '$primitive', '$color')");
	}
	
/**
* Функция получения координат сохраненных фигур
*/

	if (!empty($get_coords)) {
		
		$db->query("truncate table `$temp`");
		$db->query("INSERT INTO `$temp` SELECT * FROM `$create`");
		$divs = $db->query("SELECT * FROM `$create`");

		if (mysql_num_rows ($divs) > 0) {
			$i = 0;
			while($div = mysql_fetch_array($divs)) {
				$str[$i]["id"] = $div["id_fig"];
				$str[$i]["left"] = $div["left"];
				$str[$i]["top"] = $div["top"];
				$str[$i]["primitive"] = $div["primitive"];
				$str[$i]["color"] = $div["color"];
				
				$i++;
			}
			echo json_encode($str);
		}

	}
	
/**
* Функция сохранения перемещения
*/

	if (!empty($save_move) && !empty($id) && !empty($left) && !empty($top)) {
		$db->query("UPDATE `$temp` SET `left` = '$left', `top` =  '$top ' WHERE `id_fig` = '$id'");
	}
	
/**
* Функция сохранения удаления
*/

	if (!empty($save_remove) && !empty($id)) {
		$db->query("DELETE FROM `$temp` WHERE  `id_fig` =$id");	
	}
	
/**
* Функция сохранения временных фигур
*/

	if (!empty($save)) {

		$db->query("truncate table `$create`");
		$db->query("INSERT INTO `$create` SELECT * FROM `$temp`");
	}

/**
* Функция очистки всех фигур
*/

	if (!empty($clear)) {
		$db->query("truncate table `$temp`");
		$db->query("truncate table `$create`");	
	}