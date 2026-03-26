import { prisma } from '../lib/prisma';
import { generateLinkedIn } from '../skills/linkedinSkill';
import { generateX } from '../skills/xSkill';
import { generateTikTok } from '../skills/tiktokSkill';
import { generateBlog } from '../skills/blogSkill';
import { generateImage, buildImagePrompt } from '../lib/nanoBanana';

export async function runContentAgent(instanceId: string, weekNumber: number, year: number) {
  console.log(`[ContentAgent] Generating content for instance ${instanceId}, week ${weekNumber}/${year}`);

  // Get full KB (brand voice / profile base)
  const brandVoice = await prisma.brandVoice.findUnique({ where: { instanceId } });
  const corpus = await prisma.weeklyCorpus.findUnique({
    where: { instanceId_weekNumber_year: { instanceId, weekNumber, year } },
  });

  if (!brandVoice || !corpus) {
    console.log('[ContentAgent] Missing KB or corpus, skipping');
    return [];
  }

  // Get active memory (last N periods)
  const instance = await prisma.instance.findUnique({ where: { id: instanceId } });
  const activeWindow = (instance as any)?.activeWindow ?? 8;
  const recentCorpuses = await prisma.weeklyCorpus.findMany({
    where: { instanceId },
    orderBy: { createdAt: 'desc' },
    take: activeWindow,
  });

  const brandVoiceData = {
    identity: brandVoice.identity,
    valueProposition: brandVoice.valueProposition,
    audience: brandVoice.audience,
    voiceTone: brandVoice.voiceTone,
    recurringTopics: brandVoice.recurringTopics,
    positioning: brandVoice.positioning,
    topics: (brandVoice as any).topics || [],
    contacts: (brandVoice as any).contacts || [],
    narratives: (brandVoice as any).narratives || [],
  };

  const corpusData = {
    current: {
      summary: corpus.summary,
      topics: corpus.topics,
      decisions: corpus.decisions,
      concerns: corpus.concerns,
      opportunities: corpus.opportunities,
    },
    activeMemory: recentCorpuses.map((c) => ({
      period: c.weekNumber,
      year: c.year,
      summary: c.summary,
      topics: c.topics,
    })),
  };

  const contentOutputs: any[] = [];

  // Run all 4 skills in parallel
  const [linkedIn, x, tiktok, blog] = await Promise.all([
    generateLinkedIn(brandVoiceData, corpusData).catch((e) => {
      console.error('[ContentAgent] LinkedIn skill failed:', e.message);
      return null;
    }),
    generateX(brandVoiceData, corpusData).catch((e) => {
      console.error('[ContentAgent] X skill failed:', e.message);
      return null;
    }),
    generateTikTok(brandVoiceData, corpusData).catch((e) => {
      console.error('[ContentAgent] TikTok skill failed:', e.message);
      return null;
    }),
    generateBlog(brandVoiceData, corpusData).catch((e) => {
      console.error('[ContentAgent] Blog skill failed:', e.message);
      return null;
    }),
  ]);

  // Process LinkedIn posts
  if (linkedIn?.posts) {
    for (const post of linkedIn.posts) {
      for (const variant of ['A', 'B', 'C'] as const) {
        const v = post.variants[variant];
        if (!v) continue;

        let imageUrl: string | null = null;
        try {
          const img = await generateImage(post.imagePrompt);
          imageUrl = `data:${img.mimeType};base64,${img.base64}`;
        } catch (e: any) {
          console.error('[ContentAgent] Image generation failed for LinkedIn:', e.message);
        }

        const output = await prisma.contentOutput.create({
          data: {
            instanceId, weekNumber, year,
            platform: 'LINKEDIN',
            type: 'POST',
            title: post.title,
            content: v.content,
            imageUrl,
            imagePrompt: post.imagePrompt,
            variant,
            status: 'DRAFT',
          },
        });
        contentOutputs.push(output);
      }
    }
    console.log(`[ContentAgent] Created ${linkedIn.posts.length * 3} LinkedIn variants`);
  }

  // Process X tweets
  if (x?.tweets) {
    for (const tweet of x.tweets) {
      const output = await prisma.contentOutput.create({
        data: {
          instanceId, weekNumber, year,
          platform: 'X',
          type: 'POST',
          title: tweet.title,
          content: tweet.content,
          variant: 'A',
          status: 'DRAFT',
        },
      });
      contentOutputs.push(output);
    }
  }
  if (x?.thread) {
    let imageUrl: string | null = null;
    try {
      const img = await generateImage(x.thread.imagePrompt);
      imageUrl = `data:${img.mimeType};base64,${img.base64}`;
    } catch (e: any) {
      console.error('[ContentAgent] Image generation failed for X thread:', e.message);
    }

    const output = await prisma.contentOutput.create({
      data: {
        instanceId, weekNumber, year,
        platform: 'X',
        type: 'THREAD',
        title: x.thread.title,
        content: x.thread.tweets.join('\n\n'),
        imageUrl,
        imagePrompt: x.thread.imagePrompt,
        variant: 'A',
        status: 'DRAFT',
      },
    });
    contentOutputs.push(output);
    console.log(`[ContentAgent] Created ${(x.tweets?.length ?? 0) + 1} X outputs`);
  }

  // Process TikTok scripts
  if (tiktok?.scripts) {
    for (const script of tiktok.scripts) {
      const output = await prisma.contentOutput.create({
        data: {
          instanceId, weekNumber, year,
          platform: 'TIKTOK',
          type: 'SCRIPT',
          title: script.title,
          content: script.script,
          imagePrompt: script.imagePrompt,
          variant: 'A',
          status: 'DRAFT',
        },
      });
      contentOutputs.push(output);
    }
    console.log(`[ContentAgent] Created ${tiktok.scripts.length} TikTok scripts`);
  }

  // Process Blog article
  if (blog?.article) {
    let imageUrl: string | null = null;
    try {
      const img = await generateImage(blog.article.imagePrompt);
      imageUrl = `data:${img.mimeType};base64,${img.base64}`;
    } catch (e: any) {
      console.error('[ContentAgent] Image generation failed for blog:', e.message);
    }

    const fullContent = blog.article.sections
      .map((s) => s.heading ? `## ${s.heading}\n\n${s.content}` : s.content)
      .join('\n\n');

    const output = await prisma.contentOutput.create({
      data: {
        instanceId, weekNumber, year,
        platform: 'BLOG',
        type: 'ARTICLE',
        title: blog.article.title,
        content: fullContent,
        imageUrl,
        imagePrompt: blog.article.imagePrompt,
        variant: 'A',
        status: 'DRAFT',
      },
    });
    contentOutputs.push(output);
    console.log('[ContentAgent] Created 1 blog article');
  }

  console.log(`[ContentAgent] Total content created: ${contentOutputs.length} pieces`);
  return contentOutputs;
}
