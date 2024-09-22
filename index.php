<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

$host = 'mysql-neo-tetris.alwaysdata.net';
$dbname = 'neo-tetris_score';
$username = '377072';
$password = 'scoringtotetris';

$SQL_GET = 'SELECT * FROM score order by score.score DESC';
$SQL_POST = 'INSERT INTO score (name, score) VALUES (:name, :score)';
$SQL_DELETE = 'DELETE FROM score WHERE id NOT IN ( SELECT id FROM ( SELECT id FROM score ORDER BY score.score DESC LIMIT 10 ) AS tmp )';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {

    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if(count($_POST) > 0){
        $name = substr(strval($_POST['name']), 0, 10);
        $score = intval($_POST['score']);

        if(is_string($name) && is_int($score)){

            // insert un score
            $requete = $pdo->prepare($SQL_POST);
            $requete->bindParam(':name', $name);
            $requete->bindParam(':score', $score);
            $requete->execute();

            // ne garde que les 10 1ers score
            $requete = $pdo->prepare($SQL_DELETE);
            $requete -> execute();
            echo 'ok';
        }else{
            throw new Exception("Erreur : non valide", 1);
        }
    }
    else{
        $requete = $pdo->prepare($SQL_GET);
        $requete -> execute();

        $scoring = $requete->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode($scoring);
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>