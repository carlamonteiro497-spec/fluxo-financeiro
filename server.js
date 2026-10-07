const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Configuração Supabase
const SUPABASE_URL = 'https://nklszryglsrzsgkyzob.supabase.co';
const SUPABASE_KEY = 'sb_publishable_NQd9TQurcr-w20Z1YUi6Qw_gnUdQ7d5';

console.log('🚀 Iniciando servidor...');
console.log(`📁 Diretório atual: ${__dirname}`);

// ============================================================================
// PROXY PARA AUTENTICAÇÃO - Contorna bloqueio de DNS
// ============================================================================

// Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log(`📝 SignUp: ${email}`);

    const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Erro Supabase:', data);
      return res.status(response.status).json(data);
    }

    console.log('✅ Usuário criado:', email);
    res.json(data);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Sign In (Login)
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log(`🔐 SignIn: ${email}`);

    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Erro Supabase:', data);
      return res.status(response.status).json(data);
    }

    console.log('✅ Login bem-sucedido:', email);
    res.json(data);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Auth proxy running!' });
});

// ============================================================================
// SERVIR ARQUIVOS ESTÁTICOS
// ============================================================================
app.use(express.static(__dirname));

// Fallback para SPA - qualquer rota que não seja API vira index.html
app.get('*', (req, res) => {
  // API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint não encontrado' });
  }

  // SPA fallback
  const indexPath = path.join(__dirname, 'index.html');

  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Fluxo Financeiro</title>
      </head>
      <body>
        <h1>✓ Servidor rodando!</h1>
        <p>APIs disponíveis:</p>
        <ul>
          <li>POST /api/auth/signup - Criar conta</li>
          <li>POST /api/auth/signin - Fazer login</li>
          <li>GET /api/health - Status</li>
        </ul>
      </body>
      </html>
    `);
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Erro:', err);
  res.status(500).json({ error: err.message });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server rodando em porta ${PORT}`);
  console.log(`📝 Auth proxy: ${process.env.NODE_ENV === 'production' ? 'https://fluxo-financeiro-strk.onrender.com' : 'http://localhost:3000'}`);
  console.log(`✓ Pronto para receber requisições!`);
});
