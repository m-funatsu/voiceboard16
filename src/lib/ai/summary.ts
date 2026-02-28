import OpenAI from 'openai';

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

interface ClusterForSummary {
  items: { title: string; description: string; voteCount: number }[];
}

export async function generateClusterLabel(cluster: ClusterForSummary): Promise<string> {
  const itemList = cluster.items
    .slice(0, 10)
    .map((item) => `- ${item.title}${item.description ? `: ${item.description.slice(0, 100)}` : ''}`)
    .join('\n');

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a product analyst. Generate a concise label (max 50 chars, in Japanese) that captures the common theme of these user feedback items.',
      },
      {
        role: 'user',
        content: `Feedback items:\n${itemList}\n\nGenerate a single concise label for this group.`,
      },
    ],
    max_tokens: 100,
    temperature: 0.3,
  });

  return response.choices[0]?.message?.content?.trim() || 'その他';
}

export async function generateClusterSummary(cluster: ClusterForSummary): Promise<string> {
  const itemList = cluster.items
    .slice(0, 15)
    .map((item) => `- [${item.voteCount} votes] ${item.title}${item.description ? `: ${item.description.slice(0, 150)}` : ''}`)
    .join('\n');

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a product analyst. Summarize the common request in these feedback items. Write in Japanese, 2-3 sentences max.',
      },
      {
        role: 'user',
        content: `Feedback items:\n${itemList}\n\nSummarize the core request.`,
      },
    ],
    max_tokens: 300,
    temperature: 0.3,
  });

  return response.choices[0]?.message?.content?.trim() || '';
}

export async function generateProjectThemeSummary(
  clusters: { label: string; summary: string | null; combinedVoteCount: number; feedbackCount: number }[]
): Promise<string> {
  const clusterList = clusters
    .slice(0, 20)
    .map((c) => `- "${c.label}" (${c.feedbackCount} items, ${c.combinedVoteCount} votes): ${c.summary || 'No summary'}`)
    .join('\n');

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a product analyst. Provide a high-level summary of user feedback themes and recommended priorities. Write in Japanese, structured with bullet points.',
      },
      {
        role: 'user',
        content: `Feedback clusters:\n${clusterList}\n\nProvide a thematic summary with top priorities.`,
      },
    ],
    max_tokens: 500,
    temperature: 0.3,
  });

  return response.choices[0]?.message?.content?.trim() || '';
}
