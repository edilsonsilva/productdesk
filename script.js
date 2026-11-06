/*
 * CONFIGURAÇÃO:
 * 1. Informe abaixo a URL da rota POST da sua API.
 * 2. A API deve aceitar multipart/form-data com os campos:
 *    nomeproduto, categoria, descricao, preco e foto.
 * 3. Se a URL permanecer vazia, o formulário funcionará em modo demonstração
 *    (validação e pré-visualização, sem gravar no banco).
 */
const API_URL = ""; // Ex.: "http://localhost:3000/api/produtos"

const form = document.getElementById("productForm");
const fotoInput = document.getElementById("foto");
const uploadArea = document.getElementById("uploadArea");
const uploadContent = document.getElementById("uploadContent");
const imagePreview = document.getElementById("imagePreview");
const removeImageButton = document.getElementById("removeImage");
const descricaoInput = document.getElementById("descricao");
const charCount = document.getElementById("charCount");
const submitButton = document.getElementById("submitButton");
const toast = document.getElementById("toast");

let previewUrl = null;
let toastTimeout = null;

function showToast(message, isError = false) {
  toast.textContent = message;
  toast.style.background = isError ? "#b83f50" : "#17233b";
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 3500);
}

function clearPreview() {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = null;
  fotoInput.value = "";
  imagePreview.removeAttribute("src");
  imagePreview.hidden = true;
  uploadContent.hidden = false;
  removeImageButton.hidden = true;
}

function handleImage(file) {
  if (!file) return;
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  const maxSize = 5 * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    showToast("Formato inválido. Use PNG, JPG ou WEBP.", true);
    fotoInput.value = "";
    return;
  }
  if (file.size > maxSize) {
    showToast("A imagem deve ter no máximo 5 MB.", true);
    fotoInput.value = "";
    return;
  }

  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(file);
  imagePreview.src = previewUrl;
  imagePreview.hidden = false;
  uploadContent.hidden = true;
  removeImageButton.hidden = false;
}

fotoInput.addEventListener("change", () => handleImage(fotoInput.files[0]));
removeImageButton.addEventListener("click", clearPreview);

["dragenter", "dragover"].forEach(eventName => {
  uploadArea.addEventListener(eventName, event => {
    event.preventDefault();
    uploadArea.classList.add("dragover");
  });
});
["dragleave", "drop"].forEach(eventName => {
  uploadArea.addEventListener(eventName, event => {
    event.preventDefault();
    uploadArea.classList.remove("dragover");
  });
});
uploadArea.addEventListener("drop", event => {
  const file = event.dataTransfer.files[0];
  if (!file) return;
  // Atribui o arquivo ao input para que ele também seja enviado no FormData.
  const transfer = new DataTransfer();
  transfer.items.add(file);
  fotoInput.files = transfer.files;
  handleImage(file);
});

descricaoInput.addEventListener("input", () => {
  charCount.textContent = `${descricaoInput.value.length}/1000`;
});

form.addEventListener("reset", () => {
  // O reset nativo ocorre depois deste evento.
  setTimeout(() => {
    clearPreview();
    charCount.textContent = "0/1000";
    showToast("Formulário limpo.");
  }, 0);
});

form.addEventListener("submit", async event => {
  event.preventDefault();

  if (!form.reportValidity()) return;

  const preco = Number(document.getElementById("preco").value);
  if (!Number.isFinite(preco) || preco <= 0) {
    showToast("Informe um preço válido maior que zero.", true);
    return;
  }

  const formData = new FormData(form);
  formData.set("preco", preco.toFixed(2));

  if (!API_URL.trim()) {
    showToast("Validação concluída! Configure a API_URL no script.js para salvar.");
    console.info("Dados do formulário (modo demonstração):", {
      nomeproduto: formData.get("nomeproduto"),
      categoria: formData.get("categoria"),
      descricao: formData.get("descricao"),
      preco: formData.get("preco"),
      foto: formData.get("foto")?.name || null
    });
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Enviando...";
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: formData
      // Não defina Content-Type manualmente: o navegador adiciona o boundary.
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.message || result.mensagem || `Erro HTTP ${response.status}`);
    }

    showToast(result.message || result.mensagem || "Produto cadastrado com sucesso!");
    form.reset();
  } catch (error) {
    console.error("Falha ao cadastrar produto:", error);
    showToast(error.message || "Não foi possível cadastrar o produto.", true);
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Cadastrar produto <span>→</span>';
  }
});
