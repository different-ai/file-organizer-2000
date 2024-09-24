import BM25TextSearch from "wink-bm25-text-search";

class BM25Singleton {
    private static instance: BM25TextSearch | null = null;

    /**
     * Returns a singleton instance of BM25TextSearch.
     * Initializes the index if not already initialized.
     * @param folders Array of folder names
     * @returns BM25TextSearch instance
     */
    static getInstance(folders: string[]): BM25TextSearch {
        if (!BM25Singleton.instance) {
            BM25Singleton.instance = BM25TextSearch({
                fieldsToIndex: ['folder'],
            });
            folders.forEach(folder => {
                BM25Singleton.instance!.addDoc({ folder }, folder);
            });
            BM25Singleton.instance.finalize();
        }
        return BM25Singleton.instance;
    }

    /**
     * Resets the BM25 index.
     * Call this method if the folder list changes.
     * @param folders New array of folder names
     */
    static resetInstance(folders: string[]) {
        BM25Singleton.instance = BM25TextSearch({
            fieldsToIndex: ['folder'],
        });
        folders.forEach(folder => {
            BM25Singleton.instance!.addDoc({ folder }, folder);
        });
        BM25Singleton.instance.finalize();
    }
}

export default BM25Singleton;