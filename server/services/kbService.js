const { Document } = require("@langchain/core/documents");
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const { DirectoryLoader } = require("langchain/document_loaders/fs/directory");
const { TextLoader } = require("langchain/document_loaders/fs/text");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const path = require('path');

const KB_DIRECTORY = path.join(__dirname, '..', 'knowledge_base');
let vectorStore = null; // Будем хранить нашу векторную базу в памяти

// Функция для загрузки и инициализации Базы Знаний
const initializeKB = async () => {
    console.log("Initializing Knowledge Base from:", KB_DIRECTORY);
    try {
        // 2. Настраиваем DirectoryLoader
        const loader = new DirectoryLoader(
            KB_DIRECTORY,
            {
                // Для каждого типа файла указываем, какой загрузчик использовать
                '.js': (path) => new TextLoader(path),
                '.jsx': (path) => new TextLoader(path),
                '.ts': (path) => new TextLoader(path),
                '.tsx': (path) => new TextLoader(path),
                '.md': (path) => new TextLoader(path),
                '.txt': (path) => new TextLoader(path),
            },
            true, // Рекурсивно обходить все подпапки
            'ignore' // Режим обработки ошибок - игнорировать файлы, которые не удалось загрузить
        );

        const docs = await loader.load();
        
        if (docs.length === 0) {
            console.log("No documents found in knowledge base. Skipping initialization.");
            return;
        }
        
        console.log(`Loaded ${docs.length} documents. Splitting text...`);

        // Разбиваем большие документы на маленькие чанки (кусочки)
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000, // Размер одного чанка в символах
            chunkOverlap: 200, // Сколько символов из предыдущего чанка будет в начале следующего
        });

        const splitDocs = await textSplitter.splitDocuments(docs);

        console.log(`Split into ${splitDocs.length} chunks. Creating vector store...`);

        const embeddings = new GoogleGenerativeAIEmbeddings({ apiKey: process.env.GEMINI_KB_API_KEY });
        
        vectorStore = await MemoryVectorStore.fromDocuments(splitDocs, embeddings);
        
        console.log("Knowledge Base initialized successfully.");

    } catch (error) {
        console.error("Failed to initialize Knowledge Base:", error);
    }
};

// Функция для поиска по Базе Знаний
const queryKB = async (question, count = 4) => {
    if (!vectorStore) {
        // Если БЗ не инициализирована (например, из-за ошибки или отсутствия файлов),
        // возвращаем пустой массив, чтобы приложение не падало.
        console.warn("Knowledge Base is not initialized. Returning empty results.");
        return [];
    }
    console.log(`Querying KB for: "${question}"`);
    // Ищем N самых релевантных документов
    const results = await vectorStore.similaritySearch(question, count);
    return results;
};


module.exports = {
    initializeKB,
    queryKB,
};