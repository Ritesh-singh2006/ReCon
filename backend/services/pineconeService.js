import { Pinecone } from '@pinecone-database/pinecone'
const pc = new Pinecone({ apiKey: "pcsk_5eFGSo_JPvgJ5wTCxko5thHZeZ1RGNLLvAJThxtKLcWt8GRtE6dG2v8rCKPPravaCDt2zT" })
const namespace = pc.index("recon", "").namespace("__default__");

// const generateDummyVector = () => Array.from({ length: 384 }, () => Math.random());
export async function storeEmbedding(highlightId, vector, metadata) {
  await namespace.upsert({
    records: [
      {
        id: highlightId,
        values: vector,
        metadata: metadata
      }
    ]
  });
}

export async function querySimilar(vector) {
  const queryResponse = await namespace.query({
    vector: vector,
    topK: 3,
    includeValues: false,
    includeMetadata: true,
  });
  return queryResponse;
}