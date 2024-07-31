const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Configuração do multer para fazer o upload dos arquivos
const upload = multer({ dest: 'uploads/' });

// Configuração do Express
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Função principal para gerar a imagem do produto
async function generateProductImage(title, description, imagePath, price, outputFolderPath) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Template HTML atualizado
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-br">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title> Template Arte </title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="m-0 bg-white">

        <div class="flex flex-col justify-center items-center h-screen p-5 box-border">

            <div class="w-full px-8 max-w-screen-lg h-full max-h-screen-lg bg-white rounded-[30px] border border-gray-400 text-left flex flex-col">

                <div class="flex-1 flex flex-col py-10 items-center">
                    
                    <img src="${imagePath}" alt="${title}" class="w-3/4 h-auto max-h-[500px] mt-10 object-cover">

                    <h1 class="text-6xl capitalize font-semibold mt-32 m-5 leading-tight text-black text-center">
                        ${title}
                    </h1>
                    
                    <p class="text-[45px] text-gray-600 text-pretty leading-snug mt-10 mx-5 text-center">
                        ${description}
                    </p>
                    
                    <button class="bg-[#00a890] text-white font-semibold rounded-xl border-none py-7 w-full rounded text-5xl mt-auto">
                        ${price}
                    </button>
                </div>
            </div>

            <img src="./novazul.svg" class="w-80 my-10" alt="">

        </div>
    </body>
    </html>

    `;

    // Cria o arquivo HTML temporário com codificação UTF-8
    const tempHtmlPath = path.join(__dirname, 'temp.html');
    fs.writeFileSync(tempHtmlPath, htmlContent, 'utf8');

    // Verifica se a pasta de saída existe, se não, cria
    if (!fs.existsSync(outputFolderPath)) {
        fs.mkdirSync(outputFolderPath, { recursive: true });
    }

    // Define o caminho do arquivo de saída com o título do produto
    const outputFileName = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.png`; // Substitui caracteres não alfanuméricos por _
    const outputFilePath = path.join(outputFolderPath, outputFileName);

    // Abre o arquivo HTML no Puppeteer
    await page.goto(`file://${tempHtmlPath}`, { waitUntil: 'networkidle0' });

    // Define o tamanho da página (resolução 1080x1920)
    await page.setViewport({ width: 1080, height: 1920 });

    // Captura a imagem da página
    await page.screenshot({ path: outputFilePath, fullPage: true });

    await browser.close();

    // Remove o arquivo HTML temporário
    fs.unlinkSync(tempHtmlPath);

    return outputFilePath;
}

app.use(express.static(path.join(__dirname, 'public')));

// Rota para exibir o formulário e processar os dados
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="pt-br">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title> Formulário </title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>

    <body class="w-screen h-screen flex justify-center items-center">

        <div class="border p-10 rounded-lg">

            <div class="flex flex-col justify-center items-center pb-5">
                <img src="/novazul.svg" class="w-40 pb-1" alt="">
        
                <h1 class="font-semibold">
                    Gerador de Arte
                </h1>

                <p class="text-sm text-gray-400">
                    Versão 1.0
                </p>
            </div>

            <div class="">
                <form action="/generate" method="post" enctype="multipart/form-data">
                    
                    <div class="h-20">
                        <label class="text-sm font-medium" for="title">
                            Nome do Produto:
                        </label>
                        <input class="mt-1 px-3 py-1 bg-white border shadow-sm border-slate-300 placeholder-slate-400 focus:outline-none focus:border-[#00A890] focus:ring-[#00A890] block w-full rounded-md sm:text-sm focus:ring-1" type="text" id="title" name="title" required><br><br>
                    </div>
        
                    <div class="h-24">
                        <label class="text-sm font-medium" for="description">
                            Descrição do Produto:
                        </label>
                        <textarea class="mt-1 px-3 py-1 bg-white border shadow-sm border-slate-300 placeholder-slate-400 focus:outline-none focus:border-[#00A890] focus:ring-[#00A890] block w-full rounded-md sm:text-sm focus:ring-1" id="description" name="description" required></textarea><br><br>                
                    </div>

                    <div class="flex flex-col h-20">
                        <label class="text-sm font-medium pb-1" for="image">
                            Imagem:
                        </label>
                        <input class="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-gray-400 file:border-0 file:bg-transparent file:text-gray-600 file:text-sm file:font-medium" type="file" id="image" name="image" accept="image/*" required><br><br>
                    </div>
        
                    <div class="h-20">
                        <label class="text-sm font-medium" for="price">
                            Preço:
                        </label>
                        <input class="mt-1 px-3 py-1 bg-white border shadow-sm border-slate-300 placeholder-slate-400 focus:outline-none focus:border-[#00A890] focus:ring-[#00A890] block w-full rounded-md sm:text-sm focus:ring-1" type="text" id="price" name="price" required><br><br>
                    </div>

                    <div>
                        <button class="bg-[#00A890] w-full h-8 rounded-md text-white text-sm font-medium" type="submit">
                            Gerar Imagem
                        </button>
                    </div>
                </form>
            </div>

        </div>

    </body>

    </html>
    `);
});

app.post('/generate', upload.single('image'), async (req, res) => {
    const { title, description, price } = req.body;
    const imagePath = req.file.path; // Caminho do arquivo carregado
    const outputFolderPath = path.join(__dirname, 'artes');

    try {
        const outputFilePath = await generateProductImage(title, description, imagePath, price, outputFolderPath);
        res.send(`
        <!DOCTYPE html>
        <html lang="pt-br">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Tela de Sucesso!</title>
            <script src="https://cdn.tailwindcss.com"></script>
        </head>

        <body class="w-screen h-screen flex justify-center items-center border p-10 rounded-lg">

            <section class="p-10 flex rounded-lg border">
                <div class="flex flex-col justify-center pr-20">

                    <h1 class="font-semibold text-xl mb-5">
                        Imagem gerada <br> com sucesso!
                    </h1>
                    
                    <button class="bg-[#00A890] w-40 h-10 rounded-md font-semibold text-white">
                        <a href="/">Gerar outra arte</a>
                    </button>
                </div>
            
                <div class="w-full h-full flex justify-center items-center">
                    <img class="w-60" src="/${path.basename(outputFilePath)}" alt="${title}" style="max-width: 100%; height: auto;"/><br><br>
                </div>
            </section>
            
        </body>

        </html>

        `);
    } catch (error) {
        res.status(500).send('Erro ao gerar imagem.');
    }
});

// Servir os arquivos estáticos da pasta 'artes'
app.use(express.static(path.join(__dirname, 'artes')));

// Inicializa o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
