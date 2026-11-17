// ===== Menu =====
// Um botão grande para cada função (voz, câmera e ajustes, como no Figma).
// Confirmação em dois toques:
//   1º toque no botão -> ele fica destacado, aparece a pílula embaixo e o app fala o que ele faz
//   2º toque (na pílula ou no mesmo botão) -> abre a tela

const botoesDoMenu = document.querySelectorAll('.cartao-menu');
const pilula = document.getElementById('pilula');
let botaoEscolhido = null;   // botão tocado uma vez (null = nenhum)

// Tira o destaque de todos os botões e esconde a pílula
function limparEscolha() {
    botaoEscolhido = null;
    botoesDoMenu.forEach((botao) => botao.classList.remove('escolhido'));
    pilula.hidden = true;
}

registrarTela('menu', {
    aoAbrir() {
        limparEscolha();   // ao voltar para o menu, nenhum botão fica escolhido
        falar('Menu. Toque em um botão para ouvir o que ele faz. Toque de novo para abrir.');
    },
});

botoesDoMenu.forEach((botao) => {
    botao.addEventListener('click', () => {
        // Segundo toque no mesmo botão: abre a tela
        if (botaoEscolhido === botao) {
            irPara(botao.dataset.tela);
            return;
        }

        // Primeiro toque: destaca o botão, mostra a pílula e fala o que ele faz
        limparEscolha();
        botaoEscolhido = botao;
        botao.classList.add('escolhido');

        const nome = botao.querySelector('.nome-menu').textContent;
        document.getElementById('pilula-nome').textContent = nome;
        pilula.setAttribute('aria-label', 'Abrir ' + nome);
        pilula.hidden = false;

        falar(`${nome}. ${botao.dataset.explicacao} Toque de novo para abrir.`);
    });
});

// Toque na pílula: abre a tela do botão escolhido
pilula.addEventListener('click', () => {
    if (botaoEscolhido) {
        irPara(botaoEscolhido.dataset.tela);
    }
});
