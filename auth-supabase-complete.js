// ============================================================================
// FLUXO FINANCEIRO - Autenticação Supabase + Email/Senha
// ============================================================================
// Este script gerencia:
// - Login com Email/Senha
// - Verificação de autenticação
// - Carregamento de dados do Supabase
// - Sincronização em tempo real
// - Logout seguro
// ============================================================================

(function() {
  'use strict';

  // ========================================================================
  // CONFIGURAÇÃO SUPABASE
  // ========================================================================
  const SUPABASE_URL = 'https://nklszryglsrzsgkyzob.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_NQd9TQurcr-w20Z1YUi6Qw_gnUdQ7d5';
  const AUTHORIZED_EMAILS = [
    'carlamonteiro497@gmail.com',
    'iasrocha21@gmail.com'
  ];

  // Estado de autenticação
  let currentUser = null;
  let authToken = null;
  let supabaseSession = null;
  let supabaseReady = false;

  console.log('✅ auth-supabase-complete.js carregado (Email/Senha)');

  // ========================================================================
  // INICIALIZAR SUPABASE
  // ========================================================================
  async function initSupabase() {
    console.log('🔄 Inicializando Supabase...');

    try {
      if (typeof supabase === 'undefined') {
        console.error('❌ Supabase SDK não carregado! Aguardando...');
        await new Promise(r => setTimeout(r, 500));

        if (typeof supabase === 'undefined') {
          console.error('❌ Supabase SDK ainda não disponível após esperar');
          return false;
        }
      }

      window.supabaseSync = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      supabaseReady = true;
      console.log('✓ Supabase inicializado com sucesso');

      return true;
    } catch (error) {
      console.error('❌ Erro ao inicializar Supabase:', error);
      return false;
    }
  }

  // ========================================================================
  // VERIFICAR AUTENTICAÇÃO
  // ========================================================================
  async function checkAuth() {
    console.log('🔐 Verificando autenticação...');

    try {
      if (!supabaseReady) {
        const ready = await initSupabase();
        if (!ready) {
          showLoginModal();
          return;
        }
      }

      const { data: { session } } = await window.supabaseSync.auth.getSession();

      if (!session) {
        console.log('⏹️ Nenhuma sessão ativa - mostrando modal de login');
        showLoginModal();
        return;
      }

      const userEmail = session.user?.email;
      console.log('✓ Sessão encontrada:', userEmail);

      if (!AUTHORIZED_EMAILS.includes(userEmail)) {
        console.error('❌ Email não autorizado:', userEmail);
        showUnauthorizedError(userEmail);
        await window.supabaseSync.auth.signOut();
        showLoginModal();
        return;
      }

      // ✅ AUTENTICADO E AUTORIZADO!
      console.log('✅ Autenticado como:', userEmail);
      currentUser = session.user;
      authToken = session.access_token;
      supabaseSession = session;

      // Marcar globalmente como autenticado
      window.isSupabaseAuthenticated = true;
      console.log('🔓 Sincronização com Supabase HABILITADA');

      // Esconder modal
      hideLoginModal();

      // Carregar dados da nuvem
      await loadDataFromSupabase();

      // Iniciar sincronização
      setupRealtimeSync();

      // Mostrar info de logout
      updateUserInfo(userEmail);

    } catch (error) {
      console.error('❌ Erro ao verificar autenticação:', error);
      showLoginModal();
    }
  }

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

  function showUnauthorizedError(email) {
    showLoginModal();
    const modal = document.getElementById('supabaseModal');
    if (!modal) return;

    const dialog = modal.querySelector('.modal-dialog');
    if (dialog) {
      dialog.innerHTML = `
        <div class="modal-header" style="padding: 20px; border-bottom: 1px solid var(--line); color: #dc2626; font-size: 18px; font-weight: 600;">❌ Acesso Negado</div>
        <div style="padding: 24px; text-align: center;">
          <p style="color: #dc2626; margin-bottom: 10px; font-weight: 600;">Email não autorizado</p>
          <p style="color: var(--ink-soft); margin-bottom: 20px; font-size: 14px;">${email}</p>
          <p style="color: var(--ink-faint); font-size: 13px; margin-bottom: 24px;">Apenas usuarios autorizados podem acessar esta aplicação.</p>
          <button id="tryAnotherBtn" style="width: 100%; padding: 14px 16px; background: #35467A; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 15px;">
            🔄 Tentar Outra Conta
          </button>
        </div>
      `;

      const btn = dialog.querySelector('#tryAnotherBtn');
      if (btn) {
        btn.addEventListener('click', () => {
          createLoginModal();
          showLoginModal();
        });
      }
    }
  }

  // ========================================================================
  // LOGIN COM EMAIL/SENHA
  // ========================================================================
  async function handleLogin(isSignUp) {
    const email = document.getElementById('emailInput').value.trim();
    const password = document.getElementById('passwordInput').value;
    const messageEl = document.getElementById('authMessage');

    if (!email || !password) {
      showMessage(messageEl, '⚠️ Preencha email e senha', 'warning');
      return;
    }

    console.log(isSignUp ? '📝 Criando conta...' : '🔐 Fazendo login...');

    try {
      if (!supabaseReady) {
        const ready = await initSupabase();
        if (!ready) {
          showMessage(messageEl, '❌ Erro ao conectar Supabase', 'error');
          return;
        }
      }

      let result;

      if (isSignUp) {
        result = await window.supabaseSync.auth.signUp({
          email: email,
          password: password,
          options: {
            emailRedirectTo: window.location.origin + window.location.pathname
          }
        });

        if (result.error) {
          showMessage(messageEl, '❌ ' + result.error.message, 'error');
          return;
        }

        showMessage(messageEl, '✅ Conta criada! Já pode fazer login', 'success');
        return;
      } else {
        result = await window.supabaseSync.auth.signInWithPassword({
          email: email,
          password: password
        });

        if (result.error) {
          showMessage(messageEl, '❌ Email ou senha incorretos', 'error');
          return;
        }
      }

      console.log('✓ Login bem-sucedido!');
      await checkAuth();

    } catch (error) {
      console.error('❌ Erro:', error);
      showMessage(messageEl, '❌ Erro: ' + error.message, 'error');
    }
  }

  function showMessage(el, msg, type) {
    el.textContent = msg;
    el.style.display = 'block';
    el.style.background = type === 'error' ? '#fee2e2' : type === 'success' ? '#dcfce7' : '#fef3c7';
    el.style.color = type === 'error' ? '#dc2626' : type === 'success' ? '#15803d' : '#92400e';
  }

  // ========================================================================
  // LOGOUT
  // ========================================================================
  async function logout() {
    console.log('🚪 Fazendo logout...');

    try {
      if (!supabaseReady) return;

      await window.supabaseSync.auth.signOut();

      currentUser = null;
      authToken = null;
      supabaseSession = null;
      window.isSupabaseAuthenticated = false;

      if (window.state) {
        window.state.expenses = [];
        window.state.contasFixas = [];
      }

      localStorage.removeItem('passoa_omorfau_expenses');
      localStorage.removeItem('fluxo_contas_fixas');
      localStorage.removeItem('fluxo_expenses');
      localStorage.removeItem('fluxo_renda_config');

      if (typeof renderAll === 'function') {
        renderAll();
      }

      showLoginModal();
      console.log('✓ Logout realizado');

    } catch (error) {
      console.error('❌ Erro ao fazer logout:', error);
    }
  }

  // ========================================================================
  // CARREGAR DADOS DO SUPABASE
  // ========================================================================
  async function loadDataFromSupabase() {
    if (!currentUser || !authToken) {
      console.log('⏹️ Não autenticado - pulando carregar dados');
      return;
    }

    console.log('📦 Carregando dados do Supabase...');

    try {
      const { data: expenses, error: expError } = await window.supabaseSync
        .from('expenses')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('date', { ascending: false });

      if (expError) {
        console.error('❌ Erro ao carregar expenses:', expError);
      } else {
        console.log('✓ Carregadas', expenses?.length || 0, 'despesas');

        if (window.state && expenses) {
          window.state.expenses = expenses.map(e => ({
            id: e.id,
            date: e.date,
            description: e.description,
            valueCents: e.amount || 0,
            installments: e.parcelado ? 2 : 1,
            cartao: e.cartao || 'santander',
            dataVencimento: e.datavencimento || e.date,
            createdAt: e.created_at
          }));
        }
      }

      const { data: contas, error: contasError } = await window.supabaseSync
        .from('contas_fixas')
        .select('*')
        .eq('user_id', currentUser.id);

      if (contasError) {
        console.error('❌ Erro ao carregar contas fixas:', contasError);
      } else {
        console.log('✓ Carregadas', contas?.length || 0, 'contas fixas');
        if (window.state && contas) {
          window.state.contasFixas = contas;
        }
      }

      if (typeof renderAll === 'function') {
        console.log('Chamando renderAll()...');
        renderAll();
      }

      console.log('✓ Dados carregados com sucesso');

    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
    }
  }

  // ========================================================================
  // SINCRONIZAÇÃO EM TEMPO REAL
  // ========================================================================
  function setupRealtimeSync() {
    if (!currentUser || !window.supabaseSync) {
      console.log('⏹️ Não pronto para sync em tempo real');
      return;
    }

    console.log('[REALTIME] Inicializando sincronização em tempo real...');

    const subscription = window.supabaseSync
      .channel(`realtime:expenses:${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `user_id=eq.${currentUser.id}`
        },
        async (payload) => {
          console.log('[REALTIME] Mudança detectada:', payload.eventType);
          await loadDataFromSupabase();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✓ Subscrito a mudanças em tempo real');
        }
      });

    window.supabaseSync = { ...window.supabaseSync, realtimeSubscription: subscription };
  }

  function updateUserInfo(email) {
    const userInfoEl = document.getElementById('userInfo');
    if (userInfoEl) {
      userInfoEl.innerHTML = `<span style="font-size: 12px; color: var(--ink-soft);">${email}</span> <button onclick="window.logout()" style="background: #dc2626; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">Logout</button>`;
    }
  }

  // ========================================================================
  // DESABILITAR SYNC ATÉ AUTENTICAÇÃO
  // ========================================================================
  window.isSupabaseAuthenticated = false;

  const originalSyncToSupabase = window.syncToSupabase;
  if (typeof window.syncToSupabase === 'function') {
    window.syncToSupabase = async function() {
      if (!window.isSupabaseAuthenticated) {
        console.log('⏹️ [AUTH] Sincronização desabilitada - não autenticado');
        return false;
      }
      return originalSyncToSupabase.apply(this, arguments);
    };
  }

  // ========================================================================
  // EXPOR FUNÇÕES GLOBAIS
  // ========================================================================
  window.loginWithGoogle = handleLogin; // Compatibilidade
  window.logout = logout;
  window.checkAuth = checkAuth;
  window.loadDataFromSupabase = loadDataFromSupabase;
  window.showLoginModal = showLoginModal;
  window.hideLoginModal = hideLoginModal;

  console.log('✓ Funções globais expostas');

  // ========================================================================
  // INICIAR QUANDO PÁGINA CARREGAR
  // ========================================================================
  async function init() {
    console.log('🚀 Iniciando Fluxo Financeiro com Supabase...');
    const ready = await initSupabase();
    if (ready) {
      await checkAuth();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();