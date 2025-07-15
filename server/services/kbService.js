const { Document } = require("langchain/document");
const { MemoryVectorStore } = require("@langchain/community/vectorstores/memory");
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const fs = require('fs').promises;
const path = require('path');

const KB_DIRECTORY = path.join(__dirname, '..', 'knowledge_base');
let vectorStore = null; // Будем хранить нашу векторную базу в памяти

// Функция для загрузки и инициализации Базы Знаний
const initializeKB = async () => {
    console.log("Initializing Knowledge Base...");
    try {
        const documents = [];
        const files = await fs.readdir(KB_DIRECTORY);

        for (const file of files) {
            const filePath = path.join(KB_DIRECTORY, file);
            const content = await fs.readFile(filePath, 'utf-8');
            // Создаем документ в формате, понятном LangChain
            documents.push(new Document({ pageContent: content, metadata: { source: file } }));
        }

        // Создаем модель для эмбеддингов
        const embeddings = new GoogleGenerativeAIEmbeddings({ apiKey: process.env.VITE_GEMINI_API_KEY });
        
        // Создаем векторное хранилище из документов
        vectorStore = await MemoryVectorStore.fromDocuments(documents, embeddings);
        
        console.log("Knowledge Base initialized successfully. Loaded documents:", files.length);

    } catch (error) {
        console.error("Failed to initialize Knowledge Base:", error);
    }
};

// Функция для поиска по Базе Знаний
const queryKB = async (question, count = 4) => {
    if (!vectorStore) {
        throw new Error("Knowledge Base is not initialized.");
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