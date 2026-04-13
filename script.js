// classes do terreno
class Terreno {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.isCaminho = false;
    }
    obterCusto() { return 1; }
    ehPassavel() { return true; }
    obterClasseCSS() { return ''; }
    obterNome() { return 'terreno'; }
}

class Rua extends Terreno {
    constructor(x, y) {
        super(x, y);
        this.temTransito = false;
    }
    ehPassavel() { return !this.temTransito; }
    obterCusto()  { return 1; }
    obterClasseCSS() {
        return this.temTransito ? 'engarrafamento' : 'rua';
    }
    obterNome() {
        return this.temTransito ? 'engarrafamento' : 'rua';
    }
}

class Predio extends Terreno {
    ehPassavel()     { return false; }
    obterCusto()     { return Infinity; }
    obterClasseCSS() { return 'predio'; }
    obterNome()      { return 'prédio'; }
}

class Casa extends Terreno {
    ehPassavel()     { return false; }
    obterCusto()     { return Infinity; }
    obterClasseCSS() { return 'casa'; }
    obterNome()      { return 'casa'; }
}

class Praca extends Terreno {
    ehPassavel()     { return false; }
    obterCusto()     { return Infinity; }
    obterClasseCSS() { return 'praca'; }
    obterNome()      { return 'praça'; }
}

// variáveis globais
const LINHAS  = 20;
const COLUNAS = 20;

let pontoA         = null;
let pontoB         = null;
let mapa           = [];
let ferramentaAtual = 'pontoa';

// modal de mensagem personalizado
const modalOverlay = document.getElementById('modal-mensagem');
const modalTexto   = document.getElementById('modal-texto');
const modalOkBtn   = document.getElementById('modal-ok');

function mostrarMensagem(mensagem) {
    if (!modalOverlay || !modalTexto) return;
    modalTexto.textContent = mensagem;
    modalOverlay.style.display = 'flex';
    modalOkBtn.focus();
}

function fecharModal() {
    if (modalOverlay) {
        modalOverlay.style.display = 'none';
    }
}

if (modalOkBtn) {
    modalOkBtn.addEventListener('click', fecharModal);
}

if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            fecharModal();
        }
    });
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay && modalOverlay.style.display === 'flex') {
        fecharModal();
    }
});

// tooltip personalizado
const tooltip = document.createElement('div');
tooltip.id = 'tooltip-personalizado';
document.body.appendChild(tooltip);

function mostrarTooltip(texto, x, y) {
    tooltip.textContent = texto;
    tooltip.style.display = 'block';
    tooltip.style.left = (x + 15) + 'px';
    tooltip.style.top = (y + 15) + 'px';
}

function esconderTooltip() {
    tooltip.style.display = 'none';
}

// inicialização do mapa
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

            let sorteio = Math.random();
            
            if (sorteio < 0.20) {
                mapa[i][j] = new Predio(j, i);
            } else if (sorteio < 0.30) {
                mapa[i][j] = new Casa(j, i);
            } else if (sorteio < 0.35) {
                mapa[i][j] = new Praca(j, i);
            } else {
                let novaRua = new Rua(j, i);
                if (Math.random() < 0.15) {
                    novaRua.temTransito = true;
                }
                mapa[i][j] = novaRua;
            }
        }
    }
}

// renderização do tabuleiro
function desenharTela() {
    const tabuleiro = document.getElementById('tabuleiro');
    tabuleiro.innerHTML = '';

    tabuleiro.style.gridTemplateColumns = `repeat(${COLUNAS}, 34px)`;
    tabuleiro.style.gridTemplateRows    = `repeat(${LINHAS}, 34px)`;

    for (let i = 0; i < LINHAS; i++) {
        for (let j = 0; j < COLUNAS; j++) {
            const celula = mapa[i][j];

            const div = document.createElement('div');
            div.classList.add('celula');
            div.classList.add(celula.obterClasseCSS());

            let isPontoA = (pontoA !== null && i === pontoA.y && j === pontoA.x);
            let isPontoB = (pontoB !== null && i === pontoB.y && j === pontoB.x);
            let nomeTooltip = celula.obterNome();

            if (isPontoA) {
                div.classList.add('ponto-a');
                nomeTooltip = 'ponto de partida (A)';
            } else if (isPontoB) {
                div.classList.add('ponto-b');
                nomeTooltip = 'ponto de destino (B)';
            } else if (celula.isCaminho) {
                div.classList.add('caminho');
                nomeTooltip = 'caminho traçado';
            }

            div.addEventListener('mouseenter', (e) => {
                mostrarTooltip(nomeTooltip, e.clientX, e.clientY);
            });
            
            div.addEventListener('mousemove', (e) => {
                tooltip.style.left = (e.clientX + 15) + 'px';
                tooltip.style.top = (e.clientY + 15) + 'px';
            });
            
            div.addEventListener('mouseleave', () => {
                esconderTooltip();
            });

            div.addEventListener('click', () => {
                const celulaClicada = mapa[i][j];

                if (ferramentaAtual === 'pontoa') {
                    if (!celulaClicada.ehPassavel()) {
                        mostrarMensagem("O ponto de início deve estar sobre uma rua!");
                        return;
                    }
                    if (pontoB !== null && j === pontoB.x && i === pontoB.y) {
                        mostrarMensagem("O Ponto A não pode ficar no mesmo lugar que o Ponto B!");
                        return;
                    }
                    pontoA = { x: j, y: i };
                    limparCaminhoAntigo();
                    atualizarStatus('Ponto A definido — agora defina o destino');

                } else if (ferramentaAtual === 'pontob') {
                    if (!celulaClicada.ehPassavel()) {
                        mostrarMensagem("O ponto de destino deve estar sobre uma rua!");
                        return;
                    }
                    if (pontoA !== null && j === pontoA.x && i === pontoA.y) {
                        mostrarMensagem("O Ponto B não pode ficar no mesmo lugar que o Ponto A!");
                        return;
                    }
                    pontoB = { x: j, y: i };
                    limparCaminhoAntigo();
                    atualizarStatus('Ponto B definido — pronto para traçar rota');
                }

                desenharTela();
            });

            tabuleiro.appendChild(div);
        }
    }
}

// algoritmo a* para traçar rota
function calcularHeuristica(noAtual, noDestino) {
    return Math.abs(noAtual.x - noDestino.x) + Math.abs(noAtual.y - noDestino.y);
}

function obterVizinhos(celula) {
    let vizinhos = [];
    const { x, y } = celula;
    
    if (y > 0)           vizinhos[vizinhos.length] = mapa[y - 1][x];
    if (y < LINHAS - 1)  vizinhos[vizinhos.length] = mapa[y + 1][x];
    if (x > 0)           vizinhos[vizinhos.length] = mapa[y][x - 1];
    if (x < COLUNAS - 1) vizinhos[vizinhos.length] = mapa[y][x + 1];
    return vizinhos;
}

function tracarRota() {
    if (pontoA === null || pontoB === null) {
        mostrarMensagem("Por favor, posicione o Ponto A e o Ponto B no mapa.");
        return;
    }

    for (let i = 0; i < LINHAS; i++) {
        for (let j = 0; j < COLUNAS; j++) {
            mapa[i][j].isCaminho = false;
        }
    }

    let celulaInicial = mapa[pontoA.y][pontoA.x];
    let celulaFinal   = mapa[pontoB.y][pontoB.x];

    let cameFromChaves  = [];
    let cameFromValores = [];
    let tamanhoCameFrom = 0;

    let gChaves  = [];
    let gValores = [];
    let gTam     = 0;

    let fChaves  = [];
    let fValores = [];
    let fTam     = 0;

    function buscarValor(chave, chaves, valores, tam) {
        for (let i = 0; i < tam; i++) {
            if (chaves[i] === chave) return valores[i];
        }
        return Infinity;
    }

    function definirValor(chave, valor, chaves, valores, tamAtual) {
        for (let i = 0; i < tamAtual; i++) {
            if (chaves[i] === chave) {
                valores[i] = valor;
                return tamAtual;
            }
        }
        chaves[tamAtual]  = chave;
        valores[tamAtual] = valor;
        return tamAtual + 1;
    }

    function existeChave(chave, chaves, tam) {
        for (let i = 0; i < tam; i++) {
            if (chaves[i] === chave) return true;
        }
        return false;
    }

    let openSet    = [];
    let openSetTam = 0;

    openSet[0] = celulaInicial;
    openSetTam = 1;

    gChaves[0]  = celulaInicial;
    gValores[0] = 0;
    gTam        = 1;

    fChaves[0]  = celulaInicial;
    fValores[0] = calcularHeuristica(celulaInicial, celulaFinal);
    fTam        = 1;

    let limiteIteracoes = 0;
    const MAX_ITERACOES = LINHAS * COLUNAS * 4;

    while (openSetTam > 0) {
        limiteIteracoes++;
        if (limiteIteracoes > MAX_ITERACOES) {
            console.error("limite de iterações atingido");
            break;
        }

        let atual    = openSet[0];
        let idxAtual = 0;
        for (let i = 1; i < openSetTam; i++) {
            let fAtual = buscarValor(atual,      fChaves, fValores, fTam);
            let fNo    = buscarValor(openSet[i], fChaves, fValores, fTam);
            if (fNo < fAtual) {
                atual    = openSet[i];
                idxAtual = i;
            }
        }

        if (atual === celulaFinal) {
            let no = atual;
            while (existeChave(no, cameFromChaves, tamanhoCameFrom)) {
                no.isCaminho = true;
                no = buscarValor(no, cameFromChaves, cameFromValores, tamanhoCameFrom);
            }
            celulaInicial.isCaminho = true;
            desenharTela();
            atualizarStatus('rota calculada com sucesso');
            return;
        }

        for (let i = idxAtual; i < openSetTam - 1; i++) {
            openSet[i] = openSet[i + 1];
        }
        openSet[openSetTam - 1] = null;
        openSetTam--;

        let vizinhos = obterVizinhos(atual);

        for (let v = 0; v < vizinhos.length; v++) {
            let vizinho = vizinhos[v];
            if (!vizinho.ehPassavel()) continue;

            let gAtual     = buscarValor(atual,   gChaves, gValores, gTam);
            let tentativaG = gAtual + vizinho.obterCusto();
            let gVizinho   = buscarValor(vizinho, gChaves, gValores, gTam);

            if (tentativaG < gVizinho) {
                tamanhoCameFrom = definirValor(vizinho, atual, cameFromChaves, cameFromValores, tamanhoCameFrom);
                gTam = definirValor(vizinho, tentativaG, gChaves, gValores, gTam);
                fTam = definirValor(vizinho, tentativaG + calcularHeuristica(vizinho, celulaFinal), fChaves, fValores, fTam);

                let jaEsta = false;
                for (let i = 0; i < openSetTam; i++) {
                    if (openSet[i] === vizinho) {
                        jaEsta = true;
                        break;
                    }
                }

                if (!jaEsta) {
                    openSet[openSetTam] = vizinho;
                    openSetTam++;
                }
            }
        }
    }

    mostrarMensagem("Não há caminho possível!");
    atualizarStatus('nenhum caminho encontrado');
    desenharTela();
}

// funções utilitárias
function limparCaminhoAntigo() {
    for (let i = 0; i < LINHAS; i++) {
        for (let j = 0; j < COLUNAS; j++) {
            mapa[i][j].isCaminho = false;
        }
    }
}

function atualizarStatus(msg) {
    const el = document.getElementById('status-msg');
    if (el) el.textContent = msg;
}

// funções de persistência (salvar e carregar cidades)
function salvarCidade() {
    let nome = prompt("Nome da cidade:");
    if (!nome) return;

    let celulas = [];
    for (let i = 0; i < LINHAS; i++) {
        celulas[i] = [];
        for (let j = 0; j < COLUNAS; j++) {
            let celula = mapa[i][j];
            let tipo = celula.obterClasseCSS();
            if (tipo === 'rua' && celula.temTransito) tipo = 'engarrafamento';
            celulas[i][j] = tipo;
        }
    }

    let cidade = { nome, linhas: LINHAS, colunas: COLUNAS, celulas };
    let json = JSON.stringify(cidade);
    let blob = new Blob([json], { type: 'application/json' });
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = nome + '.json';
    a.click();
    URL.revokeObjectURL(url);
    atualizarStatus('cidade "' + nome + '" salva');
}

function carregarCidade() {
    let input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.addEventListener('change', function () {
        let arquivo = input.files[0];
        if (!arquivo) return;

        let leitor = new FileReader();
        leitor.onload = function (e) {
            let cidade = JSON.parse(e.target.result);

            mapa = [];
            for (let i = 0; i < cidade.linhas; i++) {
                mapa[i] = [];
                for (let j = 0; j < cidade.colunas; j++) {
                    let tipo = cidade.celulas[i][j];
                    
                    if (tipo === 'predio') {
                        mapa[i][j] = new Predio(j, i);
                    } else if (tipo === 'casa') {
                        mapa[i][j] = new Casa(j, i);
                    } else if (tipo === 'praca') {
                        mapa[i][j] = new Praca(j, i);
                    } else if (tipo === 'engarrafamento') {
                        let r = new Rua(j, i);
                        r.temTransito = true;
                        mapa[i][j] = r;
                    } else {
                        mapa[i][j] = new Rua(j, i);
                    }
                }
            }

            pontoA = null;
            pontoB = null;
            desenharTela();
            atualizarStatus('cidade "' + cidade.nome + '" carregada');
        };
        leitor.readAsText(arquivo);
    });

    input.click();
}

// inicialização dos eventos
document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('btn-pontoa').addEventListener('click', () => {
        ferramentaAtual = 'pontoa';
        document.getElementById('btn-pontoa').classList.add('active');
        document.getElementById('btn-pontob').classList.remove('active');
        atualizarStatus('clique no mapa para definir o início');
    });

    document.getElementById('btn-pontob').addEventListener('click', () => {
        ferramentaAtual = 'pontob';
        document.getElementById('btn-pontob').classList.add('active');
        document.getElementById('btn-pontoa').classList.remove('active');
        atualizarStatus('clique no mapa para definir o destino');
    });

    document.getElementById('btn-rota').addEventListener('click', tracarRota);

    document.getElementById('btn-gerar').addEventListener('click', () => {
        pontoA = null;
        pontoB = null;
        inicializarMapa();
        desenharTela();
        atualizarStatus('mapa resetado');
    });

    const btnSalvar = document.getElementById('btn-salvar');
    const btnCarregar = document.getElementById('btn-carregar');
    
    if (btnSalvar) btnSalvar.addEventListener('click', salvarCidade);
    if (btnCarregar) btnCarregar.addEventListener('click', carregarCidade);

    inicializarMapa();
    desenharTela();
});