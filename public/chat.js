
const textArea = document.querySelector("#ask");

async function submitFun() {
    const prompt = textArea.value
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

    console.log("Response: ", finalResponse.message)
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

const submitBtn = document.querySelector('#enter-button')

submitBtn.addEventListener('click', () => {
    submitFun();
})