# 🚀 PASSO-A-PASSO: Implementar Autenticação + Supabase

**Tempo Total: ~30 minutos**

---

## 📋 CHECKLIST

- [ ] PASSO 1: Configurar Supabase
- [ ] PASSO 2: Incluir Script no HTML
- [ ] PASSO 3: Testar Login
- [ ] PASSO 4: Migrar Dados (Opcional)
- [ ] PASSO 5: Deploy

---

## ✅ PASSO 1: CONFIGURAR SUPABASE (10 min)

### 1.1 - Ir para Supabase Dashboard

1. Abrir: https://app.supabase.com
2. Selecionar seu projeto: `nklszryrglsrzsgkyzob`
3. No menu esquerdo, clicar em: **SQL Editor**

### 1.2 - Executar Script SQL

1. Clique em **+ New Query**
2. Copie TODO o conteúdo de `SETUP-SUPABASE.sql`
3. Cole no editor
4. Clique em **▶ Run** (botão verde no canto inferior direito)
5. Aguarde mensagem: ✓ Success

**O que foi criado:**
- ✓ Tabela `expenses` com user_id + RLS
- ✓ Tabela `contas_fixas` com user_id + RLS
- ✓ Tabela `renda_config` com user_id + RLS
- ✓ Tabela `reembolsos` com user_id + RLS
- ✓ Tabela `user_profiles` com compartilhamento
- ✓ Índices para performance
- ✓ Row Level Security (RLS) para segurança

### 1.3 - Ativar Google OAuth

1. No Supabase, menu esquerdo: **Authentication**
2. Clicar na aba: **Providers**
3. Procurar por **Google** e clicar nela
4. Habilitar o toggle (canto superior direito)

**Se não tiver Google Credentials:**
1. Ir para: https://console.cloud.google.com/
2. Criar novo projeto (ou usar existente)
3. Ativar "Google+ API"
4. Criar "OAuth 2.0 Client ID" (Web Application)
5. Adicionar Redirect URI: `https://nklszryrglsrzsgkyzob.supabase.co/auth/v1/callback`
6. Copiar Client ID e Client Secret
7. Voltar ao Supabase > Google Provider > colar valores

---

## ✅ PASSO 2: INCLUIR SCRIPT NO HTML (5 min)

### 2.1 - Abrir `index.html`

```bash
# Se estiver no terminal
code index.html
# ou abra em seu editor favorito
```

### 2.2 - Adicionar Supabase SDK

Encontre a linha com:
```html
</head>
```

**ANTES DELA**, adicione:
```html
<!-- Supabase SDK -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

Resultado:
```html
<link rel="manifest" href="manifest.json">
<!-- Supabase SDK -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
```

### 2.3 - Adicionar Script de Autenticação

Encontre a linha com:
```html
</body>
</html>
```

**ANTES DELA**, adicione:
```html
<!-- Auth + Supabase -->
<script src="auth-supabase-complete.js"></script>
```

Resultado:
```html
  </script>

<!-- Auth + Supabase -->
<script src="auth-supabase-complete.js"></script>
</body>
</html>
```

### 2.4 - Salve o arquivo `index.html`

---

## ✅ PASSO 3: TESTAR LOGIN (5 min)

### 3.1 - Abrir Aplicação

1. Abra seu `index.html` no navegador
   - Se está em GitHub Pages: `https://seu-usuario.github.io/fluxo-financeiro/`
   - Se é local: `file:///caminho/para/index.html`

### 3.2 - Verificar Tela de Login

Você deve ver:
- ✓ Modal azul centralizada
- ✓ Botão "🔐 Entrar com Google"
- ✓ Sem dados aparecendo (interface bloqueada)

Se VER dados aparecendo → há problema com localStorage ainda ativo. Limpe com DevTools:
```javascript
// Abrir DevTools (F12) > Console
localStorage.clear();
location.reload();
```

### 3.3 - Fazer Login

1. Clique em "🔐 Entrar com Google"
2. Selecione sua conta Google
3. Autorize acesso

**Deve aparecer:**
- ✓ Seu email
- ✓ Seus dados carregando
- ✓ Interface desbloqueando
- ✓ Botão "🚪 Sair"

### 3.4 - Testar em Outro Device

1. Abra a aplicação em outro dispositivo (celular, tablet, etc)
2. Faça login com MESMA conta Google
3. Verifique se dados são os MESMOS

**Sucesso!** ✓ Tudo sincronizado

### 3.5 - Testar Sincronização

1. Em um device: Adicionar uma nova despesa
2. Em outro device: Atualizar página (F5)
3. Verifique se despesa apareceu

---

## ✅ PASSO 4: MIGRAR DADOS ANTIGOS (Opcional - 10 min)

Se você tem dados no localStorage antigo:

### 4.1 - Exportar localStorage

```javascript
// Abrir DevTools (F12) > Console
// Copiar e colar isto:

const OLD_DATA = {
  expenses: JSON.parse(localStorage.getItem('passou_anotou_expenses') || '{"expenses":[]}').expenses,
  contas_fixas: JSON.parse(localStorage.getItem('fluxo_contas_fixas') || '[]'),
  renda: JSON.parse(localStorage.getItem('fluxo_renda_config') || '0'),
  reembolsos: JSON.parse(localStorage.getItem('fluxo_reembolsos') || '[]')
};

console.log('DADOS PARA MIGRAR:', JSON.stringify(OLD_DATA, null, 2));
```

### 4.2 - Inserir no Supabase

1. Copie o JSON que apareceu no console
2. Vá para Supabase > SQL Editor > New Query
3. Crie inserts:

```sql
-- Inserir despesas
INSERT INTO expenses (user_id, date, description, valuecents, installments, cartao)
VALUES 
  ('seu-uuid-aqui', '2026-10-01', 'Despesa teste', 10000, 1, 'Cartão X'),
  ('seu-uuid-aqui', '2026-09-15', 'Outra despesa', 5000, 2, 'Cartão Y');

-- Inserir contas fixas
INSERT INTO contas_fixas (user_id, name, value_cents, active)
VALUES 
  ('seu-uuid-aqui', 'Aluguel', 200000, true),
  ('seu-uuid-aqui', 'Internet', 9999, true);

-- Inserir renda
INSERT INTO renda_config (user_id, value_cents)
VALUES ('seu-uuid-aqui', 754068);
```

**Dica:** Você pode obter seu UUID em:
- Supabase > Authentication > Users
- Copiar o "User ID" do seu usuário

---

## ✅ PASSO 5: COMPARTILHAR COM ESPOSA (15 min)

Se você quer que você E sua esposa vejam os MESMOS dados:

### 5.1 - Criar Grupo Compartilhado

No Supabase > SQL Editor > New Query:

```sql
-- Substituir 'seu-uuid' e 'uuid-esposa' pelos UUIDs reais

-- Definir ID do grupo
UPDATE user_profiles 
SET shared_group_id = 'grupo-carla-2026'
WHERE email IN ('carlamonteiro497@gmail.com', 'email-da-esposa@gmail.com');
```

### 5.2 - Atualizar RLS para Compartilhamento

```sql
-- Despesas compartilhadas
DROP POLICY "expenses_select" ON expenses;
CREATE POLICY "expenses_select" ON expenses
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR user_id IN (
      SELECT id FROM user_profiles up2 
      WHERE up2.shared_group_id = (
        SELECT shared_group_id FROM user_profiles 
        WHERE id = auth.uid()
      )
      AND shared_group_id IS NOT NULL
    )
  );

-- Mesma coisa para outras tabelas:
-- contas_fixas, renda_config, reembolsos
```

### 5.3 - Testar Compartilhamento

1. **Carla** faz login e adiciona despesa
2. **Esposa** faz login e vê a MESMA despesa
3. **Esposa** edita um valor
4. **Carla** atualiza página e vê a mudança

---

## ✅ PASSO 5B: DEPLOY NO GITHUB PAGES (5 min)

Se quer colocar no ar:

### 5B.1 - Fazer Commit

```bash
git add index.html auth-supabase-complete.js SETUP-SUPABASE.sql
git commit -m "feat: autenticação Google + Supabase com RLS"
git push origin main
```

### 5B.2 - Ativar GitHub Pages

1. Vá para: https://github.com/carlamonteiro497-spec/fluxo-financeiro/settings
2. Menu esquerdo: **Pages**
3. Source: `main` branch
4. Clique em **Save**
5. Espere ~1 minuto
6. Acesse: `https://carlamonteiro497-spec.github.io/fluxo-financeiro/`

---

## ❌ TROUBLESHOOTING

### Problema: "Dados ainda aparecem sem login"

**Solução:**
```javascript
// DevTools Console
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Problema: "Google Login não funciona"

**Solução:**
1. Verificar se Google OAuth está habilitado em Supabase
2. Verificar se está usando URL correta (https, não http)
3. Abrir DevTools > Console e procurar por erros

### Problema: "Dados não sincronizam entre devices"

**Solução:**
1. Verificar RLS está ativado (SQL > `SELECT * FROM pg_policies`)
2. Verificar se está fazendo login com MESMA conta Google
3. Atualizar página manualmente (F5)

### Problema: "Mensagem: Email não autorizado"

**Solução:**
Editar `auth-supabase-complete.js`, linha ~18:
```javascript
AUTHORIZED_EMAILS: ['carlamonteiro497@gmail.com', 'email-da-esposa@gmail.com'],
```

---

## ✅ PRONTO!

Após completar todos os passos:

✅ Autenticação obrigatória com Google  
✅ Dados apenas no Supabase  
✅ Zero localStorage inseguro  
✅ Sincronização em tempo real  
✅ Compartilhamento entre Carla + Esposa  
✅ Funciona em múltiplos devices  
✅ Deploy no GitHub Pages  

**Dúvidas?** Verifique console (F12 > Console) para mensagens de erro.

---

## 📞 SUPORTE

Se tiver problemas:

1. **Abrir DevTools:** F12
2. **Ir para Console**
3. **Copiar mensagens de erro**
4. **Procurar por "Error" ou "❌"**

Mensagens comuns:

| Mensagem | Significado | Solução |
|----------|------------|---------|
| `❌ Email não autorizado` | Email não está na lista branca | Adicionar email em AUTHORIZED_EMAILS |
| `Erro ao fazer login` | Google OAuth não configurado | Verificar Supabase > Authentication > Providers |
| `Erro ao carregar dados` | RLS bloqueando acesso | Verificar RLS policies em SQL |
| `Dados não sincronizam` | WebSocket não conectado | Atualizar página (F5) |

---

**Data:** 2026-10-06  
**Versão:** 1.0  
**Status:** ✅ Pronto para usar
