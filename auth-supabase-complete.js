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
  let supabaseReady = false;

  console.log('✅ auth-supabase-complete.js carregado');

  // ========================================================================
  // INICIALIZAR SUPABASE
  // ========================================================================
  async function initSupabase() {
    console.log('🔄 Inicializando Supabase...');

    try {
      if (typeof supabase === 'undefined') {
        console.error('❌ Supabase SDK não carregado! Aguardando...');

        // Tentar novamente em 500ms
        await new Promise(r => setTimeout(r, 500));

        if (typeof supabase === 'undefined') {
          console.error('❌ Supabase SDK ainda não disponível após esperar');
          return false;
        }
      }

      // Criar instância do Supabase
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
      // Garantir que Supabase está inicializado
      if (!supabaseReady) {
        const ready = await initSupabase();
        if (!ready) {
          showLoginModal();
          return;
        }
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
    // Remover modal anterior se existir
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
        <div style="padding: 24px; text-align: center;">
          <p style="margin-bottom: 24px; color: var(--ink-soft); font-size: 14px;">Você precisa estar autenticado para acessar o Fluxo Financeiro</p>
          <button id="googleLoginBtn" style="width: 100%; padding: 14px 16px; background: #35467A; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 15px; transition: background 0.2s;">
            🔐 Entrar com Google
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Adicionar event listener
    const btn = modal.querySelector('#googleLoginBtn');
    if (btn) {
      btn.addEventListener('click', loginWithGoogle);
      btn.addEventListener('mouseover', () => btn.style.background = '#2a3866');
      btn.addEventListener('mouseout', () => btn.style.background = '#35467A');
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
        btn.addEventListener('click', loginWithGoogle);
      }
    }
  }

  // ========================================================================
  // GOOGLE LOGIN
  // ========================================================================
  async function loginWithGoogle() {
    console.log('🔐 Iniciando Google OAuth...');

    try {
      if (!supabaseReady) {
        const ready = await initSupabase();
        if (!ready) {
          console.error('❌ Supabase não inicializado');
          return;
        }
      }

      const { data, error } = await window.supabaseSync.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + window.location.pathname
        }
      });

      if (error) {
        console.error('❌ Erro no login Google:', error);
        alert('Erro ao fazer login com Google: ' + (error.message || error));
        return;
      }

      console.log('✓ Redirecionado para Google');

    } catch (error) {
      console.error('❌ Erro ao iniciar Google OAuth:', error);
      alert('Erro ao iniciar Google OAuth: ' + error.message);
    }
  }

  // ========================================================================
  // LOGOUT
  // ========================================================================
  async function logout() {
    console.log('🚪 Fazendo logout...');

    try {
      if (!supabaseReady) {
        console.log('Supabase não está pronto para logout');
        return;
      }

      await window.supabaseSync.auth.signOut();

      // Limpar estado
      currentUser = null;
      authToken = null;
      supabaseSession = null;

      // Desabilitar sincronização
      window.isSupabaseAuthenticated = false;
      console.log('🔒 Sincronização com Supabase DESABILITADA');

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

      // Re-renderizar interface
      if (typeof renderAll === 'function') {
        renderAll();
      }

      // Mostrar modal de login novamente
      showLoginModal();

      console.log('✓ Logout realizado com sucesso');

    } catch (error) {
      console.error('❌ Erro ao fazer logout:', error);
      alert('Erro ao fazer logout: ' + error.message);
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

        // Preencher state (mapear colunas do banco para o estado)
        if (window.state && expenses) {
          window.state.expenses = expenses.map(e => ({
            id: e.id,
            date: e.date,
            description: e.description,
            valueCents: e.amount || 0,  // Coluna do banco: "amount"
            installments: e.parcelado ? 2 : 1,  // Coluna do banco: "parcelado" (boolean)
            cartao: e.cartao || e.card || 'santander',  // Coluna do banco: "cartao"
            dataVencimento: e.datavencimento || e.date,  // Coluna do banco: "datavencimento"
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
        console.log('Chamando renderAll()...');
        renderAll();
      } else {
        console.warn('⚠️ renderAll() não está disponível');
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

    if (!currentUser || !supabaseReady) return;

    try {
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
            console.log('📡 Mudança detectada em expenses:', payload.eventType);
            loadDataFromSupabase();
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✓ Sincronização realtime ativa para expenses');
          } else if (status === 'CHANNEL_ERROR') {
            console.warn('⚠️ Erro no canal realtime, tentando novamente...');
          }
        });

      console.log('✓ Subscriptions realtime configuradas');
    } catch (error) {
      console.error('❌ Erro ao configurar realtime:', error);
    }

    // Fallback: sincronizar a cada 30 segundos
    const syncInterval = setInterval(() => {
      if (currentUser && supabaseReady) {
        console.log('[SYNC] Sincronização em background (30s)...');
        loadDataFromSupabase();
      } else if (!currentUser) {
        clearInterval(syncInterval);
      }
    }, 30000);
  }

  // ========================================================================
  // UI HELPERS
  // ========================================================================
  function updateUserInfo(email) {
    console.log('👤 Atualizando info do usuário:', email);

    // Procurar por elemento para mostrar email/logout
    const headerReset = document.querySelector('.header-reset');
    if (headerReset) {
      headerReset.textContent = '🚪 Sair';
      headerReset.onclick = logout;
      console.log('✓ Botão logout atualizado no header');
      return;
    }

    // Ou criar um botão se não existir
    const header = document.querySelector('.header');
    if (header && !document.getElementById('logoutBtn')) {
      const logoutBtn = document.createElement('button');
      logoutBtn.id = 'logoutBtn';
      logoutBtn.className = 'header-reset';
      logoutBtn.textContent = '🚪 Sair';
      logoutBtn.onclick = logout;
      logoutBtn.style.cssText = `
        position: absolute;
        top: 24px;
        right: 24px;
        padding: 8px 12px;
        background: var(--accent);
        color: var(--accent-ink);
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        z-index: 100;
      `;
      header.appendChild(logoutBtn);
      console.log('✓ Botão logout criado no header');
    }
  }

  // ========================================================================
  // INICIALIZAÇÃO
  // ========================================================================
  async function init() {
    console.log('🚀 Iniciando Fluxo Financeiro com Supabase...');

    // Aguardar DOM estar pronto
    if (document.readyState === 'loading') {
      console.log('⏳ Aguardando DOMContentLoaded...');
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    console.log('✓ DOM está pronto, iniciando autenticação...');

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
  // DESABILITAR SYNC ATÉ AUTENTICAÇÃO
  // ========================================================================
  // Marcar globalmente se está autenticado
  window.isSupabaseAuthenticated = false;

  // Interceptar o sync automático para não fazer nada se não autenticado
  const originalSyncToSupabase = window.syncToSupabase;
  if (typeof window.syncToSupabase === 'function') {
    window.syncToSupabase = async function() {
      if (!window.isSupabaseAuthenticated) {
        console.log('⏹️ [AUTH] Sincronização desabilitada - não autenticado no Google');
        return false;
      }
      return originalSyncToSupabase.apply(this, arguments);
    };
  }

  // ========================================================================
  // EXPOR FUNÇÕES GLOBAIS
  // ========================================================================
  window.loginWithGoogle = loginWithGoogle;
  window.logout = logout;
  window.checkAuth = checkAuth;
  window.loadDataFromSupabase = loadDataFromSupabase;

  console.log('✓ Funções globais expostas');

  // ========================================================================
  // INICIAR QUANDO PÁGINA CARREGAR
  // ========================================================================
  init();

})();
