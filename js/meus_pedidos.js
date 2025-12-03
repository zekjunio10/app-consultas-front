// meus_pedidos.js
// Cria pedidos, exibe lista de pedidos e prepara o pagamento

// 🔹 Função para carregar e exibir pedidos existentes
async function carregarPedidos() {
    const token = localStorage.getItem('token');
    const tabelaDiv = document.getElementById('tabela-pedidos');

    if (!token) {
        alert('Faça login primeiro!');
        window.location.href = 'login.html';
        return;
    }

    // 🔸 Exibe mensagem de carregamento
    tabelaDiv.innerHTML = `
        <p style="
            text-align:center;
            margin-top:30px;
            font-size:18px;
            color:#555;
        ">🔄 Buscando pedidos...</p>
    `;

    const formData = new FormData();
    formData.append('token', token);

    try {
        const res = await fetch(`${API_BASE_URL}/usuarios/meus_pedidos.php`, {
            method: 'POST',
            body: formData
        });

        const data = await res.json();

        if (data.status === 'success' && data.data.pedidos.length > 0) {
            const pedidos = data.data.pedidos;
            tabelaDiv.innerHTML = `
                <h3 style="text-align:center;margin-top:30px;">🧾 Meus Pedidos</h3>
                <table style="width:100%;border-collapse:collapse;margin-top:10px;font-family:sans-serif;">
                    <thead>
                        <tr style="background:#2d89ef;color:#fff;">
                            <th style="padding:8px;">Pedido ID</th>
                            <th style="padding:8px;">Código</th>
                            <th style="padding:8px;">Valor</th>
                            <th style="padding:8px;">Status</th>
                            <th style="padding:8px;">Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pedidos.map(p => {
                            const pago = Number(p.depositado) === 1;
                            //${HOME_BASE_URL}/pix?cod=${pedido.codigo_pedido}&id=${pedido.id_usuario}
                            const link = `${HOME_BASE_URL}/pix.html?cod=${p.codigo_pedido}&id=${p.id_usuario}`;
                            const statusTexto = pago ? 'Depositado' : 'Não pago';
                            const corStatus = pago ? 'green' : 'red';
                            const btnTexto = pago ? 'Ver' : 'Pagar';
                            const btnCor = pago ? '#4CAF50' : '#2d89ef';
            
                            return `
                                <tr style="text-align:center;border-bottom:1px solid #ccc;">
                                    <td style="padding:8px;">${p.id}</td>
                                    <td style="padding:8px;">${p.codigo_pedido}</td>
                                    <td style="padding:8px;">R$ ${parseFloat(p.total || 0).toFixed(2)}</td>
                                    <td style="padding:8px;color:${corStatus};font-weight:bold;">${statusTexto}</td>
                                    <td style="padding:8px;">
                                        <button onclick="window.location.href='${link}'" style="
                                            padding:6px 14px;
                                            border:none;
                                            border-radius:6px;
                                            background:${btnCor};
                                            color:white;
                                            cursor:pointer;
                                            font-weight:bold;
                                        ">${btnTexto}</button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;
        } else {
            tabelaDiv.innerHTML = `
                <p style="text-align:center;margin-top:20px;">Nenhum pedido encontrado.</p>
            `;
        }

    } catch (err) {
        console.error(err);
        tabelaDiv.innerHTML = `
            <p style="text-align:center;margin-top:20px;color:red;">
                ❌ Erro ao carregar pedidos.
            </p>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // 🔸 Carrega lista de pedidos ao abrir a página
    carregarPedidos();
});
