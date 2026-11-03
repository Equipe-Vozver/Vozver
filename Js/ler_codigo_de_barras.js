// Pega os elementos da página
const camera = document.getElementById("camera");
const aviso = document.getElementById("status");
const textoStatus = document.getElementById("texto-status");
const botaoSimular = document.getElementById("botao-simular");
const resultado = document.getElementById("resultado");
const botaoOuvir = document.getElementById("botao-ouvir");

// Função de síntese de voz
function falar(texto) {
    window.speechSynthesis.cancel();
    const fala = new SpeechSynthesisUtterance(texto);
    fala.lang = "pt-BR";
    fala.rate = 0.9;
    window.speechSynthesis.speak(fala);
}

// Liga a câmera automaticamente assim que a página carrega
async function ligarCamera() {
    try {
        const fluxo = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" }
        });
        camera.srcObject = fluxo;
        textoStatus.textContent = "Câmera ligada. Aponte para o código de barras.";
    } catch (erro) {
        textoStatus.textContent = "Não consegui acessar a câmera. Verifique a permissão.";
    }
}

// Simula a tentativa de leitura onde o produto NÃO é reconhecido
function simularNaoIdentificado() {
    // Mantém o cartão do produto oculto
    resultado.hidden = true;
    
    // Atualiza o texto do aviso
    textoStatus.textContent = "Produto não identificado.";
    
    // Remove a classe de sucesso caso ela estivesse ativa (opcional, para garantir o visual padrão ou de erro)
    aviso.classList.remove("sucesso");

    // Faz o sintetizador falar exatamente o que você pediu
    falar("Produto não identificado.");
}

// Acionadores de eventos
window.addEventListener("DOMContentLoaded", ligarCamera);

// O botão de "escanear novamente" (ou o botão de simulação) agora dispara o aviso de não identificado
botaoSimular.addEventListener("click", simularNaoIdentificado);

// O botão de ouvir principal agora lê a mensagem de não identificado enquanto o banco não for integrado
botaoOuvir.addEventListener("click", function () {
    falar("Produto não identificado.");
});