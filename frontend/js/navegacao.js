// ===== Troca de telas =====
// Todas as telas estão no index.html, cada uma numa <section class="tela" id="...">.
// Este arquivo mostra uma de cada vez e cuida do botão VOLTAR.
// O endereço muda junto (#menu, #ajustes...), então o "voltar" do celular também funciona.

// Cada tela pode avisar o que fazer quando abre e quando fecha:
//   registrarTela('menu', { aoAbrir() {...}, aoSair() {...} })
const telas = {};
let telaAtual = null;

function registrarTela(nome, funcoes) {
    telas[nome] = funcoes;
}

// Mostra a tela pedida e esconde as outras.
// "voltando" = true quando a pessoa voltou para esta tela (VOLTAR ou voltar do celular).
function mostrarTela(nome, voltando = false) {
    // Endereço que não existe (ex.: #abc): mostra o menu
    if (!document.getElementById(nome)) {
        nome = 'menu';
    }

    // Avisa a tela que está saindo (ex.: a câmera desliga)
    if (telaAtual && telas[telaAtual] && telas[telaAtual].aoSair) {
        telas[telaAtual].aoSair();
    }

    document.querySelectorAll('.tela').forEach((tela) => tela.classList.remove('ativa'));
    const novaTela = document.getElementById(nome);
    novaTela.classList.add('ativa');
    telaAtual = nome;

    // Leva o foco para o título: o leitor de tela começa a ler a tela nova do começo
    const titulo = novaTela.querySelector('[tabindex="-1"]');
    if (titulo) {
        titulo.focus({ preventScroll: true });
    }

    if (telas[nome] && telas[nome].aoAbrir) {
        telas[nome].aoAbrir({ voltando });
    }
}

// Abre uma tela nova, guardando a anterior no histórico (para o VOLTAR)
function irPara(nome) {
    history.pushState({ dentroDoApp: true }, '', '#' + nome);
    mostrarTela(nome);
}

// Troca a tela sem guardar a anterior (ex.: o carregamento não volta mais)
function trocarPara(nome) {
    history.replaceState(history.state, '', '#' + nome);
    mostrarTela(nome);
}

// Botão VOLTAR: volta para a tela anterior. Se não tiver uma, vai para o menu.
function voltar() {
    if (history.state && history.state.dentroDoApp) {
        history.back();   // o "popstate" lá embaixo mostra a tela anterior
    } else {
        trocarPara('menu');
    }
}

// Pega o nome da tela pelo endereço: "#ajustes" vira "ajustes"
function telaDoEndereco() {
    return location.hash.replace('#', '');
}

// Voltar do celular ou history.back(): mostra a tela do endereço
window.addEventListener('popstate', () => {
    mostrarTela(telaDoEndereco(), true);
});
