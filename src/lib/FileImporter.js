

async function loadNDPFile(path) {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        const text = await response.text();

        // Divide o texto em linhas e armazena em um array
        const lines = text.split('\n');
        return lines;
    } catch (error) {
        console.error('Houve um problema com a requisição fetch:', error);
        return [];
    }
}

/* 
function lerArquivo(event) {
    if (event.target.files.length > 0) {
        var selectedFile = event.target.files[0];
        var reader = new FileReader();
        reader.onload = function(e) {
            fileContent = e.target.result;
            console.log("File content:", fileContent);
            // Do something with the file content
        };
        reader.readAsText(selectedFile); // or readAsDataURL(selectedFile) for images, etc.
    }
};
 */

async function lerArquivo(event) {
    if (event.target.files.length > 0) {
        var selectedFile = event.target.files[0];
        try {
            var fileContent = await readFileContent(selectedFile);
            console.log("File content:", fileContent);
            // Agora você pode usar fileContent aqui
            // Você pode armazenar o conteúdo do arquivo em uma variável local ou manipulá-lo conforme necessário
        } catch (error) {
            console.error("Error reading file:", error);
        }
    }
}

function readFileContent(file) {
    return new Promise((resolve, reject) => {
        var reader = new FileReader();
        reader.onload = function(e) {
            resolve(e.target.result);
        };
        reader.onerror = function(e) {
            reject(e);
        };
        reader.readAsText(file);
    });
}


function extraiNumerosStrings(stringsArray) {
    // Array para armazenar os arrays de números extraídos
    const resultArray = [];

    // Iterar sobre cada string no array
    for (const str of stringsArray) {
        if (str.trim() === '') {
            // Ignorar strings vazias ou compostas apenas por espaços em branco
            continue;
        }

        // Usar expressão regular para encontrar todos os números na string
        const numbersInString = str.match(/\d+/g);
        
        if (numbersInString !== null) {
            // Converter os números encontrados em inteiros e adicionar ao array de resultado
            const numbersArray = numbersInString.map(Number);
            resultArray.push(numbersArray);
        } else {
            // Adicionar um array vazio se não houver números
            resultArray.push([]);
        }
    }

    return resultArray;
}

export { extraiNumerosStrings }
