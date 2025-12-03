async function carregarPerfil() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const formData = new FormData();
        formData.append('token', token);

        const res = await fetch(`${API_BASE_URL}/usuarios/profile.php`, {
            method: 'POST',
            body: formData
        });

        const data = await res.json();

        if (res.ok && data.status === 'success' && data.data) {
            const user = data.data;
            document.getElementById('user-name').innerText = user.nome ?? '—';
            document.getElementById('user-email').innerText = user.email ?? '—';
            document.getElementById('user-credits').innerText = user.creditos ?? '0';
        } else {
            alert('Erro ao carregar perfil: ' + (data.message || 'Resposta inválida da API'));
        }
    } catch (err) {
        console.error(err);
        alert('Erro de conexão com a API.');
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    carregarPerfil();
    const btn = document.getElementById('logout-btn');
    if (btn) btn.addEventListener('click', logout);
});
