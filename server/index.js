const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const db = require('./database');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all for now, restrict for prod
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// --- API ROUTES ---

// Create Campaign
app.post('/api/campaigns', (req, res) => {
    const { name, type, prizes } = req.body;
    const id = crypto.randomUUID();
    try {
        const stmt = db.prepare('INSERT INTO campaigns (id, name, type, prizes) VALUES (?, ?, ?, ?)');
        stmt.run(id, name, type, JSON.stringify(prizes || []));
        res.json({ id, name, type, prizes });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Campaign
app.get('/api/campaigns/:id', (req, res) => {
    const { id } = req.params;
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id);
    if (campaign) {
        campaign.prizes = JSON.parse(campaign.prizes);
        res.json(campaign);
    } else {
        res.status(404).json({ error: 'Campaign not found' });
    }
});

// List Campaigns
app.get('/api/campaigns', (req, res) => {
    const campaigns = db.prepare('SELECT * FROM campaigns ORDER BY created_at DESC').all();
    campaigns.forEach(c => c.prizes = JSON.parse(c.prizes));
    res.json(campaigns);
});

// Update Campaign (prizes)
app.put('/api/campaigns/:id', (req, res) => {
    const { id } = req.params;
    const { name, prizes } = req.body;
    try {
        if (name) {
            db.prepare('UPDATE campaigns SET name = ? WHERE id = ?').run(name, id);
        }
        if (prizes) {
            db.prepare('UPDATE campaigns SET prizes = ? WHERE id = ?').run(JSON.stringify(prizes), id);
        }
        const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id);
        if (campaign) {
            campaign.prizes = JSON.parse(campaign.prizes);
            res.json(campaign);
        } else {
            res.status(404).json({ error: 'Campaign not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Check-in / Add Participant
app.post('/api/participants', (req, res) => {
    const { campaign_id, name, phone } = req.body;
    const id = crypto.randomUUID();
    // Simple unique check could be added here (e.g. by phone + campaign_id)

    try {
        const stmt = db.prepare('INSERT INTO participants (id, campaign_id, name, phone) VALUES (?, ?, ?, ?)');
        stmt.run(id, campaign_id, name, phone);

        const participant = { id, campaign_id, name, phone, status: 'CHECKED_IN' };

        // Notify clients (Big Screen)
        io.to(campaign_id).emit('participant_joined', participant);

        res.json(participant);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// List Participants for a Campaign
app.get('/api/participants/:campaignId', (req, res) => {
    const { campaignId } = req.params;
    const participants = db.prepare('SELECT * FROM participants WHERE campaign_id = ?').all(campaignId);
    res.json(participants);
});

// Update Participant Status (e.g. Winner)
app.post('/api/participants/:id/win', (req, res) => {
    const { id } = req.params;
    const { prize } = req.body;
    try {
        const stmt = db.prepare('UPDATE participants SET status = ?, won_prize = ? WHERE id = ?');
        stmt.run('WON', prize, id);

        const participant = db.prepare('SELECT * FROM participants WHERE id = ?').get(id);

        // Broadcast winner
        io.to(participant.campaign_id).emit('winner_selected', participant);

        res.json(participant);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// --- SOCKET.IO ---
io.on('connection', (socket) => {
    console.log('A user connected', socket.id);

    socket.on('join_campaign', (campaignId) => {
        socket.join(campaignId);
        console.log(`Socket ${socket.id} joined campaign ${campaignId}`);
    });

    // Admin trigger spin event (optional, if we want visuals synchronized)
    socket.on('trigger_spin', ({ campaignId, duration }) => {
        io.to(campaignId).emit('start_spin', { duration });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
