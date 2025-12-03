// consultas.js
// Página de consultas - lista as categorias e agrupa as consultas

document.addEventListener('DOMContentLoaded', async () => {

    const token = localStorage.getItem('token');
    const consultasList = document.getElementById('consultas-list');

    if (!token) {
        alert('Faça login primeiro!');
        window.location.href = 'login.html';
        return;
    }

    consultasList.innerHTML = '<p style="text-align:center;">⏳ Carregando consultas...</p>';

    // -------------------- Helpers --------------------

    function toast(msg) {
        const t = document.createElement("div");
        t.style.position = "fixed";
        t.style.bottom = "20px";
        t.style.right = "20px";
        t.style.padding = "10px 14px";
        t.style.background = "#111";
        t.style.color = "#fff";
        t.style.fontSize = "14px";
        t.style.borderRadius = "6px";
        t.style.opacity = "0";
        t.style.transition = "opacity .25s";
        t.innerText = msg;
        document.body.appendChild(t);
        setTimeout(() => t.style.opacity = "1", 50);
        setTimeout(() => { t.style.opacity = "0"; setTimeout(() => t.remove(), 300); }, 2500);
    }

    function copiar(link) {
        navigator.clipboard.writeText(link)
            .then(() => toast("Link copiado!"))
            .catch(() => toast("Erro ao copiar link."));
    }

    function filenameFromContentDisposition(header) {
        if (!header) return null;
        const match = /filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i.exec(header);
        return match ? decodeURIComponent(match[1]) : null;
    }

    function downloadBlob(blob, filename = 'consulta.pdf') {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
    }

    function openBlobInNewTab(blob) {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 1500);
    }

    function formatJsonHuman(obj, indent = 0) {
        const spacing = '  '.repeat(indent);
        if (typeof obj !== 'object' || obj === null) return `${obj}`;
        if (Array.isArray(obj)) {
            if (!obj.length) return spacing + '[]';
            return obj.map((item, i) => spacing + `- Item ${i + 1}:\n` + formatJsonHuman(item, indent + 1)).join('\n');
        }
        return Object.entries(obj)
            .map(([k, v]) => typeof v === 'object'
                ? `${spacing}${k}:\n${formatJsonHuman(v, indent + 1)}`
                : `${spacing}${k}: ${v}`)
            .join('\n');
    }

    // -------------------- Carregamento --------------------

    try {

        const catRes = await fetch(`${API_BASE_URL}/categorias/list.php?token=${encodeURIComponent(token)}`);
        const { data: categorias } = await catRes.json();

        const consRes = await fetch(`${API_BASE_URL}/consultas/list.php?token=${encodeURIComponent(token)}`);
        const { data: consultas } = await consRes.json();

        consultasList.innerHTML = '';

        const agrupado = {};
        categorias.forEach(c => agrupado[c.id] = { ...c, consultas: [] });
        consultas.forEach(c => agrupado[c.categoria_id]?.consultas.push(c));

        Object.values(agrupado).forEach(cat => {

            const catContainer = document.createElement('div');
            catContainer.className = 'categoria-container';

            const catHeader = document.createElement('button');
            catHeader.className = 'categoria-header';
            catHeader.innerText = cat.nome;

            const catBody = document.createElement('div');
            catBody.className = 'categoria-body';
            catBody.style.display = 'none';

            catContainer.appendChild(catHeader);
            catContainer.appendChild(catBody);
            consultasList.appendChild(catContainer);

            catHeader.addEventListener('click', () => {
                catBody.style.display = catBody.style.display === 'none' ? 'block' : 'none';
            });

            cat.consultas.forEach(c => {

                const card = document.createElement('div');
                card.className = 'consulta-card';

                const parametros = (c.parametro || '').split(',').map(p => p.trim()).filter(Boolean);
                let camposHtml = parametros.map(p => `
                    <label>${p.toUpperCase()}</label>
                    <input type="text" name="${p}" placeholder="Digite ${p.toUpperCase()}">
                `).join('');

                let exemploHtml = '';
                if (c.exemplo) {
                    try {
                        const obj = JSON.parse(c.exemplo);
                        exemploHtml = `
                            <button class="btn-exemplo">Ver Exemplo</button>
                            <pre class="exemplo-box" style="display:none; white-space:pre-wrap; max-height:240px; overflow:auto;">${formatJsonHuman(obj)}</pre>
                        `;
                    } catch {}
                }

                // ---------- ALTERAÇÃO AQUI: VALORES DINÂMICOS ----------
                let valorHtml = '';
                if (c.valor !== undefined && c.valor !== null)
                    valorHtml += `<p><strong>Valor:</strong> R$ ${parseFloat(c.valor).toFixed(2)}</p>`;
                if (c.valor_consultor !== undefined && c.valor_consultor !== null)
                    valorHtml += `<p><strong>Valor Consultor:</strong> R$ ${parseFloat(c.valor_consultor).toFixed(2)}</p>`;
                if (c.valor_admin !== undefined && c.valor_admin !== null)
                    valorHtml += `<p><strong>Valor Admin:</strong> R$ ${parseFloat(c.valor_admin).toFixed(2)}</p>`;
                // -------------------------------------------------------

                card.innerHTML = `
                    <h3>${c.nome}</h3>
                    <p>${c.descricao}</p>
                    ${exemploHtml}
                    ${valorHtml}
                    <button class="btn-iniciar">Iniciar</button>
                    <div class="consulta-detalhes" style="display:none;">
                        <form class="consulta-form">
                            ${camposHtml}
                            <button type="submit">Consultar</button>
                        </form>
                        <pre class="resultado"></pre>
                    </div>
                `;

                catBody.appendChild(card);

                const btnExemplo = card.querySelector('.btn-exemplo');
                const box = card.querySelector('.exemplo-box');
                if (btnExemplo) {
                    btnExemplo.addEventListener('click', () => {
                        const open = box.style.display === 'block';
                        box.style.display = open ? 'none' : 'block';
                        btnExemplo.innerText = open ? 'Ver Exemplo' : 'Ocultar Exemplo';
                    });
                }

                const form = card.querySelector('.consulta-form');
                const resultado = card.querySelector('.resultado');
                const detalhes = card.querySelector('.consulta-detalhes');
                const btnIniciar = card.querySelector('.btn-iniciar');
                const btnSubmit = form.querySelector('button');

                btnIniciar.addEventListener('click', () => {
                    detalhes.style.display = detalhes.style.display === 'block' ? 'none' : 'block';
                });

                form.addEventListener('submit', async e => {
                    e.preventDefault();

                    for (let input of form.querySelectorAll("input")) {
                        if (!input.value.trim()) {
                            toast("Preencha todos os campos.");
                            return;
                        }
                    }

                    if (!confirm("CONFIRME ANTES DE ENVIAR:\nA consulta será cobrada mesmo se os dados estiverem incorretos.\nDeseja continuar?")) return;

                    const formData = new FormData();
                    formData.append('token', token);
                    formData.append('consulta_id', c.id);

                    for (let input of form.querySelectorAll("input")) {
                        formData.append(input.name, input.value.trim());
                    }

                    btnSubmit.disabled = true;
                    btnSubmit.innerText = 'Consultando…';

                    try {
                        const r = await fetch(`${API_BASE_URL}/consultas/consulta.php`, { method: 'POST', body: formData });
                        const data = await r.json();

                        if (data.status !== 'success') {
                            resultado.innerText = `Erro: ${data.message}`;
                        } else {
                            try {
                                resultado.innerText = formatJsonHuman(JSON.parse(data.data.dados));
                            } catch {
                                resultado.innerText = data.data.dados;
                            }

                            const returnedLink = data.data.link;
                            const linkDownload = `${returnedLink}&mode=D`;
                            const linkViz = `${returnedLink}&mode=I`;
                            const linkEmail = `${returnedLink}&mode=email&token=${encodeURIComponent(token)}`;

                            const wrapper = document.createElement("div");
                            wrapper.className = "consulta-actions-wrapper";
                            wrapper.style.margin = "8px 0";
                            wrapper.style.display = "flex";
                            wrapper.style.gap = "6px";
                            wrapper.style.flexWrap = "wrap";
                            wrapper.innerHTML = `
                                <button class="btn-bx">Baixar</button>
                                <button class="btn-vz">Visualizar</button>
                                <button class="btn-mail">Email</button>

                                <div class="dropdown-copy" style="position:relative;">
                                    <button class="btn-copy">Copiar Link ▾</button>
                                    <div class="copy-menu" style="display:none; background:#fff; border:1px solid #ccc; padding:6px; border-radius:4px; min-width:160px; z-index:999; position:absolute;">
                                        <button class="copy-dw">Copiar Download</button>
                                        <button class="copy-vz">Copiar Visualização</button>
                                    </div>
                                </div>
                            `;

                            const existing = resultado.parentNode.querySelector('.consulta-actions-wrapper');
                            if (existing) existing.remove();

                            resultado.parentNode.insertBefore(wrapper, resultado);

                            // Botão BAIXAR
                            wrapper.querySelector(".btn-bx").onclick = async function () {
                                const btn = this;
                                const label = btn.innerText;
                                btn.disabled = true;
                                btn.innerText = "Gerando...";
                                try {
                                    const resPdf = await fetch(linkDownload);
                                    const blob = await resPdf.blob();
                                    const cd = resPdf.headers.get('content-disposition');
                                    const filename = filenameFromContentDisposition(cd) || "consulta.pdf";
                                    downloadBlob(blob, filename);
                                } catch {
                                    toast("Erro ao baixar.");
                                }
                                btn.disabled = false;
                                btn.innerText = label;
                            };

                            // Botão VISUALIZAR
                            wrapper.querySelector(".btn-vz").onclick = async function () {
                                const btn = this;
                                const label = btn.innerText;
                                btn.disabled = true;
                                btn.innerText = "Abrindo...";
                                try {
                                    const resPdf = await fetch(linkViz);
                                    const blob = await resPdf.blob();
                                    openBlobInNewTab(blob);
                                } catch {
                                    toast("Erro ao visualizar.");
                                }
                                btn.disabled = false;
                                btn.innerText = label;
                            };

                            // Botão EMAIL
                            wrapper.querySelector(".btn-mail").onclick = async function () {
                                const btn = this;
                                const label = btn.innerText;
                                btn.disabled = true;
                                btn.innerText = "Enviando...";
                                try {
                                    const rEmail = await fetch(linkEmail);
                                    const j = await rEmail.json();
                                    toast(j.status === "success" ? "Enviado!" : "Erro ao enviar.");
                                } catch {
                                    toast("Falha ao enviar.");
                                }
                                btn.disabled = false;
                                btn.innerText = label;
                            };

                            const menu = wrapper.querySelector(".copy-menu");
                            wrapper.querySelector(".btn-copy").onclick = (ev) => {
                                ev.stopPropagation();
                                menu.style.display = menu.style.display === "block" ? "none" : "block";
                            };
                            wrapper.querySelector(".copy-dw").onclick = () => copiar(linkDownload);
                            wrapper.querySelector(".copy-vz").onclick = () => copiar(linkViz);

                            document.addEventListener('click', (ev) => {
                                if (!ev.target.closest('.dropdown-copy')) {
                                    menu.style.display = 'none';
                                }
                            });
                        }

                    } catch (err) {
                        resultado.innerText = 'Erro na comunicação.';
                    }

                    btnSubmit.disabled = false;
                    btnSubmit.innerText = 'Consultar';
                });
            });
        });

    } catch (err) {
        consultasList.innerText = 'Erro ao carregar.';
    }

});
