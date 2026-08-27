const textArea = document.querySelector("#ask");
const chatArea = document.querySelector("#chat-interface");
const visibleArea = document.querySelector("#visible-area");
const submitBtn = document.querySelector('#enter-button')


let chatMessages = [];

function scrollToBottom() {
    chatArea.scrollTop = chatArea.scrollHeight;
}

async function submitFun() {
    const prompt = textArea.value

    const img = submitBtn.firstElementChild

    img.setAttribute("src", '/loader.svg')
    textArea.disabled = true
    submitBtn.disabled = true
    img.classList.add('animate-spin')

    textArea.value = ''

    const response = await fetch('/ask', {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({prompt: prompt}),
        
    })

    // const reader = response.body.getReader();

    // const decoder = new TextDecoder();

    // while (true) {
    //     const { value, done } = await reader.read();
    //     if (done) break; 

    //     const textChunk = decoder.decode(value, { stream: true });
    // }

    const finalResponse = await response.json();

    img.setAttribute("src", "/send.svg");
    textArea.disabled = false;
    textArea.disabled = false;
    img.classList.remove('animate-spin')

    chatMessages = finalResponse.message

    chatArea.innerHTML = chatMessages.map((m) => {
        return `
            <div class="w-90 p-2! ${m.role === 'assistant' ? 'bg-rose-400': "bg-rose-700 text-white"} rounded-xl ${m.role === 'user' && 'self-end'} shrink-0">
                ${m.content}
            </div>
        `
    })

    scrollToBottom();
}

textArea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submitFun();
    }
    if (e.key === 'Enter' && e.shiftKey) {
        console.log("golo golo");
        
    }
});

submitBtn.addEventListener('click', () => {
    submitFun();
})
