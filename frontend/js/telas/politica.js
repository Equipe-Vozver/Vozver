// ===== Política de Privacidade =====
// O texto está no index.html. Aqui o app só fala o resumo ao abrir.

registrarTela('politica', {
    aoAbrir() {
        falar(
        'Política de Privacidade do vozver. Em resumo: você usa o vozver sem criar conta. ' +
        'A câmera e o microfone só funcionam quando você permite. ' +
        'No Chrome, a sua voz vira texto pelo Google. Nós não guardamos áudio nem imagens ' +
        'e não vendemos os seus dados. O texto completo está na tela.'
        );
    },
});
