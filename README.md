# 🚀 WhatsApp Manager Resilient Wrapper

Uma camada de abstração (wrapper) robusta e resiliente sobre a biblioteca `whatsapp-web.js`. Projetada para gerenciar múltiplas instâncias de bots simultaneamente, lidar com falhas de injeção de script e facilitar o envio de mídias.

---

## ✨ Principais Diferenciais

* **Multi-Instância:** Gerencie diversos "atendentes" ou bots em um único processo Node.js de forma isolada.
* **Envio Resiliente:** Fallback automático para injeção direta via `window.Store` caso o método nativo de envio falhe (resolvendo o erro `Evaluation failed: t`).
* **Formatação Inteligente:** Auto-formatação de números brasileiros (adiciona DDI e trata JIDs).
* **Gerenciamento de Cache:** Organização automática de sessões usando `LocalAuth` para persistência de login.
* **Segurança Anti-Crash:** Try-catch embutido em todos os listeners de eventos para evitar que erros de lógica derrubem o processo.

Com certeza. Para um README profissional, a seção de dependências deve ser clara, separando o que é necessário para o sistema operacional (binários) do que é necessário para o projeto Node.js.

Aqui está a seção de **Dependências** e **Instalação** otimizada para o seu `README.md`:

---

## 📦 Dependências e Requisitos

O projeto depende de componentes em dois níveis: bibliotecas do Node.js e ferramentas do sistema operacional para processamento de mídia.

### 1. Requisitos do Sistema

Para o funcionamento pleno de todas as funcionalidades (especialmente conversão de áudio e manipulação de mensagens de voz), você precisará de:

* **Node.js:** Versão 16.0.0 ou superior.
* **FFmpeg:** Essencial para o envio de mensagens de voz (`.ogg`).
* *Windows:* O wrapper busca o binário em `./bin/ffmpeg.exe`.
* *Linux/Mac:* Certifique-se de ter o FFmpeg instalado no `$PATH` do sistema.



### 2. Dependências do Projeto (NPM)

As seguintes bibliotecas são utilizadas para o core do gerenciador:

| Pacote | Função |
| --- | --- |
| `whatsapp-web.js` | Core da comunicação com o WhatsApp Web. |
| `axios` | Realiza o download de arquivos via URL. |
| `fluent-ffmpeg` | Abstração para comandos do FFmpeg no Node.js. |
| `puppeteer` | Navegador headless para execução do WhatsApp Web. |
| `qrcode-terminal` | Exibição do QR Code de autenticação no console. |

---

## 🛠️ Instalação Rápida

Siga os passos abaixo para preparar o ambiente:

```bash
# 1. Clone o repositório
git clone https://github.com/israel-nogueira/whatsapp-manager-wrappper.git
cd whatsapp-manager-wrappper

# 2. Instale as dependências do Node.js
npm install whatsapp-web.js axios fluent-ffmpeg qrcode-terminal

# 3. Prepare o FFmpeg (Apenas se estiver no Windows e quiser usar o binário local)
mkdir bin
# Cole o ffmpeg.exe dentro da pasta /bin

```

> **Nota sobre o Puppeteer:** Ao instalar o `whatsapp-web.js`, o Puppeteer baixará automaticamente uma instância do Chromium. Certifique-se de que seu ambiente possui as bibliotecas de sistema necessárias para rodar navegadores headless (comum em servidores Linux/VPS).

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
        bot.sendText('5544999999999', 'Olá! Sou um bot resiliente.');
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

**Desenvolvido por Israel N Souza**

* **GitHub:** [israel-nogueira](https://github.com/israel-nogueira)
* **LinkedIn:** [Israel Nogueira Souza](https://www.linkedin.com/in/israelnsouza)