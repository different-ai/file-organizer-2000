import { NextRequest, NextResponse } from "next/server";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { openai } from "@ai-sdk/openai";
import { cosineSimilarity, embed, embedMany } from "ai";

export async function POST(request: NextRequest) {
    console.log("folders/embeddings");
    try {
        // Authorize the user
        const { userId } = await handleAuthorization(request);

        // Parse the request body
        const { content,  folders } = await request.json();
        console.log("content", content);
        console.log("folders", folders);

        // Sanitize the file name

        // Generate embedding for the input content and file name
        const inputText = `${content}`;
        const { embedding: inputEmbedding } = await embed({
            model: openai.embedding("text-embedding-3-large"),
            value: inputText,
        });

        // Generate embeddings for all folder names
        const { embeddings: folderEmbeddings, usage } = await embedMany({
            model: openai.embedding("text-embedding-3-large"),
            values: folders,
        });

        // Compute similarity scores between input and each folder
        const similarityScores = folderEmbeddings.map(folderEmbedding => 
            cosineSimilarity(inputEmbedding, folderEmbedding)
        );

        // Pair folders with their similarity scores
        const foldersWithScores = folders.map((folder, index) => ({
            folder,
            score: similarityScores[index],
        }));

        // Sort folders by similarity score in descending order and select top 2
        const topFolders = foldersWithScores
            .sort((a, b) => b.score - a.score)
            .slice(0, 2)
            .map(item => item.folder);

        // Calculate token usage
        const tokens = usage.tokens;
        console.log("Incrementing token usage folders/embeddings", userId, tokens);

        console.log("Incrementing token usage folders/existing", userId, tokens);
        await incrementAndLogTokenUsage(userId, tokens);
        console.log("topFolders", topFolders);

        // Return the top suggested folders
        return NextResponse.json({
            folders: topFolders,
        });
    } catch (error: any) {
        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: error.status || 500 }
            );
        }
    }
}