import dotenv from 'dotenv';
import connectDB from '../config/db.js';

import User from '../models/User.js';
import Event from '../models/Event.js';
import EventHistory from '../models/EventHistory.js';

import Order from '../models/Order.js';
import OrderHistory from '../models/OrderHistory.js';

import Comment from '../models/Comment.js';
import CommentHistory from '../models/CommentHistory.js';
import Rating from '../models/Rating.js';

import calculateOrderTotal from '../utils/calculateOrderTotal.js';
import { recalcEventRating } from '../utils/rating.js';

dotenv.config();

const seed = async () => {
    try {
        await connectDB();

        console.log('Clearing existing data...');

        // Comments + rating
        await CommentHistory.deleteMany();
        await Comment.deleteMany();
        await Rating.deleteMany();

        // Orders
        await OrderHistory.deleteMany();
        await Order.deleteMany();

        // Events
        await EventHistory.deleteMany();
        await Event.deleteMany();

        // Users
        await User.deleteMany();

        console.log('Creating users...');

        const admin = await User.create({
            email: 'admin@example.com',
            password: 'admin123',
            role: 'admin',
        });

        const user1 = await User.create({
            email: 'user1@example.com',
            password: 'user123',
            role: 'user',
        });

        const powerUser = await User.create({
            email: 'power@example.com',
            password: 'power123',
            role: 'poweruser',
        });

        // Soft-deleted example user
        const deletedUser = await User.create({
            email: 'deleted@example.com',
            password: 'deleted123',
            role: 'user',
        });

        deletedUser.isDeleted = true;
        deletedUser.deletedAt = new Date();
        await deletedUser.save();

        console.log('Users created.');
        console.log('-------------------------------------');
        console.log('admin@example.com  / admin123');
        console.log('user1@example.com  / user123');
        console.log('power@example.com  / power123');
        console.log('deleted@example.com / deleted123 (soft-deleted)');
        console.log('-------------------------------------');

        console.log('Creating events...');

        // 🎫 EVENT DATA
        const events = await Event.insertMany([
            // 🎸 CONCERTS
            {
                title: 'Coldplay: Music of the Spheres World Tour',
                imageUrl: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800',
                genre: 'Concert',
                country: 'Bulgaria',
                location: 'National Stadium Vasil Levski, Sofia',
                venue: 'National Stadium Vasil Levski',
                eventDate: new Date('2026-06-15T20:00:00'),
                eventTime: '20:00',
                details: 'Experience an unforgettable night with Coldplay\'s groundbreaking Music of the Spheres World Tour. Featuring stunning visuals, pyrotechnics, and all your favorite hits including Yellow, Fix You, and Higher Power.',
                price: 89.99,
                totalTickets: 50000,
                availableTickets: 35420,
                owner: admin._id,
            },
            {
                title: 'The Weeknd: After Hours Till Dawn Stadium Tour',
                imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
                genre: 'Concert',
                country: 'Bulgaria',
                location: 'Arena Sofia, Sofia',
                venue: 'Arena Sofia',
                eventDate: new Date('2026-07-22T21:00:00'),
                eventTime: '21:00',
                details: 'The Weeknd brings his electrifying After Hours Till Dawn tour to Sofia! Don\'t miss this spectacular show featuring hits like Blinding Lights, Save Your Tears, and Starboy.',
                price: 95.00,
                totalTickets: 18000,
                availableTickets: 12450,
                owner: admin._id,
            },
            {
                title: 'Ed Sheeran: Mathematics Tour',
                imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800',
                genre: 'Concert',
                country: 'Bulgaria',
                location: 'National Palace of Culture, Sofia',
                venue: 'Hall 1, National Palace of Culture',
                eventDate: new Date('2026-05-10T19:30:00'),
                eventTime: '19:30',
                details: 'An intimate evening with Ed Sheeran performing acoustic versions of Shape of You, Perfect, Thinking Out Loud, and songs from his latest album.',
                price: 120.00,
                totalTickets: 5000,
                availableTickets: 0, // SOLD OUT
                owner: powerUser._id,
            },

            // 🎭 THEATRE
            {
                title: 'Hamilton: An American Musical',
                imageUrl: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800',
                genre: 'Theatre',
                country: 'Bulgaria',
                location: 'Ivan Vazov National Theatre, Sofia',
                venue: 'Ivan Vazov National Theatre',
                eventDate: new Date('2026-08-05T19:00:00'),
                eventTime: '19:00',
                details: 'The revolutionary Broadway musical comes to Sofia! Experience the story of America\'s founding father Alexander Hamilton through hip-hop, jazz, and R&B.',
                price: 75.00,
                totalTickets: 800,
                availableTickets: 156,
                owner: admin._id,
            },
            {
                title: 'The Phantom of the Opera',
                imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
                genre: 'Theatre',
                country: 'Bulgaria',
                location: 'Sofia Opera and Ballet, Sofia',
                venue: 'Sofia Opera and Ballet',
                eventDate: new Date('2026-09-12T18:30:00'),
                eventTime: '18:30',
                details: 'Andrew Lloyd Webber\'s timeless masterpiece. Fall in love with the haunting tale of the masked Phantom and his obsession with beautiful soprano Christine.',
                price: 65.00,
                totalTickets: 1200,
                availableTickets: 845,
                owner: powerUser._id,
            },

            // ⚽ SPORTS
            {
                title: 'Bulgaria vs England - UEFA Euro 2026 Qualifier',
                imageUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800',
                genre: 'Sports',
                country: 'Bulgaria',
                location: 'National Stadium Vasil Levski, Sofia',
                venue: 'National Stadium Vasil Levski',
                eventDate: new Date('2026-03-28T19:45:00'),
                eventTime: '19:45',
                details: 'Don\'t miss this crucial Euro 2026 qualifier as Bulgaria takes on England! Support the national team in this historic match.',
                price: 45.00,
                totalTickets: 40000,
                availableTickets: 28500,
                owner: admin._id,
            },
            {
                title: 'PFC Ludogorets vs Real Madrid - Champions League',
                imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
                genre: 'Sports',
                country: 'Bulgaria',
                location: 'Huvepharma Arena, Razgrad',
                venue: 'Huvepharma Arena',
                eventDate: new Date('2026-04-15T20:00:00'),
                eventTime: '20:00',
                details: 'Historic Champions League match! Watch Ludogorets face off against European giants Real Madrid. An unforgettable night of football.',
                price: 55.00,
                totalTickets: 10000,
                availableTickets: 2340,
                owner: user1._id,
            },

            // 🎪 FESTIVALS
            {
                title: 'Hills of Rock Festival 2026',
                imageUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800',
                genre: 'Festival',
                country: 'Bulgaria',
                location: 'Plovdiv Ancient Stadium, Plovdiv',
                venue: 'Plovdiv Ancient Stadium',
                eventDate: new Date('2026-07-10T14:00:00'),
                eventTime: '14:00',
                details: 'Bulgaria\'s biggest rock festival returns! 3 days of non-stop music featuring international and local rock legends. Lineup TBA.',
                price: 150.00,
                totalTickets: 25000,
                availableTickets: 18750,
                owner: powerUser._id,
            },
            {
                title: 'A to JazZ Festival 2026',
                imageUrl: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800',
                genre: 'Festival',
                country: 'Bulgaria',
                location: 'Boris\'s Garden, Sofia',
                venue: 'Boris\'s Garden Open Stage',
                eventDate: new Date('2026-06-20T18:00:00'),
                eventTime: '18:00',
                details: 'The ultimate jazz experience! Enjoy world-class jazz performances under the stars in Sofia\'s most beautiful park.',
                price: 40.00,
                totalTickets: 8000,
                availableTickets: 5600,
                owner: admin._id,
            },

            // 😂 COMEDY
            {
                title: 'Kevin Hart: Reality Check Tour',
                imageUrl: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800',
                genre: 'Comedy',
                country: 'Bulgaria',
                location: 'Arena Armeec, Sofia',
                venue: 'Arena Armeec',
                eventDate: new Date('2026-10-18T20:30:00'),
                eventTime: '20:30',
                details: 'Hollywood\'s funniest man Kevin Hart brings his hilarious Reality Check comedy tour to Sofia! Get ready for an evening of non-stop laughter.',
                price: 85.00,
                totalTickets: 12000,
                availableTickets: 8450,
                owner: user1._id,
            },

            // 🎸 MORE CONCERTS (Added)
            {
                title: 'Imagine Dragons: Loom World Tour',
                imageUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800',
                genre: 'Concert',
                country: 'Bulgaria',
                location: 'Arena Armeec, Sofia',
                venue: 'Arena Armeec',
                eventDate: new Date('2026-11-08T20:00:00'),
                eventTime: '20:00',
                details: 'Imagine Dragons brings their explosive Loom World Tour to Sofia! Experience hits like Radioactive, Believer, and Thunder with mind-blowing stage production.',
                price: 79.99,
                totalTickets: 15000,
                availableTickets: 10200,
                owner: admin._id,
            },
            {
                title: 'Billie Eilish: Hit Me Hard and Soft Tour',
                imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
                genre: 'Concert',
                country: 'Bulgaria',
                location: 'Arena Sofia, Sofia',
                venue: 'Arena Sofia',
                eventDate: new Date('2026-08-30T21:00:00'),
                eventTime: '21:00',
                details: 'Grammy winner Billie Eilish performs her haunting hits live! Don\'t miss Bad Guy, Happier Than Ever, and songs from her latest album.',
                price: 105.00,
                totalTickets: 12000,
                availableTickets: 7800,
                owner: powerUser._id,
            },

            // 🎭 MORE THEATRE (Added)
            {
                title: 'Les Misérables: The Musical',
                imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
                genre: 'Theatre',
                country: 'Bulgaria',
                location: 'National Palace of Culture, Sofia',
                venue: 'Hall 1, National Palace of Culture',
                eventDate: new Date('2026-10-25T19:00:00'),
                eventTime: '19:00',
                details: 'Experience the epic tale of Jean Valjean in this stunning production of Les Misérables. Featuring iconic songs like I Dreamed a Dream and One Day More.',
                price: 68.00,
                totalTickets: 2500,
                availableTickets: 890,
                owner: admin._id,
            },
            {
                title: 'The Lion King: Stage Musical',
                imageUrl: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=800',
                genre: 'Theatre',
                country: 'Bulgaria',
                location: 'Arena Armeec, Sofia',
                venue: 'Arena Armeec',
                eventDate: new Date('2026-12-15T18:00:00'),
                eventTime: '18:00',
                details: 'Disney\'s The Lion King comes to life on stage! Spectacular costumes, puppetry, and unforgettable music including Circle of Life and Can You Feel the Love Tonight.',
                price: 92.00,
                totalTickets: 8000,
                availableTickets: 4560,
                owner: powerUser._id,
            },

            // ⚽ MORE SPORTS (Added)
            {
                title: 'CSKA Sofia vs Levski Sofia - Eternal Derby',
                imageUrl: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800',
                genre: 'Sports',
                country: 'Bulgaria',
                location: 'National Stadium Vasil Levski, Sofia',
                venue: 'National Stadium Vasil Levski',
                eventDate: new Date('2026-05-03T18:00:00'),
                eventTime: '18:00',
                details: 'The biggest football rivalry in Bulgaria! Don\'t miss the intense Eternal Derby between CSKA Sofia and Levski Sofia. Tickets selling fast!',
                price: 35.00,
                totalTickets: 45000,
                availableTickets: 12000,
                owner: user1._id,
            },
            {
                title: 'Bulgarian Basketball Cup Final 2026',
                imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
                genre: 'Sports',
                country: 'Bulgaria',
                location: 'Arena Armeec, Sofia',
                venue: 'Arena Armeec',
                eventDate: new Date('2026-04-28T19:30:00'),
                eventTime: '19:30',
                details: 'The pinnacle of Bulgarian basketball! Watch the country\'s best teams battle for the national cup. High-energy action guaranteed!',
                price: 28.00,
                totalTickets: 6000,
                availableTickets: 3400,
                owner: admin._id,
            },

            // 🎪 MORE FESTIVALS (Added)
            {
                title: 'Sofia Summer Fest 2026',
                imageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800',
                genre: 'Festival',
                country: 'Bulgaria',
                location: 'South Park, Sofia',
                venue: 'South Park Main Stage',
                eventDate: new Date('2026-07-25T16:00:00'),
                eventTime: '16:00',
                details: 'The ultimate summer music festival! 2 days of indie, pop, and electronic music featuring both international headliners and local talents.',
                price: 85.00,
                totalTickets: 15000,
                availableTickets: 9750,
                owner: powerUser._id,
            },
            {
                title: 'Varna Summer International Music Festival',
                imageUrl: 'https://images.unsplash.com/photo-1470229538611-16ba8c7ffbd7?w=800',
                genre: 'Festival',
                country: 'Bulgaria',
                location: 'Summer Theatre, Varna',
                venue: 'Varna Summer Theatre',
                eventDate: new Date('2026-08-18T20:30:00'),
                eventTime: '20:30',
                details: 'Classical music meets the Black Sea! Prestigious festival featuring world-renowned orchestras and soloists in a stunning outdoor venue.',
                price: 55.00,
                totalTickets: 3500,
                availableTickets: 1950,
                owner: admin._id,
            },

            // 😂 MORE COMEDY (Added)
            {
                title: 'Trevor Noah: Off The Record Tour',
                imageUrl: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=800',
                genre: 'Comedy',
                country: 'Bulgaria',
                location: 'National Palace of Culture, Sofia',
                venue: 'Hall 1, National Palace of Culture',
                eventDate: new Date('2026-09-22T20:00:00'),
                eventTime: '20:00',
                details: 'Former Daily Show host Trevor Noah brings his sharp wit and social commentary to Sofia! An evening of intelligent humor and unforgettable stories.',
                price: 72.00,
                totalTickets: 4000,
                availableTickets: 2100,
                owner: user1._id,
            },

            // 🎨 NEW CATEGORY: ART/EXHIBITION (Added)
            {
                title: 'Van Gogh: The Immersive Experience',
                imageUrl: 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=800',
                genre: 'Exhibition',
                country: 'Bulgaria',
                location: 'Sofia Event Center, Sofia',
                venue: 'Sofia Event Center - Hall 2',
                eventDate: new Date('2026-06-01T10:00:00'),
                eventTime: '10:00',
                details: 'Step into Van Gogh\'s masterpieces! This groundbreaking 360° digital art exhibition brings Starry Night, Sunflowers, and more to life with light, sound, and motion.',
                price: 22.00,
                totalTickets: 50000,
                availableTickets: 38500,
                owner: admin._id,
            },
        ]);

        console.log(`${events.length} events created.`);

        // -------------------------------------
        // DEMO: simulate price change for an event
        // -------------------------------------
        const e0 = await Event.findById(events[0]._id);
        e0.previousPrice = e0.price;
        e0.priceChangedAt = new Date();
        e0.price = e0.price + 10; // Price increase
        await e0.save();

        await EventHistory.create({
            eventId: e0._id,
            userId: admin._id,
            action: 'updated',
            before: { price: e0.previousPrice },
            after: {
                price: e0.price,
                previousPrice: e0.previousPrice,
                priceChangedAt: e0.priceChangedAt,
            },
        });

        // History for event creation
        for (const e of events) {
            await EventHistory.create({
                eventId: e._id,
                userId: e.owner,
                action: 'created',
                before: null,
                after: e.toObject(),
            });
        }

        console.log('Event history logged.');

        // -------------------------------------------------
        // RATINGS for events
        // -------------------------------------------------
        console.log('Creating ratings...');

        await Rating.create([
            // Original events ratings (0-9)
            { eventId: events[0]._id, userId: admin._id, value: 5 },
            { eventId: events[0]._id, userId: user1._id, value: 5 },
            { eventId: events[0]._id, userId: powerUser._id, value: 4 },

            { eventId: events[1]._id, userId: user1._id, value: 5 },
            { eventId: events[1]._id, userId: powerUser._id, value: 5 },

            { eventId: events[2]._id, userId: admin._id, value: 5 },
            { eventId: events[2]._id, userId: user1._id, value: 5 },

            { eventId: events[3]._id, userId: powerUser._id, value: 5 },
            { eventId: events[3]._id, userId: user1._id, value: 5 },

            { eventId: events[4]._id, userId: admin._id, value: 5 },
            { eventId: events[4]._id, userId: user1._id, value: 4 },

            { eventId: events[5]._id, userId: user1._id, value: 5 },
            { eventId: events[5]._id, userId: powerUser._id, value: 4 },

            { eventId: events[6]._id, userId: admin._id, value: 5 },
            { eventId: events[6]._id, userId: powerUser._id, value: 5 },

            { eventId: events[7]._id, userId: user1._id, value: 5 },
            { eventId: events[7]._id, userId: admin._id, value: 4 },

            { eventId: events[8]._id, userId: powerUser._id, value: 5 },
            { eventId: events[8]._id, userId: user1._id, value: 4 },

            { eventId: events[9]._id, userId: admin._id, value: 5 },
            { eventId: events[9]._id, userId: user1._id, value: 5 },

            // New events ratings (10-19)
            { eventId: events[10]._id, userId: admin._id, value: 5 },
            { eventId: events[10]._id, userId: powerUser._id, value: 5 },

            { eventId: events[11]._id, userId: user1._id, value: 5 },
            { eventId: events[11]._id, userId: admin._id, value: 4 },

            { eventId: events[12]._id, userId: powerUser._id, value: 5 },
            { eventId: events[12]._id, userId: user1._id, value: 4 },

            { eventId: events[13]._id, userId: admin._id, value: 5 },
            { eventId: events[13]._id, userId: powerUser._id, value: 5 },

            { eventId: events[14]._id, userId: user1._id, value: 4 },
            { eventId: events[14]._id, userId: admin._id, value: 4 },

            { eventId: events[15]._id, userId: powerUser._id, value: 5 },
            { eventId: events[15]._id, userId: user1._id, value: 4 },

            { eventId: events[16]._id, userId: admin._id, value: 5 },
            { eventId: events[16]._id, userId: user1._id, value: 5 },

            { eventId: events[17]._id, userId: powerUser._id, value: 4 },
            { eventId: events[17]._id, userId: admin._id, value: 5 },

            { eventId: events[18]._id, userId: user1._id, value: 5 },
            { eventId: events[18]._id, userId: powerUser._id, value: 5 },

            { eventId: events[19]._id, userId: admin._id, value: 4 },
            { eventId: events[19]._id, userId: user1._id, value: 5 },
        ]);

        // Recalculate ratings
        for (const e of events) {
            const summary = await recalcEventRating(e._id);
            console.log(
                `Rating for "${e.title}": avg=${summary.ratingAvg}, count=${summary.ratingCount}`
            );
        }

        // -------------------------------------------------
        // COMMENTS for events
        // -------------------------------------------------
        console.log('Creating comments...');

        const c1 = await Comment.create({
            eventId: events[0]._id,
            userId: user1._id,
            content: 'Amazing concert! Coldplay was incredible live. Best night ever!',
        });

        const c2 = await Comment.create({
            eventId: events[0]._id,
            userId: powerUser._id,
            content: 'The visuals were stunning! Totally worth the price.',
        });

        const c3 = await Comment.create({
            eventId: events[3]._id,
            userId: admin._id,
            content: 'Hamilton was mind-blowing. The cast was perfect!',
        });

        const c4 = await Comment.create({
            eventId: events[5]._id,
            userId: user1._id,
            content: 'Great atmosphere! Bulgaria fought well despite the loss.',
        });

        // New comments for new events
        const c5 = await Comment.create({
            eventId: events[10]._id,
            userId: admin._id,
            content: 'Imagine Dragons never disappoints! The energy was insane!',
        });

        const c6 = await Comment.create({
            eventId: events[14]._id,
            userId: user1._id,
            content: 'Best derby in years! The atmosphere was electric!',
        });

        // Likes
        c1.likes = [admin._id, powerUser._id];
        c2.likes = [user1._id];
        c4.likes = [admin._id];
        c5.likes = [user1._id, powerUser._id];
        c6.likes = [admin._id];
        await c1.save();
        await c2.save();
        await c4.save();
        await c5.save();
        await c6.save();

        // CommentHistory
        await CommentHistory.create([
            {
                commentId: c1._id,
                userId: user1._id,
                action: 'created',
                before: null,
                after: c1.toObject(),
            },
            {
                commentId: c2._id,
                userId: powerUser._id,
                action: 'created',
                before: null,
                after: c2.toObject(),
            },
            {
                commentId: c3._id,
                userId: admin._id,
                action: 'created',
                before: null,
                after: c3.toObject(),
            },
            {
                commentId: c4._id,
                userId: user1._id,
                action: 'created',
                before: null,
                after: c4.toObject(),
            },
            {
                commentId: c5._id,
                userId: admin._id,
                action: 'created',
                before: null,
                after: c5.toObject(),
            },
            {
                commentId: c6._id,
                userId: user1._id,
                action: 'created',
                before: null,
                after: c6.toObject(),
            },
        ]);

        // Soft-delete example
        c3.isDeleted = true;
        c3.deletedAt = new Date();
        await c3.save();

        await CommentHistory.create({
            commentId: c3._id,
            userId: admin._id,
            action: 'soft-deleted',
            before: null,
            after: c3.toObject(),
        });

        console.log('Comments + comment history created.');

        // -------------------------------------------------
        // ORDERS (Ticket Purchases)
        // -------------------------------------------------
        console.log('Creating ticket orders...');

        const statuses = [
            'pending',
            'processing',
            'paid',
            'completed',
            'cancelled',
            'refunded',
        ];

        // Order 1: Coldplay tickets
        const itemsA = [
            {
                eventId: events[0]._id,
                title: events[0].title,
                unitPrice: events[0].price,
                quantity: 2,
            },
        ];

        // Order 2: Multiple events
        const itemsB = [
            {
                eventId: events[1]._id,
                title: events[1].title,
                unitPrice: events[1].price,
                quantity: 1,
            },
            {
                eventId: events[3]._id,
                title: events[3].title,
                unitPrice: events[3].price,
                quantity: 2,
            },
        ];

        // Order 3: Sports event
        const itemsC = [
            {
                eventId: events[5]._id,
                title: events[5].title,
                unitPrice: events[5].price,
                quantity: 4,
            },
        ];

        const users = [user1, powerUser, admin];
        const orderItems = [itemsA, itemsB, itemsC];

        for (let i = 0; i < statuses.length; i++) {
            const status = statuses[i];
            const owner = users[i % users.length];
            const items = orderItems[i % orderItems.length];

            const totalPrice = calculateOrderTotal(items);

            const createdOrder = await Order.create({
                userId: owner._id,
                items,
                totalPrice,
                status,
            });

            await OrderHistory.create({
                orderId: createdOrder._id,
                userId: owner._id,
                action: 'created',
                before: null,
                after: {
                    status,
                    items,
                    totalPrice,
                },
                fromStatus: null,
                toStatus: status,
            });

            console.log(`Order created with status: ${status}`);
        }

        console.log('Orders + history created successfully.');
        console.log('');
        console.log('🎉 EventPass seed completed!');
        console.log('-------------------------------------');
        console.log(`✅ ${events.length} events created`);
        console.log('✅ Users, ratings, comments, orders ready');
        console.log('✅ Ready to start the server!');
        console.log('-------------------------------------');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed error:', error);
        process.exit(1);
    }
};

seed();