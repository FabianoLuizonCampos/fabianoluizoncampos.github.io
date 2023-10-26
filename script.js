const openAIapiKey = process.env.OPENAI_API_KEY;
const azureAPIKey = process.env.AZURE_API_KEY;

const darkMode = () => {

    const toggleButton = document.getElementById('darkModeToggle');

    // Verifique a preferência do usuário no armazenamento local
    let isDarkMode = localStorage.getItem('darkMode') === 'true';
    
    // Aplique o estilo inicial com base na preferência do usuário
    if (isDarkMode) {
        document.documentElement.style.setProperty('--background-color', '#000');
        document.documentElement.style.setProperty('--text-color', '#fff');
    }
    
    // Adicione um evento de clique ao botão
    toggleButton.addEventListener('click', () => {
        // Alterne entre o Dark Mode e o Light Mode
        if (isDarkMode) {
            console.log('Dark');
            document.documentElement.style.setProperty('--background-color', '#fff');
            document.documentElement.style.setProperty('--text-color', '#272727');
            localStorage.setItem('darkMode', 'false');
            isDarkMode = false;
        } else {
            console.log('Light');
            document.documentElement.style.setProperty('--background-color', '#000');
            document.documentElement.style.setProperty('--text-color', '#fff');
            localStorage.setItem('darkMode', 'true');
            isDarkMode = true;
        }
    });

}
// Aqui vamos capturar a fala do usuario
const capturarFala = () => {
    let botao = document.querySelector('#microfone');
    let input = document.querySelector('input');

    // Aqui vamos criar um objeto de reconheccimento de fala
    const recognition = new webkitSpeechRecognition();

    recognition.lang = window.navigator.language;
    recognition.interimResults = true;

    const microfoneButton = document.querySelector('.sem-audio');

    botao.addEventListener('mousedown', () => { 
        //console.log('1');
        
        microfoneButton.classList.remove('sem-audio')
        microfoneButton.classList.add('com-audio');

        recognition.start(); 
    });

    botao.addEventListener('mouseup', () => { 
        //console.log('2');
        microfoneButton.classList.remove('com-audio')
        microfoneButton.classList.add('sem-audio');

        recognition.stop(); 
        perguntarAoJarvis(input.value);
    });

    // Aqui vamos capturar o resultado da fala
    recognition.addEventListener('result', (e) => {
        //console.log('3');
        const result = e.results[e.results.length - 1][0].transcript;
        input.value = result;        
    });

}

const perguntarAoJarvis = async (pergunta) => {

    let url = 'https://api.openai.com/v1/chat/completions';

    let header = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openAIapiKey}`
    }

    let body  = {       
        "model": "ft:gpt-3.5-turbo-0613:zeros-e-um::8DDHyrh4",
        "messages": [
            {"role": "system", "content": "Jarvis \u00e9 um chatbot pontual e muito simp\u00e1tico que ajuda as pessoas"},
            {"role": "user", "content": pergunta}],
        "temperature": 0.7   
    }

    let options = {
        method: 'POST',
        headers: header,
        body: JSON.stringify(body)
    }

    fetch(url, options)
    .then((response) => {
        return response.json();
    })
    .then((data) => {
        console.log(data.choices[0].message.content);
        respontaDoJarvis(data.choices[0].message.content);
    });

}

const respontaDoJarvis = async (data) => {
    // URL para a API de serviço de fala da Microsoft
    const url = 'https://brazilsouth.tts.speech.microsoft.com/cognitiveservices/v1';

    // Cabeçalhos da solicitação
    const headers = new Headers({
        'Ocp-Apim-Subscription-Key': azureAPIKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        'User-Agent': 'curl',
    });

    // Corpo da solicitação (dados no formato XML)
    const body = `
        <speak version='1.0' xml:lang='pt-BR'>
            <voice xml:lang='pt-BR' xml:gender='Male' name='pt-BR-JulioNeural'>
                ${data}
            </voice>
        </speak>
    `;
    // Configuração da solicitação
    const requestOptions = {
        method: 'POST',
        headers: headers,
        body: body,
    };

    // Realize a solicitação usando o fetch
    fetch(url, requestOptions)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro na solicitação: ${response.status}`);
            }
            return response.blob();
        })
        .then(blob => {
            // Lida com a resposta (um arquivo de áudio no formato MP3)
            // Você pode fazer o que desejar com o blob de áudio aqui
            console.log('Solicitação bem-sucedida, resposta de áudio:', blob);
            // Crie uma URL de objeto (Object URL) a partir do blob de áudio
            const audioURL = URL.createObjectURL(blob);

            // Crie um elemento de áudio para reproduzir o áudio
            const audioElement = new Audio(audioURL);

            // Adicione o elemento de áudio ao documento HTML
            document.body.appendChild(audioElement);

            // Inicie a reprodução do áudio
            audioElement.play();
        })
        .catch(error => {
            console.error('Erro na solicitação:', error);
        });

}


const ativarPorFala = async () => {

    let input = document.querySelector('input');

    // Crie uma instância de SpeechRecognition
    const recognition = new webkitSpeechRecognition();

    // Defina configurações para a instância
    recognition.continuous = true; // Permite que ele continue escutando
    recognition.interimResults = false; // Define para true se quiser resultados parciais

    // Inicie o reconhecimento de voz
    recognition.start();

    // Adicione um evento de escuta para lidar com os resultados
    recognition.onresult = (event) => {
        const result = event.results[event.results.length - 1]; // Último resultado

        // Verifique o texto reconhecido
        const recognizedText = result[0].transcript;

        // Verifique se a palavra "Jarvis" está no texto
        if (recognizedText.toLowerCase().includes('jarvis')) {

            // Comece a salvar a pergunta quando "Jarvis" é detectado
            let array_pergunta = recognizedText.toLowerCase().split('jarvis');
            array_pergunta = array_pergunta[array_pergunta.length - 1];

            input.value = array_pergunta;
            perguntarAoJarvis(array_pergunta);

            // Pare o reconhecimento de voz para economizar recursos
            recognition.stop();
        }
    };

    // Adicione um evento para reiniciar o reconhecimento após um tempo
    recognition.onend = () => {
        setTimeout(() => {
            recognition.start();
        }, 1000); // Espere 1 segundo antes de reiniciar
    };
      
    

}

ativarPorFala();
//capturarFala();
//darkMode();

