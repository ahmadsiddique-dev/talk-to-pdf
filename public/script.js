
const uploader = document.getElementById("uploader");
const uploaderDiv = document.getElementById("uploader-div");
const button = document.querySelector(".button");
const fileList = document.querySelector(".files-status");
const deleteButton = document.querySelector(".delete-file")

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
        return `
            <div class="border border-gray-300 p-4 rounded-lg w-md max-w-md">
                <div class="flex flex-row items-center justify-center">
                    <p class="truncate flex-1">
                        ${file.name}
                    </p>

                    <button 
                        type="button"
                        class="delete-file w-7 h-7 hover:bg-red-200 p-1 cursor-pointer rounded-full shrink-0"
                        data-index="${index}"
                    >
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
        console.log(data);
        alert("Files uploaded successfully!");
    } else {
        alert("Failed to upload files.");
    }
})





