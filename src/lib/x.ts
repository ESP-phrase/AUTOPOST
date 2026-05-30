import { TwitterApi } from 'twitter-api-v2';

function getClient() {
  return new TwitterApi({
    appKey: process.env.X_API_KEY!,
    appSecret: process.env.X_API_SECRET!,
    accessToken: process.env.X_ACCESS_TOKEN!,
    accessSecret: process.env.X_ACCESS_SECRET!,
  });
}

export async function postTweet(text: string, replyToId?: string): Promise<{ id: string; text: string }> {
  const client = getClient();
  const tweet = await client.v2.tweet({
    text,
    ...(replyToId ? { reply: { in_reply_to_tweet_id: replyToId } } : {}),
  });
  return { id: tweet.data.id, text: tweet.data.text };
}

export async function postThread(tweets: string[]): Promise<{ id: string }[]> {
  const client = getClient();
  let lastId: string | undefined;
  const results: { id: string }[] = [];

  for (const tweetText of tweets) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const tweet = await client.v2.tweet({
      text: tweetText,
      ...(lastId ? { reply: { in_reply_to_tweet_id: lastId } } : {}),
    });
    lastId = tweet.data.id;
    results.push({ id: tweet.data.id });
  }

  return results;
}

export async function verifyCredentials(): Promise<boolean> {
  try {
    const client = getClient();
    const user = await client.v2.me();
    return !!user.data.id;
  } catch {
    return false;
  }
}
