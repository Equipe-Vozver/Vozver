const root = document.documentElement;
const DEFAULTS = { text:"md", contrast:"padrao", rate:50, read:true, letters:true, icons:true };
let state = { ...DEFAULTS };

try { Object.assign(state, JSON.parse(localStorage.getItem("vozver-config") || "{}")); } catch (e) {}
const save = () => { try { localStorage.setItem("vozver-config", JSON.stringify(state)); } catch (e) {} };

/*Botão voltar */
const botaoVoltar = document.getElementById("back")

botaoVoltar.addEventListener("click", () => {
    const paginaAnterior = document.referrer

    if (paginaAnterior && new URL(paginaAnterior).origin === window.location.origin) {
        window.history.back()
    } else {
        window.location.href = "inicio.html"
    }
})

/* Fala */
function speak(text, force = false) {
  if ((!state.read && !force) || !("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "pt-BR";
  u.rate = 0.6 + (state.rate / 100) * 1.0; // 0.6x a 1.6x
  speechSynthesis.speak(u);
}

/* Barra laranja do slider: acompanha o centro da bolinha (22px) */
function paintRate(v) {
  const r = document.getElementById("rate");
  const pos = `calc(11px + (100% - 22px) * ${v / 100})`;
  const cor = getComputedStyle(document.documentElement);
  r.style.background = `linear-gradient(to right, ${cor.getPropertyValue("--orange")} ${pos}, ${cor.getPropertyValue("--track")} ${pos})`;
}

/* Aplica o estado na interface */
function apply() {
  const base = { sm: 0.88, md: 1, lg: 1.2 }[state.text];
  root.style.setProperty("--size", (base * (state.letters ? 1.15 : 1)).toFixed(3));
  root.dataset.contrast = state.contrast;
  requestAnimationFrame(() => paintRate(state.rate));
  root.dataset.bigIcons = state.icons;
  document.querySelector(`input[name=text][value=${state.text}]`).checked = true;
  document.querySelector(`input[name=contrast][value=${state.contrast}]`).checked = true;
  const rate = document.getElementById("rate");
  rate.value = state.rate;
  paintRate(state.rate);
  document.querySelectorAll(".sw").forEach(b => b.setAttribute("aria-checked", state[b.dataset.key]));
}


/* Eventos */
document.querySelectorAll("input[name=text],input[name=contrast]").forEach(i =>
  i.addEventListener("change", () => {
    state[i.name] = i.value; apply(); save();
    speak(document.querySelector(`label[for=${i.id}]`).dataset.say);
  })
);

const rate = document.getElementById("rate");
rate.addEventListener("input", () => {
  state.rate = +rate.value;
  paintRate(rate.value);
  save();
});
rate.addEventListener("change", () => speak("Esta é a velocidade da voz"));

document.querySelectorAll(".sw").forEach(b =>
  b.addEventListener("click", () => {
    const wasReading = state.read;
    state[b.dataset.key] = !state[b.dataset.key];
    apply(); save();
    const name = document.getElementById(b.getAttribute("aria-labelledby")).textContent;
    const msg = `${name}: ${state[b.dataset.key] ? "ativado" : "desativado"}`;
    if (wasReading || state.read) speak(msg, true); // fala ao ativar e ao desativar
  })
);

/* Ler botões em voz alta ao focar/tocar */
document.querySelectorAll("[data-say]:not(label)").forEach(el =>
  el.addEventListener("click", () => speak(el.dataset.say))
);

/* Botão de Ampliar Texto */
const botaoIcones = document.querySelector('[data-key="icons"]')

// Verifica o estado inicial do botão
let iconesAmpliados = botaoIcones.getAttribute("aria-checked") === "true"

// Aplica o tamanho dos ícones
function atualizarIcones() {
    document.body.classList.toggle("icones-ampliados", iconesAmpliados)

    botaoIcones.setAttribute("aria-checked", iconesAmpliados)
}

// Executa ao clicar no botão
botaoIcones.addEventListener("click", () => {
    iconesAmpliados = !iconesAmpliados

    atualizarIcones()
})

// Aplica a configuração inicial
atualizarIcones()

document.getElementById("test").addEventListener("click", () => speak("Esta é a voz do VozVer, na velocidade escolhida.", true));
document.getElementById("back").addEventListener("click", () => history.length > 1 && history.back());

apply();