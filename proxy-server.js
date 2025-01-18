const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.post('/send-email', async (req, res) => {
  const { products, contact_information } = req.body;

  const emailData = {
    sender: { email: 'marketing@mutatio.agency', name: 'Your Company' },
    to: [{ email: 'usamashabbier@gmail.com', name: 'Usama Shabbier' }],
    subject: 'New Quote Request',
    htmlContent: `
      <h1>Quote Request</h1>
      <p>Hello ${contact_information.name},</p>
      <p>Thank you for submitting a quote request for your event. Please find a copy of the details below, we will be in contact shortly about your enquiry.</p>

      <h2>EVENT INFORMATION</h2>
      <p><strong>Location:</strong> ${contact_information.venue_post}</p>
      <p><strong>Date:</strong> ${contact_information.date}</p>
      <p><strong>Type:</strong> ${contact_information.event_type}</p>
      <p><strong>Total Guests:</strong> ${contact_information.total_guest}</p>
      <p><strong>Seated Guests:</strong> ${contact_information.total_seats}</p>

      <h2>TENTS & OPTIONS</h2>
      ${products.map(product => `
        <h3>Type: ${product.name}</h3>
        <p><strong>Variation:</strong> ${product.name}</p>
        <p><strong>Size:</strong> ${product.size}</p>
        <p><strong>Total Price:</strong> £${product.totalPrice.toFixed(2)} (Includes VAT & Insurance)</p>
        ${product.selected_inventories.map(inv => `
          <p><strong>${inv.name}:</strong> ${inv.qty}</p>
        `).join('')}
      `).join('')}

      <h2>CONTACT INFORMATION</h2>
      <p><strong>Name:</strong> ${contact_information.name}</p>
      <p><strong>Email:</strong> ${contact_information.email}</p>
      <p><strong>Email Confirmed:</strong> Yes</p>
      <p><strong>Comments:</strong> ${contact_information.notes}</p>
      <p><strong>Brochure:</strong> ${contact_information.brochure ? 'Yes' : 'No'}</p>
    `
  };

  try {
    console.log('Sending email with data:', emailData);

    const response = await axios.post('https://api.brevo.com/v3/smtp/email', emailData, {
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      }
    });

    console.log('Brevo API response:', response.data);

    res.status(200).send({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error('Error sending email:', error.response ? error.response.data : error.message);
    res.status(500).send({ success: false, message: "Error sending email" });
  }
});

app.listen(port, () => {
  console.log(`Proxy server running on port ${port}`);
});