const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-GB', options);
};

export const createEmailTemplate = (transformedData, isAdmin, { fromName, emailTitle, logoUrl, themeColor }) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${emailTitle}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f0f0f0; }
            .container { max-width: 600px; margin: 20px auto; padding: 20px; background-color: #ffffff; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1) !important; }
            .header { background-color: ${themeColor}; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .logo { max-width: 200px; }
            h1, h2 { color: #444; }
            .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
            .footer { background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .quantity, .checkbox, .details { text-align: center; }
            .checkbox { font-size: 1.2em; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                ${logoUrl ? `<img src="${logoUrl}" alt="${fromName}" class="logo">` : `<h1>${fromName}</h1>`}
            </div>
            <div class="content">
                <h1>${isAdmin ? 'New Quote Request' : 'Quote Request'}</h1>
                ${isAdmin 
                    ? `<p>A new quote request has been submitted. Details are as follows:</p>`
                    : `<p>Hello ${transformedData.contact_information.name},</p>
                       <p>Thank you for submitting a quote request for your event. Please find a copy of the details below, we will be in contact shortly about your enquiry.</p>`
                }

                <h2>EVENT INFORMATION</h2>
                <p><strong>Location:</strong> ${transformedData.contact_information.venue_post}</p>
                <p><strong>Date:</strong> ${formatDate(transformedData.contact_information.date)}</p>
                <p><strong>Type:</strong> ${transformedData.contact_information.event_type}</p>
                <p><strong>Total Guests:</strong> ${transformedData.contact_information.total_guest}</p>
                <p><strong>Seated Guests:</strong> ${transformedData.contact_information.total_seats}</p>

                <h2>TENTS & OPTIONS</h2>
                ${transformedData.products.map(product => `
                    <h3>Type: ${product.name}</h3>
                    <p><strong>Variation:</strong> ${product.name}</p>
                    <p><strong>Size:</strong> ${product.size}</p>
                    <p><strong>Total Price:</strong> £${Math.round(product.totalPrice)} (Inclues VAT & Insurance)</p>
                    <table>
                        <tr>
                            <th>Extra</th>
                            <th>Quantity</th>
                            <th>Details</th>
                        </tr>
                        ${product.extras.map(extra => {
                            if (extra.qty === 0 && extra.display !== 'Checkbox') return '';
                            const quantityValue = extra.display === 'Checkbox' ? '' : extra.qty;
                            let detailsValue = '';
                            let checkboxValue = '';
                            
                            if (extra.display === 'Toggle Switch') {
                                detailsValue = extra.selected ? extra.rightText : extra.leftText;
                            } else if (extra.display === 'Checkbox') {
                                checkboxValue = extra.selected ? '✅' : '';
                            } else if (extra.qty > 0) {
                                checkboxValue = '✅';
                            }
                            
                            return `
                                <tr>
                                    <td>${extra.name}</td>
                                    <td class="quantity">${quantityValue}</td>
                                    <td class="${detailsValue ? 'details' : 'checkbox'}">${detailsValue || checkboxValue}</td>
                                </tr>
                            `;
                        }).join('')}
                    </table>
                `).join('')}

                <h2>CONTACT INFORMATION</h2>
                <p><strong>Name:</strong> ${transformedData.contact_information.name}</p>
                <p><strong>Email:</strong> ${transformedData.contact_information.email}</p>
                <p><strong>Phone:</strong> ${transformedData.contact_information.phone}</p>
                <p><strong>Event Type:</strong> ${transformedData.contact_information.event_type}</p>
                <p><strong>Found Us Through:</strong> ${transformedData.contact_information.source}</p>
                <p><strong>Comments:</strong> ${transformedData.contact_information.notes}</p>
                <p><strong>Brochure:</strong> ${transformedData.contact_information.brochure ? 'Yes' : 'No'}</p>
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} ${fromName}. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
`; 