const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD
    }
});

app.post('/send-quote-email', async (req, res) => {
    const { products, contact_information } = req.body;

    const mailOptions = {
        from: process.env.MAIL_FROM_ADDRESS,
        to: 'usamashabbier@gmail.com',
        subject: 'New Quote Request',
        html: `
            <h1>New Quote Request</h1>
            <h2>Contact Information</h2>
            <p>Name: ${contact_information.name}</p>
            <p>Email: ${contact_information.email}</p>
            <p>Phone: ${contact_information.phone}</p>
            <p>Event Type: ${contact_information.event_type}</p>
            <p>Notes: ${contact_information.notes}</p>
            <p>Send Brochure: ${contact_information.brochure ? 'Yes' : 'No'}</p>
            <p>Total Seats: ${contact_information.total_seats}</p>
            <p>Date: ${contact_information.date}</p>
            <p>Total Guests: ${contact_information.total_guest}</p>
            <p>Venue: ${contact_information.venue_post}</p>

            <h2>Selected Products</h2>
            ${products.map(product => `
                <h3>${product.name} (${product.size})</h3>
                <p>Total Price: £${product.totalPrice.toFixed(2)}</p>
                <ul>
                    ${product.selected_inventories.map(inv => `
                        <li>${Object.values(inv)[0]} x ${inv.name} (${inv.shape})</li>
                    `).join('')}
                </ul>
            `).join('')}
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).send("Email sent successfully");
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).send("Error sending email");
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));