import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();

// Configurar __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicializar Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middlewares
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, '../public')));

// ============================================
// API ENDPOINTS
// ============================================

// GET - Listar todas as transações do usuário
app.get('/api/transactions', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('transaction_date', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST - Criar nova transação
app.post('/api/transactions', async (req, res) => {
  try {
    const { account_id, category_id, description, amount, type, transaction_date, due_date, notes } = req.body;
    
    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        account_id,
        category_id,
        description,
        amount,
        type,
        transaction_date,
        due_date,
        notes,
        user_id: req.user?.id
      }])
      .select();
    
    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - Obter resumo financeiro (consolidado)
app.get('/api/summary', async (req, res) => {
  try {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*');
    
    if (error) throw error;

    // Consolidar por categoria
    const summary = {};
    transactions.forEach(t => {
      if (!summary[t.category_id]) {
        summary[t.category_id] = 0;
      }
      summary[t.category_id] += t.amount;
    });

    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// SPA fallback - servir index.html para qualquer rota não encontrada
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Exportar para Vercel Serverless
export default app;
