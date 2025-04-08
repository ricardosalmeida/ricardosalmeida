FROM mcr.microsoft.com/playwright:v1.42.1-jammy

# Cria diretório de trabalho dentro do container
WORKDIR /app

# Copia seus arquivos para dentro do container
COPY . .

# Instala as dependências
RUN npm install

# Comando padrão ao rodar o container
CMD ["node", "tarefa.js"]
