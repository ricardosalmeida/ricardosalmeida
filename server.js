const express = require('express');
const { spawn } = require('child_process');
const app = express();

let processo = null;
let logs = []; // Armazena os logs do processo
app.get('/', (req, res) => {
  res.send('Servidor rodando!');
});
// Rota para iniciar o processo
app.get('/executar', (req, res) => {
  if (processo) return res.status(400).send('Processo já está em execução!');

  processo = spawn('node', ['tarefa.js']);

  // Captura a saída do processo
  processo.stdout.on('data', (data) => {
    const log = data.toString().trim();
    logs.push(log); // Armazena o log
    console.log('Log:', log);
  });

  processo.stderr.on('data', (data) => {
    console.error('Erro:', data.toString());
  });

  processo.on('exit', () => {
    processo = null;
    logs = []; // Limpa logs ao finalizar
  });

  res.send('Processo iniciado!');
});

// Rota para obter logs
app.get('/logs', (req, res) => {
  res.json({ logs });
});

// Rota para parar o processo
app.get('/parar', (req, res) => {
  if (!processo) return res.status(400).send('Nenhum processo em execução!');
  processo.kill();
  res.send('Processo parado!');
});

app.listen(PORT, HOST, () => {
  console.log(`Servidor rodando em: http://${HOST}:${PORT}`);
});

