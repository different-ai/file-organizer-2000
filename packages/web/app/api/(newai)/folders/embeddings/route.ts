import { NextRequest, NextResponse } from "next/server";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { openai } from "@ai-sdk/openai";
import { cosineSimilarity, embed, embedMany } from "ai";
import getBm25Instance from "./bm25";
import winkNLP from "wink-nlp";
import model from "wink-eng-lite-web-model";

// Initialize winkNLP
const nlp = winkNLP(model);
const its = nlp.its;

// Define constants for weighting
const KEYWORD_WEIGHT = 0.3;
const EMBEDDING_WEIGHT = 0.7;

/**
 * Function to compute BM25 scores for a query.
 * @param query The search query string
 * @param bm25 BM25TextSearch instance
 * @returns A Map of folder names to their BM25 scores
 */
function computeBM25Scores(query: string, bm25: any): Map<string, number> {
    const results = bm25.search(query);
    const scoreMap = new Map<string, number>();
    results.forEach((result: any) => {
        scoreMap.set(result.ref, result.score);
    });
    return scoreMap;
}

export async function POST(request: NextRequest) {
    console.log("folders/embeddings");
    try {
        // Authorize the user
        const { userId } = await handleAuthorization(request);

        // Parse the request body
        const { content, folders } = await request.json();
        console.log("content", content);
        console.log("folders", folders);

        // Preprocess content
        const preprocessedContent = preprocessText(content);
        const lemmatizedContent = preprocessedContent

        // Get BM25 instance (singleton)
        const bm25 = getBm25Instance(folders.map(preprocessText));

        // Compute BM25 scores based on input content
        const bm25ScoresMap = computeBM25Scores(lemmatizedContent, bm25);
        const bm25Scores = folders.map(folder => bm25ScoresMap.get(folder) || 0);

        // Generate embedding for the input content
        const { embedding: inputEmbedding } = await embed({
            model: openai.embedding("text-embedding-ada-002"),
            value: lemmatizedContent,
        });

        // Generate embeddings for all folder names
        const { embeddings: folderEmbeddings, usage } = await embedMany({
            model: openai.embedding("text-embedding-ada-002"),
            values: folders.map(preprocessText),
        });

        // Compute similarity scores between input and each folder
        const similarityScores = folderEmbeddings.map(folderEmbedding => 
            cosineSimilarity(inputEmbedding, folderEmbedding)
        );

        // Normalize BM25 scores
        const maxBM25 = Math.max(...bm25Scores, 1);
        const normalizedBM25 = bm25Scores.map(score => score / maxBM25);

        // Normalize embedding similarity scores
        const maxSimilarity = Math.max(...similarityScores, 1);
        const normalizedSimilarity = similarityScores.map(score => score / maxSimilarity);

        // Combine BM25 and embedding similarity scores into a hybrid score
        const hybridScores = normalizedSimilarity.map((sim, index) => 
            sim * EMBEDDING_WEIGHT + normalizedBM25[index] * KEYWORD_WEIGHT
        );

        // Pair folders with their hybrid scores
        const foldersWithScores = folders.map((folder, index) => ({
            folder,
            score: hybridScores[index],
        }));

        // Sort folders by hybrid score in descending order and select top 2
        const topFolders = foldersWithScores
            .sort((a, b) => b.score - a.score)
            .slice(0, 2)
            .map(item => item.folder);

        // Calculate token usage
        const tokens = usage.tokens;
        console.log("Incrementing token usage folders/embeddings", userId, tokens);

        await incrementAndLogTokenUsage(userId, tokens);
        console.log("topFolders", topFolders);

        // Return the top suggested folders
        return NextResponse.json({
            folders: topFolders,
        });
    } catch (error: any) {
        console.error("Error in folders/embeddings", error);
        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: error.status || 500 }
            );
        }
    }
}

function preprocessText(text: string): string {
    return text.toLowerCase().replace(/[^\w\s]/gi, '');
}
