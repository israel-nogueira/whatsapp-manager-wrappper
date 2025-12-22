/**
 * @file whatsapp.js
 * @description Wrapper resiliente para whatsapp-web.js com suporte a múltiplas instâncias e correções de contexto.
 * @version 1.0.0
 * @author Israel N. Souza <contato@israelnogueira.com>
 * @license MIT
 * @repository https://github.com/israel-nogueira/whatsapp-manager-wrappper
 * * Descrição:
 * Este gerenciador facilita a criação de múltiplos bots em um único processo,
 * tratando automaticamente o cache de sessão, formatação de números brasileiros
 * e falhas comuns de injeção de script no Puppeteer.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const ffmpeg = require('fluent-ffmpeg');

// Configuração do binário FFmpeg para manipulação de áudio
const ffmpegPath = path.join(__dirname, 'bin', 'ffmpeg.exe');
ffmpeg.setFfmpegPath(ffmpegPath);

// Previne logs excessivos de avisos do Node.js
process.emitWarning = () => { };

class WhatsAppManager {
    /**
     * @constructor
     * Inicializa o gerenciador e garante a estrutura de pastas para sessões.
     */
    constructor() {
        this.clients = {};
        this.cachePath = path.join(__dirname, 'whatsapp.cache');
        
        if (!fs.existsSync(this.cachePath)) {
            fs.mkdirSync(this.cachePath, { recursive: true });
        }
    }

    /**
     * Converte arquivos para o formato .ogg (opus), compatível com mensagens de voz.
     * @param {string} inputPath - Caminho do arquivo original.
     * @param {string} outputPath - Caminho de destino.
     */
    async convertToOgg(inputPath, outputPath) {
        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .output(outputPath)
                .audioCodec('libopus')
                .format('ogg')
                .on('end', () => resolve(outputPath))
                .on('error', (err) => reject(err))
                .run();
        });
    }

    /**
     * Cria ou recupera uma instância de cliente WhatsApp.
     * @param {string} user_ID - Identificador único da sessão.
     * @param {Function} [callback] - Função executada após a criação do objeto.
     */
    async connect(user_ID, callback) {
        // Evita instanciar o mesmo bot duas vezes
        if (this.clients[user_ID]) {
            const wrap = this.createAppWrapper(user_ID);
            if (callback) callback(wrap);
            return wrap;
        }

        this.clients[user_ID] = {
            ready: false,
            whats: new Client({
                authStrategy: new LocalAuth({
                    clientId: user_ID,
                    dataPath: this.cachePath
                }),
                puppeteer: {
                    headless: true,
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--no-zygote',
                        '--disable-web-security',
                    ],
                },
            }),
        };

        const clientObj = this.clients[user_ID].whats;
        const wrapper = this.createAppWrapper(user_ID);

        if (callback) callback(wrapper);

        // Inicialização sem bloqueio da thread principal
        clientObj.initialize().catch(err => {
            console.error(`| Erro crítico no cliente ${user_ID}:`, err.message);
            delete this.clients[user_ID];
        });

        // Previne tentativa de exclusão de arquivos bloqueados no logout
        clientObj.authStrategy.logout = async () => Promise.resolve();

        return wrapper;
    }

    /**
     * Encerra a sessão e limpa o cache físico do disco.
     * @param {string} user_ID - ID da sessão a ser deletada.
     */
    async deleteOldSession(user_ID) {
        const userSessionBrowser = path.join(this.cachePath, `session-${user_ID}`);
        try {
            if (this.clients[user_ID]?.whats?.pupBrowser?.isConnected()) {
                await this.clients[user_ID].whats.pupBrowser.close();
            }
            
            setTimeout(() => {
                if (fs.existsSync(userSessionBrowser)) {
                    fs.rmSync(userSessionBrowser, { recursive: true, force: true });
                }
                delete this.clients[user_ID];
            }, 1000);
        } catch (error) {
            console.error("Erro ao excluir sessão:", error);
        }
    }

    /**
     * Camada de abstração que adiciona funcionalidades extras ao cliente.
     * @private
     */
    createAppWrapper(user_ID) {
        const client = this.clients[user_ID].whats;
        if (!client) return null;

        const subOn = client.on.bind(client);

        // --- UTILITÁRIOS ---

        client.me = () => client.info;

        client.formatNumber = (number) => {
            const sNumber = number.toString();
            if (sNumber.includes('@')) return sNumber;
            let clean = sNumber.replace(/\D/g, '');
            if (clean.length <= 11 && !clean.startsWith('55')) clean = '55' + clean;
            return `${clean}@c.us`;
        };

        // --- EVENTOS E SEGURANÇA ---

        /** Listener protegido para evitar crash por erros internos de funções externas */
        client.on = (event, handler) => {
            subOn(event, (...args) => {
                try {
                    handler(...args);
                } catch (e) {
                    console.error(`Erro no listener do evento ${event}:`, e.message);
                }
            });
        };

        /** Monitoramento leve de atividade em grupos */
        client.listnerGroup = (callback) => {
            if (!callback) return;

            const handleEvent = async (notification, acao) => {
                try {
                    if (!client.pupPage || client.pupPage.isClosed()) return;

                    const grupo_id = notification.chatId || (notification.id ? notification.id.remote : null);
                    const usuario_id = notification.author || notification.recipientIds?.[0];
                    const grupo_nome = notification.chat?.name || "Grupo";

                    if (grupo_id) {
                        callback({
                            grupo_id, grupo_nome, usuario_id,
                            usuario_numero: usuario_id ? usuario_id.split('@')[0] : '',
                            acao
                        });
                    }
                } catch (err) {
                    console.error(`| Erro no listner de grupo (${acao}):`, err.message);
                }
            };

            subOn('group_join', (n) => handleEvent(n, 'entrou'));
            subOn('group_leave', (n) => handleEvent(n, 'saiu'));
        };

        // --- MÉTODOS DE ENVIO (COM FALLBACK) ---

        /** Envio de texto com suporte a injeção via Store em caso de falha nativa */
        client.sendText = async (number, msg) => {
            const jid = client.formatNumber(number);
            try {
                if (!client.pupPage || client.pupPage.isClosed()) return;
                
                await client.pupPage.waitForFunction(() => window.Store && window.Store.Chat, { timeout: 5000 }).catch(() => {});
                await client.sendMessage(jid, msg);
                console.log(`| ✅ Mensagem enviada para ${jid}`);
            } catch (e) {
                try {
                    await client.pupPage.evaluate(async (tJid, tMsg) => {
                        const wid = window.Store.WidFactory.createWid(tJid);
                        const chat = await window.Store.Chat.find(wid);
                        if (chat) await chat.sendMessage(tMsg);
                    }, jid, msg);
                } catch (err) {
                    console.error(`| Falha crítica no envio para ${jid}`);
                }
            }
        };

        /** Envia áudio como se fosse gravado na hora */
        client.sendVoice = async (number, audioPath, isViewOnce = false) => {
            try {
                const jid = client.formatNumber(number);
                const media = MessageMedia.fromFilePath(audioPath);
                await client.sendMessage(jid, media, { sendAudioAsVoice: true, isViewOnce });
            } catch (error) {
                console.error(`Erro ao enviar voz para ${number}:`, error.message);
            }
        };

        /** Envia imagens com suporte a múltiplas fotos e legendas */
        client.sendImage = async (number, images, caption = '', isViewOnce = false) => {
            try {
                const jid = client.formatNumber(number);
                const mediaArray = (Array.isArray(images) ? images : [images]).map(p => MessageMedia.fromFilePath(p));

                for (let i = 0; i < mediaArray.length; i++) {
                    const options = { isViewOnce };
                    if (i === mediaArray.length - 1) options.caption = caption;
                    await client.sendMessage(jid, mediaArray[i], options);
                }
            } catch (error) {
                console.error(`Erro ao enviar imagem para ${number}:`, error.message);
            }
        };

        // --- CONTROLE DE INSTÂNCIA ---

        client.start = async () => {
            return new Promise((resolve) => {
                if (client.info && client.info.wid) return resolve(true);
                subOn('ready', () => {
                    this.clients[user_ID].ready = true;
                    resolve(true);
                });
            });
        };

        client.closeApp = async () => {
            try {
                await client.destroy();
                if (client?.pupBrowser?.isConnected()) {
                    await client.pupBrowser.close();
                }
                delete this.clients[user_ID];
            } catch (error) {
                console.error("Erro ao fechar instância:", error);
            }
        };

        return client;
    }
}

module.exports = WhatsAppManager;