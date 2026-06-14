import { Pinecone } from '@pinecone-database/pinecone'
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
const namespace = pc.index(process.env.PINECONE_INDEX_NAME, process.env.PINECONE_HOST).namespace("__default__");
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

// export async function querySimilar(vector) {
//   const queryResponse = await namespace.query({
//     vector: vector,
//     topK: 3,
//     includeValues: false,
//     includeMetadata: true,
//   });
//   return queryResponse;
// }

export const querySimilar = async (vector, currentHighlightId,userId) => {

  const result = await namespace.query({
    vector,
    topK: 10,              // fetch 4 so after removing self we still have 3
    includeMetadata: true,
  })

  // filter out self-match and weak results
  const filtered = result.matches
    .filter(item =>
      item.id !== currentHighlightId &&
      item.metadata.userId === userId // not the same highlight 
    )

  return filtered
}