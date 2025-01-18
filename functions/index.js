const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();

const brevoApiKey = functions.config().brevo.key;

exports.sendQuoteEmail = functions.https.onCall(async (data, context) => {
  const { products, contact_information } = data;

  const emailData = {
    sender: { email: 'your-email@example.com', name: 'Your Company' },
    to: [{ email: 'usamashabbier@gmail.com', name: 'Usama Shabbier' }],
    subject: 'New Quote Request',
    htmlContent: `
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
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', emailData, {
      headers: {
        'Content-Type': 'application/json',
        'api-key': brevoApiKey
      }
    });
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, message: "Error sending email" };
  }
});