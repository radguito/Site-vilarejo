/**
 * COMPUTADOR VIRTUAL - MAQUINA DE TESTES PARA SCRIPT.PY
 * Leitor e Organizador de Folhas de Ponto com IA (Ollama qwen3-vl:4b)
 */

// ==========================================
// ESTADO DO SISTEMA E ARQUIVOS VIRTUAIS
// ==========================================

const VirtualFS = {
  // Pasta principal: Desktop / scaner diogo
  rootPath: "C:\\Users\\diogo\\Desktop\\scaner diogo",
  
  // Lista de arquivos na raiz da pasta scaner diogo
  files: [],

  // Subpastas criadas pela IA (ex: "DIOGO SILVA", "MARIA OLIVEIRA", "NAO_IDENTIFICADO")
  subfolders: {},

  // Caminho atual exibido no explorador
  currentPath: "",

  // Adicionar um novo arquivo de imagem
  addFile(name, dataUrl, detectedName = null) {
    const fileObj = {
      id: "file_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      name: name,
      dataUrl: dataUrl,
      size: (dataUrl.length * 0.75 / 1024).toFixed(1) + " KB",
      createdAt: new Date().toLocaleTimeString(),
      detectedName: detectedName // Nome pré-configurado para a simulação de OCR
    };
    this.files.push(fileObj);
    this.notifyUI();
    return fileObj;
  },

  // Mover um arquivo para uma subpasta
  moveFile(fileId, folderName) {
    const idx = this.files.findIndex(f => f.id === fileId);
    if (idx === -1) return null;

    const file = this.files.splice(idx, 1)[0];
    
    if (!this.subfolders[folderName]) {
      this.subfolders[folderName] = [];
    }
    
    this.subfolders[folderName].push(file);
    this.notifyUI();
    return file;
  },

  // Limpar a pasta scaner diogo
  clear() {
    this.files = [];
    this.subfolders = {};
    this.currentPath = "";
    this.notifyUI();
  },

  notifyUI() {
    renderExplorerFiles();
    renderSubfoldersTree();
    updateDesktopBadge();
  }
};

// Código original do script.py em string para exibição
const PYTHON_SCRIPT_CODE = `import re
import shutil
from pathlib import Path
import ollama

# ==========================================
# CONFIGURAÇÃO DE PASTA EXCLUSIVA
# ==========================================
DESKTOP = Path.home() / "Desktop"
if not DESKTOP.exists():
    DESKTOP = Path.home() / "Área de Trabalho"

PASTA_SCANER = DESKTOP / "scaner diogo"
PASTA_SCANER.mkdir(parents=True, exist_ok=True)

print()
print("======================================")
print(" LEITOR E ORGANIZADOR DE FOLHAS DE PONTO")
print("======================================")
print(f"Pasta de trabalho: {PASTA_SCANER}")
print()

extensoes_validas = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
imagens = [
    f for f in PASTA_SCANER.iterdir()
    if f.is_file() and f.suffix.lower() in extensoes_validas
]

if not imagens:
    print("ERRO: Nenhuma imagem encontrada para processar.")
    exit()

prompt = """
Você está analisando uma imagem de uma folha de ponto de um funcionário.
Sua tarefa é identificar o NOME COMPLETO do funcionário.
Procure por: Nome, Funcionário, Colaborador, Empregado.
Se identificar: FUNCIONARIO: NOME COMPLETO
Se não identificar: FUNCIONARIO: NAO_IDENTIFICADO
"""

def limpar_nome_pasta(nome: str) -> str:
    nome_limpo = re.sub(r'[\\\\/*?:"<>|]', "", nome).strip().rstrip(".")
    return nome_limpo if nome_limpo else "NAO_IDENTIFICADO"

def mover_arquivo(origem: Path, pasta_destino: Path) -> Path:
    pasta_destino.mkdir(parents=True, exist_ok=True)
    destino = pasta_destino / origem.name
    shutil.move(str(origem), str(destino))
    return destino

for idx, imagem in enumerate(imagens, start=1):
    print(f"[{idx}/{len(imagens)}] Processando: {imagem.name}...")
    resposta = ollama.chat(
        model="qwen3-vl:4b",
        messages=[{"role": "user", "content": prompt, "images": [str(imagem)]}]
    )
    # Extrair nome e mover para PASTA_SCANER / nome_funcionario ...
`;

// ==========================================
// GERADOR DE FOLHAS DE PONTO (CANVAS HTML5)
// ==========================================

function generateTimesheetCanvas(name, company, monthYear, style) {
  const canvas = document.getElementById("timesheet-canvas");
  const ctx = canvas.getContext("2d");
  
  // Limpar fundo branco
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Se o estilo for illegible (sem nome), forçar nome vazio
  const displayName = (style === 'illegible') ? "" : (name || "").toUpperCase();

  // Cabeçalho da Folha de Ponto
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(20, 20, canvas.width - 40, 50);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 18px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("FOLHA DE PONTO DE FUNCIONÁRIO", canvas.width / 2, 52);

  // Box de Dados Principais
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 80, canvas.width - 40, 110);

  ctx.fillStyle = "#0f172a";
  ctx.textAlign = "left";

  // Campo Empresa
  ctx.font = "bold 12px Inter, sans-serif";
  ctx.fillText("EMPRESA / RAZÃO SOCIAL:", 35, 105);
  ctx.font = "14px Inter, monospace";
  ctx.fillText(company || "EMPRESA DE TESTE LTDA", 210, 105);

  // Campo Funcionário (CHAVE QUE A IA LÊ)
  ctx.fillStyle = "#1e3a8a";
  ctx.font = "bold 13px Inter, sans-serif";
  ctx.fillText("NOME DO FUNCIONÁRIO:", 35, 140);

  ctx.font = "bold 16px Inter, sans-serif";
  if (style === 'handwritten') {
    ctx.font = "bold italic 18px cursive, sans-serif";
    ctx.fillStyle = "#047857";
  } else {
    ctx.fillStyle = "#0f172a";
  }
  
  if (displayName) {
    ctx.fillText(displayName, 210, 140);
  } else {
    ctx.fillStyle = "#94a3b8";
    ctx.font = "italic 13px Inter, sans-serif";
    ctx.fillText("[ CAMPO EM BRANCO / ILEGÍVEL ]", 210, 140);
  }

  // Campo Mês / Ano
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 12px Inter, sans-serif";
  ctx.fillText("PERÍODO / MÊS:", 35, 172);
  ctx.font = "13px Inter, monospace";
  ctx.fillText(monthYear || "AGOSTO / 2026", 210, 172);

  // Tabela de Registros de Ponto (31 dias)
  const startY = 210;
  const rowHeight = 14;

  ctx.fillStyle = "#f1f5f9";
  ctx.fillRect(20, startY, canvas.width - 40, 22);
  ctx.strokeStyle = "#cbd5e1";
  ctx.strokeRect(20, startY, canvas.width - 40, 22);

  ctx.fillStyle = "#334155";
  ctx.font = "bold 11px Inter, sans-serif";
  ctx.fillText("DIA", 30, startY + 15);
  ctx.fillText("ENTRADA 1", 80, startY + 15);
  ctx.fillText("SAÍDA 1", 160, startY + 15);
  ctx.fillText("ENTRADA 2", 240, startY + 15);
  ctx.fillText("SAÍDA 2", 320, startY + 15);
  ctx.fillText("ASSINATURA / RÚBRICA", 410, startY + 15);

  ctx.font = "10px Inter, monospace";
  ctx.fillStyle = "#475569";

  for (let i = 1; i <= 28; i++) {
    const currentY = startY + 22 + (i - 1) * rowHeight;

    ctx.strokeRect(20, currentY, canvas.width - 40, rowHeight);
    
    // Dia
    ctx.fillText(i.toString().padStart(2, '0'), 32, currentY + 11);

    // Horários fictícios
    ctx.fillText("08:00", 85, currentY + 11);
    ctx.fillText("12:00", 165, currentY + 11);
    ctx.fillText("13:00", 245, currentY + 11);
    ctx.fillText("17:00", 325, currentY + 11);

    // Rubrica manuscrita simulada
    if (style === 'handwritten' && displayName) {
      ctx.beginPath();
      ctx.strokeStyle = "#1d4ed8";
      ctx.lineWidth = 1;
      ctx.moveTo(420, currentY + 7);
      ctx.lineTo(440 + (i % 5), currentY + 10);
      ctx.stroke();
    }
  }

  // Rodapé da Folha com Assinaturas
  const footerY = 640;
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(40, footerY + 50);
  ctx.lineTo(260, footerY + 50);
  ctx.moveTo(340, footerY + 50);
  ctx.lineTo(560, footerY + 50);
  ctx.stroke();

  ctx.fillStyle = "#64748b";
  ctx.font = "11px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Assinatura do Empregado", 150, footerY + 66);
  ctx.fillText("Assinatura do Responsável", 450, footerY + 66);

  // Se o estilo for scanned, adicionar leve grânulo / textura
  if (style === 'scanned') {
    ctx.fillStyle = "rgba(0, 0, 0, 0.03)";
    for (let i = 0; i < 50; i++) {
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
    }
  }

  return canvas.toDataURL("image/png");
}

// ==========================================
// TERMINAL RUNNER (SIMULA O SCRIPT.PY REAL)
// ==========================================

let isScriptRunning = false;
let stopScriptRequested = false;

async function runPythonScript() {
  if (isScriptRunning) return;

  const logsContainer = document.getElementById("terminal-logs");
  const termStatusTag = document.getElementById("term-status-tag");
  const btnRun = document.getElementById("btn-term-run");
  const btnStop = document.getElementById("btn-term-stop");

  isScriptRunning = true;
  stopScriptRequested = false;
  btnRun.disabled = true;
  btnStop.disabled = false;
  termStatusTag.innerText = "Status: Executando...";
  termStatusTag.style.color = "#f59e0b";

  function appendLog(text, type = "info") {
    const line = document.createElement("div");
    line.className = `log-line log-${type}`;
    line.innerText = text;
    logsContainer.appendChild(line);
    
    const body = document.getElementById("terminal-body");
    body.scrollTop = body.scrollHeight;
  }

  // Pegar imagens da raiz da pasta scaner diogo
  const images = [...VirtualFS.files];

  appendLog("======================================", "header");
  appendLog(" LEITOR E ORGANIZADOR DE FOLHAS DE PONTO", "header");
  appendLog("======================================", "header");
  appendLog(`Pasta de trabalho: ${VirtualFS.rootPath}`, "info");
  appendLog("", "info");

  await sleep(600);

  if (images.length === 0) {
    appendLog("ERRO: Nenhuma imagem encontrada para processar.", "error");
    appendLog(`Coloque as imagens diretamente dentro da pasta:\n${VirtualFS.rootPath}`, "error");
    appendLog("", "info");
    appendLog("Script finalizado.", "info");

    finishScript();
    return;
  }

  appendLog(`Encontrado(s) ${images.length} arquivo(s) para processar.`, "info");
  appendLog("", "info");

  for (let idx = 0; idx < images.length; idx++) {
    if (stopScriptRequested) {
      appendLog("🛑 Processamento interrompido pelo usuário.", "error");
      break;
    }

    const img = images[idx];
    appendLog(`[${idx + 1}/${images.length}] Processando: ${img.name}...`, "info");

    await sleep(1000); // Simular chamada HTTP Ollama qwen3-vl

    // Determinar nome via IA (Simulado ou configurado no objeto)
    let detectedName = img.detectedName;
    
    if (!detectedName) {
      // Extração inteligente simulada baseada em palavras do nome do arquivo
      const cleanFileName = img.name.replace(/\.[^/.]+$/, "").toUpperCase();
      if (cleanFileName.includes("DIOGO")) detectedName = "DIOGO SILVA";
      else if (cleanFileName.includes("MARIA")) detectedName = "MARIA OLIVEIRA";
      else if (cleanFileName.includes("JOAO") || cleanFileName.includes("JOÃO")) detectedName = "JOÃO PEREIRA";
      else if (cleanFileName.includes("ANA")) detectedName = "ANA SOUZA";
      else if (cleanFileName.includes("ILEGIVEL") || cleanFileName.includes("SEM_NOME")) detectedName = "NAO_IDENTIFICADO";
      else detectedName = cleanFileName.replace(/[^A-Z\s]/g, " ").trim() || "NAO_IDENTIFICADO";
    }

    // Regra do script.py: limpar_nome_pasta
    let nomePasta = limparNomePasta(detectedName);

    if (nomePasta !== "NAO_IDENTIFICADO") {
      appendLog(`  Resposta IA: FUNCIONARIO: ${detectedName}`, "ai");
    } else {
      appendLog(`  Resposta IA: FUNCIONARIO: NAO_IDENTIFICADO`, "ai");
    }

    await sleep(400);

    // Mover arquivo fisicamente na VirtualFS
    const moved = VirtualFS.moveFile(img.id, nomePasta);
    if (moved) {
      appendLog(`  -> Movido para: ${nomePasta}\\${moved.name}`, "success");
    }

    appendLog("", "info");
  }

  appendLog("======================================", "header");
  appendLog("             CONCLUÍDO", "header");
  appendLog("======================================", "header");
  appendLog(`Total de imagens organizadas: ${images.length}`, "success");
  appendLog(`Todas as pastas e arquivos foram mantidos dentro de:`, "info");
  appendLog(VirtualFS.rootPath, "info");
  appendLog("======================================", "header");

  finishScript();

  function finishScript() {
    isScriptRunning = false;
    btnRun.disabled = false;
    btnStop.disabled = true;
    termStatusTag.innerText = "Status: Concluído";
    termStatusTag.style.color = "#10b981";
  }
}

function limparNomePasta(nome) {
  if (!nome || nome === "NAO_IDENTIFICADO") return "NAO_IDENTIFICADO";
  let limpo = nome.replace(/[\\/*?:"<>|]/g, "").trim();
  limpo = limpo.replace(/\.$/, "");
  return limpo ? limpo : "NAO_IDENTIFICADO";
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==========================================
// RENDERIZAÇÃO DA INTERFACE E GERENCIADOR DE JANELAS
// ==========================================

function renderExplorerFiles() {
  const grid = document.getElementById("explorer-files-grid");
  const dropHint = document.getElementById("drop-hint");
  const countLeft = document.getElementById("exp-status-left");
  const sideCount = document.getElementById("side-count");
  const subpathName = document.getElementById("subpath-name");
  const subpathSep = document.getElementById("subpath-sep");
  const btnPathBack = document.getElementById("btn-path-back");

  grid.innerHTML = "";

  // Se estiver navegando dentro de uma subpasta
  if (VirtualFS.currentPath) {
    subpathName.innerText = VirtualFS.currentPath;
    subpathName.style.display = "inline";
    subpathSep.style.display = "inline";
    btnPathBack.style.display = "inline";

    const filesInFolder = VirtualFS.subfolders[VirtualFS.currentPath] || [];
    countLeft.innerText = `${filesInFolder.length} arquivo(s) na subpasta ${VirtualFS.currentPath}`;

    if (filesInFolder.length === 0) {
      dropHint.style.display = "block";
    } else {
      dropHint.style.display = "none";
      filesInFolder.forEach(file => {
        const card = document.createElement("div");
        card.className = "file-card";
        card.innerHTML = `
          <img class="file-thumb" src="${file.dataUrl}" alt="${file.name}">
          <span class="file-card-title">${file.name}</span>
          <span class="file-card-sub">${file.size}</span>
        `;
        grid.appendChild(card);
      });
    }
    return;
  }

  // Raiz da pasta scaner diogo
  subpathName.style.display = "none";
  subpathSep.style.display = "none";
  btnPathBack.style.display = "none";

  const totalFiles = VirtualFS.files.length;
  const subfolderKeys = Object.keys(VirtualFS.subfolders);
  sideCount.innerText = totalFiles;
  countLeft.innerText = `${totalFiles} arquivo(s), ${subfolderKeys.length} pasta(s)`;

  if (totalFiles === 0 && subfolderKeys.length === 0) {
    dropHint.style.display = "block";
    return;
  }

  dropHint.style.display = "none";

  // 1. Renderizar Pastas criadas pela IA
  subfolderKeys.forEach(folderName => {
    const card = document.createElement("div");
    card.className = "file-card is-folder";
    card.title = `Abrir pasta ${folderName}`;
    card.innerHTML = `
      <div class="folder-big-icon">📁</div>
      <span class="file-card-title">${folderName}</span>
      <span class="file-card-sub">${VirtualFS.subfolders[folderName].length} item(ns)</span>
    `;
    card.onclick = () => {
      VirtualFS.currentPath = folderName;
      renderExplorerFiles();
    };
    grid.appendChild(card);
  });

  // 2. Renderizar Arquivos soltos na raiz
  VirtualFS.files.forEach(file => {
    const card = document.createElement("div");
    card.className = "file-card";
    card.innerHTML = `
      <button class="btn-file-delete" title="Excluir arquivo">&times;</button>
      <img class="file-thumb" src="${file.dataUrl}" alt="${file.name}">
      <span class="file-card-title">${file.name}</span>
      <span class="file-card-sub">${file.size}</span>
    `;
    
    // Botão apagar arquivo
    card.querySelector(".btn-file-delete").onclick = (e) => {
      e.stopPropagation();
      VirtualFS.files = VirtualFS.files.filter(f => f.id !== file.id);
      VirtualFS.notifyUI();
    };

    grid.appendChild(card);
  });
}

function renderSubfoldersTree() {
  const container = document.getElementById("subfolders-tree");
  const keys = Object.keys(VirtualFS.subfolders);

  if (keys.length === 0) {
    container.innerHTML = `<span class="tree-empty">Nenhuma pasta criada ainda. Rode o script.py!</span>`;
    return;
  }

  container.innerHTML = "";
  keys.forEach(folderName => {
    const item = document.createElement("div");
    item.className = "folder-tree-item";
    item.innerHTML = `<span>📁</span> <strong>${folderName}</strong> (${VirtualFS.subfolders[folderName].length})`;
    item.onclick = () => {
      openWindow("win-explorer");
      VirtualFS.currentPath = folderName;
      renderExplorerFiles();
    };
    container.appendChild(item);
  });
}

function updateDesktopBadge() {
  const badge = document.getElementById("desktop-file-badge");
  if (badge) {
    badge.innerText = VirtualFS.files.length;
  }
}

// ==========================================
// GERENCIADOR DE JANELAS (WINDOW MANAGER)
// ==========================================

let highestZIndex = 100;

function openWindow(winId) {
  const win = document.getElementById(winId);
  if (!win) return;

  win.classList.remove("minimized");
  highestZIndex++;
  win.style.zIndex = highestZIndex;

  // Atualizar aba na barra de tarefas
  document.querySelectorAll(".taskbar-tab").forEach(tab => {
    if (tab.dataset.win === winId) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });
}

function makeWindowDraggable(win) {
  const header = win.querySelector(".window-header");
  if (!header) return;

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  header.addEventListener("mousedown", (e) => {
    if (e.target.classList.contains("win-btn")) return;
    
    isDragging = true;
    offsetX = e.clientX - win.offsetLeft;
    offsetY = e.clientY - win.offsetTop;
    
    highestZIndex++;
    win.style.zIndex = highestZIndex;
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    if (win.classList.contains("maximized")) return;

    let left = e.clientX - offsetX;
    let top = e.clientY - offsetY;

    // Limites de tela
    left = Math.max(0, Math.min(window.innerWidth - win.offsetWidth, left));
    top = Math.max(0, Math.min(window.innerHeight - win.offsetHeight - 50, top));

    win.style.left = left + "px";
    win.style.top = top + "px";
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });
}

function initWindowControls() {
  document.querySelectorAll(".window-card").forEach(win => {
    makeWindowDraggable(win);

    win.addEventListener("mousedown", () => {
      highestZIndex++;
      win.style.zIndex = highestZIndex;
    });

    const btnMin = win.querySelector(".win-min");
    const btnMax = win.querySelector(".win-max");
    const btnClose = win.querySelector(".win-close");

    if (btnMin) {
      btnMin.onclick = () => win.classList.add("minimized");
    }

    if (btnMax) {
      btnMax.onclick = () => win.classList.toggle("maximized");
    }

    if (btnClose) {
      btnClose.onclick = () => win.classList.add("minimized");
    }
  });
}

// ==========================================
// INICIALIZAÇÃO DA APLICAÇÃO
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  initWindowControls();

  // Exibir Código Fonte do script.py no Code Viewer
  const codeElem = document.getElementById("code-viewer-content");
  if (codeElem) {
    codeElem.innerText = PYTHON_SCRIPT_CODE;
  }

  // Inicializar Prévia do Gerador de Folhas
  updateGeneratorPreview();

  // Relógio do Sistema Operacional
  updateSystemClock();
  setInterval(updateSystemClock, 1000);

  // Ícones do Desktop
  document.getElementById("icon-explorer").onclick = () => openWindow("win-explorer");
  document.getElementById("icon-terminal").onclick = () => openWindow("win-terminal");
  document.getElementById("icon-generator").onclick = () => openWindow("win-generator");
  document.getElementById("icon-code").onclick = () => openWindow("win-code");
  document.getElementById("icon-settings").onclick = () => openWindow("win-settings");

  // Botão Iniciar Rápido
  document.getElementById("quick-start-btn").onclick = createQuickStartExamples;

  // Botões da Barra de Ferramentas do Explorador
  document.getElementById("btn-exp-new-sheet").onclick = () => openWindow("win-generator");
  document.getElementById("btn-exp-clear").onclick = () => VirtualFS.clear();
  document.getElementById("btn-exp-run-script").onclick = () => {
    openWindow("win-terminal");
    runPythonScript();
  };

  document.getElementById("btn-path-back").onclick = () => {
    VirtualFS.currentPath = "";
    renderExplorerFiles();
  };

  // Upload de Imagens no Explorador
  document.getElementById("file-upload-input").onchange = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        VirtualFS.addFile(file.name, evt.target.result);
      };
      reader.readAsDataURL(file);
    });
  };

  // Drag and Drop de arquivos na window do Explorador
  const dropzone = document.getElementById("explorer-dropzone");
  dropzone.ondragover = (e) => {
    e.preventDefault();
    dropzone.classList.add("drag-over");
  };

  dropzone.ondragleave = () => {
    dropzone.classList.remove("drag-over");
  };

  dropzone.ondrop = (e) => {
    e.preventDefault();
    dropzone.classList.remove("drag-over");

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          VirtualFS.addFile(file.name, evt.target.result);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  // Botões do Terminal
  document.getElementById("btn-term-run").onclick = runPythonScript;
  document.getElementById("btn-term-stop").onclick = () => {
    stopScriptRequested = true;
  };
  document.getElementById("btn-term-clear").onclick = () => {
    document.getElementById("terminal-logs").innerHTML = "";
  };

  // Eventos do Gerador de Folhas
  document.getElementById("btn-gen-preview-only").onclick = updateGeneratorPreview;
  document.getElementById("btn-gen-create").onclick = () => {
    const nameInput = document.getElementById("gen-employee-name").value.trim();
    const company = document.getElementById("gen-company-name").value.trim();
    const month = document.getElementById("gen-month-year").value.trim();
    const style = document.getElementById("gen-style").value;

    const dataUrl = generateTimesheetCanvas(nameInput, company, month, style);

    let fileName = "folha_ponto_";
    if (nameInput) {
      fileName += nameInput.toLowerCase().replace(/\s+/g, "_") + ".png";
    } else {
      fileName += "sem_nome.png";
    }

    VirtualFS.addFile(fileName, dataUrl, nameInput || "NAO_IDENTIFICADO");
    openWindow("win-explorer");
  };

  // Taskbar Tabs
  document.querySelectorAll(".taskbar-tab").forEach(tab => {
    tab.onclick = () => openWindow(tab.dataset.win);
  });

  // Start Menu Toggle
  const startBtn = document.getElementById("start-menu-btn");
  const startMenu = document.getElementById("start-menu");
  startBtn.onclick = (e) => {
    e.stopPropagation();
    startMenu.style.display = startMenu.style.display === "none" ? "block" : "none";
  };

  document.addEventListener("click", () => {
    startMenu.style.display = "none";
  });

  document.getElementById("start-open-explorer").onclick = () => openWindow("win-explorer");
  document.getElementById("start-open-terminal").onclick = () => openWindow("win-terminal");
  document.getElementById("start-open-generator").onclick = () => openWindow("win-generator");
  document.getElementById("start-open-code").onclick = () => openWindow("win-code");
  document.getElementById("start-open-settings").onclick = () => openWindow("win-settings");

  // Criar 3 folhas de ponto de exemplo automaticamente ao abrir a aplicação
  createQuickStartExamples();
});

function updateGeneratorPreview() {
  const name = document.getElementById("gen-employee-name").value;
  const company = document.getElementById("gen-company-name").value;
  const month = document.getElementById("gen-month-year").value;
  const style = document.getElementById("gen-style").value;

  generateTimesheetCanvas(name, company, month, style);
}

function createQuickStartExamples() {
  VirtualFS.clear();

  // Exemplo 1: Diogo Silva
  const img1 = generateTimesheetCanvas("DIOGO SILVA DOS SANTOS", "RIO DAS OSTRAS SERVIÇOS", "AGOSTO/2026", "clean");
  VirtualFS.addFile("folha_ponto_diogo_silva.png", img1, "DIOGO SILVA DOS SANTOS");

  // Exemplo 2: Maria Oliveira (Manuscrita)
  const img2 = generateTimesheetCanvas("MARIA OLIVEIRA ALVES", "RIO DAS OSTRAS SERVIÇOS", "AGOSTO/2026", "handwritten");
  VirtualFS.addFile("folha_ponto_maria_oliveira.png", img2, "MARIA OLIVEIRA ALVES");

  // Exemplo 3: Sem Nome (NAO_IDENTIFICADO)
  const img3 = generateTimesheetCanvas("", "RIO DAS OSTRAS SERVIÇOS", "AGOSTO/2026", "illegible");
  VirtualFS.addFile("folha_ponto_sem_nome.png", img3, "NAO_IDENTIFICADO");

  openWindow("win-explorer");
}

function updateSystemClock() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });

  const clockElem = document.getElementById("system-time");
  const dateElem = document.getElementById("system-date");

  if (clockElem) clockElem.innerText = timeStr;
  if (dateElem) dateElem.innerText = dateStr;
}
