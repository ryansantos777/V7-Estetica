// URL do Tailwind CSS para inclusão nos arquivos HTML
const TAILWIND_SCRIPT = '<script src="https://cdn.tailwindcss.com"></script>';
const LUCIDE_SCRIPT = '<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>';

// Dados de Serviços (Centralizados)
const servicesData = [
    { id: 'vitrificacao', name: 'Vitrificação de Pintura', category: 'Proteção', description: 'Proteção duradoura contra raios UV, chuva ácida e arranhões leves. Garante brilho espelhado por até 3 anos.', price: 'R$ 1.200', details: ['Preparo em 3 etapas', 'Aplicação de coating cerâmico 9H', 'Cura IR (Infravermelho)'] },
    { id: 'selantes', name: 'Aplicação de Selantes Sintéticos', category: 'Proteção', description: 'Proteção e brilho temporário (até 6 meses). Opção econômica para proteção de rotina.', price: 'R$ 450', details: ['Lavagem detalhada', 'Descontaminação da pintura', 'Aplicação de selante polimérico'] },
    { id: 'polimento', name: 'Polimento Técnico', category: 'Restauração', description: 'Remoção de riscos leves, hologramas e imperfeições. Devolve o brilho original da pintura.', price: 'R$ 800', details: ['Inspeção de pintura', 'Múltiplas etapas de corte, refino e lustro', 'Proteção com cera de carnaúba'] },
    { id: 'martelinho', name: 'Martelinho de Ouro', category: 'Restauração', description: 'Reparo de amassados sem a necessidade de repintura, preservando a originalidade do carro.', price: 'Sob Avaliação', details: ['Avaliação do dano', 'Remoção por alavancas e ventosas', 'Acabamento fino'] },
    { id: 'higienizacao', name: 'Higienização Interna Completa', category: 'Interna', description: 'Limpeza profunda de bancos, carpetes, teto e painel. Remove sujeira, ácaros e odores para um ambiente fresco e saudável.', price: 'R$ 600', details: ['Extração em bancos e carpetes', 'Limpeza e hidratação de plásticos/couro', 'Oxi-sanitização'] },
];

// Exporta dados de serviços para uso nas funções de renderização
window.servicesData = servicesData;

// Estado de autenticação
let loggedInUser = null;

// =================================================================
// Funções de Utilidade Global
// =================================================================

// 1. Simulação de Hashing Simples (para fins acadêmicos e 'localStorage')
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash.toString();
}

// 2. Modal de Mensagens (Substitui alert/confirm)
function showMessageModal(title, message, callback = null) {
    const modalHTML = `
        <div id="custom-modal" class="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
            <div class="bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm p-6 modal-content">
                <h3 class="text-xl font-bold text-yellow-500 mb-3">${title}</h3>
                <p class="text-gray-300 mb-6">${message}</p>
                <div class="text-right">
                    <button id="modal-close-button" class="bg-yellow-500 text-gray-900 font-semibold py-2 px-4 rounded-lg hover:bg-yellow-400 transition duration-300">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('custom-modal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    document.getElementById('modal-close-button').onclick = () => {
        document.getElementById('custom-modal').remove();
        if (callback) callback();
    };
}
window.showMessageModal = showMessageModal;


// 3. Função de Fetch com Backoff para API Externa
async function fetchWithBackoff(url, options = {}, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error);
            if (i === retries - 1) throw error;
            const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// =================================================================
// Lógica de Autenticação (localStorage)
// =================================================================

function initAuth() {
    const user = localStorage.getItem('v7_user');
    if (user) {
        try {
            loggedInUser = JSON.parse(user);
        } catch (e) {
            console.error("Erro ao carregar usuário do localStorage:", e);
            localStorage.removeItem('v7_user');
        }
    }
    updateAuthUI();
}

function updateAuthUI() {
    const authLink = document.getElementById('auth-link');
    const mobileAuthLink = document.getElementById('mobile-auth-link');
    
    if (authLink) {
        if (loggedInUser) {
            authLink.textContent = `Olá, ${loggedInUser.name.split(' ')[0]} (Sair)`;
            authLink.href = 'javascript:void(0)'; // Previne navegação se o logout for feito via JS
            authLink.onclick = logout;
        } else {
            authLink.textContent = 'Login/Cadastro';
            authLink.href = 'login.html';
            authLink.onclick = null;
        }
    }
    
     if (mobileAuthLink) {
        if (loggedInUser) {
            mobileAuthLink.textContent = `Olá, ${loggedInUser.name.split(' ')[0]} (Sair)`;
            mobileAuthLink.href = 'javascript:void(0)'; 
            mobileAuthLink.onclick = logout;
        } else {
            mobileAuthLink.textContent = 'Login/Cadastro';
            mobileAuthLink.href = 'login.html';
            mobileAuthLink.onclick = null;
        }
    }
}
window.updateAuthUI = updateAuthUI;


function logout() {
    localStorage.removeItem('v7_user');
    loggedInUser = null;
    updateAuthUI();
    showMessageModal('Sucesso', 'Você saiu da sua conta.', () => {
        window.location.href = 'index.html'; // Redireciona para home após logout
    });
}
window.logout = logout;


// =================================================================
// Lógica Específica de Login e Cadastro
// =================================================================

// Login
function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const storedUser = localStorage.getItem(email);
    
    if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.passwordHash === simpleHash(password)) {
            loggedInUser = { name: user.name, email: user.email };
            localStorage.setItem('v7_user', JSON.stringify(loggedInUser)); // Armazena sessão
            updateAuthUI();
            showMessageModal('Login Bem-Sucedido', `Bem-vindo de volta, ${loggedInUser.name.split(' ')[0]}!`, () => {
                window.location.href = 'index.html'; // Redireciona para HOME
            });
        } else {
            showMessageModal('Erro de Login', 'E-mail ou senha incorretos.');
        }
    } else {
         showMessageModal('Erro de Login', 'E-mail ou senha incorretos.');
    }
}
window.handleLogin = handleLogin;


// Cadastro
function checkPasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++; // Caractere especial
    return score; // Max 4
}
window.checkPasswordStrength = checkPasswordStrength;

function updatePasswordStrengthIndicator() {
    const password = document.getElementById('register-password').value;
    const strengthBar = document.getElementById('password-strength');
    const score = checkPasswordStrength(password);
    
    if (!strengthBar) return;
    
    let width = (score / 4) * 100;
    let color = 'bg-red-600';
    if (score === 2) color = 'bg-yellow-500';
    else if (score >= 3) color = 'bg-green-600';
    
    strengthBar.style.width = `${width}%`;
    strengthBar.className = `${color} rounded-full h-2 transition-all duration-300`;
    
    const requirements = document.getElementById('password-requirements');
    if (requirements) {
        requirements.classList.toggle('hidden', score >= 3);
    }
}
window.updatePasswordStrengthIndicator = updatePasswordStrengthIndicator;

async function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    if (localStorage.getItem(email)) {
        showMessageModal('Erro de Cadastro', 'Este e-mail já está cadastrado.');
        return;
    }

    if (checkPasswordStrength(password) < 3) {
         showMessageModal('Erro de Cadastro', 'A senha não atende aos requisitos mínimos de segurança.');
        return;
    }
    
    const userData = {
        name: name,
        email: email,
        passwordHash: simpleHash(password), // Armazena o hash
        // Outros dados capturados do formulário, incluindo CEP preenchido pela API
        logradouro: document.getElementById('register-logradouro').value,
        cidade: document.getElementById('register-cidade').value,
    };

    localStorage.setItem(email, JSON.stringify(userData));
    
    // Auto-login após o cadastro
    loggedInUser = { name: name, email: email };
    localStorage.setItem('v7_user', JSON.stringify(loggedInUser));
    
    updateAuthUI();
    showMessageModal('Cadastro Concluído', `Bem-vindo, ${name.split(' ')[0]}! Você está logado.`, () => {
        window.location.href = 'index.html';
    });
}
window.handleRegister = handleRegister;

// =================================================================
// Lógica de Consumo de API Externa (ViaCEP)
// =================================================================

async function fetchApiCep(cepInput) {
    const cep = cepInput.replace(/\D/g, ''); 
    if (cep.length !== 8) return;

    const addressFields = {
        logradouro: document.getElementById('register-logradouro'),
        bairro: document.getElementById('register-bairro'),
        localidade: document.getElementById('register-cidade'),
        uf: document.getElementById('register-estado'),
    };
    
    if (!addressFields.logradouro) return; // Checa se estamos na tela de cadastro

    const loader = document.getElementById('cep-loader');
    if (loader) loader.classList.remove('hidden');

    // Limpa campos antes de buscar
    Object.values(addressFields).forEach(field => field.value = '');

    try {
        const data = await fetchWithBackoff(`https://viacep.com.br/ws/${cep}/json/`);
        
        if (data.erro) {
            throw new Error('CEP não encontrado.');
        }

        addressFields.logradouro.value = data.logradouro || '';
        addressFields.bairro.value = data.bairro || '';
        addressFields.localidade.value = data.localidade || '';
        addressFields.uf.value = data.uf || '';
        
    } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        showMessageModal('Erro de API', 'Não foi possível buscar o endereço para o CEP informado.');
    } finally {
        if (loader) loader.classList.add('hidden');
    }
}
window.fetchApiCep = fetchApiCep;

// =================================================================
// Lógica de Restrição de Agendamento (NOVA FUNÇÃO)
// =================================================================

function checkSchedulingAccess() {
    const form = document.getElementById('scheduling-form');
    const message = document.getElementById('scheduling-restricted-message');
    
    if (form && message) {
        if (loggedInUser) {
            // Usuário logado: mostra formulário, esconde mensagem
            form.classList.remove('hidden');
            message.classList.add('hidden');
        } else {
            // Usuário não logado: esconde formulário, mostra mensagem
            form.classList.add('hidden');
            message.classList.remove('hidden');
        }
    }
}
window.checkSchedulingAccess = checkSchedulingAccess;

// =================================================================
// Lógica Específica de Portfolio (Antes e Depois)
// =================================================================

function initBeforeAfter() {
    const containers = document.querySelectorAll('.before-after-container');

    containers.forEach(container => {
        const afterImage = container.querySelector('.after-image');
        const divider = container.querySelector('.divider');
        let isDragging = false;
        
        const updateSlider = (x) => {
            const rect = container.getBoundingClientRect();
            let newX = x - rect.left;
            
            newX = Math.max(0, Math.min(newX, rect.width));
            
            const percent = (newX / rect.width) * 100;
            
            afterImage.style.width = `${percent}%`;
            divider.style.left = `${percent}%`;

            const afterImgTag = afterImage.querySelector('img');
            afterImgTag.style.objectPosition = `${100 - percent}% 0`;
        };

        // Mouse events
        divider.addEventListener('mousedown', (e) => {
            isDragging = true;
            e.preventDefault();
            container.classList.add('cursor-grabbing');
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            container.classList.remove('cursor-grabbing');
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            updateSlider(e.clientX);
        });

        // Touch events
        divider.addEventListener('touchstart', (e) => {
            isDragging = true;
            e.preventDefault();
        });

        document.addEventListener('touchend', () => {
            isDragging = false;
        });

        document.addEventListener('touchmove', (e) => {
            if (!isDragging || !e.touches[0]) return;
            updateSlider(e.touches[0].clientX);
        });
        
        // Inicializa a posição central
        updateSlider(container.getBoundingClientRect().left + container.offsetWidth / 2);
    });
}
window.initBeforeAfter = initBeforeAfter;


// =================================================================
// Inicialização
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    
    // Verifica se estamos em uma página que precisa de JS específico
    if (document.getElementById('register-form')) {
        document.getElementById('register-form').addEventListener('submit', handleRegister);
        document.getElementById('register-password').addEventListener('input', updatePasswordStrengthIndicator);
        document.getElementById('register-cep').addEventListener('blur', (e) => fetchApiCep(e.target.value));
        updatePasswordStrengthIndicator();
    }
    if (document.getElementById('login-form')) {
        document.getElementById('login-form').addEventListener('submit', handleLogin);
    }
    if (document.getElementById('scheduling-form')) {
        document.getElementById('scheduling-form').addEventListener('submit', (e) => {
             e.preventDefault();
             showMessageModal('Agendamento Enviado!', 'Seu pedido de agendamento foi recebido. Entraremos em contato via WhatsApp em breve para confirmar a data e hora.');
             e.target.reset();
        });
        // * Chamado na agendamento.html para garantir que a interface seja atualizada APÓS initAuth()
        // checkSchedulingAccess(); 
    }
    if (document.querySelector('.before-after-container')) {
        initBeforeAfter();
    }
    
    // Lógica do Menu Mobile
    const menuButton = document.getElementById('menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    if (menuButton) {
        menuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }
    
    lucide.createIcons(); // Inicializa os ícones Lucide em todas as páginas
});