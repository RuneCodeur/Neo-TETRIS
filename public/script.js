"use strict";

//canelle tazamoucht
const TABlargeur = 7;
const TABhauteur = 15;
const TABdimension = 40;
const comboLimit = 10;
const gameAffichage = document.getElementById('game').children[0];
const scoreAffichage = document.getElementById('score');
const comboAffichage = document.getElementById('combo');
const ensembleMenu = document.getElementById('ensemble-menu');
const Menu = document.getElementById('menu');
const colors = ['dark','blue', 'blueD', 'brown', 'cyan', 'green', 'greenD', 'grey', 'indigo', 'orange', 'pink', 'purple', 'red', 'sarcelle', 'violet', 'yellow'];

const difficulty =[
    {name:"Bébou", interval:600, color:"#FFB6C1"},
    {name:"Très Facile", interval:500, color:"#87CEEB"},
    {name:"Facile", interval:450, color:"#ADFF2F"},
    {name:"Simple", interval:400, color:"#00FA9A"},
    {name:"Normal", interval:350, color:"#FFFFFF"},
    {name:"Difficile", interval:300, color:"#00FFFF"},
    {name:"Hardcore", interval:250, color:"#1E90FF"},
    {name:"Ultra-Hardcore", interval:200, color:"#9370DB"},
    {name:"Turbo-Hardcore", interval:150, color:"#FFD700"},
    {name:"Cauchemard", interval:100, color:"#FF6347"},
    {name:"Préfecture Française", interval:50, color:"#FF4500"}
];

var difficultySelect = 3;
var tetrominos = {};
var score = 0;
var combo = 0;
var cycleId = null;
var controlPiece = false;
var PosiPiece = [];
var orientationPiece = 0;
var colorPiece = '';
var typePiece = '';
var PosiTetros = {};


function init (){
    // recuperation de la liste complète des tetrominos
    fetch('./public/tetrominos.json')
    .then(response => response.json())
    .then(data => tetrominos = data)
    .catch(error => console.error('Erreur :', error));
    showTableau();
}

function showTableau(){
    let tableau = "";
    for (let H = 0; H < TABhauteur; H++) {
        tableau += "<tr>"
        for (let L = 0; L < TABlargeur; L++) {
            let showBloc = '';
            let colorBloc = '';
            
            //blocs actif
            for (let i = 0; i < PosiPiece.length; i++) {
                if(PosiPiece[i][0] == H && PosiPiece[i][1] == L){
                    showBloc = 'bloc';
                    colorBloc = colorPiece;
                }
            }

            // blocs fixe
            if(PosiTetros[H] && PosiTetros[H][L]){
                showBloc = 'bloc';
                colorBloc = PosiTetros[H][L];
            }

            if(colorBloc != ''){
                colorBloc = 'bloc-' + colorBloc
            }

            tableau += "<td style='width:"+TABdimension+"px; min-width:"+TABdimension+"px;height:"+TABdimension+"px; min-height:"+TABdimension+"px;' class='"+showBloc+" "+colorBloc+"' ></td>"
        }
        tableau += "</tr>"
    }
    gameAffichage.innerHTML = tableau;
    scoreAffichage.innerText = score;
    comboAffichage.innerText = combo;
}

function afficheDifficulty(){
    let html =  '<div class="menu-difficulty">'
    html +=         '<div>'
    html +=             '<button onclick="diffDown()"><i class="fas fa-chevron-up"></i></button>'
    html +=             '<p id="difficulty-menu" style="color:'+difficulty[difficultySelect].color+'">'+difficulty[difficultySelect].name+'</p>'
    html +=             '<button onclick="diffUp()"><i class="fas fa-chevron-down"></i></button>'
    html +=         '</div>'
    html +=     '</div>'
    return html;
}

function diffDown(){
    if(difficultySelect > 0){
        difficultySelect --;
        let showDifficulty = document.getElementById('difficulty-menu');
        showDifficulty.style.color = difficulty[difficultySelect].color;
        showDifficulty.innerText = difficulty[difficultySelect].name;
    }
}

function diffUp(){
    if(difficultySelect < (difficulty.length-1)){
        difficultySelect ++;
        let showDifficulty = document.getElementById('difficulty-menu');
        showDifficulty.style.color = difficulty[difficultySelect].color;
        showDifficulty.innerText = difficulty[difficultySelect].name;
    }
}

async function menu(etat = 0){
    switch (etat) {

        //menu principal
        case 1:
            Menu.innerHTML = "<h1>TETRIS</h1>"+afficheDifficulty()+"<button onclick='menu(4)'>START</button> <p class='info'> Info : vous pouvez jouer avec les flèches du clavier</p>"
            ensembleMenu.style.display='flex';
            setTimeout(function() { 
                ensembleMenu.style.opacity='1';
            }, 200)
            break;

        // pause
        case 2:
            stopCycle();
            Menu.innerHTML = "<h1>PAUSE</h1><button onclick='menu()'>PLAY</button> <button onclick='menu(1)'>RETRY</button>"
            ensembleMenu.style.display='flex';
            setTimeout(function() { 
                ensembleMenu.style.opacity='1';
            }, 200);
            break;

        // game over
        case 3:
            stopCycle();
            Menu.innerHTML = "<h1>GAME OVER</h1> <p class='score'>SCORE : <b>"+ score +"</b> </p> "+afficheDifficulty()+"<button onclick='menu(4)'>RETRY</button>";
            ensembleMenu.style.display='flex';
            setTimeout(function() { 
                ensembleMenu.style.opacity='1';
            }, 200);
            break;

        // recommence la partie
        case 4:
            score = 0;
            controlPiece = false;
            PosiPiece = [];
            PosiTetros = {};
            init();
            ensembleMenu.style.opacity='0';
            setTimeout(function() { 
                ensembleMenu.style.display='none';
            }, 500);
            cycle();
            break;
    
        // relance la partie mis en pause
        default:
            ensembleMenu.style.opacity='0';
            setTimeout(function() { 
                ensembleMenu.style.display='none';
            }, 500)
            cycle();
            break;
    }
}

function gameplayClavier(event){
    let touche = event.key
    switch (touche) {
        case 'ArrowLeft':
            move(1);
            break;
        case 'ArrowRight':
            move(2);
            break;
        case 'ArrowDown':
            move(3);
            break;
        case 'ArrowUp':
            move();
            break;
    }
}

function move(etat = 0){

    if(controlPiece){
        switch (etat) {
            case 1:
                moveLateral('left');
                break;
            case 2:
                moveLateral('right');
                break;
            case 3:
                moveDown();
                break;
        
            default:
                moveRotate();
                break;
        }
        showTableau();
    }
}

function moveRotate(){

    let initPosi = PosiPiece[0];
    let newPosi = [];
    let deplacementIsOk = false;

    if(tetrominos[typePiece].position[orientationPiece+1]){
        orientationPiece ++;
    }else{
        orientationPiece = 0;
    }

    for (let i = 0; i < tetrominos[typePiece].position[orientationPiece].length; i++) {
        let newH = tetrominos[typePiece].position[orientationPiece][i][0] + initPosi[0]
        let newL = tetrominos[typePiece].position[orientationPiece][i][1] + initPosi[1]
        newPosi.push([newH, newL]);
    }

    newPosi = ajusteNewPosi(newPosi);

    if(!testConflict(newPosi)){
        deplacementIsOk = true;
    }

    if(deplacementIsOk){
        deplacementTetromino(newPosi);
    }
}

function ajusteNewPosi(newPosi){

    let maxH = 0;
    let minH = 0;
    let maxL = 0;
    let minL = 0;

    for (let i = 0; i < newPosi.length; i++) {

        if (i == 0) {
            maxH = newPosi[1][0];
            minH = newPosi[1][0];
            maxL = newPosi[1][1];
            minL = newPosi[1][1];
        }else{

            if (newPosi[i][0] > maxH){
                maxH = newPosi[i][0];
            }
            if (newPosi[i][0] < minH){
                minH = newPosi[i][0];
            }
            if (newPosi[i][1] > maxL){
                maxL = newPosi[i][1];
            }
            if (newPosi[i][1] < minL){
                minL = newPosi[i][1];
            }
        }
    }

    let decalH = 0;
    let decalL = 0;

    if(maxH >= TABhauteur){
        decalH = TABhauteur - (maxH+1)
    }
    if(minH < 0){
        decalH = - minH
    }
    if(maxL >= TABlargeur){
        decalL = TABlargeur - (maxL+1)
    }
    if(minL < 0){
        decalL = - minL
    }

    for (let i = 0; i < newPosi.length; i++) {
        newPosi[i][0] = newPosi[i][0] + decalH;
        newPosi[i][1] = newPosi[i][1] + decalL;
    }

    return newPosi;
}

function moveLateral(direction){
    let newPosi = [];
    let deplacementIsOk = true;
    for (let i = 0; i < PosiPiece.length; i++) {
        let posiLateral = PosiPiece[i][1];
        if (direction == 'left'){
            posiLateral -= 1;
        }else if(direction == 'right'){
            posiLateral += 1;
        }
        newPosi.push([(PosiPiece[i][0]), posiLateral]);
    }
    if(testConflict(newPosi)){
        deplacementIsOk = false;
    }
    if(deplacementIsOk){
        deplacementTetromino(newPosi);
    }
}


function moveDown(){
    let newPosi = [];
    let deplacementIsOk = true;
    for (let i = 0; i < PosiPiece.length; i++) {
        newPosi.push([(PosiPiece[i][0] + 1), PosiPiece[i][1]]);
    }
    if(testConflict(newPosi)){
        deplacementIsOk = false;
    }
    if(deplacementIsOk){
        deplacementTetromino(newPosi);
    }else{
        fixeTetromino();
    }
}

function fixeTetromino(){
    controlPiece = false;
    for (let i = 0; i < PosiPiece.length; i++) {
        if(!PosiTetros[PosiPiece[i][0]]){
            PosiTetros[PosiPiece[i][0]] = {}
        }
        PosiTetros[PosiPiece[i][0]][PosiPiece[i][1]] = colorPiece;
    }
    PosiPiece = [];
    testLign();
}

function deplacementTetromino(newPosi){
    PosiPiece = [];
    for (let i = 0; i < newPosi.length; i++) {
        PosiPiece.push([newPosi[i][0], newPosi[i][1]]);
    }
}

function testConflict(newPosi){
    for (let i = 0; i < newPosi.length; i++) {
        if(conflictLimit(newPosi[i]) || conflict2Tetro(newPosi[i])){
            return true;
        }
    }
    return false;
}

// retourne FASLE si la nouvelle position ne dépasse pas les limites du jeu
function conflictLimit(posi){
    if(posi[0] >= TABhauteur || posi[0] < 0 || posi[1] >= TABlargeur || posi[1] < 0){
        return true;
    }else{
        return false;
    }
}

// retourne FALSE si pas de conflict entre les tetrominos déja placé et la nouvelle position
function conflict2Tetro(posi) {
    if(PosiTetros[posi[0]]){
        if(PosiTetros[posi[0]][posi[1]]){
            return true;
        }
    }
    return false;
}

async function testLign() {
    let lign = 0;
    for (let H in PosiTetros) {
        let count = 0
        for (let L in PosiTetros[H]) {
            count ++;
        }
        if(count == TABlargeur){
            deleteLign(H);
            lign ++;
        }
    }
    if(lign > 0){
        calculScore(lign);
    }
}

function calculScore(lign){
    for (let i = 0; i < lign; i++) {
        score += (100 + (100*difficultySelect)) * (1 + (0.5*i));
        combo ++;
    }

    if( combo >= comboLimit && difficultySelect < difficulty.length){
        combo = 0;
        difficultySelect ++;
        stopCycle();
        cycle();
    }
}

async function deleteLign(lign){

    PosiTetros[lign] = {};

    let PosiTetrosOLD = JSON.parse(JSON.stringify(PosiTetros));
    for (let H = TABhauteur-1; H > 0; H--) {
        
        if(H <= lign){
            if(PosiTetrosOLD[parseInt(H)-1]){
                PosiTetros[H] = PosiTetrosOLD[parseInt(H)-1];
            }else{
                PosiTetros[H] = {};
            }
        }
    }
}

function newColor(){
    let color = Math.floor(Math.random()*colors.length);
    if( colors[color] == colorPiece){
        return newColor();
    }else{
        return colors[color];
    }
}

function dropPiece(){
    let midRow = Math.floor(TABlargeur/2);
    let randomPiece = Math.floor(Math.random()*tetrominos.length);
    let blocks = tetrominos[randomPiece].position[0];
    

    colorPiece = newColor();
    orientationPiece = 0;
    typePiece = randomPiece;
    
    for (let i = 0; i < blocks.length; i++) {
        PosiPiece.push([blocks[i][0], (blocks[i][1] + midRow)]);
    }

    if( testConflict(PosiPiece)){
        menu(3);
    }else{
        controlPiece = true;
        showTableau();
    }

}

function cycle(){
    let showDifficulty = document.getElementById('difficulty-gameplay');
    showDifficulty.style.color= difficulty[difficultySelect].color;
    showDifficulty.innerText = difficulty[difficultySelect].name;

    cycleId = setInterval(function() {
        if(!controlPiece){
            dropPiece();
        }else{
            move(3);
        }
    }, difficulty[difficultySelect].interval); 
}

function stopCycle(){
    clearInterval(cycleId);
}

init();
menu(1);
document.addEventListener('keydown', gameplayClavier);