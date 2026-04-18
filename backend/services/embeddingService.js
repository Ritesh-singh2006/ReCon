import { HfInference } from "@huggingface/inference";
const hf = new HfInference("");

export async function convertToVector(highlightedText){
    const embedding = await hf.featureExtraction({
        model: "sentence-transformers/all-MiniLM-L6-v2",
        inputs: highlightedText
    });
    return embedding; // Returns an array of floats
}


