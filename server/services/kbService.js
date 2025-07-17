const { Document } = require("@langchain/core/documents");
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const { DirectoryLoader } = require("langchain/document_loaders/fs/directory");
const { TextLoader } = require("langchain/document_loaders/fs/text");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const path = require('path');
const { db } = require('../database.js');

// Глобальная переменная для хранения векторных баз.
// Ключ - ID Базы Знаний, значение - сам vectorStore.
const vectorStores = new Map();

// Функция для загрузки и инициализации ВСЕХ Баз Знаний при старте сервера
const initializeAllKBs = async () => {
    console.log("Initializing all Knowledge Bases from database...");
    const sql = `SELECT kb.id as kb_id, kb.name as kb_name, s.path FROM knowledge_bases kb JOIN kb_sources s ON kb.id = s.kb_id`;
    
    db.all(sql, [], async (err, rows) => {
        if (err) {
            console.error("Failed to fetch KB sources from database:", err.message);
            return;
        }

        // Группируем пути по ID базы знаний
        const kbPaths = rows.reduce((acc, row) => {
            if (!acc[row.kb_id]) {
                acc[row.kb_id] = { name: row.kb_name, paths: [] };
            }
            acc[row.kb_id].paths.push(row.path);
            return acc;
        }, {});

        // Асинхронно инициализируем каждую БЗ
        for (const kbId in kbPaths) {
            await createVectorStoreForKB(kbId, kbPaths[kbId].name, kbPaths[kbId].paths);
        }
    });
};

// Вспомогательная функция для создания Vector Store для ОДНОЙ Базы Знаний
const createVectorStoreForKB = async (kbId, kbName, paths) => {
    console.log(`[KB: ${kbName}] Starting initialization...`);
    try {
        let allDocs = [];
        for (const dirPath of paths) {
            const absolutePath = path.join(__dirname, '..', dirPath);
            console.log(`[KB: ${kbName}] Loading documents from: ${absolutePath}`);
            const loader = new DirectoryLoader(absolutePath, {
                '.js': (path) => new TextLoader(path),
                '.jsx': (path) => new TextLoader(path),
                '.ts': (path) => new TextLoader(path),
                '.tsx': (path) => new TextLoader(path),
                '.md': (path) => new TextLoader(path),
                '.txt': (path) => new TextLoader(path),
            }, true, 'ignore');
            const docs = await loader.load();
            allDocs.push(...docs);
        }

        if (allDocs.length === 0) {
            console.log(`[KB: ${kbName}] No documents found. Skipping.`);
            return;
        }

        const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
        const splitDocs = await textSplitter.splitDocuments(allDocs);
        
        const embeddings = new GoogleGenerativeAIEmbeddings({ apiKey: process.env.GEMINI_KB_API_KEY });
        const vectorStore = await MemoryVectorStore.fromDocuments(splitDocs, embeddings);
        
        // Сохраняем готовую векторную базу в нашу "память"
        vectorStores.set(parseInt(kbId, 10), vectorStore);
        console.log(`[KB: ${kbName}] Initialized successfully. ${allDocs.length} docs, ${splitDocs.length} chunks.`);

    } catch (error) {
        console.error(`[KB: ${kbName}] Failed to initialize:`, error);
    }
};

// Функция для поиска по КОНКРЕТНОЙ Базе Знаний
const queryKB = async (kbId, question, count = 4) => {
    const vectorStore = vectorStores.get(parseInt(kbId, 10));
    if (!vectorStore) {
        throw new Error(`Knowledge Base with ID ${kbId} is not initialized or does not exist.`);
    }
    console.log(`Querying KB #${kbId} for: "${question}"`);
    const results = await vectorStore.similaritySearch(question, count);
    return results;
};

// Экспортируем функцию инициализации и функцию запроса
module.exports = {
    initializeAllKBs,
    queryKB,
};