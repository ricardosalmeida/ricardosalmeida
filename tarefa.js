

const puppeteer = require('puppeteer');
 


const axios = require('axios');

async function obterDados() {
    try {
        const resposta = await axios.get('https://peisemiramis.com/professor/controller/json.php');
         return resposta.data.ra;
    } catch (erro) {
        console.error("Erro ao obter os dados:", erro);
        process.stdout.write(`Erro ao obter os dados\n`); // Garante que sai imediatamente
    }
}




function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

 




async function runProcess(maxRetries = 3) {
  let tentativas = 0;
   while (tentativas < maxRetries) {
    try {
 
      process.stdout.write(`Iniciando processo - tentativa ${tentativas + 1}`);
      const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });


  // Define o tamanho da janela para evitar problemas de responsividade
   
  ra = await obterDados();
 
if(ra != null){

 
  let ra_al = ra;
  // Navega até a URL desejada e aguarda o carregamento completo
  await page.goto('https://saladofuturo.educacao.sp.gov.br', { waitUntil: 'networkidle0' });

  // Aguardar um seletor estável para garantir que a página foi carregada corretamente
  await page.waitForSelector('body', { visible: true });


  const seletorBotao = 'button.MuiButtonBase-root.MuiIconButton-root';

  try {
    // Aguarda o botão estar presente e visível na página
    await page.waitForSelector(seletorBotao, { visible: true,timeout: 5000});

    // Clica no botão
    await page.click(seletorBotao);
 
  } catch (erro) {
    console.error('Erro ao tentar clicar no botão:', erro);
  }



  
  await page.type('#input-usuario-sed', ra_al);
  await page.type('#input-senha', '@Escola123');
  await page.click('#botao-login');

  await page.waitForSelector('body', { visible: true });







  const seletorElemento = '[data-testid="TarefaSPIcon"]';

  try {
    // Aguarda o elemento estar presente e visível na página
    await page.waitForSelector(seletorElemento, { visible: true });
    
    // Simula o clique no elemento
    await page.click(seletorElemento);
 
    
    // Aguarda um tempo para visualizar o resultado (opcional)
    contt = true;
  } catch (erro) {
    console.error('Erro ao tentar clicar no elemento:', erro);
    contt = false;
  }
 
if(contt === true){
  await page.waitForSelector('body', { visible: true });

  await sleep(2000);
  await page.reload({ waitUntil: 'networkidle0' });

  await page.waitForSelector('body', { visible: true });

  await sleep(1000);




  



await page.waitForSelector('[data-testid^="tarefa-"]');

const tarefas = await page.evaluate(() => {
    const elementosTarefa = document.querySelectorAll('[data-testid^="tarefa-"]');

    return Array.from(elementosTarefa).map(tarefa => {
        return {
            disciplina: tarefa.querySelector('p.css-9kams2')?.textContent.trim() || null,
            status: tarefa.querySelector('[data-testid="status-cartao-tarefa"]')?.textContent.trim() || null,
            titulo: tarefa.querySelector('[data-testid="cartao-tarefa-titulo"]')?.textContent.trim() || null,
            
        };
    });
});

 
 
  await page.waitForSelector('[data-testid="filtro-Status"]'); // Aguarda o elemento
  await page.click('[data-testid="filtro-Status"]'); // Clica no elemento


  await page.waitForSelector('li[role="option"]'); // Aguarda a lista abrir

const options = await page.$$('li[role="option"]'); // Captura todos os itens da lista

if (options.length > 1) {
    await options[1].click(); // Clica no segundo item (índice 1)
}


await page.waitForSelector('body', { visible: true });

await sleep(1000);



await page.waitForSelector('[data-testid^="tarefa-"]');

const tarefasComClique = await page.evaluate(async () => {
    const elementos = document.querySelectorAll('[data-testid^="tarefa-"]');
    let resultados = [];

    for (const elemento of elementos) {
        elemento.click(); // Simula o clique no cartão da tarefa
        await new Promise(resolve => setTimeout(resolve, 500)); // Espera o conteúdo carregar

        // Pegamos os valores após o clique
        const disciplina = elemento.querySelector('p.css-9kams2')?.textContent?.trim() ?? '';
        const status = elemento.querySelector('[data-testid="status-cartao-tarefa"]')?.textContent?.trim() ?? '';
        const titulo = elemento.querySelector('[data-testid="cartao-tarefa-titulo"]')?.textContent?.trim().replace(/[:'"]/g, '') ?? '';        const nota = elemento.querySelector('.css-1t15dlq b')?.textContent?.trim() ?? '';
        const duracao = elemento.querySelectorAll('.css-1t15dlq b')?.[1]?.textContent?.trim() ?? '';
        const entregueEm = elemento.querySelector('.css-1uyy2pc b')?.textContent?.trim() ?? '';
        const ultimaAtualizacao = elemento.querySelectorAll('.css-1t15dlq b')?.[2]?.textContent?.trim() ?? '';

        // Criamos uma string formatada para cada tarefa
        resultados.push(`{"Disciplina": "${disciplina}", "Status": "${status}", "Título": "${titulo}", "Nota": "${nota}", "Duração": "${duracao}", "Entregue em": "${entregueEm}", "Última atualização": "${ultimaAtualizacao}"},`);
    }

    // Retorna tudo como uma única string separada por quebras de linha
    return resultados.join('\n');
});

 

await sleep(1000);

const tar_f = JSON.stringify(tarefas); 
const tar_c =  "["+tarefasComClique+"]"; 




//enviar dados para o site
// console.log(tar_f,tar_c,ra_al);

  try {
      const resposta = await axios.post('https://peisemiramis.com/controller/tarefas.php', {
        ra_aluno:ra_al,
        tarefas_a_fazer:tar_f,
tarefas_realizadas:tar_c
      });

    
  } catch (erro) {
      console.error("Erro ao enviar dados:", erro);
  }


 




  await sleep(1000);




browser.close();
}else{
 


try {
  const resposta = await axios.post('https://peisemiramis.com/controller/tarefas.php', {
    ra_aluno:ra_al,
tarefas_a_fazer:"Ra_error",
tarefas_realizadas:"Ra_error"
  });

 
} catch (erro) {
  console.error("Erro ao enviar dados:", erro);
}

await sleep(5000);


 
  browser.close();
}



}else{

  break;
}



    } catch (erro) {
      console.error(`Erro na tentativa ${tentativas + 1}:`, erro);
      tentativas++;
      browser.close();
    }
  }
// Executa a função e captura erros finais, se houver

}
 

async function executeProcess() {
 
 while (true) {
 
    try {
      await runProcess().catch(erro => console.error('Processo finalizado com erro:', erro));
      // Verifique aqui a
    
    
    } catch (erro) {
      console.error('Processo finalizado com erro:', erro);

      try {
        const resposta = await axios.post('https://peisemiramis.com/controller/tarefas.php', {
          ra_aluno:ra_al,
      tarefas_a_fazer:"error",
      tarefas_realizadas:"error"
        });
      
      
      } catch (erro) {
        console.error("Erro ao enviar dados:", erro);
      }
      

 

    
    }
    // Opcional: Aguarde um intervalo antes de reexecutar   
   
    await new Promise(resolve => setTimeout(resolve, 2000));
 
 
  }
}
 
executeProcess();










