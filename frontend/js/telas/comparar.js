// ===== Comparar preços (a balança do Figma) =====
// Abre a partir do cartão do produto. Mostra os produtos da mesma categoria,
// do mais barato para o mais caro, e fala a lista.
// O produto escolhido vem da tela Ler código (variável produtoParaComparar).

const listaComparar = document.getElementById('lista-comparar');
const subtituloComparar = document.getElementById('comparar-subtitulo');

registrarTela('comparar', {
    async aoAbrir() {
        listaComparar.innerHTML = '';

        // Abriu pelo endereço, sem escolher um produto antes
        if (!produtoParaComparar) {
            subtituloComparar.textContent = 'Leia o código de um produto primeiro.';
            falar('Comparar preços. Leia o código de barras de um produto primeiro.');
            return;
        }

        const { categoria, codigo } = produtoParaComparar;
        subtituloComparar.textContent = `${categoria}: do mais barato para o mais caro`;

        let lista;
        try {
            lista = await buscarProdutosDaCategoria(categoria);
        } catch (erro) {
            falar('Não consegui falar com o servidor do vozver. Confira a internet.');
            return;
        }

        // Um item da lista para cada produto. O escolhido fica destacado.
        lista.forEach((produto, posicao) => {
            const ehOEscolhido = produto.codigo === codigo;
            const item = document.createElement('li');
            item.className = 'item-produto' + (ehOEscolhido ? ' escolhido' : '');
            item.innerHTML = `
                <span class="item-posicao" aria-hidden="true">${posicao + 1}º</span>
                <span class="item-textos" aria-hidden="true">
                    <span class="item-nome">${escapar(produto.nome)}</span>
                    <span class="item-detalhe">${escapar(produto.peso)}${ehOEscolhido ? ' · você escolheu' : ''}</span>
                </span>
                <span class="item-preco" aria-hidden="true">${precoEmTexto(produto.preco)}</span>
                <span class="so-leitor">${posicao + 1}º: ${escapar(produto.nome)}, ${escapar(produto.peso)},
                    ${precoFalado(produto.preco)}${ehOEscolhido ? '. Este é o produto que você escolheu.' : ''}</span>
            `;
            listaComparar.appendChild(item);
        });

        // Monta a frase: "1º: Café 3 Corações, 500 gramas, 17 reais e 90 centavos. 2º: ..."
        const frases = lista.map((produto, posicao) =>
            `${posicao + 1}º: ${produto.nome}, ${produto.peso}, ${precoFalado(produto.preco)}.`
        );
        falar(`Comparar preços de ${categoria}, do mais barato para o mais caro. ${frases.join(' ')}`);
    },
});
