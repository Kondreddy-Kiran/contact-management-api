const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 5000;

app.use(bodyParser.json());

// Initialize SQLite Database
const db = new sqlite3.Database('./contacts.db', (err) => {
    if (err) {
        console.error('Error opening database', err);
    } else {
        db.run(`CREATE TABLE IF NOT EXISTS contacts (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            phone TEXT NOT NULL,
            address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`, () => {
            // Insert Sample Data
            db.run(`INSERT INTO contacts (id, name, email, phone, address) VALUES
                (?, 'John Doe', 'john@example.com', '1234567890', '123 Main St'),
                (?, 'Jane Smith', 'jane@example.com', '0987654321', '456 Elm St')`,
                [uuidv4(), uuidv4()]);
        });
    }
});

// GET all contacts
app.get('/contacts', (req, res) => {
    db.all('SELECT * FROM contacts', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// GET single contact by ID
app.get('/contacts/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM contacts WHERE id = ?', [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        row ? res.json(row) : res.status(404).json({ error: 'Contact not found' });
    });
});

// POST create new contact
app.post('/contacts', (req, res) => {
    const { name, email, phone, address } = req.body;
    if (!name || !email || !phone) {
        return res.status(400).json({ error: 'Name, Email, and Phone are required' });
    }
    const id = uuidv4();
    db.run('INSERT INTO contacts (id, name, email, phone, address) VALUES (?, ?, ?, ?, ?)',
        [id, name, email, phone, address],
        (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.status(201).json({ id, name, email, phone, address, created_at: new Date() });
        }
    );
});

// PUT update contact by ID
app.put('/contacts/:id', (req, res) => {
    const { id } = req.params;
    const { name, email, phone, address } = req.body;
    if (!name || !email || !phone) {
        return res.status(400).json({ error: 'Name, Email, and Phone are required' });
    }
    db.run('UPDATE contacts SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?',
        [name, email, phone, address, id],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            this.changes ? res.json({ message: 'Contact updated successfully' }) : res.status(404).json({ error: 'Contact not found' });
        }
    );
});

// DELETE contact by ID
app.delete('/contacts/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM contacts WHERE id = ?', [id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        this.changes ? res.json({ message: 'Contact deleted successfully' }) : res.status(404).json({ error: 'Contact not found' });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
