

const EMAIL = 'nierajstudies@gmail.com';
const PASSWORD = 'ue5gkxmS1y3rusMWA9to!M%3b&&CiYK0';
const BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

async function testShiprocket() {
    console.log('Testing Shiprocket Integration...');

    try {
        // 1. Auth
        console.log('1. Authenticating...');
        const authRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
        });

        if (!authRes.ok) {
            console.error('Auth Failed:', await authRes.text());
            return;
        }

        const authData = await authRes.json();
        console.log('Auth Success! Token:', authData.token ? 'Generated' : 'Missing');
        const token = authData.token;

        // 2. Check Serviceability (Test)
        console.log('2. Checking Serviceability...');
        const serviceRes = await fetch(`${BASE_URL}/courier/serviceability?pickup_postcode=625001&delivery_postcode=110001&weight=0.5&cod=0`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const serviceData = await serviceRes.json();
        console.log('Serviceability Response:', JSON.stringify(serviceData, null, 2));

        // 3. Fetch Pickup Locations
        console.log('3. Fetching Pickup Locations...');
        const pickupRes = await fetch(`${BASE_URL}/settings/company/pickup`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const pickupData = await pickupRes.json();
        console.log('Pickup Locations:', JSON.stringify(pickupData, null, 2));

        if (pickupData.data && pickupData.data.shipping_address && pickupData.data.shipping_address.length > 0) {
            const validPickupLocation = pickupData.data.shipping_address[0].pickup_location;
            console.log(`Using Pickup Location: "${validPickupLocation}"`);

            // 4. Create Dummy Order (Retry with valid pickup location)
            console.log('4. Creating Test Order...');
            // ... (rest of order creation logic using validPickupLocation)

            const orderId = `TEST-${Date.now()}`;
            const orderPayload = {
                order_id: orderId,
                order_date: new Date().toISOString().split('T')[0] + ' 10:00',
                pickup_location: validPickupLocation,
                billing_customer_name: 'Test Customer',
                billing_last_name: 'User',
                billing_address: 'Test Address Line 1',
                billing_city: 'New Delhi',
                billing_pincode: '110001',
                billing_state: 'Delhi',
                billing_country: 'India',
                billing_email: 'test@example.com',
                billing_phone: '9999999999',
                shipping_is_billing: true,
                order_items: [
                    {
                        name: 'Test Product',
                        sku: 'TEST-SKU-001',
                        units: 1,
                        selling_price: 100,
                        discount: 0,
                        tax: 0,
                        hsn: 0
                    }
                ],
                payment_method: 'Prepaid',
                sub_total: 100,
                length: 10,
                breadth: 10,
                height: 10,
                weight: 0.5
            };

            const orderRes = await fetch(`${BASE_URL}/orders/create/adhoc`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderPayload)
            });

            const orderData = await orderRes.json();
            console.log('Order Creation Response:', JSON.stringify(orderData, null, 2));
        } else {
            console.error('No Pickup Locations Found! Please add one in Shiprocket Dashboard.');
        }

    } catch (error) {
        console.error('Test Failed:', error);
    }
}

testShiprocket();
