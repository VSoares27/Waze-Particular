class Terreno {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.isCaminho = false;
    }
    obterCusto()     { return 1; }
    ehPassavel()     { return true; }
    obterClasseCSS() { return ''; }
    obterNome()      { return 'terreno'; }
}

class Rua extends Terreno {
    constructor(x, y) {
        super(x, y);
        this.temTransito = false;
    }
    // rua com trânsito bloqueia passagem temporariamente
    ehPassavel()     { return !this.temTransito; }
    obterCusto()     { return 1; }
    obterClasseCSS() { return this.temTransito ? 'engarrafamento' : 'rua'; }
    obterNome()      { return this.temTransito ? 'engarrafamento' : 'rua'; }
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

// ============================================================
// VARIÁVEIS GLOBAIS
// mapa é o array 2D protagonista — toda lógica passa por ele
// ============================================================

const LINHAS  = 20;
const COLUNAS = 20;

let pontoA          = null;
let pontoB          = null;
let mapa            = [];
let ferramentaAtual = 'pontoa';

let rotaAnimacao   = [];
let indiceAnimacao = 0;
let intervaloAnim  = null;

// ============================================================
// MODAL DE MENSAGEM (substitui alert nativo)
// ============================================================

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
    if (modalOverlay) modalOverlay.style.display = 'none';
}

if (modalOkBtn) {
    modalOkBtn.addEventListener('click', fecharModal);
}

if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) fecharModal();
    });
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay && modalOverlay.style.display === 'flex') {
        fecharModal();
    }
});

// ============================================================
// TOOLTIP PERSONALIZADO
// criado manualmente via DOM, sem biblioteca externa
// posição segue o mouse com e.clientX e e.clientY
// ============================================================

const tooltip = document.createElement('div');
tooltip.id = 'tooltip-personalizado';
document.body.appendChild(tooltip);

function mostrarTooltip(texto, x, y) {
    tooltip.textContent   = texto;
    tooltip.style.display = 'block';
    tooltip.style.left    = (x + 15) + 'px';
    tooltip.style.top     = (y + 15) + 'px';
}

function esconderTooltip() {
    tooltip.style.display = 'none';
}

// ============================================================
// INICIALIZAÇÃO DO MAPA
// criação manual da matriz 2D com laços for e índices
// ============================================================

function inicializarMapa() {
    mapa = [];

    for (let i = 0; i < LINHAS; i++) {
        mapa[i] = [];

        for (let j = 0; j < COLUNAS; j++) {
            // pontos A e B sempre são ruas para garantir passagem
            if ((pontoA !== null && j === pontoA.x && i === pontoA.y) ||
                (pontoB !== null && j === pontoB.x && i === pontoB.y)) {
                mapa[i][j] = new Rua(j, i);
                continue;
            }

            let sorteio = Math.random();

            // distribuição: 20% Prédio, 10% Casa, 5% Praça, 65% Rua
            if (sorteio < 0.20) {
                mapa[i][j] = new Predio(j, i);
            } else if (sorteio < 0.30) {
                mapa[i][j] = new Casa(j, i);
            } else if (sorteio < 0.35) {
                mapa[i][j] = new Praca(j, i);
            } else {
                let novaRua = new Rua(j, i);
                if (Math.random() < 0.15) novaRua.temTransito = true;
                mapa[i][j] = novaRua;
            }
        }
    }
}

// ============================================================
// RENDERIZAÇÃO DO TABULEIRO
// o array controla a si mesmo — array é protagonista
// ============================================================

function desenharTela() {
    const tabuleiro = document.getElementById('tabuleiro');
    tabuleiro.innerHTML = '';

    tabuleiro.style.gridTemplateColumns = `repeat(${COLUNAS}, 34px)`;
    tabuleiro.style.gridTemplateRows    = `repeat(${LINHAS}, 34px)`;

    for (let i = 0; i < mapa.length; i++) {

        for (let j = 0; j < mapa[i].length; j++) {

            const celula = mapa[i][j];

            const div = document.createElement('div');
            div.classList.add('celula');
            div.classList.add(celula.obterClasseCSS());

            let isPontoA    = (pontoA !== null && i === pontoA.y && j === pontoA.x);
            let isPontoB    = (pontoB !== null && i === pontoB.y && j === pontoB.x);
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

            // tooltip segue o mouse com e.clientX e e.clientY
            div.addEventListener('mouseenter', (e) => mostrarTooltip(nomeTooltip, e.clientX, e.clientY));
            div.addEventListener('mousemove',  (e) => {
                tooltip.style.left = (e.clientX + 15) + 'px';
                tooltip.style.top  = (e.clientY + 15) + 'px';
            });
            div.addEventListener('mouseleave', () => esconderTooltip());

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

// ============================================================
// ALGORITMO A* — TRAÇAR ROTA
// ============================================================

function calcularHeuristica(noAtual, noDestino) {
    return Math.abs(noAtual.x - noDestino.x) + Math.abs(noAtual.y - noDestino.y);
}

function obterVizinhos(celula) {
    let vizinhos = [];
    const { x, y } = celula;

    if (y > 0)                   vizinhos[vizinhos.length] = mapa[y - 1][x];
    if (y < mapa.length - 1)     vizinhos[vizinhos.length] = mapa[y + 1][x];
    if (x > 0)                   vizinhos[vizinhos.length] = mapa[y][x - 1];
    if (x < mapa[y].length - 1)  vizinhos[vizinhos.length] = mapa[y][x + 1];

    return vizinhos;
}

function tracarRota() {
    if (pontoA === null || pontoB === null) {
        mostrarMensagem("Por favor, posicione o Ponto A e o Ponto B no mapa.");
        return;
    }

    // para animação anterior se existir
    if (intervaloAnim !== null) {
        clearInterval(intervaloAnim);
        intervaloAnim = null;
    }

    // limpa caminho anterior com mapa.length e mapa[i].length
    for (let i = 0; i < mapa.length; i++) {
        for (let j = 0; j < mapa[i].length; j++) {
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

    // busca manual em array paralelo (substitui Map.get)
    function buscarValor(chave, chaves, valores, tam) {
        for (let i = 0; i < tam; i++) {
            if (chaves[i] === chave) return valores[i];
        }
        return Infinity;
    }

    // inserção/atualização manual (substitui Map.set)
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

    // verificação de existência manual (substitui Map.has)
    function existeChave(chave, chaves, tam) {
        for (let i = 0; i < tam; i++) {
            if (chaves[i] === chave) return true;
        }
        return false;
    }


    let fila   = [];
    let inicio = 0;

    // inserção manual: fila[fila.length] = posicao
    fila[fila.length] = celulaInicial;

    gChaves[0]  = celulaInicial;
    gValores[0] = 0;
    gTam        = 1;

    fChaves[0]  = celulaInicial;
    fValores[0] = calcularHeuristica(celulaInicial, celulaFinal);
    fTam        = 1;

    let limiteIteracoes = 0;
    const MAX_ITERACOES = mapa.length * mapa[0].length * 4;

    // consumo da fila: fila[inicio], inicio++
    while (inicio < fila.length) {
        limiteIteracoes++;
        if (limiteIteracoes > MAX_ITERACOES) {
            console.error("limite de iterações atingido");
            break;
        }

        let atual    = fila[inicio];
        let idxAtual = inicio;

        for (let i = inicio + 1; i < fila.length; i++) {
            if (fila[i] === null) continue;
            let fAtual = buscarValor(atual,   fChaves, fValores, fTam);
            let fNo    = buscarValor(fila[i], fChaves, fValores, fTam);
            if (fNo < fAtual) {
                atual    = fila[i];
                idxAtual = i;
            }
        }

        fila[idxAtual] = null;

        // chegou no destino — monta o array de rota para o carro
        if (atual === celulaFinal) {

            rotaAnimacao   = [];
            indiceAnimacao = 0;

            let no = atual;
            while (existeChave(no, cameFromChaves, tamanhoCameFrom)) {
                // inserção manual no array de rota
                rotaAnimacao[rotaAnimacao.length] = no;
                no = buscarValor(no, cameFromChaves, cameFromValores, tamanhoCameFrom);
            }
            rotaAnimacao[rotaAnimacao.length] = celulaInicial;

            let esq = 0;
            let dir = rotaAnimacao.length - 1;
            while (esq < dir) {
                let temp           = rotaAnimacao[esq];
                rotaAnimacao[esq]  = rotaAnimacao[dir];
                rotaAnimacao[dir]  = temp;
                esq++;
                dir--;
            }

            desenharTela();
            animarCarro();
            atualizarStatus('rota calculada — carro em movimento');
            return;
        }

        if (idxAtual === inicio) inicio++;

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
                for (let i = 0; i < fila.length; i++) {
                    if (fila[i] === vizinho) {
                        jaEsta = true;
                        break;
                    }
                }

                if (!jaEsta) {
                    fila[fila.length] = vizinho;
                }
            }
        }
    }

    mostrarMensagem("Não há caminho possível!");
    atualizarStatus('nenhum caminho encontrado');
    desenharTela();
}

function animarCarro() {
    if (intervaloAnim !== null) {
        clearInterval(intervaloAnim);
        intervaloAnim = null;
    }

    indiceAnimacao = 0;

    intervaloAnim = setInterval(() => {

        // rotaAnimacao[indice] — acessa posição atual
        if (indiceAnimacao < rotaAnimacao.length) {

            let posicaoAtual = rotaAnimacao[indiceAnimacao]; 
            posicaoAtual.isCaminho = true;
            desenharTela();


            const tabuleiro = document.getElementById('tabuleiro');
            const idx       = posicaoAtual.y * mapa[0].length + posicaoAtual.x;
            const celDiv    = tabuleiro.children[idx];
            if (celDiv) celDiv.classList.add('carro-atual');

            indiceAnimacao++; 

        } else {

            clearInterval(intervaloAnim);
            intervaloAnim = null;
            atualizarStatus('destino alcançado');
        }

    }, 120);
}

// ============================================================
// UTILITÁRIOS
// ============================================================

function limparCaminhoAntigo() {
    // CORRIGIDO: usa mapa.length e mapa[i].length
    for (let i = 0; i < mapa.length; i++) {
        for (let j = 0; j < mapa[i].length; j++) {
            mapa[i][j].isCaminho = false;
        }
    }
}

function atualizarStatus(msg) {
    const el = document.getElementById('status-msg');
    if (el) el.textContent = msg;
}

// ============================================================
// SALVAR E CARREGAR CIDADES
// o mapa é percorrido manualmente para gerar o JSON
// ao carregar, cada string reconstrói o objeto correto
// ============================================================

function salvarCidade() {
    let nome = prompt("Nome da cidade:");
    if (!nome) return;

    // percorre o array manualmente com mapa.length e mapa[i].length
    let celulas = [];
    for (let i = 0; i < mapa.length; i++) {
        celulas[i] = [];
        for (let j = 0; j < mapa[i].length; j++) {
            let celula = mapa[i][j];
            let tipo   = celula.obterClasseCSS();
            if (tipo === 'rua' && celula.temTransito) tipo = 'engarrafamento';
            celulas[i][j] = tipo;
        }
    }

    // converte para JSON e força download do arquivo no navegador
    let cidade = { nome, linhas: LINHAS, colunas: COLUNAS, celulas };
    let json   = JSON.stringify(cidade);
    let blob   = new Blob([json], { type: 'application/json' });
    let url    = URL.createObjectURL(blob);
    let a      = document.createElement('a');
    a.href     = url;
    a.download = nome + '.json';
    a.click();
    URL.revokeObjectURL(url);
    atualizarStatus('cidade "' + nome + '" salva');
}

function carregarCidade() {
    let input    = document.createElement('input');
    input.type   = 'file';
    input.accept = '.json';

    input.addEventListener('change', function () {
        let arquivo = input.files[0];
        if (!arquivo) return;

        let leitor    = new FileReader();
        leitor.onload = function (e) {
            let cidade = JSON.parse(e.target.result);

            // reconstrói o array manualmente a partir do JSON
            // cada tipo salvo como string vira o objeto correto
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

// ============================================================
// INICIALIZAÇÃO — EVENTOS DOS BOTÕES
// ============================================================

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
        if (intervaloAnim !== null) {
            clearInterval(intervaloAnim);
            intervaloAnim = null;
        }
        pontoA = null;
        pontoB = null;
        inicializarMapa();
        desenharTela();
        atualizarStatus('mapa resetado');
    });

    const btnSalvar   = document.getElementById('btn-salvar');
    const btnCarregar = document.getElementById('btn-carregar');

    if (btnSalvar)   btnSalvar.addEventListener('click', salvarCidade);
    if (btnCarregar) btnCarregar.addEventListener('click', carregarCidade);

    inicializarMapa();
    desenharTela();
});