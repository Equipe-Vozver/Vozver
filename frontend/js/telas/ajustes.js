// ===== Ajustes, Fonte e Voz =====

// ---------- 5. Ajustes ----------
// Três botões grandes:
//   - Claro / Escuro: troca o tema na hora (vale para o app inteiro)
//   - Fonte: abre a tela do tamanho da letra
//   - Voz: abre a tela da velocidade da voz
const botaoTema = document.getElementById('botao-tema');

// O botão mostra o tema que está ligado agora, igual ao Figma
function mostrarTema() {
    const escuro = config.tema === 'escuro';
    document.getElementById('texto-tema').textContent = escuro ? 'Escuro' : 'Claro';
    botaoTema.setAttribute(
        'aria-label',
        escuro ? 'Tema escuro ligado. Toque para trocar para o claro.' : 'Tema claro ligado. Toque para trocar para o escuro.'
    );
}

registrarTela('ajustes', {
    aoAbrir() {
        mostrarTema();
        falar('Ajustes. Botões: tema, fonte e voz.');
    },
});

botaoTema.addEventListener('click', () => {
    if (config.tema === 'escuro') {
        mudarConfig('tema', 'claro');
        falar('Tema claro ligado.');
    } else {
        mudarConfig('tema', 'escuro');
        falar('Tema escuro ligado.');
    }
    mostrarTema();
});

// ---------- Barra deslizante (usada na Fonte e na Voz) ----------
// O <input type="range"> vai de 0 a 4. Esta função pinta a parte cheia do trilho
// e diz ao leitor de tela o nome da posição (ex.: "médio").
function atualizarBarra(barra, nomes) {
    const porcento = (barra.value / 4) * 100;
    barra.style.setProperty('--porcento', porcento + '%');
    barra.setAttribute('aria-valuetext', nomes[barra.value]);
}

// ---------- 6. Fonte ----------
const nomesDosTamanhos = ['muito pequeno', 'pequeno', 'médio', 'grande', 'muito grande'];
const barraFonte = document.getElementById('barra-fonte');

registrarTela('fonte', {
    aoAbrir() {
        barraFonte.value = config.nivelFonte;
        atualizarBarra(barraFonte, nomesDosTamanhos);
        falar(`Fonte. Tamanho da letra: ${nomesDosTamanhos[config.nivelFonte]}. Toque ou arraste na barra para mudar.`);
    },
});

// "input": enquanto arrasta, a letra já muda de tamanho
barraFonte.addEventListener('input', () => {
    mudarConfig('nivelFonte', Number(barraFonte.value));
    atualizarBarra(barraFonte, nomesDosTamanhos);
});

// "change": quando solta a barra, fala o tamanho escolhido
barraFonte.addEventListener('change', () => {
    falar('Letra ' + nomesDosTamanhos[barraFonte.value]);
});

// ---------- 7. Voz ----------
const nomesDasVelocidades = ['muito lenta', 'lenta', 'normal', 'rápida', 'muito rápida'];
const barraVoz = document.getElementById('barra-voz');

registrarTela('voz', {
    aoAbrir() {
        barraVoz.value = config.nivelVoz;
        atualizarBarra(barraVoz, nomesDasVelocidades);
        falar(`Voz. Velocidade: ${nomesDasVelocidades[config.nivelVoz]}. Toque ou arraste na barra para mudar.`);
    },
});

barraVoz.addEventListener('input', () => {
    atualizarBarra(barraVoz, nomesDasVelocidades);
});

// Quando solta a barra, salva e já fala na velocidade nova para a pessoa ouvir como ficou
barraVoz.addEventListener('change', () => {
    const novo = Number(barraVoz.value);
    mudarConfig('nivelVoz', novo);
    falar(`Voz ${nomesDasVelocidades[novo]}. É assim que eu vou falar.`, novo);
});
