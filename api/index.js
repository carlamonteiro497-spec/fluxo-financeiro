import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Inicializar Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middlewares
app.use(cors());
app.use(express.json());

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

// Health check na raiz
app.get('/', (req, res) => {
  res.json({ message: 'Fluxo Financeiro API - Real-time Sync' });
});

// Exportar para Vercel Serverless
export default app;
