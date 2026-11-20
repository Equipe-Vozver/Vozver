// ===== Resultado da busca por voz =====
// Abre quando a busca acha produtos (a busca guarda a lista em "resultados").
// Mostra em letras grandes o corredor e o caminho, e a lista do mais em conta
// para o mais caro. Assim a tela da busca fica limpa e ninguém precisa rolar.
// O botão de baixo (BUSCAR OUTRO PRODUTO) volta para a busca por voz.

const resumoResultado = document.getElementById('resultado-resumo');
const corredorResultado = document.getElementById('resultado-corredor');
const caminhoResultado = document.getElementById('resultado-caminho');
const listaResultado = document.getElementById('lista-resultado');

let produtoDoCaminho = null;   // o produto que está no cartão do caminho

// Escreve no cartão o corredor e como chegar até ele
function mostrarCaminho(produto) {
    produtoDoCaminho = produto;
    const secao = produto.secao ? ` · ${produto.secao}` : '';   // a seção vem do banco
    corredorResultado.textContent = `Corredor ${produto.corredor}${secao}`;
    caminhoResultado.textContent = produto.onde_fica;
}

// "R$ 24,98 o quilo" (só quando o produto veio do banco, que calcula o preço por quilo)
function precoPorQuiloEmTexto(produto) {
    if (!produto.preco_por_quilo) {
        return '';
    }
    return `${precoEmTexto(produto.preco_por_quilo)} o ${produto.medida_comparacao}`;
}

// Um botão para cada produto encontrado. O primeiro (o mais em conta) já vem destacado.
function mostrarListaDoResultado() {
    listaResultado.innerHTML = '';
    resultados.forEach((produto, posicao) => {
        const quilo = precoPorQuiloEmTexto(produto);
        const item = document.createElement('li');
        item.innerHTML = `
            <button class="item-produto${posicao === 0 ? ' escolhido' : ''}" type="button" data-posicao="${posicao}">
                <span class="item-posicao" aria-hidden="true">${posicao + 1}º</span>
                <span class="item-textos">
                    <span class="item-nome">${escapar(produto.nome)}</span>
                    <span class="item-detalhe">${escapar(produto.peso)}${quilo ? ' · ' + quilo : ''}</span>
                </span>
                <span class="item-preco">${precoEmTexto(produto.preco)}</span>
            </button>
        `;
        listaResultado.appendChild(item);
    });
}

registrarTela('resultado', {
    aoAbrir() {
        // Abriu pelo endereço (#resultado) sem ter buscado nada: volta para a busca
        if (resultados.length === 0) {
            trocarPara('busca');
            return;
        }

        const maisEmConta = resultados[0];   // a lista já vem do mais em conta para o mais caro
        const quantos = resultados.length === 1 ? 'um produto' : `${resultados.length} produtos`;
        // "do mais em conta para o mais caro" só faz sentido quando tem mais de um
        resumoResultado.textContent = resultados.length === 1
            ? 'Encontrei um produto.'
            : `Encontrei ${quantos}, do mais em conta para o mais caro.`;
        mostrarCaminho(maisEmConta);
        mostrarListaDoResultado();

        falar(
            `Encontrei ${quantos}. O mais em conta é ${maisEmConta.nome}, ${precoFalado(maisEmConta.preco)}. ` +
            `${maisEmConta.onde_fica} Toque em um produto da lista para ouvir mais.`
        );
    },
});

// Toque num produto: destaca, troca o caminho do cartão e fala os detalhes
listaResultado.addEventListener('click', (evento) => {
    const botao = evento.target.closest('button');
    if (!botao) {
        return;
    }
    listaResultado.querySelectorAll('.item-produto').forEach((b) => b.classList.remove('escolhido'));
    botao.classList.add('escolhido');

    const produto = resultados[botao.dataset.posicao];
    mostrarCaminho(produto);
    const quilo = produto.preco_por_quilo
        ? ` Sai ${precoFalado(produto.preco_por_quilo)} o ${produto.medida_comparacao}.`
        : '';
    falar(
        `${produto.nome}, ${produto.marca}, ${produto.peso}. Preço: ${precoFalado(produto.preco)}.${quilo} ` +
        produto.onde_fica
    );
});

// Quem não guardou o caminho de primeira pode ouvir de novo
document.getElementById('botao-ouvir-caminho').addEventListener('click', () => {
    if (produtoDoCaminho) {
        falar(produtoDoCaminho.onde_fica);
    }
});