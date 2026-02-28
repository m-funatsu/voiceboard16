import { cosineSimilarity } from './embeddings';

interface FeedbackWithEmbedding {
  id: string;
  title: string;
  description: string;
  voteCount: number;
  createdAt: string;
  embedding: number[];
}

interface Cluster {
  items: FeedbackWithEmbedding[];
  centroid: number[];
}

const SIMILARITY_THRESHOLD = 0.85;

export function clusterFeedback(items: FeedbackWithEmbedding[]): Cluster[] {
  if (items.length === 0) return [];

  const clusters: Cluster[] = [];
  const assigned = new Set<string>();

  // Sort by vote count (process popular items first)
  const sorted = [...items].sort((a, b) => b.voteCount - a.voteCount);

  for (const item of sorted) {
    if (assigned.has(item.id)) continue;

    // Find the best matching existing cluster
    let bestClusterIdx = -1;
    let bestSimilarity = 0;

    for (let i = 0; i < clusters.length; i++) {
      const sim = cosineSimilarity(item.embedding, clusters[i].centroid);
      if (sim > SIMILARITY_THRESHOLD && sim > bestSimilarity) {
        bestSimilarity = sim;
        bestClusterIdx = i;
      }
    }

    if (bestClusterIdx >= 0) {
      // Add to existing cluster
      clusters[bestClusterIdx].items.push(item);
      // Update centroid (average of all embeddings)
      clusters[bestClusterIdx].centroid = computeCentroid(clusters[bestClusterIdx].items);
    } else {
      // Create new cluster
      clusters.push({
        items: [item],
        centroid: item.embedding,
      });
    }

    assigned.add(item.id);
  }

  return clusters;
}

function computeCentroid(items: FeedbackWithEmbedding[]): number[] {
  const dim = items[0].embedding.length;
  const centroid = new Array(dim).fill(0);

  for (const item of items) {
    for (let i = 0; i < dim; i++) {
      centroid[i] += item.embedding[i];
    }
  }

  for (let i = 0; i < dim; i++) {
    centroid[i] /= items.length;
  }

  return centroid;
}

export function computePriorityScore(voteCount: number, createdAt: string, clusterSize: number): number {
  const ageHours = (Date.now() - new Date(createdAt).getTime()) / 3600000;
  const recencyScore = 1.0 / (1.0 + ageHours / 168); // 1-week half-life
  return voteCount * 2.0 + recencyScore * 10.0 + clusterSize * 1.5;
}
