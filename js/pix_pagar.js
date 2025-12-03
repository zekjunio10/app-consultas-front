const API_URL = API_BASE_URL + "/pix/pix_api.php"; // ajuste para seu endpoint

// Função para carregar PIX automaticamente
async function carregarPix(idPedido) {
    try {
        const container = document.getElementById("pix");

        const formData = new FormData();
        formData.append("id_pedido", idPedido);

        const response = await fetch(API_URL, {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (data.error) {
            container.innerHTML = `<p style="color:red; text-align:center;">${data.error}</p>`;
            return;
        }

        container.innerHTML = `
            <div style="
                text-align:center;
                background:#2d89ef;
                color:#fff;
                padding:12px;
                border-radius:8px;
                font-size:22px;
                margin-bottom:18px;
                font-weight:bold;
            ">
                Total a pagar: R$ ${parseFloat(data.valor).toFixed(2)}
            </div>
        `;

        if (data.status === "approved") {
            container.innerHTML += `
                <p style="color:green; text-align:center; font-size:18px;">
                    ✅ Pagamento aprovado!
                </p>
            `;

            if (!data.depositado) {
                container.innerHTML += `
                    <p style="color:orange; text-align:center;">
                        Aguarde a confirmação do depósito em sua conta.
                    </p>
                `;
            }

        } else if (data.status === "pending") {

            container.innerHTML += `
                <div style="text-align:center;">
                    <h3>⌛ Pagamento pendente</h3>
                    <p>Escaneie o QR Code ou copie o código PIX:</p>

                    <textarea id="codigoPix" readonly rows="4" style="
                        width:90%;
                        max-width:600px;
                        padding:10px;
                        border-radius:6px;
                        border:1px solid #999;
                        font-size:15px;
                    ">${data.codigo_qr_texto}</textarea>

                    <br>
                    <button type="button" id="btnCopiarPix" style="
                        margin-top:8px;
                        padding:8px 14px;
                        background:#2d89ef;
                        border:none;
                        border-radius:6px;
                        color:white;
                        font-weight:bold;
                        cursor:pointer;
                    ">Copiar código PIX</button>

                    <br><br>
                </div>
            `;

            let img = document.createElement("img");
            img.src = `data:image/png;base64,${data.codigo_qr_imagem}`;
            img.style = "display:block;margin:10px auto;width:240px;";
            container.appendChild(img);

            document.getElementById("btnCopiarPix").onclick = copiarPix;

        } else if (data.status === "rejected" || data.status === "cancelled") {
            container.innerHTML += `<p style="color:red;text-align:center;">❌ Pagamento não aprovado. Tente novamente.</p>`;

        } else if (data.status === "in_process") {
            container.innerHTML += `<p style="text-align:center;">⏳ Pagamento em processamento...</p>`;

        } else if (data.status === "refunded") {
            container.innerHTML += `<p style="color:blue;text-align:center;">ℹ️ Pagamento estornado.</p>`;

        } else if (data.status === "chargeback") {
            container.innerHTML += `<p style="color:red;text-align:center;">⚠️ Pagamento foi devolvido (chargeback).</p>`;

        } else {
            container.innerHTML += `<p style="text-align:center;">Status: ${data.status}</p>`;
        }

        // Atualiza automaticamente se ainda não finalizado
        if (!(data.status === "approved" && data.depositado)) {
            setTimeout(() => carregarPix(idPedido), 10000);
        }

    } catch (err) {
        console.error("Erro ao carregar PIX:", err);
        document.getElementById("pix").innerHTML = `<p style="color:red;text-align:center;">Erro ao carregar PIX</p>`;
    }
}

// Função copiar código PIX
function copiarPix() {
    const textarea = document.getElementById("codigoPix");
    textarea.select();
    textarea.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(textarea.value)
        .then(() => alert("✅ Código PIX copiado!"))
        .catch(err => alert("❌ Erro ao copiar: " + err));
}

// Executa ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const cod = urlParams.get("cod");
    const id = urlParams.get("id");

    const container = document.getElementById("pix");
    container.innerHTML = `<p style="text-align:center;">Carregando pagamento...</p>`;

    if (!cod || !id) {
        container.innerHTML = `<p style="color:red;text-align:center;">Pedido não informado</p>`;
        return;
    }

    carregarPix(cod);
});
