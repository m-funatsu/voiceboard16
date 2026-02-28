import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generateEmbedding } from '@/lib/ai/embeddings';
import { clusterFeedback, computePriorityScore } from '@/lib/ai/clustering';
import { generateClusterLabel, generateClusterSummary } from '@/lib/ai/summary';

export async function POST(req: NextRequest) {
  // Verify auth
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify premium
  const { data: profile } = await supabaseAdmin
    .from('voiceboard_profiles')
    .select('plan, is_premium')
    .eq('id', user.id)
    .single();

  if (!profile?.is_premium) {
    return NextResponse.json({ error: 'Pro plan required' }, { status: 403 });
  }

  try {
    const { projectId } = await req.json();
    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    // Fetch all feedback for this project
    const { data: feedbackItems, error } = await supabaseAdmin
      .from('voiceboard_feedback')
      .select('id, title, description, vote_count, created_at, embedding')
      .eq('project_id', projectId)
      .eq('is_approved', true)
      .eq('is_archived', false);

    if (error) throw error;
    if (!feedbackItems || feedbackItems.length === 0) {
      return NextResponse.json({ clusters: [], summary: '' });
    }

    // Generate embeddings for items that don't have them
    const itemsWithEmbeddings = await Promise.all(
      feedbackItems.map(async (item) => {
        let embedding = item.embedding;
        if (!embedding) {
          const text = `${item.title} ${item.description}`;
          embedding = await generateEmbedding(text);
          // Store embedding back
          await supabaseAdmin
            .from('voiceboard_feedback')
            .update({ embedding })
            .eq('id', item.id);
        }
        return {
          id: item.id,
          title: item.title,
          description: item.description,
          voteCount: item.vote_count,
          createdAt: item.created_at,
          embedding: embedding as number[],
        };
      })
    );

    // Cluster feedback
    const clusters = clusterFeedback(itemsWithEmbeddings);

    // Delete old clusters for this project
    await supabaseAdmin
      .from('voiceboard_feedback')
      .update({ cluster_id: null })
      .eq('project_id', projectId);
    await supabaseAdmin
      .from('voiceboard_clusters')
      .delete()
      .eq('project_id', projectId);

    // Create new clusters with AI labels
    const savedClusters = [];
    for (const cluster of clusters) {
      if (cluster.items.length < 2) continue; // Skip single-item clusters

      const [label, summary] = await Promise.all([
        generateClusterLabel({ items: cluster.items }),
        generateClusterSummary({ items: cluster.items }),
      ]);

      const combinedVoteCount = cluster.items.reduce((sum, item) => sum + item.voteCount, 0);
      const priorityScore = computePriorityScore(
        combinedVoteCount,
        cluster.items[0].createdAt,
        cluster.items.length
      );

      const { data: savedCluster, error: clusterError } = await supabaseAdmin
        .from('voiceboard_clusters')
        .insert({
          project_id: projectId,
          label,
          summary,
          combined_vote_count: combinedVoteCount,
          feedback_count: cluster.items.length,
          priority_score: priorityScore,
        })
        .select()
        .single();

      if (clusterError) throw clusterError;

      // Update feedback items with cluster_id and priority_score
      for (const item of cluster.items) {
        const itemPriority = computePriorityScore(item.voteCount, item.createdAt, cluster.items.length);
        await supabaseAdmin
          .from('voiceboard_feedback')
          .update({ cluster_id: savedCluster.id, priority_score: itemPriority })
          .eq('id', item.id);
      }

      savedClusters.push({ ...savedCluster, items: cluster.items.map(({ embedding, ...rest }) => rest) });
    }

    // Update priority scores for unclustered items
    const unclusteredIds = itemsWithEmbeddings
      .filter((item) => !clusters.some((c) => c.items.length >= 2 && c.items.some((ci) => ci.id === item.id)))
      .map((item) => item.id);

    for (const id of unclusteredIds) {
      const item = itemsWithEmbeddings.find((i) => i.id === id)!;
      const score = computePriorityScore(item.voteCount, item.createdAt, 1);
      await supabaseAdmin
        .from('voiceboard_feedback')
        .update({ priority_score: score })
        .eq('id', id);
    }

    return NextResponse.json({
      clusters: savedClusters,
      totalAnalyzed: feedbackItems.length,
      clusteredCount: savedClusters.reduce((sum, c) => sum + c.feedback_count, 0),
    });
  } catch (err) {
    console.error('AI analysis error:', err);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
