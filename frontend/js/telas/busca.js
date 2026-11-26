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
const seletorOndeEstou = document.getElementById('onde-estou');
const botaoMicrofone = document.getElementById('botao-microfone');
const textoMicrofone = document.getElementById('texto-microfone');
const campoBusca = document.getElementById('campo-busca');
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
        seletorOndeEstou.value = String(corredorAtual);   // mostra o último corredor deduzido
        const ondeEsta = corredorAtual === 0 ? '' : `Você está no corredor ${corredorAtual}. `;
        if (Reconhecedor) {
            falar(`Buscar por voz. ${ondeEsta}Toque no microfone e fale o nome do produto, por exemplo: Toddy, sal ou detergente. Para dizer onde você está, fale: estou no corredor 2.`);
        } else {
            falar(`Buscar. ${ondeEsta}Este navegador não tem ditado. Digite o nome do produto no campo de busca.`);
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
// ---------- Onde você está agora ----------
// Se o app deduziu errado, a pessoa corrige aqui
seletorOndeEstou.addEventListener('change', () => {
    corredorAtual = Number(seletorOndeEstou.value);
    falar(corredorAtual === 0 ? 'Certo, você está na entrada.' : `Certo, você está no corredor ${corredorAtual}.`);
});

// ---------- "Estou no corredor 2" (falando ou digitando) ----------
// O reconhecimento de voz às vezes escreve o número por extenso ("dois")
const NUMEROS_FALADOS = { um: 1, dois: 2, tres: 3, quatro: 4 };

// Procura "estou no corredor 2" ou "estou na entrada" no que a pessoa falou.
// Devolve o corredor (0 = entrada) e o resto da frase; ou null se ela não falou onde está.
function entenderOndeEstou(texto) {
    // deixa minúsculo e sem acento: "Tô" vira "to"
    const simples = texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const naEntrada = simples.match(/\b(estou|to) na entrada\b/);
    if (naEntrada) {
        return { corredor: 0, resto: simples.replace(naEntrada[0], '') };
    }

    const noCorredor = simples.match(/\b(estou|to) no corredor (\d+|um|dois|tres|quatro)\b/);
    if (!noCorredor) {
        return null;
    }
    const numero = NUMEROS_FALADOS[noCorredor[2]] || Number(noCorredor[2]);
    return { corredor: numero, resto: simples.replace(noCorredor[0], '') };
}

// ---------- Buscar na API e mostrar ----------
async function buscar(texto) {
    if (texto.trim() === '') {
        falar('Fale ou digite o nome de um produto.');
        return;
    }
    
    // A pessoa disse onde está? ("estou no corredor 2", "estou na entrada")
    const ondeEsta = entenderOndeEstou(texto);
    if (ondeEsta) {
        const ultimoCorredor = seletorOndeEstou.options.length - 1;   // as opções do seletor: entrada + corredores
        if (ondeEsta.corredor > ultimoCorredor) {
            falar(`Esse corredor não existe. O mercado tem os corredores de 1 a ${ultimoCorredor}.`);
            return;
        }
        corredorAtual = ondeEsta.corredor;
        seletorOndeEstou.value = String(corredorAtual);
        texto = ondeEsta.resto;

        // Só disse onde está, sem pedir produto: confirma e para aqui
        if (texto.replace(/[^a-z0-9]/g, '') === '') {
            falar(corredorAtual === 0 ? 'Certo, você está na entrada.' : `Certo, você está no corredor ${corredorAtual}.`);
            return;
        }
    }

    try {
        resultados = await buscarProdutosPorNome(texto);
    } catch (erro) {
        falar('Não consegui falar com o servidor do vozver. Confira a internet.');
        return;
    }
    if (resultados.length === 0) {
        resumoBusca.textContent = `Não encontrei "${texto}".`;
        falar(`Não encontrei ${texto}. Tente falar de outro jeito, por exemplo: leite, água ou detergente.`);
        return;
    }

    resumoBusca.textContent = '';
    // A pessoa vai até o corredor do mais em conta: a próxima busca começa de lá
    corredorAtual = resultados[0].corredor;
    seletorOndeEstou.value = String(corredorAtual);
    // Os produtos aparecem numa tela só deles, que também fala o resultado
    irPara('resultado');
}
