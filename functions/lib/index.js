"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dailyBirthdayCheck = exports.onEventApproved = exports.onUserAdded = exports.onDocumentUploaded = exports.onStoryCreated = exports.onPostCreated = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const messaging_1 = require("firebase-admin/messaging");
const firestore_2 = require("firebase-functions/v2/firestore");
const scheduler_1 = require("firebase-functions/v2/scheduler");
(0, app_1.initializeApp)();
// The app uses a named Firestore database
const DB_ID = 'ai-studio-3a1ec68d-28ba-454c-b89e-da83ab1f369d';
const db = (0, firestore_1.getFirestore)(DB_ID);
/**
 * Get all users and their FCM tokens, filtered by a notification preference field.
 * Defaults to opted-in when the field is undefined (new users haven't set a preference).
 */
async function getTokensFor(prefField, excludeUserId) {
    const snap = await db.collection('users').get();
    const tokens = [];
    for (const doc of snap.docs) {
        if (doc.id === excludeUserId)
            continue;
        const user = doc.data();
        if (user[prefField] === false)
            continue; // explicitly opted out
        tokens.push(...(user.fcmTokens ?? []));
    }
    return tokens;
}
/**
 * Send a multicast push notification, then clean up any invalid tokens.
 */
async function sendPush(tokens, title, body, data) {
    if (tokens.length === 0)
        return;
    // FCM allows max 500 tokens per multicast call
    const chunks = [];
    for (let i = 0; i < tokens.length; i += 500) {
        chunks.push(tokens.slice(i, i + 500));
    }
    const invalidTokens = [];
    for (const chunk of chunks) {
        const response = await (0, messaging_1.getMessaging)().sendEachForMulticast({
            tokens: chunk,
            notification: { title, body },
            data,
            webpush: {
                notification: {
                    icon: '/icon-192.png',
                    badge: '/icon-192.png',
                    vibrate: [200, 100, 200],
                },
                fcmOptions: { link: '/' },
            },
        });
        response.responses.forEach((res, idx) => {
            if (!res.success && res.error?.code === 'messaging/registration-token-not-registered') {
                invalidTokens.push(chunk[idx]);
            }
        });
    }
    // Remove stale tokens from all user documents
    if (invalidTokens.length > 0) {
        const snap = await db.collection('users').get();
        const batch = db.batch();
        for (const doc of snap.docs) {
            const user = doc.data();
            const cleaned = (user.fcmTokens ?? []).filter(t => !invalidTokens.includes(t));
            if (cleaned.length !== (user.fcmTokens ?? []).length) {
                batch.update(doc.ref, { fcmTokens: cleaned });
            }
        }
        await batch.commit();
    }
}
// ─── Triggers ───────────────────────────────────────────────────────────────
const DB_OPT = { database: DB_ID };
/** New community post or announcement */
exports.onPostCreated = (0, firestore_2.onDocumentCreated)({ ...DB_OPT, document: 'posts/{postId}' }, async (event) => {
    const post = event.data?.data();
    if (!post)
        return;
    const isAnnouncement = post.cat === 'Announcement';
    const prefField = isAnnouncement ? 'notifAnnounce' : 'notifPosts';
    const tokens = await getTokensFor(prefField, post.authorId ?? undefined);
    const authorFirst = post.author.split(' ')[0];
    const title = isAnnouncement ? '📣 New Announcement' : `💬 ${authorFirst} posted`;
    const body = post.text.slice(0, 120) || 'New post in Community';
    await sendPush(tokens, title, body, { tab: 'community', postId: event.params.postId });
});
/** New story recorded */
exports.onStoryCreated = (0, firestore_2.onDocumentCreated)({ ...DB_OPT, document: 'stories/{storyId}' }, async (event) => {
    const story = event.data?.data();
    if (!story)
        return;
    const tokens = await getTokensFor('notifStories', story.authorId ?? undefined);
    const title = '🎙️ New Story Recorded';
    const body = `${story.author} captured a story${story.program ? ` from ${story.program}` : ''}`;
    await sendPush(tokens, title, body, { tab: 'stories' });
});
/** New document uploaded */
exports.onDocumentUploaded = (0, firestore_2.onDocumentCreated)({ ...DB_OPT, document: 'documents/{docId}' }, async (event) => {
    const docData = event.data?.data();
    if (!docData)
        return;
    const tokens = await getTokensFor('notifResources');
    const title = '📁 New Resource Added';
    const body = `${docData.displayName || docData.name} is now available in Resources`;
    await sendPush(tokens, title, body, { tab: 'resources' });
});
/** New user added */
exports.onUserAdded = (0, firestore_2.onDocumentCreated)({ ...DB_OPT, document: 'users/{userId}' }, async (event) => {
    const user = event.data?.data();
    if (!user)
        return;
    const tokens = await getTokensFor('notifTeam', event.params.userId);
    const title = '👋 New Team Member';
    const body = `${user.name} has joined the Stewpot team`;
    await sendPush(tokens, title, body, { tab: 'directory' });
});
/** Calendar event approved */
exports.onEventApproved = (0, firestore_2.onDocumentUpdated)({ ...DB_OPT, document: 'events/{eventId}' }, async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after)
        return;
    // Only fire when status changes to 'approved'
    if (before.status === 'approved' || after.status !== 'approved')
        return;
    const tokens = await getTokensFor('notifEvents');
    const title = '📅 New Event Added';
    const body = `${after.title} — ${after.date}${after.time ? ` at ${after.time}` : ''}`;
    await sendPush(tokens, title, body, { tab: 'calendar' });
});
/** Daily check for birthdays and anniversaries (runs at 8 AM Central) */
exports.dailyBirthdayCheck = (0, scheduler_1.onSchedule)({ schedule: '0 13 * * *', timeZone: 'America/Chicago' }, // 8 AM CST = 13:00 UTC
async () => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayMD = `${mm}-${dd}`;
    const snap = await db.collection('users').get();
    const allUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const birthdayPeople = allUsers.filter(u => u.bday === todayMD);
    const anniversaryPeople = allUsers.filter(u => {
        if (!u.anniv)
            return false;
        const parts = u.anniv.split('-');
        return parts.length === 3 && `${parts[1]}-${parts[2]}` === todayMD;
    });
    const notifTokens = allUsers
        .filter(u => u.notifBdays !== false)
        .flatMap(u => u.fcmTokens ?? []);
    for (const person of birthdayPeople) {
        await sendPush(notifTokens.filter(t => !(person.fcmTokens ?? []).includes(t)), // don't notify yourself
        '🎂 Birthday Today!', `Today is ${person.name}'s birthday — send them a message!`, { tab: 'home' });
    }
    for (const person of anniversaryPeople) {
        const annivDate = new Date(person.anniv);
        const years = today.getFullYear() - annivDate.getFullYear();
        await sendPush(notifTokens.filter(t => !(person.fcmTokens ?? []).includes(t)), '🎉 Work Anniversary!', `${person.name} is celebrating ${years} year${years === 1 ? '' : 's'} at Stewpot today!`, { tab: 'home' });
    }
});
//# sourceMappingURL=index.js.map