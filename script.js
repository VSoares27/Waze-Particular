class Terreno {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.isCaminho = false;
    }
    obterCusto() { return 1; }
    ehPassavel() { return true; }
    obterClasseCSS() { return ''; }
}

class Rua extends Terreno {
    constructor(x, y) {
        super(x, y);
        this.temTransito = false;
    }

    ehPassavel() { 
        return !this.temTransito; 
    }
    
    obterCusto() { 
        return 1; 
    }

    obterClasseCSS() { 
        return this.temTransito ? 'engarrafamento' : 'rua'; 
    }
}

class Predio extends Terreno {
    ehPassavel() { return false; }
    obterCusto() { return Infinity; }
    obterClasseCSS() { return 'predio'; }
}

const LINHAS = 20;
const COLUNAS = 20;


let pontoA = null; 
let pontoB = null; 

let mapa = []; 
let ferramentaAtual = 'pontoa';


// Nossa nova função com Geração Procedural (Aleatória)
function inicializarMapa() {
    mapa = []; 
    
    for (let i = 0; i < LINHAS; i++) {
        mapa[i] = []; 
        
        for (let j = 0; j < COLUNAS; j++) {
            if ((pontoA !== null && j === pontoA.x && i === pontoA.y) || 
                (pontoB !== null && j === pontoB.x && i === pontoB.y)) {
                mapa[i][j] = new Rua(j, i);
                continue; 
            }

            let sorteioTerreno = Math.random(); 

            // 25% de chance de ser Prédio
            if (sorteioTerreno < 0.25) { 
                mapa[i][j] = new Predio(j, i);
            } 
            else {
                let novaRua = new Rua(j, i);
                
                // 15% de chance de ter Trânsito
                if (Math.random() < 0.15) {
                    novaRua.temTransito = true;
                }
                
                mapa[i][j] = novaRua;
            }
        }
    }
}

function desenharTela() {
    const tabuleiro = document.getElementById('tabuleiro');
    tabuleiro.innerHTML = ''; 

    // ADICIONE ESTAS DUAS LINHAS AQUI:
    tabuleiro.style.gridTemplateColumns = `repeat(${COLUNAS}, 40px)`;
    tabuleiro.style.gridTemplateRows = `repeat(${LINHAS}, 40px)`;

    for (let i = 0; i < LINHAS; i++) {
        for (let j = 0; j < COLUNAS; j++) {
            const celula = mapa[i][j]; 
            
            const div = document.createElement('div');
            div.classList.add('celula');
            div.classList.add(celula.obterClasseCSS()); 


            let isPontoA = (pontoA !== null && i === pontoA.y && j === pontoA.x);
            let isPontoB = (pontoB !== null && i === pontoB.y && j === pontoB.x);

            if (isPontoA) {
                div.classList.add('ponto-a'); // O Ponto A é o rei, ganha a cor dele
            } 
            else if (isPontoB) {
                div.classList.add('ponto-b'); // O Ponto B também mantém sua cor
            } 
            else if (celula.isCaminho) {
                div.classList.add('caminho'); // O caminho só é pintado se a célula não for o Ponto A nem o B
            }


            div.addEventListener('click', () => {
                if ((pontoA !== null && j === pontoA.x && i === pontoA.y) || 
                    (pontoB !== null && j === pontoB.x && i === pontoB.y)) {
                    
                    if (ferramentaAtual !== 'pontoa' && ferramentaAtual !== 'pontob') return;
                }

                else if (ferramentaAtual === 'pontoa') {
                    if (pontoB !== null && j === pontoB.x && i === pontoB.y) {
                        alert("O Ponto A não pode ficar no mesmo lugar que o Ponto B!");
                        return;
                    }

                    pontoA = { x: j, y: i };

                    mapa[i][j] = new Rua(j, i);
                    limparCaminhoAntigo(); 
                } 

                else if (ferramentaAtual === 'pontob') {
                    if (pontoA !== null && j === pontoA.x && i === pontoA.y) {
                        alert("O Ponto B não pode ficar no mesmo lugar que o Ponto A!");
                        return;
                    }

                    pontoB = { x: j, y: i };
                    
                    mapa[i][j] = new Rua(j, i);
                    limparCaminhoAntigo();
                }

                desenharTela(); 
            });

            tabuleiro.appendChild(div);
        }
    }
}

function calcularHeuristica(noAtual, noDestino) {
    return Math.abs(noAtual.x - noDestino.x) + Math.abs(noAtual.y - noDestino.y);
}

function obterVizinhos(celula) {
    let vizinhos = [];
    const { x, y } = celula;
    if (y > 0) vizinhos.push(mapa[y - 1][x]); 
    if (y < LINHAS - 1) vizinhos.push(mapa[y + 1][x]); 
    if (x > 0) vizinhos.push(mapa[y][x - 1]); 
    if (x < COLUNAS - 1) vizinhos.push(mapa[y][x + 1]); 
    return vizinhos;
}

function tracarRota() {
    if (pontoA === null || pontoB === null) {
        alert("Por favor, posicione o Ponto A e o Ponto B no mapa antes de traçar a rota.");
        return; // Sai da função imediatamente
    }

    for (let i = 0; i < LINHAS; i++) {
        for (let j = 0; j < COLUNAS; j++) {
            mapa[i][j].isCaminho = false;
        }
    }

    let celulaInicial = mapa[pontoA.y][pontoA.x];
    let celulaFinal = mapa[pontoB.y][pontoB.x];

    let openSet = [celulaInicial]; 
    let cameFrom = new Map(); 

    let gScore = new Map(); 
    gScore.set(celulaInicial, 0);

    let fScore = new Map(); 
    fScore.set(celulaInicial, calcularHeuristica(celulaInicial, celulaFinal));

    let limiteIteracoes = 0;
    const MAX_ITERACOES = LINHAS * COLUNAS * 4; 

    while (openSet.length > 0) {
        limiteIteracoes++;
        if (limiteIteracoes > MAX_ITERACOES) {
            console.error("Loop infinito evitado!");
            break;
        }

        let atual = openSet[0];
        for (let i = 1; i < openSet.length; i++) {
            let no = openSet[i];
            let fAtual = fScore.has(atual) ? fScore.get(atual) : Infinity;
            let fNo = fScore.has(no) ? fScore.get(no) : Infinity;
            if (fNo < fAtual) {
                atual = no;
            }
        }

        if (atual === celulaFinal) {
            while (cameFrom.has(atual)) {
                atual.isCaminho = true;
                atual = cameFrom.get(atual);
            }
            celulaInicial.isCaminho = true;
            desenharTela(); 
            return; 
        }

        let index = openSet.indexOf(atual);
        if (index > -1) openSet.splice(index, 1);

        let vizinhos = obterVizinhos(atual);
        for (let vizinho of vizinhos) {
            if (!vizinho.ehPassavel()) continue;

            let gAtual = gScore.has(atual) ? gScore.get(atual) : Infinity;
            let tentativeGScore = gAtual + vizinho.obterCusto();

            let gVizinho = gScore.has(vizinho) ? gScore.get(vizinho) : Infinity;

            if (tentativeGScore < gVizinho) {
                cameFrom.set(vizinho, atual);
                gScore.set(vizinho, tentativeGScore);
                fScore.set(vizinho, tentativeGScore + calcularHeuristica(vizinho, celulaFinal));
                
                if (!openSet.includes(vizinho)) openSet.push(vizinho);
            }
        }
    }

    alert("Não há um caminho possível! O carro está preso.");
    desenharTela();
}

function limparCaminhoAntigo() {
    for (let i = 0; i < LINHAS; i++) {
        for (let j = 0; j < COLUNAS; j++) {
            mapa[i][j].isCaminho = false; // Remove a flag de caminho de todas as ruas
        }
    }
}


document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('btn-pontob').addEventListener('click', () => ferramentaAtual = 'pontob');
    document.getElementById('btn-pontoa').addEventListener('click', () => ferramentaAtual = 'pontoa');
    document.getElementById('btn-rota').addEventListener('click', tracarRota);


    const btnGerar = document.getElementById('btn-gerar');
    if (btnGerar) {
        btnGerar.addEventListener('click', () => {
            inicializarMapa();
            desenharTela();
        });
    }

    inicializarMapa();
    desenharTela();
});