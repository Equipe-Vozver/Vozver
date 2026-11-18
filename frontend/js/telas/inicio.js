// ===== Telas do começo: Carregamento, Boas-vindas e Prepare seu vozver =====

// ---------- 1. Carregamento ----------
// Fundo azul-marinho com o logo piscando (a piscada é feita no CSS).
// Depois de 3 segundos vai para as Boas-vindas.
let esperaDoCarregamento = null;

registrarTela('carregamento', {
    aoAbrir() {
        esperaDoCarregamento = setTimeout(() => {
            trocarPara('boas_vindas');   // "trocar": o voltar do celular não volta para cá
        }, 3000);
    },
    aoSair() {
        clearTimeout(esperaDoCarregamento);
    },
});

// ---------- 2. Boas-vindas ----------
// O navegador só deixa o site falar depois do primeiro toque.
// Por isso a tela inteira é um botão: tocou, a voz fica liberada para o app todo.
registrarTela('boas_vindas', {
    aoAbrir() {
        // Se o navegador deixar, já fala; se não deixar, fala no primeiro toque
        falar('Olá! Bem-vindo ao vozver. Toque em qualquer lugar da tela para começar.');
    },
});

document.getElementById('botao-comecar').addEventListener('click', () => {
    // Primeira vez no app: mostra "Prepare seu vozver". Nas outras: vai direto ao menu.
    if (config.jaConfigurou) {
        trocarPara('menu');
    } else {
        trocarPara('prepare');
    }
});

// ---------- 3. Prepare seu vozver (só na primeira vez) ----------
registrarTela('prepare', {
    aoAbrir() {
        falar('Prepare seu vozver. Primeiro botão: personalize sua experiência. Segundo botão: começar agora.');
    },
});

document.getElementById('botao-personalizar').addEventListener('click', () => {
    mudarConfig('jaConfigurou', true);   // da próxima vez esta tela não aparece
    trocarPara('menu');                  // o menu fica "embaixo", para o VOLTAR dos ajustes voltar a ele
    irPara('ajustes');
});

document.getElementById('botao-comecar-agora').addEventListener('click', () => {
    mudarConfig('jaConfigurou', true);
    trocarPara('menu');
});
