// ===== Leitor de código de barras =====

// Pega os elementos do HTML pelo id
const camera = document.getElementById("camera");
const aviso = document.getElementById("status");
const textoStatus = document.getElementById("texto-status");
const resultado = document.getElementById("resultado");
const botaoSimular = document.getElementById("botao-simular");
const botaoOuvir = document.getElementById("botao-ouvir");

const naoIdentificado = "Não consegui identificar o produto. Vamos tentar de novo?";

// Faz o celular falar um texto em voz alta
function falar(texto) {
    window.speechSynthesis.cancel();   // para qualquer fala anterior
    const fala = new SpeechSynthesisUtterance(texto);
    fala.lang = "pt-BR";
    fala.rate = 0.9;                   // 1 é a velocidade normal
    window.speechSynthesis.speak(fala);
}

// Liga a câmera de trás do celular.
// "async" e "await" fazem o código esperar a pessoa responder ao pedido de permissão
async function ligarCamera() {
    try {
        const video = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" }
        });
        camera.srcObject = video;
        textoStatus.textContent = "Câmera pronta. Aponte para o código de barras.";
    } catch (erro) {
        // Se der erro (por exemplo, a pessoa negou a permissão), cai aqui
        textoStatus.textContent = "Não consegui abrir a câmera. Confira se você deu permissão.";
    }
}

// Por enquanto o produto nunca é reconhecido (o banco de dados ainda não está ligado)
function mostrarNaoIdentificado() {
    resultado.hidden = true;               // esconde o cartão do produto
    aviso.classList.remove("sucesso");     // tira a cor verde de sucesso
    textoStatus.textContent = naoIdentificado;
    falar(naoIdentificado);
}

ligarCamera();
botaoSimular.addEventListener("click", mostrarNaoIdentificado);
botaoOuvir.addEventListener("click", function () {
    falar(naoIdentificado);
});