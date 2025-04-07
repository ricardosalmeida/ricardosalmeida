const { chromium } = require('playwright');
const axios = require('axios');

async function obterDados() {
  try {
    const resposta = await axios.get('https://peisemiramis.com/professor/controller/json.php');
    return resposta.data.ra;
  } catch (erro) {
    console.error("Erro ao obter os dados:", erro);
    process.stdout.write("Erro ao obter os dados\n");
    return null;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runProcess(maxRetries = 3) {
  let tentativas = 0;
  while (tentativas < maxRetries) {
    let browser; // Declarado para ser acessível no catch
    try {
      process.stdout.write(`Iniciando processo - tentativa ${tentativas + 1}\n`);
      
      // Inicia o browser com Playwright
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      const page = await context.newPage();

      let ra = await obterDados();
      if (ra != null) {
        let ra_al = ra;
        // Navega até a URL desejada e aguarda o carregamento completo
        await page.goto('https://saladofuturo.educacao.sp.gov.br', { waitUntil: 'networkidle' });
        await page.waitForSelector('body', { state: 'visible' });

        const seletorBotao = 'button.MuiButtonBase-root.MuiIconButton-root';
        try {
          await page.waitForSelector(seletorBotao, { state: 'visible', timeout: 5000 });
          await page.click(seletorBotao);
        } catch (erro) {
          console.error('Erro ao tentar clicar no botão:', erro);
        }

        // Preenche os campos de login
        await page.fill('#input-usuario-sed', ra_al);
        await page.fill('#input-senha', '@Escola123');
        await page.click('#botao-login');
        await page.waitForSelector('body', { state: 'visible' });

        const seletorElemento = '[data-testid="TarefaSPIcon"]';
        let contt = false;
        try {
          await page.waitForSelector(seletorElemento, { state: 'visible' });
          await page.click(seletorElemento);
          contt = true;
        } catch (erro) {
          console.error('Erro ao tentar clicar no elemento:', erro);
          contt = false;
        }

        if (contt === true) {
          await page.waitForSelector('body', { state: 'visible' });
          await sleep(2000);
          await page.reload();
          await page.waitForLoadState('networkidle');
          await page.waitForSelector('body', { state: 'visible' });
          await sleep(1000);

          await page.waitForSelector('[data-testid^="tarefa-"]');
          const tarefas = await page.evaluate(() => {
            const elementosTarefa = document.querySelectorAll('[data-testid^="tarefa-"]');
            return Array.from(elementosTarefa).map(tarefa => ({
              disciplina: tarefa.querySelector('p.css-9kams2')?.textContent.trim() || null,
              status: tarefa.querySelector('[data-testid="status-cartao-tarefa"]')?.textContent.trim() || null,
              titulo: tarefa.querySelector('[data-testid="cartao-tarefa-titulo"]')?.textContent.trim() || null
            }));
          });

          await page.waitForSelector('[data-testid="filtro-Status"]');
          await page.click('[data-testid="filtro-Status"]');
          await page.waitForSelector('li[role="option"]');
          const options = await page.$$('li[role="option"]');
          if (options.length > 1) {
            await options[1].click();
          }

          await page.waitForSelector('body', { state: 'visible' });
          await sleep(1000);

          await page.waitForSelector('[data-testid^="tarefa-"]');
          const tarefasComClique = await page.evaluate(async () => {
            const elementos = document.querySelectorAll('[data-testid^="tarefa-"]');
            let resultados = [];
            for (const elemento of elementos) {
              elemento.click();
              await new Promise(resolve => setTimeout(resolve, 500));
              const disciplina = elemento.querySelector('p.css-9kams2')?.textContent?.trim() || '';
              const status = elemento.querySelector('[data-testid="status-cartao-tarefa"]')?.textContent?.trim() || '';
              const titulo = elemento.querySelector('[data-testid="cartao-tarefa-titulo"]')?.textContent?.trim().replace(/[:'"]/g, '') || '';
              const nota = elemento.querySelector('.css-1t15dlq b')?.textContent?.trim() || '';
              const duracao = elemento.querySelectorAll('.css-1t15dlq b')?.[1]?.textContent?.trim() || '';
              const entregueEm = elemento.querySelector('.css-1uyy2pc b')?.textContent?.trim() || '';
              const ultimaAtualizacao = elemento.querySelectorAll('.css-1t15dlq b')?.[2]?.textContent?.trim() || '';
              resultados.push(`{"Disciplina": "${disciplina}", "Status": "${status}", "Título": "${titulo}", "Nota": "${nota}", "Duração": "${duracao}", "Entregue em": "${entregueEm}", "Última atualização": "${ultimaAtualizacao}"},`);
            }
            return resultados.join('\\n');
          });

          await sleep(1000);

          const tar_f = JSON.stringify(tarefas);
          const tar_c = "[" + tarefasComClique + "]";
          try {
            await axios.post('https://peisemiramis.com/controller/tarefas.php', {
              ra_aluno: ra_al,
              tarefas_a_fazer: tar_f,
              tarefas_realizadas: tar_c
            });
          } catch (erro) {
            console.error("Erro ao enviar dados:", erro);
          }
          await sleep(1000);
          await browser.close();
        } else {
          try {
            await axios.post('https://peisemiramis.com/controller/tarefas.php', {
              ra_aluno: ra_al,
              tarefas_a_fazer: "Ra_error",
              tarefas_realizadas: "Ra_error"
            });
          } catch (erro) {
            console.error("Erro ao enviar dados:", erro);
          }
          await sleep(5000);
          await browser.close();
        }
      } else {
        break;
      }
    } catch (erro) {
      console.error(`Erro na tentativa ${tentativas + 1}:`, erro);
      tentativas++;
      if (browser) {
        await browser.close();
      }
    }
  }
}

async function executeProcess() {
  while (true) {
    try {
      await runProcess().catch(erro => console.error('Processo finalizado com erro:', erro));
    } catch (erro) {
      console.error('Processo finalizado com erro:', erro);
      try {
        await axios.post('https://peisemiramis.com/controller/tarefas.php', {
          ra_aluno: "error",
          tarefas_a_fazer: "error",
          tarefas_realizadas: "error"
        });
      } catch (erro) {
        console.error("Erro ao enviar dados:", erro);
      }
    }
    await sleep(2000);
  }
}

executeProcess();
