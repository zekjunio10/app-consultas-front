// header.js
// Insere o cabeçalho de navegação reutilizável e responsivo em todas as páginas

function carregarHeader() {
    const headerHTML = `
        <header class="main-header">
            <div class="nav-container">
                <div class="logo">🔍 Consultas Brasil</div>
                <button class="menu-toggle" aria-label="Abrir menu">☰</button>
                <nav class="nav-links">
                    <a href="dashboard.html">Dashboard</a>
                    <a href="consultas.html">Realizar Consulta</a>
                    <a href="minhas_consultas.html">Minhas Consultas</a>
                    <a href="add_credits.html">Adicionar Créditos</a>
                    <a href="meus_pedidos.html">Meus Pagamentos</a>
                    <a href="chip_virtual.html">Chip Virtual</a>
                    <a href="perfil.html">Perfil / Sair</a>
                </nav>
            </div>
        </header>

        <style>
            .main-header {
                background: #2d89ef;
                color: white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.15);
                position: sticky;
                top: 0;
                z-index: 999;
            }

            .nav-container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 10px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
            }

            .logo {
                font-size: 18px;
                font-weight: bold;
                letter-spacing: 0.5px;
            }

            .menu-toggle {
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                display: none;
            }

            .nav-links {
                display: flex;
                gap: 20px;
                flex-wrap: wrap;
            }

            .nav-links a {
                color: white;
                text-decoration: none;
                font-weight: bold;
                transition: 0.2s;
            }

            .nav-links a:hover {
                text-decoration: underline;
                opacity: 0.9;
            }

            .nav-links a.active {
                text-decoration: underline;
            }

            @media (max-width: 768px) {
                .menu-toggle {
                    display: block;
                }

                .nav-links {
                    display: none;
                    width: 100%;
                    flex-direction: column;
                    background: #1d5fbf;
                    margin-top: 10px;
                    border-radius: 8px;
                }

                .nav-links.show {
                    display: flex;
                }

                .nav-links a {
                    padding: 10px;
                    border-bottom: 1px solid rgba(255,255,255,0.2);
                }

                .nav-links a:last-child {
                    border-bottom: none;
                }
            }
        </style>
    `;

    document.body.insertAdjacentHTML("afterbegin", headerHTML);

    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");

    menuToggle.addEventListener("click", () => {
        navLinks.classList.toggle("show");
    });

    const currentPage = location.pathname.split("/").pop();
    document.querySelectorAll(".nav-links a").forEach(link => {
        if (link.getAttribute("href") === currentPage) {
            link.classList.add("active");
        }
    });
}

// CHAMA DIRETAMENTE — sem depender de DOMContentLoaded
carregarHeader();
