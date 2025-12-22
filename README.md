# 🚀 WhatsApp Manager Resilient Wrapper

Uma camada de abstração (wrapper) robusta e resiliente sobre a biblioteca `whatsapp-web.js`. Projetada para gerenciar múltiplas instâncias de bots simultaneamente, lidar com falhas de injeção de script e facilitar o envio de mídias.

---

## ✨ Principais Diferenciais

* **Multi-Instância:** Gerencie diversos "atendentes" ou bots em um único processo Node.js de forma isolada.
* **Envio Resiliente:** Fallback automático para injeção direta via `window.Store` caso o método nativo de envio falhe (resolvendo o erro `Evaluation failed: t`).
* **Formatação Inteligente:** Auto-formatação de números brasileiros (adiciona DDI e trata JIDs).
* **Gerenciamento de Cache:** Organização automática de sessões usando `LocalAuth` para persistência de login.
* **Segurança Anti-Crash:** Try-catch embutido em todos os listeners de eventos para evitar que erros de lógica derrubem o processo.

---

## 🛠️ Pré-requisitos

* **Node.js** (v16 ou superior)
* **FFmpeg** instalado no sistema (necessário para mensagens de voz/áudio)
* As dependências instaladas:
```bash
npm install whatsapp-web.js qrcode-terminal axios fluent-ffmpeg

```



---

## 🚀 Como usar

### 1. Instalação

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/israel-nogueira/whatsapp-manager-wrappper.git
cd whatsapp-manager-wrappper
npm install

```

### 2. Implementação Básica

```javascript
const WhatsAppManager = require('./whatsapp.server');
const qrcode = require('qrcode-terminal');

const manager = new WhatsAppManager();

async function bootstrap() {
    // Conecta um atendente específico
    const bot = await manager.connect('ATENDENTE_01');

    // Gera o QR Code no terminal
    bot.on('qr', (qr) => {
        qrcode.generate(qr, { small: true });
    });

    // Evento quando o bot está pronto
    bot.on('ready', () => {
        console.log('✅ Bot está online!');
        bot.sendText('5541999999999', 'Olá! Sou um bot resiliente.');
    });

    // Inicia a conexão
    await bot.start();
}

bootstrap();

```

---

## 📂 Métodos Disponíveis

| Método | Descrição |
| --- | --- |
| `sendText(numero, texto)` | Envia mensagem de texto com fallback de segurança. |
| `sendVoice(numero, path)` | Envia áudio como mensagem de voz (formato PTT). |
| `sendImage(numero, path/array, caption)` | Envia uma ou mais imagens com legenda opcional. |
| `sendFileFromUrl(numero, url, caption)` | Faz download e envia arquivos diretamente de um link. |
| `listnerGroup(callback)` | Monitora entrada e saída de membros em grupos. |
| `deleteOldSession(id)` | Encerra a instância e limpa os arquivos de cache/login. |

---

## 📁 Estrutura de Pastas Sugerida

```text
.
├── bin/
│   └── ffmpeg.exe          # Opcional: Binário local do FFmpeg
├── whatsapp.cache/         # Gerado automaticamente (Sessions)
├── whatsapp.server.js      # O core do projeto
└── index.js                # Seu arquivo de entrada

```

---

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para abrir uma **Issue** ou enviar um **Pull Request**.

1. Faça um Fork do projeto
2. Crie uma Branch para sua Feature (`git checkout -b feature/NovaFeature`)
3. Dê um Commit nas mudanças (`git commit -m 'Adicionando nova funcionalidade'`)
4. Dê um Push na Branch (`git push origin feature/NovaFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.

---

**Desenvolvido por [Seu Nome]**

* GitHub: [@seu-usuario](https://www.google.com/search?q=https://github.com/israel-nogueira)
* LinkedIn: [Seu Nome](https://www.google.com/search?q=https://www.linkedin.com/in/israelnsouza)

