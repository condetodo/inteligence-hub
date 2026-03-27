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

  // Load platform configs for dynamic skill dispatch
  let platformConfigs = await prisma.instancePlatformConfig.findMany({
    where: { instanceId },
  });

  // Backward compatibility: if no configs exist, use defaults
  if (platformConfigs.length === 0) {
    platformConfigs = [
      { platform: 'LINKEDIN', enabled: true, postsPerPeriod: 3, threadsPerPeriod: null } as any,
      { platform: 'X', enabled: true, postsPerPeriod: 2, threadsPerPeriod: 1 } as any,
      { platform: 'TIKTOK', enabled: true, postsPerPeriod: 2, threadsPerPeriod: null } as any,
      { platform: 'BLOG', enabled: true, postsPerPeriod: 1, threadsPerPeriod: null } as any,
    ];
  }
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

  // Run enabled skills in parallel based on platform config
  const getConfig = (platform: string) =>
    platformConfigs.find((c) => c.platform === platform);

  const tasks: Promise<any>[] = [];
  const taskLabels: string[] = [];

  const linkedInConfig = getConfig('LINKEDIN');
  if (linkedInConfig?.enabled) {
    tasks.push(generateLinkedIn(brandVoiceData, corpusData, linkedInConfig.postsPerPeriod).catch((e) => { console.error('[Content] LinkedIn failed:', e); return null; }));
    taskLabels.push('LINKEDIN');
  }

  const xConfig = getConfig('X');
  if (xConfig?.enabled) {
    tasks.push(generateX(brandVoiceData, corpusData, xConfig.postsPerPeriod, xConfig.threadsPerPeriod ?? 1).catch((e) => { console.error('[Content] X failed:', e); return null; }));
    taskLabels.push('X');
  }

  const tiktokConfig = getConfig('TIKTOK');
  if (tiktokConfig?.enabled) {
    tasks.push(generateTikTok(brandVoiceData, corpusData, tiktokConfig.postsPerPeriod).catch((e) => { console.error('[Content] TikTok failed:', e); return null; }));
    taskLabels.push('TIKTOK');
  }

  const blogConfig = getConfig('BLOG');
  if (blogConfig?.enabled) {
    tasks.push(generateBlog(brandVoiceData, corpusData, blogConfig.postsPerPeriod).catch((e) => { console.error('[Content] Blog failed:', e); return null; }));
    taskLabels.push('BLOG');
  }

  const results = await Promise.all(tasks);
  const resultMap: Record<string, any> = {};
  taskLabels.forEach((label, i) => { resultMap[label] = results[i]; });

  const linkedIn = resultMap['LINKEDIN'] || null;
  const x = resultMap['X'] || null;
  const tiktok = resultMap['TIKTOK'] || null;
  const blog = resultMap['BLOG'] || null;

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
      .map((s: any) => s.heading ? `## ${s.heading}\n\n${s.content}` : s.content)
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
