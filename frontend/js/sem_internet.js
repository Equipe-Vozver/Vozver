// ===== Busca sem internet (plano reserva do Demoday) =====
// Normalmente quem procura os produtos é o servidor (backend/main.py).
// Quando não tem internet, o api.js chama as funções deste arquivo.
// Elas procuram no dados/produtos_offline.json, uma cópia dos produtos do banco
// que o celular guardou (quem gera o arquivo é o backend/gerar_dados_offline.py).
//
// As regras são as MESMAS do backend/produtos_teste.py (mais_parecidos):
// se mudar a regra da busca lá, mude aqui também.
// As palavras ignoradas, os apelidos e as frases do caminho vêm prontos no arquivo,
// então eles continuam escritos num lugar só (no Python).

let dadosSemInternet = null;

// Lê o arquivo uma vez só e guarda na memória
async function carregarDadosSemInternet() {
    if (dadosSemInternet === null) {
        const resposta = await fetch('dados/produtos_offline.json');
        if (!resposta.ok) {
            throw new Error('Não achei a cópia dos produtos');
        }
        dadosSemInternet = await resposta.json();
    }
    return dadosSemInternet;
}

// "Café!" vira "cafe": sem acento, sem pontuação e minúsculo (igual ao simplificar do Python)
function simplificar(texto) {
    return String(texto)
        .normalize('NFD')
        .replace(/\p{Mn}/gu, '')               // tira os acentos
        .replace(/[^\p{L}\p{N}_\s]/gu, ' ')    // troca pontuação por espaço
        .toLowerCase()
        .trim();
}

// Separa o texto em palavras (ignora espaços repetidos)
function separarPalavras(texto) {
    return texto.split(/\s+/).filter((palavra) => palavra !== '');
}

// Tira as palavras que não ajudam ("onde fica O...") e troca os apelidos (sabão -> lava roupas)
function palavrasDaBusca(texto, dados) {
    const palavras = [];
    for (const palavra of separarPalavras(simplificar(texto))) {
        if (dados.palavras_ignoradas.includes(palavra)) {
            continue;
        }
        palavras.push(...separarPalavras(dados.apelidos[palavra] || palavra));
    }
    return palavras;
}

// A palavra aparece INTEIRA no texto? Aceita plural nos dois sentidos (roupa/roupas)
function palavraAparece(palavra, texto) {
    return separarPalavras(texto).some((doTexto) =>
        palavra === doTexto || palavra === doTexto + 's' || palavra + 's' === doTexto);
}

// Do mais em conta para o mais caro: pelo preço do quilo (ou litro) ou, se não der, pelo preço
function ordemDePreco(produto) {
    return produto.preco_por_quilo !== null ? produto.preco_por_quilo : produto.preco;
}

// Quem acerta mais palavras (no nome, na marca ou na categoria) ganha. Empate: o mais em conta.
function maisParecidos(produtos, texto, dados) {
    const palavras = palavrasDaBusca(texto, dados);
    const encontrados = [];
    for (const produto of produtos) {
        const ondeProcurar = simplificar(`${produto.nome} ${produto.marca} ${produto.categoria}`);
        const acertos = palavras.filter((palavra) => palavraAparece(palavra, ondeProcurar)).length;
        if (acertos > 0) {
            encontrados.push({ acertos, produto });
        }
    }
    const melhor = Math.max(0, ...encontrados.map((item) => item.acertos));
    return encontrados
        .filter((item) => item.acertos === melhor)
        .map((item) => item.produto)
        .sort((a, b) => ordemDePreco(a) - ordemDePreco(b));
}

// Põe no produto a frase de onde ele fica (igual ao com_onde_fica do corredores.py)
function comOndeFica(produto, de, dados) {
    const caminhosDaqui = dados.caminhos[de] || dados.caminhos[0];   // lugar desconhecido = entrada
    const secao = produto.secao ? `, ${produto.secao}` : '';
    return {
        ...produto,
        onde_fica: `${produto.categoria} fica no corredor ${produto.corredor}${secao}. ` +
            caminhosDaqui[produto.corredor],
    };
}

// ---------- As 3 buscas (as mesmas da API) ----------

async function codigoSemInternet(codigo) {
    const dados = await carregarDadosSemInternet();
    const produto = dados.produtos.find((item) => item.codigo === codigo);
    return produto ? comOndeFica(produto, 0, dados) : null;
}

async function nomeSemInternet(texto, de) {
    const dados = await carregarDadosSemInternet();
    return maisParecidos(dados.produtos, texto, dados).map((produto) => comOndeFica(produto, de, dados));
}

async function categoriaSemInternet(categoria) {
    const dados = await carregarDadosSemInternet();
    const procurada = simplificar(categoria);
    return dados.produtos
        .filter((produto) => simplificar(produto.categoria) === procurada)
        .sort((a, b) => ordemDePreco(a) - ordemDePreco(b))
        .map((produto) => comOndeFica(produto, 0, dados));
}
