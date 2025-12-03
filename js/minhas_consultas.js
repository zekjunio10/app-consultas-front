// meus_consultas.js
// Exibe a lista de consultas realizadas pelo usuário

let consultasCache = [];

// Loader (spinner) aplicado no botão
function setLoading(btn, isLoading, loadingText = "Carregando...") {
    if (isLoading) {
        btn.dataset.originalText = btn.innerHTML;
        btn.disabled = true;
        btn.style.opacity = "0.7";
        btn.innerHTML = `
            <span class="loader" style="
                display:inline-block;
                width:14px;height:14px;
                border:2px solid rgba(255,255,255,0.6);
                border-top-color:white;
                border-radius:50%;
                animation:spin .6s linear infinite;
                vertical-align:middle;
                margin-right:6px;
            "></span> ${loadingText}`;
    } else {
        btn.innerHTML = btn.dataset.originalText;
        btn.disabled = false;
        btn.style.opacity = "1";
    }
}

// Spinner animation global
const style = document.createElement("style");
style.innerHTML = `@keyframes spin { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }`;
document.head.appendChild(style);

// Toast simples
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
    setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function openBlobInNewTab(blob) {
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// Copiar link
function copiarLink(link) {
    navigator.clipboard.writeText(link)
        .then(() => toast("Link copiado!"))
        .catch(() => toast("Erro ao copiar link."));
}

// Toggle menu copiar
function toggleDropdown(btn) {
    const menu = btn.parentElement.querySelector(".dropdown-menu");
    const isVisible = menu.style.display === "block";
    document.querySelectorAll(".dropdown-menu").forEach(m => m.style.display = "none");
    menu.style.display = isVisible ? "none" : "block";
}

document.addEventListener("click", (e) => {
    if (!e.target.closest(".dropdown-copy")) {
        document.querySelectorAll(".dropdown-menu").forEach(m => m.style.display = "none");
    }
});

async function carregarConsultas() {
    const token = localStorage.getItem('token');
    const tabelaDiv = document.getElementById('tabela-consultas');

    if (!token) {
        alert('Faça login primeiro!');
        window.location.href = 'login.html';
        return;
    }

    tabelaDiv.innerHTML = `<p style="text-align:center;margin-top:30px;">🔄 Buscando consultas...</p>`;

    const formData = new FormData();
    formData.append('token', token);

    try {
        const res = await fetch(`${API_BASE_URL}/usuarios/minhas_consultas.php`, {
            method: 'POST',
            body: formData
        });

        const data = await res.json();
        if (data.status === 'success' && data.data.consultas.length > 0) {
            consultasCache = data.data.consultas;
            renderizarConsultas('todas');
        } else {
            tabelaDiv.innerHTML = `<p style="text-align:center;margin-top:20px;">Nenhuma consulta encontrada.</p>`;
        }

    } catch (err) {
        tabelaDiv.innerHTML = `<p style="text-align:center;margin-top:20px;color:red;">❌ Erro ao carregar consultas.</p>`;
    }
}

function renderizarConsultas(filtro = 'todas') {
    const token = localStorage.getItem("token");
    const tabelaDiv = document.getElementById('tabela-consultas');

    let consultasFiltradas = consultasCache;
    if (filtro === 'sucesso') consultasFiltradas = consultasCache.filter(c => Number(c.sucesso) === 1);
    if (filtro === 'falha') consultasFiltradas = consultasCache.filter(c => Number(c.sucesso) === 0);

    tabelaDiv.innerHTML = `
        <style>
            .btn-standard{padding:6px 14px;border:none;border-radius:6px;color:white;cursor:pointer;font-weight:bold;margin-right:5px;}
            .dropdown-copy{position:relative;display:inline-block;}
            .dropdown-menu{display:none;position:absolute;background:#fff;border:1px solid #ccc;border-radius:6px;min-width:180px;z-index:999;box-shadow:0 3px 12px rgba(0,0,0,.15);}
            .dropdown-menu button{width:100%;padding:8px;border:none;background:none;text-align:left;cursor:pointer;color:black;}
            .dropdown-menu button:hover{background:#f0f0f0;}
        </style>

        <h3 style="text-align:center;margin-top:30px;">📋 Minhas Consultas</h3>

        <div style="text-align:center;margin-bottom:15px;">
            <button class="btn-standard" style="background:#2d89ef;" onclick="renderizarConsultas('todas')">Todas</button>
            <button class="btn-standard" style="background:#4CAF50;" onclick="renderizarConsultas('sucesso')">Sucesso</button>
            <button class="btn-standard" style="background:#f44336;" onclick="renderizarConsultas('falha')">Falha</button>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-top:10px;">
            <thead>
                <tr style="background:#2d89ef;color:#fff;">
                    <th style="padding:8px;">ID</th>
                    <th style="padding:8px;">Nome</th>
                    <th style="padding:8px;">Valor</th>
                    <th style="padding:8px;">Sucesso</th>
                    <th style="padding:8px;">Data</th>
                    <th style="padding:8px;">Ação</th>
                </tr>
            </thead>
            <tbody>
                ${consultasFiltradas.map(c => {
                    const sucesso = Number(c.sucesso) === 1;
                    const linkBase = `${API_BASE_URL}/consultas/baixarpdf.php?con=${c.id}&usu=${c.usuario_id}`;
                    const linkDownload = `${linkBase}&mode=D`;
                    const linkViz = `${linkBase}&mode=I`;
                    const linkEmail = `${linkBase}&mode=email&token=${encodeURIComponent(token)}`;

                    return `
                        <tr style="text-align:center;border-bottom:1px solid #ccc;">
                            <td style="padding:8px;">${c.id}</td>
                            <td style="padding:8px;">${c.nome}</td>
                            <td style="padding:8px;">R$ ${parseFloat(c.valor_consumido || 0).toFixed(2)}</td>
                            <td style="padding:8px;color:${sucesso ? 'green' : 'red'};font-weight:bold;">
                                ${sucesso ? '✅ Sucesso' : '❌ Falha'}
                            </td>
                            <td style="padding:8px;">
                                ${new Date(c.created_at).toLocaleString('pt-BR')}
                            </td>
                            <td style="padding:8px;">
                                ${
                                    sucesso ? `
                                    <button class="btn-standard" style="background:#4CAF50;" onclick="baixarPDF('${linkDownload}', this)">Baixar</button>
                                    <button class="btn-standard" style="background:#7952B3;" onclick="visualizarPDF('${linkViz}', this)">Visualizar</button>
                                    <button class="btn-standard" style="background:#FF9800;" onclick="enviarEmail('${linkEmail}', this)">Email</button>

                                    <div class="dropdown-copy">
                                        <button class="btn-standard" style="background:#2d89ef;" onclick="toggleDropdown(this)">Copiar Link ▾</button>
                                        <div class="dropdown-menu">
                                            <button onclick="copiarLink('${linkDownload}')">Copiar link de Download</button>
                                            <button onclick="copiarLink('${linkViz}')">Copiar link de Visualização</button>
                                        </div>
                                    </div>
                                    ` : `<span style="color:#777;">—</span>`
                                }
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

async function baixarPDF(url, btn) {
    setLoading(btn, true, "Baixando...");
    try {
        const res = await fetch(url);
        const blob = await res.blob();
        const cd = res.headers.get('content-disposition');
        const filename = filenameFromContentDisposition(cd) || "consulta.pdf";
        downloadBlob(blob, filename);
        toast("Download concluído!");
    } catch {
        toast("Erro no download.");
    } finally {
        setLoading(btn, false);
    }
}

async function visualizarPDF(url, btn) {
    setLoading(btn, true, "Abrindo...");
    try {
        const res = await fetch(url);
        const blob = await res.blob();
        openBlobInNewTab(blob);
    } catch {
        toast("Erro ao visualizar PDF.");
    } finally {
        setLoading(btn, false);
    }
}

async function enviarEmail(url, btn) {
    setLoading(btn, true, "Enviando...");
    try {
        const res = await fetch(url);
        const json = await res.json();
        if (json.status === "success") toast("Enviado com sucesso!");
        else toast("Erro ao enviar.");
    } catch {
        toast("Falha na comunicação.");
    } finally {
        setLoading(btn, false);
    }
}

document.addEventListener('DOMContentLoaded', carregarConsultas);

// --------------------- Expor funções globalmente ---------------------
window.visualizarPDF = visualizarPDF;
window.baixarPDF = baixarPDF;
window.enviarEmail = enviarEmail;
window.toggleDropdown = toggleDropdown;
window.copiarLink = copiarLink;
window.renderizarConsultas = renderizarConsultas;
