# ✅ TESTES E VALIDAÇÃO

**Checklist completo de testes**

---

## 🧪 TESTE 1: Autenticação (5 min)

### Caso de Teste 1.1: Tela de Login Bloqueada

**Procedimento:**
1. Abrir `index.html` em navegador limpo (sem cache)
2. Não fazer login

**Esperado:**
- [ ] Modal azul aparece centralizada
- [ ] Botão "🔐 Entrar com Google" visível
- [ ] Nenhum dado de despesas aparece
- [ ] Interface principal está OCULTA

**Status:** ✅ PASSOU / ❌ FALHOU

---

### Caso de Teste 1.2: Login com Google Funciona

**Procedimento:**
1. Clicar em "🔐 Entrar com Google"
2. Selecionar conta Google
3. Autorizar acesso

**Esperado:**
- [ ] Redirecionado para Supabase
- [ ] Volta para a aplicação
- [ ] Modal desaparece
- [ ] Interface principal APARECE
- [ ] Email do usuário aparece em "🚪 Sair"
- [ ] DevTools Console mostra: "✓ Autenticado como:"

**Status:** ✅ PASSOU / ❌ FALHOU

---

### Caso de Teste 1.3: Logout Limpa Dados

**Procedimento:**
1. Fazer login (Teste 1.2)
2. Clicar em "🚪 Sair"

**Esperado:**
- [ ] Modal de login reaparece
- [ ] Interface fica oculta
- [ ] Nenhum dado visível
- [ ] DevTools Console mostra: "✓ Logout realizado"

**Status:** ✅ PASSOU / ❌ FALHOU

---

## 🧪 TESTE 2: Carregamento de Dados (5 min)

### Caso de Teste 2.1: Dados Carregam do Supabase

**Setup:** Ter pelo menos 1 despesa no Supabase

**Procedimento:**
1. Fazer login
2. Aguardar 2 segundos

**Esperado:**
- [ ] Dados aparecem na interface
- [ ] Despesas mostram corretamente
- [ ] Contas fixas aparecem
- [ ] Renda aparece
- [ ] DevTools Console mostra:
  - "📦 Carregando dados do Supabase..."
  - "✓ Dados carregados:"
  - Contagem de despesas

**Status:** ✅ PASSOU / ❌ FALHOU

---

### Caso de Teste 2.2: Dados Não Vêm de localStorage

**Setup:** localStorage vazio (usar `localStorage.clear()`)

**Procedimento:**
1. Abrir DevTools > Console
2. Digitar: `localStorage.getItem('passou_anotou_expenses')`
3. Fazer login

**Esperado:**
- [ ] localStorage retorna `null`
- [ ] Dados ainda aparecem (vindo de Supabase)
- [ ] Interface funciona normalmente

**Status:** ✅ PASSOU / ❌ FALHOU

---

## 🧪 TESTE 3: Sincronização em Tempo Real (10 min)

### Caso de Teste 3.1: Adicionar Despesa Sincroniza

**Setup:** Ter 2 navegadores abertos (você logado em ambos)

**Procedimento:**
1. **Navegador A**: Adicionar nova despesa
2. **Navegador B**: Observar sem recarregar

**Esperado:**
- [ ] Despesa aparece em Navegador A
- [ ] Dentro de 5 segundos, aparece em Navegador B
- [ ] DevTools Navegador B mostra: "📡 Despesas atualizadas: INSERT"

**Status:** ✅ PASSOU / ❌ FALHOU

---

### Caso de Teste 3.2: Editar Despesa Sincroniza

**Setup:** Ter despesa em ambos os navegadores

**Procedimento:**
1. **Navegador A**: Editar descrição/valor de despesa
2. **Navegador B**: Observar

**Esperado:**
- [ ] Mudança aparece em Navegador A
- [ ] Dentro de 5 segundos, aparece em Navegador B
- [ ] Devem estar idênticas

**Status:** ✅ PASSOU / ❌ FALHOU

---

### Caso de Teste 3.3: Deletar Despesa Sincroniza

**Setup:** Ter despesa em ambos

**Procedimento:**
1. **Navegador A**: Deletar uma despesa
2. **Navegador B**: Observar

**Esperado:**
- [ ] Despesa desaparece em Navegador A
- [ ] Dentro de 5 segundos, desaparece em Navegador B

**Status:** ✅ PASSOU / ❌ FALHOU

---

## 🧪 TESTE 4: Multi-Device (15 min)

### Caso de Teste 4.1: Dados Sincronizam PC ↔ Mobile

**Setup:** Ter acesso a PC e mobile com mesma conta Google

**Procedimento:**
1. **PC**: Fazer login
2. **Mobile**: Abrir app e fazer login (MESMA conta Google)
3. **PC**: Adicionar despesa
4. **Mobile**: Atualizar página (F5)

**Esperado:**
- [ ] Despesa adicionada em PC
- [ ] Mesma despesa aparece em Mobile após refresh
- [ ] Valores idênticos
- [ ] Datas idênticas

**Status:** ✅ PASSOU / ❌ FALHOU

---

### Caso de Teste 4.2: Login em 3º Device

**Setup:** Ter 3 dispositivos

**Procedimento:**
1. Login em Device 1
2. Login em Device 2
3. Adicionar despesa em Device 2
4. Login em Device 3
5. Verificar dados em Device 3

**Esperado:**
- [ ] Device 3 mostra despesa de Device 2
- [ ] Todos veem dados idênticos
- [ ] Sincronização funciona entre todos

**Status:** ✅ PASSOU / ❌ FALHOU

---

## 🧪 TESTE 5: Compartilhamento Carla + Esposa (20 min)

*Apenas se implementar compartilhamento*

### Caso de Teste 5.1: Dados Compartilhados Aparecem

**Setup:** 
- Carla e Esposa têm grupos compartilhados configurados
- Ter pelo menos 1 despesa de Carla

**Procedimento:**
1. Carla faz login e adiciona despesa
2. Esposa faz login

**Esperado:**
- [ ] Esposa vê despesa de Carla
- [ ] Dados aparecem automaticamente
- [ ] DevTools mostra dados carregados

**Status:** ✅ PASSOU / ❌ FALHOU

---

### Caso de Teste 5.2: Edições São Compartilhadas

**Setup:** Ambas logadas com grupo compartilhado

**Procedimento:**
1. Carla edita valor de despesa
2. Esposa observa (sem recarregar)

**Esperado:**
- [ ] Mudança aparece em Carla
- [ ] Dentro de 5 segundos, aparece em Esposa

**Status:** ✅ PASSOU / ❌ FALHOU

---

## 🧪 TESTE 6: Segurança (10 min)

### Caso de Teste 6.1: Outro Email Não Consegue Login

**Setup:** Ter email não autorizado

**Procedimento:**
1. Tentar fazer login com email diferente
2. Autorizar no Google

**Esperado:**
- [ ] Retorna tela de login
- [ ] Mensagem: "❌ Email não autorizado"
- [ ] Interface não abre
- [ ] DevTools mostra: "Email não autorizado"

**Status:** ✅ PASSOU / ❌ FALHOU

---

### Caso de Teste 6.2: RLS Bloqueia Acesso Direto

**Setup:** Terminal/curl disponível

**Procedimento:**
```bash
# Tentar acessar dados de outro usuário (vai dar erro 403)
curl -H "Authorization: Bearer token-falso" \
  https://nklszryrglsrzsgkyzob.supabase.co/rest/v1/expenses
```

**Esperado:**
- [ ] Retorna erro 403 Forbidden
- [ ] Não retorna dados
- [ ] RLS está funcionando

**Status:** ✅ PASSOU / ❌ FALHOU

---

## 🧪 TESTE 7: Performance (5 min)

### Caso de Teste 7.1: Carregamento Rápido

**Setup:** Ter 50+ despesas no Supabase

**Procedimento:**
1. Fazer login
2. Medir tempo até dados aparecer
3. Abrir DevTools > Network > medir requisição `/expenses`

**Esperado:**
- [ ] Dados aparecem em < 3 segundos
- [ ] Requisição < 1 segundo
- [ ] Sem lag ao renderizar

**Status:** ✅ PASSOU / ❌ FALHOU

---

### Caso de Teste 7.2: Sincronização Realtime Rápida

**Setup:** Ter 2 navegadores

**Procedimento:**
1. Adicionar despesa em Navegador A
2. Medir tempo até aparecer em Navegador B

**Esperado:**
- [ ] Aparece em < 5 segundos
- [ ] Sem delay visível

**Status:** ✅ PASSOU / ❌ FALHOU

---

## 📋 RELATÓRIO FINAL

### Resumo dos Testes

| Teste | Status | Observações |
|-------|--------|------------|
| 1.1 Tela Login Bloqueada | ✅/❌ | |
| 1.2 Login Google Funciona | ✅/❌ | |
| 1.3 Logout Limpa | ✅/❌ | |
| 2.1 Dados Carregam | ✅/❌ | |
| 2.2 Sem localStorage | ✅/❌ | |
| 3.1 Adicionar Sincroniza | ✅/❌ | |
| 3.2 Editar Sincroniza | ✅/❌ | |
| 3.3 Deletar Sincroniza | ✅/❌ | |
| 4.1 PC ↔ Mobile | ✅/❌ | |
| 4.2 3 Devices | ✅/❌ | |
| 5.1 Compartilhamento | ✅/❌ | |
| 5.2 Edições Compartilhadas | ✅/❌ | |
| 6.1 Email Não Autorizado | ✅/❌ | |
| 6.2 RLS Segurança | ✅/❌ | |
| 7.1 Performance | ✅/❌ | |
| 7.2 Realtime Rápido | ✅/❌ | |

**Total de Testes: 16**  
**Aprovados: ___ / 16**  
**Taxa de Sucesso: ___%**

---

## 🐛 BUGS ENCONTRADOS

Se encontrar problemas, preencha:

### Bug #1
- **Descrição:** 
- **Como Reproduzir:**
- **Resultado Esperado:**
- **Resultado Atual:**
- **Screenshots:** 

### Bug #2
- **Descrição:** 
- **Como Reproduzir:**
- **Resultado Esperado:**
- **Resultado Atual:**
- **Screenshots:**

---

## ✅ APROVAÇÃO

**Data:** ___/___/______  
**Testado por:** ________________  
**Status:** ✅ PRONTO PARA PRODUÇÃO / ❌ NECESSITA CORREÇÕES

**Assinatura:** ________________

---

**Fim dos Testes**
