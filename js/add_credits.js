// add_credits.js
// Cria o pedido e prepara o pagamento

// Função para remover pontos e retornar número inteiro
function limparNumeroFormatado(valor) {
    return parseInt(valor.replace(/\./g, ''), 10);
}

// Função para formatar com pontos de milhar
function formatarMilhar(valor) {
    return valor.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

async function adicionarCreditos(amount) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Faça login primeiro!');
        window.location.href = 'login.html';
        return;
    }

    if (!amount || amount <= 0) {
        alert('Informe um valor válido.');
        return;
    }

    // Obtém o botão de envio (se existir)
    const btn = document.querySelector('#add-credits-form button[type="submit"]');
    let originalText = '';
    if (btn) {
        btn.disabled = true;
        originalText = btn.textContent;
        btn.textContent = 'Processando...';
    }

    try {
        const formData = new FormData();
        formData.append('valor', amount);
        formData.append('token', token);

        const res = await fetch(`${API_BASE_URL}/usuarios/add_credits.php`, {
            method: 'POST',
            body: formData
        });

        const data = await res.json();

        if (data.status === 'success') {
            const pedido = data.data; 
            const linkPagamento = `${HOME_BASE_URL}/pix.html?cod=${pedido.codigo_pedido}&id=${pedido.id_usuario}`;

            const root = document.getElementById('add-credits-form');
            root.innerHTML = "";

            const container = document.createElement('div');
            container.style.textAlign = 'center';
            container.style.marginTop = '20px';
            container.innerHTML = `
                <button id="btnContinuarPagamento" style="
                    padding:10px 20px;
                    background-color:#2d89ef;
                    color:white;
                    border:none;
                    border-radius:6px;
                    cursor:pointer;
                    font-size:16px;
                ">💳 Continuar para pagamento</button>
            `;
            root.appendChild(container);

            document.getElementById('btnContinuarPagamento').onclick = () => {
                window.location.href = linkPagamento;
            };

        } else {
            alert('Erro: ' + data.message);
        }

    } catch (err) {
        console.error(err);
        alert('Erro de conexão com a API.');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('add-credits-form');
    const amountInput = document.getElementById('amount');

    // Formatação automática do campo com milhar
    amountInput.addEventListener('input', () => {
        let valor = amountInput.value.replace(/[^0-9]/g, ''); // remove tudo que não é número
        if (valor === '') {
            amountInput.value = '';
            return;
        }
        amountInput.value = formatarMilhar(valor);
    });

    // Prevenir colar valores inválidos
    amountInput.addEventListener('paste', (e) => {
        e.preventDefault();
        return false;
    });

    // Botões de valores rápidos
    document.querySelectorAll('.quick-value').forEach(btn => {
        btn.addEventListener('click', () => {
            const valor = btn.getAttribute('data-value');
            amountInput.value = formatarMilhar(valor);
        });
    });

    if (form) {
        form.addEventListener('submit', e => {
            e.preventDefault();
            
            const valorLimpo = limparNumeroFormatado(amountInput.value);
            if (!valorLimpo || valorLimpo <= 0) {
                alert("Informe um valor inteiro válido.");
                return;
            }

            adicionarCreditos(valorLimpo);
        });
    }
});
