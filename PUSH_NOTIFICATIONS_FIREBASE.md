# 🔔 Push Notifications com Firebase (GRATUITO)

## ✅ Parte 1: Alertas Visuais (JÁ FEITO!)

Quando você abre o app, aparece um banner vermelho mostrando:
- 🔴 **Contas que vencem HOJE**
- 🟡 **Contas que vencem AMANHÃ**

**Pronto para usar!** Nenhuma configuração necessária.

---

## 🚀 Parte 2: Push Notifications (Próximo passo)

Receber notificações no celular **mesmo com app fechado**.

### O que você vai ter:

```
14:30 - App fechado
  ↓
Notificação chega: "⚠️ Aluguel vence HOJE - R$ 2.500"
  ↓
Você clica
  ↓
App abre automaticamente
```

---

## 📋 Pré-requisitos:

- ✅ Vercel configurado (já fizemos)
- ✅ Email Google (Gmail ou qualquer email Google)
- ✅ App no celular (após subir no Vercel)

---

## ⚙️ Configuração Firebase

### Passo 1: Criar projeto Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Clique em **"Criar um projeto"**
3. Nome: `fluxo-financeiro`
4. Clique em **"Continuar"**
5. Desabilitar Google Analytics (opcional)
6. Clique em **"Criar projeto"**

### Passo 2: Configurar Cloud Messaging

1. Na esquerda, clique em **"Cloud Messaging"**
2. Você verá uma chave de servidor (Server Key) - **COPIE ISSO**
3. Também pegue o ID do Projeto (project ID)

### Passo 3: Pegar credenciais

Você precisa de 2 coisas:
- **projectId**: Ex: `fluxo-financeiro-abc123`
- **apiKey**: Você encontra em **Configurações do Projeto** → **Chave de API da Web**

---

## 📝 Código para Backend (Firebase Cloud Function)

Vou criar uma **Cloud Function** que roda todo dia e envia notificações.

### Criar a função:

1. No Firebase Console, vá em **"Cloud Functions"**
2. Clique em **"Criar função"**
3. Nome: `enviar-notificacoes-vencimentos`
4. Trigger: **Cloud Pub/Sub**
5. Tópico: `daily-trigger` (crie um novo)
6. Cole este código:

```javascript
const admin = require("firebase-admin");

admin.initializeApp();

exports.enviarNotificacoesVencimentos = functions.pubsub
  .schedule("0 9 * * *") // Todos os dias às 9h
  .timeZone("America/Sao_Paulo")
  .onRun(async (context) => {
    try {
      const hoje = new Date();
      const amanha = new Date(hoje);
      amanha.setDate(amanha.getDate() + 1);

      // Aqui você buscaria os dados do Firestore
      // Por enquanto, é apenas um exemplo
      
      // Notificação de exemplo
      const message = {
        notification: {
          title: "⚠️ Contas a Vencer!",
          body: `Verifique seus vencimentos de hoje e amanhã`,
        },
        webpush: {
          fcmOptions: {
            link: "https://seu-app.vercel.app",
          },
          notification: {
            icon: "💰",
            badge: "💰",
          },
        },
        topic: "vencimentos", // Tópico para enviar para todos
      };

      const response = await admin.messaging().send(message);
      console.log("Notificação enviada:", response);
      return null;
    } catch (error) {
      console.error("Erro ao enviar notificação:", error);
      return null;
    }
  });
```

7. Clique em **"Implantação"**
8. Espere completar (pode levar 5 min)

---

## 🎯 Integrar no seu App

No seu `fluxo-integrado-final.html`, adicione (já está pronto!):

```javascript
// No boot():
verificarVencimentosProximos(); // Alertas visuais

// Registrar para push notifications:
if ("serviceWorker" in navigator && "PushManager" in window) {
  navigator.serviceWorker.ready.then((registration) => {
    // Pedir permissão
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        // Inscrever no tópico "vencimentos"
        registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: "sua-chave-publica",
        });
      }
    });
  });
}
```

---

## 🆓 Custos

**TOTALMENTE GRATUITO!**

- Firebase Cloud Functions: 2 milhões de invocações/mês grátis
- Cloud Messaging: Ilimitado grátis
- Firestore: 1GB de leitura/mês grátis

Você nunca vai atingir esses limites.

---

## 📱 Testar no Celular

Depois que tudo está configurado:

1. Abra o app no celular
2. Permite notificações? **Clique SIM**
3. Fecha o app (para a tela inicial)
4. Espera 9h da manhã de um dia com vencimento próximo
5. 🔔 Notificação chega!

---

## 🎯 Roadmap Completo:

- ✅ **Passo 1**: Alertas visuais (FEITO)
- ⏳ **Passo 2**: Firebase + Push (vou fazer)
- ⏳ **Passo 3**: Sincronizar dados na nuvem (opcional)

---

## ❓ Dúvidas?

Se quiser, eu posso:
1. Configurar tudo para você (preciso das credenciais Firebase)
2. Fazer um teste manual
3. Adicionar mais features (notificações customizadas por conta, etc)

**Quer que eu prossiga com Firebase?** 🚀
