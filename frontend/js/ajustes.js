// ===== Ajustes do vozver e a voz =====
// Aqui ficam:
//   - as escolhas da pessoa (tema, tamanho da letra, velocidade da voz), salvas no celular;
//   - a função falar(), que lê um texto em voz alta.
// Todas as telas usam estas funções.

// As barras de Fonte e de Voz têm 5 posições: 0, 1, 2, 3 e 4.
// Cada lista diz quanto vale cada posição.
const tamanhosDoTexto = [0.85, 1, 1.15, 1.3, 1.45];   // multiplica o tamanho das letras
const velocidadesDaVoz = [0.6, 0.85, 1, 1.25, 1.5];   // 1 = velocidade normal da fala

// Escolhas de quem abre o app pela primeira vez
const configPadrao = {
    tema: 'claro',          // 'claro' ou 'escuro'
    nivelFonte: 1,          // posição da barra de Fonte (0 a 4)
    nivelVoz: 2,            // posição da barra de Voz (0 a 4)
    jaConfigurou: false,    // false = mostra a tela "Prepare seu vozver"
};

// Nome usado para guardar as escolhas no navegador
const CHAVE = 'vozver-ajustes';

// ---------- Ler as escolhas salvas ----------
// localStorage guarda textos no navegador, mesmo depois de fechar.
// O try/catch evita erro se o navegador bloquear o localStorage (modo anônimo, por exemplo).
function carregarConfig() {
    try {
        const salvo = localStorage.getItem(CHAVE);
        if (salvo) {
            // "...configPadrao" garante que nenhuma escolha fique faltando
            return { ...configPadrao, ...JSON.parse(salvo) };
        }
    } catch (erro) {}
    return { ...configPadrao };
}

let config = carregarConfig();

// ---------- Mudar e salvar uma escolha ----------
// Exemplo: mudarConfig('tema', 'escuro')
function mudarConfig(nome, valor) {
    config[nome] = valor;
    try {
        localStorage.setItem(CHAVE, JSON.stringify(config));
    } catch (erro) {}
    aplicarAjustes();
}

// ---------- Mostrar as escolhas na tela ----------
// Troca o tema, o tamanho das letras e o logo certo para o tema.
function aplicarAjustes() {
    document.body.dataset.tema = config.tema;
    document.documentElement.style.setProperty('--tamanho', tamanhosDoTexto[config.nivelFonte]);

    // Cada tema tem o seu logo: olho azul no claro, olho branco no escuro
    const logo = config.tema === 'escuro' ? 'img/logo-escuro.png' : 'img/logo-claro.png';
    document.querySelectorAll('.logo-tema').forEach((imagem) => {
        imagem.src = logo;
    });

    // Cor da barra de cima do celular (onde ficam a hora e a bateria)
    const corDaBarra = config.tema === 'escuro' ? '#050f22' : '#0e1d3d';
    document.querySelector('meta[name="theme-color"]').content = corDaBarra;
}

// ---------- Falar em voz alta ----------
// O navegador só deixa o site falar depois que a pessoa toca na tela pela primeira vez.
// Se a fala for bloqueada, guardamos o texto em "falaPendente" e falamos no primeiro toque.
let falaPendente = null;

// "nivelVoz" é opcional: a tela de Voz usa para testar a velocidade nova na hora.
function falar(texto, nivelVoz = config.nivelVoz) {
    falaPendente = null;

    if (!('speechSynthesis' in window)) {
        return;   // navegador sem voz: o texto continua na tela
    }

    speechSynthesis.cancel();   // corta a fala anterior para não embolar

    const fala = new SpeechSynthesisUtterance(texto);
    fala.lang = 'pt-BR';
    fala.rate = velocidadesDaVoz[nivelVoz];

    // Usa uma voz em português, se o aparelho tiver
    const vozBrasileira = speechSynthesis.getVoices().find((voz) => voz.lang === 'pt-BR');
    if (vozBrasileira) {
        fala.voice = vozBrasileira;
    }

    fala.onerror = (evento) => {
        if (evento.error === 'not-allowed') {
            falaPendente = texto;   // bloqueada: fala quando a pessoa tocar na tela
        }
    };

    speechSynthesis.speak(fala);
}

// Para a fala (usado antes de ligar o microfone, para o app não ouvir a própria voz)
function pararDeFalar() {
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
    }
}

// Primeiro toque em qualquer lugar: se tinha uma fala bloqueada, fala agora.
// setTimeout(0) espera o botão tocado fazer o que precisa; se ele mesmo já falou,
// a falaPendente vira null e não repete.
document.addEventListener('click', () => {
    const textoGuardado = falaPendente;
    if (textoGuardado) {
        setTimeout(() => {
            if (falaPendente === textoGuardado) {
                falar(textoGuardado);
            }
        }, 0);
    }
}, true);
