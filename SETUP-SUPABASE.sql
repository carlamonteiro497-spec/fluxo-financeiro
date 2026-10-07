-- ============================================================================
-- SETUP SUPABASE - Cole tudo isso no SQL Editor do Supabase
-- ============================================================================
-- Data: 2026-10-06
-- Objetivo: Criar tabelas com user_id + RLS para autenticação obrigatória
-- ============================================================================

-- 1. TABELA: expenses (Despesas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  valuecents BIGINT NOT NULL DEFAULT 0,
  installments INT DEFAULT 1,
  cartao TEXT,
  installment_date TEXT,
  due_date TEXT,
  vencimento TEXT,
  parcelado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date DESC);

-- RLS: Row Level Security
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Política: Usuários veem apenas suas despesas
DROP POLICY IF EXISTS "expenses_select" ON expenses;
CREATE POLICY "expenses_select" ON expenses
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Usuários inserem despesas
DROP POLICY IF EXISTS "expenses_insert" ON expenses;
CREATE POLICY "expenses_insert" ON expenses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários atualizam suas despesas
DROP POLICY IF EXISTS "expenses_update" ON expenses;
CREATE POLICY "expenses_update" ON expenses
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários deletam suas despesas
DROP POLICY IF EXISTS "expenses_delete" ON expenses;
CREATE POLICY "expenses_delete" ON expenses
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 2. TABELA: contas_fixas (Contas Fixas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS contas_fixas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  value_cents BIGINT NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contas_fixas_user_id ON contas_fixas(user_id);
CREATE INDEX IF NOT EXISTS idx_contas_fixas_active ON contas_fixas(user_id, active);

ALTER TABLE contas_fixas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contas_fixas_select" ON contas_fixas;
CREATE POLICY "contas_fixas_select" ON contas_fixas
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "contas_fixas_insert" ON contas_fixas;
CREATE POLICY "contas_fixas_insert" ON contas_fixas
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "contas_fixas_update" ON contas_fixas;
CREATE POLICY "contas_fixas_update" ON contas_fixas
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "contas_fixas_delete" ON contas_fixas;
CREATE POLICY "contas_fixas_delete" ON contas_fixas
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 3. TABELA: renda_config (Configuração de Renda)
-- ============================================================================

CREATE TABLE IF NOT EXISTS renda_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  value_cents BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_renda_config_user_id ON renda_config(user_id);

ALTER TABLE renda_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "renda_config_select" ON renda_config;
CREATE POLICY "renda_config_select" ON renda_config
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "renda_config_insert" ON renda_config;
CREATE POLICY "renda_config_insert" ON renda_config
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "renda_config_update" ON renda_config;
CREATE POLICY "renda_config_update" ON renda_config
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 4. TABELA: reembolsos (Reembolsos)
-- ============================================================================

CREATE TABLE IF NOT EXISTS reembolsos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  value_cents BIGINT NOT NULL DEFAULT 0,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reembolsos_user_id ON reembolsos(user_id);
CREATE INDEX IF NOT EXISTS idx_reembolsos_date ON reembolsos(user_id, date DESC);

ALTER TABLE reembolsos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reembolsos_select" ON reembolsos;
CREATE POLICY "reembolsos_select" ON reembolsos
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "reembolsos_insert" ON reembolsos;
CREATE POLICY "reembolsos_insert" ON reembolsos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reembolsos_update" ON reembolsos;
CREATE POLICY "reembolsos_update" ON reembolsos
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reembolsos_delete" ON reembolsos;
CREATE POLICY "reembolsos_delete" ON reembolsos
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 5. TABELA: user_profiles (Perfis de Usuário)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  shared_group_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_shared_group ON user_profiles(shared_group_id);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_profiles_select" ON user_profiles;
CREATE POLICY "user_profiles_select" ON user_profiles
  FOR SELECT
  USING (auth.uid() = id OR shared_group_id IS NOT NULL);

DROP POLICY IF EXISTS "user_profiles_update" ON user_profiles;
CREATE POLICY "user_profiles_update" ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================================
-- FUNÇÃO: criar perfil ao registrar
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- DADOS INICIAIS (OPCIONAL - remova se não precisar)
-- ============================================================================

-- Descomente e modifique com seus dados reais:
/*
-- Inserir renda padrão para o usuário
-- (substitua 'seu-id-de-usuário' pelo UUID do usuário)
-- INSERT INTO renda_config (user_id, value_cents)
-- VALUES ('seu-uuid-aqui', 754068)
-- ON CONFLICT DO NOTHING;
*/

-- ============================================================================
-- VERIFICAÇÕES
-- ============================================================================

-- Depois de colar, execute estas queries para verificar:

-- 1. Verificar tabelas criadas
-- SELECT tablename FROM pg_tables WHERE schemaname='public';

-- 2. Verificar RLS ativado
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname='public' AND tablename IN ('expenses', 'contas_fixas', 'renda_config', 'reembolsos', 'user_profiles');

-- 3. Verificar policies
-- SELECT tablename, policyname FROM pg_policies
-- WHERE schemaname='public';

-- ============================================================================
-- FIM DO SETUP
-- ============================================================================
