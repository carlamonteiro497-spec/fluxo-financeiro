// ============================================================================
// FLUXO FINANCEIRO - Autenticação via Proxy (Contorna bloqueio de DNS)
// ============================================================================

(function() {
  'use strict';

  // Detectar ambiente
  const isDev = window.location.hostname === 'localhost';
  const API_BASE = isDev ? 'http://localhost:3000' : 'https://fluxo-financeiro-strk.onrender.com';

  let currentUser = null;
  let authToken = null;
  let supabaseSession = null;

  console.log('✅ auth-supabase-proxy.js carregado (via proxy)');
  console.log(`🔌 API Base: ${API_BASE}`);

  // ========================================================================
  // MODAL DE LOGIN
  // ========================================================================
  function showLoginModal() {
    let modal = document.getElementById('supabaseModal');

    if (!modal) {
      console.log('📱 Modal não encontrado, criando dinamicamente...');
      createLoginModal();
      modal = document.getElementById('supabaseModal');
    }

    if (modal) {
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
      console.log('✓ Modal de login exibido');
    }
  }

  function hideLoginModal() {
    const modal = document.getElementById('supabaseModal');
    if (modal) {
      modal.classList.remove('show');
      document.body.style.overflow = 'auto';
      console.log('✓ Modal de login ocultado');
    }
  }

  function createLoginModal() {
    const existing = document.getElementById('supabaseModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'supabaseModal';
    modal.className = 'modal show';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      visibility: visible;
      opacity: 1;
    `;

    modal.innerHTML = `
      <div class="modal-dialog" style="max-width: 400px; background: var(--paper-raised); border-radius: 14px; box-shadow: var(--shadow); padding: 0;">
        <div class="modal-header" style="padding: 20px; border-bottom: 1px solid var(--line); font-size: 18px; font-weight: 600;">🔐 Faça Login</div>
        <div style="padding: 24px;">
          <p style="margin-bottom: 20px; color: var(--ink-soft); font-size: 14px; text-align: center;">Você precisa estar autenticado para acessar o Fluxo Financeiro</p>
          
          <div style="margin-bottom: 12px;">
            <input type="email" id="emailInput" placeholder="seu@email.com" style="width: 100%; padding: 12px; border: 1px solid var(--line); border-radius: 6px; font-size: 14px; box-sizing: border-box; font-family: inherit;">
          </div>
          
          <div style="margin-bottom: 20px;">
            <input type="password" id="passwordInput" placeholder="Sua senha" style="width: 100%; padding: 12px; border: 1px solid var(--line); border-radius: 6px; font-size: 14px; box-sizing: border-box; font-family: inherit;">
          </div>
          
          <div id="authMessage" style="margin-bottom: 16px; padding: 12px; border-radius: 6px; display: none; font-size: 13px; text-align: center;"></div>
          
          <button id="loginBtn" style="width: 100%; padding: 12px; background: #35467A; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 15px; margin-bottom: 8px;">
            ✓ Entrar
          </button>
          
          <button id="signupBtn" style="width: 100%; padding: 12px; background: #10b981; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 15px;">
            ➕ Criar Conta
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const loginBtn = modal.querySelector('#loginBtn');
    const signupBtn = modal.querySelector('#signupBtn');

    if (loginBtn) {
      loginBtn.addEventListener('click', () => handleLogin(false));
    }

    if (signupBtn) {
      signupBtn.addEventListener('click', () => handleLogin(true));
    }

    console.log('✓ Modal de login criado dinamicamente');
  }

  function showMessage(el, msg, type) {
    el.textContent = msg;
    el.style.display = 'block';
    el.style.background = type === 'error' ? '#fee2e2' : type === 'success' ? '#dcfce7' : '#fef3c7';
    el.style.color = type === 'error' ? '#dc2626' : type === 'success' ? '#15803d' : '#92400e';
  }

  // ========================================================================
  // LOGIN COM PROXY
  // ========================================================================
  async function handleLogin(isSignUp) {
    const email = document.getElementById('emailInput').value.trim();
    const password = document.getElementById('passwordInput').value;
    const messageEl = document.getElementById('authMessage');

    if (!email || !password) {
      showMessage(messageEl, '⚠️ Preencha email e senha', 'warning');
      return;
    }

    console.log(isSignUp ? '📝 Criando conta via proxy...' : '🔐 Fazendo login via proxy...');

    try {
      const endpoint = isSignUp ? '/api/auth/signup' : '/api/auth/signin';
      const url = `${API_BASE}${endpoint}`;

      console.log(`📡 POST ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Erro:', data);
        showMessage(messageEl, '❌ ' + (data.message || data.error_description || 'Erro ao autenticar'), 'error');
        return;
      }

      if (isSignUp) {
        showMessage(messageEl, '✅ Conta criada! Já pode fazer login', 'success');
        console.log('✅ Conta criada:', email);
        return;
      }

      // Login bem-sucedido
      console.log('✅ Login bem-sucedido!');
      
      currentUser = { email, id: data.user?.id };
      authToken = data.access_token;
      supabaseSession = data;

      window.isSupabaseAuthenticated = true;

      hideLoginModal();
      loadDataFromSupabase();

      if (typeof renderAll === 'function') {
        renderAll();
      }

    } catch (error) {
      console.error('❌ Erro:', error);
      showMessage(messageEl, '❌ Erro: ' + error.message, 'error');
    }
  }

  // ========================================================================
  // CARREGAR DADOS
  // ========================================================================
  async function loadDataFromSupabase() {
    console.log('📦 Carregando dados do Supabase...');
    
    // Por enquanto, apenas carrega dados locais
    if (typeof window.state !== 'undefined') {
      console.log('✓ Dados carregados');
      if (typeof renderAll === 'function') {
        renderAll();
      }
    }
  }

  // ========================================================================
  // LOGOUT
  // ========================================================================
  async function logout() {
    console.log('🚪 Fazendo logout...');

    currentUser = null;
    authToken = null;
    supabaseSession = null;
    window.isSupabaseAuthenticated = false;

    if (window.state) {
      window.state.expenses = [];
      window.state.contasFixas = [];
    }

    if (typeof renderAll === 'function') {
      renderAll();
    }

    showLoginModal();
    console.log('✓ Logout realizado');
  }

  // ========================================================================
  // INICIALIZAÇÃO
  // ========================================================================
  async function init() {
    console.log('🚀 Iniciando Fluxo Financeiro (Proxy Mode)...');
    
    // Verificar autenticação
    const token = localStorage.getItem('auth_token');
    if (token) {
      authToken = token;
      window.isSupabaseAuthenticated = true;
      console.log('✓ Token recuperado do localStorage');
      hideLoginModal();
      loadDataFromSupabase();
    } else {
      window.isSupabaseAuthenticated = false;
      showLoginModal();
    }
  }

  // ========================================================================
  // EXPOR GLOBAIS
  // ========================================================================
  window.logout = logout;
  window.showLoginModal = showLoginModal;
  window.hideLoginModal = hideLoginModal;
  window.isSupabaseAuthenticated = false;

  // Iniciar quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('✓ Proxy auth pronto!');

})();
