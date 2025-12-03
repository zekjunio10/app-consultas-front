// dashboard.js — renderiza todo o conteúdo do <main> via JS
// -------------------------------------------------------

(function () {

    // util simples
    function el(tag, props = {}, children = []) {
      const e = document.createElement(tag);
      for (const k in props) {
        if (k === "class") e.className = props[k];
        else if (k === "html") e.innerHTML = props[k];
        else e.setAttribute(k, props[k]);
      }
      if (typeof children === "string") e.textContent = children;
      else (children || []).forEach(c => e.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
      return e;
    }
  
    const qs = sel => document.querySelector(sel);
  
    // CSS INJETADO
    const css = `
    .dash-wrap{max-width:1200px;margin:26px auto;padding:18px;box-sizing:border-box}
    .dash-quick{display:flex;gap:12px;align-items:center;justify-content:space-between;background:linear-gradient(180deg,#ffffff,#fbfdff);border-radius:12px;padding:14px;border:1px solid rgba(0,0,0,0.06);box-shadow:0 6px 18px rgba(16,24,40,0.06)}
    .dash-info{display:flex;gap:18px;align-items:center}
    .dash-balance{display:flex;flex-direction:column}
    .dash-balance .label{font-size:12px;color:#6b7280}
    .dash-balance .value{font-size:20px;font-weight:700;color:#0b5cff;margin-top:4px}
    .dash-role{background:#fff;padding:8px 12px;border-radius:999px;border:1px solid rgba(11,92,255,0.08);font-weight:600;color:#0b5cff}
    .dash-actions{display:flex;gap:10px;align-items:center}
    .btn-primary{background:#0b5cff;color:#fff;border:0;padding:8px 12px;border-radius:10px;cursor:pointer;font-weight:700;box-shadow:0 6px 18px rgba(11,92,255,0.12);transition:transform .12s ease,box-shadow .12s ease}
    .btn-secondary{background:transparent;border:1px solid #e6eefc;color:#0b5cff;padding:8px 10px;border-radius:10px;cursor:pointer}
    .btn-primary:active{transform:translateY(1px)}
    .dash-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:18px}
    .card{background:#fff;border-radius:16px;padding:18px;box-shadow:0 8px 24px rgba(16,24,40,0.06);cursor:pointer;border:1px solid rgba(10,20,50,0.03);transition:transform .18s ease,box-shadow .18s ease}
    .card:hover{transform:translateY(-6px);box-shadow:0 18px 40px rgba(11,92,255,0.09)}
    .card .icon{font-size:28px;margin-bottom:10px;display:inline-block}
    .card h4{margin:0 0 6px 0;font-size:16px}
    .card p{margin:0;color:#6b7280;font-size:13px}
    .fade-in{animation:fadeInUp .36s ease both}
    @keyframes fadeInUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @media(max-width:1000px){ .dash-grid{grid-template-columns:repeat(2,1fr)} }
    @media(max-width:640px){ .dash-grid{grid-template-columns:1fr} .dash-quick{flex-direction:column;align-items:stretch;gap:12px} }
    `;
  
    document.head.appendChild(el("style", { type: "text/css" }, css));
  
    // formato dinheiro
    function formatCurrency(v) {
      const n = Number(v);
      return isNaN(n) ? v : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    }
  
    // pega dados do usuário na API
    async function getUser() {
        try {
          const token = localStorage.getItem("token") || "";
      
          if (!token) return null;
      
          const formData = new FormData();
          formData.append("token", token);
      
          const res = await fetch(`${API_BASE_URL}/usuarios/profile.php`, {
            method: "POST",
            body: formData
          });
      
          if (!res.ok) throw new Error("Falha HTTP");
      
          const json = await res.json();
      
          if (!json || !json.data) throw new Error("Resposta inválida");
      
          return json.data; // nome, cargo, creditos
        } catch (e) {
          return null;
        }
      }
      
      
  
    async function render() {
      const main = qs("main");
      main.innerHTML = "";
  
      const user = await getUser();
  
      if (!user) {
        main.innerHTML = `
          <div style="max-width:600px;margin:40px auto;padding:20px;background:#fff;border-radius:12px;
          box-shadow:0 6px 20px rgba(0,0,0,0.1);text-align:center">
            <h2 style="color:#d00;margin-bottom:10px">Erro ao conectar ao sistema</h2>
            <p style="font-size:15px;color:#444;margin-bottom:20px">
              Não foi possível carregar seus dados.  
              Por favor, recarregue a página.
            </p>
            <button onclick="location.reload()" style="
              background:#0b5cff;color:#fff;padding:10px 18px;border:0;border-radius:8px;cursor:pointer;
              font-weight:600">Recarregar Página</button>
          </div>
        `;
        return;
      }
  
      const wrap = el("div", { class: "dash-wrap" });
  
      // painel rápido
      const quick = el("div", { class: "dash-quick fade-in" });
  
      const info = el("div", { class: "dash-info" });
  
      const bal = el("div", { class: "dash-balance" });
      bal.appendChild(el("div", { class: "label" }, "💰 Saldo"));
      bal.appendChild(el("div", { class: "value" }, formatCurrency(user.creditos)));
  
      const role = el("div", { class: "dash-role" }, user.cargo);
  
      info.appendChild(bal);
      info.appendChild(role);
  
      const actions = el("div", { class: "dash-actions" });
      const addBtn = el("button", { class: "btn-primary" }, "➕ Adicionar Créditos");
      addBtn.onclick = () => location.href = "add_credits.html";
  
      const perfilBtn = el("button", { class: "btn-secondary" }, "🔎 Ver perfil");
      perfilBtn.onclick = () => location.href = "perfil.html";
  
      actions.appendChild(perfilBtn);
      actions.appendChild(addBtn);
  
      quick.appendChild(info);
      quick.appendChild(actions);
  
      wrap.appendChild(quick);
  
      // cards
      const cards = [
        { icon: "🔍", title: "Realizar Consulta", desc: "Consultar CPF, CNPJ e veículos", href: "consultas.html" },
        { icon: "📂", title: "Minhas Consultas", desc: "Histórico e downloads", href: "minhas_consultas.html" },
        { icon: "💳", title: "Adicionar Créditos", desc: "Recarregar sua conta", href: "add_credits.html" },
        { icon: "🧾", title: "Meus Pagamentos", desc: "Ver transações", href: "meus_pedidos.html" },
        { icon: "📱", title: "Chip Virtual", desc: "Gerar número temporário", href: "chip_virtual.html" },
        { icon: "👤", title: "Perfil", desc: "Editar dados e sair", href: "perfil.html" }
      ];
  
      const grid = el("div", { class: "dash-grid" });
  
      cards.forEach((c, i) => {
        const card = el("div", { class: "card fade-in" });
        card.style.animationDelay = `${i * 45}ms`;
  
        card.onclick = () => location.href = c.href;
  
        card.appendChild(el("div", { class: "icon" }, c.icon));
        card.appendChild(el("h4", {}, c.title));
        card.appendChild(el("p", {}, c.desc));
  
        grid.appendChild(card);
      });
  
      wrap.appendChild(grid);
  
      main.appendChild(wrap);
    }
  
    render();
  
  })();
  