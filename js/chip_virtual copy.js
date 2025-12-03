// -----------------------------------------------------------------------------
// APP.JS — WIZARD COMPLETO COM TOKEN, MEUS CHIPS, VALORES POR CARGO E COUNTRY MAP
// -----------------------------------------------------------------------------

// --------------------- TOKEN / LOGIN ---------------------
const token = localStorage.getItem("token");
if (!token) {
  alert("Faça login primeiro!");
  window.location.href = "login.html";
  throw new Error("Sem token");
}

// --------------------- CONFIG ---------------------
const API_EP =
  typeof API_BASE_URL !== "undefined"
    ? `${API_BASE_URL.replace(/\/$/, "")}/consultas/chip.php`
    : "chip.php";

// --------------------- COUNTRY MAP (NOVIDADE) ---------------------
const COUNTRY_MAP = {
  br: "br",
  usa: "us",
  uruguai: "uy",
  argentina: "ar",
  espanha: "es",
  portugal: "pt"
};

// --------------------- UTIL DOM ---------------------
function el(tag, props = {}, children = []) {
  const e = document.createElement(tag);
  for (const k in props) {
    if (k === "class") e.className = props[k];
    else if (k === "html") e.innerHTML = props[k];
    else e.setAttribute(k, props[k]);
  }
  if (typeof children === "string") e.textContent = children;
  else children.forEach(c =>
    e.appendChild(typeof c === "string" ? document.createTextNode(c) : c)
  );
  return e;
}
function qs(s) { return document.querySelector(s); }

// --------------------- FORMATADORES ---------------------
function formatPhone(num) {
  if (!num) return "";
  let s = String(num).replace(/\D/g, "");
  if (s.startsWith("55")) s = s.slice(2);
  if (s.length === 11) return `+55 ${s.slice(0,2)} ${s.slice(2,7)}-${s.slice(7)}`;
  if (s.length === 10) return `+55 ${s.slice(0,2)} ${s.slice(2,6)}-${s.slice(6)}`;
  return `+55 ${s}`;
}
function fmtDateTime(dt) {
  if (!dt) return "";
  const [d1, t] = dt.split(" ");
  const [y, m, d] = d1.split("-");
  return `${d}/${m}/${y} ${t.slice(0,5)}`;
}
function diffMinutes(a, b) {
  if (!a || !b) return null;
  const x = new Date(a.replace(" ", "T"));
  const y = new Date(b.replace(" ", "T"));
  return Math.round((y - x) / 60000);
}

// --------------------- FETCH HELPERS ---------------------
async function getJSON(url) {
  const r = await fetch(url + `&token=${encodeURIComponent(token)}`, { cache: "no-store" });
  return r.json();
}
async function postForm(url, payload = {}) {
  payload.token = token;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(payload)
  });
  return r.json();
}

// --------------------- API ENDPOINTS ---------------------
const listarServicos = () => getJSON(`${API_EP}?ac=listarServicos`);
const listarOperadoras = () => getJSON(`${API_EP}?ac=listarOperadoras`);
const buscarValor = () => getJSON(`${API_EP}?ac=buscarValor`);
const comprar = p => postForm(`${API_EP}?ac=comprar`, p);
const verMensagens = p => postForm(`${API_EP}?ac=verMensagens`, p);
const listarMeusChips = () => getJSON(`${API_EP}?ac=listarMeusChips`);

// --------------------- ROOT ---------------------
const main = qs("main");
if (!main) throw new Error("Cadê o <main>?");
main.style.padding = "20px";
const container = el("div", { id: "container" });
main.appendChild(container);

// --------------------- MODAL ---------------------
const modalBackdrop = el("div", { style:"position:fixed;inset:0;background:rgba(0,0,0,.45);display:none;align-items:center;justify-content:center;padding:20px;z-index:9999" });
const modalBox = el("div", { style:"max-width:760px;width:100%;background:#fff;border-radius:10px;padding:16px;max-height:80vh;overflow:auto" });
const modalBody = el("div", { style:"font-size:14px" });
const modalHeader = el("div", { style:"display:flex;align-items:center;margin-bottom:8px" });
modalHeader.appendChild(el("strong", {}, "Mensagens recebidas"));
modalHeader.appendChild(el("div", { style:"flex:1" }));
const modalCloseBtn = el("button", { style:"padding:8px 12px;border-radius:8px;background:#eee;border:0;cursor:pointer" }, "Fechar");
modalCloseBtn.addEventListener("click", ()=> modalBackdrop.style.display = "none");

modalHeader.appendChild(modalCloseBtn);
modalBox.appendChild(modalHeader);
modalBox.appendChild(el("hr"));
modalBox.appendChild(modalBody);
modalBackdrop.appendChild(modalBox);
document.body.appendChild(modalBackdrop);

function openModalLoading() {
  modalBody.innerHTML = `<div style="color:#0b5cff;font-weight:600">Buscando...</div>`;
  modalBackdrop.style.display = "flex";
}

function renderMessagesList(list, target) {
  target.innerHTML = "";
  if (!list || !list.length) {
    target.innerHTML = `<div style="color:#666">Nenhuma mensagem.</div>`;
    return;
  }
  list.forEach(m => {
    const card = el("div", { style:"border:1px solid #e6e9ef;padding:12px;border-radius:8px;background:#fafbff;margin-bottom:12px" });
    card.appendChild(el("div", {}, ["Recebido: ", el("strong", {}, fmtDateTime(m.receivedAt||m.received||m.created_at))]));
    card.appendChild(el("div", {}, ["Número: ", el("strong", {}, formatPhone(m.phoneNumber||m.numero))]));
    card.appendChild(el("pre", { style:"white-space:pre-wrap;background:#fff;padding:10px;margin-top:8px;border-radius:6px;border:1px solid #ddd" }, m.text||m.message||""));
    target.appendChild(card);
  });
}

// --------------------- MENU INICIAL ---------------------
function showStartScreen(){
  container.innerHTML="";
  const b1=el("button",{style:"width:100%;padding:14px;background:#0b5cff;color:#fff;border:0;border-radius:8px;font-size:16px;margin-bottom:10px;cursor:pointer"},"Criar novo número");
  const b2=el("button",{style:"width:100%;padding:14px;background:#333;color:#fff;border:0;border-radius:8px;font-size:16px;cursor:pointer"},"Ver Códigos Recebidos");
  const b3=el("button",{style:"width:100%;padding:14px;background:#444;color:#fff;border:0;border-radius:8px;font-size:16px;margin-top:10px;cursor:pointer"},"Meus Chips");

  b1.onclick=()=>buildUI();
  b2.onclick=()=>screenReadMessages("");
  b3.onclick=()=>screenMyChips();

  container.appendChild(b1); container.appendChild(b2); container.appendChild(b3);
}

// --------------------- TELA MEUS CHIPS ---------------------
async function screenMyChips(){
  container.innerHTML="<h2>Meus Chips</h2><div>Carregando...</div>";
  const r = await listarMeusChips();
  if(r.error){ container.innerHTML=`<h2>Meus Chips</h2><div style="color:#d00">${r.message}</div>`; return; }
  const list = r.data || [];
  const wrap = el("div", { style:"margin-top:12px; display:grid;grid-template-columns:1fr 1fr; gap:12px" });
  if(!list.length){ wrap.innerHTML="<div>Nenhum chip encontrado.</div>"; }
  else{
    list.forEach(c=>{
      const card = el("div", { style:"border:1px solid #e6e9ef;padding:12px;border-radius:8px;background:#f9f9f9;display:flex;flex-direction:column" });
      card.appendChild(el("div", {}, ["Número: ", el("strong", {}, formatPhone(c.phoneNumber))]));
      card.appendChild(el("div", {}, ["ActivationID: ", el("strong", {}, c.activationId)]));
      card.appendChild(el("div", {}, ["Criado em: ", el("strong", {}, fmtDateTime(c.created_at))]));
      const bMsg = el("button",{style:"margin-top:10px;padding:8px 12px;background:#0b5cff;color:#fff;border:0;border-radius:6px;cursor:pointer"},"Ler minhas mensagens");
      bMsg.addEventListener("click", async ()=>{
        openModalLoading();
        const r2 = await verMensagens({activationId:c.activationId});
        if(r2.error) modalBody.innerHTML=`<div>${r2.message}</div>`; else renderMessagesList(r2.data,modalBody);
      });
      card.appendChild(bMsg);
      wrap.appendChild(card);
    });
  }
  const back = el("button",{style:"margin-top:15px;padding:10px 14px;background:#444;color:#fff;border:0;border-radius:8px;cursor:pointer"},"← Voltar");
  back.onclick=()=>showStartScreen();
  container.appendChild(wrap);
  container.appendChild(back);
}

// --------------------- TELA LEITURA ---------------------
function screenReadMessages(prefill=""){
  container.innerHTML="";
  container.appendChild(el("h2",{},"Consultar mensagens"));
  const inp=el("input",{value:prefill,placeholder:"Digite o ActivationID",style:"width:100%;padding:12px;border-radius:8px;border:1px solid:#ccc;font-size:15px;margin-bottom:10px"}); 
  const btn=el("button",{style:"width:100%;padding:14px;background:#0b5cff;border:0;color:#fff;border-radius:8px;font-size:16px;cursor:pointer"},"Ler mensagens"); 
  const out=el("div",{style:"margin-top:15px"}); 
  const back=el("button",{style:"margin-top:20px;padding:10px 16px;background:#444;color:#fff;border:0;border-radius:8px;cursor:pointer"},"← Voltar"); 
  back.onclick=()=>showStartScreen(); 
  container.appendChild(inp); container.appendChild(btn); container.appendChild(out); container.appendChild(back);

  btn.onclick=async()=>{
    const id=inp.value.trim(); if(!id)return alert("Digite o ActivationID");
    btn.textContent="Carregando..."; btn.disabled=true;
    try{
      const r=await verMensagens({activationId:id});
      if(r.error) out.innerHTML=`<div style="color:#d00">${r.message}</div>`; else renderMessagesList(r.data,out);
    }catch{ out.innerHTML="<div style='color:#d00'>Erro</div>"; }
    btn.textContent="Ler mensagens"; btn.disabled=false;
  };
  if(prefill) btn.click();
}

// --------------------- WIZARD COMPLETO ---------------------
async function buildUI(){
  container.innerHTML="<div style='color:#0b5cff;font-weight:600'>Carregando...</div>";
  const [sv, opsRaw, valoresR] = await Promise.all([listarServicos(), listarOperadoras(), buscarValor()]);

  const operatorsObj = opsRaw.data || {};
  const valoresData = valoresR.data?.valores || {};

  if(sv.error || !operatorsObj){
    container.innerHTML="<div style='color:#d00'>Erro ao carregar dados</div>";
    return;
  }

  const services = sv.data;
  container.innerHTML="";

  // VOLTAR
  const backWizard = el("button",{style:"margin-bottom:12px;padding:10px 14px;background:#444;color:#fff;border:0;border-radius:8px;cursor:pointer"},"← Voltar");
  backWizard.onclick=()=>showStartScreen();
  container.appendChild(backWizard);

  // VALORES
  const divValores = el("div",{style:"margin-bottom:15px;padding:12px;border:1px solid #e6e9ef;border-radius:8px;background:#fafbff"});
  divValores.appendChild(el("strong", {}, "Valores:"));
  const vlist = el("div",{id:"valores-list"});

  if(Object.keys(valoresData).length){
    Object.keys(valoresData).forEach(k =>
      vlist.appendChild(el("div",{},`${k.toUpperCase()}: R$ ${valoresData[k]}`))
    );
  } else {
    vlist.innerHTML="Não foi possível carregar valores.";
  }

  divValores.appendChild(vlist);
  container.appendChild(divValores);

  // SERVIÇO
  container.appendChild(el("h3",{},"1) Escolha o serviço"));
  const selService = el("select",{style:"width:100%;padding:10px;border-radius:8px;border:1px solid #ddd"});
  selService.appendChild(el("option",{value:""},"— selecione —"));
  services.forEach(s=>selService.appendChild(el("option",{value:s.id}, s.name)));
  container.appendChild(selService); container.appendChild(el("div",{style:"height:10px"}));

  // PAÍS
  container.appendChild(el("h3",{},"2) Escolha o país"));
  const selCountry = el("select",{style:"width:100%;padding:10px;border-radius:8px;border:1px solid #ddd"});
  selCountry.appendChild(el("option",{value:""},"— selecione —"));
  Object.keys(operatorsObj).forEach(c=>selCountry.appendChild(el("option",{value:c}, c.toUpperCase())));
  container.appendChild(selCountry); container.appendChild(el("div",{style:"height:10px"}));

  // OPERADORA
  container.appendChild(el("h3",{},"3) Escolha a operadora"));
  const selOp = el("select",{style:"width:100%;padding:10px;border-radius:8px;border:1px solid #ddd"});
  selOp.appendChild(el("option",{},"— selecione país primeiro —"));
  container.appendChild(selOp);

  selCountry.onchange=()=>{
    selOp.innerHTML="";
    const list = operatorsObj[selCountry.value] || [];
    selOp.appendChild(el("option",{value:""},"— selecione —"));
    list.forEach(o=>selOp.appendChild(el("option",{value:o}, o)));
    if(list.length === 1) selOp.value = list[0];
  };

  // BOTÃO GERAR
  const btn = el("button",{style:"padding:12px 18px;margin-top:15px;background:#0b5cff;border:0;color:#fff;border-radius:8px;cursor:pointer"},"Gerar Número");
  const result = el("div",{style:"margin-top:15px"});
  container.appendChild(btn); container.appendChild(result);

  btn.onclick=async()=>{

    if(!confirm("Atenção! Os créditos serão deduzidos da sua conta. Deseja continuar?")) return;

    const service = selService.value;
    const country = selCountry.value;
    const op = selOp.value;

    if(!service || !country || !op) {
      alert("Preencha tudo!");
      return;
    }

    btn.textContent="Gerando..."; 
    btn.disabled=true;

    try{

      // 🔥🔥🔥 NOVO: envia a SIGLA correta
      const r = await comprar({
        service,
        country: COUNTRY_MAP[country],
        operator: op,
        activationType: 0
      });

      if(r.error){
        alert(r.message);
        return;
      }

      const d=r.data;
      result.innerHTML="";

      const card = el("div",{style:"border:1px solid #e6e9ef;padding:12px;border-radius:8px;background:#fff"});
      card.appendChild(el("div",{},["Número: ", el("strong",{},formatPhone(d.phoneNumber))]));
      card.appendChild(el("div",{},["Operadora: ", el("strong",{},d.activationOperator)]));
      card.appendChild(el("div",{},["Ativado: ", el("strong",{},fmtDateTime(d.activationTime))]));
      card.appendChild(el("div",{},["Expira: ", el("strong",{},fmtDateTime(d.activationEndTime))]));
      const mins=diffMinutes(d.activationTime,d.activationEndTime);
      if(mins) card.appendChild(el("div",{},[`Tempo: `,el("strong",{},`${mins} min`)]));
      card.appendChild(el("div",{},["ActivationID: ", el("strong",{},d.activationId)]));

      const bMsg=el("button",{style:"padding:10px 14px;background:#0b5cff;color:#fff;border:0;border-radius:8px;margin-top:12px;cursor:pointer"},"Ver mensagens");
      bMsg.addEventListener("click", async ()=>{
        openModalLoading();
        const r2=await verMensagens({activationId:d.activationId});
        if(r2.error) modalBody.innerHTML=`<div>${r2.message}</div>`;
        else renderMessagesList(r2.data,modalBody);
      });

      card.appendChild(bMsg);
      result.appendChild(card);

    } finally {
      btn.textContent="Gerar Número";
      btn.disabled=false;
    }
  };
}

// --------------------- INIT ---------------------
function init(){
  const p=new URLSearchParams(location.search); 
  const id=p.get("activationId");
  if(id){ screenReadMessages(id); return; }
  showStartScreen();
}

init();
