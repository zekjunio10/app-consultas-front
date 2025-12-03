const token = localStorage.getItem('token');
    if (token) {

      const version = '20251120'; // você pode atualizar manualmente ou usar timestamp
      const script = document.createElement('script');
      script.src = `js/header.js?v=${version}`;
      document.head.appendChild(script);
    
    }


// --- utilitário: formata JSON para leitura humana
function formatJsonHuman(obj, indent = 0) {
  const spacing = '  '.repeat(indent);
  if (typeof obj !== 'object' || obj === null) return `${obj}`;
  if (Array.isArray(obj)) {
    if (obj.length === 0) return spacing + '[]';
    return obj
      .map((item, i) => spacing + `- Item ${i + 1}:\n` + formatJsonHuman(item, indent + 1))
      .join('\n');
  }
  return Object.entries(obj)
    .map(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        return `${spacing}${key}:\n${formatJsonHuman(value, indent + 1)}`;
      } else {
        return `${spacing}${key}: ${value}`;
      }
    })
    .join('\n');
}

// --- renderiza a apresentação inicial imediatamente
function renderApresentacao() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <section class="hero">
      <h1>🔍 Consultas Brasil</h1>
      <p>✅ Faça consultas veiculares, de pessoas físicas e jurídicas com rapidez e segurança.</p>
      <p>✅ Consulte roubo/furto, dados cadastrais, situação de CNPJ e muito mais.</p>
      <p>✅ As consultas ficam disponíveis para <strong>download em PDF 24h por dia</strong>.</p>
      <p>✅ Modo <strong>pré-pago</strong> — sem planos, sem mensalidade.</p>
      <div class="buttons">
        <a href="register.html">Criar Conta</a>
        <a href="login.html">Fazer Login</a>
      </div>
    </section>
    <section id="categorias">
      <p>Carregando categorias...</p>
    </section>
  `;
}

// --- carrega as categorias de forma assíncrona
async function loadCategorias() {
  const container = document.getElementById("categorias");
  try {
    const res = await fetch(`${API_BASE_URL}/categorias/list`);
    const data = await res.json();

    if (data.status !== "success" || !Array.isArray(data.data)) {
      container.innerHTML = `<p>Não foi possível carregar as categorias.</p>`;
      return;
    }

    container.innerHTML = "<h2>Consultas Disponíveis</h2>";

    data.data.forEach(cat => {
      const div = document.createElement("div");
      div.className = "categoria";
      div.innerHTML = `
        <h3>${cat.nome}</h3>
        <p>${cat.descricao}</p>
        <button data-id="${cat.id}">Ver Consultas</button>
      `;
      div.querySelector("button").addEventListener("click", () => loadConsultas(cat.id, cat.nome));
      container.appendChild(div);
    });

  } catch (err) {
    container.innerHTML = `<p>Erro ao carregar categorias: ${err.message}</p>`;
  }
}

// --- carrega consultas de uma categoria sob demanda
async function loadConsultas(categoriaId, categoriaNome) {
  const container = document.getElementById("categorias");
  container.innerHTML = `<p>Carregando consultas de ${categoriaNome}...</p>`;

  try {
    const res = await fetch(`${API_BASE_URL}/consultas/list?categoria_id=${categoriaId}`);
    const data = await res.json();

    if (data.status !== "success" || !Array.isArray(data.data)) {
      container.innerHTML = `<p>Não foi possível carregar as consultas.</p>`;
      return;
    }

    container.innerHTML = `
      <h2>${categoriaNome}</h2>
      <button id="voltar">← Voltar</button>
    `;

    document.getElementById("voltar").addEventListener("click", loadCategorias);

    data.data.forEach(cons => {
      const div = document.createElement("div");
      div.className = "consulta";

      // descrição resumida + toggle
      const descCompleta = cons.descricao || "";
      const descCurta = descCompleta.length > 120 ? descCompleta.slice(0, 120) + "..." : descCompleta;
      const temMais = descCompleta.length > 120;

      // exemplo JSON formatado
      let exemploHTML = "";
      if (cons.exemplo) {
        try {
          const parsed = JSON.parse(cons.exemplo);
          exemploHTML = `<pre>${formatJsonHuman(parsed)}</pre>`;
        } catch {
          exemploHTML = `<pre>${cons.exemplo}</pre>`;
        }
      }

      div.innerHTML = `
        <h4>${cons.nome}</h4>
        <p class="descricao">${descCurta}</p>
        ${temMais ? `<button class="toggle-desc">Ver descrição completa</button>` : ""}
        ${exemploHTML ? `<button class="toggle-exemplo">Ver exemplo</button>
                        <div class="exemplo" style="display:none;">${exemploHTML}</div>` : ""}
        <button class="realizar" onclick="location.href='register.html'">Realizar Consulta</button>
      `;

      // comportamento de expandir descrição
      const descBtn = div.querySelector(".toggle-desc");
      if (descBtn) {
        const p = div.querySelector(".descricao");
        let expanded = false;
        descBtn.addEventListener("click", () => {
          expanded = !expanded;
          p.textContent = expanded ? descCompleta : descCurta;
          descBtn.textContent = expanded ? "Ocultar descrição" : "Ver descrição completa";
        });
      }

      // comportamento de expandir exemplo
      const exBtn = div.querySelector(".toggle-exemplo");
      if (exBtn) {
        const ex = div.querySelector(".exemplo");
        let showing = false;
        exBtn.addEventListener("click", () => {
          showing = !showing;
          ex.style.display = showing ? "block" : "none";
          exBtn.textContent = showing ? "Ocultar exemplo" : "Ver exemplo";
        });
      }

      container.appendChild(div);
    });

  } catch (err) {
    container.innerHTML = `<p>Erro ao carregar consultas: ${err.message}</p>`;
  }
}

// --- inicialização
renderApresentacao();
loadCategorias();
