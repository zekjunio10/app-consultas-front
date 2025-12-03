// auth.js

// Função para alterar estado do botão
function setLoading(button, loading = true) {
    if (!button) return;

    if (loading) {
        button.dataset.originalText = button.innerText;
        button.innerText = "Aguarde...";
        button.disabled = true;
        button.style.opacity = "0.7";
    } else {
        button.innerText = button.dataset.originalText || button.innerText;
        button.disabled = false;
        button.style.opacity = "1";
    }
}

async function login(email, password, btn) {
    try {
        setLoading(btn, true);

        const formData = new FormData();
        formData.append('email', email);
        formData.append('senha', password);

        const res = await fetch(`${API_BASE_URL}/usuarios/login.php`, {
            method: 'POST',
            body: formData
        });

        const data = await res.json();

        setLoading(btn, false);

        if (res.ok && data.success !== false) {
            localStorage.setItem('token', data.data?.api_token || data.api_token || '');
            alert('Login realizado com sucesso!');
            window.location.href = 'dashboard.html';
        } else {
            alert('Erro: ' + (data.message || 'Falha no login.'));
        }
    } catch (err) {
        setLoading(btn, false);
        console.error(err);
        alert('Erro de conexão com a API.');
    }
}

async function register(name, email, password, btn) {
    try {
        setLoading(btn, true);

        const formData = new FormData();
        formData.append('nome', name);
        formData.append('email', email);
        formData.append('senha', password);

        const res = await fetch(`${API_BASE_URL}/usuarios/register.php`, {
            method: 'POST',
            body: formData
        });

        const data = await res.json();

        setLoading(btn, false);

        if (res.ok && data.success !== false) {
            alert('Registro realizado com sucesso! Faça login.');
            window.location.href = 'login.html';
        } else {
            alert('Erro: ' + (data.message || 'Falha ao registrar.'));
        }
    } catch (err) {
        setLoading(btn, false);
        console.error(err);
        alert('Erro de conexão com a API.');
    }
}

// Eventos
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', e => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btn = loginForm.querySelector("button[type='submit']");
            login(email, password, btn);
        });
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', e => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btn = registerForm.querySelector("button[type='submit']");
            register(name, email, password, btn);
        });
    }
});
