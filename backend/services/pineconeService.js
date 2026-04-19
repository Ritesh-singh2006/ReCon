import { Pinecone } from '@pinecone-database/pinecone'
const pc = new Pinecone({ apiKey: "" })
const namespace = pc.index("recon", "https://recon-v7wjxf6.svc.aped-4627-b74a.pinecone.io").namespace("__default__");

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