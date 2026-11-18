// ===== Buscar por voz =====
// A pessoa toca no microfone e fala o produto ("onde fica o arroz?"),
// ou digita no campo. O app procura na API e fala:
//   - quantos produtos achou e o mais barato;
//   - em qual corredor ele fica e como chegar lá.
// Tocando num produto da lista, o app fala os detalhes dele.
//
// O ditado usa o reconhecimento de voz do navegador (SpeechRecognition).
// Ele funciona no Chrome e no Edge. Onde não existe, a pessoa usa o campo de texto.

// O Chrome ainda usa o nome antigo, com "webkit" na frente
const Reconhecedor = window.SpeechRecognition || window.webkitSpeechRecognition;

const botaoMicrofone = document.getElementById('botao-microfone');
const textoMicrofone = document.getElementById('texto-microfone');
const campoBusca = document.getElementById('campo-busca');
const listaBusca = document.getElementById('lista-busca');
const resumoBusca = document.getElementById('busca-resumo');

let reconhecedor = null;
let ouvindo = false;
let resultados = [];   // produtos encontrados na última busca

// Muda o botão do microfone entre "parado" e "ouvindo"
function mostrarOuvindo(sim) {
    ouvindo = sim;
    botaoMicrofone.classList.toggle('ouvindo', sim);
    botaoMicrofone.setAttribute('aria-pressed', sim ? 'true' : 'false');
    textoMicrofone.textContent = sim ? 'Ouvindo... toque para parar' : 'Toque e fale o produto';
}

registrarTela('busca', {
    aoAbrir() {
        if (Reconhecedor) {
            falar('Buscar por voz. Toque no microfone, no meio da tela, e fale o nome do produto. Por exemplo: arroz.');
        } else {
            falar('Buscar. Este navegador não tem ditado. Digite o nome do produto no campo de busca.');
        }
    },
    aoSair() {
        if (reconhecedor && ouvindo) {
            reconhecedor.abort();   // desliga o microfone ao sair da tela
        }
        mostrarOuvindo(false);
    },
});

// ---------- Microfone ----------
botaoMicrofone.addEventListener('click', () => {
    if (!Reconhecedor) {
        falar('Este navegador não tem ditado. Digite o nome do produto no campo de busca.');
        campoBusca.focus();
        return;
    }

    // Já está ouvindo: o toque para
    if (ouvindo) {
        reconhecedor.stop();
        return;
    }

    pararDeFalar();   // para o app não ouvir a própria voz

    reconhecedor = new Reconhecedor();
    reconhecedor.lang = 'pt-BR';
    reconhecedor.interimResults = false;   // só o resultado final
    reconhecedor.maxAlternatives = 1;

    // Entendeu o que a pessoa falou
    reconhecedor.onresult = (evento) => {
        const texto = evento.results[0][0].transcript;
        campoBusca.value = texto;
        buscar(texto);
    };

    reconhecedor.onerror = (evento) => {
        if (evento.error === 'not-allowed') {
            falar('O vozver precisa do microfone. Permita o uso do microfone no navegador, ou digite o produto.');
        } else if (evento.error === 'no-speech') {
            falar('Não ouvi nada. Toque no microfone e fale de novo.');
        } else if (evento.error !== 'aborted') {
            falar('Não entendi. Toque no microfone e fale de novo, ou digite o produto.');
        }
    };

    reconhecedor.onend = () => mostrarOuvindo(false);

    reconhecedor.start();
    mostrarOuvindo(true);
});

// ---------- Campo de texto ----------
document.getElementById('form-busca').addEventListener('submit', (evento) => {
    evento.preventDefault();
    buscar(campoBusca.value);
});

// ---------- Buscar na API e mostrar ----------
async function buscar(texto) {
    if (texto.trim() === '') {
        falar('Fale ou digite o nome de um produto.');
        return;
    }

    try {
        resultados = await buscarProdutosPorNome(texto);
    } catch (erro) {
        falar('Não consegui falar com o servidor do vozver. Confira a internet.');
        return;
    }

    mostrarResultados();

    if (resultados.length === 0) {
        resumoBusca.textContent = `Não encontrei "${texto}".`;
        falar(`Não encontrei ${texto}. Tente falar de outro jeito, por exemplo: café, arroz ou biscoito.`);
        return;
    }

    const maisBarato = resultados[0];   // a lista já vem do mais barato para o mais caro
    const quantos = resultados.length === 1 ? 'um produto' : `${resultados.length} produtos`;
    resumoBusca.textContent = `Encontrei ${quantos}, do mais barato para o mais caro.`;
    falar(
        `Encontrei ${quantos}. O mais barato é ${maisBarato.nome}, ${precoFalado(maisBarato.preco)}. ` +
        `${maisBarato.onde_fica} Toque em um produto da lista para ouvir mais.`
    );
}

// Um botão para cada produto encontrado
function mostrarResultados() {
    listaBusca.innerHTML = '';
    resultados.forEach((produto, posicao) => {
        const item = document.createElement('li');
        item.innerHTML = `
            <button class="item-produto" type="button" data-posicao="${posicao}">
                <span class="item-textos">
                    <span class="item-nome">${escapar(produto.nome)}</span>
                    <span class="item-detalhe">${escapar(produto.peso)} · corredor ${produto.corredor}</span>
                </span>
                <span class="item-preco">${precoEmTexto(produto.preco)}</span>
            </button>
        `;
        listaBusca.appendChild(item);
    });
}

// Toque num produto da lista: destaca e fala os detalhes e onde fica
listaBusca.addEventListener('click', (evento) => {
    const botao = evento.target.closest('button');
    if (!botao) {
        return;
    }
    listaBusca.querySelectorAll('.item-produto').forEach((b) => b.classList.remove('escolhido'));
    botao.classList.add('escolhido');

    const produto = resultados[botao.dataset.posicao];
    falar(
        `${produto.nome}, ${produto.marca}, ${produto.peso}. Preço: ${precoFalado(produto.preco)}. ` +
        produto.onde_fica
    );
});
