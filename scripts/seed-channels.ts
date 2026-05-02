import { google } from 'googleapis';

const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY,
});

async function findChannel(query: string) {
    const res = await youtube.search.list({
        part: ['snippet'],
        q: query,
        type: ['channel'],
        maxResults: 3,
    });
    for (const item of res.data.items || []) {
        console.log(item.snippet?.channelTitle, '->', item.id?.channelId);
    }
}

findChannel('슈카월드').then(() => findChannel('머니코믹스'));
