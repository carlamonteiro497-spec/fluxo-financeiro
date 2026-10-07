/**
 * FLUXO FINANCEIRO - AUTENTICAÇÃO + SUPABASE (VERSÃO CORRIGIDA)
 * Sem módulos ES6 - funciona direto no HTML
 */

(function() {
  'use strict';

  // ============================================================================
  // CONFIGURAÇÃO
  // ============================================================================

  const AUTH_CONFIG = {
    SUPABASE_URL: 'https://nklszryrglsrzsgkyzob.supabase.co',
    SUPABASE_KEY: 'sb_publishable_NQd9TQurcr-w20Z1YUi6Qw_gnUdQ7d5',
    AUTHORIZED_EMAILS: ['carlamonteiro497@gmail.com', 'your-spouse@email.com'],
  };

  // ============================================================================
  // ESTADO GLOBAL
  // ============================================================================

  let supabase = null;
  let currentUser = null;
  let currentSession = null;
  let isAuthReady = false;

  // ============================================================================
  // INICIALIZAÇÃO
  // ============================================================================

  function initSupabase() {
    if (typeof window.supabase === 'undefined') {
      console.warn('⏳ Aguardando Supabase JS...');
      setTimeout(initSupabase, 100);
      return;
    }

    supabase = window.supabase.createClient(
      AUTH_CONFIG.SUPABASE_URL,
      AUTH_CONFIG.SUPABASE_KEY
    );

    console.log('✓ Supabase inicializado');
    initAuth();
  }

  // ============================================================================
  // INJETAR MODAL DE LOGIN NA PÁGINA
  // ============================================================================

  function injectAuthModal() {
    const authHTML = `
      <div id="authContainer" class="auth-full-screen" style="display: none;">
        <div class="auth-card">
          <div class="auth-header">
            <h1>💰 Fluxo Financeiro</h1>
            <p>Gerencie suas finanças em qualquer lugar</p>
          </div>

          <div class="auth-content">
            <div id="authLoginView">
              <button id="loginButton" class="auth-button">
                🔐 Entrar com Google
              </button>
              <p class="auth-note">Sincronização automática entre devices</p>
            </div>

            <div id="authLoadingView" style="display: none; text-align: center;">
              <div class="auth-spinner"></div>
              <p>Carregando seus dados...</p>
            </div>

            <div id="authUserView" style="display: none;">
              <div class="auth-user-info">
                <p id="authUserEmail"></p>
                <p id="authUserName"></p>
              </div>
              <button id="logoutButton" class="auth-button auth-button-danger">
                🚪 Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>
        .auth-full-screen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          font-family: 'IBM Plex Sans', sans-serif;
        }

        .auth-card {
          background: white;
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 400px;
          width: 90%;
          text-align: center;
        }

        .auth-header h1 {
          font-size: 28px;
          margin-bottom: 10px;
          color: #1e40af;
          margin-top: 0;
        }

        .auth-header p {
          color: #666;
          margin-bottom: 30px;
          margin-top: 0;
        }

        .auth-button {
          width: 100%;
          padding: 12px;
          font-size: 16px;
          border: none;
          border-radius: 10px;
          background: #1e40af;
          color: white;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s;
        }

        .auth-button:hover {
          background: #1e3a8a;
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(30, 64, 175, 0.2);
        }

        .auth-button-danger {
          background: #dc2626;
        }

        .auth-button-danger:hover {
          background: #b91c1c;
        }

        .auth-note {
          font-size: 12px;
          color: #999;
          margin-top: 15px;
        }

        .auth-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #1e40af;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .auth-user-info {
          margin: 20px 0;
          padding: 15px;
          background: #f0f9ff;
          border-radius: 10px;
        }

        .auth-user-info p {
          margin: 5px 0;
          color: #1e40af;
        }

        @media (prefers-color-scheme: dark) {
          .auth-card {
            background: #1d2023;
            color: #edebe3;
          }

          .auth-header h1 {
            color: #8496d6;
          }

          .auth-header p {
            color: #9b9c90;
          }

          .auth-user-info {
            background: rgba(132, 150, 214, 0.2);
          }

          .auth-button {
            background: #3b82f6;
          }

          .auth-button:hover {
            background: #2563eb;
          }
        }
      </style>
    `;

    const body = document.body;
    const div = document.createElement('div');
    div.innerHTML = authHTML;
    body.insertBefore(div.firstElementChild, body.firstChild);

    console.log('✓ Modal de login injetado');
  }

  // ============================================================================
  // CONTROLES DE UI
  // ============================================================================

  function showAuthContainer(show) {
    const container = document.getElementById('authContainer');
    if (!container) return;

    container.style.display = show ? 'flex' : 'none';

    const mainContainer = document.querySelector('.container');
    if (mainContainer) {
      mainContainer.style.display = show ? 'none' : 'block';
    }
  }

  function showLoginView() {
    document.getElementById('authLoginView').style.display = 'block';
    document.getElementById('authLoadingView').style.display = 'none';
    document.getElementById('authUserView').style.display = 'none';
  }

  function showLoadingView() {
    document.getElementById('authLoginView').style.display = 'none';
    document.getElementById('authLoadingView').style.display = 'block';
    document.getElementById('authUserView').style.display = 'none';
  }

  function showUserView(email, name) {
    document.getElementById('authUserEmail').textContent = email;
    document.getElementById('authUserName').textContent = name || 'Usuário';

    document.getElementById('authLoginView').style.display = 'none';
    document.getElementById('authLoadingView').style.display = 'none';
    document.getElementById('authUserView').style.display = 'block';
  }

  // ============================================================================
  // AUTENTICAÇÃO
  // ============================================================================

  async function loginWithGoogle() {
    if (!supabase) return;

    showLoadingView();

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + window.location.pathname
        }
      });

      if (error) {
        console.error('Erro ao fazer login:', error);
        alert('Erro ao fazer login: ' + error.message);
        showLoginView();
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      alert('Erro ao fazer login. Verifique console.');
      showLoginView();
    }
  }

  async function logout() {
    if (!supabase) return;

    try {
      await supabase.auth.signOut();

      currentUser = null;
      currentSession = null;

      if (typeof window.state !== 'undefined') {
        window.state.expenses = [];
        window.state.contas_fixas = [];
        window.state.renda = null;
        window.state.reembolsos = [];
      }

      showAuthContainer(true);
      showLoginView();

      console.log('✓ Logout realizado');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }

  // ============================================================================
  // VERIFICAR AUTENTICAÇÃO
  // ============================================================================

  async function checkAuth() {
    if (!supabase) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      currentSession = session;
      currentUser = session?.user || null;

      if (currentUser) {
        if (!AUTH_CONFIG.AUTHORIZED_EMAILS.includes(currentUser.email)) {
          console.warn('❌ Email não autorizado:', currentUser.email);
          await logout();
          alert('Email não autorizado. Contate o administrador.');
          return;
        }

        console.log('✓ Autenticado como:', currentUser.email);

        showUserView(currentUser.email, currentUser.user_metadata?.full_name);
        showAuthContainer(false);

        await loadAllDataFromSupabase();
        subscribeToRealtimeUpdates();

        isAuthReady = true;
      } else {
        console.log('✗ Não autenticado');

        showAuthContainer(true);
        showLoginView();

        if (typeof window.state !== 'undefined') {
          window.state.expenses = [];
          window.state.contas_fixas = [];
          window.state.renda = null;
          window.state.reembolsos = [];
        }
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      showLoginView();
    }
  }

  async function initAuth() {
    console.log('🔐 Inicializando autenticação...');

    injectAuthModal();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        attachAuthEventListeners();
        checkAuth();
      });
    } else {
      attachAuthEventListeners();
      checkAuth();
    }
  }

  function attachAuthEventListeners() {
    const loginBtn = document.getElementById('loginButton');
    const logoutBtn = document.getElementById('logoutButton');

    if (loginBtn) {
      loginBtn.addEventListener('click', loginWithGoogle);
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', logout);
    }

    console.log('✓ Event listeners configurados');
  }

  // ============================================================================
  // CARREGAR DADOS DO SUPABASE
  // ============================================================================

  async function loadAllDataFromSupabase() {
    if (!currentUser || !supabase) return;

    try {
      console.log('📦 Carregando dados do Supabase...');
      showLoadingView();

      const { data: expenses, error: expError } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('date', { ascending: false });

      if (expError) throw expError;

      const { data: contas, error: contasError } = await supabase
        .from('contas_fixas')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('active', true);

      if (contasError) throw contasError;

      const { data: renda, error: rendaError } = await supabase
        .from('renda_config')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (rendaError) throw rendaError;

      const { data: reembolsos, error: reemError } = await supabase
        .from('reembolsos')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('date', { ascending: false });

      if (reemError) throw reemError;

      if (typeof window.state !== 'undefined') {
        window.state.expenses = (expenses || []).map(exp => ({
          ...exp,
          valuecents: exp.valuecents || 0,
          installments: exp.installments || 1
        }));

        window.state.contas_fixas = contas || [];
        window.state.renda = renda?.[0] || null;
        window.state.reembolsos = reembolsos || [];

        console.log('✓ Dados carregados:', {
          despesas: expenses?.length || 0,
          contas: contas?.length || 0,
          reembolsos: reembolsos?.length || 0
        });

        if (typeof renderAll === 'function') {
          renderAll();
        }
      }

      showUserView(currentUser.email, currentUser.user_metadata?.full_name);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados: ' + error.message);
    }
  }

  // ============================================================================
  // SINCRONIZAÇÃO EM TEMPO REAL
  // ============================================================================

  function subscribeToRealtimeUpdates() {
    if (!currentUser || !supabase) return;

    console.log('📡 Configurando sincronização em tempo real...');

    supabase
      .channel('public:expenses:user_id=eq.' + currentUser.id)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: 'user_id=eq.' + currentUser.id
        },
        (payload) => {
          console.log('📡 Despesas atualizadas:', payload.eventType);
          loadAllDataFromSupabase();
        }
      )
      .subscribe();

    console.log('✓ Realtime configurado');
  }

  // ============================================================================
  // OPERAÇÕES CRUD
  // ============================================================================

  async function addExpenseToSupabase(expense) {
    if (!currentUser || !supabase) {
      console.error('Usuário não autenticado');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          user_id: currentUser.id,
          date: expense.date,
          description: expense.description,
          valuecents: expense.valuecents || 0,
          installments: expense.installments || 1,
          cartao: expense.cartao || null,
          installment_date: expense.installment_date || null,
          due_date: expense.due_date || null,
          vencimento: expense.vencimento || null,
          parcelado: expense.parcelado || false
        })
        .select();

      if (error) throw error;

      console.log('✓ Despesa adicionada:', data?.[0]);
      return data?.[0];
    } catch (error) {
      console.error('Erro ao adicionar despesa:', error);
      alert('Erro ao salvar: ' + error.message);
      return null;
    }
  }

  async function updateExpenseInSupabase(id, expense) {
    if (!currentUser || !supabase) {
      console.error('Usuário não autenticado');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('expenses')
        .update({
          description: expense.description,
          valuecents: expense.valuecents || 0,
          date: expense.date,
          installments: expense.installments || 1,
          cartao: expense.cartao || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', currentUser.id)
        .select();

      if (error) throw error;

      console.log('✓ Despesa atualizada:', data?.[0]);
      return data?.[0];
    } catch (error) {
      console.error('Erro ao atualizar despesa:', error);
      alert('Erro ao atualizar: ' + error.message);
      return null;
    }
  }

  async function deleteExpenseFromSupabase(id) {
    if (!currentUser || !supabase) {
      console.error('Usuário não autenticado');
      return false;
    }

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      console.log('✓ Despesa deletada:', id);
      return true;
    } catch (error) {
      console.error('Erro ao deletar despesa:', error);
      alert('Erro ao deletar: ' + error.message);
      return false;
    }
  }

  // ============================================================================
  // EXPOR GLOBALMENTE
  // ============================================================================

  window.loginWithGoogle = loginWithGoogle;
  window.logout = logout;
  window.addExpenseToSupabase = addExpenseToSupabase;
  window.updateExpenseInSupabase = updateExpenseInSupabase;
  window.deleteExpenseFromSupabase = deleteExpenseFromSupabase;
  window.loadAllDataFromSupabase = loadAllDataFromSupabase;
  window.checkAuth = checkAuth;
  window.currentUser = () => currentUser;
  window.isAuthReady = () => isAuthReady;

  console.log('✓ Auth Module Carregado');

  // Iniciar quando documento estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSupabase);
  } else {
    initSupabase();
  }
})();
