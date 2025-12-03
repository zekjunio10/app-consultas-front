const msg = document.getElementById("msg");
const params = new URLSearchParams(window.location.search);

const userId = params.get("u");
const userToken = params.get("t");

function showMessage(text, success = false) {
    msg.innerText = text;
    msg.style.display = "block";
    msg.style.padding = "10px";
    msg.style.marginTop = "10px";
    msg.style.borderRadius = "6px";
    msg.style.fontWeight = "600";
    msg.style.background = success ? "#d4edda" : "#f8d7da";
    msg.style.color = success ? "#155724" : "#721c24";
    msg.style.border = success ? "1px solid #c3e6cb" : "1px solid #f5c6cb";
}

function setLoading(button, loading = true) {
    if (loading) {
        button.dataset.originalText = button.innerText;
        button.innerText = "Aguarde...";
        button.disabled = true;
        button.style.opacity = "0.7";
    } else {
        button.innerText = button.dataset.originalText;
        button.disabled = false;
        button.style.opacity = "1";
    }
}

if (userId && userToken) {

    // Mostrar formulário de redefinição de senha
    document.getElementById("stage_email").style.display = "none";
    document.getElementById("stage_reset").style.display = "block";

    document.getElementById("btnReset").onclick = async () => {
        const btn = document.getElementById("btnReset");
        setLoading(btn, true);

        const newPass = document.getElementById("new_password").value;
        const formData = new FormData();
        formData.append("id", userId);
        formData.append("token", userToken);
        formData.append("new_password", newPass);

        const res = await fetch(API_BASE_URL + "/usuarios/recuperar_senha.php", {
            method: "POST",
            body: formData
        });

        const json = await res.json();
        setLoading(btn, false);

        if (json.status === "success") {
            showMessage(json.message, true);

            // Esconder formulário
            document.getElementById("stage_reset").style.display = "none";

            // Mostrar botão de login
            msg.insertAdjacentHTML("afterend", `
                <a href="login.html" style="
                    display:inline-block;
                    margin-top:15px;
                    padding:10px 15px;
                    background:#007bff;
                    color:white;
                    border-radius:5px;
                    text-decoration:none;">
                    Fazer Login
                </a>
            `);

        } else {
            showMessage(json.message, false);
        }
    };

} else {

    // Mostrar formulário de e-mail
    document.getElementById("stage_email").style.display = "block";
    document.getElementById("stage_reset").style.display = "none";

    document.getElementById("btnSend").onclick = async () => {
        const btn = document.getElementById("btnSend");
        setLoading(btn, true);

        const email = document.getElementById("email").value;
        const formData = new FormData();
        formData.append("email", email);

        // Dispara requisição — independentemente do retorno
        await fetch(API_BASE_URL + "/usuarios/recuperar_senha.php", {
            method: "POST",
            body: formData
        });

        setLoading(btn, false);

        // *** Mensagem fixa de segurança ***
        showMessage(
            "Se este e-mail estiver cadastrado, enviaremos um link para recuperação da senha.",
            true
        );

        // Sempre esconder formulário
        document.getElementById("stage_email").style.display = "none";
    };
}
