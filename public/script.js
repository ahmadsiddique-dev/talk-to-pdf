
const uploader = document.getElementById("uploader");
const uploaderDiv = document.getElementById("uploader-div");
const button = document.querySelector(".button");
const fileList = document.querySelector(".files-status");
const deleteButton = document.querySelector(".delete-file")

class Toast {
    constructor(pos = 'tr', maxStack = 3) {
        this.maxStack = maxStack;
        this.container = document.querySelector(`.toast-container[data-position="${pos}"]`);
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            this.container.dataset.position = pos;
            document.body.appendChild(this.container);
        }
    }

    show(type, title, msg, duration = 4000) {
        const activeToasts = this.container.querySelectorAll('.toast');
        if (activeToasts.length >= this.maxStack) {
            activeToasts[0].remove();
        }

        const t = document.createElement('div');
        t.className = `toast style-solid toast-${type}`;
        t.innerHTML = `
      <div class="toast-icon">${this.getIcon(type)}</div>
      <div class="toast-content"><b>${title}</b><div>${msg}</div></div>
      <button class="toast-close">&times;</button>
      <div class="toast-progress"></div>`;

        const animMode = 'slide';
        const baseEntry = 'slideInRight';

        if (animMode === 'zoom') {
            t.style.animation = 'zoomIn 0.4s forwards';
        } else if (animMode === 'shake') {
            t.style.animation = `${baseEntry} 0.4s forwards, shake 0.4s 0.4s`;
        } else {
            t.style.animation = `${baseEntry} 0.4s forwards`;
        }

        this.container.appendChild(t);

        const currentPos = this.container.dataset.position;
        let animOut = currentPos.includes('r') ? 'slideOutRight' : 'slideOutLeft';
        if (currentPos === 'tc') animOut = 'slideOutUp';
        if (currentPos === 'bc') animOut = 'slideOutDown';

        const bar = t.querySelector('.toast-progress');
        if (bar) {
            bar.style.transform = 'scaleX(1)';
            setTimeout(() => {
                bar.style.transition = `transform ${duration}ms linear`;
                bar.style.transform = 'scaleX(0)';
            }, 50);
        }

        const dismiss = () => {
            t.style.animation = `${animOut} 0.3s forwards`;
            t.addEventListener('animationend', () => t.remove());
        };

        t.querySelector('.toast-close').onclick = dismiss;
        setTimeout(dismiss, duration);
    }

    getIcon(type) {
        const icons = { "success": "<svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M20 6 9 17l-5-5\"/></svg>", "error": "<svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"m15 9-6 6\"/><path d=\"m9 9 6 6\"/></svg>", "warning": "<svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z\"/><path d=\"M12 9v4\"/><path d=\"M12 17h.01\"/></svg>", "info": "<svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M12 16v-4\"/><path d=\"M12 8h.01\"/></svg>" };
        return icons[type];
    }
}

const toast = new Toast();

uploaderDiv.addEventListener("click", () => {
    uploader.click();
});

let files = []
uploader.addEventListener("change", (e) => {
    files = [...files, ...Array.from(e.target.files)];
    renderFiles();
});

function renderFiles() {
    if (files.length > 0) {
        button.style.display = "block";
    }

    fileList.innerHTML = files.map((file, index) => {
        let percentage = 0
        return `
            <div class="border border-gray-300 p-4 rounded-lg w-md max-w-md">
            <div class="w-full justify-start items-center flex -mt-4 rounded-full  bg-green-200">
                <p 
                class="rounded-full h-2 w-[${percentage}%] bg-green-500 pt-0 progress-bar"
                data-file="${file.name}"
                ></p>
            </div>
            <div class="flex flex-row items-center justify-center">

                <p class="truncate flex-1">
                    ${file.name}
                </p>

                <button type="button" class="delete-file w-7 h-7 hover:bg-red-200 p-1 cursor-pointer rounded-full shrink-0"
                    data-index="${index}">
                    <img src="/cross.svg" alt="Delete Icon" class="delete-icon">
                </button>
            </div>
        
            <p class="text-sm text-gray-800 font-bold">
                    ${file.size / 1024 > 0.5
                ? (file.size / 1024).toFixed(2) + " KB"
                : (file.size / 1024 / 1024).toFixed(2) + " MB"
            }
            </p>
        </div>

        `;
    }).join("");
}


fileList.addEventListener("click", (e) => {
    const deleteButton = e.target.closest(".delete-file");

    if (!deleteButton) return;

    const index = Number(deleteButton.dataset.index);

    files.splice(index, 1);

    renderFiles();
})

const submitBtn = document.querySelector("#submit-btn");
submitBtn.addEventListener("click", async () => {
    const formData = new FormData();
    files.forEach((file) => {
        formData.append("files", file);
    });

    const response = await fetch("/upload", {
        method: "POST",
        body: formData
    });

    if (response.ok) {
        const data = await response.json();
        const ids = data.ids;
        toast.show('success', "Added", "Files has been added for processing!")

        for (const item of ids) {
            const eventSource = new EventSource(`/job/${item.id}`, {
                withCredentials: true
            })

            eventSource.onmessage = (e) => {
                const data = JSON.parse(e.data)
                const fileName = data.fileName;

                files.map((file) => {
                    if (file.name === fileName) {
                        console.log("hello dear", data.progress)
                        const element = fileList.querySelectorAll(`.progress-bar[data-file="${file.name}"]`)
                        element[0].style.width = `${data.progress}%`
                    }
                })

                if (data.state === 'completed') {
                    eventSource.close();

                    files = files.filter(f => f.name !== fileName);

                    renderFiles();

                    if (files.length === 0) {
                        button.style.display = "none";
                        const chatButton = document.getElementById('chat-button');
                        chatButton.style.display = 'flex'
                    }
                }
            }
            eventSource.onerror = (err) => {
                toast.show("error", "Server Error", `${err instanceof Error ? err.message : "Something went wrong!"}`)
                eventSource.close();
            }
        }
    } else {
        toast.show("error", "Failed", "Failed to process files!")
    }
})


