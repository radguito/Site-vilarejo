import re
import shutil
from pathlib import Path
# pyrefly: ignore [missing-import]
import ollama

# ==========================================
# CONFIGURAÇÃO DE PASTA EXCLUSIVA
# ==========================================
# Restringe o acesso apenas à pasta "scaner diogo" na Área de Trabalho (Desktop)

DESKTOP = Path.home() / "Desktop"
if not DESKTOP.exists():
    DESKTOP = Path.home() / "Área de Trabalho"

PASTA_SCANER = DESKTOP / "scaner diogo"

# Garante que a pasta "scaner diogo" exista na Área de Trabalho
PASTA_SCANER.mkdir(parents=True, exist_ok=True)

print()
print("======================================")
print(" LEITOR E ORGANIZADOR DE FOLHAS DE PONTO")
print("======================================")
print(f"Pasta de trabalho: {PASTA_SCANER}")
print()

# ==========================================
# PROCURAR IMAGENS APENAS NA RAÍZ DA PASTA SCANER DIOGO
# ==========================================

extensoes_validas = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

# Pega apenas arquivos diretamente na pasta (ignora subpastas já criadas)
imagens = [
    f for f in PASTA_SCANER.iterdir()
    if f.is_file() and f.suffix.lower() in extensoes_validas
]

if not imagens:
    print("ERRO: Nenhuma imagem encontrada para processar.")
    print(f"Coloque as imagens diretamente dentro da pasta:\n{PASTA_SCANER}")
    print()
    input("Pressione ENTER para fechar...")
    exit()

print(f"Encontrado(s) {len(imagens)} arquivo(s) para processar.\n")

# ==========================================
# INSTRUÇÕES PARA A IA
# ==========================================

prompt = """
Você está analisando uma imagem de uma folha de ponto de um funcionário.

Sua tarefa é identificar o NOME COMPLETO do funcionário.

Procure cuidadosamente na imagem por campos como:
- Nome
- Funcionário
- Colaborador
- Empregado
- Nome do funcionário

Leia o documento inteiro com atenção.
NÃO INVENTE um nome.

Se conseguir identificar o nome com segurança, responda exatamente:
FUNCIONARIO: NOME COMPLETO

Se não conseguir identificar com segurança, responda exatamente:
FUNCIONARIO: NAO_IDENTIFICADO

Não forneça explicações.
Não forneça outros dados.
Retorne somente uma dessas duas respostas.
"""


def limpar_nome_pasta(nome: str) -> str:
    """Remove caracteres inválidos para nomes de pasta no Windows."""
    nome_limpo = re.sub(r'[\\/*?:"<>|]', "", nome).strip()
    nome_limpo = nome_limpo.rstrip(".")
    return nome_limpo if nome_limpo else "NAO_IDENTIFICADO"


def mover_arquivo(origem: Path, pasta_destino: Path) -> Path:
    """Cria a pasta de destino se não existir e move o arquivo sem sobrescrever."""
    pasta_destino.mkdir(parents=True, exist_ok=True)
    destino = pasta_destino / origem.name

    # Se já existir um arquivo com o mesmo nome, adiciona contador
    contador = 1
    stem = origem.stem
    sufixo = origem.suffix
    while destino.exists():
        destino = pasta_destino / f"{stem}_{contador}{sufixo}"
        contador += 1

    shutil.move(str(origem), str(destino))
    return destino


# ==========================================
# PROCESSAMENTO DE CADA IMAGEM
# ==========================================

sucessos = 0
erros = 0

for idx, imagem in enumerate(imagens, start=1):
    print(f"[{idx}/{len(imagens)}] Processando: {imagem.name}...")

    try:
        resposta = ollama.chat(
            model="qwen3-vl:4b",
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                    "images": [str(imagem)],
                }
            ],
        )

        conteudo = resposta["message"]["content"].strip()
        print(f"  Resposta IA: {conteudo}")

        # Extrair nome do funcionário
        nome_funcionario = "NAO_IDENTIFICADO"
        for linha in conteudo.splitlines():
            if "FUNCIONARIO:" in linha.upper():
                partes = linha.split(":", 1)
                if len(partes) > 1:
                    nome_extraido = partes[1].strip()
                    if nome_extraido and nome_extraido.upper() != "NAO_IDENTIFICADO":
                        nome_funcionario = limpar_nome_pasta(nome_extraido)
                break

        # Define pasta de destino estritamente DENTRO da pasta "scaner diogo"
        pasta_destino = PASTA_SCANER / nome_funcionario
        destino_final = mover_arquivo(imagem, pasta_destino)

        print(f"  -> Movido para: {destino_final.relative_to(PASTA_SCANER)}")
        sucessos += 1

    except Exception as e:
        print(f"  ERRO ao processar {imagem.name}: {e}")
        erros += 1

print()
print("======================================")
print("             CONCLUÍDO")
print("======================================")
print(f"Total de imagens organizadas: {sucessos}")
if erros > 0:
    print(f"Erros de processamento: {erros}")
print(f"Todas as pastas e arquivos foram mantidos dentro de:\n{PASTA_SCANER}")
print("======================================")
print()

input("Pressione ENTER para fechar...")
