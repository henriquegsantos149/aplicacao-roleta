const chatHistory = document.getElementById('chat-history');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// Substitua esta URL pelo link do seu Google Apps Script (Executar como Web App)
const APPS_SCRIPT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzTaYQ0Uh40MevHqyqfS3gjlyNis56d3uTWuykYB-Nk4XK9KtHU5R9kcDraw4o6ozLb/exec';

const initialMessages = [
    "Faaaala, tudo certo? Sou o <b>Agente Pro</b> e estou aqui para fazer o seu cadastro, para que você possa girar a roleta e concorrer a <b>prêmios incríveis</b>!",
    "A Ambiental Pro é um <b>ecossistema</b> do setor ambiental que transforma conhecimento em diferencial competitivo, e conexões em negócios estratégicos, seja bem-vindo!",
    "Nossas pós-graduações e cursos de extensão são <b>reconhecidos pelo MEC</b>, e já transformaram a vida de mais de <b>80k alunos</b>."
];

const questionSteps = [
    { key: "nome", text: "Para começarmos, qual o seu nome completo?", type: "text", placeholder: "Digite o seu nome completo" },
    { key: "email", text: "Prazer, {nome}! Qual é o seu melhor e-mail?", type: "text", placeholder: "Digite o seu e-mail" },
    { key: "telefone", text: "Show! E qual o seu número de WhatsApp? (com DDD)", type: "text", placeholder: "Ex: 11999999999" },
    { key: "formado", text: "Você já possui graduação?", type: "button", options: ["Sim", "Não"] },
    { key: "formacao", text: "Show! Qual a área da sua graduação?", type: "text", condition: (data) => data.formado === "Sim", placeholder: "Ex: Engenharia Ambiental" },
    { key: "cargo", text: "Para fechar: qual o seu cargo ou nome da empresa onde trabalha atualmente?", type: "text", placeholder: "Digite seu cargo ou empresa" }
];

let userData = {};
let currentStepIndex = 0;
let isAskingQuestions = false;

const inputContainer = document.getElementById('input-container');
const buttonChoices = document.getElementById('button-choices');

// Função para rolar o chat para baixo
function scrollToBottom() {
    chatHistory.scrollTo({
        top: chatHistory.scrollHeight,
        behavior: 'smooth'
    });
}

// Cria o elemento de "digitando"
function createTypingIndicator() {
    const wrapper = document.createElement('div');
    wrapper.className = 'message-wrapper bot typing-wrapper';

    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;

    wrapper.appendChild(indicator);
    return wrapper;
}

// Adiciona uma mensagem ao chat
function addMessage(text, isUser = false) {
    const wrapper = document.createElement('div');
    wrapper.className = `message-wrapper ${isUser ? 'user' : 'bot'}`;

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';

    if (isUser) {
        bubble.textContent = text;
    } else {
        bubble.innerHTML = text;
    }

    wrapper.appendChild(bubble);
    chatHistory.appendChild(wrapper);
    scrollToBottom();
}

// Simula o processo do bot digitando e enviando mensagem
async function processBotMessage(text, delayMs = 700) {
    // Adiciona indicador de digitando
    const typingIndicator = createTypingIndicator();
    chatHistory.appendChild(typingIndicator);
    scrollToBottom();

    // Aguarda o tempo simulado de digitação
    await new Promise(resolve => setTimeout(resolve, delayMs));

    // Remove o indicador
    typingIndicator.remove();

    // Adiciona a mensagem real
    addMessage(text, false);
}

// Inicia o fluxo de mensagens do bot
async function startChatFlow() {
    for (let i = 0; i < initialMessages.length; i++) {
        // Calcula um tempo mais rápido de digitação
        const typingDelay = Math.min(400 + (initialMessages[i].length * 10), 1200);

        // Pausa reduzida entre as mensagens
        if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 400));
        }

        await processBotMessage(initialMessages[i], typingDelay);
    }

    // Após as mensagens iniciais, inicia a fase de perguntas
    isAskingQuestions = true;
    await processBotMessage(questionSteps[0].text); // Usa o delay padrão
    showInputArea(questionSteps[0]);
}

function showInputArea(step) {
    inputContainer.classList.add('visible');
    if (step && step.type === 'button') {
        chatForm.style.display = 'none';
        buttonChoices.style.display = 'flex';
        buttonChoices.innerHTML = '';
        step.options.forEach(option => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.textContent = option;
            btn.onclick = () => submitAnswer(option);
            buttonChoices.appendChild(btn);
        });
    } else {
        chatForm.style.display = 'flex';
        buttonChoices.style.display = 'none';

        // Define o texto de exemplo (placeholder) baseado na pergunta
        if (step && step.placeholder) {
            userInput.placeholder = step.placeholder;
        } else {
            userInput.placeholder = "Digite sua resposta...";
        }

        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
    }
}

function disableInput() {
    inputContainer.classList.remove('visible');
    userInput.disabled = true;
    sendButton.disabled = true;
    chatForm.style.display = 'none';
    buttonChoices.style.display = 'none';
}

// Lida com o envio do formulário (texto)
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    submitAnswer(userInput.value);
});

async function submitAnswer(rawAnswer) {
    const answer = rawAnswer.trim();
    if (!answer) return;

    // Mostra mensagem do usuário
    addMessage(answer, true);

    // Limpa e desabilita input
    userInput.value = '';
    disableInput();

    if (isAskingQuestions && currentStepIndex < questionSteps.length) {
        // Salva a resposta do passo atual
        const currentStep = questionSteps[currentStepIndex];
        userData[currentStep.key] = answer;

        currentStepIndex++;

        // Pula os passos que não atendem à condição (ex: se Não for formado, pula formação)
        while (currentStepIndex < questionSteps.length) {
            const nextStep = questionSteps[currentStepIndex];
            if (!nextStep.condition || nextStep.condition(userData)) {
                break;
            }
            currentStepIndex++;
        }

        // Verifica se ainda tem perguntas
        if (currentStepIndex < questionSteps.length) {
            let nextStep = questionSteps[currentStepIndex];
            let nextQuestionText = nextStep.text;
            // Personaliza a mensagem se tiver a tag {nome}
            if (nextQuestionText.includes("{nome}")) {
                let firstName = userData.nome.split(" ")[0];
                nextQuestionText = nextQuestionText.replace("{nome}", firstName);
            }
            await processBotMessage(nextQuestionText);
            showInputArea(nextStep);
        } else {
            // Finalizou as perguntas
            isAskingQuestions = false;
            await processBotMessage(`Obrigado, ${userData.nome.split(" ")[0]}! Aguarde enquanto processo seu cadastro...`);
            await sendDataToWebhook(userData);
        }
    }
}

// Integração com Apps Script
async function sendDataToWebhook(data) {
    try {
        // Adiciona indicador de 'enviando' invisível visualmente mas para dar tempo
        const typingIndicator = createTypingIndicator();
        chatHistory.appendChild(typingIndicator);
        scrollToBottom();

        // Envia para o webhook. Usa 'no-cors' para evitar erro de CORS
        const payload = {
            ...data,
            timestamp: new Date().toISOString()
        };

        const response = await fetch(APPS_SCRIPT_WEBHOOK_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        typingIndicator.remove();

        // Sucesso
        await processBotMessage("Cadastro recebido com sucesso! Agora você já pode girar a roleta. 🚀");

    } catch (error) {
        console.error('Erro ao enviar dados:', error);
        // Em caso de falha (mesmo sendo no-cors, falhas de rede caem aqui)
        // Remove indicador se existir (precisaria achar ele no DOM)
        const indicator = document.querySelector('.typing-wrapper');
        if (indicator) indicator.remove();

        await processBotMessage("Oops, ocorreu um pequeno erro de conexão. Mas não se preocupe, no ambiente real isso estará conectado à planilha!");
    }
}

// Inicia ao carregar a tela
window.addEventListener('load', () => {
    // Pequeno atraso antes de começar a falar para simular entrada na página
    setTimeout(startChatFlow, 800);
});

// Atualiza o estado do botão dependendo do input
userInput.addEventListener('input', () => {
    if (userInput.value.trim().length > 0) {
        sendButton.style.opacity = '1';
    } else {
        sendButton.style.opacity = '0.7';
    }
});
