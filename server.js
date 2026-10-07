const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Configuração Supabase
const SUPABASE_URL = 'https://nklszryglsrzsgkyzob.supabase.co';
const SUPABASE_KEY = 'sb_publishable_NQd9TQurcr-w20Z1YUi6Qw_gnUdQ7d5';

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

// Servir arquivos estáticos (front-end)
app.use(express.static(path.join(__dirname, '.')));

// Fallback para SPA
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server rodando em porta ${PORT}`);
  console.log(`📝 Auth proxy: ${process.env.NODE_ENV === 'production' ? 'https://fluxo-financeiro-strk.onrender.com' : 'http://localhost:3000'}`);
});
