// ===== Política de Privacidade =====
// O texto está no index.html. Aqui o app só fala o resumo ao abrir.

registrarTela('politica', {
    aoAbrir() {
        falar(
            'Política de Privacidade do VozVer. Em resumo: você usa o VozVer sem criar conta. ' +
            'A câmera e o microfone só funcionam quando você permite. Nós não vendemos os seus dados. ' +
            'O texto completo está na tela.'
        );
    },
});
