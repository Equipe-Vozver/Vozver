
const camera = document.getElementById("camera");
const areaFoto = document.getElementById("areaFoto");
const canvas = document.getElementById("canvas");
const textoResultado = document.getElementById("textoResultado");
const btnVoltar = document.getElementById("btnVoltar");

let fluxoCamera = null;

// Ativar câmera
async function iniciarCamera() {
    try {
        fluxoCamera = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { ideal: "environment" },
                width: { ideal: 1080 },
                height: { ideal: 1920 }
            },
            audio: false
        });

        camera.srcObject = fluxoCamera;
        await camera.play();

        console.log("Câmera ativada!");

    } catch (erro) {
        console.error("Erro ao acessar a câmera:", erro);
        alert("Não foi possível acessar a câmera!");
    }
}

// Capturar imagem ao tocar na câmera
function capturarImagem() {
    if (!fluxoCamera || camera.readyState < 2) {
        return;
    }

    const contexto = canvas.getContext("2d");

    canvas.width = camera.videoWidth;
    canvas.height = camera.videoHeight;

    contexto.drawImage(
        camera,
        0,
        0,
        canvas.width,
        canvas.height
    );

    textoResultado.textContent = "Imagem capturada com sucesso!";

    console.log("Imagem capturada!", canvas.width, canvas.height);
}

// Tocar na área da câmera
areaFoto.addEventListener("click", capturarImagem);

// Desligar câmera
function desligarCamera() {
    if (fluxoCamera) {
        fluxoCamera.getTracks().forEach(track => track.stop());
        camera.srcObject = null;
        fluxoCamera = null;
    }
}

// Iniciar câmera
iniciarCamera();

// Botão voltar
btnVoltar.addEventListener("click", function () {
    desligarCamera();
    window.history.back();
});
