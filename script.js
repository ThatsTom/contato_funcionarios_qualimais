const WHATSAPP_PARAMETER = "numero";
const SELLER_PARAMETER = "vendedor";
const DEFAULT_MESSAGE = "Olá! Vim pelo cartão digital da Qualimais e gostaria de mais informações.";

const params = new URLSearchParams(window.location.search);
const whatsappLink = document.querySelector("#whatsapp-link");
const whatsappDetail = document.querySelector("#whatsapp-detail");
const whatsappFeedback = document.querySelector("#whatsapp-feedback");
const profileName = document.querySelector("#profile-name");
const currentYear = document.querySelector("#current-year");
const brandLogo = document.querySelector("#brand-logo");

function normalizePhone(value) {
  if (!value) return null;

  let digits = value.replace(/\D/g, "");

  // Números brasileiros com DDD podem ser informados sem o código do país.
  if (digits.length === 10 || digits.length === 11) {
    digits = `55${digits}`;
  }

  return digits.length >= 12 && digits.length <= 15 ? digits : null;
}

function cleanSellerName(value) {
  if (!value) return "";

  return value.trim().replace(/\s+/g, " ").slice(0, 60);
}

async function loadAnimatedLogo() {
  if (!brandLogo) return;

  try {
    const response = await fetch("logo-empresa.svg");

    if (!response.ok) throw new Error(`Não foi possível carregar a logo (${response.status}).`);

    const svgSource = await response.text();
    const svgDocument = new DOMParser().parseFromString(svgSource, "image/svg+xml");
    const svgRoot = svgDocument.documentElement;

    if (svgRoot.nodeName === "parsererror") throw new Error("SVG inválido.");

    svgRoot.removeAttribute("width");
    svgRoot.removeAttribute("height");
    svgRoot.setAttribute("aria-hidden", "true");
    svgRoot.setAttribute("focusable", "false");
    svgRoot.classList.add("brand-logo-vector");

    const logoParts = svgRoot.querySelectorAll("path, polygon");

    logoParts.forEach((part, index) => {
      part.classList.add("logo-path");
      part.style.setProperty("--path-delay", `${index * 24}ms`);
      part.style.setProperty("--fill-delay", `${800 + index * 24}ms`);

      try {
        const pathLength = Math.ceil(part.getTotalLength());
        part.style.setProperty("--path-length", pathLength);
      } catch {
        part.style.setProperty("--path-length", 3000);
      }
    });

    brandLogo.replaceChildren(document.importNode(svgRoot, true));

    requestAnimationFrame(() => {
      brandLogo.querySelector("svg")?.classList.add("is-animated");
    });
  } catch (error) {
    console.warn("A logo será exibida sem animação.", error);
  }
}

function configureSeller() {
  const rawPhone = params.get(WHATSAPP_PARAMETER);
  const phone = normalizePhone(rawPhone);
  const seller = cleanSellerName(params.get(SELLER_PARAMETER));
  const customMessage = params.get("mensagem")?.trim().slice(0, 280);

  if (seller) {
    profileName.textContent = seller;
    whatsappDetail.textContent = `Conversar diretamente com ${seller}`;
    document.title = `${seller} | Importadora Qualimais`;
  }

  if (!phone) {
    whatsappLink.classList.add("is-disabled");
    whatsappLink.removeAttribute("target");
    whatsappLink.removeAttribute("rel");
    whatsappLink.setAttribute("aria-disabled", "true");
    whatsappLink.setAttribute("href", "#whatsapp-feedback");
    whatsappDetail.textContent = "Número não configurado neste link";
    whatsappFeedback.hidden = false;
    whatsappFeedback.textContent = "Para ativar o WhatsApp, acesse esta página usando ?numero= seguido do telefone com DDD.";

    whatsappLink.addEventListener("click", (event) => {
      event.preventDefault();
      whatsappFeedback.focus?.();
    });

    return;
  }

  const message = customMessage || (seller
    ? `Olá, ${seller}! Vim pelo seu cartão digital da Qualimais e gostaria de mais informações.`
    : DEFAULT_MESSAGE);

  whatsappLink.href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

currentYear.textContent = new Date().getFullYear();
configureSeller();

loadAnimatedLogo();
