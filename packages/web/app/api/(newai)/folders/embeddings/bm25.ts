import BM25TextSearch from "wink-bm25-text-search";
import winkNLP from "wink-nlp";
import model from "wink-eng-lite-web-model";

const getBm25Instance = (() => {
    let instance: BM25TextSearch | null = null;
    let currentFolders: string[] = [];

    // Initialize winkNLP
    const nlp = winkNLP(model);
    const its = nlp.its;

    // Define the preparation task for tokenization
    const prepTask = (text: string): string[] => {
        const tokens: string[] = [];
        nlp.readDoc(text)
            .tokens()
            .filter((t) => t.out(its.type) === "word" && !t.out(its.stopWordFlag))
            .each((t) =>
                tokens.push(
                    t.out(its.negationFlag) ? `!${t.out(its.stem)}` : t.out(its.stem)
                )
            );
        return tokens;
    };

    return (folders: string[]): BM25TextSearch => {
        const foldersChanged =
            !instance ||
            currentFolders.length !== folders.length ||
            !currentFolders.every((folder, idx) => folder === folders[idx]);

        if (foldersChanged) {
            instance = new BM25TextSearch();

            // Define configuration with field weights
            instance.defineConfig({
                fldWeights: { folder: 1 },
                bm25Params: { k1: 1.5, b: 0.75 },
            });

            // Define preparation tasks
            instance.definePrepTasks([prepTask]);

            // Add documents to the BM25 index
            folders.forEach((folder, idx) =>
                instance.addDoc({ folder }, idx)
            );

            // Consolidate the index
            instance.consolidate();

            // Update the current folders
            currentFolders = [...folders];
        }

        return instance;
    };
})();

export default getBm25Instance;