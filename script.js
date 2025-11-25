document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('invoice-form');
    const itemsContainer = document.getElementById('items-container');
    const addItemBtn = document.getElementById('add-item');
    const generateBtn = document.getElementById('generate-bill');
    const billOutput = document.getElementById('bill-output');
    const invoiceContent = document.getElementById('invoice-content');
    const printBtn = document.getElementById('print-bill');
    const downloadPdfBtn = document.getElementById('download-pdf');

    // Preview elements
    const previewClient = document.getElementById('preview-client');
    const previewEmail = document.getElementById('preview-email');
    const previewDate = document.getElementById('preview-date');
    const previewDue = document.getElementById('preview-due');
    const previewItemsTable = document.querySelector('#preview-items tbody');
    const previewSubtotal = document.getElementById('preview-subtotal');
    const previewTax = document.getElementById('preview-tax');
    const previewTotal = document.getElementById('preview-total');

    // Load saved data from localStorage
    loadFromStorage();

    // Live update preview on input changes
    document.addEventListener('input', updatePreview);
    document.addEventListener('change', updatePreview);

    // Add new item
    addItemBtn.addEventListener('click', () => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item';
        itemDiv.innerHTML = `
            <input type="text" class="item-description" placeholder="Service Description" required>
            <input type="number" class="item-quantity" placeholder="Qty" min="1" required>
            <input type="number" class="item-rate" placeholder="Rate" step="0.01" required>
            <button type="button" class="remove-item">Remove</button>
        `;
        itemsContainer.appendChild(itemDiv);
        attachRemoveListener(itemDiv.querySelector('.remove-item'));
        saveToStorage();
        updatePreview();
    });

    // Remove item
    function attachRemoveListener(btn) {
        btn.addEventListener('click', (e) => {
            e.target.parentElement.remove();
            saveToStorage();
            updatePreview();
        });
    }

    // Attach remove listeners to existing items
    document.querySelectorAll('.remove-item').forEach(btn => attachRemoveListener(btn));

    // Update live preview
    function updatePreview() {
        previewClient.textContent = document.getElementById('client-name').value || 'Client Name';
        previewEmail.textContent = document.getElementById('client-email').value || 'client@example.com';
        previewDate.textContent = document.getElementById('invoice-date').value || 'YYYY-MM-DD';
        previewDue.textContent = document.getElementById('due-date').value || 'YYYY-MM-DD';

        // Update items table
        previewItemsTable.innerHTML = '';
        let subtotal = 0;
        document.querySelectorAll('.item').forEach(item => {
            const desc = item.querySelector('.item-description').value || 'Description';
            const qty = parseFloat(item.querySelector('.item-quantity').value) || 0;
            const rate = parseFloat(item.querySelector('.item-rate').value) || 0;
            const amount = qty * rate;
            subtotal += amount;

            const row = document.createElement('tr');
            row.innerHTML = `<td>${desc}</td><td>${qty}</td><td>₹${rate.toFixed(2)}</td><td>₹${amount.toFixed(2)}</td>`;
            previewItemsTable.appendChild(row);
        });

        const taxRate = parseFloat(document.getElementById('tax-rate').value) || 0;
        const tax = (subtotal * taxRate) / 100;
        const total = subtotal + tax;

        previewSubtotal.textContent = subtotal.toFixed(2);
        previewTax.textContent = tax.toFixed(2);
        previewTotal.textContent = total.toFixed(2);
    }

    // Generate Final Bill
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        updatePreview(); // Ensure final update
        const clientName = document.getElementById('client-name').value;
        const clientEmail = document.getElementById('client-email').value;
        const invoiceDate = document.getElementById('invoice-date').value;
        const dueDate = document.getElementById('due-date').value;
        const taxRate = document.getElementById('tax-rate').value;

        let itemsHtml = '<table><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>';
        let subtotal = 0;
        document.querySelectorAll('.item').forEach(item => {
            const desc = item.querySelector('.item-description').value;
            const qty = item.querySelector('.item-quantity').value;
            const rate = item.querySelector('.item-rate').value;
            const amount = qty * rate;
            subtotal += amount;
            itemsHtml += `<tr><td>${desc}</td><td>${qty}</td><td>₹${parseFloat(rate).toFixed(2)}</td><td>₹${amount.toFixed(2)}</td></tr>`;
        });
        itemsHtml += '</tbody></table>';

        const tax = (subtotal * taxRate) / 100;
        const total = subtotal + tax;

        invoiceContent.innerHTML = `
            <h3>DesignKart-Bihar Invoice</h3>
            <p><strong>Client:</strong> ${clientName}</p>
            <p><strong>Email:</strong> ${clientEmail}</p>
            <p><strong>Date:</strong> ${invoiceDate}</p>
            <p><strong>Due:</strong> ${dueDate}</p>
            ${itemsHtml}
            <p><strong>Subtotal:</strong> ₹${subtotal.toFixed(2)}</p>
            <p><strong>Tax (${taxRate}%):</strong> ₹${tax.toFixed(2)}</p>
            <p><strong>Total:</strong> ₹${total.toFixed(2)}</p>
        `;
        billOutput.style.display = 'block';
    });

    // Print Bill
    printBtn.addEventListener('click', () => {
        window.print();
    });

    // Download PDF
    downloadPdfBtn.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Company Header
        doc.setFontSize(20);
        doc.text('DesignKart-Bihar', 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text('Designing Services Company', 105, 30, { align: 'center' });
        doc.text('Invoice', 105, 40, { align: 'center' });

        // Client Details
        let y = 60;
        doc.text(`Client: ${document.getElementById('client-name').value}`, 20, y);
        y += 10;
        doc.text(`Email: ${document.getElementById('client-email').value}`, 20, y);
        y += 10;
        doc.text(`Date: ${document.getElementById('invoice-date').value}`, 20, y);
        y += 10;
        doc.text(`Due: ${document.getElementById('due-date').value}`, 20, y);
        y += 20;

        // Items Table
        doc.autoTable({
            startY: y,
            head: [['Description', 'Qty', 'Rate', 'Amount']],
            body: Array.from(document.querySelectorAll('.item')).map(item => [
                item.querySelector('.item-description').value,
                item.querySelector('.item-quantity').value,
                `₹${parseFloat(item.querySelector('.item-rate').value).toFixed(2)}`,
                `₹${(parseFloat(item.querySelector('.item-quantity').value) * parseFloat(item.querySelector('.item-rate').value)).toFixed(2)}`
            ]),
        });

        // Totals
        const subtotal = parseFloat(previewSubtotal.textContent);
        const tax = parseFloat(previewTax.textContent);
        const total = parseFloat(previewTotal.textContent);
        const taxRate = document.getElementById('tax-rate').value;
        y = doc.lastAutoTable.finalY + 10;
        doc.text(`Subtotal: ₹${subtotal.toFixed(2)}`, 140, y, { align: 'right' });
        y += 10;
        doc.text(`Tax