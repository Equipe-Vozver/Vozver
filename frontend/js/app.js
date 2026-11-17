// ===== Liga tudo (este arquivo é carregado por último) =====

// 1) Mostra as escolhas salvas (tema e tamanho da letra) e desenha os ícones
aplicarAjustes();
desenharIcones();

// 2) Todos os botões VOLTAR fazem a mesma coisa
document.querySelectorAll('.botao-voltar').forEach((botao) => {
    botao.setAttribute('aria-describedby', 'dica-voltar');
    botao.addEventListener('click', voltar);
});
const dicaVoltar = document.createElement('span');
dicaVoltar.id = 'dica-voltar';
dicaVoltar.className = 'so-leitor';
dicaVoltar.textContent = 'Volta para a tela anterior';
document.body.appendChild(dicaVoltar);

// 3) Botões com data-ir="..." abrem a tela com esse nome (ex.: Fonte e Voz nos Ajustes)
document.querySelectorAll('[data-ir]').forEach((botao) => {
    botao.addEventListener('click', () => irPara(botao.dataset.ir));
});

// 4) Links internos (<a href="#politica">) também usam o irPara, para o VOLTAR funcionar
document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (evento) => {
        evento.preventDefault();
        irPara(link.getAttribute('href').replace('#', ''));
    });
});

// 5) Primeira tela: começa sempre pelo carregamento, a não ser que o endereço
//    peça outra tela (ex.: recarregou a página nos Ajustes)
const primeiraTela = telaDoEndereco();
if (primeiraTela === '' || primeiraTela === 'carregamento' || primeiraTela === 'boas_vindas') {
    trocarPara('carregamento');
} else {
    mostrarTela(primeiraTela);
}

// 6) Service worker: guarda os arquivos no celular (PWA instalável e mais rápida)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
}
