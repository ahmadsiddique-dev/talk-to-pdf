
const uploader = document.getElementById("uploader");
const uploaderDiv = document.getElementById("uploader-div");
const button = document.querySelector(".button");
const fileList = document.querySelector(".files-status");

uploaderDiv.addEventListener("click", () => {
    uploader.click();
});

let uploadedFiles = [];

uploader.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
        button.style.display = "block";
    }

    uploadedFiles = [...e.target.files]

    uploadFiles(uploadedFiles)
});

let formData = new FormData();

function uploadFiles(files) {
    files.forEach((file) => {
        formData.append("files", file);
    });

    const filesContainer = document.querySelector(".files-status")

    if (files.length > 0) {
        filesContainer.innerHTML = files.map((file) => {
            return `
            <div class="border border-gray-300 p-4 rounded-lg w-md max-w-md">
            <div class="flex flex-row items-center justify-center">
                <p class="truncate flex-1">
                    ${file.name}
                </p>

                <button class="w-7 h-7 hover:bg-red-200 p-1 cursor-pointer rounded-full shrink-0">
                    <img src="/cross.svg" alt="Delete Icon" class="delete-icon">
                </button>
            </div>
            <p class="text-sm text-gray-800 font-bold">${(file.size / 1024 > 0.5 ? file.size / 1024 : file.size / 1024 / 1024).toFixed(2)} ${file.size / 1024 > 0.5 ? "KB" : "MB"}</p>
        </div>
            `
        }).join("");
    }
}


