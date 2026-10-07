// ============================================================================
// FLUXO FINANCEIRO - Autenticação Supabase + Google OAuth
// ============================================================================
// Este script gerencia:
// - Google OAuth login
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
  const SUPABASE_URL = 'https://xkizyq1srsgfyqb.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_NQd9TQurcr-w20Z1YUi6Qw_gnUdQ7d5';
  const AUTHORIZED_EMAILS = [
    'carlamonteiro497@gmail.com',
    'iasrocha21@gmail.com'
  ];

  // Estado de autenticação
  let currentUser = null;
  let authToken = null;
  let supabaseSession = null;

  // ========================================================================
  // INICIALIZAR SUPABASE
  // ========================================================================
  async function initSupabase() {
    console.log('🔄 Inicializando Supabase...');

    if (typeof supabase === 'undefined') {
      console.error('❌ Supabase SDK não carregado!');
      return false;
    }

    // Criar instância do Supabase
    window.supabaseSync = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('✓ Supabase inicializado');

    return true;
  }

  // ========================================================================
  // VERIFICAR AUTENTICAÇÃO
  // ========================================================================
  async function checkAuth() {
    console.log('🔐 Verificando autenticação...');

    try {
      // Aguardar Supabase carregar (com retry)
      let retries = 0;
      while (!window.supabaseSync && retries < 20) {
        await new Promise(r => setTimeout(r, 100));
        retries++;
      }

      if (!window.supabaseSync) {
        console.error('❌ Supabase não conseguiu carregar');
        showLoginModal();
        return;
      }

      // Verificar se há sessão ativa
      const { data: { session } } = await window.supabaseSync.auth.getSession();

      if (!session) {
        console.log('⏹️ Nenhuma sessão ativa - mostrando modal de login');
        showLoginModal();
        return;
      }

      // Sessão existe! Validar email
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
    const modal = document.getElementById('supabaseModal');
    if (!modal) {
      console.error('❌ Modal com ID "supabaseModal" não encontrado!');
      // Criar modal dinamicamente se não existir
      createLoginModal();
      return;
    }

    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function hideLoginModal() {
    const modal = document.getElementById('supabaseModal');
    if (modal) {
      modal.classList.remove('show');
      document.body.style.overflow = 'auto';
    }
  }

  function createLoginModal() {
    const modal = document.createElement('div');
    modal.id = 'supabaseModal';
    modal.className = 'modal show';
    modal.innerHTML = `
      <div class="modal-dialog" style="max-width: 400px;">
        <div class="modal-header">🔐 Faça Login</div>
        <div style="padding: 20px; text-align: center;">
          <p style="margin-bottom: 20px; color: var(--ink-soft);">Você precisa estar autenticado para acessar o Fluxo Financeiro</p>
          <button onclick="window.loginWithGoogle()" style="width: 100%; padding: 14px 16px; background: #35467A; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 15px;">
            🔐 Entrar com Google
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  function showUnauthorizedError(email) {
    const modal = document.getElementById('supabaseModal');
    if (!modal) return;

    const dialog = modal.querySelector('.modal-dialog') || modal;
    dialog.innerHTML = `
      <div class="modal-header" style="color: #dc2626;">❌ Acesso Negado</div>
      <div style="padding: 20px; text-align: center;">
        <p style="color: #dc2626; margin-bottom: 10px; font-weight: 600;">Email não autorizado</p>
        <p style="color: var(--ink-soft); margin-bottom: 20px;">${email}</p>
        <p style="color: var(--ink-faint); font-size: 13px; margin-bottom: 20px;">Apenas usuarios autorizados podem acessar esta aplicação.</p>
        <button onclick="window.loginWithGoogle()" style="width: 100%; padding: 14px 16px; background: #35467A; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 15px;">
          🔄 Tentar Outra Conta
        </button>
      </div>
    `;
    showLoginModal();
  }

  // ========================================================================
  // GOOGLE LOGIN
  // ========================================================================
  async function loginWithGoogle() {
    console.log('🔐 Iniciando Google OAuth...');

    try {
      const { data, error } = await window.supabaseSync.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + window.location.pathname
        }
      });

      if (error) {
        console.error('❌ Erro no login Google:', error);
        return;
      }

      console.log('✓ Redirecionado para Google');

    } catch (error) {
      console.error('❌ Erro ao iniciar Google OAuth:', error);
    }
  }

  // ========================================================================
  // LOGOUT
  // ========================================================================
  async function logout() {
    console.log('🚪 Fazendo logout...');

    try {
      await window.supabaseSync.auth.signOut();

      // Limpar estado
      currentUser = null;
      authToken = null;
      supabaseSession = null;

      // Limpar dados da aplicação
      if (window.state) {
        window.state.expenses = [];
        window.state.contasFixas = [];
        window.state.renda = {};
      }

      // Limpar localStorage de app (manter apenas config do Supabase)
      localStorage.removeItem('passoa_omorfau_expenses');
      localStorage.removeItem('fluxo_contas_fixas');
      localStorage.removeItem('fluxo_expenses');
      localStorage.removeItem('fluxo_renda_config');

      // Re-renderizar
      if (typeof renderAll === 'function') {
        renderAll();
      }

      // Mostrar modal de login novamente
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
      // Buscar despesas
      const { data: expenses, error: expError } = await window.supabaseSync
        .from('expenses')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('date', { ascending: false });

      if (expError) {
        console.error('❌ Erro ao carregar expenses:', expError);
      } else {
        console.log('✓ Carregadas', expenses?.length || 0, 'despesas');

        // Preencher state
        if (window.state && expenses) {
          window.state.expenses = expenses.map(e => ({
            id: e.id,
            date: e.date,
            description: e.description,
            valueCents: e.valuecents || 0,
            installments: e.installments || 1,
            cartao: e.cartao || 'santander',
            dataVencimento: e.datavencimento || e.date,
            createdAt: e.created_at
          }));
        }
      }

      // Buscar contas fixas
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

      // Re-renderizar interface
      if (typeof renderAll === 'function') {
        renderAll();
      }

    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
    }
  }

  // ========================================================================
  // SINCRONIZAÇÃO REALTIME
  // ========================================================================
  function setupRealtimeSync() {
    console.log('🔄 Configurando sincronização realtime...');

    if (!currentUser) return;

    // Subscribe para mudanças em expenses
    const subscription = window.supabaseSync
      .channel(`expenses:user_id=eq.${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `user_id=eq.${currentUser.id}`
        },
        (payload) => {
          console.log('📡 Mudança detectada:', payload.eventType);
          loadDataFromSupabase();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✓ Sincronização realtime ativa');
        }
      });

    // Fallback: sincronizar a cada 30 segundos
    setInterval(() => {
      if (currentUser) {
        loadDataFromSupabase();
      }
    }, 30000);
  }

  // ========================================================================
  // UI HELPERS
  // ========================================================================
  function updateUserInfo(email) {
    // Procurar por elemento para mostrar email/logout
    const headerReset = document.querySelector('.header-reset');
    if (headerReset) {
      headerReset.textContent = '🚪 Sair';
      headerReset.onclick = logout;
    }

    // Ou criar um botão se não existir
    const header = document.querySelector('.header');
    if (header && !document.getElementById('logoutBtn')) {
      const logoutBtn = document.createElement('button');
      logoutBtn.id = 'logoutBtn';
      logoutBtn.className = 'header-reset';
      logoutBtn.textContent = '🚪 Sair';
      logoutBtn.onclick = logout;
      logoutBtn.style.position = 'absolute';
      logoutBtn.style.top = '24px';
      logoutBtn.style.right = '24px';
      header.appendChild(logoutBtn);
    }
  }

  // ========================================================================
  // INICIALIZAÇÃO
  // ========================================================================
  async function init() {
    console.log('🚀 Iniciando Fluxo Financeiro com Supabase...');

    // Aguardar DOM estar pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    // Inicializar Supabase
    const ready = await initSupabase();
    if (!ready) {
      console.error('❌ Falha ao inicializar Supabase');
      showLoginModal();
      return;
    }

    // Verificar autenticação
    await checkAuth();
  }

  // ========================================================================
  // EXPOR FUNÇÕES GLOBAIS
  // ========================================================================
  window.loginWithGoogle = loginWithGoogle;
  window.logout = logout;
  window.checkAuth = checkAuth;

  // ========================================================================
  // INICIAR QUANDO PÁGINA CARREGAR
  // ========================================================================
  init();

})();
